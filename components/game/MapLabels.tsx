'use client';
import {CITY_NAME_HEIGHT} from '@/lib/game/city-scale';
import {useFrame,useThree} from '@react-three/fiber';
import type {RefObject} from 'react';
import * as THREE from 'three';
import {BookOpen,Coffee,House,MapPin,ShoppingBag,Trees} from 'lucide-react';
import type {Spot} from '@/lib/game/data';
import {placeLabels,type LabelCandidate} from '@/lib/game/ui';
export type LabelRefs={player:HTMLSpanElement|null;places:Map<string,HTMLButtonElement>};
const icons={cafe:Coffee,library:BookOpen,home:House,park:Trees,market:ShoppingBag,landmark:MapPin,service:BookOpen};
export function MapLabelOverlay({refs,spots,selected,name,labels,onSpot}:{refs:LabelRefs;spots:Spot[];selected:string;name:string;labels:boolean;onSpot:(spot:Spot)=>void}){
 return <div className="city-label-layer"><span ref={el=>{refs.player=el}} className="player-tag screen-player-tag" style={{visibility:'hidden'}}>{name||'You'}<i/></span>{labels&&spots.map(s=>{const Icon=icons[s.kind];return <button key={s.id} ref={el=>{if(el)refs.places.set(s.id,el);else refs.places.delete(s.id)}} style={{visibility:'hidden'}} className={'map-label screen-map-label '+(selected===s.id?'selected':'')} onClick={()=>onSpot(s)} title={s.name} aria-label={'Show '+s.name}><Icon size={13}/><span>{s.name}</span></button>})}</div>;
}
export function ProjectedLabels({refs,spots,selected,avatar}:{refs:LabelRefs;spots:Spot[];selected:string;avatar:RefObject<THREE.Group|null>}){
 const {camera,size,gl}=useThree();
 useFrame(()=>{
  if(!avatar.current||!refs.player)return;
  const project=(x:number,y:number,z:number)=>{const p=new THREE.Vector3(x,y,z).project(camera);return {x:(p.x+1)*size.width/2,y:(1-p.y)*size.height/2,visible:p.z>=-1&&p.z<=1};};
  const p=avatar.current.position;const anchor=project(p.x,p.y+CITY_NAME_HEIGHT,p.z);const pw=refs.player.offsetWidth,ph=refs.player.offsetHeight;
  const playerBox={x:anchor.x-pw/2,y:anchor.y-ph/2,width:pw,height:ph};
  const candidates:LabelCandidate[]=[];
  for(const s of spots){const el=refs.places.get(s.id);if(!el)continue;const a=project(s.x,s.id==='cn'?10:s.kind==='park'?1:6.5,s.z);if(!a.visible)continue;const width=el.offsetWidth,height=el.offsetHeight;candidates.push({id:s.id,x:a.x-width/2,y:a.y-height/2,width,height,priority:s.id===selected?1:0});}
  // Reserve the tag and the character immediately below it, even when labels are dense.
  const canvas=gl.domElement.getBoundingClientRect();
  const reserved=[{x:playerBox.x-10,y:playerBox.y-8,width:pw+20,height:ph+45}];
  document.querySelectorAll<HTMLElement>('.topbar,.status-card,.place-panel,.mini-map,.bottom-nav,.chapter-card,.world-tools,.district-title,.journey-card,.toast,.movement-mode,.critical-needs').forEach(el=>{const r=el.getBoundingClientRect();if(r.width&&r.height&&getComputedStyle(el).visibility!=='hidden')reserved.push({x:r.left-canvas.left,y:r.top-canvas.top,width:r.width,height:r.height});});
  const header=document.querySelector('.topbar')?.getBoundingClientRect();const safeTop=Math.max(12,(header?.bottom??canvas.top)-canvas.top+12);const positions=placeLabels(candidates,reserved,size,{top:safeTop,bottom:16,left:12,right:12});
  refs.player.style.transform=`translate(${playerBox.x}px,${playerBox.y}px)`;
  refs.player.style.visibility=anchor.visible&&playerBox.y>=safeTop&&playerBox.y+ph<size.height-16?'visible':'hidden';
  for(const [id,el] of refs.places){const box=positions[id];el.style.visibility=box?'visible':'hidden';if(box)el.style.transform=`translate(${box.x}px,${box.y}px)`;}
 });
 return null;
}
