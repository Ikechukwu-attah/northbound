'use client';
import {useState} from 'react';
import type {GameState,Command} from '@/lib/game/engine';
import {ECONOMY as E} from '@/lib/game/life';
import {money} from '@/lib/game/data';
/** Phone banking app: routine self-service from anywhere (no branch visit). Sends origin:'phone',
 * so the engine allows transfers, e-Transfer, bill pay and plan changes — but not loans/GICs/cash. */
export default function PhoneBank({game:s,busy,send}:{game:GameState;busy:boolean;send:(c:Command)=>Promise<boolean>}){
 const [amtStr,setAmtStr]=useState('');const l=s.life,b=l.bank,amt=Math.max(0,Math.round((parseFloat(amtStr)||0)*100)),acting=busy||!!s.journey,hasAccount=l.documents.includes('bank');
 const B=(text:string,id:string,mode?:string,disabled=false)=><button key={id+(mode||'')+text} className="secondary" disabled={acting||!hasAccount||disabled} onClick={()=>void send({type:'bank',id,amount:amt,mode,origin:'phone'})}>{text}</button>;
 return <div className="life-panel phone-app">
  <p className="modal-intro">Bank from anywhere. Transfers, Interac e-Transfer, bills and your plan — no branch visit.</p>
  {!hasAccount&&<div className="life-warning">Open a chequing account at a branch first (photo ID only).</div>}
  <div className="life-metrics"><span>Chequing<small>{money(s.cash)}{b.debit?' · debit ✓':''}</small></span><span>Cash<small>{money(s.wallet||0)}</small></span><span>Savings<small>{money(b.savings)}</small></span></div>
  <label className="bank-amount">Amount (CAD)<input type="number" min="0" step="10" inputMode="decimal" value={amtStr} onChange={e=>setAmtStr(e.target.value)} placeholder="0.00"/></label>
  <h4>Transfers</h4><div className="bank-actions">{B('Move to savings','deposit',undefined,amt<=0)}{B('Move to chequing','withdraw',undefined,amt<=0)}</div>
  <h4>Interac e-Transfer</h4><div className="bank-actions">{B('Send rent','etransfer','rent',amt<=0)}{B('Pay roommate','etransfer','roommate',amt<=0)}{B('Send a contact','etransfer','contact',amt<=0)}</div>
  <h4>Pay a bill</h4><div className="bank-actions">{B('Pay bills from chequing','bill_pay',undefined,amt<=0)}</div>
  <h4>Chequing plan</h4><div className="bank-actions">{(['basic','plus','premium'] as const).map(p=>B((p===b.plan?'✓ ':'')+p+' · '+money(E.bank.plans[p].fee)+'/mo','plan',p,p===b.plan))}</div>
  <h4>Recent activity</h4>{!b.history?.length&&<p className="fine-print">Deposits, transfers and fees appear here.</p>}{(b.history||[]).slice(0,8).map((h,i)=><div className="ledger-line" key={i}><small>{h.date}</small><span>{h.text}</span><b>{money(h.amount)}</b></div>)}
  <p className="fine-print">Loans, lines of credit and GICs need a branch advisor (take a number); cash needs an ATM.</p>
 </div>;
}
