/** Dimensions shared by the TTC furnishings and the walkable interior. Original low-poly geometry. */
export function surfaceBoarding(kind:'bus'|'streetcar'){
 const scale=kind==='bus'?2:1.5,center:[number,number]=[5.5,-2];
 const z=kind==='bus'?2.13:2.9;
 return {scale,center,door:[center[0]-.646*scale,center[1]+z*scale] as [number,number],landing:[3.5,center[1]+z*scale] as [number,number]};
}
export type VehicleKind='subway'|'bus'|'streetcar';
export type KitPart={p:[number,number,number];s:[number,number,number];c:string;r?:[number,number,number];shape?:'box'|'tube';finish?:'metal'|'light'|'matte'};
export const TTC_INTERIOR={red:'#bb2633',silver:'#bfc6c8',panel:'#dfded6',black:'#242b2e',floor:'#535b5e',yellow:'#f2ca36',grip:'#b72a32'};
export function transitSeats(kind:VehicleKind){return [-2,2].flatMap(x=>[-6,-4.5,-3,-1.5,0,1.5,3].map(z=>({x,z,width:1.05,depth:1.2,rotation:kind==='bus'&&z<=0?0:x<0?Math.PI/2:-Math.PI/2,raised:kind==='bus'&&z<-5?.2:0})));}
export const TRANSIT_POLES=[[-.9,-5.5],[.9,1],[.9,5.8]] as const;
export function cabinFittings(kind:VehicleKind):KitPart[]{
 const p:KitPart[]=[],c=TTC_INTERIOR,rail=kind==='subway'?c.silver:c.yellow;
 const box=(at:KitPart['p'],s:KitPart['s'],color:string,finish:KitPart['finish']='matte',r?:KitPart['r'])=>p.push({p:at,s,c:color,finish,r});
 const tube=(at:KitPart['p'],length:number,radius=.035,color=rail,r?:KitPart['r'])=>p.push({p:at,s:[radius,length,radius],c:color,shape:'tube',finish:'metal',r});
 if(kind==='subway'){
  // Toronto Rocket: continuous longitudinal benches along both walls (seat pads on a shared frame), facing the aisle.
  for(const side of [-1,1]){const x=side*2;
   box([x,.33,-1.5],[1,.5,10],c.black);                      // continuous bench base
   box([x,.6,-1.5],[1.08,.14,10.1],c.silver,'metal');        // continuous seat-pan frame
   box([side*2.56,1.18,-1.5],[.14,1.05,10],c.silver,'metal');// continuous backrest frame on the wall side
   for(const z of [-6,-4.5,-3,-1.5,0,1.5,3]){
    box([x,.68,z],[.96,.13,1.28],c.red);                     // seat pad
    box([side*2.49,1.2,z],[.1,.84,1.28],c.red);              // backrest pad
    tube([x,.95,z-.72],.95,.022,c.silver,[Math.PI/2,0,side<0?Math.PI/2:-Math.PI/2]); // divider rail
   }
  }
 } else for(const seat of transitSeats(kind)){
  const co=Math.cos(seat.rotation),si=Math.sin(seat.rotation),at=(x:number,y:number,z:number):KitPart['p']=>[seat.x+co*x+si*z,y+seat.raised,seat.z-si*x+co*z];
  box(at(0,.35,0),[.82,.48,.7],c.black);box(at(0,.59,0),[1.05,.16,1.12],c.silver,'metal',[0,seat.rotation,0]);box(at(0,.68,.03),[.96,.14,1.02],c.red,'matte',[0,seat.rotation,0]);
  box(at(0,1.12,-.5),[1.05,1.02,.15],c.silver,'metal',[0,seat.rotation,0]);box(at(0,1.15,-.395),[.93,.84,.11],c.red,'matte',[0,seat.rotation,0]);
  for(const edge of [-.51,.51])tube(at(edge,.97,-.1),.95,.025,c.silver,[Math.PI/2,0,seat.rotation]);
  if(seat.raised)box([seat.x,.09,seat.z],[1.4,.18,1.4],c.black);
 }
 for(const [x,z]of TRANSIT_POLES){tube([x,1.7,z],3.4,.035);tube([x,.06,z],.1,.09,c.silver);if(kind==='subway')tube([x,1.45,z],.75,.05,c.grip);}
 for(const x of [-1.45,1.45]){tube([x,2.8,0],16.5,.04,rail,[Math.PI/2,0,0]);for(const z of [-6,-3,0,3,6]){tube([x,3.08,z],.55,.025,c.silver);}}
 // Door threshold and priority-bay floor markings.
 for(const z of [-5.5,5]){box([0,.018,z],[5.8,.025,.055],kind==='subway'?c.red:c.yellow);for(const x of [-2.7,2.7])box([x,.025,z],[.45,.04,1.65],c.yellow);}
 if(kind==='bus'){box([-1.5,.5,7.7],[1,.25,1],c.black);box([-1.5,1.25,8.25],[1.6,.35,.7],c.black);box([-2.5,1.7,7.7],[.08,2.2,2.1],c.black);box([0,.023,7],[5.7,.03,.08],'#f1eee2');}
 return p;
}
export function cabinSide(kind:VehicleKind,side:number):KitPart[]{
 const c=TTC_INTERIOR,p:KitPart[]=[];const box=(y:number,z:number,height:number,depth:number,color:string,thick=.15)=>p.push({p:[side*3,y,z],s:[thick,height,depth],c:color,finish:color===c.silver?'metal':'matte'});
 const doorSide=kind==='subway'||side===1;
 const spans=doorSide?[[-9,-6.4],[-4.6,4.1],[5.9,9]]:[[-9,9]];
 for(const [lo,hi]of spans){box(.4,(lo+hi)/2,.8,hi-lo,c.panel);box(.08,(lo+hi)/2,.16,hi-lo,c.black);}
 box(3.08,0,.52,18,c.panel);
 const frames=kind==='bus'?[-8.9,-6.8,-3.8,-.8,2.2,4,6,8.9]:[-8.9,-6.4,-4.6,-1.6,1.6,4.1,5.9,8.9];
 for(const z of frames)box(1.9,z,2.2,.16,kind==='bus'?c.black:c.silver,.2);
 for(const z of [-7.65,-3.1,0,2.85,7.4]){box(2.68,z,.1,2.1,c.black,.2);box(.98,z,.1,2.1,c.black,.2);}
 if(kind==='bus')box(1.85,0,.065,17.7,c.black,.18);
 box(2.84,0,.08,17.8,'#fff4d7',.21);
 return p;
}
export const WORLD_DEPTH=480;
export function platformKit():KitPart[]{
 const p:KitPart[]=[{p:[-1,-.12,0],s:[10,.24,WORLD_DEPTH],c:'#bdc0b8'},
 {p:[3.75,.025,0],s:[.65,.06,WORLD_DEPTH],c:TTC_INTERIOR.yellow},
 {p:[-5.9,2.2,0],s:[.2,4.4,WORLD_DEPTH],c:'#dfdbcd'},
 {p:[-5.76,1.9,0],s:[.08,.35,WORLD_DEPTH],c:TTC_INTERIOR.red},
 {p:[6,-.48,0],s:[3.7,.25,WORLD_DEPTH],c:'#303638'}];
 for(let z=-WORLD_DEPTH/2;z<WORLD_DEPTH/2;z+=2){p.push({p:[-1,.008,z],s:[10,.018,.025],c:'#929990'},{p:[6,-.3,z],s:[2.9,.14,.18],c:'#484c49'});}
 for(const x of [-4,-2,0,2])p.push({p:[x,.008,0],s:[.025,.018,WORLD_DEPTH],c:'#929990'});
 for(const x of [5.25,6.75])p.push({p:[x,-.2,0],s:[.08,.12,WORLD_DEPTH],c:TTC_INTERIOR.silver,finish:'metal'});
 for(let z=-WORLD_DEPTH/2;z<WORLD_DEPTH/2;z+=12)p.push({p:[-5.65,2.2,z],s:[.45,4.4,.65],c:'#dedbcf'},{p:[-5.65,1.9,z],s:[.48,.35,.68],c:TTC_INTERIOR.red});
 return p;
}
/** Platform train, built in car-local coordinates with its boarding door at z=0. */
export function subwayExterior():KitPart[]{
 const p:KitPart[]=[],c=TTC_INTERIOR,box=(at:KitPart['p'],s:KitPart['s'],color:string)=>p.push({p:at,s,c:color,finish:color===c.silver?'metal':'matte'});
 box([0,.3,0],[2.8,.35,19.8],c.silver);box([0,3.1,0],[2.85,.35,20],c.silver);for(const z of [-5.5,5.5])box([0,.9,z],[2.7,.85,8.8],c.panel);
 for(const side of [-1,1]){box([side*1.42,2.92,0],[.08,.28,19.8],c.red);for(const z of [-8,-3,2,7]){box([side*1.4,1.8,z],[.12,1.35,2.2],c.black);box([side*1.47,1.8,z],[.035,1.1,1.9],'#597b82');box([side*1.43,.85,z],[.08,.85,2.2],c.red);}for(const z of [-9.9,-6.8,-5.6,-4.3,-1.8,1.8,4.5,5.7,9.9])box([side*1.4,1.82,z],[.16,2.25,.22],c.silver);}
 box([0,1.7,-10],[2.8,2.55,.15],c.silver);box([0,2,-10.1],[2.35,1.1,.05],c.black);box([0,1,-10.13],[2.65,.4,.05],c.red);
 for(const x of [-1.1,1.1])for(const z of [-7,7])p.push({p:[x,.12,z],s:[.3,.17,.3],c:c.black,shape:'tube',r:[0,0,Math.PI/2],finish:'metal'});
 return p;
}

/** Six connected Toronto Rocket cars, with the playable third car at z=0.
 * 18-unit cars are joined by two-unit open gangways; both end cabs stay outside
 * the fixed camera envelope. Environment length is independent of train length. */
export const TRAIN_SCENERY_OFFSETS=[-40,-20,0,20,40,60];
export const TRAIN_MIN_Z=-49,TRAIN_MAX_Z=69;
export const TRAIN_SCENERY_DEPTH=TRAIN_MAX_Z-TRAIN_MIN_Z;
export const TRAIN_FOG_END=110;
export function repeatTrainParts(parts:KitPart[],offsets=TRAIN_SCENERY_OFFSETS):KitPart[]{return offsets.flatMap(z=>parts.map(p=>({...p,p:[p.p[0],p.p[1],p.p[2]+z] as [number,number,number]})));}
export function trainGangways():KitPart[]{
 const p:KitPart[]=[];
 for(const offset of TRAIN_SCENERY_OFFSETS.slice(0,-1)){
  const z=offset+10;
  p.push({p:[0,-.025,z],s:[2.8,.1,2.1],c:TTC_INTERIOR.floor},{p:[0,3.3,z],s:[2.8,.16,2.1],c:TTC_INTERIOR.black});
  for(const side of [-1,1]){
   // End shoulders frame a clear walk-through opening, never a solid end wall.
   for(const edge of [-1,1])p.push({p:[side*2.2,1.6,z+edge],s:[1.6,3.2,.12],c:TTC_INTERIOR.panel});
   for(let n=0;n<10;n++)p.push({p:[side*1.46,1.6,z-.9+n*.2],s:[.12,3.2,.1],c:n%2?'#626968':'#343b3b'});
  }
 }
 // End cabs exist, but camera limits/fog keep them out of the riding view.
 for(const z of [TRAIN_MIN_Z,TRAIN_MAX_Z])p.push({p:[0,1.7,z],s:[6,3.4,.16],c:TTC_INTERIOR.silver});
 return p;
}
/** Continuous scenery tiles wrap by one tile only; boundaries lie beyond far clip. */
export function rideEnvironment(subway:boolean,platformSide:1|-1,atStation:boolean):KitPart[]{
 const p:KitPart[]=[{p:[0,-.7,0],s:[WORLD_DEPTH,1,WORLD_DEPTH],c:subway?'#303638':'#52595b'}];
 if(subway){
  for(const x of [-1.7,1.7])p.push({p:[x,-.12,0],s:[.12,.18,WORLD_DEPTH],c:TTC_INTERIOR.silver,finish:'metal'});
  for(const side of [-1,1]){
   const platform=atStation&&side===platformSide;
   p.push({p:[side*8,2.5,0],s:[.3,7,WORLD_DEPTH],c:platform?'#dad7ca':'#3a4142'});
   if(platform)p.push({p:[side*5.5,-.09,0],s:[4.7,.2,WORLD_DEPTH],c:'#b2b5ae'},{p:[side*3.35,.04,0],s:[.35,.05,WORLD_DEPTH],c:TTC_INTERIOR.yellow},{p:[side*7.8,1.8,0],s:[.08,.3,WORLD_DEPTH],c:TTC_INTERIOR.red});
  }
 }else for(const side of [-1,1])p.push({p:[side*7,-.12,0],s:[5,.3,WORLD_DEPTH],c:'#c5c4b1'},{p:[side*4.6,0,0],s:[.2,.4,WORLD_DEPTH],c:'#dfdfd3'});
 for(let z=-WORLD_DEPTH/2;z<WORLD_DEPTH/2;z+=12){
  if(subway){p.push({p:[0,-.24,z],s:[4,.18,.3],c:'#272d2e'});for(const side of [-1,1])p.push({p:[side*7.75,3.6,z],s:[.08,.18,3],c:'#e7d9b6',finish:'light'});}
  else for(const side of [-1,1]){const h=7+Math.abs(z/12)%3*2;p.push({p:[side*12,h/2,z],s:[6,h,12.1],c:z%24?'#bda183':'#aebbbb'});for(let y=1;y<h;y+=1.5)p.push({p:[side*8.95,y,z],s:[.07,.8,8],c:'#557780'});p.push({p:[side*6,.6,z+3],s:[.25,1.2,.25],c:'#5f7058'},{p:[side*6,2,z+3],s:[1.2,1.5,1.2],c:'#91a16e'});}
 }
 return p;
}
