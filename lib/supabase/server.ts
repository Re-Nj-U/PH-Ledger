import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) throw new Error('503:Sign-in is not configured. Ask the owner to finish deployment setup.');
    const cookieStore = await cookies();
    return createServerClient(url, key, {
        cookies: {
            getAll: () => cookieStore.getAll(),
            setAll: values => {
                // Server Components cannot set cookies; proxy refreshes those.
                try { values.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); }
                catch { /* Only needed in read-only Server Component rendering. */ }
            },
        },
    });
}
