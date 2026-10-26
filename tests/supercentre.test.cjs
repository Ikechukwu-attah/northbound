const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const dest=path.resolve(__dirname,'../work/supercentre-test');fs.mkdirSync(dest,{recursive:true});fs.writeFileSync(dest+'/package.json','{"type":"commonjs"}');
for(const f of fs.readdirSync(path.resolve(__dirname,'../lib/game')).filter(f=>f.endsWith('.ts')))fs.writeFileSync(dest+'/'+f.replace('.ts','.js'),ts.transpileModule(fs.readFileSync(path.resolve(__dirname,'../lib/game',f),'utf8'),{compilerOptions:{esModuleInterop:true,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText);
const w=require(dest+'/world.js'),b=require(dest+'/building-catalog.js'),n=require(dest+'/navigation.js'),i=require(dest+'/interiors.js'),store=require(dest+'/supercentre.js'),e=require(dest+'/engine.js');
const act=(s,c,now=100000)=>e.applyCommand(s,c,now,.5).state;
const done=s=>s.interior?.movement?act(s,{type:'interior_arrive'},s.interior.movement.startedAt+s.interior.movement.seconds*1000+1):s;
test('all generated addresses connect to the public grid and allow full outbound and return trips',()=>{
 let count=0;const origin=w.entrance(w.placeById('stc'));
 for(let x=-10;x<20;x++)for(let z=-20;z<0;z++)for(const entry of b.streetBuildings(x,z)){
  count++;assert.ok(w.onSidewalk(entry.approach[0]),entry.id+' connected approach');
  for(const [from,to]of [[origin,entry.landing],[entry.landing,origin]]){const route=w.walkingPath(from,to);assert.ok(route.every((p,j)=>!j||n.segmentWalkable(route[j-1],p)),entry.id);}
  // The entire doorway segment must also complete in the renderer, including turns.
  const street=[entry.approach[0][0]+(entry.rotation<0?-2:2),entry.approach[0][1]];
  const start=w.snapPoint(street),route=w.walkingPath(start,entry.landing);let state={position:route[0],fraction:0};
  for(let frame=0;frame<250&&state.fraction<1;frame++){const next=n.advanceWalker(state.position,route,state.fraction,.01,[]);assert.ok(next.fraction>state.fraction,entry.id+' must not stall');state=next;}
  assert.equal(state.fraction,1,entry.id);
 }
 assert.ok(count>900);
});
test('supercentre has a wide stocked layout, reachable departments, four tills and clear shopper bays',()=>{
 const l=i.layoutForBuilding(store.WALMART_ID),state={kind:'building',place:store.WALMART_ID,tier:'room',position:l.door};
 assert.equal(l.width,48);assert.equal(l.depth,40);assert.equal(l.objects.filter(o=>o.id.startsWith('department-')).length,12);assert.equal(l.objects.filter(o=>o.id.startsWith('checkout-')).length,4);
 const nav=i.interiorNavigation(state,600);for(const o of l.objects.filter(o=>o.use)){assert.ok(i.insideWalkable(o.use,nav),o.id);const route=i.interiorPath(l.door,o.use,nav);assert.ok(route.every((p,j)=>!j||i.interiorSegment(route[j-1],p,nav)));i.interiorPath(o.use,l.door,nav);}
 const shoppers=store.createStoreShoppers(18);for(const a of shoppers){assert.ok(i.interiorSegment(a.home,a.end,l));assert.ok(i.insideWalkable(a.position,l));for(const other of shoppers)if(a!==other)assert.ok(w.distance(a.position,other.position)>.68);}
 for(const p of store.storeCashiers())assert.ok(i.insideWalkable(p,l));assert.equal(store.storeShopperCount(false,true,600),18);assert.ok(store.storeShopperCount(true,true,600)<=8);assert.equal(store.storeShopperCount(false,true,60),0);
});
test('Walmart can be reached from TTC, entered, shopped, saved and exited at its actual facade',()=>{
 let s=e.newGame({name:'Store reviewer',path:'local'});s.job='';s.minutes=600;s.needs={energy:100,hunger:100,fun:100,social:100,hygiene:100,bladder:100};
 const entry=b.buildingById(store.WALMART_ID),transit=require(dest+'/transit.js');s.position=transit.stopById('stc').point;
 s=act(s,{type:'walk',id:store.WALMART_ID,mode:'enter-building'});s=act(s,{type:'arrive'},s.journey.startedAt+s.journey.seconds*1000+1);assert.equal(s.interior.place,store.WALMART_ID);
 s=done(act(s,{type:'interior_use',id:'department-0-0'}));const before=s.life.groceries,cash=s.cash;s=done(act(s,{type:'interior_use',id:'checkout-0'}));assert.equal(s.life.groceries,before+14);assert.equal(s.cash,cash-require('../config/economy.json').prices.groceries);
 s=e.migrateState(JSON.parse(JSON.stringify(s)));s=done(act(s,{type:'exit_home'}));assert.equal(s.interior,undefined);assert.deepEqual(s.position,entry.landing);assert.ok(w.walkingPath(s.position,transit.stopById('stc').point).length);
});
