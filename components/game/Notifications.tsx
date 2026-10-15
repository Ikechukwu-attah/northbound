'use client';
import {createContext,useCallback,useContext,useEffect,useRef,useState} from 'react';
import {CheckCircle2,HelpCircle,X} from 'lucide-react';
import {NOTICE_DURATION_MS} from '@/lib/game/ui';
export type Notice={id:number;text:string;error:boolean};
export const NoticeContext=createContext<{notice:Notice|null;dismiss:()=>void}>({notice:null,dismiss:()=>{}});
export function useNotifications(){
 const [queue,setQueue]=useState<Notice[]>([]);const next=useRef(0);
 const dismiss=useCallback(()=>setQueue(items=>items.slice(1)),[]);
 const notify=useCallback((text:string,error=false)=>{const item={id:++next.current,text,error};setQueue(items=>[...items,item]);},[]);
 const notice=queue[0]??null;
 useEffect(()=>{if(!notice)return;const timer=setTimeout(dismiss,NOTICE_DURATION_MS);return()=>clearTimeout(timer)},[notice?.id,dismiss]);
 return {notice,dismiss,notify};
}
export function Notification({inline=false}:{inline?:boolean}){
 const {notice,dismiss}=useContext(NoticeContext);if(!notice)return null;
 return <div key={notice.id} className={(inline?'modal-notification':'toast')+(notice.error?' error':'')} role={notice.error?'alert':'status'} aria-live={notice.error?'assertive':'polite'} aria-atomic="true">{notice.error?<HelpCircle size={19}/>:<CheckCircle2 size={19}/>}<span>{notice.text}</span><button aria-label="Dismiss notification" onClick={dismiss}><X size={16}/></button></div>;
}
