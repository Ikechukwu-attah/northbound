'use client';
import {useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import type {Group} from 'three';
import Human from './Human';
import {CITY_NAME_HEIGHT,PLAYER_MARKER_RADIUS} from '@/lib/game/city-scale';
import PlayerName from './PlayerName';
import type {Peer} from '@/lib/game/multiplayer';
import {journeyFraction} from '@/lib/game/engine';
import {lanePoint,passingPoint,isWalkable,clearOfPeople} from '@/lib/game/navigation';
import type {Point} from '@/lib/game/world';
import type {RefObject} from 'react';
import type {PedestrianPositions} from './RoadNetwork';
function Visitor({peer,offset,avatar,positions}:{peer:Peer;offset:number;avatar:RefObject<Group|null>;positions:PedestrianPositions}){
 const ref=useRef<Group>(null),previous=useRef<Point>(peer.position);const motion=useRef({moving:false});
 useFrame(()=>{const g=ref.current;if(!g)return;const now=Date.now()+offset;g.visible=now-peer.lastSeen<15000;if(!g.visible)return;const j=peer.journey,f=j?journeyFraction(j,now):0;let p:Point=j?lanePoint(j.path,f):peer.position;
  // Visitors yield visually; another account can never hold the local player in place.
  const local:Point=avatar.current?[avatar.current.position.x,avatar.current.position.z]:[999,999],others=[local,...positions.current.values()];
  if(!clearOfPeople(p,others,.9)){const path=j?.path||[p,[p[0]+.1,p[1]] as Point];const pass=passingPoint(p,path,f,others);if(isWalkable(pass)&&clearOfPeople(pass,others,.65))p=pass;else {const options:Point[]=[[p[0]+.65,p[1]],[p[0]-.65,p[1]],[p[0],p[1]+.65],[p[0],p[1]-.65]];p=options.find(v=>isWalkable(v)&&clearOfPeople(v,others,.65))||p;}}
  const dx=p[0]-previous.current[0],dz=p[1]-previous.current[1];motion.current.moving=Math.hypot(dx,dz)>.001;g.position.set(p[0],0,p[1]);if(motion.current.moving)g.rotation.y=Math.atan2(dx,dz);previous.current=p;
 });
 return <group ref={ref} position={[peer.position[0],0,peer.position[1]]}><PlayerName name={peer.name} code={peer.id} height={CITY_NAME_HEIGHT*peer.appearance.height}/><Human appearance={peer.appearance} action={peer.action} minutes={peer.minutes} motion={peer.action==='walk'?motion.current:undefined}/><mesh position={[0,.25,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[PLAYER_MARKER_RADIUS,PLAYER_MARKER_RADIUS+.06,20]}/><meshBasicMaterial color="#69dce3"/></mesh></group>;
}
export default function RemotePlayers({peers,offset,avatar,positions}:{peers:Peer[];offset:number;avatar:RefObject<Group|null>;positions:PedestrianPositions}){const {size}=useThree();return <>{peers.slice(0,size.width<=620?6:12).map(p=><Visitor key={p.id} peer={p} offset={offset} avatar={avatar} positions={positions}/>)}</>}
