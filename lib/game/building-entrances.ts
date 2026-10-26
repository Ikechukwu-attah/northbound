import type {Spot} from './data';
import type {Point} from './world';

/** Store/home shell is 5 units deep. The door belongs to its south façade. */
export const buildingDepth=(p:{id?:string})=>p.id==='sc-walmart'?8:5;
export function homeEntrance(p:Pick<Spot,'x'|'z'>&{id?:string}){const front=buildingDepth(p)/2;return {
 door:[p.x,p.z+front+.06] as Point,
 landing:[p.x,p.z+front+.85] as Point,
 street:[p.x,p.z+7] as Point,
 width:2.4,
};}
export function onHomeApproach(p:Point,home:Pick<Spot,'x'|'z'>&{id?:string}){
 return Math.abs(p[0]-home.x)<=.85&&p[1]>=home.z+buildingDepth(home)/2+.55&&p[1]<=home.z+7.4;
}
/** Keep the roadside bench beside, rather than across, a home's entrance path. */
export const restBayX=(cellX:number,_homeCell:boolean)=>cellX*24+15.2;

export const hasBuildingDoor=(p:Pick<Spot,'kind'|'id'>)=>p.kind!=='park'&&!['bluffs','waterfront','humber','mel'].includes(p.id);
