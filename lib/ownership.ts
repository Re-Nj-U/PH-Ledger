import { z } from 'zod';
import type { LedgerDatabase } from './database';

const email = z.string().trim().toLowerCase().email().max(254);
export const ownershipTransferSchema = z.object({
    email, confirmEmail: email, confirmed: z.literal(true), password: z.string().min(1).max(1024),
}).strict().refine(value => value.email === value.confirmEmail, 'The confirmation email must match the new owner.');

type User = { userId: string; email: string; displayName: string };
type PasswordClient = { auth: {
    signInWithPassword: (credentials: { email: string; password: string }) => Promise<any>;
    signOut: (options: { scope: 'local' }) => Promise<any>;
} };

export async function changeBusinessOwner(context: { db: LedgerDatabase; user: User; owner: boolean; revision: number }, input: unknown, verifyPassword: (user: User, password: string) => Promise<void>) {
    if (!context.owner) throw new Error('403:Only the current owner can transfer ownership.');
    const parsed = ownershipTransferSchema.safeParse(input);
    if (!parsed.success) throw new Error('400:Select the new owner, type their matching email, enter your current password and confirm the role change.');
    const { email, password } = parsed.data;
    if (email === context.user.email) throw new Error('400:Choose another active partner as the new owner.');
    await verifyPassword(context.user, password);
    await transferOwnership(context.db, context.user, email, context.revision);
}

// Use a separate non-persisting client: never replace the browser's existing session.
export async function confirmOwnerPassword(client: PasswordClient, user: User, password: string) {
    try {
        const { data, error } = await client.auth.signInWithPassword({ email: user.email, password });
        if (error || data?.user?.id !== user.userId || !data.user.email_confirmed_at)
            throw new Error('403:Check your current password and try again.');
    } catch {
        throw new Error('403:Check your current password and try again.');
    } finally {
        // Revoke only the short-lived verification session, never other devices.
        try { await client.auth.signOut({ scope: 'local' }); } catch { /* No credentials are logged or retained. */ }
    }
}

export async function transferOwnership(db: LedgerDatabase, user: User, recipientEmail: string, expectedRevision: number) {
    const recipient = email.parse(recipientEmail);
    if (recipient === user.email) throw new Error('400:Choose another active partner as the new owner.');
    await db.backend.transaction(async query => {
        const [business] = await query('SELECT owner_id,revision FROM ledger.business WHERE id=$1 FOR UPDATE', ['main']);
        if (!business || business.owner_id !== user.userId) throw new Error('403:Only the current owner can transfer ownership.');
        if (business.revision !== expectedRevision) throw new Error('409:The ledger changed. Refresh and try again.');
        const [member] = await query('SELECT email,name,role,active FROM ledger.members WHERE email=$1 FOR UPDATE', [recipient]);
        if (!member || member.role !== 'partner' || member.active !== 1)
            throw new Error('400:Choose an active partner from People & permissions.');
        // Resolve the recipient on the server. Never accept an Auth ID from the browser.
        const accounts = await query('SELECT id::text AS id,email_confirmed_at,last_sign_in_at,deleted_at,banned_until FROM auth.users WHERE lower(email)=$1 FOR SHARE', [recipient]);
        const target = accounts[0];
        if (accounts.length !== 1 || !target.email_confirmed_at || !target.last_sign_in_at || target.deleted_at || target.banned_until && new Date(target.banned_until).getTime() > Date.now())
            throw new Error('400:The new owner must have a confirmed Supabase account and sign in successfully at least once.');
        if (target.id === user.userId) throw new Error('400:Choose a different login account.');
        // All role changes, the pinned Auth ID and audit history commit or roll back together.
        await query("UPDATE ledger.members SET role='partner' WHERE role='owner'");
        await query("INSERT INTO ledger.members(email,name,role,active) VALUES($1,$2,'partner',1) ON CONFLICT(email) DO UPDATE SET role='partner',active=1", [user.email, user.displayName]);
        await query("UPDATE ledger.members SET role='owner',active=1 WHERE email=$1", [recipient]);
        await query('UPDATE ledger.business SET owner_id=$1,revision=revision+1 WHERE id=$2', [target.id, 'main']);
        await query('INSERT INTO ledger.audit(id,record_id,action,actor,at,before,after) VALUES($1,$2,$3,$4,$5,$6,$7)', [
            crypto.randomUUID(), 'business', 'ownership transferred', user.email, new Date().toISOString(),
            JSON.stringify({ ownerEmail: user.email }), JSON.stringify({ ownerEmail: recipient, previousOwnerRole: 'partner' }),
        ]);
    });
}
