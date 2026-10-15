// Real-world OpenStreetMap coordinates, baked offline into data/osm/geo.json by
// scripts/bake-osm.mjs. The visible map is compressed (see world.ts), but these
// real [lon,lat] anchors drive simulated travel distance and time.
// Data © OpenStreetMap contributors, ODbL 1.0 (data/osm/LICENSE).
// Relative path resolves both in-app (lib/game -> repo) and from tests' work/*/ dirs.
import geo from '../../data/osm/geo.json';
export type LonLat=[number,number];
type Anchor={c:LonLat;osm:string};
const stops=geo.stops as unknown as Record<string,Anchor>;
const places=geo.places as unknown as Record<string,Anchor>;
export const districts=geo.districts as unknown as Record<string,{center:LonLat;bbox:number[];osm:string}>;
export const shoreline=geo.shoreline as unknown as LonLat[]; // Lake Ontario waterfront profile, west→east
// Real arterial street names per former municipality, from OSM (N-S west→east, E-W north→south).
export const districtArterials=geo.arterials as unknown as Record<string,{ns:string[];ew:string[]}>;
export const OSM_ATTRIBUTION=geo.meta.attribution as string; // "© OpenStreetMap contributors"
export const OSM_META=geo.meta;

export const stopGeo=(id:string):LonLat|null=>stops[id]?.c??null;
export const placeGeo=(id:string):LonLat|null=>places[id]?.c??null;

/** Great-circle distance in metres between two [lon,lat] points. */
export function haversineMetres(a:LonLat,b:LonLat):number{
 const R=6371000,rad=(x:number)=>x*Math.PI/180;
 const dLat=rad(b[1]-a[1]),dLon=rad(b[0]-a[0]);
 const s=Math.sin(dLat/2)**2+Math.cos(rad(a[1]))*Math.cos(rad(b[1]))*Math.sin(dLon/2)**2;
 return 2*R*Math.asin(Math.min(1,Math.sqrt(s)));
}
export const placeMetres=(a:string,b:string):number|null=>{const x=placeGeo(a),y=placeGeo(b);return x&&y?haversineMetres(x,y):null;};
export const stopMetres=(a:string,b:string):number|null=>{const x=stopGeo(a),y=stopGeo(b);return x&&y?haversineMetres(x,y):null;};
