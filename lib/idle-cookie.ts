import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { IDLE_TIMEOUT_MS } from './idle-policy';
import { authCookieOptions } from './supabase/cookie-options';

type IdleIdentity = { userId: string; sessionId: string; at: number };
export function idleCookieOptions(production = process.env.NODE_ENV === 'production') {
    return { ...authCookieOptions(production), name: production ? '__Host-piku-idle' : 'piku-idle', maxAge: IDLE_TIMEOUT_MS / 1000 };
}
function signingKey(env: { DATABASE_URL?: string }) {
    if (!env.DATABASE_URL) throw new Error('503:Database configuration is required for secure sign-in.');
    // Domain-separated key from an existing server-only secret. Never sent to the browser.
    // Rotating database credentials also invalidates old activity cookies.
    return createHash('sha256').update('piku:idle-cookie:v1\0').update(env.DATABASE_URL).digest();
}
export function signIdleCookie(userId: string, sessionId: string, now = Date.now(), env: { DATABASE_URL?: string } = { DATABASE_URL: process.env.DATABASE_URL }) {
    if (!userId || !sessionId) throw new Error('401:Please sign in again.');
    const value = Buffer.from(JSON.stringify({ userId, sessionId, at: now })).toString('base64url');
    return value + '.' + createHmac('sha256', signingKey(env)).update(value).digest('base64url');
}
export function readIdleCookie(value: string | undefined, now = Date.now(), env: { DATABASE_URL?: string } = { DATABASE_URL: process.env.DATABASE_URL }): IdleIdentity | null {
    if (!value || value.length > 1024) return null;
    const parts = value.split('.');
    if (parts.length !== 2 || !/^[A-Za-z0-9_-]+$/.test(parts[0]) || !/^[A-Za-z0-9_-]{43}$/.test(parts[1])) return null;
    const expected = createHmac('sha256', signingKey(env)).update(parts[0]).digest();
    const supplied = Buffer.from(parts[1], 'base64url');
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;
    try {
        const identity = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
        if (typeof identity.userId !== 'string' || !identity.userId || identity.userId.length > 100 || typeof identity.sessionId !== 'string' || !identity.sessionId || identity.sessionId.length > 100
            || !Number.isSafeInteger(identity.at) || identity.at < 0 || identity.at > now + 30_000 || now - identity.at >= IDLE_TIMEOUT_MS) return null;
        return identity;
    } catch { return null; }
}
export function matchesIdleIdentity(identity: IdleIdentity | null, userId: string, sessionId: unknown) {
    return !!identity && identity.userId === userId && identity.sessionId === sessionId;
}

// Only delete this application's cookies, including Supabase's chunked cookies.
export function sessionCookieNames(names: string[], production = process.env.NODE_ENV === 'production') {
    const auth = authCookieOptions(production).name, idle = idleCookieOptions(production).name;
    return names.filter(name => name === auth || name.startsWith(auth + '.') || name === idle);
}

export function clearedCookieOptions(production = process.env.NODE_ENV === 'production') {
    const { name: _name, ...options } = authCookieOptions(production);
    return { ...options, maxAge: 0 };
}
