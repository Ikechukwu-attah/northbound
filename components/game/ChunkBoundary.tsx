'use client';
import {Component,type ReactNode} from 'react';
/** A lazily-loaded view (City/TransitInterior/HomeInterior) can 404 after a redeploy. Instead of
 * hanging on the "Opening…" fallback, catch the chunk failure and offer a one-tap refresh. */
const isStale=(msg:string)=>/ChunkLoadError|Loading chunk|dynamically imported module|importing a module script failed|Failed to fetch dynamically/i.test(msg);
export class ChunkBoundary extends Component<{children:ReactNode;label?:string},{failed:boolean;stale:boolean}>{
 state={failed:false,stale:false};
 static getDerivedStateFromError(err:unknown){const msg=err instanceof Error?err.name+' '+err.message:String(err);return {failed:true,stale:isStale(msg)};}
 render(){
  if(this.state.failed)return <div className="world-loading world-reload" role="alert">
   <p>{this.state.stale?'A new version is ready.':'The view didn’t load.'}</p>
   <button onClick={()=>location.reload()}>Tap to refresh</button>
  </div>;
  return this.props.children;
 }
}
