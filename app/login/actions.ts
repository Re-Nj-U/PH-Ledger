'use server';
import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';
import { startIdleSession, clearSessionCookies } from '../../lib/idle-session';

export type LoginState = { error: string };
export async function signIn(_previous: LoginState, form: FormData): Promise<LoginState> {
    const email = String(form.get('email') || '').trim();
    const password = String(form.get('password') || '');
    if (!email || !password) return { error: 'Enter your email and password.' };
    try {
        const supabase = await createClient();
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error || !data.user || !data.session) return { error: 'Unable to sign in. Check your email and password or contact the owner.' };
        const { data: verified, error: claimsError } = await supabase.auth.getClaims(data.session.access_token);
        const sessionId = verified?.claims.session_id;
        if (claimsError || verified?.claims.sub !== data.user.id || typeof sessionId !== 'string') { await clearSessionCookies(); return { error: 'Unable to start a secure session. Please try again.' }; }
        await startIdleSession(data.user.id, sessionId);
    } catch { return { error: 'Sign-in is unavailable. Ask the owner to check deployment settings.' }; }
    redirect('/');
}

export async function signOut() {
    try { await (await createClient()).auth.signOut(); }
    catch { /* Always end local access, even if the Auth provider is unavailable. */ }
    finally { await clearSessionCookies(); }
    redirect('/login');
}
