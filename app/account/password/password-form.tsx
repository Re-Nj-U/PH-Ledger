'use client';
import { useActionState } from 'react';
import { changePassword } from './actions';

export default function PasswordForm() {
    const [state, action, pending] = useActionState(changePassword, { error: '', success: false });
    return <form action={action} className="auth-form">
        <label className="field"><span>Current password</span><input name="current" type="password" autoComplete="current-password" required/></label>
        <label className="field"><span>New password</span><input name="password" type="password" autoComplete="new-password" minLength={12} required/></label>
        <label className="field"><span>Confirm new password</span><input name="confirm" type="password" autoComplete="new-password" minLength={12} required/></label>
        {state.error && <p className="auth-error" role="alert">{state.error}</p>}
        {state.success && <p role="status">Your password has been updated.</p>}
        <button className="button" disabled={pending}>{pending ? 'Updating…' : 'Update password'}</button>
    </form>;
}
