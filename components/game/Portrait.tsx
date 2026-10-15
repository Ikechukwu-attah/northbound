'use client';
import {Canvas,useThree} from '@react-three/fiber';
import {useLayoutEffect} from 'react';
import Human from './Human';
import type {Appearance} from '@/lib/game/characters';
function Frame({height}:{height:number}){const {camera,invalidate}=useThree();useLayoutEffect(()=>{camera.position.set(0,3*height,6);camera.lookAt(0,3*height,0);camera.updateProjectionMatrix();invalidate();},[camera,height,invalidate]);return null;}
/** A live bust of the same GLB, palette, facial shape and seasonal outfit as the world actor. */
export default function Portrait({appearance,minutes,small=false}:{appearance:Appearance;minutes:number;small?:boolean}){return <div className={'avatar human-portrait '+(small?'small':'')} role="img" aria-label="Portrait of this 3D character"><Canvas orthographic frameloop="demand" dpr={1} camera={{position:[0,3,6],zoom:small?32:58,near:.1,far:15}} gl={{alpha:true,antialias:true,powerPreference:'low-power'}}><ambientLight intensity={1.6}/><directionalLight position={[2,5,5]} intensity={2}/><Human appearance={appearance} minutes={minutes}/><Frame height={appearance.height}/></Canvas></div>}
