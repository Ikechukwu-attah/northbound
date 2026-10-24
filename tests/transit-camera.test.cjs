const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),THREE=require('three');
const dest=path.resolve(__dirname,'../work/transit-camera-test');fs.mkdirSync(dest,{recursive:true});fs.writeFileSync(dest+'/package.json','{"type":"commonjs"}');
for(const f of fs.readdirSync(path.resolve(__dirname,'../lib/game')).filter(f=>f.endsWith('.ts')))fs.writeFileSync(dest+'/'+f.replace('.ts','.js'),ts.transpileModule(fs.readFileSync(path.resolve(__dirname,'../lib/game',f),'utf8'),{compilerOptions:{esModuleInterop:true,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText);
const {TRANSIT_CAMERA:C,transitCameraLimits,stationDoorSide}=require(dest+'/transit-camera.js'),kit=require(dest+'/transit-kit.js'),transit=require(dest+'/transit-interiors.js'),inside=require(dest+'/interiors.js');
const cases=[['1','stgeorge','museum',-1],['1','king','queen',1],['2','bay','stgeorge',-1],['2','christie','bathurst',1]];
function state(line,from,to,stage='arrival'){return {stage,mode:'subway',position:[0,5],paid:true,validated:true,requested:false,index:0,readyAt:0,legs:[{line,from,to,minutes:2}]};}
for(const [w,h] of [[1440,900],[1024,768],[390,844]])for(const [line,from,to,side]of cases){
 test(`${w}px Line ${line} ${to}: both zoom extremes and longitudinal pan hide train/world ends`,()=>{
  for(const vehicle of [true,false]){const lim=transitCameraLimits(w,h,vehicle);for(const zoom of [lim.minZoom,lim.maxZoom])for(const pan of [-2,2]){
   const camera=new THREE.OrthographicCamera(-w/2,w/2,h/2,-h/2,.1,150),mirror=-side;
   camera.zoom=zoom;camera.position.set(...(vehicle?C.cutawayPosition:[C.stationPosition[0]*mirror,20,22]));camera.position.z+=pan;camera.lookAt(0,0,pan);camera.updateProjectionMatrix();camera.updateMatrixWorld();
   const f=new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
   const x=vehicle?0:6*mirror;
   for(const z of vehicle?[kit.TRAIN_MIN_Z,kit.TRAIN_MAX_Z]:[-58,68])assert.equal(f.intersectsBox(new THREE.Box3(new THREE.Vector3(x-3,0,z-.1),new THREE.Vector3(x+3,3.5,z+.1))),false,`visible train end ${z}`);
   for(const z of [-kit.WORLD_DEPTH/2,kit.WORLD_DEPTH/2])assert.equal(f.intersectsBox(new THREE.Box3(new THREE.Vector3(-240,-1,z-.1),new THREE.Vector3(240,10,z+.1))),false,'visible scenery edge');
  }}
  for(const distance of [C.minDistance,C.maxDistance])for(const pan of [-2,2]){
   const z=C.insideTarget[2]+distance+pan;
   assert.ok(z>-5.5&&z<7,'inside camera stays between doors');
   assert.ok(Math.abs(kit.TRAIN_MIN_Z-z)>C.insideFar,'end cab outside inside frustum');
   assert.ok(C.insideFogEnd<C.insideFar);assert.ok(kit.WORLD_DEPTH/2-Math.abs(z)>C.insideFar);
  }
 });
}
test('rotation is disabled in every transit view; free pan cannot escape the corridor',()=>{assert.equal(C.rotate,false);assert.equal(C.pan,false);const s=fs.readFileSync(path.resolve(__dirname,'../components/game/interiors/TransitInterior.tsx'),'utf8');assert.match(s,/enableRotate=\{TC.rotate\}/);assert.match(s,/enablePan=\{TC.pan\}/);});
test('Line 1 and Line 2 platform side drives doors, exit ring, scenery and connected paths',()=>{
 for(const [line,from,to,side]of cases){assert.equal(stationDoorSide(line,to),side);for(const stage of ['boarding','riding','arrival','exit','platform']){
  const t=state(line,from,to,stage),expected=stationDoorSide(line,['arrival','exit','riding'].includes(stage)?to:from);assert.equal(transit.transitPlatformSide(t),expected);
  const o=transit.transitObjects(t),door=o.find(o=>o.id==='door');if(door){assert.equal(door.point[1],-5.5,'exit is at the forward doorway visible from inside');assert.equal(Math.sign(door.point[0]),expected);assert.equal(Math.sign(door.use[0]),expected);const path=inside.interiorPath(t.position,door.use,transit.transitLayout(t));assert.ok(path.length>1);}
  const env=kit.rideEnvironment(true,expected,true);const edges=env.filter(p=>p.c===kit.TTC_INTERIOR.yellow);assert.equal(edges.length,1);assert.equal(Math.sign(edges[0].p[0]),expected);
  if(stage==='platform'){const board=o.find(o=>o.id==='board');assert.equal(Math.sign(board.point[0]),-expected);assert.ok(inside.interiorPath([0,4],board.use,transit.transitLayout(t)).length>1);}
 }}
 assert.equal(stationDoorSide('1','bloor'),1);assert.equal(stationDoorSide('2','bloor'),-1);
});
test('surface scenery continues past the clip plane and doors always face the curb',()=>{
 for(const mode of ['bus','streetcar']){const t={...state('903','kennedy','stc'),mode};assert.equal(transit.transitPlatformSide(t),1);assert.equal(transit.transitObjects(t).find(o=>o.id==='door').point[0],2.8);}
 const parts=kit.rideEnvironment(false,1,false);for(const side of [-1,1]){assert.ok(parts.some(p=>p.p[0]===side*7&&p.s[2]===kit.WORLD_DEPTH));assert.ok(parts.some(p=>p.p[0]===side*12&&p.p[2]<-150));assert.ok(parts.some(p=>p.p[0]===side*12&&p.p[2]>150));}
});
