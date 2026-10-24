import {denseBlock} from './urban-form';
import {restBayX,hasBuildingDoor} from './building-entrances';
import {BLOCK,PLACES,districtAt,type Point} from './world';
import {districtArterials} from './geo';
export type Axis='x'|'z';
export type Road={axis:Axis;coordinate:number;name:string;lanes:2|4|6;width:number;laneWidth:number;tracks:boolean;bike:boolean;arterial:boolean};
// Real Toronto arterials, each gated to the along-range of the compressed map where that
// street actually runs. Everything off this list is a narrow 2-lane residential street.
// axis 'x' = E-W road keyed by z (along = x); axis 'z' = N-S road keyed by x (along = z).
type Arterial={axis:Axis;coordinate:number;along:[number,number];lanes:4|6;name?:string;west?:string;east?:string;tracks?:boolean;bike?:boolean};
// Core downtown + crosstown arterials: canonical real streets fixed to the compressed grid.
const CORE:Arterial[]=[
 {axis:'x',coordinate:-96,along:[-260,55],lanes:4,west:'Bloor St W',east:'Bloor St E',bike:true},
 {axis:'x',coordinate:-96,along:[55,160],lanes:4,name:'Danforth Ave'},
 {axis:'x',coordinate:-48,along:[-210,210],lanes:4,west:'Queen St W',east:'Queen St E',tracks:true},
 {axis:'x',coordinate:-24,along:[-130,130],lanes:4,west:'King St W',east:'King St E',tracks:true},
 {axis:'x',coordinate:-192,along:[-260,370],lanes:6,west:'Eglinton Ave W',east:'Eglinton Ave E'},
 {axis:'x',coordinate:-312,along:[-120,120],lanes:6,west:'Sheppard Ave W',east:'Sheppard Ave E'},
 {axis:'z',coordinate:0,along:[-470,0],lanes:4,name:'Yonge St'},
 {axis:'z',coordinate:-24,along:[-120,-10],lanes:4,name:'University Ave'},
 {axis:'z',coordinate:-48,along:[-130,-10],lanes:4,name:'Spadina Ave',tracks:true},
];
// Suburban arterials: real OSM street name per district, selected by identity (robust to
// list order) from the baked data, mapped to a compressed grid slot. Fallback keeps a real
// name if OSM lacks that street. See scripts/bake-osm.mjs / data/osm/geo.json.
const SLOTS:{d:string;orient:'ns'|'ew';match:string;axis:Axis;coordinate:number;along:[number,number];lanes:4|6;fallback:string}[]=[
 {d:'North York',orient:'ew',match:'Steeles',axis:'x',coordinate:-408,along:[-90,90],lanes:6,fallback:'Finch Ave W'},
 {d:'Scarborough',orient:'ew',match:'Lawrence',axis:'x',coordinate:-120,along:[150,370],lanes:4,fallback:'Lawrence Ave E'},
 {d:'Scarborough',orient:'ns',match:'Brimley',axis:'z',coordinate:240,along:[-240,-20],lanes:4,fallback:'Brimley Rd'},
 {d:'Scarborough',orient:'ns',match:'Kennedy',axis:'z',coordinate:216,along:[-240,-20],lanes:4,fallback:'Kennedy Rd'},
 {d:'Etobicoke',orient:'ew',match:'Lake Shore',axis:'x',coordinate:-24,along:[-240,-150],lanes:4,fallback:'Lake Shore Blvd W'},
 {d:'Etobicoke',orient:'ns',match:'Royal York',axis:'z',coordinate:-192,along:[-110,-10],lanes:4,fallback:'Royal York Rd'},
 {d:'Etobicoke',orient:'ns',match:'Kipling',axis:'z',coordinate:-216,along:[-110,-10],lanes:4,fallback:'Kipling Ave'},
 {d:'York',orient:'ns',match:'Jane',axis:'z',coordinate:-120,along:[-230,-150],lanes:4,fallback:'Jane St'},
 {d:'East York',orient:'ew',match:'Connor',axis:'x',coordinate:-120,along:[55,140],lanes:4,fallback:'O’Connor Dr'},
 {d:'East York',orient:'ns',match:'Pape',axis:'z',coordinate:96,along:[-180,-110],lanes:4,fallback:'Pape Ave'},
];
const SUBURBAN:Arterial[]=SLOTS.map(s=>{const list=districtArterials[s.d]?.[s.orient]||[];return {axis:s.axis,coordinate:s.coordinate,along:s.along,lanes:s.lanes,name:list.find(n=>n.includes(s.match))||s.fallback};});
const ARTERIALS:Arterial[]=[...CORE,...SUBURBAN];
export function roadAt(axis:Axis,coordinate:number,along=0):Road{
 const a=ARTERIALS.find(r=>r.axis===axis&&r.coordinate===coordinate&&along>=r.along[0]&&along<=r.along[1]);
 if(!a)return {axis,coordinate,name:'Local street',lanes:2,width:3.2,laneWidth:1.6,arterial:false,tracks:false,bike:false};
 const name=a.name??(along<0?a.west!:a.east!),laneWidth=a.lanes===6?1.4:1.6;
 return {axis,coordinate,name,lanes:a.lanes,width:a.lanes*laneWidth,laneWidth,arterial:true,tracks:!!a.tracks,bike:!!a.bike};
}
export const junctionKey=(x:number,z:number)=>`${x},${z}`;
export function signalAt(x:number,z:number,seconds:number,axis:Axis):'green'|'amber'|'red'{const phase=((seconds+(Math.round(x/24)*3+Math.round(z/24)*5))%32+32)%32;const start=axis==='z'?0:16;return phase>=start&&phase<start+11?'green':phase>=start+11&&phase<start+13?'amber':'red';}
export const signalized=(x:number,z:number)=>roadAt('z',x,z).arterial||roadAt('x',z,x).arterial;
export type Piece={p:[number,number,number];s:[number,number,number];c:string;r?:number;seat?:boolean};
export type Sign={x:number;y:number;z:number;name:string;axis:Axis};
export type TileData={boxes:Piece[];trees:Piece[];stops:Piece[];signs:Sign[];lights:{x:number;z:number;axis:Axis;p:[number,number,number]}[];blocks:{x:number;z:number;kind:string}[];ends:{x:number;z:number;kind:string}[]};
// Medium charcoal carriageway under the pastel palette; wear shades patch it subtly.
export const ASPHALT='#565b5f';
const WEAR=['#4f5458','#5f6468','#52575b'];
// Per-district building palettes (red/yellow brick, cream stone, soft glass); neighbours differ by seed offset.
const PALETTES:Record<string,string[]>={toronto:['#b35e4a','#c77f52','#d8a24e','#8d93a0','#6f93a6','#c7b69a'],'north-york':['#8f9faa','#6f93a6','#c7b69a','#b9875f','#9aa17f','#cdbb98'],scarborough:['#c6a36a','#b7895f','#9aa585','#cdbfa0','#a88a6b','#8f9faa'],etobicoke:['#a9b5ac','#c6b185','#8fa6a0','#b58a68','#9fb0a6','#cdbfa0'],york:['#b86b4f','#c99a5e','#9c8f6f','#c7ad83','#8f7f6a','#b0a187'],'east-york':['#b5935f','#c9b074','#93a06f','#bca47c','#a98f66','#9aa17f']};
const ROOFS=['#6b4a3b','#7a3f32','#5f6a63','#8a7a5a','#6d6256','#7f8a86'];
export function makeRoadTiles(cells:Point[],lightsOn=false):TileData{
 const out:TileData={boxes:[],trees:[],stops:[],signs:[],lights:[],blocks:[],ends:[]};
 const box=(x:number,y:number,z:number,w:number,h:number,d:number,c:string,r=0)=>out.boxes.push({p:[x,y,z],s:[w,h,d],c,r});
 const tree=(x:number,z:number,seed:number)=>{box(x,1.1,z,.17,2,.17,'#705c43');out.trees.push({p:[x,2.5,z],s:[1,1.3,1],c:['#7e9e60','#bb954d','#8aab66'][seed%3]});};
 const nodes=new Set<string>();
 for(const [cx,cz]of cells){if(cz>=0)continue;const x=cx*BLOCK,z=cz*BLOCK,seed=Math.abs(cx*71+cz*43),district=districtAt([x+12,z+12]),special=PLACES.find(p=>Math.floor(p.x/24)===cx&&Math.floor(p.z/24)===cz);const dense=denseBlock(district,cx,cz);
  // Building kit (axis-aligned boxes; the instancer only rotates on Y). Neighbours differ via seed.
  const pal=PALETTES[district]||PALETTES.toronto,wall=(i:number)=>pal[Math.floor(seed+i*2)%pal.length],roof=(i:number)=>ROOFS[Math.floor(seed+i)%ROOFS.length];
  const win=(s:number,glass=false)=>lightsOn?((seed+Math.round(s*7))%5<2?'#ffe3a1':glass?'#3b4a4c':'#36423f'):glass?((seed+Math.round(s))%3?'#9fc2c6':'#bad4d1'):'#3e616a';
  const roofKit=(bx:number,bz:number,w:number,d:number,h:number,s:number)=>{box(bx-w/4,h+.55,bz+d/6,1.5,.7,1.5,'#8f9088');box(bx+w/4,h+.95,bz-d/6,.85,1.2,.85,'#b7ac98');if(s%2)box(bx,h+.5,bz-d/4,2.2,.3,1.4,'#6d6f68');if(s%3===0){box(bx-w/5,h+.35,bz+d/4,2,.1,2,'#7c5a44');box(bx-w/5+.6,h+.58,bz+d/4,.5,.4,.5,'#8aa06a');}};
  const shopRow=(bx:number,bz:number,s:number)=>{const w=11,d=9,storeys=2+s%2,h=storeys*2.3+.9,c=wall(s);box(bx,h/2+.15,bz,w,h,d,c);box(bx,h+.3,bz,w+.3,.5,d+.3,'#d8cdb6');box(bx,1.15,bz+d/2+.04,w-1,1.9,.07,win(0,true));box(bx,2.4,bz+d/2+.08,w-.4,.55,.14,['#c2584a','#2f6d55','#d2a24e','#466a8a','#9a4e7a'][s%5]);box(bx,1.95,bz+d/2+.55,w-1.2,.08,.9,['#b8503f','#2f6d55','#cf9a4b','#3f6f8a'][s%4]);for(let f=1;f<storeys;f++)for(let a=-w/2+1.3;a<w/2-1;a+=2)box(bx+a,1.1+f*2.3+.5,bz+d/2+.05,1,1.1,.05,win(a+f));box(bx-w/2+1.1,1,bz+d/2+.06,1,1.7,.08,'#3a4f49');roofKit(bx,bz,w,d,h,s);};
  const stone=(bx:number,bz:number,s:number)=>{const w=10.5,d=9,h=8+s%3*2,c=['#cdc2ab','#c7b99c','#bdb199'][s%3];box(bx,h/2+.15,bz,w,h,d,c);box(bx,h+.35,bz,w+.4,.6,d+.4,'#b7ab8e');for(let f=0;f<Math.floor(h/2.2);f++)for(let a=-w/2+1.2;a<w/2-1;a+=1.9)box(bx+a,1.4+f*2.2,bz+d/2+.05,.9,1.4,.05,win(a+f));box(bx-w/2+1.2,1,bz+d/2+.06,1.2,1.9,.08,'#5a4636');roofKit(bx,bz,w,d,h,s);};
  const tower=(bx:number,bz:number,s:number)=>{const w=7.8,d=7.2,h=14+s%3*4.5,g=['#6f93a6','#5f8f88','#7fa2af'][s%3];box(bx,h/2+.15,bz,w,h,d,g);for(let f=0;f<Math.floor(h/2.1);f++){for(let a=-w/2+1;a<w/2-.6;a+=1.6)box(bx+a,1.3+f*2.1,bz+d/2+.04,1.2,1.4,.04,win(a+f,true));for(let a=-d/2+1;a<d/2-.6;a+=1.6)box(bx+w/2+.04,1.3+f*2.1,bz+a,.04,1.4,1.2,win(a+f+1,true));}box(bx,h+.55,bz,w*.62,1.1,d*.62,'#8f9699');box(bx+w/4,h+1.45,bz-d/5,.95,1.6,.95,'#b7ac98');box(bx-w/4,h+.85,bz+d/5,1.3,.7,1.3,'#8f9088');};
  const slab=(bx:number,bz:number,s:number)=>{const w=11,d=7,h=8+s%3*1.8,c=wall(s);box(bx,h/2+.15,bz,w,h,d,c);box(bx,h+.3,bz,w+.3,.5,d+.3,'#cfc6b0');for(let f=0;f<Math.floor(h/2.1);f++)for(let a=-w/2+1.3;a<w/2-1;a+=2.1){box(bx+a,1.2+f*2.1,bz+d/2+.04,1.2,1.1,.05,win(a+f));box(bx+a,.95+f*2.1,bz+d/2+.2,1.3,.1,.5,'#9a9488');}roofKit(bx,bz,w,d,h,s);};
  const house=(hx:number,hz:number,s:number)=>{const w=5.2,d=5.4,h=4.2+s%2*.8,c=wall(s),rc=roof(s);box(hx,h/2+.15,hz,w,h,d,c);box(hx,h+.4,hz,w+.35,.5,d+.35,rc);box(hx,h+.82,hz,w-1.3,.5,d+.35,rc);box(hx,h+1.15,hz,w-2.6,.45,d+.35,rc);box(hx-w/4,1.3,hz+d/2+.18,1.7,1.8,.4,c);box(hx-w/4,1.4,hz+d/2+.4,1.3,1.3,.06,win(1));box(hx+w/4,1,hz+d/2+.3,2,.1,1.1,'#b49a74');box(hx+w/4-.8,1.7,hz+d/2+.8,.13,1.5,.13,'#e2d8c2');box(hx+w/4+.8,1.7,hz+d/2+.8,.13,1.5,.13,'#e2d8c2');box(hx+w/4,2.5,hz+d/2+.78,2,.2,1.1,rc);box(hx+w/4,1,hz+d/2+.06,.8,1.5,.08,'#3a4f49');for(const a of [-w/4,w/4])box(hx+a,h-.8,hz+d/2+.05,.85,1,.05,win(a+2));box(hx+w/3,h+1.35,hz-d/4,.5,1.2,.5,'#8a5b47');};
  box(x+12,-.18,z+12,24,.2,24,'#8d9f72');
  // Every interior is occupied. Public destinations get a paved forecourt and garden.
  const park=!special&&seed%9===0,parking=!special&&!park&&seed%11===0;
  out.blocks.push({x,z,kind:special?'destination':park?'park':parking?'parking':dense?'shops':'houses'});
  box(x+12,.02,z+12,12.6,.12,12.6,park?'#80a45f':parking?'#59615e':special?'#c9b99c':'#b9b28e');
  if(special){box(x+12,.12,z+16.8,10,.08,3.8,'#dfcbaa');tree(x+7,z+7,seed);tree(x+17,z+7,seed+1);}
  else if(park){box(x+12,.12,z+12,1.5,.06,12,'#d7c49d');for(const [a,b]of [[8,8],[16,9],[17,16],[8,16]])tree(x+a,z+b,seed+a);box(x+15,.6,z+15,2,.15,.7,'#a17b51');box(x+15,1,z+14.7,2,.6,.12,'#b58e61');}
  else if(parking){for(let a=8;a<18;a+=2.4){box(x+a,.095,z+9,.08,.025,3.3,'#f1e5cb');box(x+a,.095,z+16,.08,.025,3.3,'#f1e5cb');}box(x+12,.095,z+7.4,11,.025,.08,'#f1e5cb');box(x+12,.095,z+17.6,11,.025,.08,'#f1e5cb');for(const a of [9,14]){box(x+a,.5,z+9,1.2,.65,2.4,a===9?'#a25543':'#c3c8bd');box(x+a,.95,z+9,1.05,.45,1.3,'#365660');}if(!dense){const pc=wall(3);box(x+12,1.7,z+11.8,12,3.1,3.4,pc);box(x+12,3.35,z+11.8,12.3,.4,3.7,'#d8cdb6');for(let a=-4.5;a<5;a+=2.2)box(x+12+a,1.5,z+13.4,1.6,1.4,.06,win(a,true));box(x+5.5,3.6,z+17.6,.4,3,.4,'#8a8f8c');box(x+5.5,5,z+17.6,2.1,1,.12,['#c2584a','#466a8a','#2f6d55'][seed%3]);}tree(x+18,z+12,seed);}
  else if(dense){if(district==='toronto'||district==='scarborough'){seed%4===0?tower(x+12,z+12,seed):seed%4===1?stone(x+12,z+12,seed):shopRow(x+12,z+12,seed);box(x+12,.105,z+16.5,12,.05,1.6,'#4a4f4d');}else{seed%3===0?slab(x+12,z+12,seed):tower(x+12,z+12,seed);}}
  else {if(seed%6===0)slab(x+12,z+12,seed);else{for(const [hx,hz]of [[8.5,8.5],[15.5,8.5],[8.5,14.2],[15.5,14.2]] as const)house(x+hx,z+hz,seed+hx+hz);for(const dx of [8.5,15.5])box(x+dx,.1,z+12,1.6,.06,5,'#ccbfa6');}}
  const benchX=restBayX(cx,PLACES.some(p=>hasBuildingDoor(p)&&Math.floor(p.x/24)===cx&&Math.floor(p.z/24)===cz));
  // Recessed rest bay: the seat and its occupant leave both through lanes open.
  box(benchX,.13,z+18.15,2.2,.22,2.4,'#dbd7c8');
  box(benchX,.85,z+17.8,1.7,.16,.65,'#a17b51');out.boxes[out.boxes.length-1].seat=true;
  box(benchX,1.26,z+17.4,1.7,.65,.12,'#b58e61');
  for(const leg of [-.62,.62]){box(benchX+leg,.46,z+17.8,.12,.75,.45,'#485650');out.boxes[out.boxes.length-1].seat=true;}
  for(const axis of ['x','z'] as Axis[]){const road=roadAt(axis,axis==='x'?z:x,axis==='x'?x:z);const put=(along:number,across:number,y:number,length:number,width:number,height:number,c:string)=>axis==='x'?box(x+along,y,z+across,length,height,width,c):box(x+across,y,z+along,width,height,length,c);
   // Clip N-S streets at the shore so they stop at the waterfront road / lookout, not in the lake.
   const shoreNS=cz===-1&&axis==='z',shoreEnd=district==='scarborough'?-3.2:-1.6,rLen=shoreNS?shoreEnd+24:24,rMid=shoreNS?(shoreEnd+24)/2:12;
   put(rMid,0,-.01,rLen,road.width,.12,ASPHALT);for(const w of [6,18])if(w<rLen)put(w,((seed+w)%2?1:-1)*road.width/4,.055,2.6+seed%2,road.width/3,.03,WEAR[(seed+w)%3]);
   for(const side of [-1,1]){put(12,side<0?-5.2125:5,.13,14,side<0?1.875:1.45,.22,'#dbd7c8');put(12,side*(road.width/2+.1),.13,11,.18,.27,'#b9beb6');
    if(road.bike){put(12,side*(road.width/2+.55),.06,11,.75,.055,'#438a69');put(12,side*(road.width/2+.96),.1,11,.07,.02,'#dfebda');}
    if(road.arterial){put(12,side*.1,.067,11,.065,.025,'#efc755');for(let lane=1;lane<road.lanes/2;lane++)for(const a of [7.7,11.7,15.7])put(a,side*lane*road.laneWidth,.07,2,.065,.025,'#e6e9df');}
    if(road.tracks)for(const rail of [-.36,.36])put(rMid,side*road.laneWidth/2+rail,.09,rLen,.08,.045,'#8a8f8c');
   }
   // Lamppost, bin, hydrant and a tree are repeated instances, not individual meshes.
   const px=axis==='x'?x+10:x+5.8,pz=axis==='x'?z+5.8:z+10;
   box(px,2.3,pz,.12,4.5,.12,'#485650');box(px+.5,4.5,pz,1.1,.1,.12,'#485650');box(px+.9,4.4,pz,.45,.12,.3,lightsOn?'#fff3c4':'#ffe6a3');box(px+1,.55,pz,.5,1,.5,'#496d54');box(px+3.2,.45,pz,.28,.8,.28,'#c85039');box(px+3.2,.6,pz,.65,.12,.2,'#d36341');tree(axis==='x'?x+17:x+5.8,axis==='x'?z+5.8:z+17,seed);
  }
  nodes.add(junctionKey(x,z));nodes.add(junctionKey(x+24,z));nodes.add(junctionKey(x,z+24));
  // Shore cells (south neighbour is Lake Ontario): never let a grid street dead-end at the water.
  if(cz===-1){
   const shoreName=district==='etobicoke'?'Lake Shore Blvd W':district==='toronto'?(x+12<0?'Queens Quay W':'Queens Quay E'):null;
   if(shoreName){
    // Continuous waterfront road along the lake; N-S grid streets meet it at T-junctions.
    box(x+12,-.01,-1.6,24,.12,3.4,ASPHALT);for(const s of [-1,1])box(x+12,.1,-1.6+s*1.85,24,.1,.26,'#b9beb6');box(x+12,.067,-1.6,24,.028,.06,'#efc755');
    box(x+12,.12,-3.5,24,.06,1,'#dbd7c8'); // promenade strip between road and the beach
    // Connect each grid street into Queens Quay: a proper T-intersection with sidewalk links and a crosswalk.
    for(const sdw of [-5,5])box(x+sdw,.13,-3.2,1.45,.22,3.8,'#dbd7c8');
    for(let a=-1.3;a<1.4;a+=.55)box(x+a,.09,-1.6,.34,.025,2.6,'#f3f2e6');
    out.signs.push({x:x+6,y:4.1,z:-1.6,name:shoreName,axis:'x'});out.ends.push({x,z:-1.6,kind:'waterfront'});
   }else{
    // Scarborough: no road along the Bluffs — the street ends at a clifftop lookout with bollards.
    box(x,.06,-3.2,5.6,.14,5,'#b9b28e');for(const b of [-1.8,0,1.8])box(x+b,.5,-1.1,.32,1,.32,'#9a9488');tree(x+3.4,z+21,seed);
    out.ends.push({x,z:-3.2,kind:'lookout'});
   }
  }
 }
 for(const key of nodes){const [x,z]=key.split(',').map(Number);if(z>=0)continue;const ns=roadAt('z',x,z),ew=roadAt('x',z,x),signals=signalized(x,z);
  box(x,.055,z,ns.width,.025,ew.width,ASPHALT);
  for(const axis of ['x','z'] as Axis[]){const road=axis==='x'?ew:ns;const put=(along:number,across:number,y:number,length:number,width:number,height:number,c:string)=>axis==='x'?box(x+along,y,z+across,length,height,width,c):box(x+across,y,z+along,width,height,length,c);
   for(const side of [-1,1]){
    // Mark every navigable crossing; local intersections retain stop signs.
    {for(let across=-road.width/2+.3;across<road.width/2;across+=.65)put(side<0?-5.2125:5,across,.09,side<0?1.875:1.4,.35,.025,'#f3f2e6');put(side*6.25,(axis==='x'?-side:side)*road.width/4,.09,.17,road.width/2-.15,.025,'#f5f1dc');
     for(const edge of [-1,1]){put(side*5,edge*(5.8+road.width/2)/2,.085,1.6,5.8-road.width/2,.09,'#c5c5b8');put(side*5,edge*(road.width/2+.2),.14,1.1,.35,.035,'#d1ad54');}}
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
