'use client';
import {useMemo,useRef,useState,useEffect} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import * as THREE from 'three';
import Human from './Human';
import type {PedestrianPositions} from './RoadNetwork';
import {npcAppearance,type HumanAction} from '@/lib/game/characters';
import {crowdBudget} from '@/lib/game/crowds';
import {districtAt,snapPoint,nearestPlace,entrance,walkingPath,pointAlong,type Point} from '@/lib/game/world';
import {nearestStop} from '@/lib/game/transit';
function Pedestrian({seed,origin,minutes,positions}:{seed:number;origin:Point;minutes:number;positions:PedestrianPositions}){const id='near:'+seed+':'+origin.join();useEffect(()=>()=>{positions.current.delete(id)},[id,positions]);const ref=useRef<THREE.Group>(null);const [action,setAction]=useState<HumanAction>('walk');const appearance=useMemo(()=>npcAppearance(seed),[seed]);const path=useMemo(()=>walkingPath(origin,seed%2?nearestStop(origin).point:entrance(nearestPlace(origin))),[origin[0],origin[1],seed]);useFrame(({clock})=>{if(!ref.current)return;const cycle=(clock.elapsedTime+seed)%40;const waiting=cycle>=20&&cycle<29;const next:HumanAction=waiting?(['wait','phone','coffee','talk','wave','bag'] as HumanAction[])[seed%6]:seed%9===0?'run':'walk';if(next!==action)setAction(next);const progress=cycle<20?cycle/20:seed%2?Math.max(0,1-(cycle-29)/11):1;const p=pointAlong(path,progress),ahead=pointAlong(path,Math.min(1,progress+.01));ref.current.position.set(p[0],0,p[1]-(seed%2===0&&cycle>29?Math.min(6,(cycle-29)*1.2):0));if(cycle<20)ref.current.rotation.y=Math.atan2(ahead[0]-p[0],ahead[1]-p[1]);else if(cycle>29)ref.current.rotation.y=seed%2?Math.atan2(p[0]-ahead[0],p[1]-ahead[1]):Math.PI;ref.current.visible=seed%2===1||cycle<34;if(ref.current.visible)positions.current.set(id,[ref.current.position.x,ref.current.position.z]);else positions.current.delete(id);});return <group ref={ref}><Human appearance={appearance} action={action} minutes={minutes} scale={1.8}/></group>}

// All visible pedestrians are rigged glTF humans (no blocky instanced proxies).
// Count stays within the per-device crowd budget, capped for frame rate.
export default function Crowds({centre,minutes,quality,positions}:{centre:Point;minutes:number;quality:boolean;positions:PedestrianPositions}){
 const {size}=useThree();const mobile=size.width<=620;
 const count=Math.min(crowdBudget(districtAt(centre),minutes,mobile,quality),mobile?8:16);
 const cx=Math.floor(centre[0]/24),cz=Math.floor(centre[1]/24);
 const people=useMemo(()=>Array.from({length:count},(_,i)=>{const gx=cx-1+i%3,gz=cz-1+Math.floor(i/3)%3;return {seed:Math.abs(gx*131+gz*79+i*239),origin:snapPoint([gx*24+7+(i%2?11:0),gz*24+(i%4<2?7:19)])};}),[cx,cz,count]);
 return <>{people.map((p,i)=><Pedestrian key={cx+','+cz+','+i} positions={positions} seed={p.seed} origin={p.origin} minutes={minutes}/>)}</>;
}
