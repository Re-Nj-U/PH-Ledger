export const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
export const IDLE_WARNING_MS = 60 * 1000;
export const ACTIVITY_THROTTLE_MS = 30 * 1000;
export function idleState(expiresAt: number, now: number) {
    return now >= expiresAt ? 'expired' : expiresAt - now <= IDLE_WARNING_MS ? 'warning' : 'active';
}
