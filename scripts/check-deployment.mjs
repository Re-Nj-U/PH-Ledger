import postgres from 'postgres';
import { createClient } from '@supabase/supabase-js';

const required = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'DATABASE_URL', 'OWNER_EMAIL'];
const missing = required.filter(name => !process.env[name] || /YOUR-PROJECT|YOUR-PUBLISHABLE|YOUR-POOLER|YOUR-ENCODED/.test(process.env[name]));
if (missing.length) {
    console.error(`Finish these variables in .env.local: ${missing.join(', ')}`);
    process.exit(1);
}
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(process.env.OWNER_EMAIL)) {
    console.error('OWNER_EMAIL must be a valid email address.'); process.exit(1);
}
const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1, ssl: 'require', connect_timeout: 10 });
try {
    const rows = await sql`SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='ledger'`;
    for (const name of ['business', 'members', 'records', 'audit'])
        if (!rows.some(row => row.tablename === name && row.rowsecurity)) throw new Error('schema');
    const [{ allowed }] = await sql`SELECT has_schema_privilege('anon', 'ledger', 'USAGE') OR has_schema_privilege('authenticated', 'ledger', 'USAGE') AS allowed`;
    if (allowed) throw new Error('access');
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
    const { error } = await supabase.auth.getSession();
    // getSession above merely exercises SDK configuration; test the remote Auth service too.
    if (error) throw new Error('auth');
    const response = await fetch(new URL('/auth/v1/settings', process.env.NEXT_PUBLIC_SUPABASE_URL), { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY } });
    if (!response.ok) throw new Error('auth');
    const settings = await response.json();
    if (settings.disable_signup !== true) {
        console.error('Disable public user signups in Supabase Authentication before going live.');
        process.exitCode = 1;
    } else console.log('Database schema, private-table access and Supabase Auth configuration checks passed.');
    console.log('Next: verify owner/partner sign-in and migrated balances in the deployed application.');
} catch {
    console.error('Deployment check failed. Verify the Supabase URL, publishable key, pooler URI and schema.sql setup. Credentials were not printed.');
    process.exitCode = 1;
} finally { await sql.end(); }
