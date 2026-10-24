import {placeById,distance,type Point,type WorldSpot} from './world';
export type StreetATM={id:string;point:Point;access:Point;host:string};
/** One machine per selected commercial host; no duplicate machines at overlapping stops. */
export function streetATMs():StreetATM[]{
 const hosts=['bank','kensington','stc','yonges','islington','weston','eymarket','sc-exchange'].map(placeById).filter((p):p is WorldSpot=>!!p);
 const result:StreetATM[]=[];
 for(const p of hosts){const point:Point=[p.x+3,p.z+3.5];if(result.some(a=>distance(a.point,point)<30))continue;result.push({id:'atm-'+p.id,host:p.id,point,access:[p.x+3,p.z+5.8]});}
 return result;
}
