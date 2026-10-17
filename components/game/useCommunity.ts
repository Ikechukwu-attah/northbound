'use client';
import {useCallback,useEffect,useRef,useState,type RefObject} from 'react';
import type {CommunitySnapshot,SocialCommand} from '@/lib/game/multiplayer';
import type {GameState} from '@/lib/game/engine';
export function useCommunity(enabled:boolean,accept:(s:GameState,r:number)=>void,lock:RefObject<boolean>,setBusy:(b:boolean)=>void){
 const [data,setData]=useState<CommunitySnapshot|null>(null),[status,setStatus]=useState('Connecting…'),[error,setError]=useState('');
 const latest=useRef(data),acceptRef=useRef(accept),mounted=useRef(true),serial=useRef(0);acceptRef.current=accept;latest.current=data;
 const request=useCallback(async(c:SocialCommand)=>{
  const sequence=++serial.current;
  const res=await fetch('/api/community',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(c),signal:AbortSignal.timeout(12000)});const json=await res.json();if(!res.ok)throw new Error((json as {error?:string}).error||'Connection interrupted.');
  const next=json as CommunitySnapshot;if(mounted.current){acceptRef.current(next.state,next.revision);if(sequence===serial.current){setData(next);setStatus(next.self.online?'Connected · updates every 2 seconds':'Private city');if(c.type!=='sync')setError('');}}return next;
 },[]);
 const act=useCallback(async(c:SocialCommand)=>{if(lock.current)return false;lock.current=true;setBusy(true);try{await request(c);return true;}catch(e){try{await request({type:'sync'})}catch{}if(mounted.current)setError(e instanceof Error?e.message:'Connection interrupted.');return false;}finally{lock.current=false;setBusy(false);}},[request,lock,setBusy]);
 useEffect(()=>{mounted.current=true;if(!enabled)return;let stopped=false,timer:ReturnType<typeof setTimeout>,failures=0,inFlight=false;
  const poll=async()=>{if(stopped||inFlight)return;if(document.hidden||lock.current){timer=setTimeout(poll,1000);return;}
   inFlight=true;try{await request({type:'sync'});failures=0;}catch{failures++;if(!stopped){setStatus('Reconnecting…');setData(d=>d?{...d,peers:[]}:d);}}
   inFlight=false;if(!stopped)timer=setTimeout(poll,failures?Math.min(30000,2000*2**failures):latest.current?.self.online?2000:15000);
  };const resume=()=>{if(!document.hidden){clearTimeout(timer);timer=setTimeout(poll,50);}};void poll();document.addEventListener('visibilitychange',resume);window.addEventListener('online',resume);
  return()=>{stopped=true;mounted.current=false;clearTimeout(timer);document.removeEventListener('visibilitychange',resume);window.removeEventListener('online',resume);};
 },[enabled,request,lock]);
 return {data,status,error,act};
}
