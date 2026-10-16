'use client';
import { useActionState } from 'react';
import { signIn } from './actions';

export default function LoginForm({ configured }: { configured: boolean }) {
    const [state, action, pending] = useActionState(signIn, { error: '' });
    return <form action={action} className="auth-form">
        <label className="field"><span>Email address</span><input name="email" type="email" autoComplete="username" required disabled={!configured}/></label>
        <label className="field"><span>Password</span><input name="password" type="password" autoComplete="current-password" required disabled={!configured}/></label>
        {state.error && <p className="auth-error" role="alert">{state.error}</p>}
        <button className="button" type="submit" disabled={pending || !configured}>{pending ? 'Signing in…' : 'Sign in'}</button>
        <p className="muted small-copy">Access is for the owner and approved partners. For an account or a forgotten password, contact the business owner.</p>
    </form>;
}
