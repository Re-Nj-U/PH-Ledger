import type { Entry } from './ledger';

// Check the stored record too: removing an opening flag must not bypass access control.
export function assertRecordWriteAllowed(owner: boolean, entry: Entry, previous?: Entry) {
    if (owner) return;
    if (['vehicle', 'loan', 'partner'].includes(entry.kind))
        throw new Error('403:Only the owner can change vehicles, loans, and partner setup.');
    if (entry.opening || previous?.opening)
        throw new Error('403:Only the owner can change opening balances.');
}

export function validateDueSettlement(entry: Entry, previous: Entry | undefined, records: Entry[]) {
    if (previous?.kind === 'expense' && previous.linkedDueId && entry.linkedDueId !== previous.linkedDueId)
        throw new Error('A settled expense cannot be detached from or moved to another due item.');
    if (entry.kind !== 'expense' || !entry.linkedDueId) return;
    const due = records.find(record => record.id === entry.linkedDueId && record.kind === 'due');
    if (!due) throw new Error('Due item not found.');
    if ((due.paidDate && previous?.linkedDueId !== due.id) || records.some(record =>
        record.kind === 'expense' && record.id !== entry.id && record.linkedDueId === due.id))
        throw new Error('409:This due item was already paid. Refresh your ledger.');
    if (entry.category !== due.category)
        throw new Error('The expense category must match the due item.');
    if (entry.amount !== due.amount) throw new Error('Pay the full amount of this due item.');
    if (!entry.paid) throw new Error('Due settlement must be marked paid.');
    return due;
}
