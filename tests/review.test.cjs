const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const dest=path.resolve(__dirname,'../work/review-test');fs.mkdirSync(dest,{recursive:true});fs.writeFileSync(path.join(dest,'package.json'),'{"type":"commonjs"}');
for(const file of fs.readdirSync(path.resolve(__dirname,'../lib/game')).filter(f=>f.endsWith('.ts')).map(f=>f.slice(0,-3)))fs.writeFileSync(path.join(dest,`${file}.js`),ts.transpileModule(fs.readFileSync(path.resolve(__dirname,`../lib/game/${file}.ts`),'utf8'),{compilerOptions:{esModuleInterop:true,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText);
const {newGame,applyCommand,fareFor,realWalkInfo}=require('../work/review-test/engine.js');
const {advanceLife,ECONOMY}=require('../work/review-test/life.js');
const {placeById,entrance}=require('../work/review-test/world.js');
const {placeGeo}=require('../work/review-test/geo.js');
const {nearestStop}=require('../work/review-test/transit.js');
const fresh=()=>newGame({type:'start',name:'Reviewer'});

test('fare is only $0 within 2 hours of a real paid tap, or at the monthly cap',()=>{
 const s=fresh();assert.equal(fareFor(s),330); // brand-new save: first trip is NOT a free transfer
 assert.equal(fareFor({...s,transferUntil:999999}),330); // no paid tap yet => still full fare (bug guard)
 const tapped={...s,paidFares:1,transferUntil:s.minutes+120};assert.equal(fareFor(tapped),0); // within transfer
 assert.equal(fareFor({...tapped,minutes:s.minutes+130}),330); // transfer expired after 2 hours
 assert.equal(fareFor({...s,paidFares:47}),0); // monthly cap reached
});

test('critical needs have consequences: urgent bathroom tanks hygiene, sustained starvation makes you unwell',()=>{
 const s=fresh();s.needs.bladder=0;const hy=s.needs.hygiene;advanceLife(s,10);assert.ok(s.needs.hygiene<=hy-10,'urgent bathroom hits hygiene');
 const s2=fresh();s2.needs.hunger=0;s2.life.illUntil=0;advanceLife(s2,240);assert.ok(s2.life.illUntil>s2.minutes,'a few critical hours make you ill');
 const s3=fresh();const e=s3.needs.energy;advanceLife(s3,120);assert.ok(s3.needs.energy<e,'needs still decay normally');
});

test('walk estimates use real OSM distance and grow with distance',()=>{
 const s=fresh();s.location='queen';s.position=entrance(placeById('queen'));
 const near=realWalkInfo(s,placeGeo('home')),far=realWalkInfo(s,placeGeo('nylibrary'));
 assert.ok(near&&far&&far.minutes>near.minutes&&far.metres>near.metres);
});

test('trip planner default exit is the stop nearest the destination, not Union',()=>{
 assert.notEqual(nearestStop(entrance(placeById('nylibrary'))).id,'union');
 assert.notEqual(nearestStop(entrance(placeById('bluffs'))).id,'union');
 assert.equal(nearestStop(entrance(placeById('waterfront'))).id,'harbour'); // downtown lake destination
});

test('Pearson is labelled as outside Toronto (Mississauga)',()=>{
 assert.match(placeById('airport').name,/Mississauga/);
});

test('newcomer may apply before a SIN, but cannot start a paid shift until the SIN errand is done (#5)',()=>{
 const s=newGame({type:'start',name:'NC',path:'newcomer'});s.life.documents=['phone'];s.life.resume=true;
 assert.doesNotThrow(()=>applyCommand(s,{type:'apply',id:'barista'},1000,.5),'applying needs no SIN');
 const w=newGame({type:'start',name:'NC',path:'newcomer'});w.job='barista';w.life.documents=['phone','bank'];
 assert.throws(()=>applyCommand(w,{type:'work'},1000,.5),/SIN/,'work is blocked without a SIN');
 const ok=newGame({type:'start',name:'NC',path:'newcomer'});ok.job='barista';ok.life.documents=['sin','bank','phone'];
 try{applyCommand(ok,{type:'work'},1000,.5);}catch(e){assert.ok(!/SIN/.test(e.message),'no SIN block once the SIN is done');}
});

test('newcomer temporary stay is consistent: the next-charge date is the stay end, charged once (#6)',()=>{
 const s=newGame({type:'start',name:'NC',path:'newcomer'});
 assert.equal(s.life.housing.type,'temporary');
 assert.equal(s.life.housing.nextRent,s.life.housing.temporaryUntil,'next charge date equals the prepaid stay end');
 const before=s.cash,until=s.life.housing.temporaryUntil;s.job='';
 advanceLife(s,(until-s.minutes)+120); // cross the stay end
 assert.equal(s.life.housing.type,'room','placed in a room when the prepaid stay ends');
 assert.equal(s.cash,before-ECONOMY.housing.room,'charged once for the room placement, no phantom monthly rent');
});
