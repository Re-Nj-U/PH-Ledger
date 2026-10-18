import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { validateOtherDescription } from '../lib/record-rules.ts';
import { tripEntries } from '../lib/trip-entry.ts';
import manifest from '../app/manifest.ts';

test('other costs require a useful description without preventing unchanged legacy records from being saved', () => {
 const old={id:'old',kind:'expense',category:'other',description:'Other business expense'};
 assert.throws(()=>validateOtherDescription(old),/Describe/);
 assert.throws(()=>validateOtherDescription({...old,description:'   '}),/Describe/);
 assert.doesNotThrow(()=>validateOtherDescription(old,old));
 assert.doesNotThrow(()=>validateOtherDescription({...old,description:'Parking supplies'}));
 const trip={id:'t',kind:'trip',name:'Trip',vehicleId:'v',start:'2026-01-01',end:'2026-01-01',status:'upcoming',odoStart:0,odoEnd:null,amount:100000};
 assert.throws(()=>tripEntries(trip,{tripExpenses:[{category:'tripOther',amount:100,date:'2026-01-01',paid:true}]},()=> 'e'),/Describe/);
 const entries=tripEntries(trip,{tripExpenses:[{category:'tripOther',description:'Parking',amount:100,date:'2026-01-01',paid:true}]},()=> 'e');assert.equal(entries[1].description,'Parking');
});
test('home screen manifest resolves real correctly sized icons and launches inside the app scope', () => {
 const m=manifest();assert.equal(m.display,'standalone');assert.equal(m.scope,'/');assert.equal(m.start_url,'/');
 for(const icon of m.icons){ const file=new URL('../public'+icon.src,import.meta.url);assert.ok(existsSync(file));const bytes=readFileSync(file);assert.equal(bytes.toString('hex',0,8),'89504e470d0a1a0a');const expected=Number(icon.sizes.split('x')[0]);assert.equal(bytes.readUInt32BE(16),expected);assert.equal(bytes.readUInt32BE(20),expected); }
 assert.equal(m.icons.some(i=>i.sizes==='192x192'),true);assert.equal(m.icons.some(i=>i.sizes==='512x512'),true);assert.equal(m.icons.some(i=>i.purpose==='maskable'),true);
});

import { tripStatusLabel, tripTotals, monthly } from '../lib/ledger.ts';
import { validateTripSettlement } from '../lib/record-rules.ts';
import { monthlyReport } from '../lib/report.ts';
import { reportWorkbook } from '../lib/report-xlsx.ts';
const s={name:'PIKU',startDate:'2026-01-01',openingCash:0,reserve:0};
const t={id:'t',kind:'trip',name:'Trip',vehicleId:'v',start:'2026-01-31',end:'2026-02-01',status:'completed',odoStart:0,odoEnd:100,amount:1000000};
const advance={id:'a',kind:'payment',tripId:'t',type:'receipt',method:'Cash',amount:200000,date:'2026-01-31'};

test('completed fully paid saves the exact remaining receipt once and keeps earned income in the journey end month',()=>{
 let n=0;const form={completionOutcome:'paid',newPaymentDate:'2026-03-01',newPaymentMethod:'UPI',newPaymentAmount:99999};
 const batch=tripEntries(t,form,()=>`p-${++n}`,[advance]);assert.equal(batch.length,2);assert.equal(batch[1].amount,800000);assert.equal(batch[1].date,'2026-03-01');
 assert.doesNotThrow(()=>validateTripSettlement(t.id,batch,[advance]));const rs=[advance,...batch];
 assert.equal(tripStatusLabel(rs,t,'2026-02-28'),'Trip ended — payment pending');assert.equal(tripStatusLabel(rs,t,'2026-03-31'),'Completed — fully paid');
 assert.equal(monthly(rs,s,'2026-02').income,1000000);assert.equal(monthly(rs,s,'2026-02').receipts,0);assert.equal(monthly(rs,s,'2026-03').income,0);assert.equal(monthly(rs,s,'2026-03').receipts,800000);
 const repeat=tripEntries(t,form,()=>`p-${++n}`,rs);assert.equal(repeat.length,1);assert.doesNotThrow(()=>validateTripSettlement(t.id,repeat,rs));
 const report=monthlyReport(rs,s,'2026-02');assert.match(report.income[0].detail,/payment pending/);assert.equal(report.customers[0].amount,800000);
 const excel=reportWorkbook(report,'PIKU','2026-02',0);assert.ok(excel.rows.some(row=>row.cells.some(c=>typeof c.value==='string'&&c.value.includes('payment pending'))));
});
test('payment pending never invents receipts; old completed balances remain correct across report and export',()=>{
 const batch=tripEntries(t,{completionOutcome:'pending'},()=> 'none',[advance]);assert.equal(batch.length,1);const rs=[advance,...batch];assert.equal(tripTotals(rs,t).balance,800000);assert.equal(tripStatusLabel(rs,t),'Trip ended — payment pending');assert.equal(monthly(rs,s,'2026-02').income,1000000);assert.equal(monthlyReport(rs,s,'2026-02').cashIn,0);
});
test('settlement rejects stale balances and altered existing receipts instead of collecting twice',()=>{
 const batch=tripEntries(t,{completionOutcome:'paid',newPaymentDate:'2026-02-01',newPaymentMethod:'Cash'},()=> 'new',[advance]);
 assert.throws(()=>validateTripSettlement(t.id,batch,[advance,{...advance,id:'concurrent',amount:100000}]),/balance changed/);
 assert.throws(()=>validateTripSettlement(t.id,[t,{...advance,amount:800000}],[advance]),/balance changed/);
 assert.throws(()=>validateTripSettlement(t.id,[{...t,status:'upcoming'}],[]),/Finish/);
});
