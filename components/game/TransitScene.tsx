'use client';
import {useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import * as THREE from 'three';
import TTCBus from './TTCBus';
import {rideMode} from '@/lib/game/ride-mode';
import {Box,Cylinder} from './CityAssets';
import Human from './Human';
import PlayerName from './PlayerName';
import {npcAppearance} from '@/lib/game/characters';
import type {GameState} from '@/lib/game/engine';
function TrainRide({game}:{game:GameState}){const {camera,size}=useThree();const stripes=useRef<THREE.Group>(null);useFrame(({clock})=>{camera.position.set(10,7,12);camera.lookAt(0,2,0);if(camera instanceof THREE.OrthographicCamera){camera.zoom=Math.min(size.width/18,size.height/15);camera.updateProjectionMatrix();}if(stripes.current)stripes.current.position.x=(clock.elapsedTime*7)%4;});const waiting=Date.now()<game.journey!.startedAt+game.journey!.waitSeconds*1000;return <><color attach="background" args={['#dce1d7']}/><ambientLight intensity={1.8}/><directionalLight position={[4,8,5]} intensity={2}/><Box p={[0,-.15,0]} s={[18,.3,9]} c="#858f8b"/><Box p={[0,2,-3.5]} s={[18,4,.3]} c="#e4e2d7"/><Box p={[0,3.6,-3.28]} s={[18,.2,.1]} c="#b9483d"/>{[-6,-2,2,6].map(x=><group key={x}><Box p={[x,2.3,-3.27]} s={[3,1.7,.12]} c="#263c43"/><Box p={[x,.8,-2.8]} s={[3,.35,1.2]} c="#b64d42"/><Box p={[x,1.3,-3.1]} s={[3,.8,.2]} c="#bc5447"/></group>)}<group ref={stripes}>{[-12,-8,-4,0,4,8].map(x=><Box key={x} p={[x,2.3,-3.16]} s={[.12,1.4,.03]} c="#5c767b"/>)}</group>{[-4,4].map(x=><Cylinder key={x} p={[x,2,0]} r={.05} h={4} c="#bdc9c4"/>)}<group position={[0,0,0]}><PlayerName name={game.name}/><Human sheltered appearance={game.life.appearance} action={waiting?'wait':'phone'} minutes={game.minutes}/></group><group position={[-4.5,0,-1.5]}><Human sheltered appearance={npcAppearance(241)} action="sit" minutes={game.minutes} scale={1.7}/></group><group position={[4,0,-1]}><Human sheltered appearance={npcAppearance(98)} action="coffee" minutes={game.minutes} scale={1.7}/></group></>}

function SurfaceRide({game,kind}:{game:GameState;kind:'bus'|'streetcar'}){
 const {camera,size}=useThree(),scenery=useRef<THREE.Group>(null),boarding=useRef<THREE.Group>(null),departure=useRef<number|null>(null);
 useFrame(({clock})=>{
  const waiting=Date.now()<game.journey!.startedAt+game.journey!.waitSeconds*1000;
  camera.position.set(-11,8,14);camera.lookAt(0,1.6,0);
  if(camera instanceof THREE.OrthographicCamera){camera.zoom=Math.min(size.width/21,size.height/18);camera.updateProjectionMatrix();}
  if(boarding.current)boarding.current.visible=waiting;
  if(waiting)departure.current=null;else departure.current??=clock.elapsedTime;
  if(scenery.current)scenery.current.position.z=waiting?0:-((clock.elapsedTime-departure.current!)*3)%8;
 });
 return <><color attach="background" args={['#dce1d7']}/><ambientLight intensity={1.8}/><directionalLight position={[-4,8,5]} intensity={2}/>
  <Box p={[0,-.12,0]} s={[7,.2,38]} c="#565b5f"/><Box p={[-5,.03,0]} s={[3,.3,38]} c="#dbd7c8"/>
  {kind==='streetcar'&&[-.72,.72].map(x=><Box key={x} p={[x,.02,0]} s={[.07,.05,38]} c="#abb4b4"/>)}
  <group scale={2}><TTCBus kind={kind}/></group>
  <group ref={scenery}>{[-16,-8,0,8,16,24].map(z=><group key={z}>
   <Box p={[3,.015,z]} s={[.08,.025,3]} c="#efc755"/><Box p={[-3.6,.16,z]} s={[.16,.25,7.8]} c="#b9beb6"/>
   <Box p={[-7,2.4,z]} s={[2,4.8,5]} c={z%16?'#b35e4a':'#c7b69a'}/><Box p={[-5.97,2.4,z]} s={[.04,1.5,3]} c="#50737a"/>
  </group>)}</group>
  <group ref={boarding}><group position={[-4.4,.15,3.6]}><Human sheltered appearance={game.life.appearance} action="wait" minutes={game.minutes}/></group>
   <Cylinder p={[-5,1.7,5.5]} r={.06} h={3.4} c="#777f7e"/><Box p={[-5,3.1,5.5]} s={[.55,.8,.12]} c="#da291c"/>
  </group>
 </>;
}
export default function TransitScene({game}:{game:GameState}){const kind=rideMode(game.journey!);return kind==='subway'?<TrainRide game={game}/>:<SurfaceRide game={game} kind={kind}/>;}
