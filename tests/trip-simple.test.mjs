import test from 'node:test';
import assert from 'node:assert/strict';
import { tripEntries, tripPaymentDate, cancelTripEntries } from '../lib/trip-entry.ts';
import { tripsInView } from '../lib/trip-view.ts';
import { tripTotals, tripStatusLabel, monthly } from '../lib/ledger.ts';
import { monthlyReport } from '../lib/report.ts';
const trip={id:'trip',kind:'trip',name:'September trip',vehicleId:'v',start:'2026-09-29',end:'2026-09-30',status:'completed',amount:360000,odoStart:2000,odoEnd:3000};
const settings={name:'PIKU',startDate:'2026-09-01',openingCash:0,reserve:0};
const paid={id:'receipt',kind:'payment',tripId:'trip',type:'receipt',method:'Other',amount:360000,date:'2026-10-18'};

test('new completed trip uses its end date, including multi-day trips and corrections',()=>{
 const form={status:'completed',completionOutcome:'paid',start:'2026-09-29',end:'2026-09-30',newPaymentDate:'2026-10-18'};
 assert.equal(tripPaymentDate(form,undefined,'2026-10-18'),'2026-09-30');
 assert.equal(tripPaymentDate({...form,end:'2026-10-02'},undefined,'2026-10-18'),'2026-10-02');
 assert.equal(tripPaymentDate({...form,paymentDateOverride:true,newPaymentDate:'2026-10-05'},undefined,'2026-10-18'),'2026-10-05');
 const entries=tripEntries(trip,{...form,newPaymentDate:tripPaymentDate(form,undefined,'2026-10-18')},()=> 'p');assert.equal(entries[1].date,trip.end);assert.equal(entries[1].method,'Other');
});
test('settling an existing pending trip later uses today or the actual date override, never its old end date',()=>{
 const form={...trip,status:'completed',completionOutcome:'paid',newPaymentDate:trip.end};
 assert.equal(tripPaymentDate(form,trip,'2026-10-18'),'2026-10-18');
 assert.equal(tripPaymentDate({...form,paymentDateOverride:true,newPaymentDate:'2026-10-10'},trip,'2026-10-18'),'2026-10-10');
 assert.equal(tripPaymentDate({...form,status:'upcoming',completionOutcome:'pending',newPaymentDate:'2026-09-25'},undefined,'2026-10-18'),'2026-09-25');
});
test('September trip list and details both show current paid state while September reports retain the month-end debt',()=>{
 const records=[trip,paid];
 assert.equal(tripsInView(records,'2026-09','payment_pending','', '2026-10-18').length,0);
 assert.equal(tripsInView(records,'2026-09','completed','', '2026-10-18')[0].id,trip.id);
 assert.equal(tripsInView(records,'2026-09','outstanding','', '2026-10-18').length,0);
 assert.equal(tripStatusLabel(records,trip),'Completed — paid');assert.equal(tripTotals(records,trip).balance,0);
 const september=monthlyReport(records,settings,'2026-09'),october=monthlyReport(records,settings,'2026-10');
 assert.equal(september.customers[0].amount,360000);assert.equal(september.summary.income,360000);assert.equal(september.cashIn,0);assert.match(september.income[0].detail,/payment pending/);
 assert.equal(october.summary.income,0);assert.equal(october.cashIn,360000);assert.equal(october.customers.length,0);
});
test('upcoming filter preserves legacy unfinished trips without treating them as completed',()=>{
 const old={...trip,id:'old',status:'in_progress',odoEnd:null};assert.equal(tripsInView([old],'2026-09','upcoming')[0].id,'old');assert.equal(tripStatusLabel([old],old),'Upcoming');assert.equal(monthly([old],settings,'2026-09').income,0);
});
test('refund restores a current pending balance consistently and cancellation records the actual refund once',()=>{
 const refund={...paid,id:'partial',type:'refund',date:'2026-10-18',amount:100000};const records=[trip,paid,refund];
 assert.equal(tripsInView(records,'2026-09','payment_pending')[0].id,trip.id);assert.equal(tripTotals(records,trip).balance,100000);assert.equal(tripStatusLabel(records,trip),'Completed — payment pending');
 const cancelled=cancelTripEntries(trip,records,'2026-10-18',()=> 'rest');assert.equal(cancelled[1].amount,260000);assert.equal(cancelled[1].type,'refund');assert.equal(cancelled[1].date,'2026-10-18');
 const next=[paid,refund,...cancelled];assert.equal(tripTotals(next,cancelled[0]).received,0);assert.equal(tripStatusLabel(next,cancelled[0]),'Cancelled');assert.equal(monthly(next,settings,'2026-09').income,0);
 assert.throws(()=>cancelTripEntries(cancelled[0],next,'2026-10-18',()=> 'again'),/cannot be cancelled/);
 assert.equal(cancelTripEntries(trip,[trip],'2026-10-18',()=> 'unused').length,1);
});
