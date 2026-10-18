import { type Entry, byKind, customerDues, monthOf, today, tripTotals } from './ledger';

// A month selects journeys; the Trips workspace always shows their current payments.
export function tripsInView(records: Entry[], month: string, filter = 'all', query = '', asOf = today()) {
    const candidates = filter === 'outstanding' ? customerDues(records, asOf) : byKind(records, 'trip').filter(trip => {
        if (!(trip.opening || monthOf(trip.start) <= month && monthOf(trip.end) >= month)) return false;
        if (filter === 'all') return true;
        if (filter === 'completed') return trip.status === 'completed' && tripTotals(records, trip).balance <= 0;
        if (filter === 'payment_pending') return trip.status === 'completed' && tripTotals(records, trip).balance > 0;
        if (filter === 'upcoming') return ['upcoming', 'in_progress'].includes(trip.status);
        return trip.status === filter;
    });
    return candidates.filter(trip => `${trip.name} ${trip.customer || ''}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => b.start.localeCompare(a.start));
}
