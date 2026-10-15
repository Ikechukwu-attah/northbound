import {BLOCK,PLACES,districtAt,type Point} from './world';
export type Axis='x'|'z';
export type Road={axis:Axis;coordinate:number;name:string;lanes:2|4|6;width:number;laneWidth:number;tracks:boolean;bike:boolean;arterial:boolean};
// Compressed game corridors, aligned to the persistent 24-unit city grid.
export function roadAt(axis:Axis,coordinate:number,along=0):Road{
 const names:Record<number,string>=axis==='z'?{0:'Yonge St',[-48]:'Spadina Ave'}:{[-96]:along<0?'Bloor St W':'Bloor St E',[-48]:along<0?'Queen St W':'Queen St E',[-24]:along<0?'King St W':'King St E',[-192]:along<0?'Eglinton Ave W':'Eglinton Ave E',[-312]:along<0?'Sheppard Ave W':'Sheppard Ave E'};
 const name=names[coordinate]||'Local street',arterial=!!names[coordinate]&&(axis==='x'||coordinate===0||along>=-120);const lanes=arterial?(axis==='x'&&[-192,-312].includes(coordinate)?6:4):2;const laneWidth=lanes===6?1.4:1.6;
 return {axis,coordinate,name:arterial?name:'Local street',lanes,width:lanes*laneWidth,laneWidth,arterial,tracks:arterial&&(axis==='x'?[-48,-24].includes(coordinate):coordinate===-48&&along>=-120),bike:arterial&&(axis==='x'?coordinate===-96:coordinate===0)};
}
export const junctionKey=(x:number,z:number)=>`${x},${z}`;
export function signalAt(x:number,z:number,seconds:number,axis:Axis):'green'|'amber'|'red'{const phase=((seconds+(Math.round(x/24)*3+Math.round(z/24)*5))%32+32)%32;const start=axis==='z'?0:16;return phase>=start&&phase<start+11?'green':phase>=start+11&&phase<start+13?'amber':'red';}
export const signalized=(x:number,z:number)=>roadAt('z',x,z).arterial||roadAt('x',z,x).arterial;
export type Piece={p:[number,number,number];s:[number,number,number];c:string;r?:number};
export type Sign={x:number;y:number;z:number;name:string;axis:Axis};
export type TileData={boxes:Piece[];trees:Piece[];stops:Piece[];signs:Sign[];lights:{x:number;z:number;axis:Axis;p:[number,number,number]}[];blocks:{x:number;z:number;kind:string}[]};
export function makeRoadTiles(cells:Point[]):TileData{
 const out:TileData={boxes:[],trees:[],stops:[],signs:[],lights:[],blocks:[]};
 const box=(x:number,y:number,z:number,w:number,h:number,d:number,c:string,r=0)=>out.boxes.push({p:[x,y,z],s:[w,h,d],c,r});
 const tree=(x:number,z:number,seed:number)=>{box(x,1.1,z,.17,2,.17,'#705c43');out.trees.push({p:[x,2.5,z],s:[1,1.3,1],c:['#7e9e60','#bb954d','#8aab66'][seed%3]});};
 const building=(x:number,z:number,w:number,d:number,h:number,c:string)=>{box(x,h/2+.15,z,w,h,d,c);box(x,h+.23,z,w+.2,.18,d+.2,'#e2d6be');for(let y=1.3;y<h-.2;y+=1.8)for(let a=-w/2+.8;a<w/2;a+=1.6)box(x+a,y,z+d/2+.02,.65,.8,.04,'#3e616a');for(let y=1.3;y<h-.2;y+=1.8)for(let a=-d/2+.8;a<d/2;a+=1.6)box(x+w/2+.02,y,z+a,.04,.8,.65,'#50737a');box(x,.9,z+d/2+.04,.7,1.7,.06,'#345048');};
 const nodes=new Set<string>();
 for(const [cx,cz]of cells){if(cz>=0)continue;const x=cx*BLOCK,z=cz*BLOCK,seed=Math.abs(cx*71+cz*43),district=districtAt([x+12,z+12]),special=PLACES.find(p=>Math.floor(p.x/24)===cx&&Math.floor(p.z/24)===cz);const dense=district==='toronto'||district==='north-york';
  box(x+12,-.18,z+12,24,.2,24,'#8d9f72');
  // Every interior is occupied. Public destinations get a paved forecourt and garden.
  const park=!special&&seed%9===0,parking=!special&&!park&&seed%11===0;
  out.blocks.push({x,z,kind:special?'destination':park?'park':parking?'parking':dense?'shops':'houses'});
  box(x+12,.02,z+12,12.6,.12,12.6,park?'#80a45f':parking?'#59615e':special?'#c9b99c':'#b9b28e');
  if(special){box(x+12,.12,z+16.8,10,.08,3.8,'#dfcbaa');tree(x+7,z+7,seed);tree(x+17,z+7,seed+1);}
  else if(park){box(x+12,.12,z+12,1.5,.06,12,'#d7c49d');for(const [a,b]of [[8,8],[16,9],[17,16],[8,16]])tree(x+a,z+b,seed+a);box(x+15,.6,z+15,2,.15,.7,'#a17b51');box(x+15,1,z+14.7,2,.6,.12,'#b58e61');}
  else if(parking){for(let a=8;a<18;a+=2.4){box(x+a,.095,z+9,.08,.025,3.3,'#f1e5cb');box(x+a,.095,z+16,.08,.025,3.3,'#f1e5cb');}box(x+12,.095,z+7.4,11,.025,.08,'#f1e5cb');box(x+12,.095,z+17.6,11,.025,.08,'#f1e5cb');for(const a of [9,14]){box(x+a,.5,z+9,1.2,.65,2.4,a===9?'#a25543':'#c3c8bd');box(x+a,.95,z+9,1.05,.45,1.3,'#365660');}tree(x+18,z+12,seed);}
  else if(dense){const alley=district==='toronto';building(x+10,z+10,6.5,6,7+seed%12,['#be8d70','#b9ad91','#9aaead'][seed%3]);building(x+16.3,z+16.5,4,3.6,4.2,'#d0a781');box(x+16.3,2.1,z+18.8,4.3,.18,1,'#42725a');if(alley)box(x+12,.105,z+13.8,12, .05,1.6,'#454b49');}
  else {for(let i=0;i<2;i++){building(x+8.8+i*6,z+11,4.5,7,4.2+i%2,['#bd8b6b','#d2bb96','#a7b5a6'][(seed+i)%3]);box(x+8.8+i*6,4.5+i%2,z+11,4.9,.4,7.4,'#6b6256');box(x+8.8+i*6,.1,z+16.5,1.1,.08,3,'#d5c5a8');}tree(x+18,z+17,seed);}
  for(const axis of ['x','z'] as Axis[]){const road=roadAt(axis,axis==='x'?z:x,axis==='x'?x:z);const put=(along:number,across:number,y:number,length:number,width:number,height:number,c:string)=>axis==='x'?box(x+along,y,z+across,length,height,width,c):box(x+across,y,z+along,width,height,length,c);
   put(12,0,-.01,24,road.width,.12,'#303a3d');
   for(const side of [-1,1]){put(12,side*5,.13,14,1.45,.22,'#dbd7c8');put(12,side*(road.width/2+.1),.13,11,.18,.27,'#b9beb6');
    if(road.bike){put(12,side*(road.width/2+.55),.06,11,.75,.055,'#438a69');put(12,side*(road.width/2+.96),.1,11,.07,.02,'#dfebda');}
    if(road.arterial){put(12,side*.1,.067,11,.065,.025,'#efc755');for(let lane=1;lane<road.lanes/2;lane++)for(const a of [7.7,11.7,15.7])put(a,side*lane*road.laneWidth,.07,2,.065,.025,'#e6e9df');}
    if(road.tracks)for(const rail of [-.36,.36])put(12,side*road.laneWidth/2+rail,.09,24,.07,.04,'#a5acaa');
   }
   // Lamppost, bin, hydrant and a tree are repeated instances, not individual meshes.
   const px=axis==='x'?x+10:x+5.8,pz=axis==='x'?z+5.8:z+10;
   box(px,2.3,pz,.12,4.5,.12,'#485650');box(px+.5,4.5,pz,1.1,.1,.12,'#485650');box(px+.9,4.4,pz,.45,.12,.3,'#ffe6a3');box(px+2,.55,pz,.5,1,.5,'#496d54');box(px+3.2,.45,pz,.28,.8,.28,'#c85039');box(px+3.2,.6,pz,.65,.12,.2,'#d36341');tree(axis==='x'?x+17:x+5.8,axis==='x'?z+5.8:z+17,seed);
  }
  nodes.add(junctionKey(x,z));nodes.add(junctionKey(x+24,z));nodes.add(junctionKey(x,z+24));
 }
 for(const key of nodes){const [x,z]=key.split(',').map(Number);if(z>=0){if(z===0){const width=roadAt('z',x,-12).width;for(let across=-width/2+.3;across<width/2;across+=.65)box(x+across,.09,-5,.35,.025,1.4,'#f3f2e6');}continue;}const ns=roadAt('z',x,z),ew=roadAt('x',z,x),signals=signalized(x,z);
  box(x,.055,z,ns.width,.025,ew.width,'#303a3d');
  for(const axis of ['x','z'] as Axis[]){const road=axis==='x'?ew:ns;const put=(along:number,across:number,y:number,length:number,width:number,height:number,c:string)=>axis==='x'?box(x+along,y,z+across,length,height,width,c):box(x+across,y,z+along,width,height,length,c);
   for(const side of [-1,1]){for(let across=-road.width/2+.3;across<road.width/2;across+=.65)put(side*5,across,.09,1.4,.35,.025,'#f3f2e6');put(side*6.25,(axis==='x'?-side:side)*road.width/4,.09,.17,road.width/2-.15,.025,'#f5f1dc');
    // Flat ramp at each zebra landing; tactile yellow pad makes the curb break clear.
    for(const edge of [-1,1]){put(side*5,edge*(5.8+road.width/2)/2,.085,1.6,5.8-road.width/2,.09,'#c5c5b8');put(side*5,edge*(road.width/2+.2),.14,1.1,.35,.035,'#d1ad54');}
    const px=axis==='x'?x+side*5.9:x-side*5.9,pz=axis==='x'?z+side*5.9:z+side*5.9;
    box(px,1.8,pz,.12,3.6,.12,'#4a5754');
    if(signals){box(px,3.35,pz,.38,1.1,.35,'#27332e');out.lights.push({x,z,axis,p:[px,3.35,pz]});}
    else {out.stops.push({p:[px,2.9,pz],s:[.5,.5,1],c:'#bd4436'});out.signs.push({x:px,y:2.9,z:pz+.08,name:'STOP',axis:'x'});}
   }
   if(road.arterial)out.signs.push({x:x+6,y:4.1+(axis==='z'?.4:0),z:z+6,name:road.name,axis});
  }
 }
 return out;
}
export type Vehicle={id:number;axis:Axis;road:number;at:number;direction:1|-1;lane:number;kind:'car'|'bus'|'streetcar';length:number;speed:number;min:number;max:number;halted:boolean;stopKey?:string;waitUntil?:number;passed?:string};
export function trafficBudget(minutes:number,mobile:boolean,quality:boolean){const h=Math.floor(minutes/60)%24;return h<6||h>=22?(mobile?5:8):(h>=7&&h<10||h>=16&&h<19)?(mobile?(quality?18:10):(quality?36:20)):(mobile?(quality?12:8):(quality?24:14));}
export function vehiclePoint(v:Vehicle):Point{const r=roadAt(v.axis,v.road,v.at),offset=(Math.min(v.lane,r.lanes/2-1)+.5)*r.laneWidth*v.direction;return v.axis==='x'?[v.at,v.road+offset]:[v.road-offset,v.at];}
export function stepTraffic(vehicles:Vehicle[],dt:number,seconds:number,pedestrians:Point[],reservations:Map<string,{id:number;until:number}>){
 for(const [key,value]of reservations)if(value.until<=seconds)reservations.delete(key);
 for(const v of vehicles){const step=Math.min(dt,.08)*v.speed;let distance=step;const junction=v.direction>0?Math.ceil((v.at+.001)/24)*24:Math.floor((v.at-.001)/24)*24;const x=v.axis==='x'?junction:v.road,z=v.axis==='x'?v.road:junction,key=junctionKey(x,z),ahead=(junction-v.at)*v.direction,stop=6.5+v.length/2;
  if(ahead>=stop-.05&&ahead<=stop+step+.2){let blocked=false;
   if(signalized(x,z))blocked=signalAt(x,z,seconds,v.axis)!=='green';
   else if(v.passed!==key){if(v.stopKey!==key){v.stopKey=key;v.waitUntil=seconds+1.2;}blocked=seconds<(v.waitUntil||0);}
   const reservation=reservations.get(key);if(reservation&&reservation.id!==v.id)blocked=true;
   if(vehicles.some(other=>other!==v&&other.axis!==v.axis&&Math.abs(vehiclePoint(other)[0]-x)<5.5+other.length/2&&Math.abs(vehiclePoint(other)[1]-z)<5.5+other.length/2))blocked=true;
   if(blocked)distance=Math.min(distance,Math.max(0,ahead-stop));else {reservations.set(key,{id:v.id,until:seconds+(stop+6.5+v.length/2)/v.speed+1});v.passed=key;}
  }
  const p=vehiclePoint(v);
  for(const person of pedestrians){const forward=(person[v.axis==='x'?0:1]-v.at)*v.direction,lateral=Math.abs(person[v.axis==='x'?1:0]-p[v.axis==='x'?1:0]);if(forward>=0&&forward<7+v.length/2&&lateral<1.15)distance=Math.min(distance,Math.max(0,forward-v.length/2-1.1));}
  for(const other of vehicles){if(other===v||other.axis!==v.axis||other.road!==v.road||other.direction!==v.direction||other.lane!==v.lane)continue;const gap=(other.at-v.at)*v.direction;if(gap>0)distance=Math.min(distance,Math.max(0,gap-(v.length+other.length)/2-1));}
  v.halted=distance<step*.2;v.at+=distance*v.direction;
  if(v.at>v.max+v.length||v.at<v.min-v.length){v.at=v.direction>0?v.min-v.length:v.max+v.length;v.stopKey=undefined;v.passed=undefined;}
 }
}
