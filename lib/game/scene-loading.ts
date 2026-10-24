/** Shared client-scene downloads: deduplicate preloading, but never cache a failure. */
export class SceneLoadTimeout extends Error {
 constructor(){super('The scene download took too long.');this.name='SceneLoadTimeout';}
}
export function createSceneLoader<T>(load:()=>Promise<T>,timeoutMs=15000){
 let pending:Promise<T>|undefined;
 const loader=()=>{
  if(pending)return pending;
  const attempt=new Promise<T>((resolve,reject)=>{
   const timer=setTimeout(()=>reject(new SceneLoadTimeout()),timeoutMs);
   Promise.resolve().then(load).then(value=>{clearTimeout(timer);resolve(value)},error=>{clearTimeout(timer);reject(error)});
  });
  pending=attempt;
  void attempt.catch(()=>{if(pending===attempt)pending=undefined;});
  return attempt;
 };
 loader.preload=()=>{void loader().catch(()=>{/* A later entry can retry; background work must not reload the game. */});};
 return loader;
}
export function isStaleScene(error:unknown){
 const message=error instanceof Error?error.name+' '+error.message:String(error);
 return /ChunkLoadError|Loading chunk|dynamically imported module|importing a module script failed|Failed to fetch dynamically|Unable to preload CSS/i.test(message);
}
type StorageLike=Pick<Storage,'getItem'|'setItem'>;
/** One refresh for obsolete asset URLs, with a cross-reload guard against reload loops. */
export function claimSceneRefresh(error:unknown,storage:StorageLike,now=Date.now()){
 if(!isStaleScene(error))return false;
 try{
  const key='northbound.scene-refresh',previous=Number(storage.getItem(key));
  if(previous>0&&now-previous<120000)return false;
  storage.setItem(key,String(now));return true;
 }catch{return false;}
}
