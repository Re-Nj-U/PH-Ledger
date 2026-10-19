import { getDb } from '../../../db';
import { getUser, verifyOwnerPassword } from '../../../lib/auth';
import { changeBusinessOwner } from '../../../lib/ownership';
import type { LedgerDatabase, Statement } from '../../../lib/database';
import { importLedger } from '../../../lib/import-ledger';
import { resolveAccess } from '../../../lib/access';
import { validateWriteRequest, readLedgerBody } from '../../../lib/request-security';
import { entrySchema, settingsSchema, memberSchema } from '../../../lib/validation';
import { assertRecordWriteAllowed, validateDueSettlement, validateOtherDescription, validateTripSettlement } from '../../../lib/record-rules';
import { databaseFailure } from '../../../lib/database-failure.mjs';
import { defaultSettings, tripCategories, type Entry, partnerTotals, tripTotals, advanceDue, today } from '../../../lib/ledger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const json = (x: any, status = 200) => Response.json(x, { status, headers: { 'Cache-Control': 'no-store' } });
async function context() {
    const user = await getUser();
    if (!user)
        throw new Error('401:Please sign in to use your ledger.');
    return resolveAccess(getDb(), user, process.env.OWNER_EMAIL);
}
function error(e: any) {
    const m = e.message || 'Unable to save this change';
    const match = m.match(/^(\d{3}):(.+)$/);
    if (match) return json({ error: match[2] }, Number(match[1]));
    if (e.code === '23505') return json({ error: 'This record already exists. Refresh and try again.' }, 409);
    if (e.code || e.severity) {
        const failure = databaseFailure(e);
        console.error(JSON.stringify(failure.log));
        return json({ error: failure.message, code: failure.code }, 503);
    }
    return json({ error: m }, 400);
}
async function getRecords(db: LedgerDatabase) { const r = await db.prepare('SELECT * FROM records ORDER BY updated_at').all<any>(); return r.results.map(x => ({ ...JSON.parse(x.data), version: x.version })); }
function checkRef(rs: Entry[], id: string | undefined, kind: string) { if (id && !rs.some(x => x.id === id && x.kind === kind))
    throw new Error(`Select a valid ${kind}.`); }
function validateBalances(rs: Entry[]) {
    for (const p of rs.filter(x => x.kind === 'partner')) {
        let balance = p.openingAmount || 0;
        const tx = rs.filter(x => x.kind === 'partnerTx' && x.partnerId === p.id).sort((a, b) => a.date.localeCompare(b.date) || (a.type === 'contribution' ? -1 : b.type === 'contribution' ? 1 : 0));
        for (const t of tx) {
            balance += t.type === 'contribution' ? t.amount : t.type === 'repayment' ? -t.amount : 0;
            if (balance < 0)
                throw new Error('Repayment exceeds the amount owed to this partner on that date.');
        }
    }
    for (const trip of rs.filter(x => x.kind === 'trip')) {
        let received = 0;
        const tx = rs.filter(x => x.kind === 'payment' && x.tripId === trip.id).sort((a, b) => a.date.localeCompare(b.date) || (a.type === 'receipt' ? -1 : 1));
        for (const t of tx) {
            received += t.type === 'refund' ? -t.amount : t.amount;
            if (received < 0)
                throw new Error('A refund cannot exceed payments already received on that date.');
        }
        if (trip.status === 'cancelled' && received > 0)
            throw new Error('Refund customer payments before cancelling the trip.');
    }
}
function auditStatement(db: LedgerDatabase, user: string, id: string, action: string, before: any, after: any) { return db.prepare('INSERT INTO audit(id,record_id,action,actor,at,before,after) VALUES(?,?,?,?,?,?,?)').bind(crypto.randomUUID(), id, action, user, new Date().toISOString(), before ? JSON.stringify(before) : null, after ? JSON.stringify(after) : null); }
async function transact(c: Awaited<ReturnType<typeof context>>, stmts: Statement[]) {
    await c.db.batch(stmts, c.revision);
}
export async function GET() { try {
    const c = await context();
    const records = await getRecords(c.db);
    const members = await c.db.prepare('SELECT email,name,role,active FROM members').all();
    const history = await c.db.prepare("SELECT id,record_id,action,actor,at FROM audit WHERE action!='transaction' ORDER BY at DESC LIMIT 100").all();
    return json({ records, settings: c.settings, members: c.owner ? members.results : [], user: { name: c.member?.name || c.user.displayName, email: c.user.email, role: c.owner ? 'owner' : 'partner' }, audit: history.results });
}
catch (e) {
    return error(e);
} }
export async function POST(request: Request) {
    try {
        validateWriteRequest(request);
        const c = await context();
        const body: any = await readLedgerBody(request);
        if (body.action === 'transferOwnership') {
            await changeBusinessOwner(c, body.transfer, verifyOwnerPassword);
            return json({ ok: true });
        }
        if (body.action === 'import') {
            if (!c.owner) throw new Error('403:Only the owner can import a ledger backup.');
            const count = await importLedger(c.db, body.backup, c.revision, c.user.email);
            return json({ ok: true, imported: count });
        }
        const rs = await getRecords(c.db);
        if (body.action === 'settings') {
            if (!c.owner)
                throw new Error('403:Only the owner can change business settings.');
            const s = settingsSchema.parse(body.settings);
            if (rs.some(x => x.date && x.date < s.startDate && !x.opening))
                throw new Error('Start date cannot exclude existing transactions.');
            await transact(c, [c.db.prepare('UPDATE business SET settings=? WHERE id=?').bind(JSON.stringify(s), 'main'), auditStatement(c.db, c.user.email, 'settings', 'updated', c.settings, s)]);
            return json({ ok: true });
        }
        if (body.action === 'member') {
            if (!c.owner)
                throw new Error('403:Only the owner can manage users.');
            const m = memberSchema.parse(body.member);
            const old: any = await c.db.prepare('SELECT * FROM members WHERE email=?').bind(m.email).first();
            if (m.role === 'owner' || old?.role === 'owner')
                throw new Error('The business owner cannot be changed here.');
            await transact(c, [c.db.prepare('INSERT INTO members(email,name,role,active) VALUES(?,?,?,?) ON CONFLICT(email) DO UPDATE SET name=excluded.name,active=excluded.active').bind(m.email, m.name, 'partner', m.active), auditStatement(c.db, c.user.email, m.email, 'member updated', old, m)]);
            return json({ ok: true });
        }
        if (body.action === 'delete') {
            const old = rs.find(x => x.id === body.id);
            if (!old)
                throw new Error('404:Record not found.');
            assertRecordWriteAllowed(c.owner, old, old);
            if (rs.some(x => x.tripId === old.id || x.partnerId === old.id || x.loanId === old.id || x.vehicleId === old.id || x.linkedDueId === old.id))
                throw new Error('This record has linked transactions. Update it instead of deleting it.');
            if (old.version !== body.version)
                throw new Error('409:This record changed. Refresh before deleting.');
            if (old.kind === 'partnerTx' && partnerTotals(rs.filter(x => x.id !== old.id), rs.find(x => x.id === old.partnerId)!).balance < 0)
                throw new Error('Contribution cannot be removed after it has been repaid.');
            if (old.kind === 'expense' && (old.nextDue || old.linkedDueId))
                throw new Error('This expense is linked to a renewal. Edit its details instead.');
            validateBalances(rs.filter(x => x.id !== old.id));
            if (old.kind === 'due' && old.id.startsWith('renewal-') && rs.some(x => x.id === old.id.slice(8) && x.nextDue))
                throw new Error('Clear the next due date on its original expense before removing this renewal.');
            await transact(c, [c.db.prepare('DELETE FROM records WHERE id=? AND version=?').bind(old.id, old.version), auditStatement(c.db, c.user.email, old.id, 'deleted', old, null)]);
            return json({ ok: true });
        }
        if (body.action !== 'save')
            throw new Error('Unknown action.');
        const raw = body.entries || [body.entry];
        if (!Array.isArray(raw) || raw.length < 1 || raw.length > 20)
            throw new Error('Invalid entry count.');
        const entries = raw.map((x: any) => entrySchema.parse(x)) as Entry[];
        if (!entries.length || entries.length > 20)
            throw new Error('Invalid entry count.');
        if (new Set(entries.map(x => x.id)).size !== entries.length)
            throw new Error('Duplicate record IDs.');
        const effective = [...rs.filter(x => !entries.some(e => e.id === x.id)), ...entries], stmts: Statement[] = [];
        validateBalances(effective);
        validateTripSettlement(body.settleTripId, entries, rs);
        for (const e of entries) {
            const old = rs.find(x => x.id === e.id);
            if (old && old.kind !== e.kind)
                throw new Error('Record category cannot change.');
            if (old && old.version !== e.version)
                throw new Error('409:This record changed on another device. Refresh and try again.');
            assertRecordWriteAllowed(c.owner, e, old);
            validateOtherDescription(e, old);
            if (e.date && e.date < c.settings.startDate && !e.opening)
                throw new Error('Transaction date is before the ledger start date.');
            if (e.kind === 'due' && e.paidDate !== old?.paidDate)
                throw new Error('Record payment through the due item to settle it.');
            if (e.kind === 'due' && old?.paidDate)
                throw new Error('A paid commitment cannot be changed.');
            if (['payment', 'partnerTx'].includes(e.kind) && e.date > today())
                throw new Error('An actual payment cannot have a future date.');
            if (e.kind === 'expense' && e.paid && (e.paymentDate || e.date) > today())
                throw new Error('An actual expense payment cannot have a future date.');
            if (e.kind === 'expense' && e.paymentDate && e.paymentDate < c.settings.startDate)
                throw new Error('Payment date is before the ledger start.');
            if (e.kind === 'expense' && e.category === 'fine' && !e.tripId && !old && !e.linkedDueId) throw new Error('Select the trip for this fine.');
            if (e.kind === 'expense' && e.expenseMonth && e.expenseMonth < c.settings.startDate.slice(0, 7)) throw new Error('Expense month is before the ledger start.');
            if (e.kind === 'loan' && e.downPayment && (!e.downPaymentDate || e.downPaymentDate < c.settings.startDate || e.downPaymentDate > today())) throw new Error('Down payment must have an actual payment date within the ledger.');
            if (e.kind === 'expense' && !tripCategories.includes(e.category) && e.tripId)
                throw new Error('Business expenses cannot be assigned as trip costs.');
            checkRef(effective, e.vehicleId, 'vehicle');
            checkRef(effective, e.tripId, 'trip');
            checkRef(effective, e.partnerId, 'partner');
            checkRef(effective, e.loanId, 'loan');
            if (e.kind === 'payment') {
                const trip = effective.find(t => t.id === e.tripId)!;
                const before = tripTotals(effective.filter(x => x.id !== e.id), trip);
                if (e.type === 'refund' && e.amount > Math.max(0, before.received))
                    throw new Error('Refund cannot exceed customer payments received.');
                if (trip.status === 'cancelled' && e.type === 'receipt')
                    throw new Error('Cannot receive a payment for a cancelled trip.');
            }
            if (e.kind === 'trip' && e.status === 'cancelled' && tripTotals(effective, e).received > 0)
                throw new Error('Refund customer payments before cancelling this trip.');
            if (e.kind === 'partner' || e.kind === 'partnerTx') {
                const p = e.kind === 'partner' ? e : effective.find(x => x.id === e.partnerId)!;
                const tx = effective.filter(x => x.kind === 'partnerTx' && x.partnerId === p.id).sort((a, b) => a.date.localeCompare(b.date) || (a.type === 'contribution' ? -1 : 1));
                let balance = p.openingAmount || 0;
                for (const t of tx) {
                    balance += t.type === 'contribution' ? t.amount : t.type === 'repayment' ? -t.amount : 0;
                    if (balance < 0)
                        throw new Error('Repayment exceeds the amount owed to this partner on that date.');
                }
            }
            if (e.kind === 'expense' && e.category === 'emi') {
                const loan = effective.find(x => x.id === e.loanId)!;
                if (e.installment >= loan.total || e.installment < (loan.openingPaid || 0))
                    throw new Error('Select an unpaid loan instalment.');
                const total = effective.filter(x => x.kind === 'expense' && x.loanId === loan.id && x.installment === e.installment && x.category === 'emi').reduce((s, x) => s + x.amount, 0);
                if (total > loan.emi)
                    throw new Error('EMI payments exceed this instalment amount.');
            }
            if (old && e.kind === 'loan' && effective.some(x => x.kind === 'expense' && x.loanId === e.id) && ['emi', 'total', 'firstDue', 'openingPaid'].some(k => old[k] !== e[k]))
                throw new Error('Loan schedule cannot change after payments are recorded.');
            const due = validateDueSettlement(e, old, effective);
            if (due) {
                if (entries.some(entry => entry.id === due.id))
                    throw new Error('Save changes to the due item separately before recording its payment.');
                const changed = { ...due, paidDate: e.paymentDate || e.date };
                stmts.push(c.db.prepare('UPDATE records SET data=?,version=version+1,updated_at=? WHERE id=?').bind(JSON.stringify(changed), new Date().toISOString(), due.id));
                if (old?.linkedDueId !== due.id && due.repeat !== 'none') {
                    const next = { ...due, id: crypto.randomUUID(), dueDate: advanceDue(due.dueDate, due.repeat), paidDate: undefined, version: undefined };
                    stmts.push(c.db.prepare('INSERT INTO records(id,kind,data,version,updated_at) VALUES(?,?,?,1,?)').bind(next.id, 'due', JSON.stringify(next), new Date().toISOString()));
                }
            }
            if (e.kind === 'expense' && e.nextDue && !e.linkedDueId) {
                const dueId = `renewal-${e.id}`, existing = rs.find(x => x.id === dueId);
                if (existing?.paidDate && old?.nextDue !== e.nextDue)
                    throw new Error('Renewal is already paid. Add a new due item to change its schedule.');
                if (!existing?.paidDate) {
                    const due = { id: dueId, kind: 'due', name: e.description, category: e.category, amount: e.amount, dueDate: e.nextDue, repeat: e.repeat || 'none', vehicleId: e.vehicleId };
                    stmts.push(c.db.prepare('INSERT INTO records(id,kind,data,version,updated_at) VALUES(?,?,?,1,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data,version=records.version+1,updated_at=excluded.updated_at').bind(dueId, 'due', JSON.stringify(due), new Date().toISOString()));
                }
            }
            if (e.kind === 'expense' && old?.nextDue && !e.nextDue && !e.linkedDueId) {
                const prior = rs.find(x => x.id === `renewal-${e.id}`);
                if (prior && !prior.paidDate)
                    stmts.push(c.db.prepare('DELETE FROM records WHERE id=?').bind(prior.id));
            }
            const clean = { ...e };
            delete clean.version;
            stmts.push(old ? c.db.prepare('UPDATE records SET data=?,version=version+1,updated_at=? WHERE id=? AND version=?').bind(JSON.stringify(clean), new Date().toISOString(), e.id, old.version) : c.db.prepare('INSERT INTO records(id,kind,data,version,updated_at) VALUES(?,?,?,1,?)').bind(e.id, e.kind, JSON.stringify(clean), new Date().toISOString()));
            stmts.push(auditStatement(c.db, c.user.email, e.id, old ? 'updated' : 'created', old, clean));
        }
        await transact(c, stmts);
        return json({ ok: true });
    }
    catch (e: any) {
        if (e.issues)
            return json({ error: e.issues.map((x: any) => x.message).join('. ') }, 400);
        return error(e);
    }
}
