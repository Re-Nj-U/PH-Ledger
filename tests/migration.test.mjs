import { strict as assert } from 'node:assert';
import { test, before, after, beforeEach } from 'node:test';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { LedgerDatabase } from '../lib/database.ts';
import { validateBackup } from '../lib/import-backup.ts';
import { importLedger } from '../lib/import-ledger.ts';
import { monthly } from '../lib/ledger.ts';
import { resolveAccess } from '../lib/access.ts';

let pg, db;
const settings = { name: 'Migration test', startDate: '2026-01-01', openingCash: 100000, reserve: 0 };
const backup = {
    sample: false, exportedAt: '2026-02-10T12:00:00.000Z', settings,
    records: [
        { id: 'v', kind: 'vehicle', name: 'Van', registration: 'TEST-001' },
        { id: 't', kind: 'trip', name: 'February trip', vehicleId: 'v', start: '2026-02-01', end: '2026-02-02', odoStart: 1000, odoEnd: 1500, amount: 300000, status: 'completed' },
        { id: 'e', kind: 'expense', category: 'diesel', description: 'Diesel', tripId: 't', amount: 100000, date: '2026-02-01', paid: true },
        { id: 'p', kind: 'payment', tripId: 't', amount: 200000, date: '2026-02-02', type: 'receipt', method: 'Cash' },
        { id: 'partner', kind: 'partner', name: 'Partner A', openingAmount: 0 },
        { id: 'contribution', kind: 'partnerTx', partnerId: 'partner', amount: 50000, date: '2026-02-03', type: 'contribution' },
    ],
};
before(async () => {
    pg = await PGlite.create();
    await pg.exec('CREATE ROLE anon; CREATE ROLE authenticated;');
    await pg.exec(await readFile(new URL('../supabase/schema.sql', import.meta.url), 'utf8'));
    db = new LedgerDatabase({
        query: async (text, values = []) => (await pg.query(text, values)).rows,
        transaction: work => pg.transaction(tx => work(async (text, values = []) => (await tx.query(text, values)).rows)),
    });
});
after(async () => { await pg.close(); });
beforeEach(async () => {
    await pg.exec('TRUNCATE ledger.audit, ledger.records, ledger.members, ledger.business;');
    await db.prepare('INSERT INTO business(id,owner_id,settings) VALUES(?,?,?)').bind('main', 'supabase-owner-id', JSON.stringify(settings)).run();
});
test('business tables are private and inaccessible to public authenticated roles', async () => {
    const access = await pg.query("SELECT has_schema_privilege('anon','ledger','USAGE') AS anon, has_schema_privilege('authenticated','ledger','USAGE') AS authenticated");
    assert.equal(access.rows[0].anon, false); assert.equal(access.rows[0].authenticated, false);
    const tables = await pg.query("SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='ledger'");
    assert.equal(tables.rows.length, 4); assert.ok(tables.rows.every(row => row.rowsecurity));
});
test('bound user text cannot execute SQL and statements address the private schema', async () => {
    const name = "O'Brien'); DROP TABLE ledger.records; --";
    await db.prepare('INSERT INTO members(email,name,role,active) VALUES(?,?,?,1)').bind('partner@example.com', name, 'partner').run();
    assert.equal((await db.prepare('SELECT name FROM members WHERE email=?').bind('partner@example.com').first()).name, name);
    assert.equal((await db.prepare('SELECT COUNT(*)::integer AS count FROM records').first()).count, 0);
});
test('failed multi-record writes roll back records, audit and revision together', async () => {
    const one = db.prepare('INSERT INTO records(id,kind,data,updated_at) VALUES(?,?,?,?)').bind('duplicate','vehicle','{}','now');
    const audit = db.prepare('INSERT INTO audit(id,record_id,action,actor,at) VALUES(?,?,?,?,?)').bind('a','duplicate','created','owner','now');
    await assert.rejects(db.batch([one, audit, one], 1));
    assert.equal((await db.prepare('SELECT COUNT(*)::integer AS count FROM records').first()).count, 0);
    assert.equal((await db.prepare('SELECT COUNT(*)::integer AS count FROM audit').first()).count, 0);
    assert.equal((await db.prepare('SELECT revision FROM business').first()).revision, 1);
});
test('a stale ledger snapshot cannot write after another committed edit', async () => {
    const statement = id => db.prepare('INSERT INTO records(id,kind,data,updated_at) VALUES(?,?,?,?)').bind(id,'vehicle','{}','now');
    await db.batch([statement('first')], 1);
    await assert.rejects(db.batch([statement('stale')], 1), /409/);
    assert.deepEqual((await db.prepare('SELECT id FROM records').all()).results.map(row => row.id), ['first']);
});
test('import preserves owner identity and financial totals, and cannot overwrite records', async () => {
    assert.equal(await importLedger(db, backup, 1, 'owner@example.com'), backup.records.length);
    const data = (await db.prepare('SELECT data,version FROM records').all()).results.map(row => ({ ...JSON.parse(row.data), version: row.version }));
    assert.deepEqual(monthly(data, settings, '2026-02'), monthly(backup.records, settings, '2026-02'));
    assert.equal((await db.prepare('SELECT owner_id,revision FROM business').first()).owner_id, 'supabase-owner-id');
    await assert.rejects(importLedger(db, backup, 2, 'owner@example.com'), /empty ledger/);
});
test('sample, duplicate, broken-reference and over-repayment backups are rejected before writing', () => {
    assert.throws(() => validateBackup({ ...backup, sample: true }));
    assert.throws(() => validateBackup({ ...backup, records: [...backup.records, backup.records[0]] }), /duplicate/);
    assert.throws(() => validateBackup({ ...backup, records: backup.records.filter(record => record.id !== 'v') }), /reference/);
    assert.throws(() => validateBackup({ ...backup, records: [...backup.records, { id:'repay',kind:'partnerTx',partnerId:'partner',amount:60000,date:'2026-02-04',type:'repayment' }] }), /partner debt/);
});
test('legacy renewal upsert syntax works in PostgreSQL without changing record relationships', async () => {
    const statement = amount => db.prepare('INSERT INTO records(id,kind,data,version,updated_at) VALUES(?,?,?,1,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data,version=records.version+1,updated_at=excluded.updated_at').bind('renewal','due',JSON.stringify({ amount }), 'now');
    await db.batch([statement(100)], 1); await db.batch([statement(200)], 2);
    const row = await db.prepare('SELECT data,version FROM records WHERE id=?').bind('renewal').first();
    assert.equal(row.version, 2); assert.equal(JSON.parse(row.data).amount, 200);
});
test('only the configured owner can initialize a fresh business', async () => {
    await pg.exec('TRUNCATE ledger.business;');
    const stranger = { userId:'stranger', email:'other@example.com', displayName:'Other' };
    await assert.rejects(resolveAccess(db, stranger, 'owner@example.com'), /403/);
    assert.equal((await db.prepare('SELECT COUNT(*)::integer AS count FROM business').first()).count, 0);
    const owner = { userId:'owner-id', email:'owner@example.com', displayName:'Owner' };
    assert.equal((await resolveAccess(db, owner, ' OWNER@EXAMPLE.COM ')).owner, true);
});
test('unapproved or inactive authenticated users cannot access business data', async () => {
    const partner = { userId:'partner-id',email:'partner@example.com',displayName:'Partner' };
    await assert.rejects(resolveAccess(db, partner, 'owner@example.com'), /403/);
    await db.prepare('INSERT INTO members(email,name,role,active) VALUES(?,?,?,?)').bind(partner.email,'Partner','partner',0).run();
    await assert.rejects(resolveAccess(db, partner, 'owner@example.com'), /403/);
    await db.prepare('UPDATE members SET active=1 WHERE email=?').bind(partner.email).run();
    assert.equal((await resolveAccess(db, partner, 'owner@example.com')).owner, false);
});
test('changing bootstrap email or recreating an owner Auth ID cannot transfer ownership', async () => {
    const owner = { userId:'supabase-owner-id',email:'owner@example.com',displayName:'Owner' };
    assert.equal((await resolveAccess(db, owner, 'new@example.com')).owner, true);
    await assert.rejects(resolveAccess(db, { ...owner, userId:'different-owner-id' }, 'owner@example.com'), /403/);
    await assert.rejects(resolveAccess(db, { userId:'new',email:'new@example.com',displayName:'New' }, 'new@example.com'), /403/);
});
