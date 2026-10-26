import {WALMART_ID,storeCashiers} from './supercentre';
import {buildingById} from './building-catalog';
import {buildingLayout} from './building-layouts';
import {ROLES} from './life';
import type {GameState,Command} from './engine';
import {advanceLife,lifeAction,homePlace,requireNeeds} from './life';
import {entrance,placeById,distance,pointAlong,pathLength,isBankPlace,type Point} from './world';
import {isOpen} from './calendar';
import ECONOMY from '../../config/economy.json';
import {homeLayout,cafeLayout,bankLayout,homeTier,LAYOUT_VERSION,type HomeTier,type HomeLayout} from './interior-layouts';
export * from './interior-layouts';
export type InteriorState={kind?:'home'|'cafe'|'bank'|'building';layoutVersion?:number;place:string;tier:HomeTier;position:Point;order?:{item:string;paid:boolean};seat?:string;queue?:number;ticket?:{n:number;serving:number;called:boolean};movement?:{path:Point[];startedAt:number;seconds:number;object?:string;mode?:string};pose?:{object:string;action:string;until:number}};
export const interiorLayout=(i:InteriorState):HomeLayout=>i.kind==='building'?layoutForBuilding(i.place):i.kind==='cafe'?cafeLayout():i.kind==='bank'?bankLayout():homeLayout(i.tier);
export const isPublicInterior=(i?:InteriorState)=>i?.kind==='cafe'||i?.kind==='bank'||i?.kind==='building';
export const CAFE_MENU=[{id:'meal',name:'Breakfast sandwich & coffee',price:ECONOMY.prices.cafeMeal,hunger:55,energy:8},{id:'toast',name:'Toast & tea',price:Math.round(ECONOMY.prices.cafeMeal*.65),hunger:35,energy:5},{id:'coffee',name:'House coffee',price:Math.round(ECONOMY.prices.cafeMeal*.3),hunger:5,energy:12}];
export function migrateInterior(s:GameState){const i=s.interior;if(!i)return;if(i.kind==='building'){if(!buildingById(i.place)){delete s.interior;return;}}else if(i.kind==='cafe'){if(placeById(i.place)?.kind!=='cafe'){delete s.interior;return;}}else if(i.kind==='bank'){if(!isBankPlace(i.place)){delete s.interior;return;}}else if(i.place!==homePlace(s)){delete s.interior;return;}const tier=homeTier(s.life.housing.type);if(i.layoutVersion!==LAYOUT_VERSION||!isPublicInterior(i)&&i.tier!==tier){s.interior={kind:i.kind||'home',layoutVersion:LAYOUT_VERSION,place:i.place,tier,position:interiorLayout({...i,tier}).door,...(i.order?{order:i.order}:{})};}}
export function insideWalkable(p:Point,l:HomeLayout,r=.27){return p.every(Number.isFinite)&&Math.abs(p[0])<l.width/2-r&&Math.abs(p[1])<l.depth/2-r&&![...l.objects,...l.walls].some(o=>Math.abs(p[0]-o.x)<o.width/2+r&&Math.abs(p[1]-o.z)<o.depth/2+r)}
export function interiorSegment(a:Point,b:Point,l:HomeLayout){const n=Math.max(1,Math.ceil(distance(a,b)/.12));for(let i=0;i<=n;i++)if(!insideWalkable([a[0]+(b[0]-a[0])*i/n,a[1]+(b[1]-a[1])*i/n],l))return false;return true}
/** Small half-unit grid: walls and furniture share the same footprints as the renderer. */
export function interiorPath(from:Point,to:Point,l:HomeLayout):Point[]{
 if(!insideWalkable(to,l))throw new Error('Choose clear floor space, away from walls and furniture.');
 if(interiorSegment(from,to,l))return [from,to];
 const key=(p:Point)=>p.join(','),nodes:Point[]=[];
 for(let x=-l.width/2+.5;x<l.width/2;x+=.5)for(let z=-l.depth/2+.5;z<l.depth/2;z+=.5){const p:Point=[x,z];if(insideWalkable(p,l))nodes.push(p)}
 const start=nodes.filter(p=>distance(p,from)<1&&interiorSegment(from,p,l)).sort((a,b)=>distance(a,from)-distance(b,from))[0],end=nodes.filter(p=>distance(p,to)<1&&interiorSegment(p,to,l)).sort((a,b)=>distance(a,to)-distance(b,to))[0];
 if(!start||!end)throw new Error('No clear route to that spot.');
 const allowed=new Set(nodes.map(key)),parents=new Map<string,Point|null>([[key(start),null]]),queue=[start];
 for(let i=0;i<queue.length;i++){const p=queue[i];if(key(p)===key(end))break;for(const [dx,dz]of [[.5,0],[-.5,0],[0,.5],[0,-.5]]){const q:Point=[p[0]+dx,p[1]+dz],k=key(q);if(allowed.has(k)&&!parents.has(k)&&interiorSegment(p,q,l)){parents.set(k,p);queue.push(q)}}}
 if(!parents.has(key(end)))throw new Error('No clear route to that spot.');
 const path:Point[]=[to];let p:Point|null=end;while(p){path.unshift(p);p=parents.get(key(p))!}path.unshift(from);
 const simplified:Point[]=[from];let i=0;while(i<path.length-1){let next=i+1;while(next+1<path.length&&interiorSegment(path[i],path[next+1],l))next++;simplified.push(path[next]);i=next}return simplified;
}
export function interiorPosition(i:InteriorState,now=Date.now()):Point{return i.movement?pointAlong(i.movement.path,Math.min(1,Math.max(0,(now-i.movement.startedAt)/(i.movement.seconds*1000)))):i.position}
export function enterHome(s:GameState){if(s.journey||distance(s.position,entrance(placeById(homePlace(s))!))>.65)throw new Error('Walk to your home door first.');delete s.life.restSeat;s.interior={kind:'home',layoutVersion:LAYOUT_VERSION,place:homePlace(s),tier:homeTier(s.life.housing.type),position:homeLayout(homeTier(s.life.housing.type)).door};}
export function assertHomeObject(s:GameState,action:string){
 if(s.interior?.kind==='building'&&action==='resume'){const o=interiorLayout(s.interior).objects.find(o=>o.action==='resume');if(!s.interior.movement&&o?.use&&distance(s.interior.position,o.use)<=.65)return;throw new Error('Walk to the library desk first.');}
 if(!s.interior||s.interior.kind==='cafe'||s.interior.place!==homePlace(s))throw new Error('Enter your home and use its furniture first.');
 if(s.interior.movement)throw new Error('Finish walking to the furniture first.');
 const o=homeLayout(s.interior.tier).objects.find(o=>o.action===action);if(!o?.use||distance(s.interior.position,o.use)>.65)throw new Error('Walk to the '+(o?.kind||'furniture')+' first.');
}
function executeObject(s:GameState,id:string,mode:string|undefined,now:number){
 if(id==='exit'){const door=interiorLayout(s.interior!).door;if(distance(s.interior!.position,door)>.65)throw new Error('Walk to the door first.');const refund=s.interior!.order?.paid?(CAFE_MENU.find(m=>m.id===s.interior!.order!.item)?.price||0):0;s.cash+=refund;const b=buildingById(s.interior!.place),p=placeById(s.interior!.place);if(!b&&!p)throw new Error('This entrance is unavailable.');s.position=b?.landing||entrance(p!);s.location=p?.id||'';s.district=b?.district||p!.district;delete s.interior;s.doorExitUntil=now+8000;return 'Back on the street at the same door.'+(refund?' Your uneaten order was refunded.':'');}
 const i=s.interior!,o=interiorLayout(i).objects.find(o=>o.id===id);if(!o?.action)throw new Error('Choose an interactive object.');
 if(i.kind==='building')return buildingObject(s,id,now);
 if(i.kind==='bank')return bankObject(s,id,now);
 if(i.kind==='cafe')return cafeObject(s,id,mode,now);
 assertHomeObject(s,o.action);
 if(o.kind==='desk'&&mode==='approach')return 'At your laptop. Choose a résumé or job action.';
 const command:Command=o.kind==='desk'?mode?.startsWith('apply:')?{type:'apply',id:mode.slice(6)}:{type:'resume',id:mode?.startsWith('tailor:')?mode.slice(7):undefined}:{type:'home',id:o.action};
 requireNeeds(s,command);const message=lifeAction(s,command)!;i.pose={object:o.id,action:o.action,until:now+8000};return message;
}
export function interiorCommand(s:GameState,c:Command,now:number):string|null{
 const i=s.interior;
 if(c.type==='enter_building'){if(i)throw new Error('Exit this interior first.');const b=buildingById(c.id||'');if(!b||s.journey||distance(s.position,b.landing)>.65)throw new Error('Walk to the building door first.');if(b.id===homePlace(s)){enterHome(s);return 'Welcome home.';}if(b.style==='cafe'||b.style==='bank')return interiorCommand(s,{type:b.style==='cafe'?'enter_cafe':'enter_bank',id:b.id},now);const p=placeById(b.id);if(p&&!isOpen(p,s.minutes))throw new Error('This building is closed. Check its opening hours.');delete s.life.restSeat;s.location=b.id;s.interior={kind:'building',layoutVersion:LAYOUT_VERSION,place:b.id,tier:'room',position:layoutForBuilding(b.id).door};return 'Welcome to '+b.name+'. Tap furniture to use it; the door returns to this address.';}
 if(c.type==='enter_cafe'){if(i)throw new Error('Exit this interior first.');const p=placeById(c.id||s.location);if(!p||p.kind!=='cafe'||s.journey||distance(s.position,entrance(p))>3)throw new Error('Walk to the café door first.');if(!isOpen(p,s.minutes))throw new Error('The café is closed. Opening hours are 7:00–20:00.');delete s.life.restSeat;s.location=p.id;s.interior={kind:'cafe',layoutVersion:LAYOUT_VERSION,place:p.id,tier:'room',position:cafeLayout().door,queue:s.minutes%1440<600||s.minutes%1440>=720&&s.minutes%1440<840?2:0};return 'Welcome in. Order at the counter, pay at the till, then choose a seat.';}
 if(c.type==='enter_bank'){if(i)throw new Error('Exit this interior first.');const p=placeById(c.id||'bank');if(!p||!isBankPlace(p.id)||s.journey||distance(s.position,entrance(p))>3)throw new Error('Walk to the bank door first.');if(!isOpen(p,s.minutes))throw new Error('The bank is closed. Open weekdays, 9 am–5 pm.');delete s.life.restSeat;s.location=p.id;s.interior={kind:'bank',layoutVersion:LAYOUT_VERSION,place:p.id,tier:'room',position:bankLayout().door};return 'Welcome to your credit union. Take a number, then see a teller or advisor.';}
 if(c.type==='enter_home'){if(i)return 'You are already inside.';enterHome(s);return 'Welcome home. Tap furniture to walk over and use it.';}
 if(!i){if(c.type.startsWith('interior_')||c.type==='exit_home')throw new Error('Enter your home first.');return null}
 if(c.type==='bank'&&c.origin==='phone')return null;// phone banking works from anywhere, including indoors
 if(!isPublicInterior(i)&&i.place!==homePlace(s)){delete s.interior;return 'Your housing changed. You are back outside.';}
 if(c.type==='interior_arrive'){
  const m=i.movement;if(!m)throw new Error('There is no indoor walk to finish.');if(now<m.startedAt+m.seconds*1000)throw new Error('You are still walking to the object.');
  i.position=m.path[m.path.length-1];delete i.movement;advanceLife(s,Math.max(1,Math.ceil(pathLength(m.path)/10)));
  if(m.object){try{return executeObject(s,m.object,m.mode,now)}catch(e){return 'Arrived. '+(e instanceof Error?e.message:'Try this object again.')}}return 'Walk complete.';
 }
 if(c.type==='interior_cancel'){if(!i.movement)return 'Already standing still.';const travelled=pathLength(i.movement.path)*Math.min(1,Math.max(0,(now-i.movement.startedAt)/(i.movement.seconds*1000)));i.position=interiorPosition(i,now);delete i.movement;if(travelled>.05)advanceLife(s,Math.max(1,Math.ceil(travelled/10)));return 'Stopped inside.';}
 if(['interior_walk','interior_use','exit_home','home','bathroom','rest'].includes(c.type)){
  if(i.movement)throw new Error('Finish walking or stop before choosing another object.');
  const l=interiorLayout(i),id=c.type==='exit_home'?'exit':c.type==='home'?l.objects.find(o=>o.action===c.id)?.id:c.type==='bathroom'?'toilet':c.type==='rest'?(i.kind==='cafe'?'seat-a':'sofa'):c.type==='interior_use'?c.id:undefined;
  const target=id==='exit'?l.door:id?l.objects.find(o=>o.id===id)?.use:c.point;if(!target)throw new Error('Choose an object or clear floor space.');
  delete i.pose;delete i.seat;
  if(id&&distance(i.position,target)<.15)return executeObject(s,id,c.type==='rest'&&i.kind==='cafe'?'rest':c.mode,now);
  const path=interiorPath(i.position,target,interiorNavigation(i,s.minutes));i.movement={path,startedAt:now,seconds:Math.max(.2,pathLength(path)/(s.needs.energy<20?1.4:2.8)),object:id,mode:c.type==='rest'&&i.kind==='cafe'?'rest':c.mode};return id==='exit'?'Walking to the exit.':id?'Walking to the '+l.objects.find(o=>o.id===id)?.kind+'.':'Walking inside.';
 }
 if(i.kind==='building'){if(['appearance','wait'].includes(c.type))return null;throw new Error('Use the objects inside this building, or walk to its exit.');}
 if(i.kind==='bank'){if(['bank','card_borrow','card_pay','appearance','wait'].includes(c.type))return null;throw new Error('Use the teller or ATM, or exit the bank.');}
 if(i.kind==='cafe'){if(['bathroom','activity','work'].includes(c.type))throw new Error('Use the café counter, seat or bathroom object.');if(!['appearance','wait'].includes(c.type))throw new Error('Exit the café before doing that outside.');}
 if(i.movement&&!['appearance'].includes(c.type))throw new Error('Finish walking inside first.');
 if(!['resume','apply','job','accept_job','appearance','wait','event','family_help'].includes(c.type))throw new Error('Exit your home before doing that outside.');
 if(['resume','apply','job'].includes(c.type))assertHomeObject(s,'resume');
 return null;
}

function bankObject(s:GameState,id:string,now:number){const i=s.interior!,p=placeById(i.place)!;if(id==='toilet'){advanceLife(s,5);s.needs.bladder=100;i.pose={object:id,action:'bathroom',until:now+8000};return 'Bathroom break complete.';}if(!isOpen(p,s.minutes))throw new Error('The branch is closed. You can still exit to the street.');
 if(id==='ticket'){if(i.ticket?.called)return 'You hold ticket #'+i.ticket.n+' — now serving #'+i.ticket.serving+'. See a teller or advisor.';const hour=s.minutes%1440/60,wait=hour>=11&&hour<14?8:hour>=16&&hour<18?6:3,n=(Math.floor(s.minutes/3)%60)+12;advanceLife(s,wait);i.ticket={n,serving:n,called:true};i.pose={object:id,action:'talk',until:now+5000};return 'Ticket #'+n+'. You waited about '+wait+' minutes; now serving #'+n+'. See a teller or advisor.';}
 if(id==='teller'||id==='advisor'){if(!i.ticket?.called)throw new Error('Take a number at the ticket machine and wait to be called.');i.pose={object:id,action:'talk',until:now+8000};return id==='advisor'?'With an advisor. Open your banking to arrange a loan, line of credit or GIC.':'At the teller. Open your banking to deposit, move money or manage your accounts.';}
 i.pose={object:id,action:id==='atm'?'coffee':'talk',until:now+8000};return 'At the ATM. Open your banking to withdraw or deposit cash — no number needed.';}
function cafeObject(s:GameState,id:string,mode:string|undefined,now:number){
 const i=s.interior!,o=cafeLayout().objects.find(o=>o.id===id)!;if(i.movement||!o.use||distance(i.position,o.use)>.65)throw new Error('Walk to the café object first.');
 if(id==='toilet'){advanceLife(s,5);s.needs.bladder=100;i.pose={object:id,action:'bathroom',until:now+8000};return 'Bathroom break complete.';}
 if(id.startsWith('seat-')){
  i.seat=id;if(mode==='eat'){if(!i.order?.paid)throw new Error('Order and pay at the till before eating.');const meal=CAFE_MENU.find(m=>m.id===i.order!.item)!;delete i.order;advanceLife(s,20);s.needs.hunger=Math.min(100,s.needs.hunger+meal.hunger);s.needs.energy=Math.min(100,s.needs.energy+meal.energy);s.needs.fun=Math.min(100,s.needs.fun+8);i.pose={object:id,action:'eat',until:now+8000};return meal.name+' finished. Food and energy restored.';}
  if(mode==='rest'){advanceLife(s,30);s.needs.energy=Math.min(100,s.needs.energy+25);}
  i.pose={object:id,action:'sit',until:now+86400000};return i.order?.paid?'Seated. Tap Eat on your table.':'Seated. Order at the counter when you are ready.';
 }
 if(id==='register'&&mode==='cancel'){if(i.order?.paid)throw new Error('This order has already been paid.');delete i.order;return 'Unpaid order cancelled.';}
 const p=placeById(i.place)!;if(!isOpen(p,s.minutes,5))throw new Error('The counter is closed. You can finish your meal or leave.');
 if(id==='counter'){
  if(mode==='approach'||!mode)return 'At the menu board. Choose your order.';
  if(i.order)throw new Error(i.order.paid?'Finish your current order first.':'Pay or cancel your current order at the till.');
  const meal=CAFE_MENU.find(m=>m.id===mode);if(!meal)throw new Error('Choose an item from the menu board.');
  if(s.needs.bladder<15)throw new Error('Use the café bathroom before ordering.');
  const wait=(i.queue||0)*2;if(!isOpen(p,s.minutes,wait+5))throw new Error('The kitchen is closing. Return tomorrow.');advanceLife(s,wait+2);i.queue=0;i.order={item:meal.id,paid:false};i.pose={object:id,action:'talk',until:now+5000};return meal.name+' ordered. Pay at the till.';
 }
 if(id==='register'){
  if(!i.order)throw new Error('Choose an order at the counter first.');if(i.order.paid)throw new Error('Already paid. Choose a seat.');const meal=CAFE_MENU.find(m=>m.id===i.order!.item)!;if(s.cash<meal.price)throw new Error('Not enough money for this order. Cancel it at the till or choose a cheaper item.');s.cash-=meal.price;advanceLife(s,2);i.order.paid=true;i.pose={object:id,action:'coffee',until:now+5000};return 'Paid $'+(meal.price/100).toFixed(2)+'. Your order is ready. Choose a seat.';
 }
 if(id==='worktop'){if(s.job!=='barista'||i.place!=='queen')throw new Error('This station is for the scheduled barista at Queen West Coffee.');const result=lifeAction(s,{type:'work'});i.pose={object:id,action:'cook',until:now+8000};return result!;}
 throw new Error('Choose a café object.');
}

export function sameInterior(a:GameState,b:GameState){if(!a.interior||!b.interior)return !a.interior&&!b.interior;if(a.interior.place!==b.interior.place||(a.interior.kind||'home')!==(b.interior.kind||'home'))return false;return isPublicInterior(a.interior)||!!a.social?.householdId&&a.social.householdId===b.social?.householdId;}

/** Staff and queued customers reserve clear floor footprints as well as visible bodies. */
export function interiorNavigation(i:InteriorState,minutes:number):HomeLayout{const l=interiorLayout(i),hour=minutes%1440/60;let people:Point[]=[];if(i.kind==='cafe'&&(hour>=7&&hour<20||!!i.order))people=[[-3,-6.65],[3.4,-6.65],...Array.from({length:i.queue||0},(_,n)=>[-7.7,-2.5+n*1.4] as Point)];else if(i.kind==='bank')people=[[-2,-6.4],[7.3,2]];else if(i.place===WALMART_ID)people=storeCashiers();else if(i.kind==='building'&&buildingById(i.place)?.style!=='residence')people=[[-4,-6.9]];else if(!isPublicInterior(i)&&i.tier==='room'&&hour>=7&&hour<23)people=[[2.8,-6]];return {...l,walls:[...l.walls,...people.map(([x,z])=>({x,z,width:.7,depth:.7}))]};}

export function cafeStatus(i:InteriorState,now=Date.now()){
 if(i.movement)return 'Walking to '+(i.movement.object==='register'?'the till':i.movement.object||'your spot')+'…';
 if(i.pose?.action==='eat'&&i.pose.until>now)return 'Seated · Enjoying your order';
 if(i.seat)return i.order?.paid?'Seated · Ready to eat':i.order?'Seated · Order needs payment':'Seated · Relaxing';
 if(i.order)return i.order.paid?'Paid · Choose a seat':'Ordered · Pay at the till';
 return 'Order at the counter → pay → sit → eat';
}

export function layoutForBuilding(id:string):HomeLayout{
 const b=buildingById(id);if(!b)throw new Error('Unknown building.');
 const tier=id.startsWith('listing-')?id.slice(8):undefined;
 return buildingLayout({style:b.style,format:id===WALMART_ID?'supercentre':undefined,seed:b.seed,tier,extras:ROLES.some(r=>r.place===id)&&!['cafe','office','warehouse'].includes(b.style)?[{id:'workplace',kind:'desk',x:8,z:-1,width:2,depth:1.2,use:[8,.8],label:'Start scheduled shift',action:'work'}]:undefined});
}
function buildingObject(s:GameState,id:string,now:number){
 const i=s.interior!,b=buildingById(i.place)!,o=interiorLayout(i).objects.find(o=>o.id===id)!;
 if(i.movement||!o.use||distance(i.position,o.use)>.65)throw new Error('Walk to this object first.');
 const pose=(action:string)=>{i.pose={object:id,action,until:now+8000};};
 if(o.action==='bathroom'){advanceLife(s,5);s.needs.bladder=100;pose('bathroom');return 'Bathroom break complete.';}
 if(o.action==='relax'||o.action==='sit'){advanceLife(s,30);s.needs.energy=Math.min(100,s.needs.energy+25);i.seat=id;pose('sit');return 'Seated · Rested for 30 minutes.';}
 requireNeeds(s,{type:'activity'});
 if(b.style==='residence'){
  if(o.action==='shower'){advanceLife(s,15);s.needs.hygiene=100;pose('shower');return 'Freshened up.';}
  // Visiting a home does not grant ownership or access to someone else’s pantry.
  if(b.id.startsWith('listing-')){const result=lifeAction(s,{type:'view_home',id:b.id.slice(8)});pose('talk');return result!;}
  pose('talk');return 'Visiting this residence. Your own home has your bed, pantry and saved housing tier.';
 }
 if(o.action==='ticket'){advanceLife(s,5);i.ticket={n:1,serving:1,called:true};pose('talk');return 'Your number is called. Walk to the service desk.';}
 let command:Command|undefined;
 if(o.action==='work'){if(ROLES.find(r=>r.id===s.job)?.place!==b.id)throw new Error('This workspace is for staff assigned to this location.');command={type:'work'};}
 if(o.action==='resume')command={type:'resume'};
 if(o.action==='study'&&placeById(b.id)?.kind==='library')command={type:'activity'};
 if(o.action==='groceries'&&placeById(b.id)?.kind==='market')command={type:'groceries'};
 if(o.action==='service'||o.action==='reception'){
  const document=({servicecanada:'sin',health:'health',phone:'phone'} as Record<string,string>)[b.id];
  if(document){if(b.style==='service'&&!i.ticket?.called)throw new Error('Take a number first, then return to the service desk.');command={type:'document',id:document};}
  const invitation=s.life.applications.find(a=>a.status==='interview'&&ROLES.find(r=>r.id===a.role)?.place===b.id);if(invitation)command={type:'interview',id:invitation.role};
 }
 if(command){requireNeeds(s,command);const result=lifeAction(s,command);pose(command.type==='resume'?'resume':'talk');return result||'Done.';}
 advanceLife(s,5);pose(o.action==='read'?'resume':'talk');return o.action==='read'?'Browsed the collection. Use a study table for training.':o.action==='groceries'?'Browse the shelves. Purchases are available at the marked city markets.':o.action==='reception'?'Reception · Visit your assigned workplace for interviews and paid shifts.':'Explored '+b.name+'.';
}
