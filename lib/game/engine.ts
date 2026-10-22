import {transitInteriorCommand,migrateTransitInterior,type TransitState} from './transit-interiors';
import {interiorCommand,enterHome,migrateInterior,type InteriorState} from './interiors';
import {nearestRestSeat,seatInCell,type RestSeat} from './seating';
import {initialCommunity,communityAction,type CommunityState} from './activities';
import {initialLife,advanceLife,lifeAction,ECONOMY,PATHS,requireNeeds,emptyBank,type LifeState,type PathId} from './life';
import {type Appearance} from './characters';
import { PEOPLE,type DistrictId,type Need } from './data';
import {placeById,entrance,walkingPath,walkMinutes,pathLength,pointAlong,distance,onSidewalk,onFootpath,districtAt,nearbyPlace,snapPoint,nearestPlace,isBankPlace,JOB_PLACES,PERSON_PLACES,type Point} from './world';
import {placeGeo,stopGeo,haversineMetres} from './geo';
import {FARE,STOPS,stopById,nearestStop,transitRoute,fareMonth,serviceOpen,LINES} from './transit';
export type Journey={kind:'walk'|'bike'|'transit'|'fast';path:Point[];startedAt:number;seconds:number;minutes:number;label:string;detail:string;destination?:string;waitSeconds:number;vehicleMode?:'bus'|'streetcar'|'subway';restSeat?:RestSeat;enterHome?:boolean;enterCafe?:boolean;enterBank?:boolean};

export type GameState={version:4;transit?:TransitState;interior?:InteriorState;doorExitUntil?:number;social?:{householdId?:string;lastMeetDay?:string};community:CommunityState;life:LifeState;position:Point;visitedPlaces:string[];journey:Journey|null;transferUntil:number;fareMonth:string;paidFares:number;tripCount:number;bike:boolean;name:string;color:string;skin:string;district:DistrictId;location:string;cash:number;wallet:number;earned:number;minutes:number;needs:Record<Need,number>;job:string;shifts:number;skill:number;home:'room'|'apartment';visited:DistrictId[];friends:Record<string,number>;log:{text:string;day:number}[];rewards:string[]};
export type Command={type:string;progress?:number;id?:string;origin?:string;name?:string;color?:string;skin?:string;point?:Point;mode?:string;amount?:number;path?:PathId;appearance?:Partial<Appearance>};
export const COLORS=['#ce7551','#4f7f72','#6f86a4','#9b799c','#d7a44c'];
export const SKINS=['#e3b88e','#b87e56','#764a35','#f1d3b5'];
// Real OSM anchors determine simulated metres; the compressed mesh determines rendering.
export const anchorFrom=(s:GameState):Point|null=>{const stop=nearestStop(s.position);if(distance(s.position,stop.point)<.1)return stopGeo(stop.id);return placeGeo(s.location)||placeGeo(nearestPlace(s.position).id);};
export function realWalkInfo(s:GameState,to:Point|null,bike=false):{metres:number;minutes:number}|null{const from=anchorFrom(s);if(!from||!to)return null;const metres=haversineMetres(from,to);return {metres,minutes:Math.max(1,Math.ceil(metres/(bike?250:80)))*(!bike&&s.needs.energy<20?2:1)};}
export function travelEstimate(s:GameState,target:Point,id?:string,bike=false){const path=walkingPath(s.position,target);const real=realWalkInfo(s,id?.startsWith('stop:')?stopGeo(id.slice(5)):id?placeGeo(id):null,bike);return {path,metres:real?.metres??pathLength(path)*40,minutes:real?.minutes??walkMinutes(path,bike,s.needs.energy),slowed:!bike&&s.needs.energy<20};}
export function newGame(c:Command):GameState{
 if(c.path&&!PATHS.some(p=>p.id===c.path))throw new Error('Choose a valid starting path.');
 const name=(c.name||'').trim();if(!name||name.length>22)throw new Error('Choose a name between 1 and 22 characters.');
 const s={version:4,community:initialCommunity(),position:entrance(placeById('queen')!),visitedPlaces:['queen','home'],journey:null,transferUntil:0,fareMonth:fareMonth(540),paidFares:0,tripCount:0,bike:false,name,color:COLORS.includes(c.color||'')?c.color!:COLORS[0],skin:SKINS.includes(c.skin||'')?c.skin!:SKINS[1],district:'toronto',location:'queen',cash:ECONOMY.startingCash.legacy,wallet:0,earned:0,minutes:540,needs:{energy:90,hunger:75,fun:80,social:65,hygiene:90,bladder:90},job:'barista',shifts:0,skill:0,home:'room',visited:['toronto'],friends:{},log:[{text:'Welcome to Toronto.',day:1}],rewards:[]} as unknown as GameState; s.life=initialLife(s,c.path||'local',c.appearance);s.skin=s.life.appearance.skin;s.color=s.life.appearance.color;return s;
}
export function day(s:GameState){return Math.floor(s.minutes/1440)+1;}
function log(s:GameState,text:string){s.log=[{text,day:day(s)},...s.log].slice(0,50);}
function spend(s:GameState,cost:number){if(cost>0&&s.cash<cost)throw new Error('You need a little more money. Pick up a shift or try a free activity.');s.cash-=cost;}
function advance(s:GameState,m:number){advanceLife(s,m);}
function boost(s:GameState,n:Partial<Record<Need,number>>){for(const k of Object.keys(n) as Need[])s.needs[k]=Math.min(100,s.needs[k]+n[k]!);}
function checkGoals(s:GameState){const notifications:string[]=[];const goals=[['shift',s.shifts>=1,'First shift recorded'],['explore',s.visited.length>=3,'City explorer — community bicycle unlocked'],['friends',Object.values(s.friends).some(v=>v>=3),'A familiar face'],['home',s.home==='apartment','A place of your own']] as const;for(const [id,ok,title] of goals)if(ok&&!s.rewards.includes(id)){s.rewards.push(id);log(s,'Milestone: '+title);notifications.push('Milestone: '+title);}return notifications;}

export function migrateState(value:unknown):GameState{
 const old=structuredClone(value) as GameState;
 if((old.version as number)===1){const p=placeById(old.location)||placeById('queen')!;Object.assign(old,{version:2,position:entrance(p),district:p.district,location:p.id,visitedPlaces:Array.from(new Set([p.id,'home'])),journey:null,transferUntil:0,fareMonth:fareMonth(old.minutes),paidFares:0,tripCount:0,bike:old.visited.length>=3});}
 if(!old.life)old.life=initialLife(old,'legacy',undefined,true);
 if((old.version as number)<4){old.skill=PATHS.find(p=>p.id===old.life.path)?.skill||0;old.life.trainingHours=0;old.life.trainingStart=Math.floor(old.minutes/1440);old.position=onFootpath(old.position)?old.position:snapPoint(old.position);if(old.journey){const j=old.journey,end=snapPoint(j.path[j.path.length-1]);if(j.kind==='walk'||j.kind==='bike')j.path=walkingPath(old.position,end);else{const stop=STOPS.find(p=>p.name===j.label);j.path[j.path.length-1]=stop?.point||end;}}old.district=districtAt(old.position);old.location=nearbyPlace(old.position)?.id||'';old.log.unshift({text:'Save updated: skill reset to your starting path; new sidewalk, needs and training rules now apply. Savings and story retained.',day:day(old)});}
 if(old.life.restSeat){const seat=old.life.restSeat;old.life.restSeat=seatInCell(Math.floor(seat.access[0]/24),Math.floor(seat.access[1]/24));}
 old.community??=initialCommunity();if(typeof old.wallet!=='number')old.wallet=0;if(old.life){old.life.bank=Object.assign(emptyBank(),old.life.bank||{});if(!old.life.bank.debit)old.life.bank.debit=old.life.documents.includes('bank');}migrateInterior(old);migrateTransitInterior(old);old.version=4;return old;
}
export function isNear(s:GameState,id:string){if(id==='bank'&&s.interior?.kind==='bank')return true;const p=placeById(id);return !s.transit&&!s.journey&&!!p&&distance(s.position,entrance(p))<=3;}
function requirePlace(s:GameState,id:string){if(!isNear(s,id))throw new Error(`Walk to ${placeById(id)?.name||'the location'} first. Activities require you to be there.`);}
function settlePosition(s:GameState,p:Point){s.position=p;s.district=districtAt(p);const place=nearbyPlace(p);s.location=place?.id||'';if(place){s.district=place.district;if(!s.visitedPlaces.includes(place.id))s.visitedPlaces.push(place.id);}if(!s.visited.includes(s.district))s.visited.push(s.district);s.bike=s.bike||s.visited.length>=3;}
export function journeyFraction(j:Journey,now=Date.now()){return Math.max(0,Math.min(1,(now-j.startedAt-j.waitSeconds*1000)/((j.seconds-j.waitSeconds)*1000)));}
export function journeyPosition(j:Journey,now=Date.now()):Point{return pointAlong(j.path,journeyFraction(j,now));}
export function fareFor(s:GameState){const capped=s.fareMonth===fareMonth(s.minutes)&&s.paidFares>=FARE.monthlyCap;const transfer=s.paidFares>0&&s.minutes<s.transferUntil&&s.minutes>=s.transferUntil-FARE.transferMinutes;return capped||transfer?0:FARE.adult;}
export function applyCommand(original:GameState,c:Command,now=Date.now(),roll=Math.random()):{state:GameState;message:string;notifications:string[]}{
 const s=migrateState(original);let message='';const spot=placeById(s.location);
 const transitResult=transitInteriorCommand(s,c,now);if(transitResult!==null){if(!['transit_walk','transit_tick'].includes(c.type))log(s,transitResult);return {state:s,message:transitResult,notifications:[transitResult]};}
 const interiorResult=interiorCommand(s,c,now);if(interiorResult!==null){if(!['interior_walk','interior_cancel'].includes(c.type))log(s,interiorResult);return {state:s,message:interiorResult,notifications:[interiorResult]};}
 if(s.journey&&!['arrive','cancel'].includes(c.type))throw new Error('Finish your journey before taking another action.');
 requireNeeds(s,c);
 const seated=s.life.restSeat;
 if(['walk','visit','transit','fast'].includes(c.type))delete s.life.restSeat;
 const action=communityAction(s,c)??lifeAction(s,c);if(action!==null){log(s,action);const notifications=[action,...checkGoals(s)];return {state:s,message:action,notifications};}
 switch(c.type){
 case 'rest':{
  if(seated){advance(s,60);boost(s,{energy:30,fun:10});message='Another hour of rest on the bench restores your energy.';break;}
  const {seat,path}=nearestRestSeat(s.position);
  const approach=path;
  delete s.life.restSeat;
  s.journey={kind:'walk',path:approach,startedAt:now,seconds:Math.max(1,pathLength(approach)/2),minutes:Math.max(0,Math.ceil(pathLength(approach)/2)),label:'Roadside bench',detail:'Walk to the recessed seat · then rest 1 hour for free',waitSeconds:0,restSeat:seat};
  message='Walking to a nearby bench. The sidewalk stays clear while you rest.';break;
 }
 case 'walk' :case 'visit':{
  const destination=c.id?placeById(c.id):undefined;const stop=c.id?stopById(c.id.replace('stop:','')):undefined;
  const target:Point|undefined=destination?entrance(destination):stop?.point||c.point;
  if(!target||!Array.isArray(target)||target.length!==2||!onFootpath(target))throw new Error('Choose a valid sidewalk, place or stop.');
  const route=walkingPath(s.position,target),path=seated?[seated.point,seated.access,...route.slice(1)]:route,length=pathLength(path),bike=c.mode==='bike';
  if(bike&&(s.needs.energy<20||s.needs.bladder<15))throw new Error('Too exhausted or uncomfortable to cycle. Walk to a bathroom or a place to rest.');
  if(bike&&!s.bike)throw new Error('Explore three districts to unlock the community loan bike.');
  if(length<.1)throw new Error('You are already here.');
  s.journey={kind:bike?'bike':'walk',path,startedAt:now,seconds:Math.max(.3,Math.min(90,length/(bike?12:s.needs.energy<20?3.5:7))),minutes:travelEstimate(s,target,destination?.id||(stop?'stop:'+stop.id:undefined),bike).minutes,label:destination?.name||stop?.name||'Selected sidewalk',detail:bike?'Cycling via connected streets':'Walking via sidewalks and crossings'+(s.needs.energy<20?' · exhausted, walking ~50% slower':''),destination:destination?.id,enterHome:c.mode==='enter-home'&&destination?.id===(s.life.housing.place||'home'),enterCafe:c.mode==='enter-cafe'&&destination?.kind==='cafe',enterBank:c.mode==='enter-bank'&&isBankPlace(destination?.id),waitSeconds:0};message=`${bike?'Cycling':'Walking'} to ${s.journey.label}.`;break;
 }
 case 'transit':case 'fast':{
  const targetPlace=c.type==='fast'?placeById(c.id||''):undefined;
  if(c.type==='fast'&&(!targetPlace||!s.visitedPlaces.includes(targetPlace.id)))throw new Error('Fast travel is only available to places you have visited.');
  const from=nearestStop(s.position),to=targetPlace?nearestStop(entrance(targetPlace)):stopById(c.id||'');
  if(!to)throw new Error('Choose your exit stop.');
  if(c.type==='transit'&&distance(s.position,from.point)>3)throw new Error(`Walk to ${from.name} before boarding.`);
  
  if(from.id===to.id&&c.type==='transit')throw new Error('Choose a different exit stop.');
  const route=from.id===to.id?{minutes:0,legs:[]}:transitRoute(from.id,to.id);
  const before=c.type==='fast'?walkingPath(s.position,from.point):[s.position,from.point];
  const after=targetPlace?walkingPath(to.point,entrance(targetPlace)):[to.point];
  const beforeMin=c.type==='fast'&&pathLength(before)>0?travelEstimate(s,from.point,'stop:'+from.id).minutes:0;
  const afterMin=targetPlace&&pathLength(after)>0?travelEstimate({...s,position:to.point,location:''},entrance(targetPlace),targetPlace.id).minutes:0;
  const tapMinutes=s.minutes+beforeMin;
  const nightBus=!serviceOpen(tapMinutes);
  const cost=fareFor({...s,minutes:tapMinutes});spend(s,cost);
  if(s.fareMonth!==fareMonth(tapMinutes)){s.fareMonth=fareMonth(tapMinutes);s.paidFares=0;}
  if(cost){s.transferUntil=tapMinutes+FARE.transferMinutes;s.paidFares++;}
  s.tripCount++;const disrupted=roll<.1;const shuttle=disrupted&&route.legs.some(l=>LINES.find(x=>x.id===l.line)?.mode==='subway');
  const delay=(disrupted?(shuttle?15:7):0)+(nightBus?20:0);
  const minutes=route.minutes+beforeMin+afterMin+delay;
  const lines=[...new Set(route.legs.map(l=>LINES.find(x=>x.id===l.line)!.name))];
  const vehicleMode=nightBus||shuttle?'bus':route.legs.some(l=>LINES.find(x=>x.id===l.line)?.mode==='subway')?'subway':route.legs.some(l=>LINES.find(x=>x.id===l.line)?.mode==='streetcar')?'streetcar':'bus';
  s.journey={vehicleMode,kind:c.type==='fast'?'fast':'transit',path:[...before,...route.legs.map(l=>stopById(l.to)!.point),...after],startedAt:now,seconds:7+(disrupted?3:0),waitSeconds:2,minutes:Math.max(1,minutes),label:targetPlace?.name||to.name,destination:targetPlace?.id,detail:`${nightBus?'Blue Night bus replacement · ':''}${lines.join(' → ')||'Local connection'} · ${cost?'$3.30 tap':s.minutes<s.transferUntil?'Transfer included':'Monthly cap reached'}${disrupted?shuttle?' · Simulated closure: shuttle bus +15 min':' · Simulated traffic delay +7 min':''}`};message=`TTC journey started. ${s.journey.detail}`;break;
 }
 case 'arrive':case 'cancel':{
  const j=s.journey;if(!j)throw new Error('There is no journey to finish.');
  const finished=now>=j.startedAt+j.seconds*1000;
  if(c.type==='arrive'&&!finished)throw new Error('You are still on your way.');
  if(c.type==='cancel'&&!finished&&j.kind!=='walk'&&j.kind!=='bike')throw new Error('Stay aboard until your selected stop.');
  const cancelled=c.type==='cancel'&&(j.kind==='walk'||j.kind==='bike');const fraction=cancelled&&typeof c.progress==='number'&&Number.isFinite(c.progress)?Math.max(0,Math.min(journeyFraction(j,now),c.progress)):finished?1:journeyFraction(j,now),p=pointAlong(j.path,fraction);
  advance(s,fraction>=1?j.minutes:Math.max(0,Math.ceil(j.minutes*fraction)));s.journey=null;settlePosition(s,onFootpath(p)?p:snapPoint(p));
  if(j.restSeat&&fraction>=1&&c.type==='arrive'){settlePosition(s,j.restSeat.access);s.life.restSeat=j.restSeat;advance(s,60);boost(s,{energy:30,fun:10});s.life.animation='sit';s.life.animationUntil=0;message='An hour of seated rest restores your energy. The sidewalk is clear for others.';break;}
  if(j.restSeat&&fraction>=1)settlePosition(s,j.restSeat.access);
  if(c.type==='arrive'&&fraction>=1&&j.enterHome&&j.destination===(s.life.housing.place||'home')){enterHome(s);message='Welcome home. Tap the furniture to use it.';break;}
  if(c.type==='arrive'&&fraction>=1&&j.enterCafe){try{message=interiorCommand(s,{type:'enter_cafe',id:j.destination},now)!;}catch(e){message=e instanceof Error?e.message:'Café is closed.';}break;}
  if(c.type==='arrive'&&fraction>=1&&j.enterBank){try{message=interiorCommand(s,{type:'enter_bank',id:j.destination},now)!;}catch(e){message=e instanceof Error?e.message:'The bank is closed.';}break;}
  message=fraction>=1?`Arrived at ${j.label}. ${j.minutes} game minutes travelled.`:'Walk paused. Your position and elapsed travel time are saved.';break;
 }
 case 'travel':throw new Error('Use Explore to find a visible TTC stop. District teleporting has been retired.');

 default:throw new Error('That action isn’t available.');
 }if(!['walk','visit','arrive','cancel'].includes(c.type)||c.type==='arrive'&&s.location)log(s,message);const rewards=checkGoals(s);return {state:s,message,notifications:[message,...rewards]};
}
