const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const dest=path.resolve(__dirname,'../work/scene-loading-test');fs.mkdirSync(dest,{recursive:true});fs.writeFileSync(dest+'/package.json','{"type":"commonjs"}');
function compile(file,name){const source=fs.readFileSync(path.resolve(__dirname,'..',file),'utf8').replace("@/lib/game/scene-loading","./scene-loading");fs.writeFileSync(dest+'/'+name,ts.transpileModule(source,{compilerOptions:{esModuleInterop:true,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText);}
compile('lib/game/scene-loading.ts','scene-loading.js');compile('components/game/SceneLoading.tsx','SceneLoading.js');
const {createSceneLoader,SceneLoadTimeout,isStaleScene,claimSceneRefresh}=require(dest+'/scene-loading.js');
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),SceneLoading=require(dest+'/SceneLoading.js').default;
const tick=()=>new Promise(setImmediate);
test('home/transit loading UI distinguishes a real pending import from a caught failure',()=>{
 for(const label of ['interior','transit']){
  const render=error=>renderToStaticMarkup(React.createElement(SceneLoading,{label,error,retry(){}}));
  assert.match(render(null),new RegExp('Opening '+label));
  for(const error of [new Error('Failed to fetch dynamically imported module: /old-hash.js'),new SceneLoadTimeout(),new Error('Scene render failed')]){
   const html=render(error);assert.doesNotMatch(html,/Opening /);assert.match(html,/Try again/);assert.match(html,/Refresh game/);assert.match(html,/Your progress is saved/);assert.match(html,/role="alert"/);
  }
 }
});
test('preloading and entry share one download and cache a successful scene',async()=>{
 let count=0,resolve;const scene={default:()=>null},loader=createSceneLoader(()=>{count++;return new Promise(r=>resolve=r)});
 loader.preload();const pending=loader();await tick();assert.equal(count,1);resolve(scene);assert.equal(await pending,scene);assert.equal(await loader(),scene);assert.equal(count,1);
});
test('failed background downloads do not poison a later home or station entry',async()=>{
 let count=0;const scene={default:()=>null},loader=createSceneLoader(async()=>{if(++count===1)throw new Error('Network offline');return scene});
 loader.preload();await tick();assert.equal(await loader(),scene);assert.equal(count,2);
});
test('a stalled download times out; retry can succeed while the obsolete attempt is still pending',async()=>{
 let count=0,oldResolve;const good={default:()=>null},old={default:()=>null};
 const loader=createSceneLoader(()=>++count===1?new Promise(r=>oldResolve=r):Promise.resolve(good),15);
 await assert.rejects(loader(),SceneLoadTimeout);assert.equal(await loader(),good);oldResolve(old);await tick();assert.equal(await loader(),good);assert.equal(count,2);
});
test('a synchronous loader error also remains retryable',async()=>{
 let count=0;const loader=createSceneLoader(()=>{if(++count===1)throw Error('Broken download');return Promise.resolve('ready')});
 await assert.rejects(loader(),/Broken download/);assert.equal(await loader(),'ready');
});
test('stale assets get one guarded refresh; timeouts and runtime errors never create a refresh loop',()=>{
 const map=new Map(),storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)},stale=new Error('Failed to fetch dynamically imported module: /old.js');
 assert.equal(isStaleScene(stale),true);assert.equal(claimSceneRefresh(stale,storage,10000),true);assert.equal(claimSceneRefresh(stale,storage,10001),false);assert.equal(claimSceneRefresh(stale,storage,20000),false);
 assert.equal(claimSceneRefresh(new SceneLoadTimeout(),storage,200000),false);assert.equal(claimSceneRefresh(new Error('Error creating WebGL context'),storage,200000),false);
 assert.equal(claimSceneRefresh(stale,{getItem(){throw Error('Storage blocked')},setItem(){}},200000),false);
 assert.equal(claimSceneRefresh(stale,storage,200000),true);
});
