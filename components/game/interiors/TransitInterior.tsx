'use client';
import {Canvas,useFrame,useThree,type ThreeEvent} from '@react-three/fiber';
import {Html,OrbitControls} from '@react-three/drei';
import {useEffect,useMemo,useRef,useState,Suspense} from 'react';
import * as THREE from 'three';
import type {GameState,Command} from '@/lib/game/engine';
import {inVehicle,transitObjects,transitPosition,transitStop,transitLayout,type TransitState} from '@/lib/game/transit-interiors';
import {interiorPath} from '@/lib/game/interiors';
import {LINES,stopById} from '@/lib/game/transit';
import {npcAppearance} from '@/lib/game/characters';
import {distance,type Point} from '@/lib/game/world';
import {movementKey,blocksMovement,directionVector,type Direction} from '@/lib/game/ui';
import Human from '../Human';
import TTCBus from '../TTCBus';
import PlayerName from '../PlayerName';
import ObjectHint from './ObjectHint';
import {Box,Cylinder} from '../CityAssets';
type Props={game:GameState;send:(c:Command)=>Promise<boolean>;busy:boolean;movementEnabled:boolean;reset:number;quality:boolean};
type Part={p:[number,number,number];s:[number,number,number];c:string};
function Parts({parts}:{parts:Part[]}){const ref=useRef<THREE.InstancedMesh>(null);useEffect(()=>{if(!ref.current)return;const m=new THREE.Matrix4(),q=new THREE.Quaternion();parts.forEach((b,n)=>{m.compose(new THREE.Vector3(...b.p),q,new THREE.Vector3(...b.s));ref.current!.setMatrixAt(n,m);ref.current!.setColorAt(n,new THREE.Color(b.c))});ref.current.instanceMatrix.needsUpdate=true;if(ref.current.instanceColor)ref.current.instanceColor.needsUpdate=true;ref.current.computeBoundingSphere()},[parts]);return <instancedMesh ref={ref} args={[undefined,undefined,parts.length]}><boxGeometry/><meshStandardMaterial roughness={.85}/></instancedMesh>}
function Vehicle({t,minutes}:{t:TransitState;minutes:number}){
 const scene=useRef<THREE.Group>(null),left=useRef<THREE.Group>(null),right=useRef<THREE.Group>(null),{camera}=useThree();
 const parts=useMemo(()=>{const p:Part[]=[{p:[0,-.12,0],s:[6,.24,18],c:'#777e7d'},{p:[0,1.7,-8.9],s:[6,3.4,.15],c:'#e0e1d8'},{p:[0,3.1,-8.8],s:[5.8,.25,.1],c:'#da291c'}];for(const z of [-3,0,3])for(const x of [-2,2]){p.push({p:[x,.5,z],s:[1,.2,1.2],c:'#b72d35'},{p:[x+(x<0?-.5:.5),1,z],s:[.18,1.1,1.2],c:'#ba343c'});}return p},[]);
 useFrame((_,dt)=>{if(scene.current&&t.stage==='riding')scene.current.position.z=(scene.current.position.z+dt*5)%12;if(left.current)left.current.visible=camera.position.x>=0;if(right.current)right.current.visible=camera.position.x<=0;});
 return <><Parts parts={parts}/>{[-1,1].map(side=><group key={side} ref={side<0?left:right}>{[-7,-3,1,5].map(z=><group key={z}><Box p={[side*3,.45,z]} s={[.15,.9,3.9]} c="#e5e4de"/><Box p={[side*3,.8,z]} s={[.17,.26,3.9]} c="#da291c"/><Box p={[side*3,3,z]} s={[.15,.35,4]} c="#e5e4de"/><Box p={[side*3,1.9,z-2]} s={[.16,2.2,.15]} c="#d0d4d0"/></group>)}</group>)}
 <group ref={scene}>{[-24,-12,0,12,24].map((z,n)=><group key={z}>{t.mode==='subway'?<><Box p={[-6,2,z]} s={[.5,4,11.7]} c="#35454a"/><Box p={[-5.7,2,z]} s={[.1,1.8,.3]} c="#a8bfc1"/><Box p={[6,2,z]} s={[.5,4,11.7]} c="#35454a"/></>:[-1,1].map(side=><group key={side}><Box p={[side*6,-.2,z]} s={[5,.15,11.8]} c="#d3cbb7"/><Box p={[side*10,2.5,z]} s={[4,5,8]} c={n%2?'#ad7964':'#c3b79c'}/><Box p={[side*7.9,2.5,z]} s={[.05,1.4,5]} c="#658489"/></group>)}</group>)}</group>
 {[[-.9,-5.5],[.9,1],[.9,5.8]].map(([x,z])=><Cylinder key={z} p={[x,1.6,z]} r={.04} h={3.2} c="#d5b64e"/>)}
 <Box p={[1.8,1.2,6.6]} s={[.4,.6,.35]} c="#45985d"/><Box p={[1.8,1.3,6.81]} s={[.25,.25,.03]} c="#1e383b"/>
 <Box p={[1.8,1.3,-4.5]} s={[.35,.35,.2]} c={t.requested?'#ffdf69':'#e5b52a'}/>
 <group position={[2,0,-3]} rotation={[0,-Math.PI/2,0]}><Human sheltered scale={1} appearance={npcAppearance(241)} action="sit" minutes={minutes}/></group>
 {t.mode!=='subway'&&<><Box p={[-1.5,.5,7.7]} s={[1,.25,1]} c="#303f42"/><group position={[-1.5,0,7.7]}><Human sheltered scale={1} appearance={npcAppearance(391)} action="sit" minutes={minutes}/></group><Box p={[0,1.5,8.5]} s={[5.8,.35,.4]} c="#394b4d"/></>}
 <Html position={[0,2.3,-8.7]} transform distanceFactor={6} zIndexRange={[2,1]}><div className="transit-board">{t.stage==='arrival'?'AT STOP':'NEXT STOP'}<strong>{stopById(t.legs[t.index].to)!.name}</strong>{t.requested&&<span>STOP REQUESTED</span>}</div></Html>
 </>;
}
function Station({t,minutes}:{t:TransitState;minutes:number}){
 const train=useRef<THREE.Group>(null),surface=t.mode!=='subway';useFrame(()=>{if(train.current)train.current.position.z=-Math.max(0,(t.readyAt-Date.now())/1000)*9;});
 return <><Box p={[0,-.15,0]} s={[12,.3,14]} c={surface?'#d5cfbe':'#a9ada6'}/><Box p={[0,2,-7]} s={[12,4,.2]} c="#e4e1d4"/><Box p={[0,3,-6.85]} s={[12,.3,.1]} c="#da291c"/>
 <Html position={[0,2.6,-6.8]} transform distanceFactor={7} zIndexRange={[2,1]}><div className="station-sign">{transitStop(t).name}<small>{LINES.find(l=>l.id===t.legs[t.index].line)!.name}</small></div></Html>
 {t.stage==='entrance'?<>{[-4,-2,2,4].map(x=><Box key={x} p={[x,.7,-2]} s={[1.1,1.4,1]} c="#8c9d9d"/>)}<Box p={[0,.7,-2]} s={[1.2,1.4,.1]} c="#527f83"/><Box p={[.8,1.5,-1.7]} s={[.35,.4,.35]} c="#4da66c"/></>:<><Box p={[3.9,.03,-2]} s={[.35,.07,9]} c="#f4cf4c"/><Box p={[6,-.3,-2]} s={[3,.15,14]} c="#414e4d"/><group ref={train}>{surface?<group position={[6,0,-2]} scale={1.5}><TTCBus kind={t.mode==='streetcar'?'streetcar':'bus'}/></group>:<><Box p={[6,1.4,-2]} s={[2.8,3,10]} c="#dedfd7"/><Box p={[4.55,.6,-2]} s={[.1,.4,10]} c="#da291c"/>{[-5,-2,1].map(z=><Box key={z} p={[4.54,1.8,z]} s={[.11,1.4,2]} c="#536f76"/>)}<Box p={[4.48,1.2,-2]} s={[.15,2.4,1.3]} c="#223b3d"/></>}</group></>}
 <Box p={[-4,.5,0]} s={[1.2,.2,3]} c="#b24f42"/><Box p={[-4.5,1,0]} s={[.2,1.1,3]} c="#b24f42"/><group position={[-4,0,0]} rotation={[0,Math.PI/2,0]}><Human sheltered={!surface} scale={1} appearance={npcAppearance(511)} action="sit" minutes={minutes}/></group>
 <group position={[0,0,6.9]}><Box p={[-1.15,1.4,0]} s={[.2,2.8,.25]} c="#4c625a"/><Box p={[1.15,1.4,0]} s={[.2,2.8,.25]} c="#4c625a"/><Box p={[0,2.8,0]} s={[2.5,.2,.25]} c="#4c625a"/><Html center position={[0,2.9,0]} zIndexRange={[2,1]}><span className="room-sign">EXIT TO STREET</span></Html></group></>;
}
function Scene({game,send,busy,movementEnabled,reset}:Props){
 const t=game.transit!,vehicle=inVehicle(t),{camera,size}=useThree(),controls=useRef<any>(null),actor=useRef<THREE.Group>(null),previous=useRef(t.position),keys=useRef(new Set<Direction>()),last=useRef(0);
 const [position,setPosition]=useState<Point>(t.position),[selected,setSelected]=useState<string|null>(null),[dismissed,setDismissed]=useState<string|null>(null);const objects=transitObjects(t),near=objects.filter(o=>distance(o.use,position)<1.8).sort((a,b)=>distance(a.use,position)-distance(b.use,position))[0]?.id,visible=selected||(near!==dismissed?near:null),object=objects.find(o=>o.id===visible),seat=objects.find(o=>o.id===t.seat);
 useEffect(()=>{camera.position.set(16,20,22);if(camera instanceof THREE.OrthographicCamera){camera.zoom=Math.min(size.width/24,size.height/27);camera.updateProjectionMatrix();}controls.current?.target.set(0,0,0);controls.current?.update()},[camera,size.width,size.height,reset,vehicle]);
 const dismiss=()=>{setDismissed(selected||near||null);setSelected(null)};
 useEffect(()=>{if(near!==dismissed)setDismissed(null)},[near]);
 useEffect(()=>{setSelected(null);setDismissed(null)},[t.stage]);
 useEffect(()=>{const down=(e:KeyboardEvent)=>{if(e.key==='Escape'){dismiss();return}if(!movementEnabled||blocksMovement(e.target as HTMLElement))return;const key=movementKey(e);if(key){keys.current.add(key);e.preventDefault()}},up=(e:KeyboardEvent)=>{const k=movementKey(e);if(k)keys.current.delete(k)},clear=()=>keys.current.clear();window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',clear);return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',clear)}});
 useFrame(()=>{const p=transitPosition(t);if(distance(position,p)>.1)setPosition(p);if(actor.current){const actual=seat?.point||p;actor.current.position.set(actual[0],0,actual[1]);const dx=p[0]-previous.current[0],dz=p[1]-previous.current[1];if(seat)actor.current.rotation.y=Math.PI/2;else if(Math.hypot(dx,dz)>.001)actor.current.rotation.y=Math.atan2(dx,dz);previous.current=p;}
 if(busy||!movementEnabled||t.movement||!keys.current.size||Date.now()-last.current<350)return;const v=directionVector(keys.current),right=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,0),forward=new THREE.Vector3();camera.getWorldDirection(forward);right.y=forward.y=0;right.normalize();forward.normalize();const to:Point=[p[0]+(right.x*v.x+forward.x*v.y)*.8,p[1]+(right.z*v.x+forward.z*v.y)*.8];try{interiorPath(p,to,transitLayout(t));last.current=Date.now();setSelected(null);void send({type:'transit_walk',point:to})}catch{}});
 const locked=busy||!!t.movement||!movementEnabled;const floor=(e:ThreeEvent<MouseEvent>)=>{e.stopPropagation();if(e.delta<5&&!locked){setSelected(null);void send({type:'transit_walk',point:[e.point.x,e.point.z]})}};
 return <><color attach="background" args={['#d9e2db']}/><ambientLight intensity={1.5}/><directionalLight position={[6,14,8]} intensity={2}/>{vehicle?<Vehicle t={t} minutes={game.minutes}/>:<Station t={t} minutes={game.minutes}/>}
 <mesh position={[0,.02,0]} rotation={[-Math.PI/2,0,0]} onClick={floor}><planeGeometry args={[vehicle?5.8:11.8,vehicle?17.8:13.8]}/><meshBasicMaterial transparent opacity={0} depthWrite={false}/></mesh>
 {objects.map(o=><mesh key={o.id} position={[o.point[0],.8,o.point[1]]} onClick={e=>{e.stopPropagation();if(e.delta<5){setSelected(o.id);setDismissed(null)}}}><boxGeometry args={[o.id==='board'?2:1.15,1.8,1.2]}/><meshBasicMaterial transparent opacity={0} depthWrite={false}/></mesh>)}
 <group ref={actor} position={[t.position[0],0,t.position[1]]}><PlayerName name={game.name} height={seat?1.9:2.5}/><Human sheltered scale={1} appearance={game.life.appearance} minutes={game.minutes} action={t.movement?'walk':seat?'sit':t.stage==='riding'?'wait':'idle'}/><mesh rotation={[-Math.PI/2,0,0]} position={[0,.035,0]}><ringGeometry args={[.35,.45,24]}/><meshBasicMaterial color="#baff65" depthTest={false}/></mesh></group>
 {object&&<ObjectHint position={[object.point[0],2,object.point[1]]} player={seat?.point||position} seated={!!seat}><div className="object-actions"><button className="object-dismiss" aria-label="Dismiss object" onClick={dismiss}>×</button><strong>{object.label}</strong><button disabled={locked||object.id==='board'&&Date.now()<t.readyAt} onClick={()=>{setSelected(null);void send({type:'transit_use',id:object.id})}}>{distance(t.position,object.use)>.65?'Walk over & use':'Use '+(object.id.startsWith('seat')?'seat':object.id)}</button></div></ObjectHint>}
 <OrbitControls ref={controls} makeDefault enablePan={false} enableDamping minZoom={8} maxZoom={65} minPolarAngle={.9} maxPolarAngle={.9}/></>;
}
export default function TransitInterior(props:Props){return <Canvas orthographic dpr={[1,props.quality?1.5:1]} camera={{position:[16,20,22],zoom:25,near:.1,far:150}} gl={{antialias:true,powerPreference:'high-performance'}}><Suspense fallback={null}><Scene {...props}/></Suspense></Canvas>}
