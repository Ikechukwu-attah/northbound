'use client';
import {useEffect,useMemo} from 'react';
import * as THREE from 'three';
/** Canvas lettering keeps signs offline and avoids loading external fonts. */
export default function StoreSign({text,position,width=7,height=1,color='#0879c5'}:{text:string;position:[number,number,number];width?:number;height?:number;color?:string}){
 const map=useMemo(()=>{const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=160;const ctx=canvas.getContext('2d')!;ctx.fillStyle=color;ctx.fillRect(0,0,1024,160);ctx.fillStyle='#fff';ctx.font='bold 65px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,512,80,970);const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;return t;},[text,color]);
 useEffect(()=>()=>map.dispose(),[map]);return <mesh position={position}><planeGeometry args={[width,height]}/><meshBasicMaterial map={map} side={THREE.DoubleSide}/></mesh>;
}
