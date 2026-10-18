import { type Entry, categories, paise, tripCategories, tripTotals, today } from './ledger';
import { entrySchema } from './validation';

// One request keeps a new trip and its expenses/payments atomic on the server.
export function tripEntries(trip: Entry, form: any, id: () => string, records: Entry[] = []): Entry[] {
    const entries: Entry[] = [trip];
    if ((form.tripExpenses || []).length > 10) throw new Error('Save up to ten trip expenses at a time.');
    for (const cost of form.tripExpenses || []) {
        if (!tripCategories.includes(cost.category)) throw new Error('Choose a trip expense category.');
        if (cost.category === 'tripOther' && (!cost.description?.trim() || cost.description.trim() === categories.tripOther)) throw new Error('Describe what this other trip expense was for.');
        entries.push({
        id: id(), kind: 'expense', tripId: trip.id, vehicleId: trip.vehicleId,
        category: cost.category, description: cost.description || categories[cost.category],
        amount: paise(cost.amount), date: cost.date, paid: cost.paid,
        ...(cost.paid ? { paymentDate: cost.date } : { dueDate: cost.date }),
    });
    }
    const paymentAmount = trip.status === 'completed' && form.completionOutcome === 'paid' && !trip.opening ? Math.max(0, trip.amount - tripTotals(records, trip).received) : paise(form.newPaymentAmount || 0);
    if (paymentAmount > 0) entries.push({ id: id(), kind: 'payment', tripId: trip.id,
        amount: paymentAmount, date: form.newPaymentDate,
        type: 'receipt', method: form.newPaymentMethod || 'Other' });
    return entries.map(entry => entrySchema.parse(entry) as Entry);
}

// New/unfinished trips use the trip end date; a later settlement uses its actual receipt date.
export function tripPaymentDate(form: any, previous?: Entry, currentDate = today()) {
    if (form.paymentDateOverride) return form.newPaymentDate;
    if (form.status === 'completed' && form.completionOutcome === 'paid' && !form.opening)
        return previous?.status === 'completed' ? currentDate : form.end;
    return form.newPaymentDate || currentDate;
}

export function cancelTripEntries(trip: Entry, records: Entry[], paymentDate: string, id: () => string): Entry[] {
    if (trip.opening || trip.status === 'cancelled') throw new Error('This trip cannot be cancelled again.');
    const entries: Entry[] = [{ ...trip, status: 'cancelled' }];
    const received = tripTotals(records, trip).received;
    if (received > 0) entries.push({ id: id(), kind: 'payment', tripId: trip.id, type: 'refund', amount: received,
        date: paymentDate, method: 'Other', notes: 'Refund on trip cancellation' });
    return entries.map(entry => entrySchema.parse(entry) as Entry);
}
