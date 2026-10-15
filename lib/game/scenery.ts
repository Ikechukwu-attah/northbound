// Waterfront scenery for lake-edge landmarks (Scarborough Bluffs, Humber Bay).
// All lake-edge cells sit in the southern row (cz=-1) with Lake Ontario to the south (+z),
// so every piece here is placed on the lake side of the place entrance (local z=7) and the
// walkable forecourt/stop — water must never overlap walkable ground. Verified in
// tests/scenery.test.cjs. Coordinates are absolute world [x,z].
export type SceneBox={x:number;z:number;y:number;w:number;h:number;d:number;c:string;kind:'water'|'beach'|'cliff'|'path'};
export function shorelineScenery(spot:{x:number;z:number},kind:'bluffs'|'bay'):SceneBox[]{
 const out:SceneBox[]=[];
 const b=(lx:number,lz:number,y:number,w:number,h:number,d:number,c:string,k:SceneBox['kind'])=>out.push({x:spot.x+lx,z:spot.z+lz,y,w,h,d,c,kind:k});
 b(0,17,.05,22,.12,10,'#8fbdbf','water'); // the lake itself, well south of the walkable approach
 if(kind==='bluffs'){
  for(const lx of [-8,-4,0,4,8])b(lx,10,3.6,4.3,7.2,2.6,'#f2eee1','cliff'); // tall pale cliff faces at the shoreline
  b(0,12.6,.2,20,.3,2.4,'#e9ddba','beach'); // beach at the base of the cliffs
  b(0,13.8,.14,20,.1,1.3,'#c9bd98','path'); // the park path at the bottom, by the water
 }else{
  b(0,12.4,.2,22,.26,2.6,'#cdbf9c','path'); // lakeside promenade
  b(0,14,.16,22,.2,1.8,'#e4d8b4','beach');
 }
 return out;
}
