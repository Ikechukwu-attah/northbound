import type {DistrictId} from './data';
import type {BuildingStyle} from './building-layouts';
import {denseBlock,scarboroughZone} from './urban-form';
export type FormKind='bungalow'|'gable'|'semi'|'modern'|'tower'|'terrace'|'slab'|'shops'|'warehouse'|'campus';
export type BuildingForm={x:number;z:number;width:number;depth:number;height:number;kind:FormKind;style:BuildingStyle;seed:number;house:boolean;side:1|-1};
export const blockSeed=(cx:number,cz:number)=>Math.abs(cx*71+cz*43);
/** Geometry, doors, collision and distance LOD share this one massing recipe. */
export function blockForms(cx:number,cz:number,district:DistrictId):BuildingForm[]{
 const seed=blockSeed(cx,cz),x=cx*24,z=cz*24,dense=denseBlock(district,cx,cz),zone=district==='scarborough'?scarboroughZone(cx,cz):null;
 if(seed%9===0)return [];
 const form=(kind:FormKind,width:number,depth:number,height:number,style:BuildingStyle,side:1|-1=1):BuildingForm=>({x:x+12,z:z+12,width,depth,height,kind,style,seed,house:false,side});
 if(seed%11===0)return dense?[]:[{...form('shops',12,3.4,3.1,'retail',-1),z:z+11.8}];
 if(zone==='campus')return [form('campus',10.5,8,6+seed%3*2,'community')];
 if(zone==='employment')return [form('warehouse',11,9,4+seed%3,'warehouse')];
 if(zone==='shops')return [seed%3===0?form('slab',10,8,10+seed%4*2,'residence'):form('shops',11,9,4+seed%3*2,'retail')];
 if(dense){const v=seed%5;
  return [v===0?form('tower',7.8,7.2,16+seed%4*4,'office'):v===1?form('terrace',10.5,9,9+seed%3*2,'residence'):v===2?form('shops',11,9,5+seed%3*2,'retail'):v===3?form('slab',11,7,10+seed%3*2,'residence'):form('tower',8.5,8,20+seed%3*4,'office')];
 }
 if(seed%6===0)return [form('slab',11,7,8+seed%3*1.8,seed%12===0?'warehouse':'residence')];
 return ([[8.5,8.5],[15.5,8.5],[8.5,14.2],[15.5,14.2]] as const).map(([dx,dz],i)=>{
  const v=(seed+i)%4,kind=(['bungalow','gable','semi','modern'] as const)[v];
  const width=[5.2,4.6,5.2,4.8][v];
  return {x:x+(dx<12?11.1-width/2:12.9+width/2),z:z+dz,width,depth:[5,5.4,5.2,4.8][v],height:[3,5.7,6.1,6.6][v],kind,style:'residence',seed:seed+i*13,house:true,side:dx<12?1:-1};
 });
}
