import E from '../../config/economy.json';
import {distance,type Point} from './world';
export type Stop={id:string;name:string;point:Point};
const stop=(id:string,name:string,x:number,z:number):Stop=>({id,name,point:[x*24-5,z*24-5]});
export const STOPS:Stop[]=[stop('finch','Finch',0,-17),stop('nyc','North York Centre',0,-14),stop('sheppard','Sheppard–Yonge',0,-13),stop('eglinton','Eglinton',0,-8),stop('bloor','Bloor–Yonge',0,-4),stop('queen','Queen',0,-2),stop('union','Union',0,-1),stop('kipling','Kipling',-8,-4),stop('jane','Jane',-5,-4),stop('dundas','Dundas West',-3,-4),stop('broadview','Broadview',3,-4),stop('coxwell','Coxwell',5,-4),stop('kennedy','Kennedy',9,-4),stop('stc','Scarborough Centre bus terminal',11,-9),stop('bluffs','Bluffer’s Park bus stop',11,0),stop('rouge','Rouge trail bus stop',15,-8),stop('weston','Weston bus stop',-5,-9),stop('york','Eglinton West bus stop',-4,-7),stop('mimico','Mimico bus stop',-7,-1),stop('lakeshore','Lakeshore bus stop',-9,0),stop('ey','East York bus stop',4,-6),stop('taylor','Taylor Creek bus stop',6,-7),stop('queenwest','Queen West streetcar',-2,-2),stop('harbour','Harbourfront streetcar',1,0),
 stop('standrew','St Andrew',-1,-1),stop('osgoode','Osgoode',-1,-2),stop('stpatrick','St Patrick',-1,-2.5),stop('queenspark','Queen’s Park',-1,-3),stop('museum','Museum',-1,-3.5),stop('stgeorge','St George',-1,-4),stop('spadina','Spadina',-2,-4),stop('dupont','Dupont',-2,-5),stop('stclairwest','St Clair West',-3,-6),stop('cedarvale','Cedarvale',-3,-8),stop('lawrencewest','Lawrence West',-4,-10),stop('yorkdale','Yorkdale',-4,-11),stop('wilson','Wilson',-4,-12),stop('sheppardwest','Sheppard West',-5,-13),stop('downsview','Downsview Park',-5,-14),stop('finchwest','Finch West',-5,-16),stop('yorku','York University',-5,-17),stop('pioneer','Pioneer Village',-5,-18),stop('highway407','Highway 407',-6,-19),stop('vaughan','Vaughan Metropolitan Centre',-6,-20),stop('bayview','Bayview',1,-13),stop('bessarion','Bessarion',2,-13),stop('leslie','Leslie',3,-13),stop('donmills','Don Mills',5,-13),stop('pearson','Pearson bus connection',-9,-8)];
export type Line={id:string;name:string;color:string;mode:'subway'|'bus'|'streetcar';stops:string[];times:number[];wait:number};
// Selected corridors, compressed for play. Durations and headways are simulation estimates.
export const LINES:Line[]=[
 {id:'1',name:'Line 1 · Yonge–University',color:'#c4a33c',mode:'subway',stops:['finch','nyc','sheppard','eglinton','bloor','queen','union','standrew','osgoode','stpatrick','queenspark','museum','stgeorge','spadina','dupont','stclairwest','cedarvale','lawrencewest','yorkdale','wilson','sheppardwest','downsview','finchwest','yorku','pioneer','highway407','vaughan'],times:[3,3,12,9,6,4,2,2,1,1,1,1,2,2,4,3,5,2,3,3,3,3,2,2,3,3],wait:4},
 {id:'2',name:'Line 2 · Bloor–Danforth',color:'#4e9272',mode:'subway',stops:['kipling','jane','dundas','spadina','stgeorge','bloor','broadview','coxwell','kennedy'],times:[10,5,7,2,3,5,7,12],wait:4},
 {id:'4',name:'Line 4 · Sheppard',color:'#985c9d',mode:'subway',stops:['sheppard','bayview','bessarion','leslie','donmills'],times:[3,2,2,3],wait:6},
 {id:'airport',name:'Airport bus connection',color:'#b7594c',mode:'bus',stops:['pearson','kipling'],times:[25],wait:10},
 {id:'scarborough',name:'Scarborough bus connector',color:'#b7594c',mode:'bus',stops:['kennedy','stc','rouge'],times:[18,22],wait:8},
 {id:'bluffs',name:'Bluffs bus connector',color:'#b7594c',mode:'bus',stops:['kennedy','bluffs'],times:[18],wait:10},
 {id:'weston',name:'Weston bus connector',color:'#b7594c',mode:'bus',stops:['jane','weston','york','eglinton'],times:[18,12,18],wait:8},
 {id:'lakeshore',name:'Etobicoke bus connector',color:'#b7594c',mode:'bus',stops:['kipling','mimico','lakeshore'],times:[20,12],wait:8},
 {id:'east',name:'East York bus connector',color:'#b7594c',mode:'bus',stops:['broadview','ey','taylor','coxwell'],times:[10,10,12],wait:8},
 {id:'queenstreet',name:'Queen streetcar corridor',color:'#be6850',mode:'streetcar',stops:['queenwest','queen'],times:[9],wait:6},
 {id:'waterfront',name:'Harbourfront streetcar corridor',color:'#be6850',mode:'streetcar',stops:['union','harbour'],times:[7],wait:6}
];
export const stopById=(id:string)=>STOPS.find(s=>s.id===id);
export const nearestStop=(p:Point)=>[...STOPS].sort((a,b)=>distance(p,a.point)-distance(p,b.point))[0];
export type Leg={from:string;to:string;line:string;minutes:number};
export function transitRoute(from:string,to:string){
 if(from===to)throw new Error('Choose a different stop.');
 const queue:{id:string;last:string;minutes:number;legs:Leg[]}[]=[{id:from,last:'',minutes:0,legs:[]}];const best=new Map<string,number>();
 while(queue.length){queue.sort((a,b)=>a.minutes-b.minutes);const q=queue.shift()!;if(q.id===to)return q;const key=q.id+':'+q.last;if((best.get(key)??Infinity)<=q.minutes)continue;best.set(key,q.minutes);
  for(const line of LINES){const index=line.stops.indexOf(q.id);if(index<0)continue;for(const next of [index-1,index+1]){if(next<0||next>=line.stops.length)continue;const ride=line.times[Math.min(index,next)],wait=q.last===line.id?0:line.wait+(q.last?3:0);queue.push({id:line.stops[next],last:line.id,minutes:q.minutes+ride+wait,legs:[...q.legs,{from:q.id,to:line.stops[next],line:line.id,minutes:ride+wait}]});}}
 }throw new Error('No connection is available.');
}
export const FARE={...E.transit,checked:E.lastChecked,source:E.sources.transit};
export const gameDate=(minutes:number)=>new Date(Date.UTC(2026,9,14)+minutes*60000);
export const fareMonth=(minutes:number)=>gameDate(minutes).toISOString().slice(0,7);
export function serviceOpen(minutes:number){const d=gameDate(minutes),t=minutes%1440;return t<120||t>=(d.getUTCDay()===0?480:360);}
