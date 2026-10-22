const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const dest=path.resolve(__dirname,'../work/home-door-test');fs.mkdirSync(dest,{recursive:true});fs.writeFileSync(dest+'/package.json','{"type":"commonjs"}');
for(const f of fs.readdirSync(path.resolve(__dirname,'../lib/game')).filter(f=>f.endsWith('.ts')))fs.writeFileSync(dest+'/'+f.replace('.ts','.js'),ts.transpileModule(fs.readFileSync(path.resolve(__dirname,'../lib/game',f),'utf8'),{compilerOptions:{esModuleInterop:true,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText);
const e=require(dest+'/engine.js'),w=require(dest+'/world.js'),n=require(dest+'/navigation.js'),d=require(dest+'/building-entrances.js'),inside=require(dest+'/interiors.js');
const fresh=()=>e.newGame({name:'Door reviewer',path:'local'}),act=(s,c,now=100000)=>e.applyCommand(s,c,now,.5).state;
const arrive=s=>act(s,{type:'arrive'},s.journey.startedAt+s.journey.seconds*1000+1);

test('every home facade has a continuous walkable approach and return route outside its walls',()=>{
 for(const p of w.PLACES.filter(p=>p.kind==='home')){
  const entry=d.homeEntrance(p);assert.equal(entry.door[1],p.z+2.56);assert.ok(w.distance(entry.landing,entry.door)<1);
  assert.ok(!w.onSidewalk(entry.landing));assert.ok(n.isWalkable(entry.landing));assert.equal(n.isWalkable([p.x,p.z+2.4]),false);
  for(const sign of [-1,1]){const street=[entry.street[0]+sign*3,entry.street[1]],route=w.walkingPath(street,entry.landing);
   for(let j=1;j<route.length;j++)assert.ok(n.segmentWalkable(route[j-1],route[j]),p.id+' '+route);
   let state={position:route[0],fraction:0};for(let j=0;j<250&&state.fraction<1;j++)state=n.advanceWalker(state.position,route,state.fraction,.01,[]);
   assert.equal(state.fraction,1,p.id);assert.ok(w.distance(state.position,entry.landing)<.65);
   const back=w.walkingPath(entry.landing,street);for(let j=1;j<back.length;j++)assert.ok(n.segmentWalkable(back[j-1],back[j]));
  }
 }
});
test('roadside users cannot open the home; ordinary walks and passing by do not auto-enter',()=>{
 let s=fresh(),p=w.placeById('home');s.position=d.homeEntrance(p).street;
 assert.throws(()=>act(s,{type:'enter_home'}),/home door/);
 s=arrive(act(s,{type:'walk',id:p.id}));assert.equal(s.interior,undefined);assert.deepEqual(s.position,w.entrance(p));
 s=act(s,{type:'enter_home'});assert.equal(s.interior.kind,'home');
 s=act(s,{type:'exit_home'});if(s.interior?.movement)s=act(s,{type:'interior_arrive'},s.interior.movement.startedAt+s.interior.movement.seconds*1000+1);
 assert.deepEqual(s.position,w.entrance(p));assert.equal(s.interior,undefined);
 s=arrive(act(s,{type:'walk',point:d.homeEntrance(p).street}));assert.equal(s.interior,undefined);
});
test('tapping a home door walks there before entering; cancellation and old saves stay outside',()=>{
 let s=fresh(),p=w.placeById('home');s.position=d.homeEntrance(p).street;
 s=e.migrateState(JSON.parse(JSON.stringify(s)));assert.deepEqual(s.position,d.homeEntrance(p).street);
 const queued=act(s,{type:'walk',id:p.id,mode:'enter-home'});assert.equal(queued.interior,undefined);
 assert.throws(()=>act(queued,{type:'arrive'}),/on your way/);
 const stopped=act(queued,{type:'cancel',progress:.5},queued.journey.startedAt+queued.journey.seconds*500);assert.equal(stopped.interior,undefined);assert.ok(w.onFootpath(stopped.position));
 s=arrive(e.migrateState(JSON.parse(JSON.stringify(queued))));assert.equal(s.interior.kind,'home');
 s.interior.position=inside.interiorLayout(s.interior).door;s=act(s,{type:'exit_home'});assert.equal(s.interior,undefined);assert.deepEqual(s.position,w.entrance(p));
 const next=act(s,{type:'walk',id:'queen'});assert.deepEqual(next.journey.path[0],w.entrance(p));
});
