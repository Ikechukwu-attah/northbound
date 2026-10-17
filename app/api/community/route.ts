import {env} from 'cloudflare:workers';
import {player} from '@/lib/server/player';
import {SharedCity,SocialError} from '@/lib/server/multiplayer';
export const dynamic='force-dynamic';
export async function POST(request:Request){
 const user=await player(request);const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store',...(user.cookie?{'Set-Cookie':user.cookie}:{})}});
 const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return reply({error:'Invalid request origin.'},403);
 if(request.headers.get('sec-fetch-site')==='cross-site')return reply({error:'Invalid request origin.'},403);
 const body=await request.text();if(body.length>4096)return reply({error:'Request too large.'},413);
 try{const input=JSON.parse(body);if(!input||typeof input.type!=='string')return reply({error:'Choose an action.'},400);return reply(await new SharedCity(env.DB!).action(user.userId,input));}
 catch(e){if(e instanceof SocialError)return reply({error:e.message},e.status);if(e instanceof SyntaxError)return reply({error:'Invalid request.'},400);console.error('Shared city request failed',e instanceof Error?e.message:'unknown');return reply({error:'Shared city is temporarily unavailable. Your saved life is safe.'},503);}
}
