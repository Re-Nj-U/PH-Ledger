import { getUser } from '../../../lib/auth';
import { createClient } from '../../../lib/supabase/server';
import { startIdleSession, clearSessionCookies } from '../../../lib/idle-session';
import { IDLE_TIMEOUT_MS } from '../../../lib/idle-policy';
import { validateWriteRequest, readLedgerBody } from '../../../lib/request-security';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const json = (value: unknown, status = 200) => Response.json(value, { status, headers: { 'Cache-Control': 'private, no-store' } });
export async function GET() {
    try {
    const user = await getUser();
    return user ? json({ expiresAt: user.idleExpiresAt, serverNow: Date.now() }) : json({ error: 'Session expired. Please sign in again.' }, 401);
    } catch { return json({ error: 'Unable to check the session.' }, 503); }
}
export async function POST(request: Request) {
    try {
        validateWriteRequest(request);
        const body = await readLedgerBody(request);
        if (body?.action === 'logout') {
            try { await (await createClient()).auth.signOut({ scope: 'local' }); } finally { await clearSessionCookies(); }
            return json({ ok: true });
        }
        if (body?.action !== 'activity') return json({ error: 'Invalid session request.' }, 400);
        // This checks the existing signed deadline first. An expired session cannot be revived.
        const user = await getUser();
        if (!user || user.idleExpiresAt <= Date.now()) return json({ error: 'Session expired. Please sign in again.' }, 401);
        const now = await startIdleSession(user.userId, user.sessionId, user.idleExpiresAt);
        return json({ expiresAt: now + IDLE_TIMEOUT_MS, serverNow: now });
    } catch (failure: any) {
        const matched = String(failure.message).match(/^(401|403|413|415|503):/);
        const status = matched ? Number(matched[1]) : 400;
        return json({ error: 'Unable to update the session. Please sign in again.' }, status);
    }
}
