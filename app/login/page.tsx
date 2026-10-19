import Link from 'next/link';
import { Van, ShieldCheck } from 'lucide-react';
import LoginForm from './login-form';

export const dynamic = 'force-dynamic';
export default async function Login({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
    const expired = (await searchParams).reason === 'inactive';
    const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
    return <main className="auth-shell"><section className="auth-card">
        <div className="auth-brand"><Van size={28}/><span>PIKU Holidays</span></div>
        <span className="eyebrow">YOUR BUSINESS LEDGER</span><h1>Welcome back<span className="title-dot">.</span></h1>
        <p className="auth-intro">Sign in to manage trips, payments and partner balances.</p>
        {!configured && <p className="auth-error" role="alert">Sign-in setup is pending. Add the Supabase project URL and publishable key in the hosting settings.</p>}
        <>{expired && <p className="auth-error" role="status">Your session ended. Please sign in again. Sessions end after 30 minutes without activity.</p>}<LoginForm configured={configured}/></>
        <div className="auth-footer"><ShieldCheck size={16}/><span>Your ledger is shared only with approved accounts.</span></div>
        <Link href="/" className="text-button">Back to the ledger</Link>
    </section></main>;
}
