const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const dest=path.resolve(__dirname,'../work/building-test');fs.mkdirSync(dest,{recursive:true});fs.writeFileSync(dest+'/package.json','{"type":"commonjs"}');
for(const f of fs.readdirSync(path.resolve(__dirname,'../lib/game')).filter(f=>f.endsWith('.ts')))fs.writeFileSync(dest+'/'+f.replace('.ts','.js'),ts.transpileModule(fs.readFileSync(path.resolve(__dirname,'../lib/game',f),'utf8'),{compilerOptions:{esModuleInterop:true,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText);
const e=require(dest+'/engine.js'),i=require(dest+'/interiors.js'),w=require(dest+'/world.js'),b=require(dest+'/building-catalog.js'),l=require(dest+'/building-layouts.js'),n=require(dest+'/navigation.js'),r=require(dest+'/roads.js'),t=require(dest+'/transit-interiors.js');
const act=(s,c,now=100000)=>e.applyCommand(s,c,now,.5).state;
const done=s=>s.interior?.movement?act(s,{type:'interior_arrive'},s.interior.movement.startedAt+s.interior.movement.seconds*1000+1):s;
const use=(s,id)=>done(act(s,{type:'interior_use',id}));
const fresh=()=>{const s=e.newGame({name:'Interior tester',path:'local'});s.job='';s.needs={energy:100,hunger:100,fun:60,social:60,hygiene:100,bladder:100};return s};
test('every shared furnishing preset has reachable objects and configurable colours and extras',()=>{
 for(const style of ['office','residence','retail','grocery','library','clinic','warehouse','service','community','cafe','bank'])for(let seed=0;seed<4;seed++){
  const layout=l.buildingLayout({style,seed});for(const o of layout.objects.filter(o=>o.use)){assert.ok(i.insideWalkable(o.use,layout),style+' '+o.id+' '+o.use);const route=i.interiorPath(layout.door,o.use,layout);assert.ok(route.every((p,j)=>!j||i.interiorSegment(route[j-1],p,layout)),style+' '+o.id);}
 }
 const plain=l.buildingLayout({style:'office',seed:0}),custom=l.buildingLayout({style:'office',seed:0,palette:{accent:'#ff3300'},omit:['plant'],extras:[{id:'custom-plant',kind:'plant',x:9,z:5,width:.8,depth:.8}]});assert.equal(custom.palette.accent,'#ff3300');assert.notEqual(plain.palette.accent,custom.palette.accent);assert.ok(custom.objects.some(o=>o.id==='custom-plant'));assert.ok(!custom.objects.some(o=>o.id==='plant'));assert.ok(plain.objects.some(o=>o.id==='plant'));
});
test('generated buildings in every district have real facade doors and clear return paths',()=>{
 const districts=new Set(),styles=new Set();let count=0;
 for(let x=-10;x<=14;x++)for(let z=-20;z<0;z++)for(const entry of b.streetBuildings(x,z)){
  count++;districts.add(entry.district);styles.add(entry.style);assert.equal(b.buildingById(entry.id),entry);assert.ok(w.distance(entry.door,entry.landing)<1,entry.id);
  assert.ok(n.isWalkable(entry.landing),entry.id+' landing '+entry.landing);const route=w.walkingPath(entry.approach[0],entry.landing);assert.ok(route.every((p,j)=>!j||n.segmentWalkable(route[j-1],p)),entry.id+' approach');assert.ok(w.walkingPath(entry.landing,entry.approach[0]).length);
 }
 assert.ok(count>600);assert.equal(districts.size,6);assert.ok(styles.has('office')&&styles.has('residence')&&styles.has('retail'));
 assert.equal(b.buildingById('building:999999:999999:0'),undefined);assert.equal(b.buildingById('building:0:-1:999'),undefined);
});
test('all named indoor destinations have clear door approaches; parks and shorelines stay outdoors',()=>{
 for(const p of w.PLACES){const entry=b.namedBuilding(p.id);if(!entry)continue;assert.ok(n.isWalkable(entry.landing),p.id);assert.ok(n.segmentWalkable(entry.approach[0],entry.landing),p.id);const layout=i.layoutForBuilding(p.id);for(const o of layout.objects.filter(o=>o.use))i.interiorPath(layout.door,o.use,layout);}
 for(const id of ['bluffs','humber','waterfront','mel'])assert.equal(b.namedBuilding(id),undefined);
});
test('walk, enter, reload, use objects and exit preserve the exact generated address',()=>{
 const entry=b.streetBuildings(0,-10)[0]||b.streetBuildings(1,-10)[0];let s=fresh();assert.throws(()=>act(s,{type:'enter_building',id:entry.id}),/Walk to/);s.position=entry.approach[0];s=act(s,{type:'walk',id:entry.id,mode:'enter-building'});assert.ok(!s.interior);s=act(s,{type:'arrive'},s.journey.startedAt+s.journey.seconds*1000+1);assert.equal(s.interior.place,entry.id);s=e.migrateState(JSON.parse(JSON.stringify(s)));assert.equal(s.interior.kind,'building');s.needs.bladder=0;s=use(s,'toilet');assert.equal(s.needs.bladder,100);s=done(act(s,{type:'exit_home'}));assert.ok(!s.interior);assert.deepEqual(s.position,entry.landing);assert.ok(act(s,{type:'walk',point:entry.approach[0]}).journey);
});
test('library desk, grocery checkout and service counter preserve existing game rules',()=>{
 let s=fresh();s.position=w.entrance(w.placeById('nylibrary'));s=act(s,{type:'enter_building',id:'nylibrary'});s=use(s,'desk');assert.equal(s.life.resume,true);s=done(act(s,{type:'exit_home'}));
 s.position=w.entrance(w.placeById('kensington'));s=act(s,{type:'enter_building',id:'kensington'});const before=s.life.groceries;s=use(s,'checkout');assert.equal(s.life.groceries,before+14);
});
test('stop request works while seated or walking, remains latched, and never interrupts boarding',()=>{
 const state=fresh();state.transit={layoutVersion:5,origin:'queen',destination:'dufferin',legs:[{line:'501',from:'queen',to:'dufferin',minutes:3}],index:0,stage:'riding',mode:'bus',night:false,paid:true,validated:true,requested:false,readyAt:110000,position:[0,1],seat:'seat-a'};
 // Use a real non-terminal leg from the route registry.
 const transit=require(dest+'/transit.js'),line=transit.LINES.find(l=>l.mode==='streetcar'),from=line.stops[0],to=line.stops.find(id=>!transit.isBusTerminal(id));state.transit.legs=[{line:line.id,from,to,minutes:3}];state.transit.destination=to;
 const s=act(state,{type:'transit_request'});assert.equal(s.transit.requested,true);assert.equal(s.transit.seat,'seat-a');assert.equal(s.transit.movement,undefined);assert.equal(act(s,{type:'transit_request'}).transit.requested,true);
 state.transit.stage='boarding';assert.throws(()=>act(state,{type:'transit_request'}),/seat or stand/);state.transit.stage='riding';state.transit.mode='subway';assert.throws(()=>act(state,{type:'transit_request'}),/buses and streetcars/);
});
