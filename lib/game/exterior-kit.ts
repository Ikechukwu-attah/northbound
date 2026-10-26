import type {BuildingForm} from './building-form';
import type {Piece} from './roads';
/** Reused instanced kit: silhouette is identical at near and distant detail levels. */
export function exteriorKit(f:BuildingForm,palette:string[],detail=true,night=false):Piece[]{
 const out:Piece[]=[],{x,z,width:w,depth:d,height:h,seed:s,kind}=f;
 const wall=palette[s%palette.length],trim=['#ded2bc','#d3d9ce','#bca88c'][s%3],roof=['#594c43','#6a5145','#596565','#785542'][s%4];
 const box=(a:number,y:number,b:number,ww:number,hh:number,dd:number,c:string)=>out.push({p:[x+a,y,z+b],s:[ww,hh,dd],c});
 const glass=night?'#ffe3a1':'#9fc2c6';
 box(0,h/2+.15,0,w,h,d,wall);
 if(kind==='bungalow'||kind==='gable'||kind==='semi'){
  // Roof steps form a pitched silhouette; the low bungalow uses a hip roof.
  for(let i=0;i<5;i++)box(0,h+.15+i*.23,0,w+.18-i*w/6,.24,d+.18-(kind==='bungalow'?i*d/8:0),roof);
  if(kind==='semi')box(0,h/2+.15,d/2+.03,.16,h,.08,trim);
 }else if(kind==='modern'){
  box(-w*.18,h+.8,-d*.1,w*.64,1.3,d*.8,trim);box(0,h+.16,0,w+.16,.24,d+.16,roof);
 }else if(kind==='tower'){
  box(0,h+.8,0,w*.7,1.3,d*.7,trim);box(-w*.2,h+1.7,0,w*.2,.8,d*.4,roof);
 }else if(kind==='campus'){
  box(-w*.27,h+1.7,-d*.2,w*.45,3.1,d*.6,trim);box(w*.1,h+.4,d*.05,w*.6,.5,d*.65,glass);
 }else if(kind==='terrace'){
  box(-w*.15,h+1.3,-d*.15,w*.7,2.3,d*.65,trim);box(-w*.15,h+2.6,-d*.15,w*.73,.3,d*.68,roof);
 }else box(0,h+.3,0,w+.15,.35,d+.15,roof);
 if(!detail)return out;
 const floors=Math.max(1,Math.floor(h/2.6)),cols=Math.max(2,Math.floor(w/2));
 for(let floor=0;floor<floors;floor++)for(let col=0;col<cols;col++){
  const xx=-w/2+(col+.5)*w/cols,y=1.5+floor*2.6;
  for(const side of [-1,1])box(xx,y,side*(d/2+.025),w/cols*.55,1.05,.04,glass);
  if(kind==='slab'&&floor>0){box(xx,y-.65,d/2+.22,w/cols*.85,.12,.48,trim);box(xx,y-.3,d/2+.43,w/cols*.85,.55,.06,'#67787a');}
 }
 // Side windows avoid the entrance at ground level.
 for(let floor=1;floor<floors;floor++)for(const side of [-1,1])for(const zz of [-d*.26,d*.26])box(side*(w/2+.025),1.5+floor*2.6,zz,.04,1.1,d*.2,glass);
 if(kind==='shops'){
  for(let i=0;i<3;i++){const xx=(i-1)*w/3;box(xx,1.3,d/2+.03,w/3-.25,1.9,.07,glass);box(xx,2.6,d/2+.2,w/3-.16,.5,.4,['#a85546','#456b58','#496b87'][(s+i)%3]);}
 }else if(kind==='warehouse'){
  for(const xx of [-w*.27,w*.27]){box(xx,1.6,d/2+.04,w*.27,2.8,.08,'#8f9995');for(let y=.5;y<2.9;y+=.4)box(xx,y,d/2+.09,w*.27,.04,.02,trim);}
 }else if(f.house){
  if(kind==='gable')box(-w*.23,1.45,d/2+.12,w*.32,1.8,.25,trim);
  if(kind==='modern')box(w*.15,h-.7,d/2+.18,w*.6,.12,.4,trim);
  box(-w*.3,h+1.1,-d*.2,.5,1.3,.55,'#8e6454');
 }
 return out;
}
