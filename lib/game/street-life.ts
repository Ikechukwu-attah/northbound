import {placeById,type Point} from './world';
import {isOpen} from './calendar';
export function communityBoards(){return ['stc','sc-studio','sc-exchange'].map(id=>{const p=placeById(id)!;return {id,point:[p.x-3.3,p.z+3.5] as Point,person:[p.x-3.3,p.z+5.8] as Point};});}
export const streetHosts=(minutes:number)=>communityBoards().filter(b=>isOpen(placeById(b.id)!,minutes));
