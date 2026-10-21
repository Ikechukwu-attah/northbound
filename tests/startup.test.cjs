const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const {spawnSync}=require('node:child_process');
const dest=path.resolve(__dirname,'../work/startup-test');
fs.mkdirSync(dest,{recursive:true});fs.writeFileSync(dest+'/package.json','{"type":"commonjs"}');
for(const f of fs.readdirSync(path.resolve(__dirname,'../lib/game')).filter(f=>f.endsWith('.ts')))fs.writeFileSync(dest+'/'+f.replace('.ts','.js'),ts.transpileModule(fs.readFileSync(path.resolve(__dirname,'../lib/game',f),'utf8'),{compilerOptions:{esModuleInterop:true,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText);

test('game modules initialize from every entry order and preserve surface shelter collisions',()=>{
 for(const entry of ['transit','world','navigation','engine','calendar','transit-interiors']){
  // Each fresh process has an empty module cache, as a production worker does.
  const result=spawnSync(process.execPath,['-e',`
   const assert=require('node:assert/strict');
   require('./${entry}.js');
   const {STOPS,LINES}=require('./transit.js'),{staticObstacles}=require('./navigation.js');
   assert.ok(STOPS.length>70);assert.ok(LINES.length>3);
   for(const id of ['stc','nyc']){
    const s=STOPS.find(s=>s.id===id);
    const shelter=staticObstacles(s.point).some(o=>o.x===s.point[0]+3.1&&o.z===s.point[1]-1.5&&o.halfX===1.1);
    assert.equal(shelter,id==='stc');
   }
  `],{cwd:dest,encoding:'utf8'});
  assert.equal(result.status,0,entry+': '+result.stderr);
 }
});
