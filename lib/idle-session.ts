import 'server-only';
import { cookies } from 'next/headers';
import { idleCookieOptions, signIdleCookie, sessionCookieNames, clearedCookieOptions } from './idle-cookie';

export async function startIdleSession(userId: string, sessionId: string, previousDeadline?: number) {
    const jar = await cookies(), now = Date.now();
    if (previousDeadline != null && now >= previousDeadline) throw new Error('401:Session expired. Please sign in again.');
    jar.set(idleCookieOptions().name, signIdleCookie(userId, sessionId, now), idleCookieOptions());
    return now;
}
export async function clearSessionCookies() {
    const jar = await cookies();
    for (const name of sessionCookieNames(jar.getAll().map(cookie => cookie.name)))
        jar.set(name, '', clearedCookieOptions());
}
