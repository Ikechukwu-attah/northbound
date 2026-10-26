'use client';
import {useRef,useState,type RefObject} from 'react';
import {useFrame} from '@react-three/fiber';
import {Html} from '@react-three/drei';
import * as THREE from 'three';
import type {Spot} from '@/lib/game/data';
import {homeEntrance} from '@/lib/game/building-entrances';
import {Box} from './CityAssets';

/** A real façade opening and continuous, recessed path to the sidewalk. */
export default function ResidenceExterior({spot,owned,avatar,entering,exitUntil=0,enabled,onEnter}:{spot:Spot;owned:boolean;avatar:RefObject<THREE.Group|null>;entering:boolean;exitUntil?:number;enabled:boolean;onEnter:()=>void}){
 const hinge=useRef<THREE.Group>(null),[near,setNear]=useState(false),[atDoor,setAtDoor]=useState(false),[hovered,setHovered]=useState(false),entry=homeEntrance(spot);
 useFrame((_,dt)=>{
  if(!avatar.current||!hinge.current)return;
  const distance=Math.hypot(avatar.current.position.x-entry.landing[0],avatar.current.position.z-entry.landing[1]);
  const show=owned&&distance<12,at=distance<=.65;if(show!==near)setNear(show);if(at!==atDoor)setAtDoor(at);
  const open=owned&&distance<2&&(entering||Date.now()<exitUntil);
  hinge.current.rotation.y=THREE.MathUtils.damp(hinge.current.rotation.y,open?-Math.PI*.48:0,8,dt);
 });
 const click=(e:{stopPropagation:()=>void;delta:number})=>{e.stopPropagation();if(owned&&enabled&&e.delta<5)onEnter()};
 const variant=[...spot.id].reduce((n,c)=>n+c.charCodeAt(0),0)%4,upper=variant===1||variant===3,roofY=upper?7.4:4.8;
 return <group position={[spot.x,0,spot.z]}>
  {/* Recessed front wall leaves an actual opening behind the hinged panel. */}
  <Box p={[0,2.3,-.1]} s={[8,4.6,4.8]} c={spot.color}/>
  {[-1,1].map(side=><Box key={side} p={[side*2.45,2.3,2.4]} s={[3.1,4.6,.2]} c={spot.color}/>)}
  <Box p={[0,4.08,2.4]} s={[1.8,1.04,.2]} c={spot.color}/>
  <Box p={[0,1.7,2.31]} s={[1.8,3.4,.04]} c="#233832"/>
  <Box p={[0,4.72,0]} s={[8.3,.24,5.3]} c="#d8cdb8"/>
  {upper&&<><Box p={[0,6.05,0]} s={[8,2.7,5]} c={variant===1?spot.color:'#aa7761'}/>{[-2.6,0,2.6].map(x=><Box key={'upper'+x} p={[x,6.2,2.53]} s={[1.25,1.4,.06]} c="#97b4ac"/>)}</>}
  {variant===2?<><Box p={[-1,5.9,-.4]} s={[5.7,2.3,4.1]} c="#e0d7c3"/><Box p={[-1,7.15,-.4]} s={[5.95,.22,4.3]} c="#53615b"/><Box p={[-1,6.1,1.68]} s={[4.7,1.3,.06]} c="#97b4ac"/></>:<>{Array.from({length:5},(_,i)=><Box key={'roof'+i} p={[0,roofY+i*.28,0]} s={[8.3-i*1.45,.3,5.3-(variant===0?i*.65:0)]} c={variant===3?'#5c6261':'#735444'}/>)}</>}
  {[-2.5,2.5].map(x=><group key={x}><Box p={[x,2,2.53]} s={[1.7,1.75,.1]} c="#efdfbd"/><Box p={[x,2,2.6]} s={[1.42,1.48,.04]} c="#97b4ac"/><Box p={[x,2,2.64]} s={[.07,1.48,.04]} c="#eee1c9"/></group>)}
  <Box p={[0,.06,4.9]} s={[entry.width,.12,4.7]} c="#c9c3af"/>
  <Box p={[0,.12,3.1]} s={[2.1,.12,1.2]} c="#ddd2ba"/>
  <Box p={[0,3.64,2.95]} s={[2.5,.18,1.35]} c="#4d665a"/>
  {[-.9,.9].map(x=><Box key={x} p={[x,1.76,2.57]} s={[.13,3.52,.16]} c="#e9d9b9"/>)}
  <Box p={[0,3.49,2.57]} s={[1.93,.14,.16]} c="#e9d9b9"/>
  <group position={[-.82,.13,2.6]} ref={hinge} onClick={click} onPointerOver={e=>{e.stopPropagation();setHovered(true)}} onPointerOut={()=>setHovered(false)}>
   <Box p={[.82,1.63,0]} s={[1.64,3.26,.12]} c={owned?'#92633f':'#4e6b60'}/>
   <Box p={[.82,2.42,.071]} s={[.98,.65,.035]} c="#a8cccf"/>
   <Box p={[.82,1.12,.071]} s={[1.15,1.35,.035]} c="#775133"/>
   <Box p={[1.45,1.53,.13]} s={[.09,.23,.12]} c="#d2b75e"/>
  </group>
  {owned&&(near||hovered)&&<Html center position={[0,4.25,2.7]} zIndexRange={[9,5]}><button className="home-door-marker" disabled={!enabled} onClick={onEnter}>{atDoor?'Open home door':'Walk to home door'} ↗</button></Html>}
 </group>;
}
