export type Kind = 'trip' | 'payment' | 'expense' | 'partner' | 'partnerTx' | 'loan' | 'vehicle' | 'due';
export type Entry = {
    id: string;
    kind: Kind;
    version?: number;
    [key: string]: any;
};
export type Settings = {
    name: string;
    startDate: string;
    openingCash: number;
    reserve: number;
};
export type Member = {
    email: string;
    name: string;
    role: 'owner' | 'partner';
    active: number;
};
export type LedgerData = {
    records: Entry[];
    settings: Settings;
    members: Member[];
    user: {
        name: string;
        email: string;
        role: 'owner' | 'partner';
    };
    audit: any[];
};
export const categories: Record<string, string> = { diesel: 'Diesel', driver: 'Driver', permit: 'Permit', tripOther: 'Other trip expense', insurance: 'Insurance', roadTax: 'Road tax', emi: 'Loan EMI', fine: 'Traffic fine', maintenance: 'Maintenance', other: 'Other business expense' };
export const tripCategories = ['diesel', 'driver', 'permit', 'fine', 'tripOther'];
export const defaultSettings: Settings = { name: 'PIKU Holidays', startDate: '2026-10-01', openingCash: 0, reserve: 0 };
export const money = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: n % 100 === 0 ? 0 : 2 }).format(n / 100);
export const paise = (n: unknown) => Math.round(Number(n) * 100);
export const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
export const monthOf = (s: string) => s?.slice(0, 7) || '';
export const sum = (items: Entry[], key = 'amount') => items.reduce((s, x) => s + (Number(x[key]) || 0), 0);
export const byKind = (rs: Entry[], k: Kind) => rs.filter(x => x.kind === k);
export const monthEnd = (m: string) => { const [y, mo] = m.split('-').map(Number); return `${m}-${String(new Date(Date.UTC(y, mo, 0)).getUTCDate()).padStart(2, '0')}`; };
export function addMonths(d: string, count: number) { const [y, m, day] = d.split('-').map(Number); const dt = new Date(Date.UTC(y, m - 1 + count, 1)); const yy = dt.getUTCFullYear(), mm = dt.getUTCMonth() + 1; const last = new Date(Date.UTC(yy, mm, 0)).getUTCDate(); return `${yy}-${String(mm).padStart(2, '0')}-${String(Math.min(day, last)).padStart(2, '0')}`; }
export function advanceDue(d: string, repeat: string) { if (repeat === 'fortnightly') {
    const dt = new Date(d + 'T12:00:00Z');
    dt.setUTCDate(dt.getUTCDate() + 15);
    return dt.toISOString().slice(0, 10);
} return addMonths(d, repeat === 'yearly' ? 12 : repeat === 'quarterly' ? 3 : 1); }
export function tripTotals(rs: Entry[], trip: Entry, until = '9999-12-31') {
    const payments = byKind(rs, 'payment').filter(x => x.tripId === trip.id && x.date <= until);
    const received = payments.reduce((s, x) => s + (x.type === 'refund' ? -x.amount : x.amount), 0);
    const expenses = sum(byKind(rs, 'expense').filter(x => x.tripId === trip.id));
    const agreed = trip.status === 'cancelled' ? 0 : trip.amount;
    return { received, expenses, balance: agreed - received, profit: agreed - expenses, km: trip.odoEnd == null ? null : trip.odoEnd - trip.odoStart };
}
export function tripStatusLabel(rs: Entry[], trip: Entry, until = '9999-12-31') {
    if (trip.opening) return 'Opening customer balance';
    if (trip.status === 'completed') return tripTotals(rs, trip, until).balance > 0 ? 'Completed — payment pending' : 'Completed — paid';
    return ({ upcoming: 'Upcoming', in_progress: 'Upcoming', cancelled: 'Cancelled' } as Record<string, string>)[trip.status] || trip.status;
}
export function customerDues(rs: Entry[], until: string) {
    return byKind(rs, 'trip').filter(trip => trip.start <= until && trip.status !== 'cancelled' && tripTotals(rs, trip, until).balance > 0);
}
export function partnerTotals(rs: Entry[], partner: Entry, until = '9999-12-31') {
    const tx = byKind(rs, 'partnerTx').filter(x => x.partnerId === partner.id && x.date <= until);
    const contributions = sum(tx.filter(x => x.type === 'contribution'));
    const repayments = sum(tx.filter(x => x.type === 'repayment'));
    const distributions = sum(tx.filter(x => x.type === 'distribution'));
    return { contributions, repayments, distributions, balance: (partner.openingAmount || 0) + contributions - repayments };
}
// Schedules drive monthly deductions; confirmed payments alone drive actual cash.
export function loanSchedule(rs: Entry[]) {
    return byKind(rs, 'loan').flatMap(loan => Array.from({ length: loan.total }, (_, i) => i)
        .filter(i => i >= (loan.openingPaid || 0)).map(i => ({
            id: `${loan.id}:${i}`, kind: 'expense' as const, source: 'loan', loanId: loan.id,
            installment: i, title: `${loan.name} · EMI ${i + 1}`, name: loan.name,
            description: `${loan.name} · EMI ${i + 1}`, dueDate: addMonths(loan.firstDue, i),
            date: addMonths(loan.firstDue, i), amount: loan.emi, category: 'emi', vehicleId: loan.vehicleId,
        })));
}
export function businessExpenses(rs: Entry[]): Entry[] {
    const downPayments = byKind(rs, 'loan').filter(loan => loan.downPayment > 0).map(loan => ({
        id: `${loan.id}:downpayment`, kind: 'expense' as const, source: 'downPayment', loanId: loan.id,
        category: 'maintenance', description: `${loan.name} · Down payment`, amount: loan.downPayment,
        date: loan.downPaymentDate || loan.start, paymentDate: loan.downPaymentDate || loan.start,
        paid: true, vehicleId: loan.vehicleId, notes: loan.notes || '',
    }));
    return [...byKind(rs, 'expense'), ...downPayments];
}
export const expenseMonth = (e: Entry) => e.expenseMonth || monthOf(e.date);
export function emiCharges(rs: Entry[], settings: Settings, month: string): Entry[] {
    const end = monthEnd(month);
    const scheduled = loanSchedule(rs).filter(e => monthOf(e.dueDate) === month && e.dueDate >= settings.startDate).map(e => {
        const payments = byKind(rs, 'expense').filter(p => p.category === 'emi' && p.loanId === e.loanId && p.installment === e.installment && p.paid !== false && (p.paymentDate || p.date) <= end);
        const received = sum(payments);
        return { ...e, source: 'emiSchedule', paid: received >= e.amount, remaining: Math.max(0, e.amount - received),
            interest: received >= e.amount && payments.every(p => p.interest != null) ? sum(payments, 'interest') : null };
    });
    // Preserve reports for legacy standalone EMI records without a usable loan schedule.
    const standalone = byKind(rs, 'expense').filter(e => e.category === 'emi' && !rs.some(l => l.kind === 'loan' && l.id === e.loanId) && e.paid !== false && monthOf(e.paymentDate || e.date) === month);
    return [...scheduled, ...standalone];
}
export function commitments(rs: Entry[], until = '9999-12-31'): any[] {
    const dues = byKind(rs, 'due').filter(x => !x.paidDate || x.paidDate > until).map(x => ({ ...x, remaining: x.amount, title: x.name, source: 'due' }));
    const unpaid = byKind(rs, 'expense').filter(x => x.paid === false || (x.paymentDate || x.date) > until).filter(x => x.category !== 'emi').map(x => ({ ...x, remaining: x.amount, dueDate: x.dueDate || x.date, title: x.description || categories[x.category], source: 'expense' }));
    const scheduled = loanSchedule(rs).map(e => {
        const paid = sum(byKind(rs, 'expense').filter(x => x.category === 'emi' && x.loanId === e.loanId && x.installment === e.installment && x.paid !== false && (x.paymentDate || x.date) <= until));
        return { ...e, remaining: Math.max(0, e.amount - paid) };
    }).filter(e => e.remaining > 0);
    return [...dues, ...unpaid, ...scheduled].sort((a: any, b: any) => a.dueDate.localeCompare(b.dueDate));
}
export function monthly(rs: Entry[], settings: Settings, month: string) {
    const end = monthEnd(month), inMonth = (x: Entry) => monthOf(x.date) === month;
    const trips = byKind(rs, 'trip').filter(x => x.status === 'completed' && !x.opening && monthOf(x.end) === month);
    const expenses = businessExpenses(rs);
    const income = sum(trips), tripExpense = sum(expenses.filter(x => byKind(rs, 'trip').some(t => t.id === x.tripId && !t.opening && ['completed', 'cancelled'].includes(t.status) && monthOf(t.end) === month))), businessExpense = sum(expenses.filter(x => !x.tripId && x.category !== 'emi' && expenseMonth(x) === month));
    const emiEntries = emiCharges(rs, settings, month), emi = sum(emiEntries), interest = sum(emiEntries, 'interest'), operating = income - tripExpense - businessExpense;
    const receipts = byKind(rs, 'payment').filter(inMonth).reduce((s, x) => s + (x.type === 'refund' ? -x.amount : x.amount), 0);
    const dated = rs.filter(x => x.date >= settings.startDate && x.date <= end), cashReceipts = byKind(dated, 'payment').reduce((s, x) => s + (x.type === 'refund' ? -x.amount : x.amount), 0);
    const cashExpenses = sum(expenses.filter(x => x.paid !== false && (x.paymentDate || x.date) >= settings.startDate && (x.paymentDate || x.date) <= end));
    const partnerCash = byKind(dated, 'partnerTx').reduce((s, x) => s + (x.type === 'contribution' ? x.amount : -x.amount), 0), cash = (end >= settings.startDate ? settings.openingCash : 0) + cashReceipts - cashExpenses + partnerCash;
    const outstanding = byKind(rs, 'trip').filter(x => x.start <= end && x.status !== 'cancelled').reduce((s, t) => s + Math.max(0, tripTotals(rs, t, end).balance), 0), partners = end >= settings.startDate ? byKind(rs, 'partner').reduce((s, p) => s + partnerTotals(rs, p, end).balance, 0) : 0;
    const committed = sum(commitments(rs, end).filter(x => x.dueDate <= end), 'remaining');
    return { income, tripExpense, businessExpense, emi, expenses: tripExpense + businessExpense + emi, operating, result: operating - emi, interest, interestIncomplete: emiEntries.some(x => x.interest == null), profit: operating - interest, receipts, cash, outstanding, partners, committed, afterCommitments: cash - committed, available: cash - committed - settings.reserve, trips: trips.length, contributions: sum(byKind(rs, 'partnerTx').filter(x => x.type === 'contribution' && inMonth(x))), repayments: sum(byKind(rs, 'partnerTx').filter(x => x.type === 'repayment' && inMonth(x))), distributions: sum(byKind(rs, 'partnerTx').filter(x => x.type === 'distribution' && inMonth(x))) };
}
