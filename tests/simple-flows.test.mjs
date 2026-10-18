import test from 'node:test';
import assert from 'node:assert/strict';
import { monthly, commitments, loanSchedule, businessExpenses, tripTotals, tripCategories } from '../lib/ledger.ts';
import { monthlyReport } from '../lib/report.ts';
import { tripEntries } from '../lib/trip-entry.ts';
import { entrySchema } from '../lib/validation.ts';
import { validateBackup } from '../lib/import-backup.ts';
import { reportWorkbook } from '../lib/report-xlsx.ts';
const settings = { name: 'PIKU', startDate: '2026-01-01', openingCash: 1000000, reserve: 0 };
const vehicle = { id: 'v', kind: 'vehicle', name: 'Van', registration: 'KL01' };
const loan = { id: 'l', kind: 'loan', name: 'Tyres', vehicleId: 'v', planType: 'purchase', start: '2026-01-01', firstDue: '2026-01-31', emi: 300000, total: 3, openingPaid: 0, downPayment: 100000, downPaymentDate: '2026-01-01' };
const payment = (id, installment, date, amount) => ({ id, kind: 'expense', description: 'EMI', category: 'emi', loanId: 'l', installment, amount, date, paymentDate: date, paid: true });

test('EMI purchase is deducted each due month, down payment once, and stops after the schedule', () => {
 const rs = [vehicle, loan];
 assert.equal(loanSchedule(rs).length, 3);
 for (const month of ['2026-01','2026-02','2026-03']) {
  const m = monthly(rs, settings, month), report = monthlyReport(rs, settings, month);
  assert.equal(m.emi, 300000); assert.equal(report.emis.reduce((s,e)=>s+e.amount,0), m.emi);
  assert.equal(m.businessExpense, month === '2026-01' ? 100000 : 0);
  assert.equal(m.cash, 900000); assert.equal(m.result, month === '2026-01' ? -400000 : -300000);
 }
 const apr = monthly(rs, settings, '2026-04'); assert.equal(apr.emi,0); assert.equal(apr.businessExpense,0); assert.equal(apr.committed,900000);
 assert.equal(businessExpenses(rs).filter(e=>e.source==='downPayment').length,1);
 assert.equal(monthlyReport(rs, settings, '2026-01').cashOut,100000);
});
test('late, partial and early payments change cash without moving or duplicating scheduled expenses', () => {
 const rs = [vehicle, loan, payment('part',0,'2026-02-02',100000), payment('rest',0,'2026-03-01',200000), payment('early',1,'2026-01-20',300000)];
 const jan = monthly(rs,settings,'2026-01'), feb=monthly(rs,settings,'2026-02'), mar=monthly(rs,settings,'2026-03');
 assert.equal(jan.emi,300000); assert.equal(jan.cash,600000); assert.equal(jan.committed,300000);
 assert.equal(feb.emi,300000); assert.equal(feb.cash,500000); assert.equal(feb.committed,200000);
 assert.equal(mar.emi,300000); assert.equal(mar.cash,300000); assert.equal(mar.committed,300000);
 assert.equal(commitments(rs,'2026-02-28').find(e=>e.installment===0).remaining,200000);
 for (const month of ['2026-01','2026-02','2026-03']) { const r=monthlyReport(rs,settings,month); assert.equal(r.openingCash+r.cashIn-r.cashOut,r.summary.cash); const book=reportWorkbook(r,'PIKU',month,0);const at=ref=>book.rows[Number(ref.slice(1))-1].cells[ref.charCodeAt(0)-65].value; assert.equal(at(book.refs.expenses),r.summary.expenses/100);assert.equal(at(book.refs.cash),r.summary.cash/100); }
});
test('partner investment covers cash needs and remains repayable without changing the loss', () => {
 const base=[vehicle,{...loan,downPayment:0}], tx={ id:'c',kind:'partnerTx',partnerId:'p',type:'contribution',amount:300000,date:'2026-01-31' }, p={id:'p',kind:'partner',name:'Partner',openingAmount:0};
 const before=monthly(base,settings,'2026-01'),after=monthly([...base,p,tx],settings,'2026-01');
 assert.equal(before.result,-300000);assert.equal(after.result,before.result);assert.equal(after.cash,before.cash+300000);assert.equal(after.partners,300000);
});
test('paid-before-ledger instalments stay excluded and month-end anchoring is preserved', () => {
 const rs=[{...loan,start:'2025-11-01',firstDue:'2025-11-30',total:5,openingPaid:2,downPayment:0}];
 assert.equal(monthly(rs,settings,'2025-12').emi,0);assert.equal(monthly(rs,settings,'2026-01').emi,300000);
 assert.deepEqual(loanSchedule(rs).map(e=>e.date),['2026-01-30','2026-02-28','2026-03-30']);
});
test('expense month controls business result while payment date controls cash; trip fines follow completion', () => {
 const trip={id:'t',kind:'trip',name:'Trip',vehicleId:'v',start:'2026-01-31',end:'2026-02-02',status:'completed',odoStart:1,odoEnd:20,amount:1000000};
 const rs=[trip,{id:'fine',kind:'expense',category:'fine',tripId:'t',amount:20000,date:'2026-01-31',paid:true}, {id:'cost',kind:'expense',category:'maintenance',amount:10000,date:'2026-02-10',expenseMonth:'2026-01',paymentDate:'2026-02-10',paid:true}];
 assert.ok(tripCategories.includes('fine'));assert.equal(monthly(rs,settings,'2026-01').businessExpense,10000);assert.equal(monthly(rs,settings,'2026-01').tripExpense,0);assert.equal(monthly(rs,settings,'2026-02').tripExpense,20000);assert.equal(monthly(rs,settings,'2026-02').businessExpense,0);assert.equal(monthlyReport(rs,settings,'2026-01').businessCosts.length,1);
 // Older unlinked fines remain business costs and can still be imported.
 assert.equal(monthly([{id:'old',kind:'expense',category:'fine',amount:10000,date:'2026-01-01',paid:true}],settings,'2026-01').businessExpense,10000);
});
test('trip, draft expenses and customer payment are linked in one batch; completed can remain unpaid', () => {
 const trip={id:'t',kind:'trip',name:'Trip',vehicleId:'v',start:'2026-01-01',end:'2026-01-01',status:'completed',odoStart:10,odoEnd:20,amount:1000000};let i=0;
 const batch=tripEntries(trip,{tripExpenses:[{category:'fine',amount:200,date:'2026-01-01',paid:true}],newPaymentAmount:2000,newPaymentDate:'2026-01-01',newPaymentMethod:'Cash'},()=>`new-${++i}`);
 assert.equal(batch.length,3);assert.equal(batch[1].tripId,'t');assert.equal(batch[2].tripId,'t');assert.equal(tripTotals(batch,batch[0]).balance,800000);assert.equal(tripTotals(batch,batch[0]).profit,980000);
 assert.equal(tripTotals(tripEntries(trip,{},()=>''),trip).balance,1000000);
 assert.throws(()=>tripEntries(trip,{tripExpenses:[{category:'diesel',amount:0,date:'2026-01-01',paid:true}]},()=>`bad-${++i}`));
});
test('new EMI fields survive validated backups and invalid down-payment/month inputs are rejected', () => {
 const backup={sample:false,exportedAt:new Date().toISOString(),settings,records:[vehicle,loan]};const restored=validateBackup(backup);
 assert.equal(restored.records[1].planType,'purchase');assert.equal(restored.records[1].downPayment,100000);assert.equal(monthly(restored.records,settings,'2026-01').result,-400000);
 assert.throws(()=>entrySchema.parse({...loan,downPaymentDate:undefined}));
 assert.throws(()=>validateBackup({...backup,records:[vehicle,{...loan,downPaymentDate:'2025-12-31'}]}));
 assert.throws(()=>entrySchema.parse({id:'e',kind:'expense',category:'other',description:'Cost',amount:1,date:'2026-01-01',expenseMonth:'2026-13',paid:true}));
});
