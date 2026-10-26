import type {DistrictId} from './data';
import {SCARBOROUGH_FEATURES} from './scarborough';
/** Mixed-use hubs in the stylised city grid, surrounded by residential streets. */
export function scarboroughHub(cx:number,cz:number){return cx>=9&&cx<=12&&cz>=-10&&cz<=-7||cx>=8&&cx<=10&&cz>=-5&&cz<=-3||SCARBOROUGH_FEATURES.some(f=>Math.abs(cx-f.cell[0])<=1&&Math.abs(cz-f.cell[1])<=1);}
export function scarboroughZone(cx:number,cz:number):'centre'|'campus'|'shops'|'employment'|'residential'{
 const feature=SCARBOROUGH_FEATURES.find(f=>Math.abs(cx-f.cell[0])<=1&&Math.abs(cz-f.cell[1])<=1);
 if(feature)return feature.form==='campus'?'campus':'shops';
 if(scarboroughHub(cx,cz))return 'centre';
 if(cx>=12&&cx<=15&&cz>=-14&&cz<=-12)return 'employment';
 return 'residential';
}
export const denseBlock=(district:DistrictId,cx:number,cz:number)=>district==='toronto'||district==='north-york'||district==='scarborough'&&scarboroughHub(cx,cz);
