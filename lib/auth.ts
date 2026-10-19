import 'server-only';
import { createClient } from './supabase/server';
import { createClient as createAuthClient } from '@supabase/supabase-js';
import { confirmOwnerPassword } from './ownership';
import { cookies } from 'next/headers';
import { idleCookieOptions, readIdleCookie, matchesIdleIdentity } from './idle-cookie';
import { IDLE_TIMEOUT_MS } from './idle-policy';

export async function verifyOwnerPassword(user: { userId: string; email: string; displayName: string }, password: string) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) throw new Error('503:Sign-in is not configured.');
    const client = createAuthClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
    await confirmOwnerPassword(client, user, password);
}

export async function getUser() {
    const jar = await cookies();
    const idle = readIdleCookie(jar.get(idleCookieOptions().name)?.value);
    if (!idle) return null;
    const supabase = await createClient();
    // getUser validates with Supabase Auth; request headers and local cookies
    // alone are never accepted as proof of identity.
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user?.email || !user.email_confirmed_at) return null;
    const { data: verified, error: claimsError } = await supabase.auth.getClaims();
    if (Date.now() >= idle.at + IDLE_TIMEOUT_MS || claimsError || !matchesIdleIdentity(idle, user.id, verified?.claims.session_id)) return null;
    return {
        userId: user.id,
        sessionId: idle.sessionId,
        idleExpiresAt: idle.at + IDLE_TIMEOUT_MS,
        email: user.email.trim().toLowerCase(),
        displayName: typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name.slice(0, 100) : user.email,
    };
}
