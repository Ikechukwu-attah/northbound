const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const dest=path.resolve(__dirname,'../work/ttc-fleet-test');fs.mkdirSync(dest,{recursive:true});fs.writeFileSync(path.join(dest,'package.json'),'{"type":"commonjs"}');
for(const file of fs.readdirSync(path.resolve(__dirname,'../lib/game')).filter(f=>f.endsWith('.ts')))fs.writeFileSync(path.join(dest,file.replace('.ts','.js')),ts.transpileModule(fs.readFileSync(path.resolve(__dirname,'../lib/game',file),'utf8'),{compilerOptions:{esModuleInterop:true,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText);
const {makeTrafficFleet}=require('../work/ttc-fleet-test/ttc-fleet.js'),{PLACES}=require('../work/ttc-fleet-test/world.js'),{roadAt,trafficBudget}=require('../work/ttc-fleet-test/roads.js'),{ttcBusParts,BUS_LENGTH}=require('../work/ttc-fleet-test/ttc-bus.js'),{ttcStreetcarParts,STREETCAR_LENGTH}=require('../work/ttc-fleet-test/ttc-streetcar.js'),{newGame,applyCommand}=require('../work/ttc-fleet-test/engine.js'),{stopById}=require('../work/ttc-fleet-test/transit.js'),{rideMode}=require('../work/ttc-fleet-test/ride-mode.js');
test('all six district fleets use the same bus envelope at every quality/time budget',()=>{
 const seen=new Set();for(const place of PLACES){const cx=Math.floor(place.x/24),cz=Math.floor(place.z/24),cells=[];for(let x=cx-2;x<=cx+2;x++)for(let z=cz-2;z<=cz+2;z++)cells.push([x,z]);
  for(const mobile of [false,true])for(const quality of [false,true])for(const minutes of [60,480,720]){const count=trafficBudget(minutes,mobile,quality),fleet=makeTrafficFleet(cells,count);assert.equal(fleet.length,count);
   for(const v of fleet){if(v.kind==='bus'){seen.add(place.district);assert.equal(v.length,BUS_LENGTH);}if(v.kind==='streetcar'){assert.equal(v.length,STREETCAR_LENGTH);assert.ok(roadAt(v.axis,v.road,(v.min+v.max)/2).tracks);}}
  }
 }assert.equal(seen.size,6);assert.deepEqual(makeTrafficFleet([],8),[]);
});
test('buses retain white/red livery, real wheels and curb-side doors; streetcars have distinct articulated bodies',()=>{
 const bus=ttcBusParts(),tram=ttcStreetcarParts();assert.equal(bus.filter(p=>p.tag==='tire').length,4);assert.ok(bus.filter(p=>p.tag==='curb-door').every(p=>p.p[0]<0));assert.equal(bus.find(p=>p.tag==='body').c,'#f4f3ec');assert.equal(bus.find(p=>p.tag==='red-belt').c,'#da291c');
 assert.equal(tram.filter(p=>p.tag==='module-body').length,5);assert.equal(tram.filter(p=>p.tag==='articulation').length,4);assert.ok(tram.some(p=>p.tag==='pantograph-contact'));
 for(const [parts,length]of [[bus,BUS_LENGTH],[tram,STREETCAR_LENGTH]])for(const p of parts){assert.ok(p.p.every(Number.isFinite)&&p.s.every(x=>x>0));const halfZ=p.shape==='wheel'?p.s[0]:p.s[2]/2;assert.ok(Math.abs(p.p[2])+halfZ<=length/2);}
});
const ride=(from,to,minutes=540,roll=.5)=>{const s=newGame({name:'Fleet test'});s.position=stopById(from).point;s.location='';s.minutes=minutes;return applyCommand(s,{type:'transit',id:to},1000,roll).state.journey;};
test('every bus connector, subway and streetcar journey selects its matching ride scene',()=>{
 for(const [from,to]of [['pearson','kipling'],['kennedy','stc'],['kennedy','bluffs'],['jane','weston'],['kipling','mimico'],['broadview','ey']])assert.equal(rideMode(ride(from,to)),'bus');
 assert.equal(rideMode(ride('finch','union')),'subway');assert.equal(rideMode(ride('sheppard','donmills')),'subway');assert.equal(rideMode(ride('queenwest','queen')),'streetcar');
 assert.equal(rideMode(ride('finch','union',180)),'bus');assert.equal(rideMode(ride('finch','union',540,.05)),'bus');
 const old=ride('kennedy','stc');delete old.vehicleMode;assert.equal(rideMode(old),'bus');assert.equal(rideMode({...old,detail:'Line 1 · Yonge–University · Simulated closure: shuttle bus +15 min'}),'bus');
});
test('legacy districts and live traffic cannot fall back to the removed box bus',()=>{
 const source=f=>fs.readFileSync(path.resolve(__dirname,'../components/game',f),'utf8');
 assert.match(source('LegacyCity.tsx'),/import \{Bus\} from '.\/CityAssets'/);assert.doesNotMatch(source('LegacyCity.tsx'),/function Bus\(/);
 assert.match(source('CityAssets.tsx'),/<TTCBus kind=\{streetcar\?'streetcar':'bus'\}/);
 assert.match(source('RoadNetwork.tsx'),/if\(v.kind!=='car'\)continue/);
 assert.match(source('RoadNetwork.tsx'),/<TTCBusTraffic vehicles=\{vehicles\}\/>(<TTCBusTraffic vehicles=\{vehicles\} kind="streetcar"\/>)/);
 assert.match(source('TransitScene.tsx'),/<VehicleCabin t=\{t\}/);
 assert.match(source('interiors/TransitKit.tsx'),/<TTCBus kind=\{t.mode/);
});
