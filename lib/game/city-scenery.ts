import {blockForms} from './building-form';
import {exteriorKit} from './exterior-kit';
import {districtAt,PLACES,type Point} from './world';
import {PALETTES,roadAt,type Piece} from './roads';
/** Lightweight streamed continuation beyond both the detail ring and playable bounds. */
export function distantCity(cells:Point[]):Piece[]{
 const out:Piece[]=[],box=(p:Piece['p'],s:Piece['s'],c:string)=>out.push({p,s,c});
 for(const [cx,cz]of cells){if(cz>=0)continue;const x=cx*24,z=cz*24;
  box([x+12,-.18,z+12],[24,.2,24],'#8d9f72');
  box([x,-.01,z+12],[roadAt('z',x,z).width,.12,24],'#565b5f');box([x+12,-.01,z],[24,.12,roadAt('x',z,x).width],'#565b5f');
  for(const sign of [-1,1]){box([x+sign*5,.13,z+12],[1.45,.22,24],'#dbd7c8');box([x+12,.13,z+sign*5],[24,.22,1.45],'#dbd7c8');}
  const place=PLACES.find(p=>Math.floor(p.x/24)===cx&&Math.floor(p.z/24)===cz);
  if(place){if(place.kind!=='park'&&place.id!=='bluffs'&&place.id!=='humber')box([place.x,3,place.z],[8,6,5],place.color);continue;}
  for(const f of blockForms(cx,cz,districtAt([x+12,z+12])))out.push(...exteriorKit(f,PALETTES[districtAt([x+12,z+12])],false));
 }
 return out;
}
