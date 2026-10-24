'use client';
import {useMemo,useRef,useEffect} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import * as THREE from 'three';
import Human from './Human';
import {CITY_HUMAN_SCALE} from '@/lib/game/city-scale';
import type {PedestrianPositions} from './RoadNetwork';
import {npcAppearance} from '@/lib/game/characters';
import {crowdBudget} from '@/lib/game/crowds';
import {districtAt,snapPoint,walkingPath,distance,type Point} from '@/lib/game/world';
import {clearOfPeople,isWalkable,lanePoint,stepCrowd,namedPosition,publicPeoplePositions as scheduledPositions,type CrowdActor} from '@/lib/game/navigation';
import type {RefObject} from 'react';
function Pedestrian({actor,seed,minutes}:{actor:CrowdActor;seed:number;minutes:number}){const ref=useRef<THREE.Group>(null);const appearance=useMemo(()=>npcAppearance(seed),[seed]);useFrame(()=>{if(ref.current){ref.current.position.set(actor.position[0],0,actor.position[1]);ref.current.rotation.y=actor.heading;}});return <group ref={ref} position={[actor.position[0],0,actor.position[1]]}><Human appearance={appearance} action="walk" motion={actor} minutes={minutes} scale={CITY_HUMAN_SCALE}/></group>}
export default function Crowds({centre,minutes,quality,positions,avatar,playerStart}:{playerStart:Point;centre:Point;minutes:number;quality:boolean;positions:PedestrianPositions;avatar:RefObject<THREE.Group|null>}){
 const {size}=useThree();const total=Math.min(crowdBudget(districtAt(centre),minutes,size.width<=620,quality,centre),size.width<=620?8:16);const cx=Math.floor(centre[0]/24),cz=Math.floor(centre[1]/24);
 const actors=useMemo(()=>{const out:(CrowdActor&{seed:number})[]=[];for(let i=0;i<total*4&&out.length<total;i++){
  const seed=Math.abs(cx*131+cz*79+i*239),origin=snapPoint([(cx-1+i%3)*24+7+(i%4)*2,(cz-1+Math.floor(i/3)%3)*24+19]);
  const target=snapPoint([origin[0]+(i%2?24:-24),origin[1]+(i%3?24:-24)]);if(distance(origin,target)<3)continue;
  let path:Point[];try{path=walkingPath(origin,target)}catch{continue;}const progress=(i%5)*.14,position=lanePoint(path,progress);const player:Point=avatar.current?[avatar.current.position.x,avatar.current.position.z]:playerStart;
  if(!isWalkable(position)||distance(position,player)<5||!clearOfPeople(position,[...out.map(a=>a.position),...scheduledPositions(minutes)],1.4))continue;
  out.push({id:`human:${cx}:${cz}:${i}`,seed,path,progress,forward:true,wait:0,position,heading:0,moving:true});
 }return out;},[cx,cz,total,minutes]);
 const previous=useRef<Point|null>(null);useEffect(()=>()=>{for(const a of actors)positions.current.delete(a.id);},[actors,positions]);
 useFrame((_,dt)=>{const p:Point=avatar.current?[avatar.current.position.x,avatar.current.position.z]:centre;const old=previous.current||p,dx=p[0]-old[0],dz=p[1]-old[1],n=Math.hypot(dx,dz);const ahead:Point=n>.001?[p[0]+dx/n*2,p[1]+dz/n*2]:p;stepCrowd(actors,dt,p,avatar.current?.userData.nextPoint||ahead,minutes);previous.current=p;for(const a of actors)positions.current.set(a.id,a.position);});
 return <>{actors.map(a=><Pedestrian key={a.id} actor={a} seed={a.seed} minutes={minutes}/>)}</>;
}
