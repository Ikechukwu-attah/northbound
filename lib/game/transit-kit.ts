/** Dimensions shared by the TTC furnishings and the walkable interior. Original low-poly geometry. */
export type VehicleKind='subway'|'bus'|'streetcar';
export type KitPart={p:[number,number,number];s:[number,number,number];c:string;r?:[number,number,number];shape?:'box'|'tube';finish?:'metal'|'light'|'matte'};
export const TTC_INTERIOR={red:'#bb2633',silver:'#bfc6c8',panel:'#dfded6',black:'#242b2e',floor:'#535b5e',yellow:'#f2ca36',grip:'#b72a32'};
export function transitSeats(kind:VehicleKind){return [-2,2].flatMap(x=>[-6,-4.5,-3,-1.5,0,1.5,3].map(z=>({x,z,width:1.05,depth:1.2,rotation:kind==='bus'&&z<=0?0:x<0?Math.PI/2:-Math.PI/2,raised:kind==='bus'&&z<-5?.2:0})));}
export const TRANSIT_POLES=[[-.9,-5.5],[.9,1],[.9,5.8]] as const;
export function cabinFittings(kind:VehicleKind):KitPart[]{
 const p:KitPart[]=[],c=TTC_INTERIOR,rail=kind==='subway'?c.silver:c.yellow;
 const box=(at:KitPart['p'],s:KitPart['s'],color:string,finish:KitPart['finish']='matte',r?:KitPart['r'])=>p.push({p:at,s,c:color,finish,r});
 const tube=(at:KitPart['p'],length:number,radius=.035,color=rail,r?:KitPart['r'])=>p.push({p:at,s:[radius,length,radius],c:color,shape:'tube',finish:'metal',r});
 for(const seat of transitSeats(kind)){
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
 box(.4,0,.8,18,c.panel);box(3.08,0,.52,18,c.panel);box(.08,0,.16,18,c.black);
 const frames=kind==='bus'?[-8.9,-6.8,-3.8,-.8,2.2,4,6,8.9]:[-8.9,-6.4,-4.6,-1.6,1.6,4.1,5.9,8.9];
 for(const z of frames)box(1.9,z,2.2,.16,kind==='bus'?c.black:c.silver,.2);
 for(const z of [-7.65,-3.1,0,2.85,7.4]){box(2.68,z,.1,2.1,c.black,.2);box(.98,z,.1,2.1,c.black,.2);}
 if(kind==='bus')box(1.85,0,.065,17.7,c.black,.18);
 box(2.84,0,.08,17.8,'#fff4d7',.21);
 return p;
}
export function platformKit():KitPart[]{
 const p:KitPart[]=[],c=TTC_INTERIOR;
 for(let x=-5.5;x<=3.5;x+=1)for(let z=-6.5;z<=6.5;z+=1)p.push({p:[x,-.03,z],s:[.985,.06,.985],c:(Math.round(x+z)%3===0?'#a5aaa6':'#bdc0b8')});
 for(let z=-6.5;z<6.5;z+=.45){p.push({p:[3.75,.025,z],s:[.65,.06,.42],c:'#eac645'});for(const x of [3.55,3.75,3.95])p.push({p:[x,.06,z],s:[.05,.025,.05],c:'#d1a632'});}
 // Columns sit outside the walkable floor; tiled joints and the red belt repeat the reference.
 for(const z of [-5,1,6]){p.push({p:[-5.72,2.2,z],s:[.45,4.4,.65],c:'#dedbcf'});for(let y=.3;y<4.3;y+=.35){p.push({p:[-5.475,y,z],s:[.015,.018,.65],c:'#a9a99e'});}p.push({p:[-5.72,1.9,z],s:[.48,.35,.68],c:c.red});}
 for(let x=-5.6;x<5.9;x+=.6)for(let y=.25;y<4.3;y+=.5)p.push({p:[x,y,-6.98],s:[.585,.485,.1],c:y>1.5&&y<2.1?c.red:'#dfdbcd'});
 for(const x of [5.25,6.75])p.push({p:[x,-.25,-1],s:[.08,.12,25],c:c.silver,finish:'metal'});
 for(let z=-12;z<12;z+=.8)p.push({p:[6,-.38,z],s:[2.9,.14,.18],c:'#484c49'});
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
