import { z } from 'zod';
import { entrySchema, settingsSchema } from './validation';
import { tripCategories, type Entry, today } from './ledger';

const backupSchema = z.object({
    sample: z.literal(false),
    exportedAt: z.string().datetime(),
    settings: settingsSchema,
    records: z.array(entrySchema).max(10000),
});

export function validateBackup(value: unknown) {
    const backup = backupSchema.parse(value);
    const records = backup.records as Entry[];
    const ids = new Map(records.map(record => [record.id, record]));
    if (ids.size !== records.length) throw new Error('The backup contains duplicate record IDs.');
    const settled = new Set<string>();
    for (const record of records) {
        for (const [key, kind] of [['vehicleId', 'vehicle'], ['tripId', 'trip'], ['partnerId', 'partner'], ['loanId', 'loan'], ['linkedDueId', 'due']]) {
            if (record[key] && ids.get(record[key])?.kind !== kind)
                throw new Error(`Backup record ${record.id} has an invalid ${key} reference.`);
        }
        if (record.date && record.date < backup.settings.startDate && !record.opening)
            throw new Error('A backup transaction is before the ledger start date.');
        if (['payment', 'partnerTx'].includes(record.kind) && record.date > today())
            throw new Error('A backup actual payment has a future date.');
        if (record.kind === 'loan' && record.downPayment && (!record.downPaymentDate || record.downPaymentDate < backup.settings.startDate || record.downPaymentDate > today())) throw new Error('A backup down payment has an invalid payment date.');
        if (record.kind === 'expense' && record.expenseMonth && record.expenseMonth < backup.settings.startDate.slice(0, 7)) throw new Error('A backup expense month is before the ledger start.');
        if (record.kind === 'expense') {
            if (!tripCategories.includes(record.category) && record.tripId)
                throw new Error('A backup business expense is incorrectly linked to a trip.');
            if (record.paid && (record.paymentDate || record.date) > today())
                throw new Error('A backup paid expense has a future payment date.');
            if (record.paymentDate && record.paymentDate < backup.settings.startDate)
                throw new Error('A backup expense payment is before the ledger start date.');
            if (record.category === 'emi') {
                const loan = ids.get(record.loanId)!;
                if (record.installment >= loan.total || record.installment < loan.openingPaid)
                    throw new Error('A backup EMI has an invalid instalment number.');
            }
            if (record.linkedDueId) {
                const due = ids.get(record.linkedDueId)!;
                if (settled.has(due.id)) throw new Error('The backup pays the same due item more than once.');
                settled.add(due.id);
                if (!record.paid || record.category !== due.category || record.amount !== due.amount || due.paidDate !== (record.paymentDate || record.date))
                    throw new Error('A backup due settlement does not match its expense.');
            }
        }
    }
    for (const partner of records.filter(record => record.kind === 'partner')) {
        let balance = partner.openingAmount;
        const entries = records.filter(record => record.kind === 'partnerTx' && record.partnerId === partner.id)
            .sort((a, b) => a.date.localeCompare(b.date) || (a.type === 'contribution' ? -1 : b.type === 'contribution' ? 1 : 0));
        for (const entry of entries) {
            balance += entry.type === 'contribution' ? entry.amount : entry.type === 'repayment' ? -entry.amount : 0;
            if (balance < 0) throw new Error('A backup repayment exceeds dated partner debt.');
        }
    }
    for (const trip of records.filter(record => record.kind === 'trip')) {
        let received = 0;
        const payments = records.filter(record => record.kind === 'payment' && record.tripId === trip.id)
            .sort((a, b) => a.date.localeCompare(b.date) || (a.type === 'receipt' ? -1 : b.type === 'receipt' ? 1 : 0));
        for (const payment of payments) {
            received += payment.type === 'refund' ? -payment.amount : payment.amount;
            if (received < 0) throw new Error('A backup refund exceeds dated customer receipts.');
        }
        if (trip.status === 'cancelled' && received > 0) throw new Error('A cancelled trip has unrefunded customer receipts.');
    }
    for (const loan of records.filter(record => record.kind === 'loan')) {
        const paid = new Map<number, number>();
        for (const entry of records.filter(record => record.kind === 'expense' && record.category === 'emi' && record.loanId === loan.id)) {
            paid.set(entry.installment, (paid.get(entry.installment) || 0) + entry.amount);
            if (paid.get(entry.installment)! > loan.emi) throw new Error('Backup EMI payments exceed an instalment amount.');
        }
    }
    return backup;
}
