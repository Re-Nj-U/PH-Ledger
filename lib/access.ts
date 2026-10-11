import type { LedgerDatabase } from './database';
import { defaultSettings } from './ledger';

type VerifiedUser = { userId: string; email: string; displayName: string };
// Only call with a user validated by Supabase Auth, never request header values.
export async function resolveAccess(db: LedgerDatabase, user: VerifiedUser, configuredOwnerEmail: string | undefined) {
    let business = await db.prepare('SELECT * FROM business WHERE id=?').bind('main').first();
    if (!business) {
        const ownerEmail = configuredOwnerEmail?.trim().toLowerCase();
        if (!ownerEmail) throw new Error('503:Owner email is not configured.');
        if (user.email !== ownerEmail) throw new Error('403:The owner must initialize this business first.');
        await db.prepare('INSERT INTO business(id,owner_id,settings) VALUES(?,?,?) ON CONFLICT(id) DO NOTHING')
            .bind('main', user.userId, JSON.stringify(defaultSettings)).run();
        business = await db.prepare('SELECT * FROM business WHERE id=?').bind('main').first();
    }
    const owner = business.owner_id === user.userId;
    if (owner) await db.prepare('INSERT INTO members(email,name,role,active) VALUES(?,?,?,1) ON CONFLICT(email) DO NOTHING')
        .bind(user.email, user.displayName, 'owner').run();
    const member = await db.prepare('SELECT * FROM members WHERE email=?').bind(user.email).first();
    if (!owner && (!member || !member.active || member.role !== 'partner'))
        throw new Error('403:Your account has not been added to this business. Ask the owner for access.');
    return { db, user, owner, settings: JSON.parse(business.settings), member, revision: business.revision };
}
