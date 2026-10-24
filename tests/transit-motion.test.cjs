const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const dest=path.resolve(__dirname,'../work/transit-motion-test');fs.mkdirSync(dest,{recursive:true});fs.writeFileSync(dest+'/package.json','{"type":"commonjs"}');
for(const name of ['transit-motion','transit-kit'])fs.writeFileSync(dest+'/'+name+'.js',ts.transpileModule(fs.readFileSync(path.resolve(__dirname,'../lib/game/'+name+'.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText);
const {rideMotion,advanceScenery,newSceneryMotion,SCENERY_PERIOD}=require(dest+'/transit-motion.js'),kit=require(dest+'/transit-kit.js');
for(const mode of ['subway','streetcar','bus'])test(`${mode} visibly accelerates, cruises and brakes to a complete stop`,()=>{
 const t={stage:'riding',mode,readyAt:6000,index:0};
 assert.equal(rideMotion(t,0).speed,0);assert.ok(rideMotion(t,900).speed>rideMotion(t,300).speed);
 assert.equal(rideMotion(t,1200).speed,rideMotion(t,4000).speed);
 assert.ok(rideMotion(t,5500).speed<rideMotion(t,5000).speed);assert.equal(rideMotion(t,6000).speed,0);
 assert.ok(rideMotion(t,5000).distance-rideMotion(t,1000).distance>50,'clearly moving past tunnel landmarks');
 let last=-1;for(let time=0;time<=6500;time+=25){const p=rideMotion(t,time);assert.ok(p.speed>=0);assert.ok(p.distance>=last);last=p.distance;}
 for(const stage of ['entrance','platform','boarding','arrival','exit'])assert.equal(rideMotion({...t,stage},3000).speed,0);
});
test('frame rate and camera/seat updates do not change motion; stops freeze the scenery',()=>{
 const t={stage:'riding',mode:'subway',readyAt:6000,index:0},a=newSceneryMotion(),b=newSceneryMotion();
 for(let frame=0;frame<=360;frame++)advanceScenery(a,t,frame*6000/360);
 for(let frame=0;frame<=180;frame++)advanceScenery(b,{...t},frame*6000/180);
 assert.ok(Math.abs(a.offset-b.offset)<1e-9);const stopped=a.offset;
 for(const stage of ['arrival','boarding','exit'])assert.equal(advanceScenery(a,{...t,stage},9000),stopped);
 const next={...t,index:1,readyAt:15000};assert.equal(advanceScenery(a,next,9000),stopped);
 assert.notEqual(advanceScenery(a,next,10000),stopped);
 assert.ok(a.offset>=0&&a.offset<SCENERY_PERIOD);
});
test('scene details match across the wrap boundary without a visible rewind',()=>{
 for(const subway of [true,false]){
  const parts=kit.rideEnvironment(subway,1,false).filter(p=>p.s[2]<30);
  const fingerprint=p=>JSON.stringify({...p,p:[p.p[0],p.p[1],0]});
  for(const p of parts.filter(p=>p.p[2]>=-36&&p.p[2]<=36))assert.ok(parts.some(q=>q.p[2]===p.p[2]+SCENERY_PERIOD&&fingerprint(q)===fingerprint(p)),`unmatched loop detail ${p.p}`);
 }
});
test('window-height lamps and near track details make motion visible without adding per-prop draws',()=>{
 const p=kit.rideEnvironment(true,-1,false),lights=p.filter(p=>p.finish==='light');assert.ok(lights.length>=100);assert.ok(lights.every(p=>p.p[1]>1&&p.p[1]<2.7));
 assert.ok(p.filter(p=>p.p[1]===-.24&&p.s[0]>6).length>=600);
 assert.ok(p.length<2000);assert.ok(kit.WORLD_DEPTH/2-SCENERY_PERIOD>150);
 const component=fs.readFileSync(path.resolve(__dirname,'../components/game/interiors/TransitKit.tsx'),'utf8');assert.match(component,/position.z=advanceScenery/);
});
