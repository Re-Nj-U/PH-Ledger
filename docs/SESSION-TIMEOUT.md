# Inactivity sign-out

Added 19 October 2026. The ledger and password screen require a fresh sign-in after 30 minutes without recorded activity. A dialog appears one minute before expiry. Stay signed in renews the session; Sign out now ends local access. Clicks, typing, wheel scrolling and touches count while the page is visible. Activity requests are throttled to at most one per 30 seconds per tab.

A warning blocks interaction with the underlying form until the user chooses an action. Unsaved input stays in memory when the user continues; there is no automatic saving of financial entries. After expiry the ledger is hidden and sign-in is required. Unsaved changes are discarded. Laptop sleep and suspended timers are handled using wall-clock deadlines and a fresh check when the page becomes visible or focused.

## Server enforcement

A successful password login creates a separate signed, HttpOnly activity cookie, bound to the verified Supabase user ID and session ID. It uses Secure and a host-only cookie name in production, SameSite=Lax and a 30-minute browser lifetime. The server also checks the signed timestamp directly, so changing browser storage or keeping background requests running cannot move the deadline.

The signing key is derived with SHA-256 and a distinct application context from the existing server-only DATABASE_URL secret. It is never sent to the client. Credential rotation invalidates activity cookies and requires sign-in again. No new environment variable, package, database table, migration or paid Supabase session feature is required.

Proxy checks happen before token refresh. getUser also enforces the cookie and verifies its user/session binding. Ordinary ledger reads/writes and provider token refreshes do not update activity. Only successful login and same-origin JSON activity requests issue a fresh activity timestamp, and an expired cookie cannot be renewed. Authentication and owner/partner authorization still run separately.

GET /api/session returns the existing deadline without extending it. POST /api/session accepts activity or logout, validates the request origin and uses the bounded JSON reader. The logout action attempts to revoke the current Supabase session and clears application cookies, including chunked Auth cookies. On idle expiry the application rejects access and clears browser credentials on the sign-in redirect; a provider session record may remain until provider cleanup. The inactivity guarantee applies to this application's access, not deletion of Supabase's session history.

Tabs share the HTTP-only cookie. BroadcastChannel sends only notifications so other tabs fetch the authoritative deadline. A stale tab temporarily hides records while checking whether another tab is active; it does not immediately discard a form based solely on its local timer. If the network cannot verify a session after its deadline, the screen stays locked and returns to sign-in. Checks have a five-second network timeout.

The password-change screen uses isolated current-password verification so that checking the old password does not replace the browser session and break its inactivity binding. The separate owner-transfer password check remains in place.

## Deployment and checks

Deploy the complete source update. Users who were already signed in before this feature was deployed need to sign in once to obtain the new activity cookie. Existing financial data is unchanged.

Automated tests cover the exact server expiry boundary, laptop sleep, HMAC tampering, account/session binding, cookie flags and chunk clearing, background refresh, activity throttling, clock differences and stale-tab updates. Temporary local browser fixtures use shortened deadlines to verify the warning, continuing without losing a draft and expired-session handling; no live login or production data is used.
