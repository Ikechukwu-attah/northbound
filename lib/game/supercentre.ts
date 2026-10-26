import {shell,bathroom,type HomeLayout} from './interior-layouts';
import type {Point} from './world';
export const WALMART_ID='sc-walmart';
export const STORE_DEPARTMENTS=['Fresh produce','Bakery & pantry','Household essentials','Clothing','Electronics','Toys & home'];
export const STORE_AISLES=[-18,-11,-4,4,11,18];
export const STORE_CHECKOUTS=[-15,-8,8,15];
export const storeCashiers=():Point[]=>STORE_CHECKOUTS.map(x=>[x,13.8]);
/** Reusable large-format retail layout; goods use the same instanced furniture kit. */
export function supercentreLayout():HomeLayout{
 const l=shell('building',48,40);l.palette={floor:'#e1e3dc',wall:'#f0eee2',accent:'#1674b8'};bathroom(l,false);
 for(let col=0;col<STORE_AISLES.length;col++)for(let row=0;row<2;row++){
  const x=STORE_AISLES[col],z=row?4:-7;
  l.objects.push({id:`department-${col}-${row}`,kind:col===0?'produce':col===3?'clothing':col===4?'electronics':'shelf',x,z,width:3.4,depth:6.2,use:[x+2.6,z],label:STORE_DEPARTMENTS[col]+' · Browse goods',action:'browse'});
 }
 for(const [index,x]of STORE_CHECKOUTS.entries())l.objects.push({id:'checkout-'+index,kind:'register',x,z:12,width:2.7,depth:2,use:[x,10],label:'Buy groceries · 14 meal portions',action:'groceries'});
 l.objects.push({id:'customer-service',kind:'reception',x:-15,z:17,width:6,depth:1.4,use:[-15,15.5],label:'Customer service',action:'reception'},
 {id:'sofa',kind:'sofa',x:15,z:17,width:3,depth:1.3,use:[15,15.6],label:'Rest · 30 minutes',action:'relax'},
 {id:'display',kind:'produce',x:0,z:-16,width:8,depth:2,use:[0,-13.8],label:'Seasonal produce · Browse goods',action:'browse'});
 return l;
}
export const storeShopperCount=(mobile:boolean,quality:boolean,minutes:number)=>{const hour=minutes%1440/60;if(hour<7||hour>=23)return 0;return mobile?(quality?8:5):quality?18:10;};
export type StoreShopper={position:Point;home:Point;end:Point;heading:number;moving:boolean;forward:boolean;wait:number;seed:number};
/** Individual aisle bays keep browsing shoppers off the central and checkout routes. */
export function createStoreShoppers(count:number):StoreShopper[]{return Array.from({length:count},(_,index)=>{
 const col=index%6,row=Math.floor(index/6)%3,x=STORE_AISLES[col]-2.65,z=[-8,2,7][row];
 return {position:[x,z],home:[x,z-1],end:[x,z+1],heading:Math.PI/2,moving:false,forward:true,wait:index%4,seed:1700+index*79};
});}
