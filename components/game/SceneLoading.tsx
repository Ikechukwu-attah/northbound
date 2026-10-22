'use client';
import {useEffect} from 'react';
import {claimSceneRefresh,isStaleScene,SceneLoadTimeout} from '@/lib/game/scene-loading';

/** next/dynamic sends caught errors to its loading renderer, not the outer boundary. */
export default function SceneLoading({label,error,retry}:{label:string;error?:Error|null;retry?:()=>void}){
 useEffect(()=>{
  if(!error)return;
  try{if(claimSceneRefresh(error,window.sessionStorage))window.location.reload();}catch{/* Manual refresh remains available when storage is blocked. */}
 },[error]);
 if(!error)return <div className="world-loading" role="status" aria-live="polite">Opening {label}…</div>;
 return <div className="world-loading world-reload" role="alert">
  <strong>{isStaleScene(error)?'Updating this view…':error instanceof SceneLoadTimeout?'This view is taking too long to load.':`The ${label} couldn’t open.`}</strong>
  <p>Your progress is saved. Retry the view or refresh the game.</p>
  <div className="scene-recovery-actions">
   {retry&&<button onClick={retry}>Try again</button>}
   <button onClick={()=>window.location.reload()}>Refresh game</button>
  </div>
 </div>;
}
