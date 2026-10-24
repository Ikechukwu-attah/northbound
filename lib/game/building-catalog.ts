import {denseBlock} from './urban-form';
import {PLACES,BOUNDS,districtAt,distance,entrance,type Point} from './world';
import {hasBuildingDoor,homeEntrance} from './building-entrances';
import type {DistrictId} from './data';
import type {BuildingStyle} from './building-layouts';

export type BuildingEntry={id:string;name:string;district:DistrictId;style:BuildingStyle;seed:number;door:Point;landing:Point;approach:Point[];rotation:number;named:boolean};
export const buildingSeed=(id:string)=>[...id].reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,7);
export function namedBuilding(id:string):BuildingEntry|undefined{
 const p=PLACES.find(p=>p.id===id);if(!p||!hasBuildingDoor(p))return;
 const style:BuildingStyle=p.kind==='home'?'residence':p.kind==='cafe'?'cafe':id==='bank'?'bank':p.kind==='library'?'library':id==='islington'?'warehouse':p.kind==='market'?'grocery':['nycentre','cn'].includes(id)?'office':['health','servicecanada','housing','airport'].includes(id)?'service':id==='phone'?'retail':id==='college'||id==='eycentre'?'community':'office';
 // Named destinations retain their established public forecourt access.
 const landing=entrance(p);return {id,name:p.name,district:p.district,style,seed:buildingSeed(id),door:[p.x,p.z+(p.kind==='home'?2.56:2.56)],landing,approach:[homeEntrance(p).street,landing],rotation:0,named:true};
}
const cache=new Map<string,BuildingEntry[]>();
/** Same deterministic block recipe as the exterior kit; no thousands-entry global registry. */
export function streetBuildings(cx:number,cz:number):BuildingEntry[]{
 const key=cx+','+cz,cached=cache.get(key);if(cached)return cached;
 const x=cx*24,z=cz*24,seed=Math.abs(cx*71+cz*43),district=districtAt([x+12,z+12]),dense=denseBlock(district,cx,cz);
 const result:BuildingEntry[]=[];
 if(z<0&&x+12>=BOUNDS.west&&x+12<=BOUNDS.east&&z+12>=BOUNDS.north&&z+19<=BOUNDS.south&&!PLACES.some(p=>Math.floor(p.x/24)===cx&&Math.floor(p.z/24)===cz)&&seed%9!==0){
  const add=(bx:number,bz:number,w:number,style:BuildingStyle,side=1,house=false)=>{
   const id=`building:${cx}:${cz}:${result.length}`,door:Point=[bx+side*(w/2+.06),bz],landing:Point=house?[x+12,bz]:[bx+side*(w/2+.85),bz];
   const approach:Point[]=house?[[x+12,z+5],landing]:[[x+(side>0?19:5),bz],landing];
   result.push({id,name:`${style==='residence'?'Residence':style==='office'?'Neighbourhood office':style==='clinic'?'Community clinic':style==='warehouse'?'Local warehouse':style==='library'?'Reading room':style==='grocery'?'Neighbourhood grocery':'Local shop'} · ${Math.abs(cx)*100+Math.abs(cz)*4+result.length+1}`,district,style,seed:buildingSeed(id),door,landing,approach,rotation:side*Math.PI/2,named:false});
  };
  if(seed%11===0){if(!dense)add(x+12,z+11.8,12,'retail',-1);}
  else if(dense){if(district==='toronto'||district==='scarborough'){const variant=seed%4;add(x+12,z+12,variant===0?7.8:variant===1?10.5:11,variant===0?'office':variant===1?'residence':['retail','grocery','clinic','library'][seed%4] as BuildingStyle);}else add(x+12,z+12,seed%3===0?11:7.8,seed%3===0?'residence':'office');}
  else if(seed%6===0)add(x+12,z+12,11,seed%12===0?'warehouse':'residence');
  else for(const [hx,hz]of [[8.5,8.5],[15.5,8.5],[8.5,14.2],[15.5,14.2]])add(x+hx,z+hz,5.2,'residence',hx<12?1:-1,true);
 }
 if(cache.size>1000)cache.clear();cache.set(key,result);return result;
}
export function buildingById(id:string):BuildingEntry|undefined{if(!id.startsWith('building:'))return namedBuilding(id);const match=/^building:(-?\d+):(-?\d+):(\d+)$/.exec(id);if(!match)return;const [,x,z]=match;return streetBuildings(Number(x),Number(z)).find(b=>b.id===id);}
export function buildingApproachAt(p:Point){return streetBuildings(Math.floor(p[0]/24),Math.floor(p[1]/24)).find(b=>{const [a,c]=b.approach;return Math.abs(a[0]-c[0])<.01?Math.abs(p[0]-a[0])<.45&&p[1]>=Math.min(a[1],c[1])-.05&&p[1]<=Math.max(a[1],c[1])+.05:Math.abs(p[1]-a[1])<.45&&p[0]>=Math.min(a[0],c[0])-.05&&p[0]<=Math.max(a[0],c[0])+.05;});}
export function buildingApproachSurface(p:Point,radius:number){return streetBuildings(Math.floor(p[0]/24),Math.floor(p[1]/24)).some(b=>{const [a,c]=b.approach,half=.85-radius;return p[0]>=Math.min(a[0],c[0])-half&&p[0]<=Math.max(a[0],c[0])+half&&p[1]>=Math.min(a[1],c[1])-half&&p[1]<=Math.max(a[1],c[1])+half;});}
