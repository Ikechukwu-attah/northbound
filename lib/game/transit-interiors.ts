import {transitSeats,TRANSIT_POLES} from './transit-kit';
import type {GameState,Command} from './engine';
import {fareFor} from './engine';
import {advanceLife} from './life';
import {FARE,LINES,nearestStop,stopById,transitRoute,serviceOpen,fareMonth,type Leg} from './transit';
import {distance,pathLength,pointAlong,districtAt,nearbyPlace,type Point} from './world';
import {interiorPath,interiorSegment,insideWalkable,type HomeLayout} from './interiors';
export type TransitState={layoutVersion?:number;origin:string;destination:string;legs:Leg[];index:number;stage:'entrance'|'platform'|'boarding'|'riding'|'arrival'|'exit';mode:'subway'|'bus'|'streetcar';night:boolean;paid:boolean;validated?:boolean;requested:boolean;paidArea?:boolean;departAt?:number;readyAt:number;position:Point;seat?:string;movement?:{path:Point[];startedAt:number;seconds:number;object?:string}};
export type TransitObject={id:string;label:string;point:Point;use:Point};
export const inVehicle=(t:TransitState)=>['boarding','riding','arrival'].includes(t.stage);
export const transitStop=(t:TransitState)=>stopById(t.stage==='exit'?t.legs[t.index].to:t.legs[t.index].from)!;
const modeFor=(t:TransitState)=>t.night?'bus':LINES.find(l=>l.id===t.legs[t.index].line)!.mode;
/** Car sign / platform label: the current station while stopped, the next while moving. */
export const boardSign=(t:TransitState)=>({label:t.stage==='riding'?'NEXT STOP':'AT STOP',name:stopById(['riding','arrival','exit'].includes(t.stage)?t.legs[t.index].to:t.legs[t.index].from)!.name});
/** This arrival is the rider's own stop (destination or line transfer), not a brief pass-through. */
const isHoldStop=(t:TransitState)=>t.index===t.legs.length-1||t.legs[t.index+1]?.line!==t.legs[t.index].line||(t.mode!=='subway'&&t.requested);
/** A subway station is a fare-paid area: buses there can be boarded without re-tapping. */
const isSubwayStop=(id:string)=>LINES.some(l=>l.mode==='subway'&&l.stops.includes(id));
export function transitObjects(t:TransitState):TransitObject[]{
 if(t.stage==='entrance')return [{id:'gate',label:'Tap PRESTO · Enter platform',point:[0,-2],use:[0,0]},{id:'street',label:'Return to street',point:[0,6.5],use:[0,5.5]}];
 if(t.stage==='platform')return [{id:'board',label:'Board '+(t.mode==='subway'?'train':t.mode),point:[3,-2],use:[1.5,-2]},{id:'street',label:'Exit to street',point:[0,6.5],use:[0,5.5]}];
 if(t.stage==='exit')return [{id:'street',label:'Walk out of station',point:[0,6.5],use:[0,5.5]}];
 const sub=t.mode==='subway';
 return [...(!t.validated?[{id:'reader',label:'Tap card · Fare $'+(FARE.adult/100).toFixed(2),point:[1.8,6.6] as Point,use:[.3,6] as Point}]:[]),
 ...[-3,0,3].map((z,n)=>({id:'seat-'+n,label:'Sit here',point:[-2,z] as Point,use:[-.6,z] as Point})),
 {id:'stand',label:'Stand · Hold rail',point:[1,1] as Point,use:[0,1] as Point},
 ...(sub?[]:[{id:'request',label:t.requested?'Stop requested':'Request stop / exit',point:[1.8,-4.5] as Point,use:[.4,-4.5] as Point}]),
 {id:'door',label:t.stage==='arrival'?'Exit at '+stopById(t.legs[t.index].to)!.name:sub?'Exit door · opens at the stop':'Exit door · wait for stop',point:[2.8,5] as Point,use:[.7,5] as Point}];
}
export function transitLayout(t:TransitState):HomeLayout{
 const vehicle=inVehicle(t),objects=vehicle?transitSeats(t.mode).map((seat,n)=>({...seat,id:'chair'+n,kind:'chair' as const})):[{id:'platform-bench',kind:'chair' as const,x:-4,z:0,width:1.4,depth:3}];
 return {tier:'room',width:vehicle?6:12,depth:vehicle?18:14,door:[0,5.5],doors:[],objects,walls:vehicle?[...TRANSIT_POLES.map(([x,z])=>({x,z,width:.08,depth:.08})),...(t.mode!=='subway'?[{x:-1.5,z:7.7,width:1.1,depth:1.1}]:[])]:t.stage==='entrance'?[{x:0,z:-2,width:12,depth:.7}]:[{x:4.4,z:-2,width:.3,depth:9}],bathroom:{x:0,z:0,width:0,depth:0},palette:{floor:'#aaa99e',wall:'#e4e2d7',accent:'#da291c'}};
}
export function transitPosition(t:TransitState,now=Date.now()):Point{return t.movement?pointAlong(t.movement.path,Math.max(0,Math.min(1,(now-t.movement.startedAt)/(t.movement.seconds*1000)))):t.position;}
export function transitStatus(t:TransitState,now=Date.now()){
 if(t.movement)return 'Walking to '+(transitObjects(t).find(o=>o.id===t.movement?.object)?.label||'your spot')+'…';
 if(t.stage==='entrance')return 'Walk to the fare gate and tap your card';
 if(t.stage==='platform')return now<t.readyAt?'Wait behind the yellow line · '+(t.mode==='subway'?'Train':'Vehicle')+' arriving…':'Doors open · Walk over to board';
 if(t.stage==='boarding')return 'At '+stopById(t.legs[t.index].from)!.name+' · '+(t.validated?'Choose a seat or stand at the rail':'Tap your card at the reader');
 if(t.stage==='exit')return 'Off the train · Walk through the exit to the street';
 if(t.stage==='arrival'){const name=stopById(t.legs[t.index].to)!.name;if(t.departAt!=null)return 'At '+name+' · Doors open';return t.mode==='subway'||t.requested?'At '+name+' · Doors open · Walk to exit':'At '+name+' · Press the request strip to open the doors';}
 return 'Next stop: '+stopById(t.legs[t.index].to)!.name+(t.requested?' · Stop requested':t.seat?' · Seated':' · Standing');
}
/** Charges at most one fare per journey; returns the rider-facing fare line. */
function tap(s:GameState,t:TransitState){if(t.paid)return 'Transfer · $0';const cost=fareFor(s);if(cost>s.cash&&cost>0)throw new Error('Not enough money to tap. Exit to the street or use an active transfer.');s.cash-=cost;if(s.fareMonth!==fareMonth(s.minutes)){s.fareMonth=fareMonth(s.minutes);s.paidFares=0;}if(cost){s.paidFares++;s.transferUntil=s.minutes+FARE.transferMinutes;}t.paid=true;return cost>0?'Fare · $'+(cost/100).toFixed(2):'Transfer · $0';}
/** Preview the fare the next tap will charge, for the walk-over toast. */
const farePreview=(s:GameState,t:TransitState)=>t.paid?'Transfer · $0':fareFor(s)>0?'Fare · $'+(fareFor(s)/100).toFixed(2):'Transfer · $0';
function leave(s:GameState,at:string){const stop=stopById(at)!;s.position=stop.point;s.district=districtAt(stop.point);s.location=nearbyPlace(stop.point)?.id||'';if(!s.visited.includes(s.district))s.visited.push(s.district);s.bike=s.bike||s.visited.length>=3;delete s.transit;return 'Outside '+stop.name+'.';}
function operate(s:GameState,id:string,now:number){
 const t=s.transit!,o=transitObjects(t).find(o=>o.id===id);if(!o||distance(t.position,o.use)>.65)throw new Error('Walk to the transit object first.');
 if(id==='street')return leave(s,transitStop(t).id);
 if(id==='gate'){const fare=tap(s,t);t.validated=true;t.stage='platform';t.position=[0,4];t.readyAt=now+2500;return fare+' · Card accepted. Follow the platform to the train.';}
 if(id==='board'){
  if(now<t.readyAt)throw new Error('Wait behind the yellow line until the vehicle doors open.');
  t.stage='boarding';t.validated=t.mode==='subway'||!!t.paidArea;t.position=[.5,6];delete t.seat;return t.validated?(t.paidArea&&t.mode!=='subway'?'Boarded in the fare-paid area — no tap needed. ':'Boarded. ')+'Choose a seat or the standing rail.':'Boarded. Tap at the green reader by the door.';
 }
 if(id==='reader'){const fare=tap(s,t);t.validated=true;return fare+' · Choose a seat or stand at the rail.';}
 if(id.startsWith('seat-')||id==='stand'){
  if(!t.validated)throw new Error('Tap your card at the reader first.');
  t.seat=id==='stand'?undefined:id;
  if(t.stage==='boarding'){t.stage='riding';t.readyAt=now+6000;s.tripCount++;}
  return (t.seat?'Seated. ':'Holding the rail. ')+transitStatus(t,now);
 }
 if(id==='request'){if(t.stage==='boarding')throw new Error('Choose a seat or stand before departure.');t.requested=true;return t.stage==='arrival'?'Exit requested. Doors are open.':'Stop requested for '+stopById(t.legs[t.index].to)!.name+'.';}
 if(id==='door'){
  if(t.stage!=='arrival')throw new Error('The doors stay closed until the stop.');if(t.departAt!=null)throw new Error('This isn’t your stop — the train continues shortly.');if(t.mode!=='subway'&&!t.requested)throw new Error('Press the stop request button first.');
  const at=t.legs[t.index].to,final=t.index===t.legs.length-1,oldMode=t.mode;delete t.seat;delete t.movement;t.requested=false;
  if(final){if(t.mode!=='subway')return leave(s,at);t.stage='exit';t.position=[1.5,-2];return 'On the arrival platform. Walk to the station exit.';}
  const paidArea=isSubwayStop(at);t.index++;t.mode=modeFor(t);t.paidArea=paidArea;
  // Surface → subway: walk into the station and tap at the gate (a transfer is $0), rather than teleporting onto the platform.
  if(t.mode==='subway'&&oldMode!=='subway'){t.validated=false;t.stage='entrance';t.position=[0,5.5];return 'Transfer at '+stopById(at)!.name+'. Enter the station and tap at the gate — your transfer is $0 — for '+LINES.find(l=>l.id===t.legs[t.index].line)!.name+'.';}
  t.stage='platform';t.position=[0,4];t.readyAt=now+2500;return 'Transfer at '+stopById(at)!.name+'. Board '+LINES.find(l=>l.id===t.legs[t.index].line)!.name+(paidArea&&t.mode!=='subway'?' · same fare-paid area, no tap needed':'')+'.';
 }
 throw new Error('Choose a transit object.');
}
/** Authoritative physical journey; normal fast travel and old in-flight saves remain compatible. */
export function transitInteriorCommand(s:GameState,c:Command,now:number):string|null{
 if(c.type==='transit'&&c.mode==='playable'){
  if(s.interior)throw new Error('Exit your home or café first.');if(s.journey||s.transit)throw new Error('Finish your journey first.');const from=nearestStop(s.position),to=stopById(c.id||'');if(distance(s.position,from.point)>3)throw new Error('Walk to '+from.name+' first.');if(!to)throw new Error('Choose an exit stop.');const route=transitRoute(from.id,to.id),night=!serviceOpen(s.minutes);delete s.life.restSeat;
  const t:TransitState={layoutVersion:2,origin:from.id,destination:to.id,legs:route.legs,index:0,stage:'entrance',mode:'subway',night,paid:false,requested:false,readyAt:now+2500,position:[0,5.5]};t.mode=modeFor(t);if(t.mode!=='subway')t.stage='platform';s.transit=t;return transitStatus(t,now);
 }
 const t=s.transit;if(!t){if(c.type.startsWith('transit_'))throw new Error('Enter a station or board at a stop first.');return null;}
 if(c.type==='transit_tick'){
  // Pull into every station: riding → brief arrival (doors open). Pass-through stops depart on the next tick; the rider's own stop (destination/transfer) holds for them to get off.
  if(t.stage==='riding'){
   if(now<t.readyAt)throw new Error('Still travelling to the next stop.');
   advanceLife(s,t.legs[t.index].minutes+(t.night&&t.index===0?20:0));
   t.stage='arrival';if(isHoldStop(t))delete t.departAt;else t.departAt=now+2200;
   return transitStatus(t,now);
  }
  if(t.stage==='arrival'){
   if(t.departAt==null||now<t.departAt)throw new Error('Doors are open at this stop.');
   delete t.departAt;t.index++;t.stage='riding';t.readyAt=now+6000;return transitStatus(t,now);
  }
  throw new Error('Still travelling to the next stop.');
 }
 if(c.type==='transit_arrive'){
  const m=t.movement;if(!m)throw new Error('There is no transit walk.');if(now<m.startedAt+m.seconds*1000)throw new Error('Still walking inside.');t.position=m.path[m.path.length-1];delete t.movement;
  if(m.object){try{return operate(s,m.object,now)}catch(e){return e instanceof Error?e.message:'Choose the object again.';}}return transitStatus(t,now);
 }
 if(c.type==='transit_use'||c.type==='transit_walk'){
  if(t.movement)throw new Error('Finish walking inside first.');const o=transitObjects(t).find(o=>o.id===c.id);if(c.type==='transit_use'&&!o)throw new Error('Choose a transit object.');const target=o?.use||c.point;if(!target||!Array.isArray(target)||target.length!==2)throw new Error('Choose clear floor space.');
  const path=interiorPath(t.position,target,transitLayout(t));if(pathLength(path)<.1&&o)return operate(s,o.id,now);delete t.seat;t.movement={path,startedAt:now,seconds:Math.max(.2,pathLength(path)/2.8),object:o?.id};
  return o?.id==='gate'||o?.id==='reader'?farePreview(s,t):o?'Walking to '+o.label.replace(/ ·.*$/,'')+'…':'Walking to that spot…';
 }
 if(c.type==='appearance')return null;
 throw new Error('Use the transit objects, then exit at a stop before doing that.');
}

/** Added seat rows must not leave an older save inside furniture or following an obsolete route. */
export function migrateTransitInterior(s:GameState){const t=s.transit;if(!t||t.layoutVersion===2)return;const layout=transitLayout(t),path=t.movement?.path;const blocked=!insideWalkable(t.position,layout)||path?.some((p,n)=>n>0&&!interiorSegment(path[n-1],p,layout));if(blocked){t.position=inVehicle(t)?[.5,6]:t.stage==='entrance'?[0,5.5]:[0,4];delete t.movement;delete t.seat;}t.layoutVersion=2;}
