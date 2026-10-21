export type Rect={x:number;y:number;width:number;height:number};
export const overlaps=(a:Rect,b:Rect)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
/** Prefer above/below the actor; constrain to the HUD-safe viewport. Never obscure their body. */
export function popupPlacement(anchor:{x:number;y:number},width:number,height:number,safe:Rect,player:Rect):Rect|null{
 const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
 const candidates=[{x:anchor.x-width/2,y:player.y-height-12},{x:anchor.x-width/2,y:player.y+player.height+12},{x:player.x-width-12,y:anchor.y-height/2},{x:player.x+player.width+12,y:anchor.y-height/2},{x:safe.x,y:safe.y},{x:safe.x+safe.width-width,y:safe.y}];
 for(const p of candidates){const r={x:clamp(p.x,safe.x,safe.x+safe.width-width),y:clamp(p.y,safe.y,safe.y+safe.height-height),width,height};if(width<=safe.width&&height<=safe.height&&!overlaps(r,player))return r;}
 return null;
}
