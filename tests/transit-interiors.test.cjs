const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const dest=path.resolve(__dirname,'../work/transit-interiors-test');fs.mkdirSync(dest,{recursive:true});fs.writeFileSync(dest+'/package.json','{"type":"commonjs"}');
for(const f of fs.readdirSync(path.resolve(__dirname,'../lib/game')).filter(f=>f.endsWith('.ts')))fs.writeFileSync(dest+'/'+f.replace('.ts','.js'),ts.transpileModule(fs.readFileSync(path.resolve(__dirname,'../lib/game',f),'utf8'),{compilerOptions:{esModuleInterop:true,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText);
const e=require(dest+'/engine.js'),t=require(dest+'/transit-interiors.js'),i=require(dest+'/interiors.js'),ttc=require(dest+'/transit.js'),p=require(dest+'/popup.js'),w=require(dest+'/world.js');
let now=100000;
const act=(s,type,id,extra={})=>e.applyCommand(s,{type,id,...extra},now,.5).state;
const use=(s,id)=>{s=act(s,'transit_use',id);if(s.transit?.movement){now=s.transit.movement.startedAt+s.transit.movement.seconds*1000+1;s=act(s,'transit_arrive')}return s};
const start=(from,to)=>{let s=e.newGame({name:'Transit tester'});s.position=ttc.stopById(from).point;s.location='';return act(s,'transit',to,{mode:'playable'})};
const board=s=>{if(s.transit.stage==='entrance')s=use(s,'gate');now=Math.max(now,s.transit.readyAt+1);s=use(s,'board');if(!s.transit.validated)s=use(s,'reader');return use(s,'seat-0')};
const finish=s=>{let count=0;while(s.transit&&count++<150){const t=s.transit;if(t.stage==='entrance'||t.stage==='platform'||t.stage==='boarding'){s=board(s);continue}if(t.stage==='riding'){now=Math.max(now,t.readyAt+1);s=act(s,'transit_tick');continue}if(t.stage==='arrival'){if(t.departAt!=null){now=Math.max(now,t.departAt+1);s=act(s,'transit_tick');continue}if(t.mode!=='subway')s=use(s,'request');s=use(s,'door');continue}if(t.stage==='exit')s=use(s,'street');}assert.ok(count<150);return s};
test('subway requires gate tap, platform wait, boarding, seat/stand, request and station exit',()=>{let s=start('nyc','sheppard'),cash=s.cash;assert.equal(s.transit.stage,'entrance');assert.equal(s.cash,cash);assert.throws(()=>act(s,'transit_use','board'),/object/);s=use(s,'gate');assert.equal(s.cash,cash-330);assert.equal(s.paidFares,1);assert.throws(()=>act(s,'transit_tick'),/Still/);now=s.transit.readyAt+1;s=use(s,'board');assert.equal(s.transit.stage,'boarding');s=use(s,'stand');assert.equal(s.transit.stage,'riding');assert.throws(()=>act(s,'work'),/transit objects/);s=use(s,'door');assert.equal(s.transit.stage,'riding');now=s.transit.readyAt+1;s=act(s,'transit_tick');assert.equal(s.transit.stage,'arrival');assert.equal(t.transitObjects(s.transit).some(o=>o.id==='request'),false);s=use(s,'door');assert.equal(s.transit.stage,'exit');s=use(s,'street');assert.equal(s.transit,undefined);assert.deepEqual(s.position,ttc.stopById('sheppard').point)});
test('all surface modes board, charge at reader, retain name/state through reload, seat and exit at stop',()=>{for(const [from,to,mode]of [['queenwest','queen','streetcar'],['kennedy','stc','bus'],['union','harbour','streetcar']]){let s=start(from,to),cash=s.cash;assert.equal(s.transit.mode,mode);assert.equal(s.cash,cash);now=s.transit.readyAt+1;s=use(s,'board');assert.equal(s.transit.stage,'boarding');s=use(s,'seat-0');assert.equal(s.transit.stage,'boarding');assert.equal(s.cash,cash);s=use(s,'reader');assert.equal(s.cash,cash-330);s=use(s,'seat-0');assert.equal(s.transit.seat,'seat-0');s=e.migrateState(JSON.parse(JSON.stringify(s)));assert.equal(s.name,'Transit tester');assert.equal(s.transit.seat,'seat-0');s=finish(s);assert.deepEqual(s.position,ttc.stopById(to).point);assert.equal(s.cash,cash-330)}});
test('mixed routes retain correct vehicles at transfers and one fare, with route elapsed minutes',()=>{let s=start('queenwest','donmills'),before=s.minutes,cash=s.cash,expected=ttc.transitRoute('queenwest','donmills').minutes;s=finish(s);assert.equal(s.minutes-before,expected);assert.equal(s.cash,cash-330);assert.equal(s.paidFares,1);assert.equal(s.tripCount,3);assert.deepEqual(s.position,ttc.stopById('donmills').point)});
test('early arrival is rejected, walking survives reload and no outside action teleports a passenger',()=>{let s=start('finch','union');s=act(s,'transit_use','gate');assert.throws(()=>act(s,'transit_arrive'),/Still walking/);s=e.migrateState(JSON.parse(JSON.stringify(s)));assert.ok(s.transit.movement);for(const cmd of ['walk','fast','rest','enter_cafe'])assert.throws(()=>act(s,cmd,'queen'),/transit objects/)});
test('subway→bus transfer in a station paid area skips the reader, charging one fare',()=>{
 // bloor →(Line 2 subway)→ broadview →(east bus) ey: the transfer stop is a subway station, so no second tap.
 let s=start('bloor','ey'),cash=s.cash;assert.equal(s.transit.mode,'subway');
 s=use(s,'gate');assert.equal(s.cash,cash-330);now=s.transit.readyAt+1;s=use(s,'board');s=use(s,'seat-0');
 // ride the subway (doors auto-open at the transfer), then step off at the paid-area transfer.
 let guard=0;while(s.transit.mode==='subway'&&guard++<40){const tr=s.transit;if(tr.stage==='riding'){now=Math.max(now,tr.readyAt+1);s=act(s,'transit_tick');}else if(tr.stage==='arrival'){if(tr.departAt!=null){now=Math.max(now,tr.departAt+1);s=act(s,'transit_tick');}else s=use(s,'door');}else break;}
 assert.equal(s.transit.mode,'bus');assert.equal(s.transit.paidArea,true);assert.equal(s.transit.stage,'platform');
 // board the bus with no reader tap and still one fare charged.
 now=s.transit.readyAt+1;s=use(s,'board');assert.equal(s.transit.validated,true);assert.equal(s.transit.stage,'boarding');assert.equal(s.cash,cash-330);
 s=use(s,'seat-0');assert.equal(s.transit.stage,'riding');assert.equal(s.cash,cash-330)});
test('tapping the gate reports the fare, and a within-transfer tap reports $0',()=>{
 let s=start('nyc','sheppard'),cash=s.cash;const msg=e.applyCommand(s,{type:'transit_use',id:'gate'},now,.5);assert.match(msg.message,/Fare · \$3\.30/);
 s=msg.state;now=s.transit.movement.startedAt+s.transit.movement.seconds*1000+1;s=act(s,'transit_arrive');assert.equal(s.cash,cash-330)});
test('poor passengers can return outside, transfer/cap are free and taps cannot double-charge',()=>{let s=start('nyc','union');s.cash=0;s=use(s,'gate');assert.equal(s.transit.paid,false);s=use(s,'street');assert.equal(s.transit,undefined);s=start('nyc','union');s.paidFares=47;s.cash=-100;s=use(s,'gate');assert.equal(s.transit.paid,true);assert.equal(s.cash,-100);s=start('queenwest','queen');s.paidFares=1;s.transferUntil=s.minutes+100;now=s.transit.readyAt+1;s=use(s,'board');const before=s.cash;s=use(s,'reader');assert.equal(s.cash,before);assert.throws(()=>act(s,'transit_use','reader'),/object/)});
test('every transit object can be reached around seats and platform barriers; gate cannot be bypassed',()=>{for(const stage of ['entrance','platform','boarding','riding','arrival','exit']){const s=start('nyc','sheppard'),tr=s.transit;tr.stage=stage;tr.paid=false;const layout=t.transitLayout(tr),objects=t.transitObjects(tr);for(const a of objects)for(const b of objects){const route=i.interiorPath(a.use,b.use,layout);for(let n=1;n<route.length;n++)assert.ok(i.interiorSegment(route[n-1],route[n],layout))}if(stage==='entrance')assert.throws(()=>i.interiorPath([0,5],[0,-5],layout),/route/)}});
test('popup placements avoid the actor on desktop and 390px, even near safe edges',()=>{for(const width of [390,1440])for(const x of [30,width/2,width-30])for(const y of [190,350,510]){const safe={x:8,y:150,width:width-16,height:450},player={x:x-25,y:y-40,width:50,height:90},box=p.popupPlacement({x,y},width===390?230:250,120,safe,player);assert.ok(box);assert.equal(p.overlaps(box,player),false);assert.ok(box.x>=8&&box.x+box.width<=width-8);assert.ok(box.y>=150&&box.y+box.height<=600)}});
test('cafe status follows order, payment, seating, eating and finished seating',()=>{const c={kind:'cafe',position:[0,0],tier:'room',place:'queen'};assert.match(i.cafeStatus(c),/Order at/);c.order={item:'meal',paid:false};assert.match(i.cafeStatus(c),/Pay/);c.order.paid=true;assert.match(i.cafeStatus(c),/Choose a seat/);c.seat='seat-a';assert.match(i.cafeStatus(c),/Ready to eat/);delete c.order;c.pose={object:'seat-a',action:'eat',until:2000};assert.match(i.cafeStatus(c,1000),/Enjoying/);assert.match(i.cafeStatus(c,3000),/Relaxing/)});
test('CN tower base and adjacent dome stay inside their block clear of sidewalk paths',()=>{const c=w.placeById('cn');for(let a=0;a<Math.PI*2;a+=.02){const tower=[c.x+Math.cos(a)*3,c.z+Math.sin(a)*3],dome=[c.x-5+Math.cos(a)*5.2,c.z-.5+Math.sin(a)*5.2*.75];for(const point of [tower,dome]){assert.ok(Math.abs(point[0]-w.sidewalk(point[0]))>.8);assert.ok(Math.abs(point[1]-w.sidewalk(point[1]))>.8)}}});
test('selected bus origin is retained, validated and never silently replaced',()=>{
 let s=e.newGame({name:'Bus rider'});s.position=ttc.stopById('kennedy').point;
 let r=act(s,'transit','stc',{mode:'playable',origin:'kennedy'});assert.equal(r.transit.origin,'kennedy');assert.equal(r.transit.mode,'bus');
 assert.throws(()=>act(s,'transit','stc',{mode:'playable',origin:'nyc'}),/Walk to/);
 assert.throws(()=>act(s,'transit','stc',{mode:'playable',origin:'missing'}),/boarding stop/);
});
test('every bus connector boards through a sidewalk approach and completes the physical ride',()=>{
 for(const line of ttc.LINES.filter(l=>l.mode==='bus')){
  const from=line.stops[0],to=line.stops[1];let s=start(from,to);assert.equal(s.transit.mode,'bus');
  const tr=s.transit,layout=t.transitLayout(tr),door=t.transitObjects(tr).find(o=>o.id==='board');
  const path=i.interiorPath(tr.position,door.use,layout);assert.ok(path.every(p=>p[0]<4.25));
  for(const x of [4.5,5.5])assert.throws(()=>i.interiorPath(tr.position,[x,0],layout),/floor|route/);
  const before=s.cash;s=finish(s);assert.equal(s.transit,undefined);assert.deepEqual(s.position,ttc.stopById(to).point);assert.equal(s.cash,before-330);
 }
});
test('a rider can step off the parked bus, including after a refused fare, then reboard without double charging',()=>{
 let s=start('kennedy','stc');s.cash=0;now=s.transit.readyAt+1;s=use(s,'board');s=use(s,'reader');assert.equal(s.transit.validated,false);s=use(s,'door');assert.equal(s.transit.stage,'platform');s=use(s,'street');assert.equal(s.transit,undefined);
 s=start('kennedy','stc');let cash=s.cash;now=s.transit.readyAt+1;s=use(s,'board');s=use(s,'reader');assert.equal(s.cash,cash-330);s=use(s,'door');s=use(s,'board');s=use(s,'reader');assert.equal(s.cash,cash-330);s=use(s,'stand');assert.equal(s.transit.stage,'riding');s=finish(s);assert.equal(s.cash,cash-330);
});
test('bus entry waits for the approach to finish and saved approaches resume at the front door',()=>{
 let s=start('kennedy','stc');now=s.transit.readyAt+1;s=act(s,'transit_use','board');assert.equal(s.transit.stage,'platform');assert.ok(s.transit.movement);assert.throws(()=>act(s,'transit_arrive'),/Still walking/);
 s=e.migrateState(JSON.parse(JSON.stringify(s)));now=s.transit.movement.startedAt+s.transit.movement.seconds*1000+1;s=act(s,'transit_arrive');assert.equal(s.transit.stage,'boarding');assert.equal(s.transit.validated,false);assert.equal(s.name,'Transit tester');
});
test('older surface saves in the roadway migrate onto the sidewalk without changing fare or destination',()=>{
 let s=start('kennedy','stc');s.transit.layoutVersion=2;s.transit.position=[5.5,0];s.transit.movement={path:[[5.5,0],[5.5,4]],seconds:4,startedAt:now};s.transit.paid=true;s=e.migrateState(JSON.parse(JSON.stringify(s)));assert.ok(i.insideWalkable(s.transit.position,t.transitLayout(s.transit)));assert.ok(s.transit.position[0]<4.25);assert.equal(s.transit.movement,undefined);assert.equal(s.transit.paid,true);assert.equal(s.transit.destination,'stc');
});
test('overlapping stop approach radii use the chosen stop even when another is nearer',()=>{
 let s=e.newGame({name:'Selected stop'});const chosen=ttc.stopById('queenyonge');s.position=[chosen.point[0]+2.5,chosen.point[1]];assert.equal(ttc.nearestStop(s.position).id,'queen');
 s=act(s,'transit','queen',{origin:'queenyonge',mode:'playable'});assert.equal(s.transit.origin,'queenyonge');assert.equal(s.transit.mode,'streetcar');
});
test('overnight replacement uses a bus stop, PRESTO reader, seat and requested exit',()=>{
 let s=e.newGame({name:'Night rider'});s.minutes=180;s.position=ttc.stopById('nyc').point;s=act(s,'transit','sheppard',{origin:'nyc',mode:'playable'});assert.equal(s.transit.mode,'bus');assert.equal(s.transit.stage,'platform');const minutes=s.minutes;s=finish(s);assert.equal(s.transit,undefined);assert.ok(s.minutes>=minutes+20);assert.deepEqual(s.position,ttc.stopById('sheppard').point);
});
