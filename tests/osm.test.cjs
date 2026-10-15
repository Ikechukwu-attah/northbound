const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const dest=path.resolve(__dirname,'../work/osm-test');fs.mkdirSync(dest,{recursive:true});fs.writeFileSync(path.join(dest,'package.json'),'{"type":"commonjs"}');
for(const file of ['data','geo','world','transit'])fs.writeFileSync(path.join(dest,`${file}.js`),ts.transpileModule(fs.readFileSync(path.resolve(__dirname,`../lib/game/${file}.ts`),'utf8'),{compilerOptions:{esModuleInterop:true,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText);
const {PLACES}=require('../work/osm-test/world.js');
const {STOPS,LINES,transitRoute}=require('../work/osm-test/transit.js');
const {stopGeo,placeGeo,placeMetres,stopMetres,haversineMetres,OSM_ATTRIBUTION}=require('../work/osm-test/geo.js');
const geo=require('../data/osm/geo.json');
const BBOX=geo.meta.bbox,inToronto=([lon,lat])=>lon>=BBOX[1]&&lon<=BBOX[3]&&lat>=BBOX[0]&&lat<=BBOX[2];

test('baked OSM data is attributed and ODbL-licensed',()=>{
 assert.equal(OSM_ATTRIBUTION,'© OpenStreetMap contributors');
 assert.equal(geo.meta.attribution,'© OpenStreetMap contributors');
 assert.equal(geo.meta.license,'ODbL-1.0');
 const license=fs.readFileSync(path.resolve(__dirname,'../data/osm/LICENSE'),'utf8');
 assert.match(license,/Open Database License/i);
 const readme=fs.readFileSync(path.resolve(__dirname,'../README.md'),'utf8');
 assert.match(readme,/OpenStreetMap/);
});

test('every game place and TTC stop has a real Toronto coordinate',()=>{
 for(const p of PLACES){const c=placeGeo(p.id);assert.ok(c,`place ${p.id} has geo`);assert.ok(inToronto(c),`${p.id} in Toronto bbox`);}
 for(const s of STOPS){const c=stopGeo(s.id);assert.ok(c,`stop ${s.id} has geo`);assert.ok(inToronto(c),`${s.id} in Toronto bbox`);}
});

test('real distances are symmetric, zero-to-self, and ordered by geography',()=>{
 assert.equal(haversineMetres([-79.38,43.65],[-79.38,43.65]),0);
 const ab=stopMetres('union','finch'),ba=stopMetres('finch','union');
 assert.ok(Math.abs(ab-ba)<1,'symmetric');
 assert.ok(stopMetres('union','finch')>stopMetres('union','queen'),'Finch is farther from Union than Queen');
 assert.ok(placeMetres('nylibrary','waterfront')>placeMetres('queen','home'),'cross-city > downtown hop');
});

test('TTC leg times are derived from real OSM distances, not hand-authored',()=>{
 const line1=LINES.find(l=>l.id==='1');
 assert.equal(line1.times.length,line1.stops.length-1);
 for(let i=0;i<line1.times.length;i++){
  const d=stopMetres(line1.stops[i],line1.stops[i+1]);
  assert.equal(line1.times[i],Math.max(1,Math.round(d/480)),`leg ${line1.stops[i]}→${line1.stops[i+1]} matches real distance/speed`);
 }
 for(const l of LINES)for(const t of l.times)assert.ok(t>=1,'every leg is at least one minute');
});

test('station-based journeys scale with real distance',()=>{
 assert.ok(transitRoute('finch','union').minutes>transitRoute('queen','union').minutes);
 assert.ok(transitRoute('kipling','kennedy').minutes>transitRoute('spadina','stgeorge').minutes);
});

test('district shapes and the Lake Ontario shoreline are baked from OSM',()=>{
 assert.equal(Object.keys(geo.districts).length,6);
 for(const d of ['North York','Scarborough','Etobicoke','York','East York','Old Toronto']){const g=geo.districts[d];assert.ok(g&&Array.isArray(g.bbox)&&g.bbox.length===4,d+' has a bbox');}
 // Five former municipalities come from real OSM relations; only Old Toronto lacks one.
 assert.ok(Object.values(geo.districts).filter(d=>d.osm.startsWith('relation/')).length>=5);
 const ny=geo.districts['North York'].center,ot=geo.districts['Old Toronto'].center,yk=geo.districts['York'].center;
 assert.ok(ny[1]>ot[1],'North York lies north of Old Toronto');
 assert.ok(yk[0]<ot[0],'York lies west of Old Toronto');
 // Shoreline runs west→east and includes Humber Bay and the (higher-latitude) Scarborough Bluffs.
 assert.ok(geo.shoreline.length>=4);
 assert.ok(geo.shoreline[geo.shoreline.length-1][0]>geo.shoreline[0][0],'shoreline ordered west to east');
 assert.ok(geo.shoreline[geo.shoreline.length-1][1]>geo.shoreline[0][1],'Bluffs (east) sit at a higher latitude than the west end');
});
