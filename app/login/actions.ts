'use server';
import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';

export type LoginState = { error: string };
export async function signIn(_previous: LoginState, form: FormData): Promise<LoginState> {
    const email = String(form.get('email') || '').trim();
    const password = String(form.get('password') || '');
    if (!email || !password) return { error: 'Enter your email and password.' };
    try {
        const supabase = await createClient();
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { error: 'Unable to sign in. Check your email and password or contact the owner.' };
    } catch { return { error: 'Sign-in is unavailable. Ask the owner to check deployment settings.' }; }
    redirect('/');
}

export async function signOut() {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error('Unable to sign out. Please try again.');
    redirect('/login');
}
