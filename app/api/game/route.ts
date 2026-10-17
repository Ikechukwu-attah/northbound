import {player} from '@/lib/server/player';
import {getDb} from '@/db';
import {games} from '@/db/schema';
import {and,eq} from 'drizzle-orm';
import {applyCommand,newGame,migrateState,type Command,type GameState} from '@/lib/game/engine';
export const dynamic='force-dynamic';
function responder(cookie:string|null){return (body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store',...(cookie?{'Set-Cookie':cookie}:{})}});}
export async function GET(request:Request){const user=await player(request);const response=responder(user.cookie);const rows=await getDb().select().from(games).where(eq(games.userId,user.userId)).limit(1);const row=rows[0];return response({state:row?migrateState(JSON.parse(row.state)):null,revision:row?.revision??0});}
export async function POST(request:Request){
 const user=await player(request);const response=responder(user.cookie);
 const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return response({error:'Invalid request origin.'},403);
 const body=await request.text();if(body.length>4096)return response({error:'Request too large.'},413);
 try{const input=JSON.parse(body);if(!input||typeof input.command?.type!=='string')return response({error:'Choose an action.'},400);const c=input.command as Command;const db=getDb();const rows=await db.select().from(games).where(eq(games.userId,user.userId)).limit(1);const row=rows[0];
 if(!row){if(c.type!=='start')return response({error:'Create your character first.'},400);const state=newGame(c);const inserted=await db.insert(games).values({userId:user.userId,state:JSON.stringify(state),revision:1,updatedAt:new Date().toISOString()}).onConflictDoNothing().returning({revision:games.revision});if(!inserted.length)return response({error:'Your game already exists. Reload to continue.'},409);return response({state,revision:1,message:'Welcome to your Toronto life.'});}
 if(input.revision!==row.revision)return response({error:'Your progress changed in another tab. Your latest save has been restored.',state:migrateState(JSON.parse(row.state)),revision:row.revision},409);
 if(c.type==='start')return response({error:'Your character already exists. Continue your story.'},400);
 const result=applyCommand(JSON.parse(row.state) as GameState,c);const revision=row.revision+1;const updated=await db.update(games).set({state:JSON.stringify(result.state),revision,updatedAt:new Date().toISOString()}).where(and(eq(games.userId,user.userId),eq(games.revision,row.revision))).returning({revision:games.revision});if(!updated.length)return response({error:'Another tab saved first. Reload to continue.'},409);return response({...result,revision});
 }catch(e){return response({error:e instanceof Error?e.message:'Something went wrong. Please try again.'},400);}
}
