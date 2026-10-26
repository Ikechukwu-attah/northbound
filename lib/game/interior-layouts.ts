import type {Point} from './world';
export type HomeTier='room'|'basement'|'apartment'|'two-bedroom';
export type FurnitureKind='bed'|'stove'|'sink'|'shower'|'toilet'|'sofa'|'desk'|'table'|'wardrobe'|'plant'|'counter'|'register'|'chair'|'worktop'|'reception'|'shelf'|'produce'|'crates';
export type Furniture={id:string;kind:FurnitureKind;x:number;z:number;width:number;depth:number;use?:Point;label?:string;action?:string;zone?:'bedroom'|'shared'|'bathroom'};
export type Wall={x:number;z:number;width:number;depth:number;side?:'north'|'south'|'east'|'west'};
export type Door={id:string;x:number;z:number;width:number;label:string;privacy?:boolean};
export type HomeLayout={tier:HomeTier|'cafe'|'bank'|'building';width:number;depth:number;door:Point;doors:Door[];objects:Furniture[];walls:Wall[];bathroom:{x:number;z:number;width:number;depth:number};palette:{floor:string;wall:string;accent:string}};
export const LAYOUT_VERSION=5;
export function homeTier(type:string):HomeTier{return type==='basement'?'basement':['two-bedroom','roommates','family'].includes(type)?'two-bedroom':type==='apartment'?'apartment':'room'}
const layouts=new Map<string,HomeLayout>();
export function shell(tier:HomeLayout['tier'],width:number,depth:number):HomeLayout{const w=width/2,d=depth/2;return {tier,width,depth,door:[0,d-1],objects:[],doors:[{id:'exit',x:0,z:d,width:2,label:'Exit to street'},{id:'bathroom-door',x:w-1.9,z:-d+4,width:1.8,label:'Bathroom',privacy:true}],bathroom:{x:w-2.2,z:-d+2,width:4.4,depth:4},walls:[{x:0,z:-d,width,depth:.18,side:'north'},{x:-w,z:0,width:.18,depth,side:'west'},{x:w,z:0,width:.18,depth,side:'east'},{x:-(w+1)/2,z:d,width:w-1,depth:.18,side:'south'},{x:(w+1)/2,z:d,width:w-1,depth:.18,side:'south'},{x:w-4.4,z:-d+2,width:.15,depth:4},{x:w-3.6,z:-d+4,width:1.6,depth:.15},{x:w-.5,z:-d+4,width:1,depth:.15}],palette:{floor:'#cba579',wall:'#e8e0ce',accent:'#708264'}}}
export function bathroom(l:HomeLayout,shower=true){const w=l.width/2,d=l.depth/2;l.objects.push({id:'toilet',kind:'toilet',x:w-1.2,z:-d+1.1,width:.8,depth:1.2,use:[w-1.2,-d+2.4],label:'Use toilet · 5 min',action:'bathroom',zone:'bathroom'});if(shower)l.objects.push({id:'shower',kind:'shower',x:w-3.2,z:-d+1,width:1.35,depth:1.4,use:[w-3.2,-d+2.4],label:'Shower · 15 min',action:'shower',zone:'bathroom'});}
export function homeLayout(tier:HomeTier):HomeLayout{
 const cached=layouts.get(tier);if(cached)return cached;
 const [width,depth]=tier==='room'?[20,16]:tier==='basement'?[15,12]:tier==='apartment'?[18,14]:[22,16],l=shell(tier,width,depth),w=width/2,d=depth/2;
 l.palette={floor:tier==='basement'?'#b9ab91':tier==='room'?'#b89067':'#cba579',wall:tier==='basement'?'#c7d4c8':'#e8e0ce',accent:tier==='two-bedroom'?'#537b79':tier==='apartment'?'#a8644c':'#708264'};
 l.objects.push({id:'bed',kind:'bed',x:-w+2,z:-d+3,width:2.4,depth:3.8,use:[-w+4,-d+3],label:'Sleep · 8 hours',action:'sleep',zone:'bedroom'},
 {id:'stove',kind:'stove',x:tier==='two-bedroom'?1.5:-.8,z:-d+1,width:1.5,depth:1.4,use:[tier==='two-bedroom'?1.5:-.8,-d+2.6],label:'Cook breakfast · 30 min',action:'cook',zone:'shared'},
 {id:'sink',kind:'sink',x:tier==='two-bedroom'?3.3:1,z:-d+1,width:1.5,depth:1.4,zone:'shared'},
 {id:'sofa',kind:'sofa',x:-w+2.2,z:d-2.2,width:3,depth:1.3,use:[-w+2.2,d-3.7],label:'Relax · 1 hour',action:'relax',zone:'shared'},
 {id:'desk',kind:'desk',x:w-1.6,z:d-2.2,width:2.2,depth:1.1,use:[w-1.6,d-3.5],label:'Use laptop',action:'resume',zone:'bedroom'},
 {id:'plant',kind:'plant',x:w-1,z:.4,width:.8,depth:.8,zone:'shared'},
 {id:'wardrobe',kind:'wardrobe',x:-w+.8,z:.9,width:1,depth:1.8,zone:'bedroom'},
 {id:'table',kind:'table',x:0,z:2,width:2.3,depth:1.6,zone:'shared'});
 bathroom(l);
 if(tier==='room'){
  l.objects.push({id:'housemate-chair',kind:'chair',x:4,z:4,width:.9,depth:.9,zone:'shared'});
  Object.assign(l.objects.find(o=>o.id==='desk')!,{x:-4.7,z:-6,use:[-4.7,-4.5]});
  Object.assign(l.objects.find(o=>o.id==='wardrobe')!,{x:-9,z:-2,depth:1.4});
  l.walls.push({x:-3,z:-4.25,width:.18,depth:7.5},{x:-8,z:-.5,width:4,depth:.18},{x:-3.5,z:-.5,width:1,depth:.18});
  l.doors.push({id:'room-door',x:-5,z:-.5,width:2,label:'Your room'});
 }
 if(tier==='two-bedroom')l.objects.push({id:'second-bed',kind:'bed',x:-w+6.9,z:-d+3,width:2.4,depth:3.8,zone:'bedroom'});
 if(tier==='apartment'||tier==='two-bedroom'){for(let n=0;n<(tier==='two-bedroom'?2:1);n++){const left=-w+n*4.6,right=left+4.6;l.walls.push({x:right,z:-d+2.65,width:.15,depth:5.3},{x:(left+right-1.6)/2,z:-d+5.3,width:3,depth:.15});l.doors.push({id:'bedroom-'+n,x:right-.8,z:-d+5.3,width:1.6,label:'Bedroom'});}}
 layouts.set(tier,l);return l;
}
export function cafeLayout():HomeLayout{
 const cached=layouts.get('cafe');if(cached)return cached;const l=shell('cafe',20,16);l.palette={floor:'#b99066',wall:'#e8d7b8',accent:'#356b62'};
 l.objects=[{id:'counter',kind:'counter',x:-3,z:-5,width:8,depth:1.8,use:[-3,-2.9],label:'Order at counter',action:'order'},
 {id:'register',kind:'register',x:2,z:-5,width:1.3,depth:1.8,use:[2,-2.9],label:'Pay at till',action:'pay'},
 {id:'worktop',kind:'worktop',x:2,z:-7.4,width:1.3,depth:.6,use:[2,-6.5],label:'Barista station',action:'work'},
 {id:'seat-a',kind:'chair',x:-6,z:3,width:.9,depth:.9,use:[-6,1.7],label:'Sit here',action:'sit'},
 {id:'seat-b',kind:'chair',x:2,z:3,width:.9,depth:.9,use:[2,1.7],label:'Sit here',action:'sit'},
 {id:'table-a',kind:'table',x:-6,z:4.6,width:2.5,depth:1.7},{id:'table-b',kind:'table',x:2,z:4.6,width:2.5,depth:1.7},
 {id:'customer-chair',kind:'chair',x:-2,z:3,width:.9,depth:.9},{id:'customer-table',kind:'table',x:-2,z:4.6,width:2.5,depth:1.7},
 {id:'plant',kind:'plant',x:8,z:5,width:.8,depth:.8}];bathroom(l,false);layouts.set('cafe',l);return l;
}
export function bankLayout():HomeLayout{
 const cached=layouts.get('bank');if(cached)return cached;const l=shell('bank',20,16);l.palette={floor:'#b9b4a4',wall:'#dde3df',accent:'#2f6d5b'};
 l.objects=[{id:'teller',kind:'counter',x:-2,z:-5,width:9,depth:1.6,use:[-2,-2.9],label:'Speak to a teller',action:'bank'},
 {id:'atm',kind:'register',x:6.4,z:-4.4,width:1.2,depth:1.2,use:[5.1,-4.4],label:'Use the ATM',action:'bank'},
 {id:'ticket',kind:'register',x:-8.3,z:1,width:.7,depth:1,use:[-7,1],label:'Take a number',action:'bank'},
 {id:'advisor',kind:'desk',x:6,z:2,width:2.4,depth:1.2,use:[4.3,2],label:'See an advisor',action:'bank'},
 {id:'seat-a',kind:'chair',x:-5.5,z:4.6,width:.9,depth:.9},{id:'seat-b',kind:'chair',x:-3,z:4.6,width:.9,depth:.9},
 {id:'table-a',kind:'table',x:-4.3,z:5.8,width:2.6,depth:1.2},{id:'plant',kind:'plant',x:8.4,z:5,width:.8,depth:.8}];
 bathroom(l,false);layouts.set('bank',l);return l;
}
