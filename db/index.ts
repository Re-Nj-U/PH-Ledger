import 'server-only';
import postgres from 'postgres';
import { postgresOptions } from '../lib/postgres-options.mjs';
import { LedgerDatabase, type Query } from '../lib/database';

let database: LedgerDatabase | undefined;
export function getDb() {
    if (database) return database;
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('503:Database is not configured. Ask the owner to finish deployment setup.');
    const sql = postgres(url, postgresOptions());
    database = new LedgerDatabase({
        query: async (text, values = []) => Array.from(await sql.unsafe(text, values as any[])),
        transaction: async work => {
            const result = await sql.begin(async transaction => {
                const query: Query = async (text, values = []) => Array.from(await transaction.unsafe(text, values as any[]));
                return await work(query);
            });
            return result as Awaited<ReturnType<typeof work>>;
        },
    });
    return database;
}
