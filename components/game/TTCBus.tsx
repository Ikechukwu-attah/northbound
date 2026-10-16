'use client';
import {useMemo,useEffect,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {ttcStreetcarParts,STREETCAR_DECALS} from '@/lib/game/ttc-streetcar';
import {ttcBusParts,BUS_DECALS} from '@/lib/game/ttc-bus';
import {vehiclePoint,type Vehicle} from '@/lib/game/roads';
function useBusModel(kind:'bus'|'streetcar'='bus'){const model=useMemo(()=>{
 const parts=(kind==='bus'?ttcBusParts():ttcStreetcarParts()).map(p=>{const g=p.shape==='wheel'?new THREE.CylinderGeometry(p.s[0],p.s[0],p.s[1],12).rotateZ(Math.PI/2):new THREE.BoxGeometry(...p.s);if(p.rotation)g.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(...p.rotation)));g.translate(...p.p);const color=new THREE.Color(p.c),colors=new Float32Array(g.getAttribute('position').count*3);for(let i=0;i<colors.length;i+=3){colors[i]=color.r;colors[i+1]=color.g;colors[i+2]=color.b;}g.setAttribute('color',new THREE.BufferAttribute(colors,3));return g;});
 const body=mergeGeometries(parts)!;parts.forEach(g=>g.dispose());body.computeBoundingSphere();
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;const c=canvas.getContext('2d')!;c.textAlign='center';c.textBaseline='middle';
 c.fillStyle='#141d20';c.fillRect(0,0,512,64);c.fillStyle='#ffc14e';c.font='bold 44px monospace';c.fillText(kind==='bus'?'TTC  LOCAL':'TTC STREETCAR',256,33);
 c.fillStyle='#da291c';c.fillRect(0,64,512,64);c.strokeStyle='#fff9ec';c.lineWidth=4;c.beginPath();c.moveTo(158,77);c.lineTo(354,77);c.lineTo(336,109);c.lineTo(176,109);c.closePath();c.stroke();c.fillStyle='#fff9ec';c.font='bold italic 42px sans-serif';c.fillText('TTC',256,97);
 c.fillStyle='#f4f3ec';c.fillRect(0,128,512,64);c.fillStyle='#243137';c.font='bold 48px sans-serif';c.fillText(kind==='bus'?'8531':'4400',256,162);
 c.fillStyle='#2965ad';c.fillRect(0,192,512,64);c.fillStyle='#fff';c.font='bold 54px sans-serif';c.fillText('♿',256,226);
 const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;
 const order=['destination','badge','fleet','accessible'];const planes=(kind==='bus'?BUS_DECALS:STREETCAR_DECALS).map(d=>{const g=new THREE.PlaneGeometry(...d.size),uv=g.getAttribute('uv'),row=order.indexOf(d.tile);for(let i=0;i<uv.count;i++)uv.setY(i,1-(row+1)/4+uv.getY(i)/4);g.rotateY(d.angle);g.translate(...d.p);return g;});const decals=mergeGeometries(planes)!;planes.forEach(g=>g.dispose());decals.computeBoundingSphere();return {body,decals,map};
 },[kind]);useEffect(()=>()=>{model.body.dispose();model.decals.dispose();model.map.dispose()},[model]);return model;}
/** One shared model for moving traffic, legacy scenes and any visible player bus. */
export default function TTCBus({kind='bus'}:{kind?:'bus'|'streetcar'}){const model=useBusModel(kind);return <group><mesh geometry={model.body}><meshStandardMaterial vertexColors roughness={.65}/></mesh><mesh geometry={model.decals}><meshBasicMaterial map={model.map} toneMapped={false}/></mesh></group>}
/** Two draw calls for every visible bus; model details do not multiply traffic draw calls. */
export function TTCBusTraffic({vehicles,kind='bus'}:{vehicles:Vehicle[];kind?:'bus'|'streetcar'}){const buses=useMemo(()=>vehicles.filter(v=>v.kind===kind),[vehicles,kind]),model=useBusModel(kind),body=useRef<THREE.InstancedMesh>(null),decals=useRef<THREE.InstancedMesh>(null),dummy=useMemo(()=>new THREE.Object3D(),[]);useFrame(()=>{if(!body.current||!decals.current)return;for(let i=0;i<buses.length;i++){const v=buses[i],p=vehiclePoint(v);dummy.position.set(p[0],0,p[1]);dummy.rotation.set(0,v.axis==='x'?v.direction*Math.PI/2:v.direction===1?0:Math.PI,0);dummy.updateMatrix();body.current.setMatrixAt(i,dummy.matrix);decals.current.setMatrixAt(i,dummy.matrix);}body.current.count=decals.current.count=buses.length;body.current.instanceMatrix.needsUpdate=true;decals.current.instanceMatrix.needsUpdate=true;});return <><instancedMesh ref={body} geometry={model.body} args={[model.body,undefined,Math.max(1,buses.length)]} frustumCulled={false}><meshStandardMaterial vertexColors roughness={.65}/></instancedMesh><instancedMesh ref={decals} geometry={model.decals} args={[model.decals,undefined,Math.max(1,buses.length)]} frustumCulled={false}><meshBasicMaterial map={model.map} toneMapped={false}/></instancedMesh></>}
