const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const dest=path.resolve(__dirname,'../work/scenery-test');fs.mkdirSync(dest,{recursive:true});fs.writeFileSync(path.join(dest,'package.json'),'{"type":"commonjs"}');
for(const file of fs.readdirSync(path.resolve(__dirname,'../lib/game')).filter(f=>f.endsWith('.ts')).map(f=>f.slice(0,-3)))fs.writeFileSync(path.join(dest,`${file}.js`),ts.transpileModule(fs.readFileSync(path.resolve(__dirname,`../lib/game/${file}.ts`),'utf8'),{compilerOptions:{esModuleInterop:true,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText);
const {shorelineScenery}=require('../work/scenery-test/scenery.js');
const {placeById,entrance}=require('../work/scenery-test/world.js');
const {STOPS}=require('../work/scenery-test/transit.js');
const contains=(b,p)=>Math.abs(p[0]-b.x)<=b.w/2&&Math.abs(p[1]-b.z)<=b.d/2;

test('waterfront scenery never overlaps walkable ground (entrance, stops, forecourt)',()=>{
 for(const [id,kind] of [['bluffs','bluffs'],['humber','bay']]){
  const spot=placeById(id);assert.ok(spot,id+' exists');
  const boxes=shorelineScenery(spot,kind);
  const ent=entrance(spot); // the walkable spot where the player stands
  // Water/beach/path must not sit on the entrance, the forecourt, or any nearby stop.
  const walkable=[ent,[spot.x,spot.z+7],[spot.x,spot.z+5],...STOPS.filter(s=>Math.hypot(s.point[0]-spot.x,s.point[1]-spot.z)<30).map(s=>s.point)];
  for(const b of boxes)for(const p of walkable)assert.ok(!contains(b,p),`${id}: ${b.kind} overlaps walkable point ${p}`);
  // All scenery sits on the lake side (south, +z) of the entrance — never behind/over the player.
  for(const b of boxes)assert.ok(b.z>ent[1]+1,`${id}: ${b.kind} must be south of the entrance`);
  assert.ok(boxes.some(b=>b.kind==='water'),id+' has water');
 }
});

test('the Bluffs have cliff faces at the shoreline with a beach beyond',()=>{
 const spot=placeById('bluffs'),boxes=shorelineScenery(spot,'bluffs');
 const cliffs=boxes.filter(b=>b.kind==='cliff'),beach=boxes.find(b=>b.kind==='beach'),water=boxes.find(b=>b.kind==='water');
 assert.ok(cliffs.length>=3&&cliffs.every(c=>c.h>=5),'tall cliff faces');
 // Order lakeward: cliffs (shore) → beach → water, each further south (+z).
 assert.ok(beach.z>cliffs[0].z&&water.z>beach.z,'beach below the cliffs, water beyond');
});
