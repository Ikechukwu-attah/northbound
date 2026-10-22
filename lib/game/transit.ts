import E from '../../config/economy.json';
import {distance,type Point} from './world';
import {stopMetres} from './geo';
export type Stop={id:string;name:string;point:Point};
const stop=(id:string,name:string,x:number,z:number):Stop=>({id,name,point:[x*24-5,z*24-5]});
// Real TTC station order and names. The compressed grid positions are a stylised schematic;
// real OSM [lon,lat] in data/osm/geo.json drive simulated distance/time and the Explore map.
export const STOPS:Stop[]=[
 // Line 1 · Yonge–University–Spadina (Finch → Vaughan), full real order.
 stop('finch','Finch',0,-17),stop('nyc','North York Centre',0,-14),stop('sheppard','Sheppard–Yonge',0,-13),stop('yorkmills','York Mills',0,-11.6),stop('lawrence','Lawrence',0,-10.2),stop('eglinton','Eglinton',0,-8),stop('davisville','Davisville',0,-7),stop('stclair','St Clair',0,-6.2),stop('summerhill','Summerhill',0,-5.4),stop('rosedale','Rosedale',0,-4.7),stop('bloor','Bloor–Yonge',0,-4),stop('wellesley','Wellesley',0,-3.6),stop('college','College',0,-3.2),stop('dundas1','TMU',0,-2.6),stop('queen','Queen',0,-2),stop('king','King',0,-1.5),stop('union','Union',0,-1),stop('standrew','St Andrew',-1,-1),stop('osgoode','Osgoode',-1,-2),stop('stpatrick','St Patrick',-1,-2.5),stop('queenspark','Queen’s Park',-1,-3),stop('museum','Museum',-1,-3.5),stop('stgeorge','St George',-1,-4),stop('spadina','Spadina',-2,-4),stop('dupont','Dupont',-2,-5),stop('stclairwest','St Clair West',-3,-6),stop('cedarvale','Cedarvale',-3,-8),stop('glencairn','Glencairn',-3,-9),stop('lawrencewest','Lawrence West',-3,-10),stop('yorkdale','Yorkdale',-3,-11),stop('wilson','Wilson',-3,-12),stop('sheppardwest','Sheppard West',-3,-13),stop('downsview','Downsview Park',-4,-14),stop('finchwest','Finch West',-4,-16),stop('yorku','York University',-4,-17),stop('pioneer','Pioneer Village',-4,-18),stop('highway407','Highway 407',-4,-19),stop('vaughan','Vaughan Metropolitan Centre',-4,-20),
 // Line 2 · Bloor–Danforth (Kipling → Kennedy), full real order.
 stop('kipling','Kipling',-8,-4),stop('islington','Islington',-7.3,-4),stop('royalyork','Royal York',-6.6,-4),stop('oldmill','Old Mill',-5.9,-4),stop('jane','Jane',-5,-4),stop('runnymede','Runnymede',-4.6,-4),stop('highpark','High Park',-4.25,-4),stop('keele','Keele',-3.9,-4),stop('dundas','Dundas West',-3,-4),stop('lansdowne','Lansdowne',-2.83,-4),stop('dufferin','Dufferin',-2.67,-4),stop('ossington','Ossington',-2.5,-4),stop('christie','Christie',-2.33,-4),stop('bathurst','Bathurst',-2.17,-4),stop('bay','Bay',-0.5,-4),stop('sherbourne','Sherbourne',1,-4),stop('castlefrank','Castle Frank',2,-4),stop('broadview','Broadview',3,-4),stop('chester','Chester',3.4,-4),stop('pape','Pape',3.8,-4),stop('donlands','Donlands',4.2,-4),stop('greenwood','Greenwood',4.6,-4),stop('coxwell','Coxwell',5,-4),stop('woodbine','Woodbine',5.8,-4),stop('mainstreet','Main Street',6.6,-4),stop('victoriapark','Victoria Park',7.4,-4),stop('warden','Warden',8.2,-4),stop('kennedy','Kennedy',9,-4),
 // Line 4 · Sheppard.
 stop('bayview','Bayview',1,-13),stop('bessarion','Bessarion',2,-13),stop('leslie','Leslie',3,-13),stop('donmills','Don Mills',5,-13),
 // Surface stops, named by intersection in the TTC style.
 stop('queenbathurst','Queen St W at Bathurst St',-2.3,-2),stop('queenwest','Queen St W at Spadina Ave',-2,-2),stop('queenuniversity','Queen St W at University Ave',-1.3,-2),stop('queenbay','Queen St at Bay St',-0.6,-2),stop('queenyonge','Queen St at Yonge St',-0.2,-2),stop('harbour','Queens Quay at Spadina Ave',1,0),stop('harbourfront','Queens Quay at Lower Simcoe St',1,-1),
 stop('stc','Scarborough Centre Station',11,-9),stop('bluffs','Brimley Rd at Bluffer’s Park',11,0),stop('rouge','Rouge Hill (Lawrence Ave E at Port Union Rd)',15,-8),stop('weston','Weston Rd at Lawrence Ave W',-5,-9),stop('york','Eglinton Ave W at Keele St',-4,-7),stop('mimico','Royal York Rd at Mimico GO',-7,-1),stop('lakeshore','Lake Shore Blvd W at Long Branch Loop',-9,0),stop('ey','Pape Ave at Cosburn Ave',4,-6),stop('taylor','O’Connor Dr at Taylor Creek Park',6,-7),stop('pearson','Pearson Airport · Terminal 1',-9,-8)];
export type Line={id:string;name:string;color:string;mode:'subway'|'bus'|'streetcar';stops:string[];times:number[];wait:number};
// Average in-service speeds (m/min) that turn real OSM station distances into leg times.
const SPEED:Record<Line['mode'],number>={subway:480,bus:320,streetcar:230};
const legMinutes=(a:string,b:string,mode:Line['mode']):number=>{const d=stopMetres(a,b);return d==null?2:Math.max(1,Math.round(d/SPEED[mode]));};
// Real line order; TTC route colours. Leg times derive from real OSM distances; headways are simulation estimates.
const RAW:Omit<Line,'times'>[]=[
 {id:'1',name:'Line 1 · Yonge–University',color:'#f1c21b',mode:'subway',stops:['finch','nyc','sheppard','yorkmills','lawrence','eglinton','davisville','stclair','summerhill','rosedale','bloor','wellesley','college','dundas1','queen','king','union','standrew','osgoode','stpatrick','queenspark','museum','stgeorge','spadina','dupont','stclairwest','cedarvale','glencairn','lawrencewest','yorkdale','wilson','sheppardwest','downsview','finchwest','yorku','pioneer','highway407','vaughan'],wait:4},
 {id:'2',name:'Line 2 · Bloor–Danforth',color:'#00923f',mode:'subway',stops:['kipling','islington','royalyork','oldmill','jane','runnymede','highpark','keele','dundas','lansdowne','dufferin','ossington','christie','bathurst','spadina','stgeorge','bay','bloor','sherbourne','castlefrank','broadview','chester','pape','donlands','greenwood','coxwell','woodbine','mainstreet','victoriapark','warden','kennedy'],wait:4},
 {id:'4',name:'Line 4 · Sheppard',color:'#8e44ad',mode:'subway',stops:['sheppard','bayview','bessarion','leslie','donmills'],wait:6},
 {id:'airport',name:'900 Airport Express',color:'#b7594c',mode:'bus',stops:['pearson','kipling'],wait:10},
 {id:'scarborough',name:'116 Morningside / Scarborough Centre',color:'#b7594c',mode:'bus',stops:['kennedy','stc','rouge'],wait:8},
 {id:'bluffs',name:'12 Kingston Rd',color:'#b7594c',mode:'bus',stops:['kennedy','bluffs'],wait:10},
 {id:'weston',name:'89 Weston',color:'#b7594c',mode:'bus',stops:['jane','weston','york','eglinton'],wait:8},
 {id:'lakeshore',name:'110 Islington South / Lakeshore',color:'#b7594c',mode:'bus',stops:['kipling','mimico','lakeshore'],wait:8},
 {id:'east',name:'72 Pape',color:'#b7594c',mode:'bus',stops:['broadview','ey','taylor','coxwell'],wait:8},
 {id:'queenstreet',name:'501 Queen',color:'#da291c',mode:'streetcar',stops:['queenbathurst','queenwest','queenuniversity','queenbay','queenyonge','queen'],wait:6},
 {id:'waterfront',name:'509 Harbourfront',color:'#da291c',mode:'streetcar',stops:['union','harbourfront','harbour'],wait:6}
];
export const LINES:Line[]=RAW.map(l=>({...l,times:l.stops.slice(1).map((s,i)=>legMinutes(l.stops[i],s,l.mode))}));
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

// TTC public washroom list; surface stops do not imply facilities.
export const WASHROOM_STOPS=new Set(["bloor","eglinton","finch","sheppard","sheppardwest","vaughan","wilson","finchwest","kennedy","kipling","donmills","cedarvale"]);
