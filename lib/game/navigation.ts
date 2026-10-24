import {communityBoards,streetHosts} from './street-life';
import {streetATMs} from './atms';
import {buildingApproachSurface} from './building-catalog';
import {peopleAt,personAt} from './schedules';
import {BLOCK,BOUNDS,PLACES,PERSON_PLACES,placeById,distance,sidewalk,inBounds,pointAlong,pathLength,onSidewalk,homeApproachAt,type Point} from './world';
import {makeRoadTiles,roadAt} from './roads';
import {STOPS,LINES} from './transit';
import {homeEntrance,restBayX,hasBuildingDoor} from './building-entrances';
export const PERSON_RADIUS=.32, WALK_HALF_WIDTH=.725;
// Only surface (bus/streetcar) stops have a street waiting shelter; subway stations are entrances.
// world → navigation → transit → world is a shared runtime dependency cycle.
// Read transit data only after module initialization, when navigation is used.
let shelterStops:Set<string>|undefined;
function getShelterStops(){return shelterStops??=new Set(STOPS.map(s=>s.id).filter(id=>!LINES.some(l=>l.mode==='subway'&&l.stops.includes(id))));}
export type Obstacle={x:number;z:number;halfX:number;halfZ:number};
const obstacles=new Map<string,Obstacle[]>();
/** The navigation mesh is the union of paved sidewalk/crossing rectangles and public forecourts.
 * Interiors and lake cells have no polygons. Prop footprints are subtracted with actor clearance. */
export function navSurface(p:Point,radius=PERSON_RADIUS):'sidewalk'|'crossing'|'plaza'|null{
 if(!inBounds(p)&&!(p.every(Number.isFinite)&&p[0]>=BOUNDS.west&&p[0]<=BOUNDS.east&&p[1]>=BOUNDS.north&&p[1]<=BOUNDS.south+WALK_HALF_WIDTH-radius))return null;
 const ox=p[0]-sidewalk(p[0]),oz=p[1]-sidewalk(p[1]),dx=Math.abs(ox),dz=Math.abs(oz);
 const inside=(v:number)=>v>=-1.15+radius&&v<=WALK_HALF_WIDTH-radius;
 if(inside(ox)||inside(oz)){
  const roadX=Math.round(p[0]/BLOCK)*BLOCK,roadZ=Math.round(p[1]/BLOCK)*BLOCK;
  return inside(oz)&&Math.abs(p[0]-roadX)<roadAt('z',roadX,p[1]).width/2||inside(ox)&&Math.abs(p[1]-roadZ)<roadAt('x',roadZ,p[0]).width/2?'crossing':'sidewalk';
 }
 if(buildingApproachSurface(p,radius))return 'plaza';
 const cx=Math.floor(p[0]/24),cz=Math.floor(p[1]/24),bx=restBayX(cx,PLACES.some(s=>hasBuildingDoor(s)&&Math.floor(s.x/24)===cx&&Math.floor(s.z/24)===cz)),bz=cz*24;
 if(PLACES.some(s=>hasBuildingDoor(s)&&Math.abs(p[0]-s.x)<homeEntrance(s).width/2-radius&&p[1]>=s.z+2.7+radius&&p[1]<=s.z+7.7-radius))return 'plaza';
 if(Math.abs(p[0]-bx)<=1.1-radius&&p[1]>=bz+16.95+radius&&p[1]<=bz+19.35-radius)return 'plaza';
 return PLACES.some(s=>Math.abs(p[0]-s.x)<4.8-radius&&p[1]>=s.z+5.2+radius&&p[1]<=s.z+7.7-radius)?'plaza':null;
}
export function staticObstacles(p:Point){const cx=Math.floor(p[0]/24),cz=Math.floor(p[1]/24),key=cx+','+cz;let result=obstacles.get(key);if(result)return result;
 const cells:Point[]=[];for(let x=cx-1;x<=cx+1;x++)for(let z=cz-1;z<=cz+1;z++)if(z<0)cells.push([x,z]);
 result=makeRoadTiles(cells).boxes.filter(b=>!b.seat&&b.p[1]-b.s[1]/2<2&&b.p[1]+b.s[1]/2>.35).map(b=>({x:b.p[0],z:b.p[2],halfX:b.s[0]/2,halfZ:b.s[2]/2}));
 for(const b of communityBoards())if(distance(b.point,p)<48)result.push({x:b.point[0],z:b.point[1],halfX:.9,halfZ:.1});
 for(const a of streetATMs())if(distance(a.point,p)<48)result.push({x:a.point[0],z:a.point[1],halfX:.425,halfZ:.3});
 // Destination buildings, cafe furniture, and station props use the same offsets as their renderer.
 for(const s of PLACES.filter(s=>Math.abs(s.x-p[0])<48&&Math.abs(s.z-p[1])<48)){
  if(s.kind!=='park')result.push({x:s.x,z:s.z,halfX:s.kind==='landmark'?4.5:4.3,halfZ:hasBuildingDoor(s)?(s.id==='cn'?3:2.5):4.4});
  if(s.kind==='cafe')result.push({x:s.x+5.4,z:s.z+1,halfX:1.25,halfZ:1.25});
 }
 for(const s of STOPS.filter(s=>getShelterStops().has(s.id)&&distance(s.point,p)<48)){result.push({x:s.point[0]+1.5,z:s.point[1]-1.5,halfX:.1,halfZ:.1},{x:s.point[0]+3.1,z:s.point[1]-1.5,halfX:1.1,halfZ:.2});}
 result=result.filter(o=>Math.abs(o.x-(cx*24+12))<=13+o.halfX&&Math.abs(o.z-(cz*24+12))<=13+o.halfZ);if(obstacles.size>800)obstacles.clear();obstacles.set(key,result);return result;
}
export function isWalkable(p:Point,radius=PERSON_RADIUS){return !!navSurface(p,radius)&&!staticObstacles(p).some(o=>Math.abs(p[0]-o.x)<o.halfX+radius&&Math.abs(p[1]-o.z)<o.halfZ+radius);}
export function segmentWalkable(a:Point,b:Point){const n=Math.max(1,Math.ceil(distance(a,b)/.3));for(let i=0;i<=n;i++){const t=i/n;if(!isWalkable([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]))return false;}return true;}
/** Keep-right lanes within the same navmesh: opposite walkers can pass without changing models. */
export function lanePoint(path:Point[],fraction:number):Point{
 const p=pointAlong(path,fraction);if(!onSidewalk(p))return p;const ahead=pointAlong(path,Math.min(1,fraction+.0001)),behind=pointAlong(path,Math.max(0,fraction-.0001));
 const dx=ahead[0]-behind[0],dz=ahead[1]-behind[1],n=Math.hypot(dx,dz)||1;
 const q:Point=[p[0]-dz/n*.36,p[1]+dx/n*.36];
 // Leave the passing lane before reaching a footprint. Waiting until q is
 // blocked makes the diagonal step back to the centre clip the obstacle.
 const marginX=Math.abs(dx)/n*.8,marginZ=Math.abs(dz)/n*.8;
 const tight=staticObstacles(q).some(o=>Math.abs(q[0]-o.x)<o.halfX+PERSON_RADIUS+marginX&&Math.abs(q[1]-o.z)<o.halfZ+PERSON_RADIUS+marginZ);
 return !tight&&isWalkable(q)?q:p;
}
export type CrowdActor={id:string;path:Point[];progress:number;forward:boolean;wait:number;position:Point;heading:number;moving:boolean;yielding?:string};
export function clearOfPeople(p:Point,people:Point[],gap=PERSON_RADIUS*2+.04){return people.every(q=>distance(p,q)>=gap);}
export const namedPosition=(id:string):Point=>{const p=placeById(PERSON_PLACES[id])!;return [p.x+2,p.z+5.8];};
export const scheduledPositions=(minutes:number):Point[]=>peopleAt(minutes).map(p=>{const spot=placeById(p.place)!;return [spot.x+2,spot.z+5.8] as Point;});
export const publicPeoplePositions=(minutes:number):Point[]=>[...scheduledPositions(minutes),...streetHosts(minutes).map(b=>b.person)];
/** Swept personal space, including recovery if an old save starts with an overlap. */
export function peopleSegmentClear(a:Point,b:Point,people:Point[],gap=.68){
 const dx=b[0]-a[0],dz=b[1]-a[1],len=dx*dx+dz*dz;
 return people.every(p=>{const initial=distance(a,p),t=len?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/len)):0;
  const closest=distance([a[0]+dx*t,a[1]+dz*t],p);
  return initial<gap?distance(b,p)>initial+1e-6&&closest>=initial-1e-6:closest>=gap-1e-6;});
}
/** Choose a clear parallel lane before reaching a person, rather than stopping nose-to-nose. */
export function passingPoint(current:Point,path:Point[],fraction:number,people:Point[]):Point{
 const normal=lanePoint(path,fraction),p=pointAlong(path,fraction);
 if(!people.some(q=>distance(q,current)<3))return normal;
 if(!onSidewalk(p)&&!homeApproachAt(p))return normal;
 const behind=pointAlong(path,Math.max(0,fraction-.001));
 const tangent=pointAlong(path,Math.min(1,fraction+.00001)),horizontal=Math.abs(tangent[0]-behind[0])>=Math.abs(tangent[1]-behind[1]),axis=horizontal?1:0;
 // Prefer the current side while passing, so two agents do not oscillate across each other.
 const retained:[number,number]=[p[0],p[1]];retained[axis]=current[axis];
 const candidates=[normal,retained,...[-.78,-.36,.36].map(offset=>{const q:Point=[...p];q[axis]+=offset;return q;})];
 const scored=candidates.filter(q=>segmentWalkable(current,q)&&peopleSegmentClear(current,q,people)).map(q=>{
  // Look along the current corridor, rather than cutting diagonally across a
  // nearby turn. A chord around a corner can wrongly reject the clear lane.
  const along=horizontal?0:1,sign=Math.sign(tangent[along]-behind[along])||1;
  const look:Point=[...q];look[along]+=sign*1.8;
  const blocked=!peopleSegmentClear(q,look,people);
  return {q,score:(blocked?20:0)+(!segmentWalkable(q,look)?1:0)+Math.abs(q[axis]-current[axis])*.3+distance(q,normal)*.04};
 }).sort((a,b)=>a.score-b.score);
 return scored[0]?.q||current;
}
export function stepCrowd(actors:CrowdActor[],dt:number,player:Point,playerAhead:Point=player,minutes=540){
 dt=Math.min(.06,dt);const named=publicPeoplePositions(minutes);
 for(const a of actors){a.moving=false;const people=[player,...named,...actors.filter(b=>b!==a).map(b=>b.position)];
  if(!clearOfPeople(a.position,people)){
   const candidates=Array.from({length:16},(_,i):Point=>[a.position[0]+Math.cos(i*Math.PI/8)*dt*1.5,a.position[1]+Math.sin(i*Math.PI/8)*dt*1.5]);
   const penalty=(q:Point)=>people.reduce((sum,p)=>sum+Math.max(0,.68-distance(q,p))**2,0),before=penalty(a.position);
   const next=candidates.filter(q=>segmentWalkable(a.position,q)&&people.filter(p=>distance(a.position,p)>=.68).every(p=>peopleSegmentClear(a.position,q,[p]))&&penalty(q)<before-1e-8).sort((x,y)=>penalty(x)-penalty(y))[0];
   if(next){a.heading=Math.atan2(next[0]-a.position[0],next[1]-a.position[1]);a.position=next;a.moving=true;}continue;
  }
  if(a.wait>0){a.wait-=dt;if(distance(a.position,player)>3)continue;}
  const ownPath=a.forward?a.path:[...a.path].reverse(),ownAhead=pointAlong(ownPath,Math.min(1,a.progress+.02));
  const opponent=actors.find(b=>b!==a&&a.id>b.id&&distance(a.position,b.position)<2.5&&distance(a.position,player)<3&&(()=>{const bp=b.forward?b.path:[...b.path].reverse(),ba=pointAlong(bp,Math.min(1,b.progress+.02));return (ownAhead[0]-a.position[0])*(ba[0]-b.position[0])+(ownAhead[1]-a.position[1])*(ba[1]-b.position[1])<0;})());
  if(opponent)a.yielding=opponent.id;
  const yielding=actors.find(b=>b.id===a.yielding);
  if(yielding&&distance(a.position,yielding.position)<3){
   const center=pointAlong(ownPath,a.progress),horizontal=Math.abs(ownAhead[0]-center[0])>Math.abs(ownAhead[1]-center[1]),along=horizontal?0:1,across=horizontal?1:0;
   const target:Point=[...center];target[across]=sidewalk(center[across])+.36;
   const sign=center[along]>=player[along]?1:-1;target[along]=player[along]+sign*1.7;
   const dx=target[0]-a.position[0],dz=target[1]-a.position[1],len=Math.hypot(dx,dz)||1,step=Math.min(dt*1.5,len);
   const next:Point=[a.position[0]+dx/len*step,a.position[1]+dz/len*step];
   if(segmentWalkable(a.position,next)&&peopleSegmentClear(a.position,next,people)){a.heading=Math.atan2(dx,dz);a.position=next;a.moving=step>.001;}
   continue;
  }else delete a.yielding;
  const len=pathLength(a.path)||1,progress=Math.min(1,a.progress+dt*1.15/len),path=a.forward?a.path:[...a.path].reverse();
  // Actual swept positions provide clearance; a distant preview point must not block a lane.
  const target=passingPoint(a.position,path,progress,people),dx=target[0]-a.position[0],dz=target[1]-a.position[1],n=Math.hypot(dx,dz),step=Math.min(dt*1.5,n);
  if(n>.00001){const next:Point=[a.position[0]+dx/n*step,a.position[1]+dz/n*step];
   if(segmentWalkable(a.position,next)&&peopleSegmentClear(a.position,next,people)){a.position=next;a.moving=true;a.heading=Math.atan2(dx,dz);if(distance(next,target)<.025)a.progress=progress;}
  }
  if(a.progress>=1){a.progress=0;a.forward=!a.forward;a.wait=3;}
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
  const next=passingPoint(result.position,path,nextFraction,people);
  if(distance(next,result.position)<1e-8&&distance(pointAlong(path,nextFraction),pointAlong(path,result.fraction))>.001)break;
  if(!segmentWalkable(result.position,next)||!peopleSegmentClear(result.position,next,people))break;
  result={position:next,fraction:nextFraction};
 }
 return result;
}
