'use client';
import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import DatePicker from './date-picker';
import { type Entry, categories, tripCategories, tripTotals, money, paise, today } from '../lib/ledger';
import { tripPaymentDate } from '../lib/trip-entry';

const dateLabel = (s: string) => new Date(s + 'T12:00:00Z').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
export function TripDates({ start, end, onChange }: { start: string; end: string; onChange: (start: string, end: string) => void }) {
    return <div className="trip-dates wide"><span className="field-label">Trip dates *</span><DatePicker label="Trip dates" value={start} end={end} mode="range" onChange={(a, b) => onChange(a, b || a)} required/></div>;
}
function ReceiptDate({ form, previous, set }: any) {
    const date = tripPaymentDate(form, previous);
    return <div className="receipt-date"><span>Paid on <strong>{dateLabel(date)}</strong></span><DatePicker label="Payment date" value={date} onChange={value => { set('newPaymentDate', value); set('paymentDateOverride', true); }} max={today()} required compact triggerText="Change"/></div>;
}
export default function TripFields({ form: f, set, records, vehicles, entry, Field }: any) {
    const [tab, setTab] = useState('details');
    const expenses = f.tripExpenses || [];
    const savedExpenses = records.filter((e: Entry) => e.kind === 'expense' && !!entry?.id && e.tripId === entry.id);
    const payments = records.filter((e: Entry) => e.kind === 'payment' && !!entry?.id && e.tripId === entry.id).sort((a: Entry, b: Entry) => b.date.localeCompare(a.date));
    const received = entry?.id ? tripTotals(records, entry).received : 0;
    const fullPayment = f.status === 'completed' && f.completionOutcome === 'paid' && !f.opening;
    const remaining = Math.max(0, paise(f.amount || 0) - received);
    const paymentNow = fullPayment ? remaining : paise(f.newPaymentAmount || 0);
    const balance = paise(f.amount || 0) - received - paymentNow;
    const updateExpense = (i: number, key: string, value: any) => set('tripExpenses', expenses.map((e: any, n: number) => n === i ? { ...e, [key]: value } : e));
    const status = f.status === 'completed' ? f.completionOutcome === 'paid' ? 'completed_paid' : 'payment_pending' : f.status;
    const statusOptions = f.status === 'cancelled' ? [{ value: 'cancelled', label: 'Cancelled' }] : [
        { value: 'completed_paid', label: 'Completed — paid' },
        { value: 'payment_pending', label: 'Completed — payment pending' },
        { value: 'upcoming', label: 'Upcoming' },
    ];
    return <>
        <div className="section-tabs form-tabs" role="tablist" aria-label="Trip entry">
            {[['details', 'Trip details'], ['expenses', `Expenses${expenses.length ? ` (${expenses.length})` : ''}`], ['payments', 'Payments']].map(([v, label]) => <button type="button" role="tab" aria-selected={tab === v} key={v} className={tab === v ? 'selected' : ''} onClick={() => setTab(v)}>{label}</button>)}
        </div>
        {tab === 'details' && <>
            <div className="form-grid trip-primary-fields">
                <Field label={f.opening ? 'Balance description' : 'Trip name'} value={f.name} onChange={(v: string) => set('name', v)} required wide placeholder="e.g. Munnar weekend"/>
                {vehicles.length > 1 && <Field label="Vehicle" value={f.vehicleId} onChange={(v: string) => set('vehicleId', v)} options={vehicles.map((v: Entry) => ({ value: v.id, label: v.name }))} required wide/>}
                {!vehicles.length && <p className="form-error wide">Add a vehicle in Settings before saving a trip.</p>}
                <TripDates start={f.start} end={f.end} onChange={(a, b) => { set('start', a); set('end', b); }}/>
                {!f.opening && <>
                    <Field label="Starting odometer (km)" value={f.odoStart} onChange={(v: string) => set('odoStart', v)} type="number" min="0" required/>
                    <Field label="Ending odometer (km)" value={f.odoEnd} onChange={(v: string) => set('odoEnd', v)} type="number" min={f.odoStart} help="Required when the trip is completed"/>
                    <div className="computed-field wide"><span>Total kilometres</span><strong>{f.odoEnd !== '' && f.odoEnd != null ? `${Math.max(0, Number(f.odoEnd) - Number(f.odoStart)).toLocaleString('en-IN')} km` : 'Enter the ending odometer'}</strong></div>
                </>}
                <Field label={f.opening ? 'Existing customer amount owed (₹)' : 'Trip amount (₹)'} value={f.amount} onChange={(v: string) => set('amount', v)} type="number" min="0.01" required/>
                <Field label="Trip status" value={status} onChange={(v: string) => { set('status', ['completed_paid', 'payment_pending'].includes(v) ? 'completed' : v); set('completionOutcome', v === 'completed_paid' ? 'paid' : 'pending'); }} options={statusOptions} disabled={f.opening || f.status === 'cancelled'}/>
            </div>
            {fullPayment && remaining > 0 && <div className="trip-receipt-summary"><span>{money(remaining)} received{received > 0 ? ' · remaining balance' : ''}</span><ReceiptDate form={f} previous={entry} set={set}/></div>}
            {f.status === 'completed' && !fullPayment && !f.opening && <p className="trip-payment-note">{money(Math.max(0, balance))} still to collect. <button type="button" className="text-button" onClick={() => { set('completionOutcome', 'paid'); }}>Mark paid</button></p>}
            <details className="optional-fields"><summary>Optional details</summary><div className="form-grid"><Field label="Customer name" value={f.customer} onChange={(v: string) => set('customer', v)}/><Field label="Phone number" value={f.phone} onChange={(v: string) => set('phone', v)} type="tel"/><Field label="Notes" value={f.notes} onChange={(v: string) => set('notes', v)} type="textarea" wide/></div></details>
            {f.opening && <p className="form-note">This balance is collectible and does not count as new trip income.</p>}
        </>}
        {tab === 'expenses' && <>
            <p className="muted">Add costs for this trip. They will be saved with the trip.</p>
            {savedExpenses.map((e: Entry) => <div className="draft-summary" key={e.id}><span>{e.description || categories[e.category]} <small>Saved</small></span><strong>{money(e.amount)}</strong></div>)}
            {expenses.map((e: any, i: number) => <fieldset className="draft-expense" key={e.key}><legend>Expense {i + 1}</legend><div className="form-grid">
                <Field label="Category" value={e.category} onChange={(v: string) => updateExpense(i, 'category', v)} options={tripCategories.map(value => ({ value, label: categories[value] }))}/>
                <Field label="Amount (₹)" value={e.amount} onChange={(v: string) => updateExpense(i, 'amount', v)} type="number" min="0.01" required/>
                <Field label="Expense date" value={e.date} onChange={(v: string) => updateExpense(i, 'date', v)} type="date" required/>
                <Field label="Payment status" value={e.paid ? 'paid' : 'unpaid'} onChange={(v: string) => updateExpense(i, 'paid', v === 'paid')} options={[{ value: 'paid', label: 'Paid on expense date' }, { value: 'unpaid', label: 'Not paid yet' }]}/>
                <Field label={e.category === 'tripOther' ? 'What was this expense for?' : 'Description (optional)'} required={e.category === 'tripOther'} value={e.description} onChange={(v: string) => updateExpense(i, 'description', v)} wide/>
            </div><button type="button" className="text-button" onClick={() => set('tripExpenses', expenses.filter((_: any, n: number) => n !== i))}><Trash2 size={15}/>Remove expense</button></fieldset>)}
            <button type="button" className="button secondary" disabled={expenses.length >= 10 || f.opening} onClick={() => set('tripExpenses', [...expenses, { key: crypto.randomUUID(), category: 'diesel', amount: '', date: today(), paid: true, description: '' }])}><Plus size={16}/>Add trip expense</button>
            {savedExpenses.length > 0 && <p className="monthly-footnote">Edit saved costs from Trip details.</p>}
        </>}
        {tab === 'payments' && <>
            <div className="payment-overview"><div><span>Trip amount</span><strong>{money(paise(f.amount || 0))}</strong></div><div><span>Already received</span><strong>{money(received)}</strong></div><div><span>{balance < 0 ? 'Customer credit after saving' : 'Balance after saving'}</span><strong>{money(Math.abs(balance))}</strong></div></div>
            {fullPayment ? <>{remaining > 0 ? <div className="trip-receipt-summary"><span>{money(remaining)} received</span><ReceiptDate form={f} previous={entry} set={set}/></div> : <p className="muted">Paid in full. Existing payments stay in the history.</p>}</> : <>
                {f.status !== 'cancelled' && <><p className="muted">Record an advance or partial payment, if any.</p><div className="form-grid"><Field label="Amount received (₹, optional)" value={f.newPaymentAmount} onChange={(v: string) => set('newPaymentAmount', v)} type="number" min="0" wide/></div>{paymentNow > 0 && <ReceiptDate form={f} previous={entry} set={set}/>}</>}
                {f.status === 'completed' && !f.opening && remaining > 0 && <button type="button" className="text-button" onClick={() => set('completionOutcome', 'paid')}>Mark paid · {money(remaining)}</button>}
            </>}
            {payments.map((p: Entry) => <div className="draft-summary" key={p.id}><span>{p.type === 'refund' ? 'Refund' : 'Payment'} · {dateLabel(p.date)}</span><strong>{money(p.amount)}</strong></div>)}
        </>}
    </>;
}
