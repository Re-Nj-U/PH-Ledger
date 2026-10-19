'use client';
import { useState } from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';
import type { Member } from '../lib/ledger';

export default function OwnershipTransfer({ members, currentEmail, demo, onTransfer }: {
    members: Member[]; currentEmail: string; demo: boolean;
    onTransfer: (transfer: { email: string; confirmEmail: string; confirmed: boolean; password: string }) => Promise<void>;
}) {
    const [open, setOpen] = useState(false), [recipient, setRecipient] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('');
    const candidates = members.filter(member => member.role === 'partner' && member.active === 1 && member.email !== currentEmail);
    return <section className="panel settings-panel ownership-panel">
        <div className="panel-heading"><div><h2>Business owner</h2><p>{currentEmail}</p></div><ShieldCheck size={20}/></div>
        <p className="ownership-description">Transfer ownership to an active partner. Your account will remain a partner for daily transactions.</p>
        {!open ? <button className="button secondary" disabled={demo} onClick={() => setOpen(true)}>Transfer ownership</button> : <form className="ownership-form" onSubmit={async event => {
            event.preventDefault(); if (busy || demo) return;
            const form = event.currentTarget, values = new FormData(form);
            const password = form.elements.namedItem('password') as HTMLInputElement;
            setBusy(true); setError('');
            try {
                await onTransfer({ email: recipient, confirmEmail: String(values.get('confirmEmail') || ''), confirmed: values.get('confirmed') === 'on', password: String(values.get('password') || '') });
            } catch (failure: any) { setError(failure.message || 'Unable to transfer ownership. Please try again.'); }
            finally { password.value = ''; setBusy(false); }
        }}>
            <label className="field"><span>New owner</span><select required value={recipient} disabled={busy} onChange={event => { setRecipient(event.target.value); setError(''); }}><option value="">Select an active partner</option>{candidates.map(member => <option key={member.email} value={member.email}>{member.name} · {member.email}</option>)}</select></label>
            {!candidates.length && <p className="form-note">Add and activate the new email in People & permissions first.</p>}
            <p className="monthly-footnote">The new owner must have a confirmed login account and sign in successfully once before the transfer.</p>
            {recipient && <>
                <div className="form-note ownership-consequence"><ShieldCheck size={18}/><span><strong>{recipient}</strong> will manage users and business settings. <strong>{currentEmail}</strong> will become a partner. Trips and financial records stay in place.</span></div>
                <label className="field"><span>Type the new owner’s email to confirm</span><input name="confirmEmail" type="email" required autoComplete="off" disabled={busy}/></label>
                <label className="field"><span>Your current password</span><input name="password" type="password" required maxLength={1024} autoComplete="current-password" disabled={busy}/></label>
                <label className="checkbox-field"><input name="confirmed" type="checkbox" required disabled={busy}/><span>I understand that my account will become a partner.</span></label>
            </>}
            {error && <p className="form-error" role="alert">{error}</p>}
            <div className="ownership-buttons"><button className="button secondary" type="button" disabled={busy} onClick={() => { setOpen(false); setRecipient(''); setError(''); }}>Cancel</button><button className="button" type="submit" disabled={busy || !recipient}>{busy && <Loader2 size={16} className="spin"/>}{busy ? 'Transferring…' : 'Confirm ownership transfer'}</button></div>
        </form>}
        {demo && <p className="monthly-footnote">Ownership transfer is available in your business ledger.</p>}
    </section>;
}
