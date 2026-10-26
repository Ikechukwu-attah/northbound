// Refresh only the eight approved OSM anchors; never move hand-authored game cells.
import {readFile,writeFile} from 'node:fs/promises';
const file=new URL('../data/osm/scarborough.json',import.meta.url),snapshot=JSON.parse(await readFile(file,'utf8'));
const query='[out:json][timeout:30];('+snapshot.features.map(f=>{const [type,id]=f.osm.split('/');return `${type}(${id});`}).join('')+');out center tags;';
let result,endpoint;
for(const host of ['https://maps.mail.ru/osm/tools/overpass/api/interpreter','https://overpass-api.de/api/interpreter']){
 try{const response=await fetch(host,{method:'POST',body:'data='+encodeURIComponent(query),signal:AbortSignal.timeout(40000)});if(!response.ok)continue;const data=await response.json();if(data.elements?.length){result=data;endpoint=host;break;}}catch{}
}
if(!result)throw new Error('OSM unavailable; existing snapshot has not been changed.');
for(const feature of snapshot.features){const e=result.elements.find(e=>e.type+'/'+e.id===feature.osm);if(!e?.center)throw new Error('Missing mapped feature '+feature.osm);feature.c=[e.center.lon,e.center.lat];feature.tags=Object.fromEntries(Object.entries(e.tags||{}).filter(([k])=>['name','building','amenity','shop','landuse'].includes(k)));}
snapshot.meta.endpoint=endpoint;snapshot.meta.osmTimestamp=result.osm3s.timestamp_osm_base;
await writeFile(file,JSON.stringify(snapshot,null,2)+'\n');console.log('Updated '+snapshot.features.length+' Scarborough anchors.');
