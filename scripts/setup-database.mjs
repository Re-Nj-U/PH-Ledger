import { readFile } from 'node:fs/promises';
import postgres from 'postgres';
import { postgresOptions } from '../lib/postgres-options.mjs';

if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL in .env.local first.');
let sql;
try {
    sql = postgres(process.env.DATABASE_URL, postgresOptions());
    await sql.unsafe(await readFile(new URL('../supabase/schema.sql', import.meta.url), 'utf8'));
    console.log('Ledger database schema is ready. No existing records were removed.');
} catch {
    console.error('Database setup failed. Check the pooler URI, password and SQL Editor permissions.');
    process.exitCode = 1;
} finally { await sql?.end(); }
