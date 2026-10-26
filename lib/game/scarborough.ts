import map from '../../data/osm/scarborough.json';
import type {Spot,DistrictId} from './data';
import {WALMART_ID} from './supercentre';
/** OSM anchors and deliberately compressed cells. No network work in the game. */
export const SCARBOROUGH_FEATURES=map.features;
export const SCARBOROUGH_PLACES:(Spot&{district:DistrictId})[]=map.features.map((f,i)=>({
 id:f.id,name:f.name,district:'scarborough',kind:f.form==='campus'?'library':'market',
 x:f.cell[0]*24+12,z:f.cell[1]*24+12,color:['#ae8261','#b8ad8e','#9bafa5','#bd956f'][i%4],
 description:f.form==='campus'?'A campus destination with study spaces. A stylised, compressed interpretation of the mapped site.':'A neighbourhood shopping destination with shops and services. A stylised, compressed interpretation of the mapped site.',
 activity:f.form==='campus'?'Study & explore':'Browse the shops'
}));
export const scarboroughFeature=(id:string)=>map.features.find(f=>f.id===id);
SCARBOROUGH_PLACES.push({id:WALMART_ID,name:'Walmart Supercentre · Scarborough Town Centre',district:'scarborough',kind:'market',x:252,z:-228,color:'#0879c5',description:'A large, stocked store inspired by the Walmart at 300 Borough Drive. Groceries, clothing, electronics, home goods and staffed checkouts. Stylised interior; game purchases only.',activity:'Shop inside Walmart'});
