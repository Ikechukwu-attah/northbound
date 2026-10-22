'use client';
import {Canvas,useFrame,useThree,type ThreeEvent} from '@react-three/fiber';
import {Html,OrbitControls} from '@react-three/drei';
import {useRef,useEffect,useMemo,useState,Component,type ReactNode} from 'react';
import * as THREE from 'three';
import {interiorLayout,interiorPosition,insideWalkable,CAFE_MENU,type InteriorState,type HomeLayout} from '@/lib/game/interiors';
import {movementKey,blocksMovement,directionVector,type Direction} from '@/lib/game/ui';
import {ROLES} from '@/lib/game/life';
import {daylightAt} from '@/lib/game/solar';
import {npcAppearance,type HumanAction} from '@/lib/game/characters';
import type {GameState,Command} from '@/lib/game/engine';
import type {Peer} from '@/lib/game/multiplayer';
import {distance,placeById,type Point} from '@/lib/game/world';
import Human from '../Human';
import PlayerName from '../PlayerName';
import HomeKit from './HomeKit';
import ObjectHint from './ObjectHint';
import {cafeStatus} from '@/lib/game/interiors';
type Props={game:GameState;peers:Peer[];serverTime?:number;send:(c:Command)=>Promise<boolean>;busy:boolean;movementEnabled:boolean;reset:number;quality:boolean;onBank?:()=>void};
function Resident({appearance,name,code,interior,minutes,offset=0}:{appearance:GameState['life']['appearance'];name:string;code?:string;interior:InteriorState;minutes:number;offset?:number}){
 const actor=useRef<THREE.Group>(null),prev=useRef<Point>(interior.position);const [active,setActive]=useState(false);const o=interiorLayout(interior).objects.find(o=>o.id===(interior.seat||interior.pose?.object)),action=interior.pose?.action;
 const lying=active&&action==='sleep',sitting=!!interior.seat||active&&['relax','sit','eat'].includes(action||''),privateUse=active&&['shower','bathroom'].includes(action||'');
 useFrame(()=>{if(!actor.current)return;const p=interiorPosition(interior,Date.now()+offset),dx=p[0]-prev.current[0],dz=p[1]-prev.current[1],using=!!interior.pose&&interior.pose.until>Date.now()+offset;
  if((using||interior.seat)&&o){if(action==='sleep'){actor.current.position.set(o.x,.94,o.z+.65);actor.current.rotation.y=0;}else if(interior.seat||['relax','sit','eat'].includes(action||'')){actor.current.position.set(o.x,0,o.z);actor.current.rotation.y=o.kind==='sofa'?Math.PI:0;}else{actor.current.position.set(p[0],0,p[1]);actor.current.rotation.y=Math.atan2(o.x-p[0],o.z-p[1]);}}
  else{actor.current.position.set(p[0],0,p[1]);if(Math.hypot(dx,dz)>.001)actor.current.rotation.y=Math.atan2(dx,dz);}prev.current=p;if(using!==active)setActive(using);
 });
 const animation:HumanAction=interior.movement?'walk':lying?'sleep':sitting?active&&action==='eat'?'eat':'sit':active&&action==='cook'?'cook':active&&action==='resume'?'type':active&&action==='talk'?'talk':active&&action==='coffee'?'coffee':'idle';
 return <group ref={actor} position={[interior.position[0],0,interior.position[1]]} visible={!privateUse}><PlayerName name={name} code={code} height={lying?.5:sitting?2:2.5}/><group rotation={lying?[-Math.PI/2,0,0]:[0,0,0]}><Human sheltered appearance={appearance} scale={1} minutes={minutes} action={animation}/></group>{!active&&<mesh rotation={[-Math.PI/2,0,0]} position={[0,.025,0]}><ringGeometry args={[.35,.45,24]}/><meshBasicMaterial color={code?'#69dce3':'#baff65'}/></mesh>}</group>;
}
function Occupants({i,minutes}:{i:InteriorState;minutes:number}){
 const cafe=i.kind==='cafe',hour=minutes%1440/60;const staff=hour>=7&&hour<20||!!i.order,homeAwake=hour>=7&&hour<23;
 if(i.kind==='bank')return <><group position={[-2,0,-6.4]} rotation={[0,0,0]}><Human sheltered scale={1} appearance={npcAppearance(305)} minutes={minutes} action="wait"/></group><group position={[-5,0,4.2]} rotation={[0,Math.PI,0]}><Human sheltered scale={1} appearance={npcAppearance(418)} minutes={minutes} action="sit"/></group></>;
 return <>{cafe?<>{staff&&<group position={[-3,0,-6.65]}><Human sheltered scale={1} appearance={npcAppearance(231)} minutes={minutes} action="cook"/></group>}{staff&&<group position={[2,0,-6.3]}><Human sheltered scale={1} appearance={npcAppearance(232)} minutes={minutes} action={i.order?'talk':'wait'}/></group>}{staff&&Array.from({length:i.queue||0},(_,n)=><group key={n} position={[-7.7,0,-2.5+n*1.4]} rotation={[0,Math.PI/2,0]}><Human sheltered scale={1} appearance={npcAppearance(354+n*31)} minutes={minutes} action="wait"/></group>)}{staff&&<group position={[-2,0,3]}><Human sheltered scale={1} appearance={npcAppearance(Math.floor(minutes/1440)%2?477:612)} minutes={minutes} action="eat"/></group>}</>:homeAwake&&<><group position={[2.8,0,-6]} rotation={[0,-Math.PI/2,0]}><Human sheltered scale={1} appearance={npcAppearance(725)} minutes={minutes} action="coffee"/></group><group position={[4,0,4]}><Human sheltered scale={1} appearance={npcAppearance(856)} minutes={minutes} action="sit"/></group></>}</>;
}
function Room({game,peers,serverTime,send,busy,movementEnabled,reset,onBank}:Props){
 const i=game.interior!,l=interiorLayout(i),cafe=i.kind==='cafe',{camera,size}=useThree(),controls=useRef<any>(null),keys=useRef(new Set<Direction>()),last=useRef(0);
 const [dismissed,setDismissed]=useState<string|null>(null),[selected,setSelected]=useState<string|null>(null),[hovered,setHovered]=useState<string|null>(null),[position,setPosition]=useState<Point>(i.position),[poseActive,setPoseActive]=useState(false),[job,setJob]=useState(ROLES[0].id);
 const offset=useMemo(()=>serverTime?serverTime-Date.now():0,[serverTime]);
 useEffect(()=>{camera.position.set(18,22,22);if(camera instanceof THREE.OrthographicCamera){camera.zoom=Math.min(size.width/(l.width*1.7),size.height/(l.depth*1.9));camera.updateProjectionMatrix();}if(controls.current){controls.current.target.set(0,0,0);controls.current.update()}},[camera,reset,size.width,size.height,l.width,l.depth]);
 useEffect(()=>{const down=(e:KeyboardEvent)=>{if(!movementEnabled||blocksMovement(e.target as HTMLElement))return;const key=movementKey(e);if(key){keys.current.add(key);e.preventDefault()}},up=(e:KeyboardEvent)=>{const key=movementKey(e);if(key)keys.current.delete(key)},clear=()=>keys.current.clear();window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',clear);return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',clear)}},[movementEnabled]);
 useFrame(()=>{const p=interiorPosition(i);if(distance(p,position)>.15)setPosition(p);const active=!!i.pose&&i.pose.until>Date.now();if(active!==poseActive)setPoseActive(active);if(busy||!movementEnabled||i.movement||!keys.current.size||Date.now()-last.current<350)return;const v=directionVector(keys.current),right=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,0),forward=new THREE.Vector3();camera.getWorldDirection(forward);right.y=forward.y=0;right.normalize();forward.normalize();const to:Point=[p[0]+(right.x*v.x+forward.x*v.y)*.8,p[1]+(right.z*v.x+forward.z*v.y)*.8];if(insideWalkable(to,l)){last.current=Date.now();setSelected(null);void send({type:'interior_walk',point:to})}});
 const privacy=poseActive&&['bathroom','shower'].includes(i.pose?.action||''),locked=busy||!movementEnabled||!!i.movement;
 const use=(id:string,mode?:string)=>{if(locked)return;void send({type:id==='exit'?'exit_home':'interior_use',id,mode})};
 const select=(id:string)=>{setDismissed(null);const door=l.doors.find(d=>d.id===id);if(door&&id!=='exit'){if(!locked&&!privacy)void send({type:'interior_walk',point:[door.x,door.z+(position[1]>door.z?-1:1)]});return;}setSelected(id);};
 const floor=(e:ThreeEvent<MouseEvent>)=>{e.stopPropagation();if(e.delta<5&&!locked){setSelected(null);setHovered(null);void send({type:'interior_walk',point:[e.point.x,e.point.z]})}};
 const nearest=l.objects.filter(o=>o.use&&distance(o.use,position)<2.1).sort((a,b)=>distance(a.use!,position)-distance(b.use!,position))[0]?.id;
 useEffect(()=>{if(dismissed&&dismissed!==nearest)setDismissed(null)},[nearest,dismissed]);
 const dismiss=()=>{setDismissed(selected||hovered||nearest||null);setSelected(null);setHovered(null)};
 useEffect(()=>{const escape=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();dismiss()}};window.addEventListener('keydown',escape,true);return()=>window.removeEventListener('keydown',escape,true)});
 const visibleId=privacy?null:(selected||(hovered!==dismissed?hovered:null)||(nearest!==dismissed?nearest:null)),o=l.objects.find(o=>o.id===visibleId),at=!!o?.use&&distance(i.position,o.use)<.65&&!i.movement;
 const occupied=l.objects.find(o=>o.id===(i.seat||poseActive&&i.pose?.object));const popupPlayer:Point=occupied&&['bed','sofa','chair'].includes(occupied.kind)?[occupied.x,occupied.z]:position;
 const light=daylightAt(game.minutes).light,zoom=Math.min(size.width/(l.width*1.9),size.height/(l.depth*1.6));
 return <><color attach="background" args={['#dce3d2']}/><ambientLight intensity={1.1+light*.4}/><hemisphereLight args={['#fff3d8','#657061',1]}/><directionalLight position={[-8,15,5]} intensity={1.8}/><HomeKit layout={l} player={position} privacy={privacy} onObject={select} onHover={setHovered} onFloor={floor}/>
 <Resident appearance={game.life.appearance} name={game.name} interior={i} minutes={game.minutes}/>{peers.filter(p=>p.interior).slice(0,size.width<=620?6:12).map(p=><Resident key={p.id} appearance={p.appearance} name={p.name} code={p.id} interior={p.interior!} minutes={p.minutes} offset={offset}/>)}
 {(cafe||i.tier==='room')&&<Occupants i={i} minutes={game.minutes}/>}
 {cafe&&<group position={[-3,2.5,-7.85]}><mesh><boxGeometry args={[6,1.5,.12]}/><meshStandardMaterial color="#24483d"/></mesh><Html transform position={[0,0,.08]} distanceFactor={5}><div className="cafe-menu-board"><strong>{placeById(i.place)?.name}</strong><span>COUNTER MENU · 7 AM – 8 PM</span>{CAFE_MENU.map(m=><div key={m.id}>{m.name}<b>${(m.price/100).toFixed(2)}</b></div>)}</div></Html></group>}
 {cafe&&occupied&&occupied.kind==='chair'&&(!!i.order?.paid||i.pose?.action==='eat')&&<group position={[occupied.x,1.5,occupied.z+1.15]}><mesh><cylinderGeometry args={[.3,.32,.05,18]}/><meshStandardMaterial color="#f3f0e7"/></mesh><mesh position={[0,.09,0]}><boxGeometry args={[.3,.1,.22]}/><meshStandardMaterial color="#c79a54"/></mesh><mesh position={[.4,.11,.08]}><cylinderGeometry args={[.12,.1,.24,14]}/><meshStandardMaterial color="#e4ded0"/></mesh></group>}
 {!cafe&&i.kind!=='bank'&&i.tier==='room'&&<Html center position={[-6,0,1]} style={{pointerEvents:'none'}} zIndexRange={[2,1]}><span className="room-sign">SHARED HALL → KITCHEN & BATH</span></Html>}
 {i.kind==='bank'&&<><group position={[-2,2.9,-7.82]}><mesh><boxGeometry args={[6,1.3,.12]}/><meshStandardMaterial color="#244b40"/></mesh><Html transform position={[0,0,.08]} distanceFactor={5} zIndexRange={[2,1]}><span className="room-sign" style={{color:'#f4ead0',letterSpacing:'2px',fontSize:'13px'}}>NEIGHBOURHOOD CREDIT UNION</span></Html></group><mesh position={[6.4,1.1,-5]}><boxGeometry args={[1.3,2.1,.5]}/><meshStandardMaterial color="#2f6d5b"/></mesh></>}
 {privacy&&<Html center position={[l.bathroom.x,3.5,l.bathroom.z]} zIndexRange={[9,5]}><span className="object-label">Door closed · {i.pose?.action==='shower'?'Showering':'Bathroom occupied'}</span></Html>}
 {visibleId==='exit'&&<ObjectHint player={popupPlayer} seated={!!i.seat} position={[0,2,l.depth/2]}><button className="object-label exit-label" disabled={locked} onClick={()=>use('exit')}>Exit through door ↗</button></ObjectHint>}
 {o?.use&&<ObjectHint player={popupPlayer} seated={!!i.seat} position={[o.x,2.6,o.z]}><div className="object-actions" onKeyDown={e=>e.stopPropagation()}><button className="object-dismiss" aria-label="Dismiss object" onClick={dismiss}>×</button>
 {i.kind==='bank'?<><strong>{o.id==='atm'?'ATM':'Teller'}</strong>{!at&&<button disabled={locked} onClick={()=>use(o.id)}>Walk over</button>}<button disabled={!onBank} onClick={()=>onBank?.()}>Open banking</button></>:
 o.kind==='desk'?<><strong>Your laptop</strong>{!at?<button disabled={locked} onClick={()=>use(o.id,'approach')}>Walk to laptop</button>:<><button disabled={locked} onClick={()=>use(o.id)}>Prepare résumé · 60 min</button><label>Role<select value={job} onChange={e=>setJob(e.target.value)}>{ROLES.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></label><button disabled={locked} onClick={()=>use(o.id,'tailor:'+job)}>Tailor résumé · 60 min</button><button disabled={locked} onClick={()=>use(o.id,'apply:'+job)}>Apply · 45 min</button></>}</>:
 o.id==='counter'?<><strong>Order at counter</strong>{!!i.queue&&<small>{i.queue} customers ahead · about {i.queue*2} game min</small>}{CAFE_MENU.map(m=><button key={m.id} disabled={locked||!!i.order} onClick={()=>use(o.id,m.id)}>{m.name} · ${(m.price/100).toFixed(2)}</button>)}{i.order&&<small>{cafeStatus(i)}</small>}</>:
 o.id==='register'?<><strong>The till</strong><button disabled={locked||!i.order||i.order.paid} onClick={()=>use(o.id)}>Pay {i.order?'$'+((CAFE_MENU.find(m=>m.id===i.order?.item)?.price||0)/100).toFixed(2):''}</button>{i.order&&!i.order.paid&&<button disabled={locked} onClick={()=>use(o.id,'cancel')}>Cancel unpaid order</button>}</>:
 o.kind==='chair'?<><strong>{cafe?'Café table':'Seat'}</strong><button disabled={locked} onClick={()=>use(o.id)}>Sit here</button>{i.seat===o.id&&<><button disabled={locked||!i.order?.paid} onClick={()=>use(o.id,'eat')}>Eat your order</button><button disabled={locked} onClick={()=>use(o.id,'rest')}>Rest · 30 min</button></>}</>:
 <><strong style={{textTransform:'capitalize'}}>{o.label?.replace(/ ·.*$/,'')||o.kind}</strong><button disabled={locked} onClick={()=>use(o.id)}>{o.label}{o.action==='cook'&&<small>{game.life.groceries} pantry portions</small>}</button></>}
 </div></ObjectHint>}
 <OrbitControls ref={controls} makeDefault enablePan={false} enableDamping minZoom={Math.max(7,zoom*.65)} maxZoom={Math.max(65,zoom*4)} minPolarAngle={.9} maxPolarAngle={.9}/></>;
}
class Boundary extends Component<{children:ReactNode},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return {failed:true}}render(){return this.state.failed?<div className="webgl-error">This interior needs WebGL. You can still exit using the controls below.</div>:this.props.children}}
export default function HomeInterior(props:Props){return <Boundary><Canvas orthographic dpr={[1,props.quality?1.5:1]} camera={{position:[18,22,22],zoom:28,near:.1,far:100}} gl={{antialias:true,powerPreference:'high-performance'}}><Room {...props}/></Canvas></Boundary>}
