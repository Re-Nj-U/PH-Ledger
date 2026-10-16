import 'server-only';
import { createClient } from './supabase/server';

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
