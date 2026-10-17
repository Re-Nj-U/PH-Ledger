import { readFile, stat } from 'node:fs/promises';
import postgres from 'postgres';
import { postgresOptions } from '../lib/postgres-options.mjs';
import { LedgerDatabase } from '../lib/database.ts';
import { importLedger } from '../lib/import-ledger.ts';

const filename = process.argv[2];
if (!filename || !process.env.DATABASE_URL || !process.env.OWNER_EMAIL)
    throw new Error('Usage: npm run db:import -- /absolute/path/to/real-backup.json after completing .env.local and signing in as owner.');
if ((await stat(filename)).size > 3000000) throw new Error('Use a backup smaller than 3 MB.');
let sql: ReturnType<typeof postgres> | undefined;
try {
    sql = postgres(process.env.DATABASE_URL, postgresOptions());
    const client = sql;
    const db = new LedgerDatabase({
        query: async (text, values = []) => Array.from(await client.unsafe(text, values as any[])),
        transaction: async work => {
            const result = await client.begin(async tx => work(async (text, values = []) => Array.from(await tx.unsafe(text, values as any[]))));
            return result as Awaited<ReturnType<typeof work>>;
        },
    });
    const business = await db.prepare('SELECT revision FROM business WHERE id=?').bind('main').first();
    if (!business) throw new Error('Sign in to the deployed application as the owner before importing.');
    const email = process.env.OWNER_EMAIL.trim().toLowerCase();
    const owner = await db.prepare('SELECT role FROM members WHERE email=?').bind(email).first();
    if (owner?.role !== 'owner') throw new Error('OWNER_EMAIL does not match the initialized owner.');
    const count = await importLedger(db, JSON.parse(await readFile(filename, 'utf8')), business.revision, email);
    console.log(`Imported ${count} business records. Check monthly reports, cash and partner balances before switching sites.`);
} catch (error: any) {
    console.error(error.code || error.severity ? 'Database operation failed. Check your connection and database setup.' : error.message);
    process.exitCode = 1;
} finally { await sql?.end(); }
