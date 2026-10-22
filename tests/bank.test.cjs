const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const dest=path.resolve(__dirname,'../work/bank-test');fs.mkdirSync(dest,{recursive:true});fs.writeFileSync(dest+'/package.json','{"type":"commonjs"}');
for(const f of fs.readdirSync(path.resolve(__dirname,'../lib/game')).filter(f=>f.endsWith('.ts')))fs.writeFileSync(dest+'/'+f.replace('.ts','.js'),ts.transpileModule(fs.readFileSync(path.resolve(__dirname,'../lib/game',f),'utf8'),{compilerOptions:{esModuleInterop:true,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText);
const e=require(dest+'/engine.js'),life=require(dest+'/life.js'),w=require(dest+'/world.js'),E=require(dest+'/life.js').ECONOMY;
let now=100000;
const atBank=()=>{let s=e.newGame({name:'Banker',path:'local'});s=e.migrateState(s);const bank=w.placeById('bank');s.position=w.entrance(bank);s.location='bank';s.journey=null;return s;};
const act=(s,cmd)=>e.applyCommand(s,cmd,now,.5).state;
const bank=(s,id,amount,mode)=>act(s,{type:'bank',id,amount,mode});

test('deposit and withdraw move money between chequing and savings',()=>{
 let s=atBank();const cash=s.cash;
 s=bank(s,'deposit',50000);assert.equal(s.cash,cash-50000);assert.equal(s.life.bank.savings,50000);
 s=bank(s,'withdraw',20000);assert.equal(s.cash,cash-30000);assert.equal(s.life.bank.savings,30000);
 assert.throws(()=>bank(s,'withdraw',999999),/Not enough in savings/);
 assert.throws(()=>bank(s,'deposit',s.cash+1),/Not enough in chequing/);
});

test('savings earns monthly interest; a GIC locks a term and pays out at maturity',()=>{
 let s=atBank();s=bank(s,'deposit',100000);
 const before=s.life.bank.savings;life.advanceLife(s,31*24*60);// cross a month boundary
 assert.ok(s.life.bank.savings>before,'savings grew with interest');
 let s2=atBank();const cash=s2.cash;s2=bank(s2,'gic_open',60000,'12');
 assert.equal(s2.cash,cash-60000);assert.equal(s2.life.bank.gics.length,1);assert.equal(s2.life.bank.savings,0);
 life.advanceLife(s2,370*24*60);// past 12-month maturity
 assert.equal(s2.life.bank.gics.length,0,'GIC matured and cleared');
 assert.ok(s2.life.bank.savings>=60000+Math.round(60000*0.036)-1,'matured principal + return in savings');
 assert.throws(()=>bank(atBank(),'gic_open',1000,'12'),/GICs start at/);
});

test('personal loan advances cash, accrues monthly interest and can be repaid',()=>{
 let s=atBank();const cash=s.cash;
 s=bank(s,'loan_take',500000);assert.equal(s.cash,cash+500000);assert.equal(s.life.bank.loan,500000);
 // interest accrues monthly (read-only probe; a month jump drains needs and moves off branch hours)
 const probe=atBank();probe.life.bank.loan=500000;life.advanceLife(probe,31*24*60);assert.ok(probe.life.bank.loan>500000,'loan accrued interest');
 // repay during the same open branch visit
 s=bank(s,'loan_pay',200000);assert.equal(s.life.bank.loan,300000);
 assert.throws(()=>bank(atBank(),'loan_take',999999999),/exceeds your/);
});

test('line of credit opens once with a credit gate, then draws and repays',()=>{
 let s=atBank();
 s=bank(s,'line_open');assert.equal(s.life.bank.lineLimit,E.bank.lineLimit);
 assert.throws(()=>bank(s,'line_open'),/already have a line/);
 const cash=s.cash;s=bank(s,'line_draw',100000);assert.equal(s.cash,cash+100000);assert.equal(s.life.bank.line,100000);
 assert.throws(()=>bank(s,'line_draw',E.bank.lineLimit),/exceeds your available credit/);
 s=bank(s,'line_pay',40000);assert.equal(s.life.bank.line,60000);
 // credit gate
 let poor=atBank();poor.life.credit=500;assert.throws(()=>bank(poor,'line_open'),/credit score/);
});

test('banking requires a bank account and being at the branch',()=>{
 let s=atBank();s.life.documents=s.life.documents.filter(d=>d!=='bank');
 assert.throws(()=>bank(s,'deposit',1000),/Open a bank account first/);
 let away=e.migrateState(e.newGame({name:'X',path:'local'}));away.location='';
 assert.throws(()=>e.applyCommand(away,{type:'bank',id:'deposit',amount:1000},now,.5),/Walk to/);
});

test('legacy saves without a bank object are migrated to an empty bank',()=>{
 const legacy=e.migrateState(e.newGame({name:'Old',path:'local'}));delete legacy.life.bank;
 const migrated=e.migrateState(legacy);
 assert.ok(migrated.life.bank&&migrated.life.bank.savings===0&&Array.isArray(migrated.life.bank.gics));
});
