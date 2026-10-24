import type {DistrictId} from './data';
/** Mixed-use hubs in the stylised city grid, surrounded by residential streets. */
export function scarboroughHub(cx:number,cz:number){return cx>=9&&cx<=12&&cz>=-10&&cz<=-7||cx>=8&&cx<=10&&cz>=-5&&cz<=-3;}
export const denseBlock=(district:DistrictId,cx:number,cz:number)=>district==='toronto'||district==='north-york'||district==='scarborough'&&scarboroughHub(cx,cz);
