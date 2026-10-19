'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Clock, Loader2 } from 'lucide-react';
import { IdleTimer, type SessionDeadline } from '../lib/idle-timer';

async function sessionRequest(activity: boolean): Promise<SessionDeadline | null> {
    const response = await fetch('/api/session', activity ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'activity' }), cache: 'no-store', signal: AbortSignal.timeout(5000) } : { cache: 'no-store', signal: AbortSignal.timeout(5000) });
    if (response.status === 401) return null;
    if (!response.ok) throw new Error('Unable to check your session. Check your connection.');
    const status = await response.json();
    if (!Number.isFinite(status.expiresAt) || !Number.isFinite(status.serverNow)) throw new Error('Unable to check your session.');
    return status;
}

export function SessionWarning({ seconds, busy, error, onStay, onSignOut }: { seconds: number; busy: boolean; error: string; onStay: () => void; onSignOut: () => void }) {
    return <><span className="round-icon primary"><Clock size={23}/></span><h2 id="idle-warning-title">Still working?</h2><p>You’ll be signed out in <strong>{seconds} seconds</strong> because there hasn’t been any activity.</p><p className="muted">Stay signed in to continue and save any changes you’re working on.</p>{error && <p className="form-error" role="alert">{error}</p>}<div className="idle-actions"><button className="button secondary" type="button" onClick={onSignOut} disabled={busy}>Sign out now</button><button className="button" type="button" onClick={onStay} disabled={busy} autoFocus>{busy && <Loader2 className="spin" size={16}/>}Stay signed in</button></div></>;
}

export default function IdleSession({ initial, children, request = sessionRequest, onExpired }: {
    initial: SessionDeadline; children: ReactNode;
    request?: (activity: boolean) => Promise<SessionDeadline | null>; onExpired?: () => void;
}) {
    const [warning, setWarning] = useState(false), [seconds, setSeconds] = useState(60), [busy, setBusy] = useState(false), [error, setError] = useState(''), [expired, setExpired] = useState(false), [checking, setChecking] = useState(false);
    const dialog = useRef<HTMLDialogElement>(null), stay = useRef<() => void>(() => {}), leave = useRef<() => void>(() => {});
    useEffect(() => {
        let alive = true, finished = false, inFlight = false, queuedActivity = false, warningChecked = false, lastStatusCheck = Date.now();
        const timer = new IdleTimer(initial);
        const channel = typeof BroadcastChannel === 'function' ? new BroadcastChannel('piku-session') : null;
        const expire = () => {
            if (finished) return;
            finished = true; setExpired(true);
            if (onExpired) onExpired(); else window.location.replace('/login?reason=inactive');
        };
        const render = () => {
            const state = timer.state();
            setWarning(state === 'warning');
            setChecking(state === 'expired');
            if (state === 'warning') setSeconds(Math.max(1, Math.ceil(timer.remaining() / 1000)));
        };
        const sync = async (activity: boolean) => {
            if (finished) return;
            if (inFlight) { if (activity) queuedActivity = true; return; }
            inFlight = true; if (activity) setBusy(true);
            try {
                const status = await request(activity);
                if (!alive || finished) return;
                if (!status) { expire(); return; }
                timer.update(status); lastStatusCheck = Date.now(); setError('');
                if (timer.state() === 'active') warningChecked = false;
                render();
                if (activity) channel?.postMessage('updated');
            } catch {
                if (!alive || finished) return;
                if (timer.state() === 'expired') expire();
                else setError('Check your connection, then choose Stay signed in again.');
            } finally {
                inFlight = false; if (alive) setBusy(false);
                if (queuedActivity && alive && !finished) { queuedActivity = false; void sync(true); }
            }
        };
        const check = () => {
            if (finished) return;
            render();
            if (timer.state() === 'expired' || timer.state() === 'warning' && !warningChecked || Date.now() - lastStatusCheck >= 60_000) {
                warningChecked = true; lastStatusCheck = Date.now(); void sync(false);
            }
            // Hide stale records while checking the shared cookie. Another tab may still be active.
        };
        const activity = (event: Event) => {
            if (!event.isTrusted || document.visibilityState !== 'visible' || finished) return;
            if (timer.activityDue()) void sync(true);
            else if (timer.state() !== 'active') check();
        };
        const visible = () => { if (document.visibilityState === 'visible') { render(); void sync(false); } };
        const signedOut = async () => {
            if (finished) return;
            // Hide records immediately, even if the network is unavailable.
            finished = true; setExpired(true);
            try { await fetch('/api/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'logout' }), signal: AbortSignal.timeout(5000) }); }
            catch { /* The login request clears any expired cookies as well. */ }
            channel?.postMessage('signed-out');
            if (onExpired) onExpired(); else window.location.replace('/login?reason=inactive');
        };
        stay.current = () => { if (timer.state() === 'expired') { render(); void sync(false); } else void sync(true); };
        leave.current = () => { void signedOut(); };
        if (channel) channel.onmessage = event => { if (event.data === 'signed-out') expire(); else if (event.data === 'updated') void sync(false); };
        const events = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
        events.forEach(name => window.addEventListener(name, activity, { passive: true }));
        document.addEventListener('visibilitychange', visible); window.addEventListener('focus', visible); window.addEventListener('pageshow', visible);
        const interval = window.setInterval(check, 1000);
        render(); void sync(false);
        return () => { alive = false; clearInterval(interval); channel?.close(); events.forEach(name => window.removeEventListener(name, activity)); document.removeEventListener('visibilitychange', visible); window.removeEventListener('focus', visible); window.removeEventListener('pageshow', visible); };
    }, [initial.expiresAt, initial.serverNow, request, onExpired]);
    useEffect(() => {
        const popup = dialog.current;
        if (warning && !expired) { if (!popup?.open) popup?.showModal(); }
        else popup?.close();
    }, [warning, expired]);
    if (expired) return <main className="auth-shell"><section className="auth-card"><h1>Session ended</h1><p>Sign in again to continue.</p><a className="button" href="/login?reason=inactive">Go to sign in</a></section></main>;
    return <><div className="idle-content" hidden={checking}>{children}</div>{checking && <main className="auth-shell"><section className="auth-card"><h1>Checking your session…</h1><p>Please wait.</p></section></main>}<dialog className="idle-dialog" ref={dialog} aria-labelledby="idle-warning-title" onCancel={event => event.preventDefault()}><div className="idle-warning"><SessionWarning seconds={seconds} busy={busy} error={error} onStay={() => stay.current()} onSignOut={() => leave.current()}/></div></dialog></>;
}
