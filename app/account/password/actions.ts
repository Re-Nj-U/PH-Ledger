'use server';
import { createClient } from '../../../lib/supabase/server';
import { getUser, verifyOwnerPassword } from '../../../lib/auth';

export async function changePassword(_previous: { error: string; success: boolean }, form: FormData) {
    const password = String(form.get('password') || '');
    const current = String(form.get('current') || '');
    if (!current) return { error: 'Enter your current password.', success: false };
    if (password.length < 12) return { error: 'Use a password with at least 12 characters.', success: false };
    if (password !== form.get('confirm')) return { error: 'The new passwords do not match.', success: false };
    try {
        const supabase = await createClient();
        const user = await getUser();
        if (!user) return { error: 'Sign in before changing your password.', success: false };
        // Isolated verification keeps the existing session ID and idle deadline intact.
        await verifyOwnerPassword(user, current);
        const { error } = await supabase.auth.updateUser({ password, current_password: current });
        if (error) return { error: 'Unable to update the password. Check your current password and try again.', success: false };
        return { error: '', success: true };
    } catch { return { error: 'Password update is unavailable. Please try again.', success: false }; }
}
