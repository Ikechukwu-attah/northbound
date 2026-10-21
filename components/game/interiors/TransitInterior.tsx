'use client';
import {Canvas,useFrame,useThree,type ThreeEvent} from '@react-three/fiber';
import {OrbitControls} from '@react-three/drei';
import {useEffect,useMemo,useRef,useState,Suspense} from 'react';
import * as THREE from 'three';
import type {GameState,Command} from '@/lib/game/engine';
import {inVehicle,transitObjects,transitPosition,transitLayout,boardSign,type TransitState} from '@/lib/game/transit-interiors';
import {interiorPath} from '@/lib/game/interiors';
import {LINES} from '@/lib/game/transit';
import {npcAppearance} from '@/lib/game/characters';
import {distance,type Point} from '@/lib/game/world';
import {movementKey,blocksMovement,directionVector,type Direction} from '@/lib/game/ui';
import Human from '../Human';
import TTCBus from '../TTCBus';
import PlayerName from '../PlayerName';
import {Box,Cylinder} from '../CityAssets';
type Props={game:GameState;send:(c:Command)=>Promise<boolean>;busy:boolean;movementEnabled:boolean;reset:number;quality:boolean};
type Part={p:[number,number,number];s:[number,number,number];c:string};
function Parts({parts}:{parts:Part[]}){const ref=useRef<THREE.InstancedMesh>(null);useEffect(()=>{if(!ref.current)return;const m=new THREE.Matrix4(),q=new THREE.Quaternion();parts.forEach((b,n)=>{m.compose(new THREE.Vector3(...b.p),q,new THREE.Vector3(...b.s));ref.current!.setMatrixAt(n,m);ref.current!.setColorAt(n,new THREE.Color(b.c))});ref.current.instanceMatrix.needsUpdate=true;if(ref.current.instanceColor)ref.current.instanceColor.needsUpdate=true;ref.current.computeBoundingSphere()},[parts]);return <instancedMesh ref={ref} args={[undefined,undefined,parts.length]}><boxGeometry/><meshStandardMaterial roughness={.85}/></instancedMesh>}
const lineOf=(t:TransitState)=>LINES.find(l=>l.id===t.legs[t.index].line);
const lineColorOf=(t:TransitState)=>t.mode==='subway'?(lineOf(t)?.color||'#da291c'):'#da291c';
function Vehicle({t,minutes,lineColor}:{t:TransitState;minutes:number;lineColor:string}){
 const scene=useRef<THREE.Group>(null),left=useRef<THREE.Group>(null),right=useRef<THREE.Group>(null),doorFront=useRef<THREE.Group>(null),doorRear=useRef<THREE.Group>(null),open=useRef(0),{camera}=useThree();
 const sub=t.mode==='subway',street=t.mode==='streetcar',bus=t.mode==='bus';
 const accent=sub?lineColor:'#da291c',atStop=t.stage!=='riding';
 // Distinct interiors: subway = long side benches; streetcar/bus = facing/forward seat pairs.
 const parts=useMemo(()=>{const p:Part[]=[{p:[0,-.12,0],s:[6,.24,18],c:street?'#6f7673':'#7b827f'},{p:[0,1.7,-8.9],s:[6,3.4,.15],c:'#e7e8df'},{p:[0,3.1,-8.8],s:[5.8,.25,.1],c:accent}];
  if(sub)for(const side of [-2,2])p.push({p:[side,.48,0],s:[1.1,.18,9.6],c:'#9aa7b0'},{p:[side+(side<0?-.56:.56),.95,0],s:[.16,1.05,9.6],c:accent});
  else for(const z of [-3,0,3])for(const x of [-2,2])p.push({p:[x,.5,z],s:[1.05,.2,1.2],c:street?'#b72d35':'#2f6e4f'},{p:[x+(x<0?-.5:.5),1,z],s:[.18,1.1,1.2],c:accent});
  return p},[sub,street,accent]);
 useFrame((_,dt)=>{
  if(scene.current)scene.current.position.z=atStop?0:(scene.current.position.z+dt*5)%12;
  open.current+=((atStop?1:0)-open.current)*Math.min(1,dt*6);
  if(doorFront.current)doorFront.current.children.forEach((c,i)=>{(c as THREE.Mesh).position.z=5+(i?1:-1)*(1+open.current*1.1);});
  if(doorRear.current)doorRear.current.children.forEach((c,i)=>{(c as THREE.Mesh).position.z=-4+(i?1:-1)*(1+open.current*1.1);});
  if(left.current)left.current.visible=camera.position.x>=0;if(right.current)right.current.visible=camera.position.x<=0;
 });
 return <><Parts parts={parts}/>
 {/* Side walls with full-size windows (both sides); doors are cut into the curb (+x) wall. */}
 {[-1,1].map(side=><group key={side} ref={side<0?left:right}>{[-7,-3,1,5].map(z=><group key={z}><Box p={[side*3,.45,z]} s={[.15,.9,3.9]} c="#e5e4de"/><Box p={[side*3,.8,z]} s={[.17,.26,3.9]} c={accent}/><Box p={[side*3,2.15,z]} s={[.12,1.5,3.5]} c="#9fc7cf"/><Box p={[side*3,3,z]} s={[.15,.35,4]} c="#e5e4de"/><Box p={[side*3,1.9,z-2]} s={[.16,2.2,.15]} c="#d0d4d0"/></group>)}</group>)}
 {/* Sliding curb-side doors (front always; rear door on buses). Open at every stop. */}
 <group ref={doorFront}>{[0,1].map(i=><mesh key={i} position={[2.92,1.2,5+(i?1:-1)]}><boxGeometry args={[.1,2.2,1.05]}/><meshStandardMaterial color="#9fc7cf" transparent opacity={.85}/></mesh>)}</group>
 {bus&&<group ref={doorRear}>{[0,1].map(i=><mesh key={i} position={[2.92,1.2,-4+(i?1:-1)]}><boxGeometry args={[.1,2.2,1.05]}/><meshStandardMaterial color="#9fc7cf" transparent opacity={.85}/></mesh>)}</group>}
 {/* Scrolling scenery outside; at a stop it halts and a platform/curb slides in. */}
 <group ref={scene}>{[-24,-12,0,12,24].map((z,n)=><group key={z}>{sub?<><Box p={[-6,2,z]} s={[.5,4,11.7]} c="#35454a"/><Box p={[-5.7,2,z]} s={[.1,1.8,.3]} c="#a8bfc1"/><Box p={[6,2,z]} s={[.5,4,11.7]} c="#35454a"/></>:[-1,1].map(s2=><group key={s2}><Box p={[s2*6,-.2,z]} s={[5,.15,11.8]} c="#d3cbb7"/><Box p={[s2*10,2.5,z]} s={[4,5,8]} c={n%2?'#ad7964':'#c3b79c'}/><Box p={[s2*7.9,2.5,z]} s={[.05,1.4,5]} c="#658489"/></group>)}</group>)}</group>
 {/* At a stop: a platform / curb appears just outside the open doors. */}
 {atStop&&<group position={[4.6,0,2]}><Box p={[0,.08,0]} s={[2.6,.3,13]} c={sub?'#b7bcbb':'#caa24a'}/>{sub&&<Box p={[0,.12,0]} s={[.4,.08,13]} c="#f4cf4c"/>}<Box p={[1.5,2.4,-5]} s={[.18,3.6,.18]} c="#e4e1d4"/><Box p={[1.5,3.9,-5]} s={[2.4,.5,.18]} c={accent}/></group>}
 {/* Grab rails / stanchions. */}
 {[[-.9,-5.5],[.9,1],[.9,5.8]].map(([x,z])=><Cylinder key={z} p={[x,1.6,z]} r={.04} h={3.2} c="#d5b64e"/>)}
 {/* Subway overhead route-map strip above the windows. */}
 {sub&&<><Box p={[-2.85,2.95,0]} s={[.06,.4,9]} c="#f6f4ea"/>{[-3.5,-1.2,1.1,3.4].map(z=><Box key={z} p={[-2.8,2.95,z]} s={[.02,.12,.12]} c={accent}/>)}<Box p={[-2.81,2.95,0]} s={[.02,.05,8.6]} c={accent}/></>}
 {/* Green PRESTO reader by the front door; stop-request strip on bus/streetcar only. */}
 <Box p={[1.8,1.2,6.6]} s={[.4,.6,.35]} c="#45985d"/><Box p={[1.8,1.3,6.81]} s={[.25,.25,.03]} c="#1e383b"/>
 {!sub&&<Box p={[1.8,1.3,-4.5]} s={[.35,.35,.2]} c={t.requested?'#ffdf69':'#e5b52a'}/>}
 {/* Operator seated in a proper cab at the front; a farebox stands beside the bus driver. */}
 {!sub?<><Box p={[-1.5,1.35,7.2]} s={[2.4,2.7,.14]} c="#2c3a3e"/><Box p={[-.3,1.3,6.9]} s={[.14,2.3,1.6]} c="#33454a"/><group position={[-1.5,0,7.4]}><Human sheltered scale={1} appearance={npcAppearance(391)} action="sit" minutes={minutes}/></group>{bus&&<><Box p={[-2.1,.75,6.3]} s={[.5,1.5,.5]} c="#30474d"/><group position={[-1.5,1.15,6.6]} rotation={[Math.PI/2,0,0]}><Cylinder r={.33} h={.1} c="#1f2d31"/></group></>}</>:<group position={[2,0,-7.6]} rotation={[0,-Math.PI/2,0]}><Human sheltered scale={1} appearance={npcAppearance(241)} action="sit" minutes={minutes}/></group>}
 </>;
}
function PlatformTrain({accent}:{accent:string}){
 // A subway train drawn on the platform with a window band, windows and two doors.
 return <group position={[6,0,-2]}>
  <Box p={[0,1.5,0]} s={[2.8,3,10]} c="#dedfd7"/><Box p={[0,2.95,0]} s={[2.84,.3,10]} c={accent}/><Box p={[0,.4,0]} s={[2.62,.35,9.8]} c="#4a575a"/>
  <Box p={[-1.42,1.9,0]} s={[.06,1,10]} c="#2c3f45"/>
  {[-3.9,-1.2,3.4].map(z=><Box key={z} p={[-1.44,1.9,z]} s={[.08,.86,1.7]} c="#9fc7cf"/>)}
  {[-2.6,1.9].map(z=><group key={z}><Box p={[-1.45,1.2,z]} s={[.1,2,1.3]} c={accent}/><Box p={[-1.47,1.2,z]} s={[.04,1.9,.07]} c="#f4f3ec"/></group>)}
 </group>;
}
function Station({t,minutes,lineColor}:{t:TransitState;minutes:number;lineColor:string}){
 const train=useRef<THREE.Group>(null),surface=t.mode!=='subway',accent=surface?'#da291c':lineColor;
 useFrame(()=>{if(train.current)train.current.position.z=-Math.max(0,(t.readyAt-Date.now())/1000)*9;});
 return <><Box p={[0,-.15,0]} s={[12,.3,14]} c={surface?'#d5cfbe':'#a9ada6'}/><Box p={[0,2,-7]} s={[12,4,.2]} c="#e4e1d4"/><Box p={[0,3,-6.85]} s={[12,.3,.1]} c={accent}/>
 {t.stage==='entrance'?<>{[-4,-2,2,4].map(x=><Box key={x} p={[x,.7,-2]} s={[1.1,1.4,1]} c="#8c9d9d"/>)}<Box p={[0,.7,-2]} s={[1.2,1.4,.1]} c="#527f83"/><Box p={[.8,1.5,-1.7]} s={[.35,.4,.35]} c="#4da66c"/></>:<><Box p={[3.9,.03,-2]} s={[.35,.07,9]} c="#f4cf4c"/><Box p={[6,-.3,-2]} s={[3,.15,14]} c="#414e4d"/><group ref={train}>{surface?<group position={[6,0,-2]} scale={1.5}><TTCBus kind={t.mode==='streetcar'?'streetcar':'bus'}/></group>:<PlatformTrain accent={accent}/>}</group></>}
 <Box p={[-4,.5,0]} s={[1.2,.2,3]} c="#b24f42"/><Box p={[-4.5,1,0]} s={[.2,1.1,3]} c="#b24f42"/><group position={[-4,0,0]} rotation={[0,Math.PI/2,0]}><Human sheltered={!surface} scale={1} appearance={npcAppearance(511)} action="sit" minutes={minutes}/></group>
 <group position={[0,0,6.9]}><Box p={[-1.15,1.4,0]} s={[.2,2.8,.25]} c="#4c625a"/><Box p={[1.15,1.4,0]} s={[.2,2.8,.25]} c="#4c625a"/><Box p={[0,2.8,0]} s={[2.5,.2,.25]} c="#4c625a"/></group></>;
}
function Scene({game,send,busy,movementEnabled,reset}:Props){
 const t=game.transit!,vehicle=inVehicle(t),{camera,size}=useThree(),controls=useRef<any>(null),actor=useRef<THREE.Group>(null),previous=useRef(t.position),keys=useRef(new Set<Direction>()),last=useRef(0),transitioned=useRef(0);
 const [position,setPosition]=useState<Point>(t.position);const objects=transitObjects(t),seat=objects.find(o=>o.id===t.seat),lineColor=lineColorOf(t),boardable=Date.now()>=t.readyAt;
 // Fill the width on phones for both the narrow vehicle and the platform/entrance.
 useEffect(()=>{camera.position.set(16,20,22);if(camera instanceof THREE.OrthographicCamera){camera.zoom=vehicle?Math.min(size.width/15,size.height/17):Math.min(size.width/16,size.height/19);camera.updateProjectionMatrix();}controls.current?.target.set(0,0,0);controls.current?.update()},[camera,size.width,size.height,reset,vehicle]);
 useEffect(()=>{transitioned.current=Date.now()},[t.stage]);// swallow the tap that changed the scene
 useEffect(()=>{const down=(e:KeyboardEvent)=>{if(!movementEnabled||blocksMovement(e.target as HTMLElement))return;const key=movementKey(e);if(key){keys.current.add(key);e.preventDefault()}},up=(e:KeyboardEvent)=>{const k=movementKey(e);if(k)keys.current.delete(k)},clear=()=>keys.current.clear();window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',clear);return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',clear)}});
 useFrame(()=>{const p=transitPosition(t);if(distance(position,p)>.1)setPosition(p);if(actor.current){const actual=seat?.point||p;actor.current.position.set(actual[0],0,actual[1]);const dx=p[0]-previous.current[0],dz=p[1]-previous.current[1];if(seat)actor.current.rotation.y=Math.PI/2;else if(Math.hypot(dx,dz)>.001)actor.current.rotation.y=Math.atan2(dx,dz);previous.current=p;}
 if(busy||!movementEnabled||t.movement||!keys.current.size||Date.now()-last.current<350)return;const v=directionVector(keys.current),right=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,0),forward=new THREE.Vector3();camera.getWorldDirection(forward);right.y=forward.y=0;right.normalize();forward.normalize();const to:Point=[p[0]+(right.x*v.x+forward.x*v.y)*.8,p[1]+(right.z*v.x+forward.z*v.y)*.8];try{interiorPath(p,to,transitLayout(t));last.current=Date.now();void send({type:'transit_walk',point:to})}catch{}});
 const locked=busy||!!t.movement||!movementEnabled,guard=()=>Date.now()-transitioned.current>350;
 const floor=(e:ThreeEvent<MouseEvent>)=>{e.stopPropagation();if(e.delta<5&&!locked&&guard())void send({type:'transit_walk',point:[e.point.x,e.point.z]})};
 // One tap on a hotspot: walk there and use it, no popup in between.
 const onTap=(id:string)=>(e:ThreeEvent<MouseEvent>)=>{e.stopPropagation();if(e.delta<5&&!locked&&guard())void send({type:'transit_use',id})};
 const activeOf=(o:typeof objects[number])=>o.id.startsWith('seat')?t.seat!==o.id:o.id==='board'?boardable:o.id==='door'?t.stage==='arrival'&&t.departAt==null:o.id==='reader'?!t.validated:true;
 return <><color attach="background" args={['#d9e2db']}/><ambientLight intensity={1.5}/><directionalLight position={[6,14,8]} intensity={2}/>{vehicle?<Vehicle t={t} minutes={game.minutes} lineColor={lineColor}/>:<Station t={t} minutes={game.minutes} lineColor={lineColor}/>}
 <mesh position={[0,.02,0]} rotation={[-Math.PI/2,0,0]} onClick={floor}><planeGeometry args={[vehicle?5.8:11.8,vehicle?17.8:13.8]}/><meshBasicMaterial transparent opacity={0} depthWrite={false}/></mesh>
 {/* Every hotspot is a visible, tappable ring sitting on the object itself (seats cyan, actions line-coloured). */}
 {objects.map(o=>{if(!activeOf(o))return null;const color=o.id.startsWith('seat')?'#8fe0ff':o.id==='street'?'#cfe6b0':lineColor;
  return <group key={o.id} onClick={onTap(o.id)}>
   <mesh rotation={[-Math.PI/2,0,0]} position={[o.point[0],.07,o.point[1]]}><ringGeometry args={[.42,.6,28]}/><meshBasicMaterial color={color} transparent opacity={.92} depthTest={false}/></mesh>
   <mesh position={[o.point[0],.75,o.point[1]]}><cylinderGeometry args={[.85,.85,1.7,18]}/><meshBasicMaterial transparent opacity={0} depthWrite={false}/></mesh>
  </group>})}
 <group ref={actor} position={[t.position[0],0,t.position[1]]}><PlayerName name={game.name} height={seat?1.9:2.5}/><Human sheltered scale={1} appearance={game.life.appearance} minutes={game.minutes} action={t.movement?'walk':seat?'sit':t.stage==='riding'?'wait':'idle'}/><mesh rotation={[-Math.PI/2,0,0]} position={[0,.035,0]}><ringGeometry args={[.35,.45,24]}/><meshBasicMaterial color="#baff65" depthTest={false}/></mesh></group>
 <OrbitControls ref={controls} makeDefault enablePan={false} enableDamping minZoom={8} maxZoom={65} minPolarAngle={.9} maxPolarAngle={.9}/></>;
}
function StationBanner({t}:{t:TransitState}){const sign=boardSign(t),line=lineOf(t);return <div className="transit-station-banner"><span>{sign.label}</span><strong>{sign.name}</strong>{line&&<em style={{background:line.color}}>{line.name.replace(/ ·.*$/,'')}</em>}</div>;}
export default function TransitInterior(props:Props){return <><StationBanner t={props.game.transit!}/><Canvas orthographic dpr={[1,props.quality?1.5:1]} camera={{position:[16,20,22],zoom:25,near:.1,far:150}} gl={{antialias:true,powerPreference:'high-performance'}}><Suspense fallback={null}><Scene {...props}/></Suspense></Canvas></>}
