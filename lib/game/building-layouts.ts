import {shell,bathroom,homeLayout,homeTier,cafeLayout,bankLayout,type HomeLayout,type Furniture} from './interior-layouts';
export type BuildingStyle='office'|'residence'|'retail'|'grocery'|'library'|'clinic'|'warehouse'|'service'|'community'|'cafe'|'bank';
/** Serializable design props: a city can override colours, housing tier and add kit pieces. */
export type BuildingDesign={style:BuildingStyle;seed?:number;tier?:string;palette?:Partial<HomeLayout['palette']>;extras?:Furniture[];omit?:string[]};
const palettes=[{floor:'#b4b9b3',wall:'#e3e9e4',accent:'#386b72'},{floor:'#bcaa91',wall:'#eee3d1',accent:'#98654b'},{floor:'#b2b5bb',wall:'#e3e2e9',accent:'#665c85'},{floor:'#c3b89d',wall:'#f1eadb',accent:'#4d7455'}];
const cache=new Map<string,HomeLayout>();
export function buildingLayout(config:BuildingDesign):HomeLayout{
 const key=JSON.stringify(config),cached=cache.get(key);if(cached)return cached;
 const seed=config.seed||0,style=config.style;
 let l:HomeLayout=structuredClone(style==='residence'?homeLayout(homeTier(config.tier||(['apartment','basement','two-bedroom'][seed%3]))):style==='cafe'?cafeLayout():style==='bank'?bankLayout():shell('building',22,18));
 l.palette={...palettes[seed%palettes.length],...config.palette};
 const add=(id:string,kind:Furniture['kind'],x:number,z:number,width:number,depth:number,label?:string,action?:string,use?:[number,number])=>l.objects.push({id,kind,x,z,width,depth,...(label?{label,action,use:use||[x,z+depth/2+1]}:{})});
 if(!['residence','cafe','bank'].includes(style)){
  add('reception','reception',-4,-5.4,7,1.5,'Speak to reception','reception');
  add('sofa','sofa',-7,6,3,1.3,'Sit and rest · 30 min','relax',[-7,4.5]);
  add('plant','plant',9,6,.8,.8);
  bathroom(l,false);
  if(style==='office'){
   for(const [id,x,z]of [['desk',-7,-.5],['desk-2',-2,-.5],['desk-3',5,3]] as const)add(id,'desk',x,z,2.4,1.2,id==='desk'?'Work at desk':'Review workspace',id==='desk'?'work':'browse');
   add('meeting','table',1,6,3.2,1.4);add('meeting-chair','chair',1,4.6,.9,.9);add('files','shelf',-9,-5.8,1.2,2);
  }else if(style==='library'||style==='community'){
   for(const x of [-7,-2])add('shelf-'+x,'shelf',x,0,3,1.1,'Browse books','read');
   add('desk','desk',5,3,2.4,1.2,'Prepare résumé · 60 min','resume');add('study','table',0,5.8,3,1.4,'Study here · 2 hours','study',[0,4.1]);
  }else if(style==='retail'||style==='grocery'){
   for(const x of [-7,-2,4])add('shelf-'+x,style==='grocery'?'produce':'shelf',x,0,2.5,1.2,'Browse '+(style==='grocery'?'groceries':'stock'),'browse');
   add('checkout','register',5,5,1.4,1.3,style==='grocery'?'Buy groceries':'Shop counter',style==='grocery'?'groceries':'service',[5,3.4]);
  }else if(style==='warehouse'){
   for(const x of [-7,-2,4])add('stock-'+x,'crates',x,0,2.6,2,'Inspect stock','browse');add('work','worktop',4,5,3,1,'Start scheduled shift','work',[4,3.5]);
  }else if(style==='clinic'){
   add('examination','bed',-6,0,2.4,3.8,'Read appointment information','browse',[-4,0]);add('medical','shelf',0,0,2,1);add('advisor','desk',5,3,2.4,1.2,'Speak to clinic staff','reception');
  }else{
   add('ticket','register',-7,0,1,1,'Take a number · wait your turn','ticket');add('advisor','desk',4,3,2.4,1.2,'Use service desk','service');
   for(const x of [-2,0,2])add('waiting-'+x,'chair',x,6,.9,.9,'Sit and wait','sit',[x,4.7]);
  }
 }
 l.objects=l.objects.filter(o=>!config.omit?.includes(o.id));
 for(const extra of config.extras||[]){const at=l.objects.findIndex(o=>o.id===extra.id);if(at>=0)l.objects[at]=structuredClone(extra);else l.objects.push(structuredClone(extra));}
 if(cache.size>300)cache.clear();cache.set(key,l);return l;
}
