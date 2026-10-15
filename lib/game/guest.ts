// Anonymous save identifiers are separate from platform account identities.
// Only a hash is stored in D1; the random browser secret stays in an HttpOnly cookie.
export const GUEST_COOKIE='northbound-guest';
export async function guestIdentity(cookieHeader:string|null){
 const raw=(cookieHeader||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(GUEST_COOKIE+'='))?.slice(GUEST_COOKIE.length+1);
 const token=raw&&/^[a-f0-9]{64}$/.test(raw)?raw:Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));
 const hash=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
 return {userId:'guest:'+hash,cookie:`${GUEST_COOKIE}=${token}; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax`};
}
