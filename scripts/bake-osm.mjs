// Offline OSM bake for Northbound. Fetches real-world coordinates for every TTC
// stop and game place (plus former-municipality bounds) and writes data/osm/geo.json.
// The game renders a compressed map but drives travel time/distance from these.
// Data © OpenStreetMap contributors, ODbL 1.0 (see data/osm/LICENSE).
import {writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const BBOX=[43.58,-79.66,43.87,-79.11]; // S,W,N,E — covers all six former municipalities + Pearson.
// Note: overpass.osm.ch is a Switzerland-only mirror (no Toronto data) and is omitted.
const ENDPOINTS=[
 'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
 'https://overpass-api.de/api/interpreter',
 'https://overpass.kumi.systems/api/interpreter',
];
const UA='northbound-osm-bake/1.0 (dev)';
const norm=s=>s.toLowerCase().normalize('NFKD').replace(/[‐-―]/g,'-').replace(/['.’]/g,'').replace(/\bstation\b/g,'').replace(/\s+/g,' ').trim();

async function overpass(query){
 let lastErr;
 for(const ep of ENDPOINTS){
  for(let attempt=0;attempt<2;attempt++){
   try{
    const res=await fetch(ep,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded','User-Agent':UA},body:'data='+encodeURIComponent(query)});
    if(!res.ok){lastErr=new Error(`${ep} -> HTTP ${res.status}`);await sleep(1500);continue;}
    const json=await res.json();
    if(!Array.isArray(json.elements))throw new Error('no elements');
    console.log(`  ${ep.split('/')[2]} -> ${json.elements.length} elements`);
    return json.elements;
   }catch(e){lastErr=e;await sleep(1500);}
  }
 }
 throw lastErr;
}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const coordOf=e=>e.type==='node'?[e.lon,e.lat]:e.center?[e.center.lon,e.center.lat]:null;
const round=([lon,lat])=>[Math.round(lon*1e5)/1e5,Math.round(lat*1e5)/1e5];

// Named features we anchor places/non-subway stops to (matched by normalised name).
const FEATURES={
 'CN Tower':'cn_tower','Kensington Market':'kensington','Harbourfront Centre':'harbourfront',
 'Toronto Public Library - Toronto Reference Library':'reference_library','Mel Lastman Square':'mel_square',
 'Toronto Public Library - North York Central Library':'ny_library','Scarborough Town Centre':'stc_mall',
 "Bluffer's Park":'bluffers','Humber Bay Park West':'humber_bay',
 'Colonel Samuel Smith Park':'sam_smith','Taylor Creek Park':'taylor_creek',
 'East York Civic Centre':'ey_civic','Toronto Pearson International Airport':'pearson',
 'Mimico GO Station':'mimico_go','Islington':'islington_sub','Scarborough Centre':'scar_centre',
};
// Real OSM coords for features whose bare name ("Weston", "Long Branch") is ambiguous.
// Rouge: the park centroid sits far north in Markham; anchor to its Scarborough (Rouge Hill) section.
const FEATURE_FALLBACK={weston_go:[-79.51276,43.70005],longbranch_go:[-79.54529,43.59205],rouge:[-79.129,43.779]};
// Non-subway TTC stop anchors that are hard to name-query → documented real fallbacks.
const STOP_FALLBACK={
 queenwest:[-79.39664,43.64873], harbour:[-79.38103,43.63866], york:[-79.43460,43.69812],
 ey:[-79.33727,43.69024], lakeshore:[-79.54330,43.59216],
};
// stopId → how to resolve: subway name, feature key, fallback, or another stop's coord.
const STOP_MAP={
 finch:{sub:'Finch'},nyc:{sub:'North York Centre'},sheppard:{sub:'Sheppard-Yonge'},eglinton:{sub:'Eglinton'},
 bloor:{sub:'Bloor-Yonge'},queen:{sub:'Queen'},union:{sub:'Union'},kipling:{sub:'Kipling'},jane:{sub:'Jane'},
 dundas:{sub:'Dundas West'},broadview:{sub:'Broadview'},coxwell:{sub:'Coxwell'},kennedy:{sub:'Kennedy'},
 stc:{feat:'scar_centre',alt:'stc_mall'},bluffs:{feat:'bluffers'},rouge:{feat:'rouge'},weston:{feat:'weston_go'},
 york:{fb:'york'},mimico:{feat:'mimico_go'},lakeshore:{feat:'longbranch_go',fb:'lakeshore'},ey:{fb:'ey'},
 taylor:{feat:'taylor_creek'},queenwest:{fb:'queenwest'},harbour:{feat:'harbourfront',fb:'harbour'},
 standrew:{sub:'St Andrew'},osgoode:{sub:'Osgoode'},stpatrick:{sub:'St Patrick'},queenspark:{sub:"Queen's Park"},
 museum:{sub:'Museum'},stgeorge:{sub:'St George'},spadina:{sub:'Spadina'},dupont:{sub:'Dupont'},
 stclairwest:{sub:'St Clair West'},cedarvale:{sub:'Cedarvale'},lawrencewest:{sub:'Lawrence West'},
 yorkdale:{sub:'Yorkdale'},wilson:{sub:'Wilson'},sheppardwest:{sub:'Sheppard West'},downsview:{sub:'Downsview Park'},
 finchwest:{sub:'Finch West'},yorku:{sub:'York University'},pioneer:{sub:'Pioneer Village'},
 highway407:{sub:'Highway 407'},vaughan:{sub:'Vaughan Metropolitan Centre'},bayview:{sub:'Bayview'},
 bessarion:{sub:'Bessarion'},leslie:{sub:'Leslie'},donmills:{sub:'Don Mills'},pearson:{feat:'pearson'},
};
// placeId → anchor (reuse a feature or a stop's coord so distances stay internally consistent).
const PLACE_MAP={
 kensington:{feat:'kensington'},queen:{stop:'queenwest'},cn:{feat:'cn_tower'},waterfront:{feat:'harbourfront'},
 reference:{feat:'reference_library'},home:{feat:'kensington'},
 mel:{feat:'mel_square'},willowdale:{stop:'nyc'},nylibrary:{feat:'ny_library'},yonges:{stop:'sheppard'},nycentre:{stop:'nyc'},
 bluffs:{feat:'bluffers'},stc:{feat:'stc_mall'},scafe:{feat:'stc_mall'},rouge:{feat:'rouge'},slibrary:{feat:'scar_centre'},
 humber:{feat:'humber_bay'},mimico:{feat:'mimico_go'},islington:{feat:'islington_sub'},colonel:{feat:'sam_smith'},elibrary:{feat:'islington_sub'},
 weston:{feat:'weston_go'},eglinton:{stop:'york'},humbertrail:{feat:'weston_go'},yorklibrary:{feat:'weston_go'},westonsquare:{feat:'weston_go'},
 eymarket:{stop:'ey'},eycafe:{stop:'coxwell'},taylor:{feat:'taylor_creek'},eylibrary:{feat:'ey_civic'},eycentre:{feat:'ey_civic'},
 // Service locations (world.ts services): anchored to a real feature in the right district.
 airport:{feat:'pearson'},servicecanada:{stop:'nyc'},bank:{feat:'reference_library'},phone:{feat:'cn_tower'},
 health:{feat:'kensington'},housing:{feat:'harbourfront'},college:{feat:'reference_library'},
};
const DISTRICTS=['Old Toronto','North York','Scarborough','Etobicoke','York','East York'];
const DISTRICT_FALLBACK={ // real former-municipality centres [lon,lat]
 'Old Toronto':[-79.3832,43.6532],'North York':[-79.4112,43.7615],'Scarborough':[-79.2318,43.7731],
 'Etobicoke':[-79.5665,43.6435],'York':[-79.4819,43.6896],'East York':[-79.3376,43.6907],
};
// Real former-municipality bounding boxes [minlon,minlat,maxlon,maxlat] (Old Toronto has no OSM relation).
const DISTRICT_BBOX_FALLBACK={
 'Old Toronto':[-79.4425,43.628,-79.2769,43.7111],'North York':[-79.4822,43.7117,-79.3515,43.8],
 'Scarborough':[-79.2639,43.6817,-79.1159,43.8554],'Etobicoke':[-79.6392,43.5872,-79.4615,43.7599],
 'York':[-79.5272,43.6668,-79.4479,43.7117],'East York':[-79.3703,43.6668,-79.3008,43.7117],
};

async function main(){
 const [S,W,N,E]=BBOX,bbox=`${S},${W},${N},${E}`;
 console.log('1/4 subway stations…');
 let subway=new Map();
 for(let t=0;t<6&&subway.size<60;t++){if(t)await sleep(5000);try{const subEls=await overpass(`[out:json][timeout:60];node["railway"="station"]["station"="subway"](${bbox});out;`);const m=new Map();for(const e of subEls){const c=coordOf(e);if(e.tags?.name&&c)m.set(norm(e.tags.name),{c,id:'node/'+e.id,name:e.tags.name});}if(m.size>subway.size)subway=m;}catch(e){console.log('   subway attempt failed:',e.message);}console.log(`   attempt ${t+1}: ${subway.size} named subway stations`);}

 console.log('2/4 named features…');
 const names=Object.keys(FEATURES);
 const featQ=`[out:json][timeout:90];(`+names.map(n=>`nwr["name"="${n}"](${bbox});`).join('')+`);out center;`;
 let feats={};
 for(let t=0;t<6;t++){if(t)await sleep(5000);try{const featEls=await overpass(featQ);const f={};for(const e of featEls){const key=FEATURES[e.tags?.name];const c=coordOf(e);if(key&&c&&!f[key])f[key]={c,id:e.type+'/'+e.id,name:e.tags.name};}if(Object.keys(f).length>Object.keys(feats).length)feats=f;}catch(e){console.log('   features attempt failed:',e.message);}console.log(`   attempt ${t+1}: ${Object.keys(feats).length}/${names.length} features`);if(names.every(n=>feats[FEATURES[n]]))break;}
 for(const [key,c]of Object.entries(FEATURE_FALLBACK))if(!feats[key])feats[key]={c,id:'fallback',name:key};
 const missing=Object.values(FEATURES).filter(k=>!feats[k]);
 console.log(`   matched ${Object.keys(feats).length}/${names.length+Object.keys(FEATURE_FALLBACK).length} features${missing.length?`; missing: ${missing.join(', ')}`:''}`);

 console.log('3/4 former-municipality boundaries (real bboxes)…');
 const distQ=`[out:json][timeout:120];(`+DISTRICTS.map(n=>`relation["boundary"="administrative"]["name"="${n}"](${bbox});`).join('')+`);out bb;`;
 let districts={};
 for(let t=0;t<6&&Object.keys(districts).length<5;t++){if(t)await sleep(5000);try{const distEls=await overpass(distQ);for(const e of distEls){const name=e.tags?.name,b=e.bounds;if(DISTRICTS.includes(name)&&b&&!districts[name])districts[name]={bbox:[b.minlon,b.minlat,b.maxlon,b.maxlat].map(v=>Math.round(v*1e5)/1e5),center:round([(b.minlon+b.maxlon)/2,(b.minlat+b.maxlat)/2]),osm:e.type+'/'+e.id};}}catch(e){console.log('   boundaries attempt failed:',e.message);}console.log(`   attempt ${t+1}: ${Object.keys(districts).length} real boundaries`);}
 for(const name of DISTRICTS)if(!districts[name])districts[name]={bbox:DISTRICT_BBOX_FALLBACK[name],center:DISTRICT_FALLBACK[name],osm:'fallback'}; // Old Toronto has no OSM relation

 // Lake Ontario is a water polygon in OSM (not natural=coastline). Build a coarse
 // shoreline profile from the real OSM waterfront feature coordinates, west→east,
 // which includes Humber Bay and the Scarborough Bluffs.
 console.log('4/5 Lake Ontario shoreline (from OSM waterfront features)…');
 const shoreline=['sam_smith','humber_bay','harbourfront','bluffers']
  .map(k=>feats[k]&&round(feats[k].c)).filter(Boolean).sort((a,b)=>a[0]-b[0]);
 console.log(`   ${shoreline.length} shoreline anchor points`);

 console.log('5/5 district arterials (real OSM street names)…');
 const arterials={};for(const d of DISTRICTS)arterials[d]={ns:[],ew:[]};
 for(let t=0;t<4&&DISTRICTS.some(d=>!arterials[d].ns.length&&!arterials[d].ew.length);t++){if(t)await sleep(5000);try{
  const roadEls=await overpass(`[out:json][timeout:150];way["highway"~"^(trunk|primary|secondary)$"]["name"](${bbox});out tags bb;`);
  const byName=new Map();
  for(const e of roadEls){const b=e.bounds,name=e.tags?.name;if(!b||!name)continue;const r={name,clon:(b.minlon+b.maxlon)/2,clat:(b.minlat+b.maxlat)/2,dx:b.maxlon-b.minlon,dy:b.maxlat-b.minlat};r.len=Math.max(r.dx,r.dy);const p=byName.get(name);if(!p||r.len>p.len)byName.set(name,r);}
  // Assign each road to the smallest district whose REAL OSM bbox contains its centre;
  // roads outside every Toronto district bbox (Vaughan/Markham etc.) are dropped.
  const inBox=(r,b)=>r.clon>=b[0]&&r.clon<=b[2]&&r.clat>=b[1]&&r.clat<=b[3];
  const buckets={};for(const d of DISTRICTS)buckets[d]=[];
  for(const r of byName.values()){let best=null,area=Infinity;for(const d of DISTRICTS){const b=districts[d].bbox;if(inBox(r,b)){const a=(b[2]-b[0])*(b[3]-b[1]);if(a<area){area=a;best=d;}}}if(best)buckets[best].push(r);}
  // Keep the longest (major) arterials per orientation, then order by position for display.
  for(const d of DISTRICTS){const rs=buckets[d].slice().sort((a,b)=>b.len-a.len);arterials[d]={ns:rs.filter(r=>r.dy>=r.dx*1.3).slice(0,6).sort((a,b)=>a.clon-b.clon).map(r=>r.name),ew:rs.filter(r=>r.dx>r.dy*1.3).slice(0,6).sort((a,b)=>b.clat-a.clat).map(r=>r.name)};}
  console.log('   '+DISTRICTS.map(d=>`${d.split(' ')[0]} ${arterials[d].ns.length}ns/${arterials[d].ew.length}ew`).join(' · '));
 }catch(e){console.log('   arterials attempt failed:',e.message);}}

 const resolveStop=(id,m)=>{
  if(m.sub){const hit=subway.get(norm(m.sub));if(hit)return{c:round(hit.c),osm:hit.id};console.warn(`  ! subway miss: ${id} (${m.sub})`);}
  if(m.feat&&feats[m.feat])return{c:round(feats[m.feat].c),osm:feats[m.feat].id};
  if(m.alt&&feats[m.alt])return{c:round(feats[m.alt].c),osm:feats[m.alt].id};
  if(m.fb&&STOP_FALLBACK[m.fb])return{c:STOP_FALLBACK[m.fb],osm:'fallback'};
  return null;
 };
 const stops={},places={},unresolved=[];
 for(const [id,m]of Object.entries(STOP_MAP)){const r=resolveStop(id,m);if(r)stops[id]=r;else unresolved.push('stop:'+id);}
 for(const [id,m]of Object.entries(PLACE_MAP)){
  let r=null;
  if(m.feat&&feats[m.feat])r={c:round(feats[m.feat].c),osm:feats[m.feat].id};
  else if(m.stop&&stops[m.stop])r={c:stops[m.stop].c,osm:stops[m.stop].osm};
  if(r)places[id]=r;else unresolved.push('place:'+id);
 }
 if(unresolved.length)console.warn('UNRESOLVED:',unresolved.join(', '));

 const out={
  meta:{source:'OpenStreetMap via Overpass',endpoints:ENDPOINTS,license:'ODbL-1.0',attribution:'© OpenStreetMap contributors',
   bbox:BBOX,fetchedAt:new Date().toISOString(),note:'Compressed game map; these real coords drive simulated distance/time only.'},
  stops,places,districts,shoreline,arterials,
 };
 const complete=!unresolved.length&&shoreline.length>=4&&Object.keys(stops).length===Object.keys(STOP_MAP).length&&Object.keys(places).length===Object.keys(PLACE_MAP).length;
 console.log(`\nstops=${Object.keys(stops).length}/${Object.keys(STOP_MAP).length} places=${Object.keys(places).length}/${Object.keys(PLACE_MAP).length} districts=${Object.keys(districts).length} shoreline=${shoreline.length}`);
 if(!complete){console.error('Incomplete fetch; NOT overwriting geo.json. Retry.');if(unresolved.length)console.error('unresolved:',unresolved.join(', '));process.exit(1);}
 const dest=fileURLToPath(new URL('../data/osm/geo.json',import.meta.url));
 writeFileSync(dest,JSON.stringify(out,null,1)+'\n');
 console.log(`Wrote ${dest}`);
}
main().catch(e=>{console.error(e);process.exit(1);});
