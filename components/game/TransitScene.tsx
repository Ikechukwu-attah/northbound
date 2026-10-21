'use client';
import {lazy,Suspense,useMemo} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {rideMode} from '@/lib/game/ride-mode';
import {nearestStop,LINES} from '@/lib/game/transit';
import type {TransitState} from '@/lib/game/transit-interiors';
import type {GameState} from '@/lib/game/engine';
import Human from './Human';
import PlayerName from './PlayerName';
const VehicleCabin=lazy(()=>import('./interiors/TransitKit').then(m=>({default:m.VehicleCabin})));
/** Fast travel and previously saved automatic trips share the detailed TTC cabin. */
export default function TransitScene({game}:{game:GameState}){
 const {camera,size}=useThree(),j=game.journey!,mode=rideMode(j),waiting=Date.now()<j.startedAt+j.waitSeconds*1000;
 const t=useMemo<TransitState>(()=>{const from=nearestStop(j.path[0]),to=nearestStop(j.path[j.path.length-1]),line=LINES.find(l=>l.mode===mode&&l.stops.includes(to.id))||LINES.find(l=>l.mode===mode)!;return {origin:from.id,destination:to.id,legs:[{from:from.id,to:to.id,line:line.id,minutes:j.minutes}],index:0,stage:waiting?'boarding':'riding',mode,night:false,paid:true,validated:true,requested:false,readyAt:0,position:[0,1]}},[j,mode,waiting]);
 useFrame(()=>{camera.position.set(16,20,22);camera.lookAt(0,1,0);if(camera instanceof THREE.OrthographicCamera){camera.zoom=Math.min(size.width/24,size.height/27);camera.updateProjectionMatrix()}});
 return <><color attach="background" args={['#d9e2db']}/><ambientLight intensity={1.5}/><directionalLight position={[6,14,8]} intensity={2}/><Suspense fallback={null}><VehicleCabin t={t} minutes={game.minutes} cabinView={false} quality={size.width>620}/></Suspense><group position={[0,0,1]}><PlayerName name={game.name} height={2.5}/><Human sheltered scale={1} appearance={game.life.appearance} action="wait" minutes={game.minutes}/></group></>;
}
