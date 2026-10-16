import { readFile } from 'node:fs/promises';
import postgres from 'postgres';

if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL in .env.local first.');
const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1, ssl: 'require' });
try {
    await sql.unsafe(await readFile(new URL('../supabase/schema.sql', import.meta.url), 'utf8'));
    console.log('Ledger database schema is ready. No existing records were removed.');
} catch {
    console.error('Database setup failed. Check the pooler URI, password and SQL Editor permissions.');
    process.exitCode = 1;
} finally { await sql.end(); }
