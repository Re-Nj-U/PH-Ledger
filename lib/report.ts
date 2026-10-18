import { type Entry, type Settings, byKind, categories, monthOf, monthEnd, monthly, tripTotals, partnerTotals, customerDues, commitments, businessExpenses, expenseMonth, emiCharges, tripStatusLabel } from './ledger.ts';

export type ReportRow = { entry: Entry; date: string; title: string; detail: string; amount: number };
export function monthlyReport(records: Entry[], settings: Settings, month: string) {
    const end = monthEnd(month), summary = monthly(records, settings, month);
    const find = (id: string) => records.find(x => x.id === id);
    const sort = (rows: ReportRow[]) => rows.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
    const expenseRow = (e: Entry): ReportRow => ({ entry: e, date: e.category === 'emi' ? e.paymentDate || e.date : e.date, title: e.description || categories[e.category], detail: [categories[e.category], e.expenseMonth ? `Expense month ${e.expenseMonth}` : '', e.tripId ? find(e.tripId)?.name : find(e.loanId)?.name, e.paid === false || (e.paymentDate || e.date) > end ? 'Unpaid at month end' : 'Paid'].filter(Boolean).join(' · '), amount: e.amount });
    const income = sort(byKind(records, 'trip').filter(t => t.status === 'completed' && !t.opening && monthOf(t.end) === month).map(t => ({ entry: t, date: t.end, title: t.name, detail: `${t.customer || 'Customer'} · ${tripStatusLabel(records, t, end)}`, amount: t.amount })));
    const expenses = businessExpenses(records);
    const tripCosts = sort(expenses.filter(e => { const t = find(e.tripId); return t && !t.opening && ['completed', 'cancelled'].includes(t.status) && monthOf(t.end) === month; }).map(expenseRow));
    const businessCosts = sort(expenses.filter(e => !e.tripId && e.category !== 'emi' && expenseMonth(e) === month).map(expenseRow));
    const emis = sort(emiCharges(records, settings, month).map(e => ({ ...expenseRow(e), date: e.dueDate || e.paymentDate || e.date, detail: `${find(e.loanId)?.planType === 'purchase' ? 'Purchase EMI' : 'Vehicle EMI'} · ${e.paid === false ? 'Payment pending' : 'Paid'}` })));
    const cash = sort([...records.filter(e => e.kind !== 'expense'), ...expenses].filter(e => {
        const date = e.kind === 'expense' ? e.paymentDate || e.date : e.date;
        return ['payment', 'expense', 'partnerTx'].includes(e.kind) && date >= settings.startDate && monthOf(date) === month && (e.kind !== 'expense' || e.paid !== false);
    }).map(e => {
        if (e.kind === 'expense') return { ...expenseRow(e), date: e.paymentDate || e.date, amount: -e.amount };
        if (e.kind === 'payment') return { entry: e, date: e.date, title: e.type === 'refund' ? 'Customer refund' : 'Customer payment', detail: [find(e.tripId)?.name, e.method].filter(Boolean).join(' · '), amount: e.type === 'refund' ? -e.amount : e.amount };
        return { entry: e, date: e.date, title: e.type === 'contribution' ? 'Partner contribution' : e.type === 'repayment' ? 'Partner repayment' : 'Profit distribution', detail: find(e.partnerId)?.name || 'Partner', amount: e.type === 'contribution' ? e.amount : -e.amount };
    }));
    const cashIn = cash.reduce((s, x) => s + Math.max(0, x.amount), 0), cashOut = cash.reduce((s, x) => s + Math.max(0, -x.amount), 0);
    const customers = customerDues(records, end).map(t => ({ entry: t, date: t.end, title: t.name, detail: t.customer || 'Customer', amount: tripTotals(records, t, end).balance }));
    const partners = byKind(records, 'partner').map(p => ({ entry: p, date: settings.startDate, title: p.name, detail: 'Repayable contributions carried forward', amount: end >= settings.startDate ? partnerTotals(records, p, end).balance : 0 }));
    const unpaid = commitments(records, end).filter(d => d.dueDate <= end).map(d => ({ entry: d, date: d.dueDate, title: d.title, detail: categories[d.category] || 'Commitment', amount: d.remaining }));
    return { summary, income, tripCosts, businessCosts, emis, cash, cashIn, cashOut, openingCash: summary.cash - cashIn + cashOut, customers, partners, unpaid };
}

export function reportCsvRows(report: ReturnType<typeof monthlyReport>, name: string, month: string, reserve: number): any[][] {
    const m = report.summary;
    const rows: any[][] = [[name, 'Monthly report', month], ['All amounts in INR'], ['Income from ended trips', m.income / 100], ['Trip expenses', m.tripExpense / 100], ['Additional business expenses', m.businessExpense / 100], ['Scheduled EMI for month', m.emi / 100], ['Total expenses', m.expenses / 100], ['Monthly surplus / shortfall after EMI', m.result / 100], ['Operating profit before EMI', m.operating / 100], ['Loan interest', m.interestIncomplete ? 'Breakdown needed' : m.interest / 100], ['Profit after loan interest', m.interestIncomplete ? 'Breakdown needed' : m.profit / 100], ['Customer receipts (net)', m.receipts / 100], ['Opening cash / balance brought forward', report.openingCash / 100], ['Cash in', report.cashIn / 100], ['Cash out', report.cashOut / 100], ['Business cash at month end', m.cash / 100], ['Customers owe', m.outstanding / 100], ['Owed to partners', m.partners / 100], ['Unpaid commitments through month end', m.committed / 100], ['Cash after commitments', m.afterCommitments / 100], ['Protected reserve', reserve / 100], ['Cash after commitments and reserve', m.available / 100]];
    for (const [title, items] of [['Income from ended trips', report.income], ['Trip expenses recognised in completion month (original expense dates shown)', report.tripCosts], ['Additional business expenses', report.businessCosts], ['Monthly EMI deductions', report.emis], ['Actual cash movements (positive = in, negative = out)', report.cash], ['Customers owe at month end', report.customers], ['Partner balances at month end', report.partners], ['Unpaid commitments through month end', report.unpaid]] as [string, ReportRow[]][]) {
        rows.push([], [title], ['Date', 'Description', 'Details', 'Amount (INR)', 'Notes', 'Record ID']);
        items.forEach(x => rows.push([x.date, x.title, x.detail, x.amount / 100, x.entry.notes || '', x.entry.id]));
    }
    return rows;
}
