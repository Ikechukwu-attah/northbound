'use client';
import {Html} from '@react-three/drei';
import {useFrame,useThree} from '@react-three/fiber';
import {useRef} from 'react';
import {Group,Vector3,type Object3D} from 'three';
/** Uses the actor's scene transform, including passing offsets, rather than stale saved coordinates. */
export default function PlayerName({name,code,height=2.3}:{name:string;code?:string;height?:number}){
 const group=useRef<Group>(null),tag=useRef<HTMLSpanElement>(null),v=useRef(new Vector3());const {camera,size,gl}=useThree();
 useFrame(()=>{if(!group.current||!tag.current)return;let visible=true,parent:Object3D|null=group.current;while(parent){if(!parent.visible)visible=false;parent=parent.parent;}group.current.getWorldPosition(v.current);v.current.project(camera);const canvas=gl.domElement.getBoundingClientRect(),top=(document.querySelector('.topbar')?.getBoundingClientRect().bottom??canvas.top)-canvas.top+8,x=(v.current.x+1)*size.width/2,y=(1-v.current.y)*size.height/2;tag.current.style.visibility=visible&&v.current.z>=-1&&v.current.z<=1&&x>=10&&x<size.width-10&&y>top+18&&y<size.height-75?'visible':'hidden';});
 return <group ref={group} position={[0,height,0]}><Html center zIndexRange={[15,10]} style={{pointerEvents:'none'}}><span ref={tag} className="visitor-name" aria-label={'Player '+name}>{name}{code&&<small>#{code.slice(0,6)}</small>}</span></Html></group>;
}
