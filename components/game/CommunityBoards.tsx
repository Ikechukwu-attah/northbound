'use client';
import {Html} from '@react-three/drei';
import {communityBoards,streetHosts} from '@/lib/game/street-life';
import {ACTIVITIES,activityBlock} from '@/lib/game/activities';
import {distance,type Point} from '@/lib/game/world';
import {npcAppearance} from '@/lib/game/characters';
import {CITY_HUMAN_SCALE} from '@/lib/game/city-scale';
import type {GameState} from '@/lib/game/engine';
import Human from './Human';
export default function CommunityBoards({game,centre,enabled,onOpen}:{game:GameState;centre:Point;enabled:boolean;onOpen:(id:string)=>void}){
 const hosts=streetHosts(game.minutes);
 return <>{communityBoards().filter(b=>distance(centre,b.point)<65).map((b,n)=>{const active=ACTIVITIES.filter(a=>a.place===b.id&&!activityBlock(game,a));return <group key={b.id}><group position={[b.point[0],0,b.point[1]]}><mesh position={[0,1.5,0]} onClick={e=>{e.stopPropagation();if(enabled&&e.delta<5)onOpen(b.id)}}><boxGeometry args={[1.8,1.8,.18]}/><meshStandardMaterial color="#2f6755"/></mesh>{[-.7,.7].map(x=><mesh key={x} position={[x,.7,0]}><boxGeometry args={[.12,1.4,.12]}/><meshStandardMaterial color="#9a784e"/></mesh>)}{[-.5,0,.5].map((x,i)=><mesh key={x} position={[x,1.6,.11]}><boxGeometry args={[.4,.7,.025]}/><meshStandardMaterial color={['#f4dda1','#dbb1a0','#b3cfd0'][i]}/></mesh>)}{distance(game.position,b.point)<16&&<Html center position={[0,2.9,0]} zIndexRange={[8,4]}><button className="home-door-marker" disabled={!enabled} onClick={()=>onOpen(b.id)}>{active.length?active[0].title:'Local activities'} ↗</button></Html>}</group>{hosts.some(h=>h.id===b.id)&&<group position={[b.person[0],0,b.person[1]]}><Human scale={CITY_HUMAN_SCALE} appearance={npcAppearance(901+n*23)} minutes={game.minutes} action={n===1?'wave':'talk'}/></group>}</group>})}</>;
}
