const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const dest=path.resolve(__dirname,'../work/bank-test');fs.mkdirSync(dest,{recursive:true});fs.writeFileSync(dest+'/package.json','{"type":"commonjs"}');
for(const f of fs.readdirSync(path.resolve(__dirname,'../lib/game')).filter(f=>f.endsWith('.ts')))fs.writeFileSync(dest+'/'+f.replace('.ts','.js'),ts.transpileModule(fs.readFileSync(path.resolve(__dirname,'../lib/game',f),'utf8'),{compilerOptions:{esModuleInterop:true,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText);
const e=require(dest+'/engine.js'),life=require(dest+'/life.js'),w=require(dest+'/world.js'),E=require(dest+'/life.js').ECONOMY;
let now=100000;
const at=(path='local')=>{let s=e.migrateState(e.newGame({name:'Banker',path}));s.position=w.entrance(w.placeById('bank'));s.location='bank';s.journey=null;return s;};
const act=(s,cmd)=>e.applyCommand(s,cmd,now,.5).state;
const bank=(s,id,amount,mode)=>act(s,{type:'bank',id,amount,mode});
const refill=s=>{for(const k of Object.keys(s.needs))s.needs[k]=90;return s;};

test('deposit/withdraw move money between chequing and savings',()=>{
 let s=at();const cash=s.cash;
 s=bank(s,'deposit',50000);assert.equal(s.cash,cash-50000);assert.equal(s.life.bank.savings,50000);
 s=bank(s,'withdraw',20000);assert.equal(s.cash,cash-30000);assert.equal(s.life.bank.savings,30000);
 assert.throws(()=>bank(s,'withdraw',999999),/Not enough in savings/);
});

test('item 1 — chequing account needs ID only (no SIN); a debit card is issued',()=>{
 let s=at('newcomer');s.life.documents=[];// no SIN, no bank yet, at the branch
 s=act(s,{type:'document',id:'bank'});
 assert.ok(s.life.documents.includes('bank'));assert.equal(s.life.bank.debit,true);
 // credit card still needs the account first
 assert.throws(()=>act(at('newcomer'),{type:'document',id:'credit'}),/Open a bank account first/);
});

test('item 2 — no credit history cannot take a loan/line; newcomer loan only with a job',()=>{
 let s=at('newcomer');s.life.documents=['bank'];s.job='';assert.equal(s.life.credit,null);
 assert.throws(()=>bank(s,'loan_take',100000),/No Canadian credit history/);
 assert.throws(()=>bank(s,'line_open'),/Canadian credit history/);
 // with a job, a small newcomer loan is allowed up to the cap
 s.job='barista';s=bank(s,'loan_take',200000);assert.equal(s.life.bank.loan,200000);
 assert.throws(()=>bank(at2(),'loan_take',E.bank.newcomerLoanMax+100000),/newcomer loan is capped/);
 function at2(){let x=at('newcomer');x.life.documents=['bank'];x.job='barista';return x;}
});

test('item 7 + ATM — wallet cash splits from chequing; own ATM free, other charges a fee',()=>{
 let s=at();const cash=s.cash;
 s=bank(s,'atm_withdraw',40000);assert.equal(s.cash,cash-40000);assert.equal(s.wallet,40000);// own ATM, no fee
 s=bank(s,'atm_withdraw',10000,'other');assert.equal(s.wallet,50000);assert.equal(s.cash,cash-40000-10000-E.bank.atmOtherFee);// other ATM fee
 s=bank(s,'atm_deposit',15000);assert.equal(s.wallet,35000);assert.equal(s.cash,cash-40000-10000-E.bank.atmOtherFee+15000);
 assert.throws(()=>bank(s,'atm_deposit',999999),/only have/);
});

test('item 4 — Interac e-Transfer sends from chequing with a limit',()=>{
 let s=at();const cash=s.cash;
 s=bank(s,'etransfer',30000,'roommate');assert.equal(s.cash,cash-30000);
 assert.ok(s.life.bank.history.some(h=>/e-Transfer/.test(h.text)));
 assert.throws(()=>bank(s,'etransfer',E.bank.etransferLimit+100000,'contact'),/limited to/);
});

test('item 4 — monthly chequing fee charged below the waiver, waived above it',()=>{
 let low=at();low.cash=100000;life.advanceLife(low,31*24*60);
 assert.ok(low.life.bank.history.some(h=>/account fee/.test(h.text)),'fee charged on a low balance');
 let high=at();high.cash=900000;life.advanceLife(high,31*24*60);
 assert.ok(!high.life.bank.history.some(h=>/account fee/.test(h.text)),'fee waived on a high balance');
});

test('item 3 — loan has a monthly minimum payment; a miss adds a fee, drops credit, and 90 days → collections',()=>{
 // enough chequing: minimum payment auto-taken monthly
 let s=at();s.cash=2000000;s=bank(s,'loan_take',500000);const before=s.life.bank.loan;
 life.advanceLife(s,31*24*60);
 assert.ok(s.life.bank.history.some(h=>/minimum payment/.test(h.text)),'minimum payment taken');
 assert.ok(s.life.bank.loan<before,'balance reduced net of interest');
 // no chequing: payment missed → fee + credit drop + overdue clock
 let m=at();m.cash=2000000;m=bank(m,'loan_take',500000);m.cash=0;const cr=m.life.credit;
 life.advanceLife(m,31*24*60);
 assert.ok(m.life.bank.history.some(h=>/Missed/.test(h.text)),'payment missed');
 assert.ok(m.life.credit<cr,'credit dropped');assert.ok(m.life.bank.overdueSince>0,'overdue clock started');
 // stay broke ~100 days → collections
 m.cash=0;life.advanceLife(m,100*24*60);
 assert.equal(m.life.bank.collections,true);
});

test('walk-in bank interior: enter, bank from inside, exit; far entry rejected',()=>{
 let s=refill(at());s=act(s,{type:'enter_bank',id:'bank'});assert.equal(s.interior&&s.interior.kind,'bank');
 s=bank(s,'deposit',10000);assert.equal(s.life.bank.savings,10000);
 s=act(s,{type:'exit_home'});assert.equal(s.interior,undefined);assert.equal(s.location,'bank');
 let far=e.migrateState(e.newGame({name:'Y',path:'local'}));far.location='';
 assert.throws(()=>e.applyCommand(far,{type:'enter_bank',id:'bank'},now,.5),/Walk to the bank door/);
});

test('legacy saves migrate to a complete bank with wallet and plan defaults',()=>{
 const legacy=e.migrateState(e.newGame({name:'Old',path:'local'}));delete legacy.life.bank;delete legacy.wallet;
 const m=e.migrateState(legacy);
 assert.equal(m.wallet,0);assert.equal(m.life.bank.plan,'basic');assert.equal(m.life.bank.debit,true);
 assert.ok(Array.isArray(m.life.bank.history)&&Array.isArray(m.life.bank.gics));
});
