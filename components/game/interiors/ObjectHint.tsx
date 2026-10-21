'use client';
import {Html} from '@react-three/drei';
import {useFrame,useThree} from '@react-three/fiber';
import {useRef,type ReactNode} from 'react';
import * as THREE from 'three';
import {popupPlacement} from '@/lib/game/popup';
import type {Point} from '@/lib/game/world';
export default function ObjectHint({position,player,seated=false,children}:{position:[number,number,number];player:Point;seated?:boolean;children:ReactNode}){
 const tag=useRef<HTMLDivElement>(null),group=useRef<THREE.Group>(null),v=useRef(new THREE.Vector3()),{camera,size,gl}=useThree();
 useFrame(()=>{if(!group.current||!tag.current)return;const project=(x:number,y:number,z:number)=>{v.current.set(x,y,z).project(camera);return {x:(v.current.x+1)*size.width/2,y:(1-v.current.y)*size.height/2}};group.current.getWorldPosition(v.current);v.current.project(camera);const anchor={x:(v.current.x+1)*size.width/2,y:(1-v.current.y)*size.height/2};const foot=project(player[0],0,player[1]),head=project(player[0],seated?1.7:2.4,player[1]),canvas=gl.domElement.getBoundingClientRect(),top=Math.max(90,(document.querySelector('.interior-heading')?.getBoundingClientRect().bottom||canvas.top+90)-canvas.top+8),bottom=(document.querySelector('.interior-footer')?.getBoundingClientRect().top||document.querySelector('.bottom-nav')?.getBoundingClientRect().top||canvas.bottom-90)-canvas.top-8;const safe={x:8,y:top,width:size.width-16,height:Math.max(40,bottom-top)};
 tag.current.style.maxHeight=`${Math.max(40,Math.min(safe.height, safe.height-(foot.y-head.y)-35))}px`;tag.current.style.overflowY='auto';const r=tag.current.getBoundingClientRect(),box=popupPlacement(anchor,r.width,r.height,safe,{x:Math.min(head.x,foot.x)-28,y:Math.min(head.y,foot.y)-10,width:Math.abs(foot.x-head.x)+56,height:Math.abs(foot.y-head.y)+24});tag.current.style.visibility=box?'visible':'hidden';if(box)tag.current.style.transform=`translate(${box.x+r.width/2-anchor.x}px,${box.y+r.height/2-anchor.y}px)`;
 });
 return <group ref={group} position={position}><Html center zIndexRange={[9,5]}><div ref={tag}>{children}</div></Html></group>;
}
