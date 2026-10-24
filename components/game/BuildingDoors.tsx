'use client';
import {useLayoutEffect,useMemo,useRef} from 'react';
import {Html} from '@react-three/drei';
import * as THREE from 'three';
import {streetBuildings,namedBuilding,type BuildingEntry} from '@/lib/game/building-catalog';
import {PLACES,distance,type Point} from '@/lib/game/world';
/** Instanced façades and paved approaches; only the nearest doors get DOM labels. */
export default function BuildingDoors({cells,position,home,enabled,onEnter}:{cells:Point[];position:Point;home:string;enabled:boolean;onEnter:(id:string)=>void}){
 const mesh=useRef<THREE.InstancedMesh>(null);
 const entries=useMemo(()=>[...cells.flatMap(([x,z])=>streetBuildings(x,z)),...PLACES.filter(p=>p.id!==home&&cells.some(([x,z])=>Math.floor(p.x/24)===x&&Math.floor(p.z/24)===z)).map(p=>namedBuilding(p.id)).filter((b):b is BuildingEntry=>!!b)],[cells.map(c=>c.join(',')).join(';'),home]);
 const parts=useMemo(()=>entries.flatMap(b=>{const [a,c]=b.approach,dx=c[0]-a[0],dz=c[1]-a[1];return [
  {b,p:[b.door[0],1.25,b.door[1]],s:[1.45,2.5,.14],r:b.rotation,color:'#365e57'},
  {b,p:[b.door[0]+Math.sin(b.rotation)*.09,1.65,b.door[1]+Math.cos(b.rotation)*.09],s:[.9,.8,.04],r:b.rotation,color:'#a8d4cc'},
  {b,p:[(a[0]+c[0])/2,.15,(a[1]+c[1])/2],s:[Math.abs(dx)+1.7,.08,Math.abs(dz)+1.7],r:0,color:'#d7ccb5'},
 ];}),[entries]);
 useLayoutEffect(()=>{const m=mesh.current;if(!m)return;const o=new THREE.Object3D(),color=new THREE.Color();parts.forEach((p,n)=>{o.position.set(p.p[0],p.p[1],p.p[2]);o.scale.set(p.s[0],p.s[1],p.s[2]);o.rotation.set(0,p.r,0);o.updateMatrix();m.setMatrixAt(n,o.matrix);m.setColorAt(n,color.set(p.color));});m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;m.computeBoundingSphere();},[parts]);
 const near=entries.filter(b=>distance(position,b.landing)<15).sort((a,b)=>distance(position,a.landing)-distance(position,b.landing)).slice(0,4);
 return <><instancedMesh ref={mesh} args={[undefined,undefined,parts.length]} onClick={e=>{e.stopPropagation();const b=parts[e.instanceId??-1]?.b;if(enabled&&b&&e.delta<5)onEnter(b.id);}}><boxGeometry/><meshStandardMaterial roughness={.85}/></instancedMesh>{near.map(b=><Html key={b.id} center position={[b.door[0],3.1,b.door[1]]} zIndexRange={[9,5]}><button className="home-door-marker" disabled={!enabled} title={b.name} onClick={()=>onEnter(b.id)}>Enter {b.style==='residence'?'residence':b.style} ↗</button></Html>)}</>;
}
