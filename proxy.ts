import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { authCookieOptions } from './lib/supabase/cookie-options';
import { idleCookieOptions, readIdleCookie, matchesIdleIdentity, sessionCookieNames, clearedCookieOptions } from './lib/idle-cookie';

export async function proxy(request: NextRequest) {
    let response = NextResponse.next({ request });
    response.headers.set('Cache-Control', 'private, no-store');
    // A successful password sign-in creates a new activity cookie in its Server Action.
    if (request.nextUrl.pathname === '/login' && request.method === 'POST') return response;
    const rejectIdle = () => {
        const names = sessionCookieNames(request.cookies.getAll().map(cookie => cookie.name));
        names.forEach(name => request.cookies.delete(name));
        const target = new URL(names.length ? '/login?reason=inactive' : '/login', request.url);
        const denied = request.nextUrl.pathname.startsWith('/api/')
            ? NextResponse.json({ error: 'Session expired. Please sign in again.', code: 'SESSION_EXPIRED' }, { status: 401 })
            : request.nextUrl.pathname === '/login' ? NextResponse.next({ request }) : NextResponse.redirect(target, 303);
        names.forEach(name => denied.cookies.set(name, '', clearedCookieOptions()));
        denied.headers.set('Cache-Control', 'private, no-store');
        return denied;
    };
    const idle = readIdleCookie(request.cookies.get(idleCookieOptions().name)?.value);
    if (!idle) return rejectIdle();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) return response;
    const supabase = createServerClient(url, key, {
        cookieOptions: authCookieOptions(),
        cookies: {
            getAll: () => request.cookies.getAll(),
            setAll: values => {
                values.forEach(({ name, value }) => request.cookies.set(name, value));
                response = NextResponse.next({ request });
                values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
            },
        },
    });
    const { data, error } = await supabase.auth.getClaims();
    if (error || !matchesIdleIdentity(idle, String(data?.claims.sub || ''), data?.claims.session_id)) return rejectIdle();
    response.headers.set('Cache-Control', 'private, no-store');
    return response;
}

export const config = { matcher: ['/', '/login', '/account/password', '/api/ledger'] };
