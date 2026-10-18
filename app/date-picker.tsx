'use client';
import { useLayoutEffect, useId, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { addMonths, monthEnd, today } from '../lib/ledger';

export type PickerProps = { label: string; value: string; end?: string; mode?: 'date' | 'month' | 'range'; onChange: (value: string, end?: string) => void; min?: string; max?: string; disabled?: boolean; required?: boolean; compact?: boolean; triggerText?: string };
const valid = (s: string) => /^\d{4}-\d{2}(-\d{2})?$/.test(s);
const display = (s: string, mode = 'date') => valid(s) ? new Date(`${s.length === 7 ? s + '-01' : s}T12:00:00Z`).toLocaleDateString('en-IN', mode === 'month' ? { month: 'long', year: 'numeric' } : { day: 'numeric', month: 'short', year: 'numeric' }) : '';
export default function DatePicker({ label, value, end, mode = 'date', onChange, min, max, disabled, required, compact, triggerText }: PickerProps) {
    const [open, setOpen] = useState(false), [cursor, setCursor] = useState((value || today()).slice(0, 7)), [choosingEnd, setChoosingEnd] = useState(false);
    const root = useRef<HTMLDivElement>(null), trigger = useRef<HTMLButtonElement>(null), overlay = useRef<HTMLDivElement>(null), id = useId();
    useLayoutEffect(() => {
        if (!open || !overlay.current) return;
        const popup = overlay.current;
        const native = typeof popup.showPopover === 'function';
        const closed = (event: Event) => { if ((event as ToggleEvent).newState === 'closed') setOpen(false); };
        popup.addEventListener('toggle', closed);
        if (native) popup.showPopover();
        else popup.dataset.fallback = 'true';
        const position = () => {
            const anchor = trigger.current?.getBoundingClientRect();
            if (!anchor) return;
            const width = popup.offsetWidth, height = popup.offsetHeight;
            const vw = window.innerWidth, vh = window.visualViewport?.height || window.innerHeight, offset = window.visualViewport?.offsetTop || 0;
            const mobile = vw <= 760;
            const left = mobile ? (vw - width) / 2 : Math.min(anchor.left, vw - width - 12);
            const top = mobile ? offset + (vh - height) / 2 : anchor.bottom + height + 8 <= offset + vh - 12 ? anchor.bottom + 8 : anchor.top - height - 8;
            popup.style.left = `${Math.max(12, left)}px`;
            popup.style.top = `${Math.max(offset + 12, Math.min(top, offset + vh - height - 12))}px`;
        };
        position();
        const observer = new ResizeObserver(position); observer.observe(popup);
        const scrolled = (event: Event) => { if (!popup.contains(event.target as Node)) setOpen(false); };
        const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
        window.addEventListener('resize', position);
        window.visualViewport?.addEventListener('resize', position);
        document.addEventListener('scroll', scrolled, true);
        if (!native) document.addEventListener('pointerdown', outside);
        popup.querySelector<HTMLElement>('[aria-pressed="true"]:not(:disabled)')?.focus({ preventScroll: true });
        return () => {
            observer.disconnect(); popup.removeEventListener('toggle', closed);
            window.removeEventListener('resize', position); window.visualViewport?.removeEventListener('resize', position);
            document.removeEventListener('scroll', scrolled, true); document.removeEventListener('pointerdown', outside);
            if (native && popup.matches(':popover-open')) popup.hidePopover();
        };
    }, [open]);
    const close = () => { setOpen(false); trigger.current?.focus(); };
    const choose = (d: string) => {
        if (mode !== 'range') { onChange(d); close(); }
        else if (!choosingEnd || d < value) { onChange(d, d); setChoosingEnd(true); }
        else { onChange(value, d); setChoosingEnd(false); close(); }
    };
    const first = new Date(cursor + '-01T12:00:00Z'), year = Number(cursor.slice(0, 4)), mo = Number(cursor.slice(5)), days = Number(monthEnd(cursor).slice(8));
    const years = Array.from({ length: Math.max(Number(today().slice(0, 4)) + 40, year + 1) - Math.min(1990, year) + 1 }, (_, i) => Math.min(1990, year) + i);
    const monthAllowed = (s: string) => (!min || s >= min.slice(0, 7)) && (!max || s <= max.slice(0, 7));
    const previous = mode === 'month' ? `${year - 1}-${String(mo).padStart(2, '0')}` : addMonths(cursor + '-01', -1).slice(0, 7);
    const next = mode === 'month' ? `${year + 1}-${String(mo).padStart(2, '0')}` : addMonths(cursor + '-01', 1).slice(0, 7);
    const allowed = (s: string) => (!min || s >= min) && (!max || s <= max);
    return <div ref={root} data-mode={mode} className={`date-control ${compact ? 'compact' : ''}`} onKeyDown={e => { if (e.key === 'Escape' && open) { e.preventDefault(); e.stopPropagation(); close(); } }}>
        <button ref={trigger} type="button" className="date-trigger" disabled={disabled} aria-label={`${label}: ${display(value, mode)}${mode === 'range' && end && end !== value ? ` to ${display(end)}` : ''}`} aria-expanded={open} aria-haspopup="dialog" aria-controls={id} onClick={() => { setCursor((value || today()).slice(0, 7)); setChoosingEnd(false); setOpen(!open); }}><CalendarDays size={17}/><span>{triggerText || display(value, mode) || `Select ${mode === 'month' ? 'month' : 'date'}`}{mode === 'range' && end && end !== value ? ` – ${display(end)}` : ''}</span>{mode === 'range' && value && end && <small>{Math.round((Date.parse(end) - Date.parse(value)) / 86400000) + 1} {end === value ? 'day' : 'days'}</small>}</button>
        {open && <div ref={overlay} id={id} popover="auto" className="date-popover" role="dialog" aria-label={`${label} calendar`}><div className="date-calendar-top"><button type="button" className="icon-button" aria-label={mode === 'month' ? 'Previous calendar year' : 'Previous calendar month'} disabled={!monthAllowed(previous)} onClick={() => setCursor(previous)}><ChevronLeft size={18}/></button><div className="date-calendar-selectors">{mode !== 'month' && <select aria-label="Calendar month" value={mo} onChange={e => setCursor(`${year}-${String(e.target.value).padStart(2, '0')}`)}>{Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>{display(`${year}-${String(i + 1).padStart(2, '0')}`, 'month').replace(/\s+\d{4}$/, '')}</option>)}</select>}<select aria-label="Calendar year" value={year} onChange={e => setCursor(`${e.target.value}-${String(mo).padStart(2, '0')}`)}>{years.map(y => <option key={y}>{y}</option>)}</select></div><button type="button" className="icon-button" aria-label={mode === 'month' ? 'Next calendar year' : 'Next calendar month'} disabled={!monthAllowed(next)} onClick={() => setCursor(next)}><ChevronRight size={18}/></button></div>
        {mode === 'range' && <p className="calendar-instruction" aria-live="polite">{choosingEnd ? 'Choose the end date. Select the same date for one day.' : 'Choose the start date.'}</p>}
        {mode === 'month' ? <div className="month-grid">{Array.from({ length: 12 }, (_, i) => { const m = `${year}-${String(i + 1).padStart(2, '0')}`; return <button type="button" key={m} disabled={!monthAllowed(m)} aria-pressed={value === m} className={value === m ? 'chosen' : ''} onClick={() => choose(m)}>{new Date(m + '-01T12:00:00Z').toLocaleDateString('en-IN', { month: 'short' })}</button>; })}</div> : <div className="calendar-days">{['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <span key={d}>{d}</span>)}{Array.from({ length: first.getUTCDay() }, (_, i) => <span key={`empty-${i}`}/>)}{Array.from({ length: days }, (_, i) => { const d = `${cursor}-${String(i + 1).padStart(2, '0')}`, selected = d === value || mode === 'range' && d === end; return <button key={d} type="button" disabled={!allowed(d)} aria-label={display(d)} aria-pressed={selected} aria-current={d === today() ? 'date' : undefined} className={`${selected ? 'range-end' : ''} ${mode === 'range' && d > value && d < (end || value) ? 'in-range' : ''}`} onClick={() => choose(d)}>{i + 1}</button>; })}</div>}
        <div className="calendar-footer"><button type="button" className="text-button" disabled={mode === 'month' ? !monthAllowed(today().slice(0, 7)) : !allowed(today())} onClick={() => { const d = mode === 'month' ? today().slice(0, 7) : today(); onChange(d, mode === 'range' ? d : undefined); close(); }}>{mode === 'month' ? 'This month' : 'Today'}</button>{!required && <button type="button" className="text-button" onClick={() => { onChange(''); close(); }}>Clear</button>}<button type="button" className="text-button" onClick={close}><X size={14}/>Close</button></div></div>}
    </div>;
}
