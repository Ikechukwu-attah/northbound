const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const dest=path.resolve(__dirname,'../work/fixpass-test');fs.mkdirSync(dest,{recursive:true});fs.writeFileSync(path.join(dest,'package.json'),'{"type":"commonjs"}');
for(const file of fs.readdirSync(path.resolve(__dirname,'../lib/game')).filter(f=>f.endsWith('.ts')).map(f=>f.slice(0,-3)))fs.writeFileSync(path.join(dest,file+'.js'),ts.transpileModule(fs.readFileSync(path.resolve(__dirname,'../lib/game/'+file+'.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText);
const w=require('../work/fixpass-test/world.js'),n=require('../work/fixpass-test/navigation.js'),e=require('../work/fixpass-test/engine.js'),l=require('../work/fixpass-test/life.js'),t=require('../work/fixpass-test/transit.js'),solar=require('../work/fixpass-test/solar.js'),ui=require('../work/fixpass-test/ui.js');
const fresh=()=>e.newGame({name:'Full-day tester',path:'local'});
const at=(s,id)=>({...s,position:w.entrance(w.placeById(id)),location:id});
const act=(s,type,id,extra={})=>e.applyCommand(s,{type,id,...extra},100000,.5).state;
const finish=s=>e.applyCommand(s,{type:'arrive'},s.journey.startedAt+s.journey.seconds*1000+1,.5).state;
const go=(s,id)=>finish(act(s,'walk',id));

test('all sidewalk centre corridors and passing lanes clear updated buildings, shelters and props',()=>{
 for(let x=-245;x<=355;x+=24)for(let z=-485;z<=-5;z+=24){
  for(const end of [[x+24,z],[x,z+24]]){if(!w.inBounds(end))continue;const route=[[x,z],end];for(let i=0;i<=48;i++){
   const p=w.pointAlong(route,i/48);assert.ok(n.isWalkable(p),`centre blocked at ${p}`);
   for(const way of [route,[...route].reverse()])assert.ok(n.isWalkable(n.lanePoint(way,i/48)),`lane blocked at ${p}`);
  }}
 }
});
test('water, road centres and interiors are excluded from the mesh; only crossing stripes cross roads',()=>{
 for(const p of [[0,3],[12,15],[0,-36],[12,-36],[-36,-36]])assert.equal(n.isWalkable(p),false,String(p));
 assert.equal(n.navSurface([0,-29]),'crossing');assert.equal(n.isWalkable([0,-29]),true);
 for(const p of w.PLACES)assert.ok(n.isWalkable(w.entrance(p)),p.id);
 for(const s of t.STOPS)assert.ok(n.isWalkable(s.point),s.id);
});
test('opposing crowds and a stationary player never overlap over 45 seconds at shoreline and inland',()=>{
 for(const z of [-5,-29,-317]){const a=[[-60,z],[-12,z]],b=[[-12,z],[-60,z]];
  const actors=[a,b].map((path,i)=>({id:String(i),path,progress:0,forward:true,wait:0,position:n.lanePoint(path,0),heading:0,moving:true}));
  for(let frame=0;frame<2700;frame++){n.stepCrowd(actors,1/60,[-36,z]);assert.ok(w.distance(actors[0].position,actors[1].position)>=.68-1e-6);for(const actor of actors){assert.ok(n.isWalkable(actor.position));assert.ok(w.distance(actor.position,[-36,z])>=.68-1e-6);assert.ok(actor.position[1]<0);}}
 }
});
test('player swept movement pushes past a person and never permanently stalls',()=>{
 const path=[[-60,-29],[-12,-29]],block=[-36,-28.64];let current=n.lanePoint(path,0),fraction=0;
 for(let i=0;i<300&&fraction<1;i++){const step=n.advanceWalker(current,path,fraction,.01,[block]);assert.ok(step.fraction>=fraction,'never moves backward');assert.ok(n.isWalkable(step.position),'stays on the walkable mesh');current=step.position;fraction=step.fraction;}
 assert.equal(fraction,1); // a person on the path cannot permanently block the player
});
test('every destination estimate equals saved journey time at rested and exhausted pace',()=>{
 for(const energy of [100,10])for(const target of [...w.PLACES.map(p=>({id:p.id,p:w.entrance(p)})),...t.STOPS.map(p=>({id:'stop:'+p.id,p:p.point}))]){
  const s=at(fresh(),'queen');s.needs.energy=energy;if(w.distance(s.position,target.p)<.1)continue;
  const estimate=e.travelEstimate(s,target.p,target.id);const journey=act(s,'walk',target.id).journey;assert.equal(journey.minutes,estimate.minutes,target.id);assert.equal(estimate.slowed,energy<20);
 }
});
test('Toronto date-based solar times match mid October and handle DST',()=>{
 const oct=solar.solarTimes(1440);assert.ok(Math.abs(oct.sunrise-451)<3);assert.ok(Math.abs(oct.sunset-1113)<3);assert.ok(Math.abs(oct.dusk-1142)<3);
 assert.equal(solar.daylightAt(1440+1200).phase,'Night');assert.ok(solar.daylightAt(1440+1125).light>0&&solar.daylightAt(1440+1125).light<1);
 const minute=(y,m,d)=>(Date.UTC(y,m-1,d)-Date.UTC(2026,9,14))/60000;const before=solar.solarTimes(minute(2026,10,31)),after=solar.solarTimes(minute(2026,11,1));assert.ok(before.sunrise-after.sunrise>55&&before.sunrise-after.sunrise<65);
});
test('critical needs force rest and limit nonessential actions while washrooms remain accessible',()=>{
 let s=at(fresh(),'queen');s.needs.energy=0;for(const type of ['walk','wait','talk','apply'])assert.throws(()=>act(s,type,'home'),/must rest/);s=act(s,'rest');assert.ok(s.needs.energy>=20);
 s.needs.bladder=0;for(const type of ['talk','wait','apply','view_home','groceries'])assert.throws(()=>act(s,type,'room'),/bathroom/);s=act(s,'bathroom');assert.ok(s.needs.bladder>90);
 s.position=t.stopById('sheppard').point;s.location='';assert.ok(l.washroomHere(s));s=act(s,'bathroom');s.position=t.stopById('union').point;assert.equal(l.washroomHere(s),false);
 s=at(s,'stc');s.minutes=600;assert.ok(l.washroomHere(s));
});
test('North York includes Downsview and York University; upper branch stays east of Humber',()=>{
 for(const id of ['downsview','yorku','sheppardwest','finchwest'])assert.equal(w.districtAt(t.stopById(id).point),'north-york');
 for(const id of ['yorku','pioneer','highway407','vaughan'])assert.ok(t.stopById(id).point[0]>-120);
 assert.equal(w.districtAt([-108,-192]),'york');assert.equal(w.districtAt([145,-350]),'north-york');
});
test('old saves reset skills once to their path and retain appearance, funds and paid journey',()=>{
 for(const path of l.PATHS){const s=e.newGame({name:'Returning',path:path.id});s.version=3;s.skill=99;const next=e.migrateState(s);assert.equal(next.skill,path.skill);assert.equal(next.cash,s.cash);assert.deepEqual(next.life.appearance,s.life.appearance);assert.deepEqual(e.migrateState(next),next);}
 const s=act(at(fresh(),'queen'),'walk','home');s.version=3;assert.ok(e.migrateState(s).journey);
});
test('viewings require the listing address and the new lease changes the home destination',()=>{
 let s=at(fresh(),'housing');s.cash=10000000;assert.throws(()=>act(s,'view_home','room'),/18 Palmerston/);s=at(s,'listing-room');s=act(s,'view_home','room');s=act(s,'apply_home','room');s=act(s,'move_home','room');assert.equal(l.homePlace(s),'listing-room');s=act(s,'home','bathroom');assert.ok(s.needs.bladder>90);assert.throws(()=>act(at(s,'home'),'home','sleep'),/Walk to/);
});
for(const width of [1440,390])test(`full 24-hour engine day and safe-area layout at ${width}px (not browser QA)`,()=>{
 let s=fresh();s.minutes=420;const start=s.minutes;
 s=act(s,'home','bathroom');s=act(s,'home','cook');s=go(s,'queen');if(s.minutes<480)s=act(s,'wait',String(480-s.minutes));s=act(s,'work');assert.equal(s.shifts,1);s=act(s,'bathroom');s=act(s,'activity');
 s=go(s,'reference');s=act(s,'bathroom');s=act(s,'activity');s=act(s,'bathroom');s=go(s,'home');s=act(s,'home','cook');s=act(s,'home','relax');s=act(s,'home','bathroom');
 while(s.minutes<start+1440){if(s.needs.energy<35){s=act(s,'home','sleep');continue;}if(s.needs.bladder<30){s=act(s,'home','bathroom');continue;}if(s.needs.hunger<30){s=act(s,'home','cook');continue;}s=act(s,'home','relax');}
 assert.ok(s.minutes>=start+1440);assert.equal(s.journey,null);assert.ok(n.isWalkable(s.position));assert.deepEqual(e.migrateState(JSON.parse(JSON.stringify(s))),s);
 const viewport={width,height:844},safe={top:104,bottom:100,left:12,right:12};const candidates=w.PLACES.map((p,i)=>({id:p.id,x:(i%4)*width/4-40,y:60+Math.floor(i/4)*45,width:Math.min(width-24,220),height:32,priority:i===0?1:0}));const labels=ui.placeLabels(candidates,[],viewport,safe);assert.ok(Object.keys(labels).length);for(const box of Object.values(labels)){assert.ok(box.y>=104&&box.y+box.height<=744);assert.ok(box.x>=12&&box.x+box.width<=width-12);}
 assert.equal(ui.panelToggle('place',true,width<=620,{place:false,status:true}).status,width>620);
});

test('a completed transit cancellation cannot inject a partial position off the navmesh',()=>{let s=fresh();s.position=t.stopById('queenwest').point;s.location='';s=act(s,'transit','nyc');const j=s.journey;const result=e.applyCommand(s,{type:'cancel',progress:.4},j.startedAt+j.seconds*1000+1,.5).state;assert.deepEqual(result.position,t.stopById('nyc').point);assert.ok(n.isWalkable(result.position));});

test('walking follows turns at low frame rates without cutting corners or getting stuck',()=>{
 const routes=[
  [[-60,-29],[-29,-29],[-29,-317]],
  [[-60,-29],[-29,-29],[-29,-5]],
  [[-29,-317],[-29,-29],[-60,-29]],
 ];
 for(const path of routes)for(const increment of [.003,.01,.025]){
  let position=n.lanePoint(path,0),fraction=0;
  for(let frame=0;frame<1000&&fraction<1;frame++){
   const next=n.advanceWalker(position,path,fraction,increment,[]);
   assert.ok(next.fraction>fraction,`stalled at ${position} on ${JSON.stringify(path)} with step ${increment}`);
   assert.ok(n.isWalkable(next.position));position=next.position;fraction=next.fraction;
  }
  assert.equal(fraction,1);
 }
 // A person on the incoming leg must not permanently block a long frame; the player pushes past.
 const path=routes[0],block=n.lanePoint(path,.05);
 const moved=n.advanceWalker(n.lanePoint(path,0),path,0,.5,[block]);
 assert.ok(moved.fraction>0&&n.isWalkable(moved.position));
});
test('an NPC parked anywhere on the route never freezes the player (#4)',()=>{
 const base=fresh();
 for(const to of ['home','reference','waterfront','bluffs','humber']){
  const journey=act(at(base,'queen'),'walk',to).journey;
  for(const frac of [.15,.5,.85]){
   const block=n.lanePoint(journey.path,frac);let position=n.lanePoint(journey.path,0),fraction=0;const inc=.06/(journey.seconds-journey.waitSeconds);
   for(let f=0;f<80000&&fraction<1;f++){const step=n.advanceWalker(position,journey.path,fraction,inc,[block]);position=step.position;fraction=step.fraction;}
   assert.equal(fraction,1,`walk to ${to} blocked by an NPC at ${frac} must still complete`);
  }
 }
});

test('every ordered place pair completes at the renderer frame-time cap',()=>{
 const base=fresh();
 for(const from of w.PLACES)for(const to of w.PLACES){
  if(from.id===to.id)continue;
  const journey=act(at(base,from.id),'walk',to.id).journey;
  let position=n.lanePoint(journey.path,0),fraction=0;
  const increment=.06/(journey.seconds-journey.waitSeconds);
  for(let frame=0;frame<50000&&fraction<1;frame++){
   const next=n.advanceWalker(position,journey.path,fraction,increment,[]);
   assert.ok(next.fraction>fraction,`${from.id} to ${to.id} stalled at ${position}`);
   position=next.position;fraction=next.fraction;
  }
  assert.equal(fraction,1,`${from.id} to ${to.id}`);
 }
});
