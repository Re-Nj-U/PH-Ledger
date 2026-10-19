import 'server-only';
import { createClient } from './supabase/server';
import { createClient as createAuthClient } from '@supabase/supabase-js';
import { confirmOwnerPassword } from './ownership';

export async function verifyOwnerPassword(user: { userId: string; email: string; displayName: string }, password: string) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) throw new Error('503:Sign-in is not configured.');
    const client = createAuthClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
    await confirmOwnerPassword(client, user, password);
}

export async function getUser() {
    const supabase = await createClient();
    // getUser validates with Supabase Auth; request headers and local cookies
    // alone are never accepted as proof of identity.
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user?.email || !user.email_confirmed_at) return null;
    return {
        userId: user.id,
        email: user.email.trim().toLowerCase(),
        displayName: typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name.slice(0, 100) : user.email,
    };
}
