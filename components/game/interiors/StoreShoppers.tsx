'use client';
import {useMemo,useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {createStoreShoppers,storeShopperCount,storeCashiers,STORE_AISLES,STORE_DEPARTMENTS,type StoreShopper} from '@/lib/game/supercentre';
import {interiorLayout,interiorPosition,interiorSegment,type InteriorState} from '@/lib/game/interiors';
import {distance,type Point} from '@/lib/game/world';
import {peopleSegmentClear} from '@/lib/game/navigation';
import {npcAppearance} from '@/lib/game/characters';
import Human from '../Human';
import StoreSign from '../StoreSign';
function Shopper({actor,minutes}:{actor:StoreShopper;minutes:number}){const ref=useRef<THREE.Group>(null),appearance=useMemo(()=>npcAppearance(actor.seed),[actor.seed]);useFrame(()=>{if(ref.current){ref.current.position.set(actor.position[0],0,actor.position[1]);ref.current.rotation.y=actor.heading;}});return <group ref={ref}><Human sheltered scale={1} appearance={appearance} minutes={minutes} action="bag" motion={actor}/></group>}
export default function StoreShoppers({interior,minutes,quality}:{interior:InteriorState;minutes:number;quality:boolean}){
 const {size}=useThree(),count=storeShopperCount(size.width<=620,quality,minutes),actors=useMemo(()=>createStoreShoppers(count),[count]),layout=interiorLayout(interior);
 useFrame((_,delta)=>{const dt=Math.min(delta,.06),player=interiorPosition(interior);for(const a of actors){a.moving=false;const people=[player,...actors.filter(b=>a!==b).map(b=>b.position)],near=distance(player,a.position)<1.5;
  if(near){const options=Array.from({length:16},(_,j):Point=>[a.position[0]+Math.cos(j*Math.PI/8)*dt*1.6,a.position[1]+Math.sin(j*Math.PI/8)*dt*1.6]).filter(p=>interiorSegment(a.position,p,layout)&&peopleSegmentClear(a.position,p,people)&&distance(p,player)>distance(a.position,player)).sort((a,b)=>distance(b,player)-distance(a,player));const next=options[0];if(next){a.heading=Math.atan2(next[0]-a.position[0],next[1]-a.position[1]);a.position=next;a.moving=true;}continue;}
  if(a.wait>0){a.wait-=dt;a.heading=Math.PI/2;continue;}const target=a.forward?a.end:a.home,dx=target[0]-a.position[0],dz=target[1]-a.position[1],len=Math.hypot(dx,dz);if(len<.1){a.forward=!a.forward;a.wait=4+a.seed%5;continue;}const next:Point=[a.position[0]+dx/len*Math.min(dt*.85,len),a.position[1]+dz/len*Math.min(dt*.85,len)];if(interiorSegment(a.position,next,layout)&&peopleSegmentClear(a.position,next,people)){a.position=next;a.heading=Math.atan2(dx,dz);a.moving=true;}
 }});
 return <>{actors.map(a=><Shopper key={a.seed} actor={a} minutes={minutes}/>)}{storeCashiers().map(([x,z],index)=><group key={x} position={[x,0,z]} rotation={[0,Math.PI,0]}><Human sheltered scale={1} appearance={{...npcAppearance(2500+index),color:'#0879c5'}} minutes={minutes} action="talk"/></group>)}
 <StoreSign text="Walmart · SUPERCENTRE" position={[0,3.7,-19.8]} width={15} height={1.6}/>
 {STORE_AISLES.map((x,j)=><StoreSign key={x} text={STORE_DEPARTMENTS[j]} position={[x,3.5,-10.4]} width={5.6} height={.9}/>)}
 <StoreSign text="CHECKOUTS ↓     EXIT ↓" position={[0,3.4,11]} width={10} height={1}/>
 </>;
}
