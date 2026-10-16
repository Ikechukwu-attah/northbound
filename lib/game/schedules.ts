import {PEOPLE} from './data';
import {DISTRICT_CONTENT} from './district-content';
import {isOpen} from './calendar';
import {placeById} from './world';
export type Neighbour={id:string;name:string;role:string;color:string;greeting:string;lines:string[]};
export const NEIGHBOURS:Neighbour[]=[...PEOPLE,...DISTRICT_CONTENT.map(d=>({id:d.host,name:d.hostName,role:d.label+' community host',color:'#638374',greeting:`“There is always room for one more at our ${d.theme} sessions.”`,lines:[`Start with the small, free activities around ${d.label}. Each different activity earns a community stamp.`,`Three stamps open our guided workshop. Six let you help host a neighbourhood session.`,`Our exchange has a small delivery errand. Pick it up here in person, then take it to the makers room.`]}))];
export const TOPICS=[{id:'hello',label:'Get to know each other',friendship:0},{id:'local',label:'Ask for a local tip',friendship:1},{id:'story',label:'Share your story',friendship:3}];
export function scheduleFor(id:string):{place:string;start:number;end:number}[]{
 const host=DISTRICT_CONTENT.find(d=>d.host===id);if(host)return [{place:host.places[7],start:10,end:12},{place:host.places[5],start:14,end:17}];
 const known:Record<string,{place:string;start:number;end:number}[]>={maya:[{place:'queen',start:8,end:12},{place:'to-garden',start:14,end:17}],dev:[{place:'waterfront',start:9,end:12},{place:'eycentre',start:14,end:18}],amina:[{place:'reference',start:9,end:12},{place:'nylibrary',start:14,end:18}]};return known[id]||[];
}
/** NPCs are present only for public appointments; outside those windows they are away.
 * Crossing a schedule boundary happens between actions, never a walk across the city. */
export function personAt(id:string,minutes:number,duration=0){const hour=(minutes%1440)/60;return scheduleFor(id).find(slot=>hour>=slot.start&&hour+duration/60<=slot.end&&isOpen(placeById(slot.place)!,minutes,duration))?.place||null;}
export function peopleAt(minutes:number){return NEIGHBOURS.flatMap(p=>{const place=personAt(p.id,minutes);return place?[{...p,place}]:[];});}
