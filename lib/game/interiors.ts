import type {GameState,Command} from './engine';
import {advanceLife,lifeAction,homePlace,requireNeeds} from './life';
import {entrance,placeById,distance,pointAlong,pathLength,type Point} from './world';
export type HomeTier='room'|'basement'|'apartment'|'two-bedroom';
export type FurnitureKind='bed'|'stove'|'sink'|'shower'|'toilet'|'sofa'|'desk'|'table'|'wardrobe'|'plant';
export type Furniture={id:string;kind:FurnitureKind;x:number;z:number;width:number;depth:number;use?:Point;label?:string;action?:string};
export type Wall={x:number;z:number;width:number;depth:number;side?:'north'|'south'|'east'|'west'};
export type HomeLayout={tier:HomeTier;width:number;depth:number;door:Point;objects:Furniture[];walls:Wall[];palette:{floor:string;wall:string;accent:string}};
export type InteriorState={place:string;tier:HomeTier;position:Point;movement?:{path:Point[];startedAt:number;seconds:number;object?:string;mode?:string};pose?:{object:string;action:string;until:number}};
export function homeTier(type:string):HomeTier{return type==='basement'?'basement':['two-bedroom','roommates','family'].includes(type)?'two-bedroom':type==='apartment'?'apartment':'room'}
const layouts=new Map<HomeTier,HomeLayout>();
export function homeLayout(tier:HomeTier):HomeLayout{
 const cached=layouts.get(tier);if(cached)return cached;
 const [width,depth]=tier==='room'?[12,12]:tier==='basement'?[15,12]:tier==='apartment'?[18,14]:[22,16],w=width/2,d=depth/2;
 const objects:Furniture[]=[
 {id:'bed',kind:'bed',x:-w+2,z:-d+3,width:2.4,depth:3.8,use:[-w+4,-d+3],label:'Sleep · 8 hours',action:'sleep'},
 {id:'stove',kind:'stove',x:-.8,z:-d+1,width:1.5,depth:1.4,use:[-.8,-d+2.6],label:'Cook breakfast · 30 min',action:'cook'},
 {id:'sink',kind:'sink',x:1,z:-d+1,width:1.5,depth:1.4},
 {id:'toilet',kind:'toilet',x:w-1.2,z:-d+1.1,width:.8,depth:1.2,use:[w-1.2,-d+2.4],label:'Use toilet · 5 min',action:'bathroom'},
 {id:'shower',kind:'shower',x:w-3.2,z:-d+1,width:1.35,depth:1.4,use:[w-3.2,-d+2.4],label:'Shower · 15 min',action:'shower'},
 {id:'sofa',kind:'sofa',x:-w+2.2,z:d-2.2,width:3,depth:1.3,use:[-w+2.2,d-3.7],label:'Relax · 1 hour',action:'relax'},
 {id:'desk',kind:'desk',x:w-1.6,z:d-2.2,width:2.2,depth:1.1,use:[w-1.6,d-3.5],label:'Use laptop',action:'resume'},
 {id:'plant',kind:'plant',x:w-1,z:.4,width:.8,depth:.8},
 {id:'wardrobe',kind:'wardrobe',x:-w+.8,z:.9,width:1,depth:1.8}
 ];
 if(tier!=='room')objects.push({id:'table',kind:'table',x:0,z:1,width:2.3,depth:1.6});
 if(tier==='two-bedroom')objects.push({id:'second-bed',kind:'bed',x:-w+6.9,z:-d+3,width:2.4,depth:3.8});
 const walls:Wall[]=[{x:0,z:-d,width,depth:.18,side:'north'},{x:-w,z:0,width:.18,depth,side:'west'},{x:w,z:0,width:.18,depth,side:'east'},{x:-(w+1)/2,z:d,width:w-1,depth:.18,side:'south'},{x:(w+1)/2,z:d,width:w-1,depth:.18,side:'south'},
 {x:w-4.4,z:-d+2,width:.15,depth:4},{x:w-3.6,z:-d+4,width:1.6,depth:.15},{x:w-.5,z:-d+4,width:1,depth:.15}];
 if(tier==='apartment'||tier==='two-bedroom'){const bedrooms=tier==='two-bedroom'?2:1;for(let n=0;n<bedrooms;n++){const left=-w+n*4.6,right=left+4.6;walls.push({x:right,z:-d+2.65,width:.15,depth:5.3},{x:(left+right-1.6)/2,z:-d+5.3,width:3,depth:.15});}}
 const layout:HomeLayout={tier,width,depth,door:[0,d-1],objects,walls,palette:{floor:tier==='basement'?'#b9ab91':tier==='room'?'#b89067':'#cba579',wall:tier==='basement'?'#c7d4c8':'#e8e0ce',accent:tier==='two-bedroom'?'#537b79':tier==='apartment'?'#a8644c':'#708264'}};
 layouts.set(tier,layout);return layout;
}
export function insideWalkable(p:Point,l:HomeLayout,r=.27){return p.every(Number.isFinite)&&Math.abs(p[0])<l.width/2-r&&Math.abs(p[1])<l.depth/2-r&&![...l.objects,...l.walls].some(o=>Math.abs(p[0]-o.x)<o.width/2+r&&Math.abs(p[1]-o.z)<o.depth/2+r)}
export function interiorSegment(a:Point,b:Point,l:HomeLayout){const n=Math.max(1,Math.ceil(distance(a,b)/.12));for(let i=0;i<=n;i++)if(!insideWalkable([a[0]+(b[0]-a[0])*i/n,a[1]+(b[1]-a[1])*i/n],l))return false;return true}
/** Small half-unit grid: walls and furniture share the same footprints as the renderer. */
export function interiorPath(from:Point,to:Point,l:HomeLayout):Point[]{
 if(!insideWalkable(to,l))throw new Error('Choose clear floor space, away from walls and furniture.');
 if(interiorSegment(from,to,l))return [from,to];
 const key=(p:Point)=>p.join(','),nodes:Point[]=[];
 for(let x=-l.width/2+.5;x<l.width/2;x+=.5)for(let z=-l.depth/2+.5;z<l.depth/2;z+=.5){const p:Point=[x,z];if(insideWalkable(p,l))nodes.push(p)}
 const start=nodes.filter(p=>distance(p,from)<1&&interiorSegment(from,p,l)).sort((a,b)=>distance(a,from)-distance(b,from))[0],end=nodes.filter(p=>distance(p,to)<1&&interiorSegment(p,to,l)).sort((a,b)=>distance(a,to)-distance(b,to))[0];
 if(!start||!end)throw new Error('No clear route to that spot.');
 const allowed=new Set(nodes.map(key)),parents=new Map<string,Point|null>([[key(start),null]]),queue=[start];
 for(let i=0;i<queue.length;i++){const p=queue[i];if(key(p)===key(end))break;for(const [dx,dz]of [[.5,0],[-.5,0],[0,.5],[0,-.5]]){const q:Point=[p[0]+dx,p[1]+dz],k=key(q);if(allowed.has(k)&&!parents.has(k)&&interiorSegment(p,q,l)){parents.set(k,p);queue.push(q)}}}
 if(!parents.has(key(end)))throw new Error('No clear route to that spot.');
 const path:Point[]=[to];let p:Point|null=end;while(p){path.unshift(p);p=parents.get(key(p))!}path.unshift(from);
 const simplified:Point[]=[from];let i=0;while(i<path.length-1){let next=i+1;while(next+1<path.length&&interiorSegment(path[i],path[next+1],l))next++;simplified.push(path[next]);i=next}return simplified;
}
export function interiorPosition(i:InteriorState,now=Date.now()):Point{return i.movement?pointAlong(i.movement.path,Math.min(1,Math.max(0,(now-i.movement.startedAt)/(i.movement.seconds*1000)))):i.position}
export function enterHome(s:GameState){if(s.journey||distance(s.position,entrance(placeById(homePlace(s))!))>3)throw new Error('Walk to your home door first.');delete s.life.restSeat;s.interior={place:homePlace(s),tier:homeTier(s.life.housing.type),position:homeLayout(homeTier(s.life.housing.type)).door};}
export function assertHomeObject(s:GameState,action:string){
 if(!s.interior||s.interior.place!==homePlace(s))throw new Error('Enter your home and use its furniture first.');
 if(s.interior.movement)throw new Error('Finish walking to the furniture first.');
 const o=homeLayout(s.interior.tier).objects.find(o=>o.action===action);if(!o?.use||distance(s.interior.position,o.use)>.65)throw new Error('Walk to the '+(o?.kind||'furniture')+' first.');
}
function executeObject(s:GameState,id:string,mode:string|undefined,now:number){
 if(id==='exit'){const door=homeLayout(s.interior!.tier).door;if(distance(s.interior!.position,door)>.65)throw new Error('Walk to the door first.');const p=placeById(s.interior!.place)!;s.position=entrance(p);s.location=p.id;s.district=p.district;delete s.interior;s.doorExitUntil=now+8000;return 'Back on the street at your home door.';}
 const i=s.interior!,o=homeLayout(i.tier).objects.find(o=>o.id===id);if(!o?.action)throw new Error('Choose an interactive object.');
 assertHomeObject(s,o.action);
 if(o.kind==='desk'&&mode==='approach')return 'At your laptop. Choose a résumé or job action.';
 const command:Command=o.kind==='desk'?mode?.startsWith('apply:')?{type:'apply',id:mode.slice(6)}:{type:'resume',id:mode?.startsWith('tailor:')?mode.slice(7):undefined}:{type:'home',id:o.action};
 requireNeeds(s,command);const message=lifeAction(s,command)!;i.pose={object:o.id,action:o.action,until:now+5000};return message;
}
export function interiorCommand(s:GameState,c:Command,now:number):string|null{
 const i=s.interior;
 if(c.type==='enter_home'){if(i)return 'You are already inside.';enterHome(s);return 'Welcome home. Tap furniture to walk over and use it.';}
 if(!i){if(c.type.startsWith('interior_')||c.type==='exit_home')throw new Error('Enter your home first.');return null}
 if(i.place!==homePlace(s)){delete s.interior;return 'Your housing changed. You are back outside.';}
 if(c.type==='interior_arrive'){
  const m=i.movement;if(!m)throw new Error('There is no indoor walk to finish.');if(now<m.startedAt+m.seconds*1000)throw new Error('You are still walking to the object.');
  i.position=m.path[m.path.length-1];delete i.movement;advanceLife(s,Math.max(1,Math.ceil(pathLength(m.path)/10)));
  if(m.object){try{return executeObject(s,m.object,m.mode,now)}catch(e){return 'Arrived. '+(e instanceof Error?e.message:'Try this object again.')}}return 'Walk complete.';
 }
 if(c.type==='interior_cancel'){if(!i.movement)return 'Already standing still.';const travelled=pathLength(i.movement.path)*Math.min(1,Math.max(0,(now-i.movement.startedAt)/(i.movement.seconds*1000)));i.position=interiorPosition(i,now);delete i.movement;if(travelled>.05)advanceLife(s,Math.max(1,Math.ceil(travelled/10)));return 'Stopped inside.';}
 if(['interior_walk','interior_use','exit_home','home','bathroom','rest'].includes(c.type)){
  if(i.movement)throw new Error('Finish walking or stop before choosing another object.');
  const l=homeLayout(i.tier),id=c.type==='exit_home'?'exit':c.type==='home'?l.objects.find(o=>o.action===c.id)?.id:c.type==='bathroom'?'toilet':c.type==='rest'?'sofa':c.type==='interior_use'?c.id:undefined;
  const target=id==='exit'?l.door:id?l.objects.find(o=>o.id===id)?.use:c.point;if(!target)throw new Error('Choose an object or clear floor space.');
  delete i.pose;
  if(id&&distance(i.position,target)<.15)return executeObject(s,id,c.mode,now);
  const path=interiorPath(i.position,target,l);i.movement={path,startedAt:now,seconds:Math.max(.2,pathLength(path)/(s.needs.energy<20?1.4:2.8)),object:id,mode:c.mode};return id==='exit'?'Walking to the exit.':id?'Walking to the '+l.objects.find(o=>o.id===id)?.kind+'.':'Walking inside.';
 }
 if(i.movement&&!['appearance'].includes(c.type))throw new Error('Finish walking inside first.');
 if(!['resume','apply','job','accept_job','appearance','wait','event','family_help'].includes(c.type))throw new Error('Exit your home before doing that outside.');
 if(['resume','apply','job'].includes(c.type))assertHomeObject(s,'resume');
 return null;
}
