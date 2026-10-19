import { ACTIVITY_THROTTLE_MS, idleState } from './idle-policy';

export type SessionDeadline = { expiresAt: number; serverNow: number };
// Elapsed wall time catches laptop sleep and suspended browser timers.
export class IdleTimer {
    private offset: number;
    private lastActivityRequest = -Infinity;
    expiresAt: number;
    constructor(status: SessionDeadline, now = Date.now()) { this.offset = now - status.serverNow; this.expiresAt = status.expiresAt; }
    update(status: SessionDeadline, now = Date.now()) { this.offset = now - status.serverNow; this.expiresAt = status.expiresAt; }
    remaining(now = Date.now()) { return Math.max(0, this.expiresAt - (now - this.offset)); }
    state(now = Date.now()) { return idleState(this.expiresAt, now - this.offset); }
    activityDue(now = Date.now()) {
        if (this.state(now) !== 'active' || now - this.lastActivityRequest < ACTIVITY_THROTTLE_MS) return false;
        this.lastActivityRequest = now;
        return true;
    }
}
