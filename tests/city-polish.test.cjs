const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const dest=path.resolve(__dirname,'../work/city-polish-test');fs.mkdirSync(dest,{recursive:true});fs.writeFileSync(dest+'/package.json','{"type":"commonjs"}');
for(const f of fs.readdirSync(path.resolve(__dirname,'../lib/game')).filter(f=>f.endsWith('.ts')))fs.writeFileSync(dest+'/'+f.replace('.ts','.js'),ts.transpileModule(fs.readFileSync(path.resolve(__dirname,'../lib/game',f),'utf8'),{compilerOptions:{esModuleInterop:true,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText);
const w=require(dest+'/world.js'),n=require(dest+'/navigation.js'),b=require(dest+'/building-catalog.js'),r=require(dest+'/roads.js'),e=require(dest+'/engine.js'),a=require(dest+'/atms.js'),c=require(dest+'/city-scale.js'),kit=require(dest+'/transit-kit.js'),crowds=require(dest+'/crowds.js'),life=require(dest+'/street-life.js');
test('ATMs are distributed across districts, separated, and clear of through paths and doors',()=>{
 const atms=a.streetATMs(),districts=new Set();assert.ok(atms.length>=6);for(const atm of atms){districts.add(w.districtAt(atm.point));assert.ok(n.isWalkable(atm.access),atm.id);assert.ok(!n.isWalkable(atm.point),atm.id+' has physical collision');const host=w.placeById(atm.host);assert.ok(n.segmentWalkable([host.x,host.z+7],w.entrance(host)),atm.id+' leaves door clear');for(const other of atms)if(other!==atm)assert.ok(w.distance(atm.point,other.point)>=30);}
 assert.equal(districts.size,6);
});
test('Scarborough hubs have commercial blocks, live activity hosts and more daytime pedestrians',()=>{
 for(const [x,z]of [[10,-8],[9,-4]]){const entries=b.streetBuildings(x,z),tiles=r.makeRoadTiles([[x,z]]);if(entries.length)assert.ok(entries.some(p=>p.style!=='residence'));assert.ok(tiles.boxes.every(p=>typeof p.c==='string'&&p.p.every(Number.isFinite)));}
 const centre=[252,-204];assert.ok(crowds.crowdBudget('scarborough',540,false,true,centre)>crowds.crowdBudget('scarborough',540,false,true,[300,-300]));assert.ok(crowds.crowdBudget('scarborough',540,true,true,centre)<=12);assert.ok(crowds.crowdBudget('scarborough',60,true,true,centre)<crowds.crowdBudget('scarborough',540,true,true,centre));
 assert.equal(life.streetHosts(60).length,0);assert.equal(life.streetHosts(600).length,3);for(const h of life.streetHosts(600)){assert.ok(n.isWalkable(h.person));assert.ok(!n.isWalkable(h.point));assert.ok(n.publicPeoplePositions(600).some(p=>w.distance(p,h.person)<.01));}
});
test('old saves on replaced block footprints recover to a sidewalk without losing progress',()=>{
 const s=e.newGame({name:'Recovery'});delete s.streetLayout;s.position=[252,-216];s.cash=123456;s.skill=7;s.journey={kind:'walk',path:[[251,-221],[252,-216]],startedAt:0,seconds:10,minutes:3,waitSeconds:0,label:'Old route',detail:''};
 const next=e.migrateState(s);assert.ok(n.isWalkable(next.position));assert.equal(next.journey,null);assert.equal(next.cash,s.cash);assert.equal(next.skill,s.skill);assert.deepEqual(e.migrateState(next),next);
});
test('actual character rigs fit below doors and seated knees and feet clear all TTC cushions',async()=>{
 const THREE=await import('three'),{GLTFLoader}=await import('three/examples/jsm/loaders/GLTFLoader.js');
 for(const variant of ['casual','casual-female','hoodie']){
  const bytes=fs.readFileSync(path.resolve(__dirname,'../public/characters',variant+'.glb')),g=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
  const mixer=new THREE.AnimationMixer(g.scene);mixer.clipAction(g.animations.find(a=>a.name.endsWith('|Idle_Neutral'))).play();mixer.update(.5);g.scene.updateMatrixWorld(true);
  const height=new THREE.Box3().setFromObject(g.scene,true).getSize(new THREE.Vector3()).y;assert.ok(height*c.CITY_HUMAN_SCALE*1.1<2.5,variant+' fits below a door');
  mixer.stopAllAction();mixer.clipAction(g.animations.find(a=>a.name==='Northbound|Sit')).play();mixer.update(.5);g.scene.updateMatrixWorld(true);
  const pos=name=>g.scene.getObjectByName(name).getWorldPosition(new THREE.Vector3());const hip=pos('UpperLegL').y;
  for(const kind of ['subway','bus','streetcar'])for(const seat of kit.transitSeats(kind))for(const stature of [.9,1,1.1]){
   const pose=kit.transitSeatPose(kind,[seat.x,seat.z]),rootY=c.seatedRootHeight(hip,1,stature,pose.surface);
   for(const name of ['LowerLegL','LowerLegR','FootL','FootR']){const p=pos(name);p.y=p.y*stature+rootY;p.z+=c.SEATED_FORWARD;p.applyAxisAngle(new THREE.Vector3(0,1,0),seat.rotation);p.add(new THREE.Vector3(...pose.position));
    assert.ok(p.y>-.06,`${variant} ${kind} ${name} below floor`);
    const submerged=kit.cabinFittings(kind).some(part=>part.c===kit.TTC_INTERIOR.black&&part.p[1]<.6&&Math.abs(p.x-part.p[0])<part.s[0]/2&&Math.abs(p.y-part.p[1])<part.s[1]/2&&Math.abs(p.z-part.p[2])<part.s[2]/2);
    assert.equal(submerged,false,`${variant} ${kind} ${name} buried in seat`);
   }
  }
 }
});
