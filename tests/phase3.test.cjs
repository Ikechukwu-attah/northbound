const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const dest=path.resolve(__dirname,'../work/phase3-test');fs.mkdirSync(dest,{recursive:true});fs.writeFileSync(path.join(dest,'package.json'),'{"type":"commonjs"}');
for(const file of fs.readdirSync(path.resolve(__dirname,'../lib/game')).filter(f=>f.endsWith('.ts')).map(f=>f.slice(0,-3)))fs.writeFileSync(path.join(dest,file+'.js'),ts.transpileModule(fs.readFileSync(path.resolve(__dirname,'../lib/game/'+file+'.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText);
const e=require('../work/phase3-test/engine.js'),w=require('../work/phase3-test/world.js'),a=require('../work/phase3-test/activities.js'),n=require('../work/phase3-test/navigation.js'),p=require('../work/phase3-test/schedules.js'),d=require('../work/phase3-test/district-content.js'),cal=require('../work/phase3-test/calendar.js'),geo=require('../work/phase3-test/geo.js');
const fresh=()=>{const s=e.newGame({name:'Community tester',path:'local'});s.job='';s.cash=50000;return s;};
const at=(s,id)=>({...s,position:w.entrance(w.placeById(id)),location:id,district:w.placeById(id).district});
const ready=s=>{s.needs={energy:100,hunger:100,fun:50,social:50,hygiene:100,bladder:100};s.life.illUntil=0;return s;};
const command=(s,type,id,mode)=>e.applyCommand(s,{type,id,mode},100000,.5).state;
function opening(activity){for(let day=0;day<366;day++)for(let hour=7;hour<20;hour++){const m=day*1440+hour*60;if(!a.activityTiming(activity,m))return m;}throw Error('No valid opening: '+activity.id);}

test('all six districts have eight activity places, twenty activities and at least 25% scheduled',()=>{
 assert.equal(a.ACTIVITIES.length,120);assert.equal(d.COMMUNITY_PLACES.length,18);
 const coordinates=new Set();for(const place of w.PLACES){const key=[place.x,place.z].join();assert.ok(!coordinates.has(key),'unique venue footprint: '+place.id);coordinates.add(key);assert.ok(geo.placeGeo(place.id));}
 for(const district of d.DISTRICT_CONTENT){const list=a.ACTIVITIES.filter(x=>x.district===district.district);assert.equal(new Set(list.map(x=>x.id)).size,20);assert.equal(new Set(list.map(x=>x.place)).size,8);assert.ok(list.filter(x=>x.hours||x.days||x.season).length>=5);for(const x of list){assert.equal(w.placeById(x.place).district,district.district);assert.ok(n.isWalkable(w.entrance(w.placeById(x.place))));}}
});
test('every activity can be completed at a valid time with server-owned cost, time and one-time stamp',()=>{
 for(const activity of a.ACTIVITIES){const s=ready(at(fresh(),activity.place));s.minutes=opening(activity);s.life.nextBills=s.life.nextPay=s.life.housing.nextRent=s.minutes+400*1440;s.life.housing.temporaryUntil=0;s.life.lastEventDay=Math.floor(s.minutes/1440);s.community.stamps=a.ACTIVITIES.filter(x=>x.district===activity.district&&x.id!==activity.id).slice(0,6).map(x=>x.id);const cash=s.cash,start=s.minutes;const next=command(s,'district_activity',activity.id);assert.equal(next.minutes,start+activity.minutes);assert.equal(next.cash,cash-activity.cost);assert.ok(next.community.stamps.includes(activity.id));assert.equal(s.cash,cash,'original unchanged');assert.throws(()=>command(next,'district_activity',activity.id),/today|closing|Rest|Eat|washroom/);}
});
test('remote and forged venue access, unknown IDs and activities during travel are rejected',()=>{
 const activity=a.ACTIVITIES.find(x=>x.id==='toronto:read');const s=fresh();s.location=activity.place;assert.throws(()=>command(s,'district_activity',activity.id),/Walk to/);assert.throws(()=>command(s,'district_activity','forged'),/Choose/);s.journey={kind:'walk'};assert.throws(()=>command(s,'district_activity',activity.id),/journey/);
});
test('seasons, weekdays, closing times, needs, budget and unlocks are enforced',()=>{
 const seasonal=a.ACTIVITIES.find(x=>x.id==='toronto:winter');let s=ready(at(fresh(),seasonal.place));s.minutes=600;assert.match(a.activityBlock(s,seasonal),/winter/);assert.throws(()=>command(s,'district_activity',seasonal.id),/winter/);
 const weekend=a.ACTIVITIES.find(x=>x.id==='toronto:weekend');s=ready(at(fresh(),weekend.place));s.minutes=600;assert.ok(a.activityBlock(s,weekend));
 const read=a.ACTIVITIES.find(x=>x.id==='toronto:read');s=ready(at(fresh(),read.place));s.minutes=19*60+45;assert.throws(()=>command(s,'district_activity',read.id),/closing/);
 const workshop=a.ACTIVITIES.find(x=>x.id==='toronto:workshop');s=ready(at(fresh(),workshop.place));s.minutes=600;assert.throws(()=>command(s,'district_activity',workshop.id),/3 different/);
 s.community.stamps=['toronto:read','toronto:sketch','toronto:photo'];s.cash=0;assert.throws(()=>command(s,'district_activity',workshop.id),/funds/);s.cash=5000;s.needs.energy=10;assert.throws(()=>command(s,'district_activity',workshop.id),/Rest/);s.needs.energy=100;s.needs.bladder=0;assert.throws(()=>command(s,'district_activity',workshop.id),/bathroom/);
});
test('returning on another day repeats an activity without duplicating its stamp',()=>{
 let s=ready(at(fresh(),'reference'));s=command(s,'district_activity','toronto:read');s.minutes+=1440;s=ready(s);s=command(s,'district_activity','toronto:read');assert.deepEqual(s.community.stamps,['toronto:read']);assert.equal(s.community.completed['toronto:read'],cal.dateKey(s.minutes));
});
test('three and six distinct stamps unlock only their own district programmes',()=>{
 let s=fresh();for(const key of ['read','browse','stretch','photo','coffee','sketch']){const activity=a.ACTIVITIES.find(x=>x.id==='toronto:'+key);s=ready(at(s,activity.place));s.minutes=600;s=command(s,'district_activity',activity.id);}assert.equal(a.districtStamps(s,'toronto'),6);assert.equal(a.districtStamps(s,'york'),0);s=ready(at(s,'to-studio'));s.minutes=14*60;assert.equal(a.activityBlock(s,a.ACTIVITIES.find(x=>x.id==='toronto:host')),null);
});
test('all district errands require physical pickup and delivery and pay only once',()=>{
 for(const district of d.DISTRICT_CONTENT){const errand=a.errandFor(district.district);let s=ready(fresh());s.minutes=600;assert.throws(()=>command(s,'community_errand',district.district,'accept'),/Walk to/);s=at(s,errand.from);const cash=s.cash;s=command(s,'community_errand',district.district,'accept');assert.equal(s.cash,cash);assert.ok(s.community.errand);assert.throws(()=>command(s,'community_errand',district.district,'deliver'),/Walk to/);s=at(s,errand.to);s=command(s,'community_errand',district.district,'deliver');assert.equal(s.cash,cash+errand.reward);assert.equal(s.earned,errand.reward);assert.equal(s.community.errand,null);assert.equal(s.life.ledger[0].amount,errand.reward);assert.throws(()=>command(s,'community_errand',district.district,'deliver'),/Collect/);assert.throws(()=>command(at(s,errand.from),'community_errand',district.district,'accept'),/already received/);}
});
test('expired errands can be released with no payout; active bags survive save migration',()=>{
 let s=ready(at(fresh(),'to-exchange'));s.minutes=600;s=command(s,'community_errand','toronto','accept');s=e.migrateState(JSON.parse(JSON.stringify(s)));assert.equal(s.community.errand.district,'toronto');s.minutes=s.community.errand.expires+1;s=ready(at(s,'to-studio'));assert.throws(()=>command(s,'community_errand','toronto','deliver'),/expired/);const cash=s.cash;s=command(s,'community_errand','toronto','abandon');assert.equal(s.cash,cash);assert.equal(s.community.errand,null);
});
test('scheduled NPC world positions and conversations agree across the day and holiday closures',()=>{
 assert.equal(p.NEIGHBOURS.length,9);assert.equal(p.personAt('maya',9*60),'queen');assert.equal(p.personAt('maya',14*60),'to-garden');assert.equal(p.personAt('maya',20*60),null);assert.equal(p.personAt('maya',11*60+45,30),null);
 for(let m=0;m<1440;m+=30){const people=p.peopleAt(m),positions=n.scheduledPositions(m);assert.equal(people.length,positions.length);positions.forEach((point,i)=>{const spot=w.placeById(people[i].place);assert.deepEqual(point,[spot.x+2,spot.z+5.8]);assert.ok(n.isWalkable(point),people[i].id);});}
 const christmas=(Date.UTC(2026,11,25)-Date.UTC(2026,9,14))/60000+15*60;assert.equal(p.personAt('amina',christmas),null);
});
test('conversations require present NPC, unlock topics and grant at most one friendship point per day',()=>{
 let s=ready(at(fresh(),'queen'));s.minutes=9*60;s=command(s,'talk','maya','hello');assert.equal(s.friends.maya,1);s=command(s,'talk','maya','local');assert.equal(s.friends.maya,1);assert.throws(()=>command(s,'talk','maya','hello'),/already talked/);assert.throws(()=>command(s,'talk','maya','story'),/Get to know/);s.minutes=14*60;assert.throws(()=>command(s,'talk','maya','hello'),/Walk to/);s.minutes=20*60;assert.throws(()=>command(s,'talk','maya','hello'),/away/);s.minutes=1440+9*60;s=ready(at(s,'queen'));s=command(s,'talk','maya','hello');assert.equal(s.friends.maya,2);
});
test('Phase 2 saves gain community state without resetting money, skill, appearance or active travel',()=>{
 const old=ready(fresh());delete old.community;old.skill=4;old.cash=78123;const moved=e.applyCommand(old,{type:'walk',id:'queen'},1000,.5).state;delete moved.community;const migrated=e.migrateState(moved);assert.equal(migrated.skill,4);assert.equal(migrated.cash,78123);assert.deepEqual(migrated.life.appearance,old.life.appearance);assert.deepEqual(migrated.journey,moved.journey);assert.deepEqual(migrated.community,a.initialCommunity());assert.deepEqual(e.migrateState(migrated),migrated);
});
