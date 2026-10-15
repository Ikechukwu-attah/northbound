/** Phase 0 UI policy shared by the input and label renderers. */
export const NOTICE_DURATION_MS = 4000;
export type Rect = {x:number;y:number;width:number;height:number};
export type LabelCandidate = Rect & {id:string;priority:number};
export function intersects(a:Rect,b:Rect,gap=0){return a.x < b.x+b.width+gap && a.x+a.width+gap>b.x && a.y<b.y+b.height+gap && a.y+a.height+gap>b.y;}
/** Keep the player clear; selected places get first choice. Hide excess labels instead of overlapping. */
export function placeLabels(candidates:LabelCandidate[],reserved:Rect[],viewport:{width:number;height:number},safe={top:8,bottom:8,left:8,right:8}){
 const occupied=[...reserved];const result:Record<string,Rect>={};
 for(const label of [...candidates].sort((a,b)=>b.priority-a.priority||a.id.localeCompare(b.id))){
  if(label.x+label.width<0||label.x>viewport.width||label.y+label.height<0||label.y>viewport.height)continue;
  for(const [dx,dy] of [[0,0],[0,-36],[0,36],[-100,0],[100,0],[0,-72],[0,72],[-160,-36],[160,-36],[-240,0],[240,0],[-320,0],[320,0]]){
   const box={x:Math.max(safe.left,Math.min(viewport.width-label.width-safe.right,label.x+dx)),y:Math.max(safe.top,label.y+dy),width:label.width,height:label.height};
   if(box.y<safe.top||box.y+box.height>viewport.height-safe.bottom||box.width>viewport.width-safe.left-safe.right)continue;
   if(occupied.some(other=>intersects(box,other,8)))continue;
   result[label.id]=box;occupied.push(box);break;
  }
 }
 return result;
}
export type Direction='up'|'down'|'left'|'right';
export function movementKey(event:{key:string;code?:string;ctrlKey?:boolean;metaKey?:boolean;altKey?:boolean}):Direction|null{
 if(event.ctrlKey||event.metaKey||event.altKey)return null;
 const codes:Record<string,Direction>={KeyW:'up',KeyS:'down',KeyA:'left',KeyD:'right',ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right'};
 const keys:Record<string,Direction>={w:'up',s:'down',a:'left',d:'right',arrowup:'up',arrowdown:'down',arrowleft:'left',arrowright:'right'};
 return codes[event.code||'']||keys[event.key.toLowerCase()]||null;
}
export function blocksMovement(target:{closest:(selector:string)=>unknown}|null){
 // Ordinary buttons must not swallow movement after clicking Start or closing a panel.
 return !!target?.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"],[role="dialog"]');
}
export function directionVector(keys:Set<Direction>){const x=Number(keys.has('right'))-Number(keys.has('left'));const y=Number(keys.has('up'))-Number(keys.has('down'));const length=Math.hypot(x,y)||1;return {x:x/length,y:y/length};}

export function panelToggle(panel:'place'|'status',open:boolean,mobile:boolean,current:{place:boolean;status:boolean}){return {...current,[panel]:open,...(mobile&&open?{[panel==='place'?'status':'place']:false}:{})};}
