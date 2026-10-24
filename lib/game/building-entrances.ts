import type {Spot} from './data';
import type {Point} from './world';

/** Store/home shell is 5 units deep. The door belongs to its south façade. */
export function homeEntrance(p:Pick<Spot,'x'|'z'>){return {
 door:[p.x,p.z+2.56] as Point,
 landing:[p.x,p.z+3.35] as Point,
 street:[p.x,p.z+7] as Point,
 width:2.4,
};}
export function onHomeApproach(p:Point,home:Pick<Spot,'x'|'z'>){
 return Math.abs(p[0]-home.x)<=.85&&p[1]>=home.z+3.05&&p[1]<=home.z+7.4;
}
/** Keep the roadside bench beside, rather than across, a home's entrance path. */
export const restBayX=(cellX:number,homeCell:boolean)=>cellX*24+12+(homeCell?3.2:0);

export const hasBuildingDoor=(p:Pick<Spot,'kind'|'id'>)=>p.kind!=='park'&&!['bluffs','waterfront','humber','mel'].includes(p.id);
