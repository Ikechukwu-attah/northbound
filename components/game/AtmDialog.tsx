'use client';
import {useState} from 'react';
import type {GameState,Command} from '@/lib/game/engine';
import {ECONOMY as E} from '@/lib/game/life';
import {money} from '@/lib/game/data';
/** An out-of-network ATM at a station or store: cash only, sends origin:'atm' + mode:'other' so a fee applies. */
export default function AtmDialog({game:s,busy,send}:{game:GameState;busy:boolean;send:(c:Command)=>Promise<boolean>}){
 const [amtStr,setAmtStr]=useState('');const amt=Math.max(0,Math.round((parseFloat(amtStr)||0)*100)),acting=busy||!!s.journey,hasAccount=s.life.documents.includes('bank');
 const atm=(id:string)=>void send({type:'bank',id,amount:amt,mode:'other',origin:'atm'});
 return <div className="life-panel">
  <p className="modal-intro">Out-of-network ATM — a {money(E.bank.atmOtherFee)} fee applies to withdrawals. Your own branch ATM is free.</p>
  {!hasAccount&&<div className="life-warning">Open a chequing account at a branch first.</div>}
  <div className="life-metrics"><span>Chequing<small>{money(s.cash)}</small></span><span>Cash (wallet)<small>{money(s.wallet||0)}</small></span></div>
  <label className="bank-amount">Amount (CAD)<input type="number" min="0" step="20" inputMode="decimal" value={amtStr} onChange={e=>setAmtStr(e.target.value)} placeholder="0.00"/></label>
  <div className="bank-actions"><button className="secondary" disabled={acting||!hasAccount||amt<=0} onClick={()=>atm('atm_withdraw')}>Withdraw cash · {money(E.bank.atmOtherFee)} fee</button><button className="secondary" disabled={acting||!hasAccount||amt<=0} onClick={()=>atm('atm_deposit')}>Deposit cash</button></div>
 </div>;
}
