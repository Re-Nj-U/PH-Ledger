import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getUser } from '../../../lib/auth';
import PasswordForm from './password-form';
import IdleSession from '../../idle-session';

export const dynamic = 'force-dynamic';
export default async function PasswordPage() {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) redirect('/login');
    const user = await getUser();
    if (!user) redirect('/login');
    return <IdleSession initial={{ expiresAt: user.idleExpiresAt, serverNow: Date.now() }}><main className="auth-shell"><section className="auth-card"><h1>Change password</h1>
        <p className="auth-intro">Choose a password of at least 12 characters.</p><PasswordForm/>
        <Link href="/" className="text-button">Back to the ledger</Link>
    </section></main></IdleSession>;
}
