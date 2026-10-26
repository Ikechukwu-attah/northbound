'use client';
import {useContext,useMemo,useEffect} from 'react';
import * as THREE from 'three';
import type {Spot} from '@/lib/game/data';
import {scarboroughFeature} from '@/lib/game/scarborough';
import {exteriorKit} from '@/lib/game/exterior-kit';
import {DaylightContext} from './Lighting';
import {Box} from './CityAssets';
/** Real mapped destinations reuse the same kit with different campus/mall massing. */
export default function ScarboroughExterior({spot}:{spot:Spot}){
 const feature=scarboroughFeature(spot.id)!,campus=feature.form==='campus',light=useContext(DaylightContext);
 const seed=feature.cell[0]*3+Math.abs(feature.cell[1]);
 const sign=useMemo(()=>{const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=128;const ctx=canvas.getContext('2d')!;ctx.fillStyle=campus?'#345d64':'#5b5547';ctx.fillRect(0,0,1024,128);ctx.fillStyle='#fff3d8';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='600 48px Arial';ctx.fillText(spot.name,512,64,980);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;},[spot.name,campus]);
 useEffect(()=>()=>sign.dispose(),[sign]);
 const pieces=useMemo(()=>exteriorKit({x:spot.x,z:spot.z,width:8,depth:5,height:campus?6.2:4,kind:campus?'campus':'shops',style:campus?'community':'retail',seed,house:false,side:1},[spot.color,'#b9c5b5','#ba9374'],true,light<.4),[spot.x,spot.z,spot.color,campus,seed,light<.4]);
 return <group>{pieces.map((p,i)=><Box key={i} p={p.p} s={p.s} c={p.c}/>)}<mesh position={[spot.x,campus?4.7:3.4,spot.z+2.66]}><planeGeometry args={[7.6,.95]}/><meshBasicMaterial map={sign}/></mesh></group>;
}
