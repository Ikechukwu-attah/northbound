import {BLOCK,BOUNDS,PLACES,PERSON_PLACES,placeById,distance,sidewalk,inBounds,pointAlong,pathLength,type Point} from './world';
import {makeRoadTiles,roadAt} from './roads';
import {STOPS} from './transit';
export const PERSON_RADIUS=.32, WALK_HALF_WIDTH=.725;
export type Obstacle={x:number;z:number;halfX:number;halfZ:number};
const obstacles=new Map<string,Obstacle[]>();
/** The navigation mesh is the union of paved sidewalk/crossing rectangles and public forecourts.
 * Interiors and lake cells have no polygons. Prop footprints are subtracted with actor clearance. */
export function navSurface(p:Point,radius=PERSON_RADIUS):'sidewalk'|'crossing'|'plaza'|null{
 if(!inBounds(p))return null;
 const dx=Math.abs(p[0]-sidewalk(p[0])),dz=Math.abs(p[1]-sidewalk(p[1]));
 if(dx<=WALK_HALF_WIDTH-radius||dz<=WALK_HALF_WIDTH-radius){
  const roadX=Math.round(p[0]/BLOCK)*BLOCK,roadZ=Math.round(p[1]/BLOCK)*BLOCK;
  return dz<=WALK_HALF_WIDTH-radius&&Math.abs(p[0]-roadX)<roadAt('z',roadX,p[1]).width/2||dx<=WALK_HALF_WIDTH-radius&&Math.abs(p[1]-roadZ)<roadAt('x',roadZ,p[0]).width/2?'crossing':'sidewalk';
 }
 return PLACES.some(s=>Math.abs(p[0]-s.x)<4.8-radius&&p[1]>=s.z+5.2+radius&&p[1]<=s.z+7.7-radius)?'plaza':null;
}
export function staticObstacles(p:Point){const cx=Math.floor(p[0]/24),cz=Math.floor(p[1]/24),key=cx+','+cz;let result=obstacles.get(key);if(result)return result;
 const cells:Point[]=[];for(let x=cx-1;x<=cx+1;x++)for(let z=cz-1;z<=cz+1;z++)if(z<0)cells.push([x,z]);
 result=makeRoadTiles(cells).boxes.filter(b=>b.p[1]-b.s[1]/2<2&&b.p[1]+b.s[1]/2>.35).map(b=>({x:b.p[0],z:b.p[2],halfX:b.s[0]/2,halfZ:b.s[2]/2}));
 // Destination buildings, cafe furniture, and station props use the same offsets as their renderer.
 for(const s of PLACES.filter(s=>Math.abs(s.x-p[0])<48&&Math.abs(s.z-p[1])<48)){
  result.push({x:s.x,z:s.z,halfX:6.6,halfZ:4.4});
  if(s.kind==='cafe')result.push({x:s.x+5.4,z:s.z+1,halfX:1.25,halfZ:1.25});
 }
 for(const s of STOPS.filter(s=>distance(s.point,p)<48)){result.push({x:s.point[0]+1.5,z:s.point[1]-1.5,halfX:.1,halfZ:.1},{x:s.point[0]+3.1,z:s.point[1]-1.5,halfX:1.1,halfZ:.2});}
 result=result.filter(o=>Math.abs(o.x-(cx*24+12))<=13+o.halfX&&Math.abs(o.z-(cz*24+12))<=13+o.halfZ);if(obstacles.size>800)obstacles.clear();obstacles.set(key,result);return result;
}
export function isWalkable(p:Point,radius=PERSON_RADIUS){return !!navSurface(p,radius)&&!staticObstacles(p).some(o=>Math.abs(p[0]-o.x)<o.halfX+radius&&Math.abs(p[1]-o.z)<o.halfZ+radius);}
export function segmentWalkable(a:Point,b:Point){const n=Math.max(1,Math.ceil(distance(a,b)/.3));for(let i=0;i<=n;i++){const t=i/n;if(!isWalkable([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]))return false;}return true;}
/** Keep-right lanes within the same navmesh: opposite walkers can pass without changing models. */
export function lanePoint(path:Point[],fraction:number):Point{
 const p=pointAlong(path,fraction),ahead=pointAlong(path,Math.min(1,fraction+.0001)),behind=pointAlong(path,Math.max(0,fraction-.0001));
 const dx=ahead[0]-behind[0],dz=ahead[1]-behind[1],n=Math.hypot(dx,dz)||1;
 const q:Point=[p[0]-dz/n*.36,p[1]+dx/n*.36];
 // Leave the passing lane before reaching a footprint. Waiting until q is
 // blocked makes the diagonal step back to the centre clip the obstacle.
 const marginX=Math.abs(dx)/n*.8,marginZ=Math.abs(dz)/n*.8;
 const tight=staticObstacles(q).some(o=>Math.abs(q[0]-o.x)<o.halfX+PERSON_RADIUS+marginX&&Math.abs(q[1]-o.z)<o.halfZ+PERSON_RADIUS+marginZ);
 return !tight&&isWalkable(q)?q:p;
}
export type CrowdActor={id:string;path:Point[];progress:number;forward:boolean;wait:number;position:Point;heading:number;moving:boolean};
export function clearOfPeople(p:Point,people:Point[],gap=PERSON_RADIUS*2+.04){return people.every(q=>distance(p,q)>=gap);}
export const namedPosition=(id:string):Point=>{const p=placeById(PERSON_PLACES[id])!;return [p.x+2,p.z+5.8];};
export function stepCrowd(actors:CrowdActor[],dt:number,player:Point,playerAhead:Point=player){
 dt=Math.min(.06,dt);const named=Object.keys(PERSON_PLACES).map(namedPosition);
 for(const a of actors){a.moving=false;const others=actors.filter(b=>b!==a).map(b=>b.position);const people=[player,...named,...others];
  if(a.wait>0){a.wait-=dt;if(distance(a.position,player)>3)continue;}
  const len=pathLength(a.path)||1,progress=Math.min(1,a.progress+dt*1.15/len),path=a.forward?a.path:[...a.path].reverse();const target=lanePoint(path,progress);const dx=target[0]-a.position[0],dz=target[1]-a.position[1],n=Math.hypot(dx,dz)||1,step=Math.min(dt*1.5,n);
  const next:Point=[a.position[0]+dx/n*step,a.position[1]+dz/n*step];
  if(segmentWalkable(a.position,next)&&clearOfPeople(next,people)&&clearOfPeople(next,[playerAhead],.78)){a.position=next;a.moving=distance(next,target)<.1||step>.001;a.heading=Math.atan2(dx,dz);if(distance(next,target)<.08)a.progress=progress;}
  // Yield into the free edge/forecourt; no movement is accepted without the same mesh/collision test.
  else if(distance(a.position,playerAhead)<2.4||distance(a.position,player)<2.4){for(const offset of [[-.36,0],[.36,0],[0,-.36],[0,.36]] as Point[]){const q:Point=[a.position[0]+offset[0]*dt*5,a.position[1]+offset[1]*dt*5];if(segmentWalkable(a.position,q)&&clearOfPeople(q,people)&&distance(q,playerAhead)>distance(a.position,playerAhead)){a.position=q;break;}}}
  if(a.progress>=1&&distance(a.position,target)<.1){a.progress=0;a.forward=!a.forward;a.wait=3;}
  // Personal space: never let an NPC bunch on top of the player — nudge it directly away each
  // frame (player clearance wins over NPC-to-NPC spacing, which recovers on the next steps).
  const gapP=distance(a.position,player)||.001;if(gapP<.82){const ux=gapP>.05?(a.position[0]-player[0])/gapP:1,uz=gapP>.05?(a.position[1]-player[1])/gapP:0,out=Math.min(.12,.86-gapP);
   const radial:Point=[a.position[0]+ux*out,a.position[1]+uz*out];
   if(segmentWalkable(a.position,radial))a.position=radial;
   else for(const t of [[uz,-ux],[-uz,ux]] as Point[]){const q:Point=[a.position[0]+t[0]*.14,a.position[1]+t[1]*.14];if(segmentWalkable(a.position,q)){a.position=q;break;}}
   a.heading=Math.atan2(a.position[0]-player[0],a.position[1]-player[1]);}
 }
}
/** Shared swept-capsule movement used by the player renderer and regression simulations. */
export function advanceWalker(current:Point,path:Point[],fraction:number,increment:number,people:Point[]){
 const end=Math.min(1,fraction+Math.max(0,increment));
 // Subdivide along the route, not the chord between frame endpoints. A long
 // frame can straddle a turn; its chord would cut across an unwalkable block.
 const steps=Math.max(1,Math.ceil((end-fraction)*pathLength(path)/.2));
 let result={position:current,fraction};
 for(let i=1;i<=steps;i++){
  const nextFraction=i===steps?end:fraction+(end-fraction)*i/steps;
  // Static geometry (walls/buildings) hard-blocks; people are soft — the player pushes
  // past NPCs so a pedestrian on a narrow sidewalk can never freeze the walk. NPCs avoid
  // the player on their side (stepCrowd), so overlap is brief and rare.
  void people;
  const next=lanePoint(path,nextFraction);
  if(!segmentWalkable(result.position,next))break;
  result={position:next,fraction:nextFraction};
 }
 return result;
}
