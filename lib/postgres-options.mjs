import { X509Certificate } from 'node:crypto';

/** Shared server-only options for the application and local database tools. */
export function postgresOptions(env = process.env) {
    const ca = env.DATABASE_SSL_CA?.replace(/\\n/g, '\n').trim();
    if (ca) {
        try { new X509Certificate(ca); }
        catch { throw new Error('503:DATABASE_SSL_CA must contain the Supabase database CA certificate in PEM format.'); }
    }
    return {
        prepare: false, max: 1, max_pipeline: 1,
        ssl: { rejectUnauthorized: true, ...(ca ? { ca } : {}) },
        idle_timeout: 20, connect_timeout: 10,
    };
}
