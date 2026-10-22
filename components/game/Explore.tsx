'use client';
import {useEffect,useState} from 'react';
import {Bus,MapPin,Navigation,ArrowRight,Bike,Footprints} from 'lucide-react';
import {DISTRICTS,money,type Spot,type DistrictId} from '@/lib/game/data';
import {PLACES,placeById,nearestPlace,entrance,walkingPath,walkMinutes,pathLength,distance,type Point} from '@/lib/game/world';
import {STOPS,LINES,WASHROOM_STOPS,nearestStop,stopById,transitRoute,serviceOpen,FARE} from '@/lib/game/transit';
import {fareFor,journeyPosition,realWalkInfo,travelEstimate,type GameState,type Command} from '@/lib/game/engine';
import {placeGeo,stopGeo,shoreline,islands,districts,OSM_META} from '@/lib/game/geo';
// Real Toronto overview projected from OpenStreetMap: former-municipality bboxes, the
// Lake Ontario waterfront, and real TTC stop positions. The player dot uses the real
// coordinate of their nearest place (the game world itself is compressed).
export function CityMap({point,small=false,onStop,onDistrict,selectedStop}:{point:Point;small?:boolean;onStop?:(id:string)=>void;onDistrict?:(id:DistrictId)=>void;selectedStop?:string}){
 const [S,W,N,E]=OSM_META.bbox as number[];const pad=16;
 const px=(lon:number)=>pad+(lon-W)/(E-W)*(640-2*pad),py=(lat:number)=>pad+(N-lat)/(N-S)*(540-2*pad);
 const pg=placeGeo(nearestPlace(point).id)||[(W+E)/2,(S+N)/2];
 const lake=`${px(W).toFixed(0)},540 `+shoreline.map(p=>`${px(p[0]).toFixed(1)},${py(p[1]).toFixed(1)}`).join(' ')+` ${px(E).toFixed(0)},540`;
 return <svg className={'city-map '+(small?'small':'')} viewBox="0 0 640 540" role="img" aria-label="Toronto overview from OpenStreetMap: North York across the north, Etobicoke west, Scarborough east, York west-centre, East York east-centre, Lake Ontario to the south. Subway and surface transit corridors.">
 <rect width="640" height="540" rx="12" fill="#dedfc9"/>
 <polygon points={lake} fill="#9fc4c1"/>
 <polygon points={islands.map(p=>`${px(p[0]).toFixed(1)},${py(p[1]).toFixed(1)}`).join(' ')} fill="#cdd8bf" stroke="#aec3b4" strokeWidth="1"/><text x={px(-79.37)} y={py(43.625)} textAnchor="middle" fontSize="8" fill="#5e7566">Toronto Islands</text>
 {DISTRICTS.map(d=>{const b=districts[d.name]?.bbox;if(!b)return null;const x0=px(b[0]),x1=px(b[2]),y0=py(b[3]),y1=py(b[1]);return <rect key={d.id} x={x0} y={y0} width={Math.max(0,x1-x0)} height={Math.max(0,y1-y0)} rx="7" fill="#ffffff" opacity=".1" stroke="#8aa08f" strokeWidth="1.1" strokeDasharray="5 4"/>;})}
 {LINES.map(line=>{const pts=line.stops.map(id=>{const c=stopGeo(id);return c?`${px(c[0]).toFixed(1)},${py(c[1]).toFixed(1)}`:null}).filter(Boolean).join(' ');return <polyline key={line.id} points={pts} stroke={line.color} strokeWidth={line.mode==='subway'?4:2.3} strokeDasharray={line.mode==='bus'?'5 4':undefined} fill="none" opacity=".85" strokeLinejoin="round"/>;})}
 {!small&&STOPS.map(s=>{const c=stopGeo(s.id);if(!c)return null;return <g key={s.id} role="button" tabIndex={0} aria-label={'Select '+s.name+' stop'} onClick={()=>onStop?.(s.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onStop?.(s.id)}}}><circle cx={px(c[0])} cy={py(c[1])} r="11" fill="transparent"/><circle cx={px(c[0])} cy={py(c[1])} r={selectedStop===s.id?6:3.5} fill={selectedStop===s.id?'#bd473c':'#fff6dc'} stroke="#635b48" strokeWidth="1.4"/><title>{s.name}</title></g>;})}
 {DISTRICTS.map(d=>{const c=districts[d.name]?.center;if(!c)return null;return <g key={d.id} role={onDistrict?'button':undefined} tabIndex={onDistrict?0:undefined} onClick={()=>onDistrict?.(d.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onDistrict?.(d.id)}}} aria-label={'Find places in '+d.name}><rect x={px(c[0])-52} y={py(c[1])-13} width="104" height="22" rx="6" fill="#f8f3e2" opacity=".92"/><text x={px(c[0])} y={py(c[1])+2} textAnchor="middle" fontSize={small?18:12.5} fontWeight="600" fill="#405a4e">{d.name}</text></g>;})}
 <circle cx={px(pg[0])} cy={py(pg[1])} r={small?11:8} fill="#315f4a" stroke="#fff8dd" strokeWidth="4"/>
 <text x="455" y="528" textAnchor="middle" fontSize="13" letterSpacing="2" fill="#4d7775">LAKE ONTARIO</text>{!small&&<text x="612" y="28" fontSize="15" fill="#415c50">N ↑</text>}
 </svg>;
}
export function Explore({game,busy,initialStop,initialExit,onCommand,onPlan,onChoose,onClose}:{game:GameState;busy:boolean;initialStop:string|null;initialExit?:string|null;onCommand:(c:Command)=>Promise<boolean>;onPlan?:(boarding:string,exit:string)=>void;onChoose:(s:Spot)=>void;onClose:()=>void}){
 const nearest=nearestStop(game.position);const [district,setDistrict]=useState<DistrictId>(game.district),[place,setPlace]=useState(game.location||'queen'),[boarding,setBoarding]=useState(initialStop||nearest.id),[exit,setExit]=useState(()=>initialExit||nearestStop(entrance(placeById(game.location||'queen')!)).id);
 // Keep the parent in sync with the current board/exit choice so it survives walking to the
 // boarding stop (the modal closes on the walk; reopening restores these via initialStop/initialExit).
 useEffect(()=>{onPlan?.(boarding,exit)},[boarding,exit]);// eslint-disable-line react-hooks/exhaustive-deps
 // Choosing a destination also points the exit stop at whichever stop is nearest it.
 const choose=(id:string)=>{setPlace(id);setExit(nearestStop(entrance(placeById(id)!)).id);};
 const chosen=PLACES.find(p=>p.id===place)!;const from=stopById(boarding)!,to=stopById(exit)!;const path=walkingPath(game.position,entrance(chosen));const atStop=distance(game.position,from.point)<=3;
 const route=boarding===exit?null:transitRoute(boarding,exit);const fare=fareFor(game),unavailable=busy||!!game.journey;
 const trip=travelEstimate(game,entrance(chosen),chosen.id),tripBike=travelEstimate(game,entrance(chosen),chosen.id,true),km=(m?:number)=>((m||0)/1000).toFixed(1);
 const act=async(c:Command)=>{if(await onCommand(c))onClose()};
 return <><p className="modal-intro">One connected Toronto. Walk the streets, find a stop, and choose where your next chapter begins.</p><CityMap point={game.journey?journeyPosition(game.journey):game.position} selectedStop={boarding} onStop={setBoarding} onDistrict={id=>{setDistrict(id);choose(PLACES.find(p=>p.district===id)!.id)}}/>
 <div className="map-legend"><span><i style={{background:'#c4a33c'}}/> Line 1 · Yonge–University</span><span><i style={{background:'#4e9272'}}/> Bloor–Danforth</span><span><i style={{background:'#a05da0'}}/> Line 4 · Sheppard</span><span><i style={{background:'#b7594c'}}/> Surface connections</span><span><i style={{background:'#315f4a'}}/> You</span></div>
 <div className="district-chips">{DISTRICTS.map(d=><button key={d.id} className={district===d.id?'active':''} onClick={()=>{setDistrict(d.id);choose(PLACES.find(p=>p.district===d.id)!.id)}}>{d.name}</button>)}</div>
 <div className="explore-place-list">{PLACES.filter(p=>p.district===district).map(p=><button key={p.id} className={place===p.id?'active':''} onClick={()=>choose(p.id)}><MapPin size={14}/>{p.name}<span>{game.visitedPlaces.includes(p.id)?'Visited':'New'}</span></button>)}</div>
 <section className="route-card"><span className="eyebrow">YOUR DESTINATION</span><h3>{chosen.name}</h3><p>{trip?trip.minutes:walkMinutes(path)} min on foot · ≈{km(trip?.metres)} km estimated distance{trip.slowed?" · exhausted, walking ~50% slower":""}</p><div className="route-buttons"><button className="primary" disabled={unavailable||distance(game.position,entrance(chosen))<.1} onClick={()=>act({type:'walk',id:chosen.id})}><Footprints size={16}/>Walk here</button><button className="secondary" disabled={unavailable||!game.bike||distance(game.position,entrance(chosen))<.1} onClick={()=>act({type:'walk',id:chosen.id,mode:'bike'})}><Bike size={16}/>{game.bike?`Cycle · ${tripBike?tripBike.minutes:walkMinutes(path,true)} min`:'Bike: explore 3 districts'}</button></div><button className="text-action" onClick={()=>{onChoose(chosen);onClose()}}>Show place details <ArrowRight size={14}/></button>{game.visitedPlaces.includes(chosen.id)&&<button className="text-action" disabled={unavailable||distance(game.position,entrance(chosen))<.1} onClick={()=>act({type:'fast',id:chosen.id})}>Fast travel via TTC · {money(fare)} · includes walking & ride time</button>}</section>
 <section className="route-card transit-route"><span className="ttc-pill"><Bus size={16}/> TTC</span><h3>Walk to a stop. Tap. Ride.</h3><label>Board at<select value={boarding} onChange={e=>setBoarding(e.target.value)}>{STOPS.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label><label>Exit at<select value={exit} onChange={e=>setExit(e.target.value)}>{STOPS.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
 {route&&<p>{[...new Set(route.legs.map(l=>LINES.find(x=>x.id===l.line)!.name))].join(' → ')}<br/>{route.minutes} min including estimated waits & transfers · {money(fare)}{fare===0?' (active transfer or fare cap)':''}</p>}
 {!atStop?<button className="primary" disabled={unavailable} onClick={()=>{onPlan?.(boarding,exit);act({type:'walk',id:'stop:'+boarding})}}><Navigation size={16}/>Walk to {from.name} · {travelEstimate(game,from.point,'stop:'+boarding).minutes} min</button>:<button className="primary" disabled={unavailable||!route||game.cash<fare} onClick={()=>act({type:'transit',id:to.id,mode:'playable'})}><Bus size={16}/>{serviceOpen(game.minutes)?`Enter · Travel to ${to.name}`:`Night bus to ${to.name}`}</button>}
 {atStop&&WASHROOM_STOPS.has(from.id)&&<button className="secondary" disabled={unavailable||!serviceOpen(game.minutes)} onClick={()=>act({type:'bathroom'})}>Use station washroom · 5 min</button>}
 <p className="fine-print">Adult tap {money(FARE.adult)} · 2-hour transfer · monthly cap after {FARE.monthlyCap} paid fares. Approx. 6 am–2 am; Sundays 8 am–2 am. A simplified overnight bus replacement adds 20 minutes. Selected corridors only; routes, waits and occasional delays are simulated, not live travel advice. <a href={FARE.source} target="_blank" rel="noreferrer">TTC fares checked {FARE.checked}</a>.</p></section></>;
}
