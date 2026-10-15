'use client';
import {Canvas,useFrame,useThree,type ThreeEvent} from '@react-three/fiber';
import {OrbitControls} from '@react-three/drei';
import {useEffect,useMemo,useRef,useState,Component,type ReactNode} from 'react';
import * as THREE from 'three';
import Human from './Human';
import Crowds from './Crowds';
import {RoadNetwork,Traffic} from './RoadNetwork';
import TransitScene from './TransitScene';
import {npcAppearance,type HumanAction} from '@/lib/game/characters';
import {seasonAt,weatherAt} from '@/lib/game/calendar';
import type {Spot} from '@/lib/game/data';
import {PLACES,BLOCK,chunksAround,districtAt,snapPoint,distance,entrance,inBounds,PERSON_PLACES,type Point} from '@/lib/game/world';
import {STOPS,nearestStop} from '@/lib/game/transit';
import {journeyPosition,type GameState} from '@/lib/game/engine';
import {movementKey,blocksMovement,directionVector,type Direction} from '@/lib/game/ui';
import {MapLabelOverlay,ProjectedLabels,type LabelRefs} from './MapLabels';
import {Box,Cylinder,Tree,Bench,Store,Landmark,Park,Person,Bus,Sailboat,Building} from './CityAssets';
const STATION_LABELS:Spot[]=STOPS.map(s=>({id:'stop:'+s.id,name:'TTC · '+s.name,kind:'landmark',x:s.point[0],z:s.point[1],color:'#c93b35',description:'Transit stop',activity:'Choose exit stop'}));
const LABELS=[...PLACES,...STATION_LABELS];
type Props={game:GameState|null;selected:string;player:{name:string;color:string;skin:string};reset:number;onSpot:(s:Spot)=>void;onStop:(id:string)=>void;onWalk:(point:Point)=>void;onReady:()=>void;labels:boolean;quality:boolean;movementEnabled:boolean};
const spawn=entrance(PLACES.find(p=>p.id==='queen')!);
function Chunk({cell:[cx,cz]}:{cell:Point}){if(cz<0)return cz===-1?<group><Box p={[cx*24+12,.13,-1]} s={[24,.4,1.4]} c="#c5b795"/>{cx>=8&&<Box p={[cx*24+12,1.6,1]} s={[24,3.2,2]} c="#dfcda9"/>}</group>:null;return <group><Box p={[cx*24+12,-.16,cz*24+12]} s={[24,.2,24]} c="#80b5b9"/>{cx%3===0&&cz===0&&<Sailboat x={cx*24+9} z={cz*24+14}/>}</group>;}
function Weather({centre,minutes}:{centre:Point;minutes:number}){const mesh=useRef<THREE.InstancedMesh>(null);const dummy=useMemo(()=>new THREE.Object3D(),[]);const weather=weatherAt(minutes),snow=weather==='Snow',wet=/rain/i.test(weather);useFrame(({clock})=>{if(!mesh.current)return;for(let i=0;i<80;i++){dummy.position.set(centre[0]+(i*17%64)-32,20-((clock.elapsedTime*(snow?1.8:13)+i*.7)%20),centre[1]+(i*31%64)-32);dummy.scale.setScalar(1);dummy.updateMatrix();mesh.current.setMatrixAt(i,dummy.matrix);}mesh.current.instanceMatrix.needsUpdate=true;});return snow||wet?<instancedMesh ref={mesh} args={[undefined,undefined,80]} frustumCulled={false}><boxGeometry args={snow?[.14,.14,.14]:[.035,.8,.035]}/><meshBasicMaterial color={snow?'#fffaf2':'#a9c5cc'} transparent opacity={.7}/></instancedMesh>:null;}
function Scene({game,selected,player,reset,onSpot,onStop,onWalk,onReady,quality,movementEnabled,labelRefs}:Props&{labelRefs:LabelRefs}){
 const pedestrianPositions=useRef(new Map<string,Point>());
 const avatar=useRef<THREE.Group>(null),controls=useRef<any>(null),keys=useRef(new Set<Direction>()),lastRequest=useRef(0);const {camera,size}=useThree();
 const [cell,setCell]=useState<Point>([Math.floor((game?.position||spawn)[0]/24),Math.floor((game?.position||spawn)[1]/24)]);
 const centre:Point=[cell[0]*24+12,cell[1]*24+12];const cells=chunksAround(centre);const nearby=PLACES.filter(p=>Math.abs(p.x-centre[0])<72&&Math.abs(p.z-centre[1])<72);const stops=STOPS.filter(p=>distance(p.point,centre)<85);
 const zoomMin=Math.max(size.width/72,size.height/80);const initialized=useRef(false);
 useEffect(()=>{initialized.current=false;if(camera instanceof THREE.OrthographicCamera){camera.zoom=zoomMin*1.6;camera.updateProjectionMatrix();}},[camera,zoomMin,reset]);
 useEffect(()=>{onReady();},[onReady]);
 useEffect(()=>{
  const clear=()=>keys.current.clear();clear();
  const down=(e:KeyboardEvent)=>{const key=movementKey(e);if(!movementEnabled||!key||blocksMovement(e.target instanceof Element?e.target:null))return;e.preventDefault();keys.current.add(key);};
  const up=(e:KeyboardEvent)=>{const k=movementKey({key:e.key,code:e.code});if(k)keys.current.delete(k);};
  window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',clear);document.addEventListener('visibilitychange',clear);
  return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',clear);document.removeEventListener('visibilitychange',clear);};
 },[movementEnabled]);
 useFrame(()=>{
  if(!avatar.current)return;const pos=game?.journey?journeyPosition(game.journey):game?.position||spawn;const g=avatar.current,previous=g.position.clone();g.position.set(pos[0],0,pos[1]);
  if(previous.distanceTo(g.position)>.001)g.rotation.y=Math.atan2(g.position.x-previous.x,g.position.z-previous.z);
  const nx=Math.floor(pos[0]/24),nz=Math.floor(pos[1]/24);if(nx!==cell[0]||nz!==cell[1])setCell([nx,nz]);
  if(controls.current){const target=new THREE.Vector3(pos[0],1,pos[1]);if(!initialized.current){camera.position.set(pos[0]+34,43,pos[1]+42);controls.current.target.copy(target);initialized.current=true;}else{const change=target.clone().sub(controls.current.target);camera.position.add(change);controls.current.target.copy(target);}controls.current.update();}
  if(movementEnabled&&!game?.journey&&keys.current.size&&Date.now()-lastRequest.current>350){const v=directionVector(keys.current);const right=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,0);right.y=0;right.normalize();const forward=new THREE.Vector3();camera.getWorldDirection(forward);forward.y=0;forward.normalize();const next=snapPoint([pos[0]+(right.x*v.x+forward.x*v.y)*4,pos[1]+(right.z*v.x+forward.z*v.y)*4]);if(distance(pos,next)>.2){lastRequest.current=Date.now();onWalk(next);}}
 });
 const click=(e:ThreeEvent<MouseEvent>)=>{e.stopPropagation();if(movementEnabled&&!game?.journey&&e.delta<5&&inBounds([e.point.x,e.point.z]))onWalk(snapPoint([e.point.x,e.point.z]));};
 const riding=game?.journey?.kind==='transit'||game?.journey?.kind==='fast';
 const hour=Math.floor((game?.minutes||540)/60)%24,night=hour<6||hour>=20;const weather=weatherAt(game?.minutes||540),winter=seasonAt(game?.minutes||540)==='winter';const bg=night?'#64777b':/rain/i.test(weather)?'#acb9bc':winter?'#e6edf0':'#e7e8d9';
 return <><color attach="background" args={[bg]}/><fog attach="fog" args={[bg,63,135]}/><ambientLight intensity={night?.65:1.35}/><hemisphereLight args={[night?'#b7c7df':'#fff4dd','#8fa68e',1.2]}/><directionalLight position={[centre[0]-25,55,centre[1]+20]} intensity={night?.5:2.3}/>
 <Weather centre={centre} minutes={game?.minutes||540}/>{winter&&cells.filter(c=>c[1]<0).map(c=><Box key={c.join()} p={[c[0]*24+12,.01,c[1]*24+12]} s={[14,.07,14]} c="#e6ece6"/>)}<RoadNetwork cells={cells} onClick={click}/><group onClick={click}>{cells.map(c=><Chunk key={c.join(',')} cell={c}/>)}</group>
 {nearby.map(p=><group key={p.id} onClick={e=>{e.stopPropagation();if(e.delta<5)onSpot(p)}}>{p.kind==='park'?<Park spot={p}/>:p.kind==='landmark'?<Landmark spot={p} district={p.district}/>:<Store spot={p}/>}<mesh position={[p.x,.2,p.z+7]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.7,1,20]}/><meshBasicMaterial color={selected===p.id?'#fff5a1':'#f6e8c5'}/></mesh></group>)}
 {stops.map(s=><group key={s.id} position={[s.point[0],0,s.point[1]]} onClick={e=>{e.stopPropagation();if(e.delta<5)onStop(s.id)}}><Cylinder r={.09} h={3.8} p={[0,1.9,0]} c="#59675c"/><Box p={[0,3.3,0]} s={[1.5,.9,.2]} c="#d43f3a"/><Box p={[0,3.3,.12]} s={[1,.18,.03]} c="#fff8e5"/><Box p={[1.6,1.1,0]} s={[1.9,2.2,.15]} c="#9fb6ae"/><Box p={[1.6,2.3,0]} s={[2.2,.15,1.4]} c="#60796e"/></group>)}
 {Object.entries(PERSON_PLACES).map(([id,place],i)=>{const p=nearby.find(p=>p.id===place);return p?<group key={id} position={[p.x+2,0,p.z+7]}><Human appearance={npcAppearance(231+i*123)} action={i===0?'coffee':i===1?'wave':'talk'} minutes={game?.minutes||540} scale={1.8}/></group>:null})}

 <group ref={avatar}>{riding?<group><Box p={[0,.8,0]} s={[2,1.3,5.4]} c="#ce413a"/><Box p={[0,1.6,0]} s={[2,.8,5.4]} c="#f4eee0"/><Box p={[0,1.65,0]} s={[2.05,.55,4.9]} c="#2e4145"/><Box p={[0,2.1,0]} s={[2.1,.18,5.5]} c="#eee8d8"/>{[-1,1].map(x=>[-1.6,1.6].map(z=><mesh key={x+','+z} position={[x,.4,z]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.4,.4,.2,10]}/><meshStandardMaterial color="#303b38"/></mesh>))}</group>:<Human appearance={game?.life.appearance} action={game?.journey?(game.journey.kind==='bike'?'bike':game.journey.kind==='walk'?'walk':'wait'):game&&game.life.animationUntil>Date.now()?game.life.animation as HumanAction:'idle'} minutes={game?.minutes||540}/>}<mesh position={[0,.14,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.65,.88,24]}/><meshBasicMaterial color="#fff8cf"/></mesh></group>
 <Traffic cells={cells} minutes={game?.minutes||540} quality={quality} avatar={avatar} pedestrians={pedestrianPositions}/><Crowds positions={pedestrianPositions} centre={centre} minutes={game?.minutes||540} quality={quality}/><ProjectedLabels refs={labelRefs} spots={LABELS} selected={selected} avatar={avatar}/>
 <OrbitControls ref={controls} makeDefault enablePan={false} enableDamping dampingFactor={.12} minZoom={zoomMin} maxZoom={zoomMin*6} minPolarAngle={.45} maxPolarAngle={1.1} mouseButtons={{LEFT:THREE.MOUSE.ROTATE,MIDDLE:THREE.MOUSE.DOLLY,RIGHT:THREE.MOUSE.ROTATE}} touches={{ONE:THREE.TOUCH.ROTATE,TWO:THREE.TOUCH.DOLLY_ROTATE}}/>
 </>;
}
class SceneBoundary extends Component<{children:ReactNode;onFail:()=>void},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return {failed:true}}componentDidCatch(){this.props.onFail()}render(){return this.state.failed?null:this.props.children}}
export default function City(props:Props){const refs=useRef<LabelRefs>({player:null,places:new Map()});const [failed,setFailed]=useState(false);return <><SceneBoundary onFail={()=>setFailed(true)}><Canvas orthographic dpr={[1,props.quality?1.5:1]} camera={{position:[34,43,42],zoom:10,near:.1,far:180}} gl={{antialias:true,powerPreference:'high-performance'}} fallback={<div className="webgl-error">3D needs WebGL. Use Explore to choose places and travel.</div>}>{props.game?.journey&&['transit','fast'].includes(props.game.journey.kind)?<TransitScene game={props.game}/>:<Scene {...props} labelRefs={refs.current}/>}</Canvas></SceneBoundary>{!(props.game?.journey&&['transit','fast'].includes(props.game.journey.kind))&&<MapLabelOverlay refs={refs.current} spots={LABELS} selected={props.selected} name={props.player.name} labels={props.labels} onSpot={s=>s.id.startsWith('stop:')?props.onStop(s.id.slice(5)):props.onSpot(s)}/>} {failed&&<div className="webgl-error">3D could not load. Explore still provides walking and transit routes.</div>}</>}
