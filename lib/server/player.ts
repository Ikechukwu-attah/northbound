import {getChatGPTUser} from '@/app/chatgpt-auth';
import {guestIdentity} from '@/lib/game/guest';
export async function player(request:Request){const account=await getChatGPTUser();return account?{userId:account.userId,cookie:null}:guestIdentity(request.headers.get('cookie'));}
