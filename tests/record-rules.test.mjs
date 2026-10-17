import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { rootCertificates } from 'node:tls';
import postgres from 'postgres';
import { assertRecordWriteAllowed, validateDueSettlement } from '../lib/record-rules.ts';
import { validateBackup } from '../lib/import-backup.ts';
import { postgresOptions } from '../lib/postgres-options.mjs';

const due = { id: 'due', kind: 'due', name: 'Tax', category: 'roadTax', amount: 10000, dueDate: '2026-01-10', repeat: 'monthly' };
const payment = { id: 'expense', kind: 'expense', category: 'roadTax', amount: 10000, description: 'Tax paid', date: '2026-01-10', paid: true, linkedDueId: 'due' };

test('partners cannot clear an opening flag, edit or delete an opening record, or alter setup', () => {
    const opening = { id: 'trip', kind: 'trip', opening: true };
    for (const entry of [opening, { ...opening, opening: false }, { ...opening, opening: undefined }])
        assert.throws(() => assertRecordWriteAllowed(false, entry, opening), /403/);
    for (const kind of ['vehicle', 'loan', 'partner'])
        assert.throws(() => assertRecordWriteAllowed(false, { id: 'setup', kind }), /403/);
    assert.doesNotThrow(() => assertRecordWriteAllowed(true, { ...opening, opening: false }, opening));
    for (const kind of ['trip', 'payment', 'expense', 'partnerTx', 'due'])
        assert.doesNotThrow(() => assertRecordWriteAllowed(false, { id: 'daily', kind }));
});
test('a due item cannot be paid by two expenses in one batch or by relinking an existing expense', () => {
    const second = { ...payment, id: 'second' };
    for (const entry of [payment, second])
        assert.throws(() => validateDueSettlement(entry, undefined, [due, payment, second]), /409/);
    const paidDue = { ...due, paidDate: payment.date };
    assert.throws(() => validateDueSettlement(payment, { ...payment, linkedDueId: undefined }, [paidDue, payment]), /409/);
    assert.throws(() => validateDueSettlement(second, undefined, [paidDue, second]), /409/);
    assert.equal(validateDueSettlement(payment, payment, [paidDue, payment]), paidDue);
});
test('due settlement keeps its link, category and full paid amount', () => {
    assert.equal(validateDueSettlement(payment, undefined, [due, payment]), due);
    for (const linkedDueId of [undefined, 'other'])
        assert.throws(() => validateDueSettlement({ ...payment, linkedDueId }, payment, [due]), /cannot be detached/);
    for (const change of [{ category: 'insurance' }, { amount: 9999 }, { paid: false }])
        assert.throws(() => validateDueSettlement({ ...payment, ...change }, undefined, [due]), /category|full amount|marked paid/);
});
test('backup import rejects duplicate and mismatched settlements before writing', () => {
    const backup = { sample: false, exportedAt: '2026-02-01T00:00:00.000Z',
        settings: { name: 'Test', startDate: '2026-01-01', openingCash: 0, reserve: 0 },
        records: [{ ...due, paidDate: payment.date }, payment] };
    assert.doesNotThrow(() => validateBackup(backup));
    assert.throws(() => validateBackup({ ...backup, records: [...backup.records, { ...payment, id: 'second' }] }), /more than once/);
    assert.throws(() => validateBackup({ ...backup, records: [backup.records[0], { ...payment, category: 'insurance' }] }), /does not match/);
});
test('all database clients verify TLS and serialize queries even when the URI asks for weaker SSL', async () => {
    const options = postgresOptions({});
    assert.equal(options.ssl.rejectUnauthorized, true);
    assert.equal(options.max_pipeline, 1);
    assert.equal(options.prepare, false);
    const client = postgres('postgres://test:example@localhost:6543/test?sslmode=require', options);
    assert.equal(client.options.ssl.rejectUnauthorized, true);
    await client.end();
    assert.equal(postgresOptions({ DATABASE_SSL_CA: rootCertificates[0].replace(/\n/g, '\\n') }).ssl.ca, rootCertificates[0].trim());
    assert.throws(() => postgresOptions({ DATABASE_SSL_CA: 'invalid certificate' }), /503:DATABASE_SSL_CA/);
});
