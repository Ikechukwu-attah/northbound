import {buildingApproachAt} from './building-catalog';
import {COMMUNITY_PLACES} from './district-content';
import {isWalkable,segmentWalkable} from './navigation';
import {homeEntrance,onHomeApproach,hasBuildingDoor} from './building-entrances';
import {DISTRICTS,type DistrictId,type Spot} from './data';
export type Point=[number,number];
export const BLOCK=24, METRES_PER_UNIT=40;
export const BOUNDS={west:-245,east:355,north:-485,south:-5};
// One compressed, north-up coordinate system. Lake Ontario lies beyond z=0.
const cells:Record<string,Point>={
 kensington:[-2,-3],queen:[-2,-2],cn:[-1,-1],waterfront:[0,-1],reference:[0,-4],home:[-3,-2],
 mel:[0,-15],willowdale:[0,-16],nylibrary:[-1,-15],yonges:[0,-17],nycentre:[-1,-16],
 bluffs:[10,-1],stc:[10,-9],scafe:[9,-6],rouge:[14,-8],slibrary:[10,-8],
 humber:[-6,-1],mimico:[-7,-2],islington:[-8,-4],colonel:[-9,-1],elibrary:[-8,-3],
 weston:[-5,-9],eglinton:[-4,-7],humbertrail:[-6,-8],yorklibrary:[-5,-8],westonsquare:[-4,-9],
 eymarket:[4,-5],eycafe:[5,-5],taylor:[5,-7],eylibrary:[4,-6],eycentre:[3,-6]
};
export type WorldSpot=Spot&{district:DistrictId};
export const DISTRICT_REGIONS:{id:DistrictId;color:string;polygon:Point[]}[]=[
 {id:'toronto',color:'#dedfc9',polygon:[[-144,-240],[168,-240],[168,0],[-144,0]]},
 {id:'etobicoke',color:'#cad9c6',polygon:[[-250,-490],[-144,-490],[-144,0],[-250,0]]},
 {id:'north-york',color:'#c4d6d3',polygon:[[-144,-490],[168,-490],[168,-216],[48,-216],[48,-240],[-72,-240],[-72,-216],[-144,-216]]},
 {id:'york',color:'#dac9b4',polygon:[[-144,-216],[-72,-216],[-72,-96],[-144,-96]]},
 {id:'east-york',color:'#c9d1a9',polygon:[[48,-216],[168,-216],[168,-96],[48,-96]]},
 {id:'scarborough',color:'#d9d0b0',polygon:[[168,-490],[390,-490],[390,0],[168,0]]}
];
function inPolygon([x,z]:Point,points:Point[]){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const [a,b]=points[i],[c,d]=points[j];if((b>z)!==(d>z)&&x<(c-a)*(z-b)/(d-b)+a)inside=!inside;}return inside;}
export function districtAt(p:Point):DistrictId{return [...DISTRICT_REGIONS].reverse().find(r=>inPolygon(p,r.polygon))?.id||'toronto';}

const services:WorldSpot[]=[
 ...[{id:'room',name:'18 Palmerston Lane',x:-84,z:-36},{id:'basement',name:'42 Oakwood Lane',x:-108,z:-156},{id:'apartment',name:'26 Willowdale Lane',x:36,z:-348},{id:'two-bedroom',name:'64 Danforth Lane',x:84,z:-84},{id:'roommates',name:'12 Junction Lane',x:-84,z:-108}].map(h=>({id:'listing-'+h.id,name:h.name,district:districtAt([h.x,h.z]),kind:'home' as const,x:h.x,z:h.z,color:'#bda184',description:'Fictional housing listing. View the home at this address before applying.',activity:'Housing & home'})),
 {id:'airport',name:'Pearson Airport · Mississauga',district:'etobicoke',kind:'service',x:-228,z:-204,color:'#b4bfbd',description:'Toronto Pearson is in Mississauga, outside Toronto. Work authorization is assumed for this game path.',activity:'Arrival information'},
 {id:'servicecanada',name:'Service Canada',district:'north-york',kind:'service',x:12,z:-276,color:'#bcc1b1',description:'Visit on a weekday to arrange your simulated SIN.',activity:'Documents & services'},
 {id:'bank',name:'Neighbourhood Credit Union',district:'toronto',kind:'service',x:-12,z:-60,color:'#9eaf9b',description:'Open an account, build credit and manage money.',activity:'Documents & services'},
 {id:'phone',name:'Neighbourhood Mobile',district:'toronto',kind:'service',x:-60,z:-60,color:'#c4a578',description:'Choose a monthly phone plan or repair your phone.',activity:'Documents & services'},
 {id:'health',name:'ServiceOntario',district:'toronto',kind:'service',x:-36,z:-84,color:'#b9c2ab',description:'Arrange provincial health coverage in the game. Eligibility and documents vary in real life.',activity:'Documents & services'},
 {id:'housing',name:'Housing resource centre',district:'toronto',kind:'service',x:-84,z:-60,color:'#c39a7b',description:'View listings, arrange a viewing, and apply using income, savings or a guarantor.',activity:'Find housing'},
 {id:'college',name:'Community learning centre',district:'toronto',kind:'service',x:36,z:-108,color:'#b2b4a0',description:'Classes, training and a weekly volunteer programme.',activity:'Study & training'}
];
/** Neighbourhood Credit Union branches (one brand). More per-district branches can be added here
 * once each has a curated walkable footprint and an OSM geo anchor. */
export const isBankPlace=(id?:string)=>id==='bank'||!!id&&id.startsWith('bank-');
export const BANK_PLACE_IDS=['bank'];
export const WORLD_DISTRICTS=DISTRICTS.map(d=>({...d,spots:[...d.spots.map(s=>({...s,district:d.id,x:cells[s.id][0]*BLOCK+12,z:cells[s.id][1]*BLOCK+12})),...services.filter(p=>p.district===d.id),...COMMUNITY_PLACES.filter(p=>p.district===d.id)]}));
export const PLACES:WorldSpot[]=WORLD_DISTRICTS.flatMap(d=>d.spots);
export const placeById=(id:string)=>PLACES.find(p=>p.id===id);
export const BANK_PLACES=()=>BANK_PLACE_IDS.map(id=>placeById(id)!).filter(Boolean);
export const nearestBankPlace=(p:Point)=>BANK_PLACES().sort((a,b)=>distance(p,entrance(a))-distance(p,entrance(b)))[0];
export const entrance=(p:Spot):Point=>hasBuildingDoor(p)?homeEntrance(p).landing:[p.x,p.z+7];
export const distance=(a:Point,b:Point)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
export const sidewalk=(n:number)=>Math.round((n+5)/BLOCK)*BLOCK-5;
export function inBounds(p:Point){return p.every(Number.isFinite)&&p[0]>=BOUNDS.west&&p[0]<=BOUNDS.east&&p[1]>=BOUNDS.north&&p[1]<=BOUNDS.south;}
export function onSidewalk(p:Point){return inBounds(p)&&(Math.abs(p[0]-sidewalk(p[0]))<.05||Math.abs(p[1]-sidewalk(p[1]))<.05);}
export const homeApproachAt=(p:Point)=>PLACES.find(s=>hasBuildingDoor(s)&&onHomeApproach(p,s));
export const onFootpath=(p:Point)=>onSidewalk(p)||!!homeApproachAt(p)||!!buildingApproachAt(p);
export function snapPoint(p:Point):Point{const x=Math.max(BOUNDS.west,Math.min(BOUNDS.east,p[0])),z=Math.max(BOUNDS.north,Math.min(BOUNDS.south,p[1]));return Math.abs(x-sidewalk(x))<Math.abs(z-sidewalk(z))?[sidewalk(x),z]:[x,sidewalk(z)];}
/** Shortest rectilinear route on the connected sidewalk grid, including crossings. */
export function walkingPath(from:Point,to:Point):Point[]{
 const fb=!onSidewalk(from)?buildingApproachAt(from):undefined,tb=!onSidewalk(to)?buildingApproachAt(to):undefined;
 if(fb||tb){if(fb&&tb&&distance(fb.approach[0],tb.approach[0])<.01)return [from,to];return [...(fb?[from]:[]),...walkingPath(fb?fb.approach[0]:from,tb?tb.approach[0]:to),...(tb?[to]:[])].filter((p,i,a)=>!i||distance(p,a[i-1])>.001);}
 const fromHome=!onSidewalk(from)?homeApproachAt(from):undefined,toHome=!onSidewalk(to)?homeApproachAt(to):undefined;
 if(fromHome||toHome){
  if(fromHome?.id===toHome?.id)return [from,to];
  const start=fromHome?homeEntrance(fromHome).street:from,end=toHome?homeEntrance(toHome).street:to;
  return [...(fromHome?[from]:[]),...walkingPath(start,end),...(toHome?[to]:[])].filter((p,i,a)=>!i||distance(p,a[i-1])>.001);
 }
 if(!onSidewalk(from)||!onSidewalk(to))throw new Error('Choose a sidewalk or a marked place entrance.');
 const candidates:Point[][]=[];
 if(Math.abs(from[0]-to[0])<.01&&Math.abs(from[0]-sidewalk(from[0]))<.05)candidates.push([from,to]);
 if(Math.abs(from[1]-to[1])<.01&&Math.abs(from[1]-sidewalk(from[1]))<.05)candidates.push([from,to]);
 const corners=(p:Point):Point[]=>{
  if(Math.abs(p[0]-sidewalk(p[0]))<.05){const z=Math.floor((p[1]+5)/24)*24-5;return ([[p[0],z],[p[0],z+24]] as Point[]).filter(inBounds);}
  const x=Math.floor((p[0]+5)/24)*24-5;return ([[x,p[1]],[x+24,p[1]]] as Point[]).filter(inBounds);
 };
 for(const a of corners(from))for(const b of corners(to))candidates.push([from,a,[b[0],a[1]],b,to]);
 candidates.sort((a,b)=>pathLength(a)-pathLength(b));
 const route=candidates.find(path=>path.every((p,i)=>isWalkable(p)&&(!i||segmentWalkable(path[i-1],p))));if(!route)throw new Error('No clear sidewalk route is available.');return route.filter((p,i,a)=>!i||distance(p,a[i-1])>.001);
}
export const pathLength=(path:Point[])=>path.reduce((sum,p,i)=>sum+(i?distance(path[i-1],p):0),0);
export function pointAlong(path:Point[],fraction:number):Point{if(fraction>=1)return path[path.length-1];if(fraction<=0)return path[0];let remain=pathLength(path)*Math.max(0,Math.min(1,fraction));for(let i=1;i<path.length;i++){const len=distance(path[i-1],path[i]);if(remain<=len){const t=len?remain/len:0;return [path[i-1][0]+(path[i][0]-path[i-1][0])*t,path[i-1][1]+(path[i][1]-path[i-1][1])*t];}remain-=len;}return path[path.length-1];}
/** Shared estimate for UI, server journeys and access walks. Pace is fixed when departing. */
export const walkMinutes=(path:Point[],bike=false,energy=100)=>Math.max(1,Math.ceil(pathLength(path)*METRES_PER_UNIT/(bike?250:80)))*(!bike&&energy<20?2:1);
export const JOB_PLACES:Record<string,string>={barista:'queen',courier:'kensington',gallery:'cn',developer:'reference',warehouse:'islington',retail:'stc',cleaning:'nycentre'};
export const PERSON_PLACES:Record<string,string>={maya:'queen',dev:'waterfront',amina:'reference'};
export function nearbyPlace(p:Point){return PLACES.find(s=>distance(p,entrance(s))<=3);}
export function chunksAround(p:Point,radius=2):Point[]{const cx=Math.floor(p[0]/BLOCK),cz=Math.floor(p[1]/BLOCK);const result:Point[]=[];for(let x=cx-radius;x<=cx+radius;x++)for(let z=cz-radius;z<=cz+radius;z++)if(x>=-11&&x<=15&&z>=-21&&z<=1)result.push([x,z]);return result;}
export const DISTRICT_CENTRES:Record<DistrictId,Point>={toronto:[-24,-48],'north-york':[0,-360],scarborough:[264,-192],etobicoke:[-192,-72],york:[-108,-192],'east-york':[108,-144]};

export const nearestPlace=(p:Point)=>[...PLACES].sort((a,b)=>distance(p,entrance(a))-distance(p,entrance(b)))[0];
