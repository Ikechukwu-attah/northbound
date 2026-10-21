import {sameInterior} from '../game/interiors';
import {migrateState,isNear,journeyPosition,type GameState} from '../game/engine';
import {advanceLife,homePlace,requireNeeds} from '../game/life';
import {isOpen} from '../game/calendar';
import {districtAt,distance,placeById,type Point} from '../game/world';
import {PRESENCE_TTL,type CommunitySnapshot,type SocialCommand,type Peer} from '../game/multiplayer';
import type {HumanAction} from '../game/characters';
type Profile={user_id:string;public_id:string;name:string;online:number;last_seen:number;cx:number;cz:number};
type Save={user_id:string;state:GameState;revision:number};
type Session={id:string;host:string;guest:string|null;kind:string;place:string;status:string;expires_at:number;version:number;payload:string|null};
type Listing={id:string;seller:string;buyer:string|null;place:string;price:number;status:string;version:number};
type Edge={id:string;actor:string;target:string;kind:string;status:string};
export class SocialError extends Error{constructor(message:string,public status=400){super(message)}}
const fail=(message:string):never=>{throw new SocialError(message)};
const point=(s:GameState,now:number):Point=>s.journey?journeyPosition(s.journey,now):s.life.restSeat?.point||s.position;
const uid=()=>crypto.randomUUID();
const pair=(a:string,b:string)=>[a,b].sort().join(':');
export class SharedCity{
 constructor(private db:D1Database,private now=Date.now()){}
 private q(sql:string,...args:unknown[]){return this.db.prepare(sql).bind(...args)}
 private async all<T>(sql:string,...args:unknown[]){return (await this.q(sql,...args).all<T>()).results}
 private async save(id:string):Promise<Save>{const r=await this.q('SELECT * FROM games WHERE user_id=?',id).first<{user_id:string;state:string;revision:number}>();if(!r)throw new SocialError('Create your character first.',404);return {...r,state:migrateState(JSON.parse(r.state))}}
 private async profile(user:string){let p=await this.q('SELECT * FROM mp_profiles WHERE user_id=?',user).first<Profile>();if(!p){const s=await this.save(user);await this.q('INSERT OR IGNORE INTO mp_profiles(user_id,public_id,name) VALUES(?,?,?)',user,uid(),s.state.name).run();p=await this.q('SELECT * FROM mp_profiles WHERE user_id=?',user).first<Profile>()}return p!}
 private async person(publicId:string){return await this.q('SELECT * FROM mp_profiles WHERE public_id=?',publicId).first<Profile>()||fail('That player is no longer available.')}
 private async blocked(a:string,b:string){return !!await this.q("SELECT id FROM mp_edges WHERE kind='block' AND ((actor=? AND target=?) OR (actor=? AND target=?))",a,b,b,a).first()}
 private async friend(a:string,b:string){return !!await this.q("SELECT id FROM mp_edges WHERE id=? AND status='accepted'",'friend:'+pair(a,b)).first()}
 private ready(s:GameState,place:string){if(s.interior||s.transit)fail('Exit your home to meet at the street address.');if(!isNear(s,place))fail('Both players must arrive at the meeting address first.');try{requireNeeds(s,{type:'shared_activity'});}catch(e){fail(e instanceof Error?e.message:'Take care of your needs first.');}if(s.life.restSeat)fail('Finish resting before joining an activity.')}
 // The receipt is inserted only if EVERY save and resource version still matches.
 // D1 batch executes these statements as one transaction; all writes share its guard.
 private async commit(kind:string,saves:Save[],guard:{sql:string;args:unknown[]},writes:{sql:string;args:unknown[]}[]){
  const id=uid(),clauses=saves.map(()=> 'EXISTS(SELECT 1 FROM games WHERE user_id=? AND revision=?)');
  const args:unknown[]=saves.flatMap(s=>[s.user_id,s.revision]);clauses.push(guard.sql);args.push(...guard.args);
  const gate='EXISTS(SELECT 1 FROM mp_receipts WHERE id=?)';
  const statements=[this.q(`INSERT INTO mp_receipts(id,kind,created_at) SELECT ?,?,? WHERE ${clauses.join(' AND ')}`,id,kind,this.now,...args),...saves.map(s=>this.q(`UPDATE games SET state=?,revision=revision+1,updated_at=? WHERE user_id=? AND ${gate}`,JSON.stringify(s.state),new Date(this.now).toISOString(),s.user_id,id)),...writes.map(w=>this.q(w.sql.replaceAll('$gate',gate),...w.args,id))];
  const result=await this.db.batch(statements);if(!result[0].meta.changes)throw new SocialError('Another action saved first. Your latest progress is restored; try again.',409);
 }
 async snapshot(user:string,heartbeat=true):Promise<CommunitySnapshot>{
  const self=await this.profile(user),own=await this.save(user),pos=point(own.state,this.now);
  if(heartbeat&&self.online)await this.q('UPDATE mp_profiles SET last_seen=?,name=?,cx=?,cz=? WHERE user_id=? AND online=1',this.now,own.state.name,Math.floor(pos[0]/24),Math.floor(pos[1]/24),user).run();
  const edges=await this.all<Edge>('SELECT * FROM mp_edges WHERE actor=? OR target=?',self.public_id,self.public_id);
  const blocked=new Set(edges.filter(e=>e.kind==='block').map(e=>e.actor===self.public_id?e.target:e.actor));
  const peers:Peer[]=[];
  if(self.online){const rows=await this.all<Profile&{state:string}>(`SELECT p.*,g.state FROM mp_profiles p JOIN games g ON g.user_id=p.user_id WHERE p.online=1 AND p.last_seen>? AND p.public_id<>? AND p.cx BETWEEN ? AND ? AND p.cz BETWEEN ? AND ? ORDER BY p.last_seen DESC LIMIT 40`,this.now-PRESENCE_TTL,self.public_id,Math.floor(pos[0]/24)-3,Math.floor(pos[0]/24)+3,Math.floor(pos[1]/24)-3,Math.floor(pos[1]/24)+3);
   for(const row of rows){if(blocked.has(row.public_id))continue;const s=migrateState(JSON.parse(row.state)),p=point(s,this.now);if(own.state.transit||s.transit||!sameInterior(own.state,s))continue;if(distance(p,pos)>85||s.journey&&['transit','fast'].includes(s.journey.kind))continue;peers.push({...(s.interior?{interior:s.interior}:{}),id:row.public_id,name:s.name,position:p,appearance:s.life.appearance,action:s.journey?s.journey.kind==='bike'?'bike':'walk':s.life.restSeat?'sit':s.life.animationUntil>this.now?s.life.animation as HumanAction:'idle',journey:s.journey,minutes:s.minutes,lastSeen:row.last_seen});}peers.sort((a,b)=>distance(a.position,pos)-distance(b.position,pos));}
  const contacts=await this.all<Profile&{status:string;actor:string;kind:string}>(`SELECT p.*,e.status,e.actor,e.kind FROM mp_edges e JOIN mp_profiles p ON p.public_id=CASE WHEN e.actor=? THEN e.target ELSE e.actor END WHERE (e.actor=? OR e.target=?) AND (e.kind='friend' OR (e.kind='block' AND e.actor=?)) LIMIT 100`,self.public_id,self.public_id,self.public_id,self.public_id);
  const people=contacts.map(p=>({id:p.public_id,name:p.name,online:!!p.online&&p.last_seen>this.now-PRESENCE_TTL,status:p.status,incoming:p.actor!==self.public_id,kind:p.kind}));
  const messages=self.online?await this.all<{id:number;author:string;name:string;body:string;created_at:number}>(`SELECT m.*,p.name FROM mp_messages m JOIN mp_profiles p ON p.public_id=m.author WHERE m.district=? AND m.hidden=0 AND m.created_at>? ORDER BY m.id DESC LIMIT 60`,districtAt(pos),this.now-86400000):[];
  const sessions=await this.all<Session&{host_name:string;guest_name:string}>(`SELECT s.*,h.name AS host_name,g.name AS guest_name FROM mp_sessions s JOIN mp_profiles h ON h.public_id=s.host LEFT JOIN mp_profiles g ON g.public_id=s.guest WHERE (s.host=? OR s.guest=? OR (s.kind='meetup' AND s.status='open' AND s.expires_at>?)) AND (s.status='active' OR s.expires_at>?) ORDER BY s.created_at DESC LIMIT 60`,self.public_id,self.public_id,this.now,this.now);
  const listings=await this.all<Listing&{seller_name:string}>(`SELECT l.*,p.name AS seller_name FROM mp_listings l JOIN mp_profiles p ON p.public_id=l.seller WHERE l.status='open' ORDER BY l.created_at DESC LIMIT 100`);
  return {serverTime:this.now,self:{id:self.public_id,online:!!self.online},state:own.state,revision:own.revision,peers:peers.slice(0,12),friends:people.filter(p=>p.kind==='friend'&&!blocked.has(p.id)).map(({kind,...p})=>p),blocked:people.filter(p=>p.kind==='block').map(({kind,status,incoming,...p})=>p),messages:messages.filter(m=>!blocked.has(m.author)).reverse().map(m=>({id:m.id,author:m.author,name:m.name,body:m.body,createdAt:m.created_at})),sessions:sessions.filter(s=>(s.host===self.public_id||s.guest===self.public_id||self.online&&placeById(s.place)?.district===districtAt(pos))&&(!blocked.has(s.host)&&!blocked.has(s.guest||'')||s.status==='active'&&(s.host===self.public_id||s.guest===self.public_id))).map(s=>({id:s.id,host:s.host,guest:s.guest,hostName:s.host_name,guestName:s.guest_name||'',kind:s.kind,place:s.place,status:s.status,expiresAt:s.expires_at,...(s.kind==='housing'?{rent:JSON.parse(s.payload||'{}').rent}: {})})),listings:listings.filter(l=>!blocked.has(l.seller)&&(l.seller===self.public_id||self.online&&placeById(l.place)?.district===districtAt(pos))).map(l=>({id:l.id,seller:l.seller,sellerName:l.seller_name,place:l.place,price:l.price}))};
 }
 async action(user:string,c:SocialCommand){
  const me=await this.profile(user),a=me.public_id;
  if(c.type==='sync')return this.snapshot(user);
  if(c.type==='join'||c.type==='leave'){await this.q('UPDATE mp_profiles SET online=? WHERE user_id=?',c.type==='join'?1:0,user).run();return this.snapshot(user)}
  // Private players may still recover their escrow or leave a shared lease.
  if(!me.online&&!['cancel_listing','leave_home','unblock'].includes(c.type))fail('Join the shared city first.');
  const rate=await this.q('UPDATE mp_profiles SET last_action=? WHERE user_id=? AND last_action<=?',this.now,user,this.now-400).run();if(!rate.meta.changes)throw new SocialError('Please wait a moment before trying again.',429);
  if(['friend','accept','unfriend','block','unblock','report'].includes(c.type)){
   const other=await this.person(String(c.target||'')),b=other.public_id;if(a===b)fail('Choose another player.');
   if(c.type==='block'){await this.db.batch([this.q("INSERT OR IGNORE INTO mp_edges(id,actor,target,kind,status) VALUES(?,?,?,'block','active')",'block:'+a+':'+b,a,b),this.q('DELETE FROM mp_edges WHERE id=?','friend:'+pair(a,b))]);}
   else if(c.type==='unblock')await this.q('DELETE FROM mp_edges WHERE id=?','block:'+a+':'+b).run();
   else if(c.type==='report'){
    if(!['harassment','spam','inappropriate','other'].includes(c.reason||''))fail('Choose a report reason.');
    if(c.messageId&&!await this.q('SELECT id FROM mp_messages WHERE id=? AND author=?',c.messageId,b).first())fail('Choose a message from this player.');
    const reportId=pair(a,b)+':'+(c.messageId||Math.floor(this.now/86400000));
    await this.q('INSERT OR IGNORE INTO mp_reports(id,reporter,target,message_id,reason,created_at) VALUES(?,?,?,?,?,?)',reportId,a,b,c.messageId||null,c.reason,this.now).run();
    if(c.messageId)await this.q('UPDATE mp_messages SET hidden=1 WHERE id=? AND (SELECT COUNT(DISTINCT reporter) FROM mp_reports WHERE message_id=?)>=3',c.messageId,c.messageId).run();
   }else{if(await this.blocked(a,b))fail('This player is unavailable.');const id='friend:'+pair(a,b);
    if(c.type==='friend'){if((await this.all<Edge>("SELECT id FROM mp_edges WHERE kind='friend' AND (actor=? OR target=?)",a,a)).length>=50)fail('Your friends list is full.');await this.q("INSERT OR IGNORE INTO mp_edges(id,actor,target,kind,status) VALUES(?,?,?,'friend','pending')",id,a,b).run();}
    if(c.type==='accept'&&(await this.all<Edge>("SELECT id FROM mp_edges WHERE kind='friend' AND status='accepted' AND (actor=? OR target=?)",a,a)).length>=50)fail('Your friends list is full.');
    if(c.type==='accept')await this.q("UPDATE mp_edges SET status='accepted' WHERE id=? AND target=? AND status='pending'",id,a).run();
    if(c.type==='unfriend')await this.q('DELETE FROM mp_edges WHERE id=?',id).run();
   }
  }else if(c.type==='chat'){
   const body=String(c.body||'').replace(/[\u0000-\u001f\u007f-\u009f]/g,' ').trim();if(!body||body.length>240)fail('Messages must have 1–240 characters.');
   const r=await this.q('UPDATE mp_profiles SET last_chat=? WHERE user_id=? AND last_chat<=?',this.now,user,this.now-3000).run();if(!r.meta.changes)throw new SocialError('Give the conversation a moment (3 seconds).',429);
   const s=await this.save(user);await this.q('INSERT INTO mp_messages(author,district,body,created_at) VALUES(?,?,?,?)',a,districtAt(point(s.state,this.now)),body,this.now).run();
  }else if(['host_meetup','invite_home'].includes(c.type)){
   const own=await this.save(user),s=own.state,kind=c.type==='host_meetup'?'meetup':'housing',place=kind==='housing'?homePlace(s):s.location;this.ready(s,place);
   if(await this.q("SELECT id FROM mp_sessions WHERE host=? AND kind=? AND status IN ('open','ready') AND expires_at>?",a,kind,this.now).first())fail('You already have an invitation open.');
   let guest:string|null=null,payload:string|null=null;
   if(kind==='meetup'){if(!['park','cafe','library'].includes(placeById(place)?.kind||''))fail('Meet at a park, café or library.');if(!isOpen(placeById(place)!,s.minutes,10))fail('Choose a venue that is open for the next 10 game minutes.');}
   else{if(s.social?.householdId||!['apartment','two-bedroom'].includes(s.life.housing.type)||!s.life.housing.rent)fail('Lease an apartment first, and leave any existing shared home.');guest=(await this.person(String(c.target||''))).public_id;if(!await this.friend(a,guest)||await this.blocked(a,guest))fail('Invite an accepted friend.');payload=JSON.stringify({rent:s.life.housing.rent});}
   await this.q("INSERT INTO mp_sessions(id,host,guest,kind,place,status,expires_at,payload,created_at) VALUES(?,?,?,?,?,'open',?,?,?)",uid(),a,guest,kind,place,this.now+600000,payload,this.now).run();
  }else if(['join_meetup','start_meetup','cancel_session','accept_home','leave_home'].includes(c.type)){
   const r=await this.q('SELECT * FROM mp_sessions WHERE id=?',c.id||'').first<Session>();if(!r)fail('Invitation not found.');const session=r!;
   if(c.type==='leave_home'){if(session.kind!=='housing'||session.status!=='active'||![session.host,session.guest].includes(a))fail('Choose your active shared home.');const host=await this.save((await this.person(session.host)).user_id),guest=await this.save((await this.person(session.guest!)).user_id);const old=JSON.parse(session.payload!);for(const [save,key] of [[host,'host'],[guest,'guest']] as const){if(save.state.social?.householdId!==session.id)fail('This lease changed. Reload your save.');const current=save.state.life.housing;save.state.life.housing={...old[key].housing,arrears:current.arrears,viewed:current.viewed,approved:current.approved,nextRent:current.nextRent};save.state.home=old[key].home;save.state.social={...save.state.social,householdId:undefined};delete save.state.interior;}
    await this.commit('leave_home',[host,guest],{sql:"EXISTS(SELECT 1 FROM mp_sessions WHERE id=? AND version=? AND status='active')",args:[session.id,session.version]},[{sql:"UPDATE mp_sessions SET status='closed',version=version+1 WHERE id=? AND $gate",args:[session.id]}]);
   }else{
    if(session.expires_at<=this.now)fail('This invitation expired.');
    if(c.type==='cancel_session'){if(![session.host,session.guest].includes(a)||!['open','ready'].includes(session.status))fail('That invitation cannot be cancelled.');await this.q("UPDATE mp_sessions SET status='cancelled',version=version+1 WHERE id=? AND status IN ('open','ready')",session.id).run();}
    else{
     const hostP=await this.person(session.host);if(await this.blocked(a,session.host)||session.guest&&await this.blocked(a,session.guest))fail('This player is unavailable.');
     if(c.type==='join_meetup'){
      if(session.kind!=='meetup'||session.host===a||session.status!=='open')fail('Choose an open meetup hosted by another player.');const own=await this.save(user);this.ready(own.state,session.place);
      const result=await this.q("UPDATE mp_sessions SET guest=?,status='ready',version=version+1 WHERE id=? AND version=? AND status='open'",a,session.id,session.version).run();if(!result.meta.changes)throw new SocialError('Someone joined first. Choose another meetup.',409);
     }else{
      if(c.type==='start_meetup'&&(session.kind!=='meetup'||session.host!==a||session.status!=='ready'||!session.guest))fail('Wait for a guest to join your meetup.');
      if(c.type==='accept_home'&&(session.kind!=='housing'||session.guest!==a||session.status!=='open'))fail('Only the invited friend can accept this home.');
      const guestP=await this.person(session.guest!);if(await this.blocked(session.host,session.guest!))fail('This player is unavailable.');
      if(!hostP.online||hostP.last_seen<this.now-PRESENCE_TTL||!guestP.online||guestP.last_seen<this.now-PRESENCE_TTL)fail('Both players must be connected.');
      const host=await this.save(hostP.user_id),guest=await this.save(guestP.user_id);for(const s of [host,guest])this.ready(s.state,session.place);
      let payload=session.payload;
      if(c.type==='start_meetup'){
       const today=new Date(this.now).toISOString().slice(0,10);for(const s of [host,guest]){if(s.state.social?.lastMeetDay===today)fail('Each player can complete one shared meetup per real day.');if(!isOpen(placeById(session.place)!,s.state.minutes,10))fail('The venue must be open on both players’ game clocks.');advanceLife(s.state,10);s.state.needs.social=Math.min(100,s.state.needs.social+15);s.state.needs.fun=Math.min(100,s.state.needs.fun+10);s.state.social={...s.state.social,lastMeetDay:today};s.state.log=[{text:'Spent time with a player at '+placeById(session.place)!.name+'.',day:Math.floor(s.state.minutes/1440)+1},...s.state.log].slice(0,50);}
      }else{
       if(host.state.social?.householdId||guest.state.social?.householdId||homePlace(host.state)!==session.place||!['apartment','two-bedroom'].includes(host.state.life.housing.type)||host.state.life.housing.rent!==JSON.parse(session.payload!).rent||!await this.friend(session.host,session.guest!))fail('The home or friendship changed. Ask for a new invitation.');
       payload=JSON.stringify({rent:host.state.life.housing.rent,host:{housing:host.state.life.housing,home:host.state.home},guest:{housing:guest.state.life.housing,home:guest.state.home}});
       const rent=host.state.life.housing.rent;host.state.life.housing={...host.state.life.housing,rent:Math.ceil(rent/2)};guest.state.life.housing={...guest.state.life.housing,type:host.state.life.housing.type,place:session.place,rent:Math.floor(rent/2),temporaryUntil:0};guest.state.home=host.state.home;
       for(const save of [host,guest])save.state.social={...save.state.social,householdId:session.id};
      }
      await this.commit(c.type,[host,guest],{sql:'EXISTS(SELECT 1 FROM mp_sessions WHERE id=? AND version=? AND status=?)',args:[session.id,session.version,session.status]},[{sql:'UPDATE mp_sessions SET status=?,payload=?,version=version+1 WHERE id=? AND $gate',args:[c.type==='start_meetup'?'done':'active',payload,session.id]}]);
     }
    }
   }
  }else if(c.type==='list'){
   const own=await this.save(user),s=own.state;this.ready(s,s.location);if(placeById(s.location)?.kind!=='market')fail('Walk to a market to offer groceries.');if(!Number.isInteger(c.price)||c.price!<100||c.price!>2500)fail('Choose a price from $1 to $25.');if(s.life.groceries<1)fail('You need a grocery portion to sell.');if(await this.q("SELECT id FROM mp_listings WHERE seller=? AND status='open'",a).first())fail('Cancel or sell your current offer first.');s.life.groceries--;
   await this.commit('list',[own],{sql:"NOT EXISTS(SELECT 1 FROM mp_listings WHERE seller=? AND status='open')",args:[a]},[{sql:"INSERT INTO mp_listings(id,seller,place,price,status,created_at) SELECT ?,?,?,?,'open',? WHERE $gate",args:[uid(),a,s.location,c.price,this.now]}]);
  }else if(c.type==='buy'||c.type==='cancel_listing'){
   const listing=await this.q('SELECT * FROM mp_listings WHERE id=?',c.id||'').first<Listing>();if(!listing||listing.status!=='open')fail('This offer is no longer available.');const l=listing!,seller=await this.save((await this.person(l.seller)).user_id),saves=[seller];
   if(c.type==='cancel_listing'){if(l.seller!==a)fail('Only the seller can cancel this offer.');seller.state.life.groceries++;}
   else{if(a===l.seller||await this.blocked(a,l.seller))fail('This offer is unavailable.');const buyer=await this.save(user);this.ready(buyer.state,l.place);if(buyer.state.cash<l.price)fail('You need more money for this purchase.');buyer.state.cash-=l.price;buyer.state.life.groceries++;seller.state.cash+=l.price;saves.push(buyer);for(const save of saves)save.state.life.ledger=[{text:save===seller?'Shared market: grocery sold':'Shared market: grocery bought',amount:save===seller?l.price:-l.price,date:new Date(this.now).toISOString().slice(0,10)},...save.state.life.ledger].slice(0,80);}
   await this.commit(c.type,saves,{sql:"EXISTS(SELECT 1 FROM mp_listings WHERE id=? AND version=? AND status='open')",args:[l.id,l.version]},[{sql:'UPDATE mp_listings SET status=?,buyer=?,version=version+1 WHERE id=? AND $gate',args:[c.type==='buy'?'sold':'cancelled',c.type==='buy'?a:null,l.id]}]);
  }else fail('Choose a valid shared-city action.');
  return this.snapshot(user);
 }
}
