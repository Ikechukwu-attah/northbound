'use client';
import {Canvas,useFrame,useThree,type ThreeEvent} from '@react-three/fiber';
import {OrbitControls,PerspectiveCamera} from '@react-three/drei';
import {useEffect,useMemo,useRef,useState,Suspense} from 'react';
import * as THREE from 'three';
import type {GameState,Command} from '@/lib/game/engine';
import {inVehicle,transitObjects,transitPosition,transitLayout,boardSign,stationMirror,type TransitState} from '@/lib/game/transit-interiors';
import {interiorPath} from '@/lib/game/interiors';
import {LINES,isBusTerminal} from '@/lib/game/transit';
import {distance,type Point} from '@/lib/game/world';
import {movementKey,blocksMovement,directionVector,type Direction} from '@/lib/game/ui';
import Human from '../Human';
import {VehicleCabin,StationEnvironment} from './TransitKit';
import {transitSeats,transitSeatPose,TRAIN_FOG_END} from '@/lib/game/transit-kit';
import {TRANSIT_CAMERA as TC,transitCameraLimits} from '@/lib/game/transit-camera';
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
function Scene({game,send,busy,movementEnabled,reset,quality,cabinView,along}:Props&{cabinView:boolean;along:number}){
 const t=game.transit!,vehicle=inVehicle(t),{camera,size}=useThree(),controls=useRef<any>(null),actor=useRef<THREE.Group>(null),previous=useRef(t.position),keys=useRef(new Set<Direction>()),last=useRef(0),transitioned=useRef(0);
 const previousAlong=useRef(0);
 const [position,setPosition]=useState<Point>(t.position);const objects=transitObjects(t),seat=objects.find(o=>o.id===t.seat),boardable=Date.now()>=t.readyAt;
 const limits=transitCameraLimits(size.width,size.height,vehicle);
 const mirror=vehicle?1:stationMirror(t);
 useEffect(()=>{const at=cabinView?TC.insidePosition:vehicle?TC.cutawayPosition:[TC.stationPosition[0]*mirror,20,22] as [number,number,number];camera.position.set(...at);if(camera instanceof THREE.OrthographicCamera){camera.zoom=limits.zoom;camera.updateProjectionMatrix();}controls.current?.target.set(...(cabinView?TC.insideTarget:[0,0,0]) as [number,number,number]);previousAlong.current=0;controls.current?.update()},[camera,size.width,size.height,reset,vehicle,cabinView,mirror]);
 useEffect(()=>{const delta=along-previousAlong.current;camera.position.z+=delta;if(controls.current){controls.current.target.z+=delta;controls.current.update();}previousAlong.current=along},[along,camera,size.width,size.height,reset,vehicle,cabinView,mirror]);
 useEffect(()=>{transitioned.current=Date.now()},[t.stage]);// swallow the tap that changed the scene
 useEffect(()=>{const down=(e:KeyboardEvent)=>{if(!movementEnabled||blocksMovement(e.target as HTMLElement))return;const key=movementKey(e);if(key){keys.current.add(key);e.preventDefault()}},up=(e:KeyboardEvent)=>{const k=movementKey(e);if(k)keys.current.delete(k)},clear=()=>keys.current.clear();window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',clear);return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',clear)}});
 useFrame(()=>{const p=transitPosition(t);if(distance(position,p)>.1)setPosition(p);if(actor.current){const actual=seat?.point||p;const seated=seat?transitSeatPose(t.mode,seat.point):null;actor.current.position.set(actual[0],seated?.position[1]||0,actual[1]);const dx=p[0]-previous.current[0],dz=p[1]-previous.current[1];if(seat)actor.current.rotation.y=transitSeats(t.mode).find(s=>s.x===seat.point[0]&&s.z===seat.point[1])?.rotation??Math.PI/2;else if(Math.hypot(dx,dz)>.001)actor.current.rotation.y=Math.atan2(dx,dz);previous.current=p;}
 if(busy||!movementEnabled||t.movement||!keys.current.size||Date.now()-last.current<350)return;const v=directionVector(keys.current),right=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,0),forward=new THREE.Vector3();camera.getWorldDirection(forward);right.y=forward.y=0;right.normalize();forward.normalize();const to:Point=[p[0]+(right.x*v.x+forward.x*v.y)*.8,p[1]+(right.z*v.x+forward.z*v.y)*.8];try{interiorPath(p,to,transitLayout(t));last.current=Date.now();void send({type:'transit_walk',point:to})}catch{}});
 const locked=busy||!!t.movement||!movementEnabled,guard=()=>Date.now()-transitioned.current>350;
 const floor=(e:ThreeEvent<MouseEvent>)=>{e.stopPropagation();if(e.delta<5&&!locked&&guard())void send({type:'transit_walk',point:[e.point.x,e.point.z]})};
 // One tap on a hotspot: walk there and use it, no popup in between.
 const onTap=(id:string)=>(e:ThreeEvent<MouseEvent>)=>{e.stopPropagation();if(e.delta<5&&!locked&&guard())void send({type:'transit_use',id})};
 const activeOf=(o:typeof objects[number])=>o.id.startsWith('seat')?t.seat!==o.id:o.id==='board'?boardable:o.id==='door'?(t.stage==='boarding'||t.stage==='arrival'&&t.departAt==null):o.id==='reader'?!t.validated:true;
 return <><color attach="background" args={[t.mode==='subway'?'#303638':'#b6cbd1']}/><fog attach="fog" args={[t.mode==='subway'?'#303638':'#b6cbd1',cabinView?TC.insideFogStart:70,cabinView?TC.insideFogEnd:TRAIN_FOG_END]}/><ambientLight intensity={1.5}/><directionalLight position={[6,14,8]} intensity={2}/>{vehicle?<VehicleCabin t={t} minutes={game.minutes} cabinView={cabinView} quality={quality}/>:<StationEnvironment t={t} minutes={game.minutes}/>}
 <mesh position={[0,.02,0]} rotation={[-Math.PI/2,0,0]} onClick={floor}><planeGeometry args={[vehicle?5.8:11.8,vehicle?17.8:13.8]}/><meshBasicMaterial transparent opacity={0} depthWrite={false}/></mesh>
 {/* Small depth-tested object markers; the action bar supplies readable touch controls. */}
 {objects.map(o=>{if(!activeOf(o))return null;const color=ringColor(o.id);
  return <group key={o.id} onClick={onTap(o.id)}>

   {o.id==='board'&&<group position={[o.point[0],0,o.point[1]]}><NamePlate name={t.mode==='subway'?'Board train':'Board '+t.mode} y={3}/></group>}
   <mesh rotation={[-Math.PI/2,0,Math.PI/4]} position={[o.point[0],o.id.startsWith('seat')?.8:.09,o.point[1]]}><planeGeometry args={[.24,.24]}/><meshBasicMaterial color={color} depthWrite={false} side={THREE.DoubleSide}/></mesh>
   <mesh position={[o.point[0],.75,o.point[1]]}><cylinderGeometry args={[.5,.5,1.4,10]}/><meshBasicMaterial transparent opacity={0} depthWrite={false}/></mesh>
  </group>})}
 <group ref={actor} position={[t.position[0],0,t.position[1]]}><NamePlate name={game.name} y={seat?2.1:2.7}/><Human sheltered scale={1} appearance={game.life.appearance} minutes={game.minutes} seatHeight={seat?.56:undefined} action={t.movement?'walk':seat?'sit':t.stage==='riding'?'wait':'idle'}/><mesh rotation={[-Math.PI/2,0,0]} position={[0,.035,0]}><planeGeometry args={[.18,.18]}/><meshBasicMaterial color="#baff65" depthWrite={false}/></mesh></group>
 <OrbitControls key={cabinView?'inside':'cutaway'} ref={controls} makeDefault enableRotate={TC.rotate} enablePan={TC.pan} enableDamping minZoom={limits.minZoom} maxZoom={limits.maxZoom} minDistance={cabinView?TC.minDistance:0} maxDistance={cabinView?TC.maxDistance:Infinity}/></>;}
function StationBanner({t}:{t:TransitState}){const sign=boardSign(t),line=lineOf(t);return <div className="transit-station-banner"><span>{sign.label}</span><strong>{sign.name}</strong>{line&&<em style={{background:line.color}}>{line.name.replace(/ ·.*$/,'')}</em>}</div>;}
function TransitActions({game,send,busy,movementEnabled}:Props){
 const t=game.transit!,[now,setNow]=useState(Date.now());useEffect(()=>{const timer=setTimeout(()=>setNow(Date.now()),Math.max(0,t.readyAt-Date.now())+30);return()=>clearTimeout(timer)},[t.readyAt]);
 const objects=transitObjects(t),vehicle=inVehicle(t),terminal=isBusTerminal(t.legs[t.index].to),locked=busy||!movementEnabled||!!t.movement;
 const seat=objects.filter(o=>o.id.startsWith('seat')&&o.id!==t.seat).sort((a,b)=>distance(t.position,a.use)-distance(t.position,b.use))[0];
 const choices=objects.filter(o=>o.id==='street'||o.id==='gate'||o.id==='board'||o.id==='reader'&&!t.validated||o.id===seat?.id||o.id==='stand'||o.id==='door'&&(t.stage==='boarding'||t.stage==='arrival'&&t.departAt==null));
 const label=(id:string)=>id.startsWith('seat')?'Sit down':({gate:'Tap fare gate',reader:'Tap PRESTO',board:now<t.readyAt?'Vehicle arriving…':'Board '+(t.mode==='subway'?'train':t.mode),stand:'Stand',door:t.stage==='boarding'?'Step off':'Exit vehicle',street:'Exit to street'} as Record<string,string>)[id]||id;
 return <div className="transit-action-bar" aria-label="Transit actions">{choices.map(o=><button key={o.id} disabled={locked||o.id==='board'&&now<t.readyAt} onClick={()=>void send({type:'transit_use',id:o.id})}>{label(o.id)}</button>)}{vehicle&&t.mode!=='subway'&&(terminal?<span className="terminal-note">Terminal · doors open automatically</span>:<button className="request-stop-button" disabled={busy||!movementEnabled||t.stage==='boarding'||t.requested} aria-pressed={t.requested} onClick={()=>void send({type:'transit_request'})}>{t.requested?'✓ Stop requested':'Request stop'}</button>)}</div>;
}
export default function TransitInterior(props:Props){const [cabinView,setCabinView]=useState(false),[along,setAlong]=useState(0);const t=props.game.transit!,vehicle=inVehicle(t);useEffect(()=>{if(!vehicle)setCabinView(false);setAlong(0)},[vehicle]);return <><StationBanner t={t}/><Canvas orthographic dpr={[1,props.quality?1.5:1]} camera={{position:[16,20,22],zoom:25,near:.1,far:150}} gl={{antialias:true,powerPreference:'high-performance'}}>{cabinView&&vehicle&&<PerspectiveCamera makeDefault position={TC.insidePosition} fov={TC.insideFov} near={.08} far={TC.insideFar}/>}<Suspense fallback={null}><Scene {...props} cabinView={cabinView&&vehicle} along={along}/></Suspense></Canvas><TransitActions {...props}/>{vehicle&&<div className="transit-view-switch" role="group" aria-label="Vehicle camera"><button aria-pressed={!cabinView} onClick={()=>setCabinView(false)}>Cutaway</button><button aria-pressed={cabinView} onClick={()=>setCabinView(true)}>Inside view</button><button aria-label="Look farther along vehicle" disabled={along===-2} onClick={()=>setAlong(v=>Math.max(-2,v-1))}>←</button><button aria-label="Look back along vehicle" disabled={along===2} onClick={()=>setAlong(v=>Math.min(2,v+1))}>→</button></div>}</>}
