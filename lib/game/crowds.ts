import {scarboroughHub} from './urban-form';
import type {Point} from './world';
import type {DistrictId} from './data';
export function crowdBudget(district:DistrictId,minutes:number,mobile:boolean,quality:boolean,centre?:Point){const hour=Math.floor(minutes/60)%24;const dense=district==='toronto'||district==='north-york'||district==='scarborough'&&!!centre&&scarboroughHub(Math.floor(centre[0]/24),Math.floor(centre[1]/24));const rush=hour>=7&&hour<10||hour>=16&&hour<19;const night=hour<6||hour>=22;const cap=mobile?(quality?12:7):(quality?24:12);return Math.min(cap,night?(dense?5:2):dense?(rush?24:16):8);}
