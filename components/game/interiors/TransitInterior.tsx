'use client';
import {Canvas,useFrame,useThree,type ThreeEvent} from '@react-three/fiber';
import {OrbitControls,PerspectiveCamera} from '@react-three/drei';
import {useEffect,useMemo,useRef,useState,Suspense} from 'react';
import * as THREE from 'three';
import type {GameState,Command} from '@/lib/game/engine';
import {inVehicle,transitObjects,transitPosition,transitLayout,boardSign,type TransitState} from '@/lib/game/transit-interiors';
import {interiorPath} from '@/lib/game/interiors';
import {LINES} from '@/lib/game/transit';
import {distance,type Point} from '@/lib/game/world';
import {movementKey,blocksMovement,directionVector,type Direction} from '@/lib/game/ui';
import Human from '../Human';
import {VehicleCabin,StationEnvironment} from './TransitKit';
import {transitSeats} from '@/lib/game/transit-kit';
type Props={game:GameState;send:(c:Command)=>Promise<boolean>;busy:boolean;movementEnabled:boolean;reset:number;quality:boolean};
const lineOf=(t:TransitState)=>LINES.find(l=>l.id===t.legs[t.index].line);
const lineColorOf=(t:TransitState)=>t.mode==='subway'?(lineOf(t)?.color||'#da291c'):'#da291c';
// Colour key for the tappable rings: each action type has one fixed colour, mirrored by the on-screen legend.
const RING:Record<string,{color:string;label:string}>={seat:{color:'#7fd4ff',label:'Seat'},reader:{color:'#46c76a',label:'Tap card'},gate:{color:'#46c76a',label:'Fare gate'},request:{color:'#f2c230',label:'Stop request'},door:{color:'#ff7a5e',label:'Exit door'},board:{color:'#ffd166',label:'Board'},stand:{color:'#c7b8ff',label:'Stand'},street:{color:'#bfe3a0',label:'To street'}};
const ringKey=(id:string)=>id.startsWith('seat')?'seat':id;
const ringColor=(id:string)=>RING[ringKey(id)]?.color||'#8fe0ff';
const activeRings=(t:TransitState)=>{const boardable=Date.now()>=t.readyAt;return transitObjects(t).filter(o=>o.id.startsWith('seat')?t.seat!==o.id:o.id==='board'?boardable:o.id==='door'?(t.stage==='boarding'||t.stage==='arrival'&&t.departAt==null):o.id==='reader'?!t.validated:true);};
// Camera-facing name plate above the player (canvas texture — renders reliably in the transit Canvas, unlike drei Html).
function NamePlate({name,y}:{name:string;y:number}){
 const ref=useRef<THREE.Group>(null);const {camera}=useThree();
 const texture=useMemo(()=>{const canvas=document.createElement('canvas');canvas.width=512;canvas.height=160;const x=canvas.getContext('2d')!;x.font='700 54px Arial';const tw=x.measureText(name).width,w=Math.min(500,tw+72),h=96,ox=(512-w)/2,oy=32;x.fillStyle='#294f49';x.beginPath();x.roundRect(ox,oy,w,h,20);x.fill();x.strokeStyle='#8bd9d5';x.lineWidth=3;x.stroke();x.fillStyle='#fffce8';x.textAlign='center';x.textBaseline='middle';x.fillText(name,256,oy+h/2,w-36);const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;return t},[name]);
 useEffect(()=>()=>texture.dispose(),[texture]);
 useFrame(()=>{if(ref.current)ref.current.quaternion.copy(camera.quaternion)});
 return <group ref={ref} position={[0,y,0]}><mesh renderOrder={999}><planeGeometry args={[2.6,.8]}/><meshBasicMaterial map={texture} transparent depthTest={false}/></mesh></group>;
}
function Scene({game,send,busy,movementEnabled,reset,quality,cabinView}:Props&{cabinView:boolean}){
 const t=game.transit!,vehicle=inVehicle(t),{camera,size}=useThree(),controls=useRef<any>(null),actor=useRef<THREE.Group>(null),previous=useRef(t.position),keys=useRef(new Set<Direction>()),last=useRef(0),transitioned=useRef(0);
 const [position,setPosition]=useState<Point>(t.position);const objects=transitObjects(t),seat=objects.find(o=>o.id===t.seat),boardable=Date.now()>=t.readyAt;
 // Fill the width on phones for the narrow vehicle; keep the station readable.
 useEffect(()=>{camera.position.set(...(cabinView?[0,2,8.6]:!vehicle&&t.mode!=='subway'?[-16,20,22]:[16,20,22]) as [number,number,number]);if(camera instanceof THREE.OrthographicCamera){const phone=size.width<620;camera.zoom=vehicle?Math.min(size.width/15,size.height/17):Math.min(size.width/(phone?22:16),size.height/(phone?21:19));camera.updateProjectionMatrix();}controls.current?.target.set(0,cabinView?1.4:0,cabinView?-2.5:0);controls.current?.update()},[camera,size.width,size.height,reset,vehicle,cabinView]);
 useEffect(()=>{transitioned.current=Date.now()},[t.stage]);// swallow the tap that changed the scene
 useEffect(()=>{const down=(e:KeyboardEvent)=>{if(!movementEnabled||blocksMovement(e.target as HTMLElement))return;const key=movementKey(e);if(key){keys.current.add(key);e.preventDefault()}},up=(e:KeyboardEvent)=>{const k=movementKey(e);if(k)keys.current.delete(k)},clear=()=>keys.current.clear();window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',clear);return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',clear)}});
 useFrame(()=>{const p=transitPosition(t);if(distance(position,p)>.1)setPosition(p);if(actor.current){const actual=seat?.point||p;actor.current.position.set(actual[0],0,actual[1]);const dx=p[0]-previous.current[0],dz=p[1]-previous.current[1];if(seat)actor.current.rotation.y=transitSeats(t.mode).find(s=>s.x===seat.point[0]&&s.z===seat.point[1])?.rotation??Math.PI/2;else if(Math.hypot(dx,dz)>.001)actor.current.rotation.y=Math.atan2(dx,dz);previous.current=p;}
 if(busy||!movementEnabled||t.movement||!keys.current.size||Date.now()-last.current<350)return;const v=directionVector(keys.current),right=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,0),forward=new THREE.Vector3();camera.getWorldDirection(forward);right.y=forward.y=0;right.normalize();forward.normalize();const to:Point=[p[0]+(right.x*v.x+forward.x*v.y)*.8,p[1]+(right.z*v.x+forward.z*v.y)*.8];try{interiorPath(p,to,transitLayout(t));last.current=Date.now();void send({type:'transit_walk',point:to})}catch{}});
 const locked=busy||!!t.movement||!movementEnabled,guard=()=>Date.now()-transitioned.current>350;
 const floor=(e:ThreeEvent<MouseEvent>)=>{e.stopPropagation();if(e.delta<5&&!locked&&guard())void send({type:'transit_walk',point:[e.point.x,e.point.z]})};
 // One tap on a hotspot: walk there and use it, no popup in between.
 const onTap=(id:string)=>(e:ThreeEvent<MouseEvent>)=>{e.stopPropagation();if(e.delta<5&&!locked&&guard())void send({type:'transit_use',id})};
 const activeOf=(o:typeof objects[number])=>o.id.startsWith('seat')?t.seat!==o.id:o.id==='board'?boardable:o.id==='door'?(t.stage==='boarding'||t.stage==='arrival'&&t.departAt==null):o.id==='reader'?!t.validated:true;
 return <><color attach="background" args={['#d9e2db']}/><ambientLight intensity={1.5}/><directionalLight position={[6,14,8]} intensity={2}/>{vehicle?<VehicleCabin t={t} minutes={game.minutes} cabinView={cabinView} quality={quality}/>:<StationEnvironment t={t} minutes={game.minutes}/>}
 <mesh position={[0,.02,0]} rotation={[-Math.PI/2,0,0]} onClick={floor}><planeGeometry args={[vehicle?5.8:11.8,vehicle?17.8:13.8]}/><meshBasicMaterial transparent opacity={0} depthWrite={false}/></mesh>
 {/* Every hotspot is a visible, tappable ring sitting on the object itself; colour keyed by action (see legend). */}
 {objects.map(o=>{if(!activeOf(o))return null;const color=ringColor(o.id);
  return <group key={o.id} onClick={onTap(o.id)}>
   {o.id==='board'&&<group position={[o.point[0],0,o.point[1]]}><NamePlate name={t.mode==='subway'?'Board train':'Board '+t.mode} y={3}/></group>}
   <mesh rotation={[-Math.PI/2,0,0]} position={[o.point[0],.07,o.point[1]]}><ringGeometry args={[.42,.6,28]}/><meshBasicMaterial color={color} transparent opacity={.92} depthTest={false}/></mesh>
   <mesh position={[o.point[0],.75,o.point[1]]}><cylinderGeometry args={[.85,.85,1.7,18]}/><meshBasicMaterial transparent opacity={0} depthWrite={false}/></mesh>
  </group>})}
 <group ref={actor} position={[t.position[0],0,t.position[1]]}><NamePlate name={game.name} y={seat?2.1:2.7}/><Human sheltered scale={1} appearance={game.life.appearance} minutes={game.minutes} action={t.movement?'walk':seat?'sit':t.stage==='riding'?'wait':'idle'}/><mesh rotation={[-Math.PI/2,0,0]} position={[0,.035,0]}><ringGeometry args={[.35,.45,24]}/><meshBasicMaterial color="#baff65" depthTest={false}/></mesh></group>
 <OrbitControls key={cabinView?'inside':'cutaway'} ref={controls} makeDefault enablePan={false} enableDamping minZoom={8} maxZoom={65} minDistance={cabinView?5:0} maxDistance={cabinView?11.3:Infinity} minPolarAngle={cabinView?1.42:.9} maxPolarAngle={cabinView?1.52:.9} minAzimuthAngle={cabinView?-.23:-Infinity} maxAzimuthAngle={cabinView ? .23 : Infinity}/></>;
}
function StationBanner({t}:{t:TransitState}){const sign=boardSign(t),line=lineOf(t);return <div className="transit-station-banner"><span>{sign.label}</span><strong>{sign.name}</strong>{line&&<em style={{background:line.color}}>{line.name.replace(/ ·.*$/,'')}</em>}</div>;}
function HotspotLegend({t}:{t:TransitState}){const items=[...new Map(activeRings(t).map(o=>{const k=ringKey(o.id);return [k,RING[k]] as const})).values()].filter(Boolean);if(!items.length)return null;return <div className="transit-ring-legend" aria-label="Tap-ring colour key">{items.map(i=><span key={i.label}><i style={{background:i.color}}/>{i.label}</span>)}</div>;}
export default function TransitInterior(props:Props){const [cabinView,setCabinView]=useState(false);const vehicle=inVehicle(props.game.transit!);useEffect(()=>{if(!vehicle)setCabinView(false)},[vehicle]);return <><StationBanner t={props.game.transit!}/><HotspotLegend t={props.game.transit!}/><Canvas orthographic dpr={[1,props.quality?1.5:1]} camera={{position:[16,20,22],zoom:25,near:.1,far:150}} gl={{antialias:true,powerPreference:'high-performance'}}>{cabinView&&vehicle&&<PerspectiveCamera makeDefault position={[0,2,8.6]} fov={72} near={.08} far={120}/>}<Suspense fallback={null}><Scene {...props} cabinView={cabinView&&vehicle}/></Suspense></Canvas>{vehicle&&<div className="transit-view-switch" role="group" aria-label="Vehicle camera"><button aria-pressed={!cabinView} onClick={()=>setCabinView(false)}>Cutaway</button><button aria-pressed={cabinView} onClick={()=>setCabinView(true)}>Inside view</button></div>}</>}
