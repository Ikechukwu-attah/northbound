const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const dest=path.resolve(__dirname,'../work/scarborough-test');fs.mkdirSync(dest,{recursive:true});fs.writeFileSync(dest+'/package.json','{"type":"commonjs"}');
for(const f of fs.readdirSync(path.resolve(__dirname,'../lib/game')).filter(f=>f.endsWith('.ts')))fs.writeFileSync(dest+'/'+f.replace('.ts','.js'),ts.transpileModule(fs.readFileSync(path.resolve(__dirname,'../lib/game',f),'utf8'),{compilerOptions:{esModuleInterop:true,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText);
const w=require(dest+'/world.js'),n=require(dest+'/navigation.js'),b=require(dest+'/building-catalog.js'),f=require(dest+'/building-form.js'),kit=require(dest+'/exterior-kit.js'),geo=require(dest+'/geo.js'),sc=require(dest+'/scarborough.js'),scenery=require(dest+'/city-scenery.js'),cam=require(dest+'/city-camera.js');
test('mapped Scarborough destinations have provenance, unique cells and connected entrances across expanded east',()=>{
 assert.equal(sc.SCARBOROUGH_FEATURES.length,8);assert.ok(w.BOUNDS.east>=475);
 const cells=new Set();for(const p of w.PLACES){const key=[p.x,p.z].join();assert.ok(!cells.has(key),p.id);cells.add(key);}
 for(const feature of sc.SCARBOROUGH_FEATURES){const p=w.placeById(feature.id);assert.match(feature.osm,/^(way|relation)\/\d+$/);assert.deepEqual(geo.placeGeo(p.id),feature.c);assert.equal(w.districtAt([p.x,p.z]),'scarborough');assert.ok(n.isWalkable(w.entrance(p)),p.id);assert.ok(b.namedBuilding(p.id));
  for(const id of ['stc','scafe','rouge']){const route=w.walkingPath(w.entrance(w.placeById(id)),w.entrance(p));assert.ok(route.every((v,j)=>!j||n.segmentWalkable(route[j-1],v)),id+' → '+p.id);}
 }
 for(let x=15;x<20;x++)for(let z=-20;z<0;z++)for(const entry of b.streetBuildings(x,z)){assert.ok(n.isWalkable(entry.landing),entry.id);assert.ok(w.walkingPath(entry.approach[0],entry.landing).length);}
});
test('housing differs structurally and near/far kits share massing and clear door corridors',()=>{
 const kinds=new Set(),housing=new Set();
 for(let x=7;x<20;x++)for(let z=-20;z<0;z++)for(const form of f.blockForms(x,z,'scarborough')){
  kinds.add(form.kind);if(form.house)housing.add([form.width,form.depth,form.height,form.kind].join());
  const near=kit.exteriorKit(form,['#abc','#def']),far=kit.exteriorKit(form,['#abc','#def'],false);
  assert.deepEqual(near.slice(0,far.length),far);assert.ok(near.every(p=>p.p.every(Number.isFinite)&&p.s.every(v=>v>0&&Number.isFinite(v))));
 }
 assert.equal(housing.size,4);for(const kind of ['tower','shops','campus','warehouse','slab','terrace','bungalow','gable','semi','modern'])assert.ok(kinds.has(kind),kind);
});
test('camera frustum remains inside streamed land at screen/zoom/turn extremes, including all world boundaries',async()=>{
 const THREE=await import('three'),C=cam.CITY_CAMERA;
 assert.ok(C.turn*2<Math.PI/2);const plane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
 for(const [width,height]of [[1440,900],[1024,768],[390,844]])for(const zoom of [cam.cityZoomMin(width,height),cam.cityZoomMax(width,height)])for(const az of [C.azimuth-C.turn,C.azimuth,C.azimuth+C.turn])for(const p of [[w.BOUNDS.west,-480],[w.BOUNDS.east,-480],[w.BOUNDS.east,-5],[252,-204],[431.9,-217.1]]){
  const camera=new THREE.OrthographicCamera(-width/2,width/2,height/2,-height/2,.1,C.far);camera.zoom=zoom;const target=new THREE.Vector3(p[0],1,p[1]);camera.position.copy(target).add(new THREE.Vector3().setFromSphericalCoords(C.radius,C.polar,az));camera.lookAt(target);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
  const cells=w.chunksAround(p,C.sceneryRadius),minX=Math.min(...cells.map(c=>c[0]*24)),maxX=Math.max(...cells.map(c=>c[0]*24))+24,minZ=Math.min(...cells.map(c=>c[1]*24)),maxZ=Math.max(...cells.map(c=>c[1]*24))+24;
  assert.equal(cells.length,169);for(const x of [-1,0,1])for(const y of [-1,0,1])for(const level of [0,35]){plane.constant=-level;const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2(x,y),camera);const hit=ray.ray.intersectPlane(plane,new THREE.Vector3());if(!hit)continue;assert.ok(hit.x>minX+12&&hit.x<maxX-12&&hit.z>minZ+12&&hit.z<maxZ-12,JSON.stringify({width,height,zoom,az,p,hit}));}
 }
 const near=w.chunksAround([475,-485]),all=w.chunksAround([475,-485],C.sceneryRadius),distant=all.filter(c=>!near.some(n=>n[0]===c[0]&&n[1]===c[1])),pieces=scenery.distantCity(distant);assert.ok(pieces.length<6000);assert.ok(pieces.every(p=>p.p.every(Number.isFinite)&&p.s.every(v=>v>0)));
});
