import {restBayX} from './building-entrances';
import {PLACES} from './world';
import {inBounds,walkingPath,pathLength,type Point} from './world';
import {segmentWalkable} from './navigation';
export type RestSeat={point:Point;access:Point};
/** Same recessed bench bay as the instanced road kit; faces the sidewalk. */
export const seatInCell=(cx:number,cz:number):RestSeat=>{const x=restBayX(cx,PLACES.some(p=>p.kind==='home'&&Math.floor(p.x/24)===cx&&Math.floor(p.z/24)===cz));return {point:[x,cz*24+17.95],access:[x,cz*24+19]};};
export function nearestRestSeat(from:Point){
 const cx=Math.floor(from[0]/24),cz=Math.floor(from[1]/24),choices:{seat:RestSeat;path:Point[]}[]=[];
 for(let x=cx-2;x<=cx+2;x++)for(let z=cz-2;z<=cz+2;z++){
  const seat=seatInCell(x,z);if(!inBounds(seat.point)||!inBounds(seat.access))continue;
  try{const path=[...walkingPath(from,seat.access),seat.point];if(path.every((p,i)=>!i||segmentWalkable(path[i-1],p)))choices.push({seat,path});}catch{/* A boundary cell may have no sidewalk connection. */}
 }
 choices.sort((a,b)=>pathLength(a.path)-pathLength(b.path));
 if(!choices.length)throw new Error('No clear route to a nearby bench. Choose another sidewalk.');
 return choices[0];
}
