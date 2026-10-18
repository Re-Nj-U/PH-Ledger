# Security review before Vercel migration

**Current public checks and usability changes:** [18 October wrap-up](WRAP-UP.md). This adds limited unauthenticated production checks and a fresh production-only dependency scan; it is still not a full ASVS assessment. The dated sections below are retained as historical evidence.

**Earlier update:** [17 October 2026 PH-Ledger deployment audit](DEPLOYMENT-AUDIT.md) records the current source fixes, 34 passing tests, verified-TLS connection configuration and current dependency findings. The dated results below are historical evidence; production/provider checks remain pending.

Reviewed 11 October 2026. This is a scoped source review and local test record, **not a full ASVS assessment, certification, or penetration test**. No Supabase credentials or live Vercel project were available to the reviewer. Do not interpret a local build or an npm audit as proof of production security.

## Standard and scope

Basis: [OWASP ASVS 5.0.0](https://owasp.org/projects/asvs) and its [tagged requirements](https://github.com/OWASP/ASVS/tree/v5.0.0/5.0/docs_en). The official inventory has 345 requirements, including 70 marked Level 1. The inventory below accounts for those 70 without marking untested requirements as passed. Levels 2 and 3 have not been fully assessed. This ledger holds financial business records; a wider Level 2 assessment would require provider configuration evidence, threat modelling and deployed tests.

Architecture: one business, owner and active partner users; Next.js server verifies Supabase identities; financial data is accessed through a private PostgreSQL schema. Partner login membership is separate from repayable partner financial accounts. No public signup, payments gateway, user HTML editor, XML parser, application WebSocket endpoint, or user-controlled server filesystem upload is implemented.

## Problems corrected in this review

- The deployment archive omitted `hooks/use-mobile.ts`. The packaging script now includes hooks and checks local imports before packaging. An extracted-package build is required before distributing this correction.
- Next.js 16.3.4 was flagged by current advisories; upgraded to 16.3.8. Compatible transitive patches were applied. Removed unused legacy `react-server-dom-webpack` development tooling. Review current audit results below rather than assuming every dependency is safe.
- Ledger mutations now require same-origin JSON requests. Cross-site, absent/null Origin and HTML form content types are rejected. The body reader caps bytes while reading, including chunked requests, before parsing. Malformed JSON errors do not reflect the submitted text.
- Production Auth cookies use the `__Host-` prefix, Secure, HttpOnly, Path=/, and SameSite=Lax. Both server and proxy share the same settings. Existing sessions under the old cookie name require signing in again after deployment.
- Password changes reject an empty current password on the server and reauthenticate the user before updating it. The password is passed unchanged to Supabase. This still requires a live success/incorrect-password test.
- Added nosniff, frame blocking, no-referrer, restrictive feature policy, one-year HSTS, and CSP object/base/form/frame restrictions. **The CSP does not yet restrict script sources**; nonce-based script CSP remains an unverified improvement and is not described as complete XSS prevention.
- CSV exports also neutralize formulas behind leading whitespace. React renders user strings as text; no `dangerouslySetInnerHTML` was found in the application flows reviewed.

## Evidence and limits

- `tests/migration.test.mjs`: real embedded PostgreSQL checks for private schema/RLS, bound SQL, authorization/bootstrap, transaction rollback, revisions and validated import.
- `tests/security.test.mjs`: negative Origin/content-type cases, malformed JSON, streaming body size rejection, CSV formula text and production cookie configuration.
- `tests/ledger.test.mjs`: dated cash, EMI, refunds, repayments and report reconciliation.
- Route source independently checks owner-only imports, user/settings and vehicle/loan/partner setup. These function restrictions still require live owner-versus-partner HTTP tests; a pure repository authorization test is not proof of every route.
- No production URL, authenticated sessions, deployed headers, provider TLS or backup restoration were independently tested here.

## Outstanding before importing real records

1. Confirm Vercel is linked to the same Supabase project containing the ledger tables and owner account. Check the four environment names; the integration's POSTGRES_URL does not automatically satisfy DATABASE_URL.
2. Verify disabled signup, email confirmation, provider password policy, leaked/common-password rejection and Auth rate limits. Never use repeated production login attempts as a brute-force test.
3. Test owner login, inactive/unapproved users, partner denial for every owner-only operation, wrong-current-password rejection, sign-out, expired/tampered cookies, and session refresh on a separate test project.
4. Review Supabase session revocation. Self-contained access tokens can remain valid until expiry after logout; `getUser()` alone is not evidence of immediate revocation. Ledger membership deactivation is checked on subsequent API requests, but does not by itself terminate the Supabase Auth session. Immediate revocation/all-session logout requirements are unverified.
5. Check production HTTPS, certificate, response headers, secure cookie attributes, no caching of authenticated data, and absence of browser-accessible source/secrets.
6. The Postgres connection uses the project database account and SSL require. Least-privilege database credentials, certificate verification details, secret rotation, retention and disaster recovery need additional provider verification.
7. Test import and compare real balances before switching. The initial importer is not a general restore system. Arrange recurring private backups and prove recovery in a separate project.

## Maintenance policy

Check advisories before each release and at least monthly. Assess reachable critical/high issues immediately; do not release an affected reachable critical/high dependency. Target compatible remediation within 48 hours for critical/high production issues, seven days for other high issues, and 30 days for moderate/low issues. Record reachability, owner and deadline for accepted tooling risks. Never run audit fix --force blindly, downgrade the framework or expose development tooling to the internet to clear an audit count.

## Level 1 inventory

Statuses are deliberately conservative. **Local evidence** means a relevant local control was inspected or exercised; it does not mean the whole requirement is verified. **Provider/live pending** requires environment or authenticated runtime evidence. **Scope excluded** describes functionality absent from this version and must be revisited if it is added. The parent standard, not these brief notes, defines each complete requirement.

| ASVS 5.0.0 ID | Status | Evidence or remaining check |
|---|---|---|
| v5.0.0-1.2.1 | Local evidence | React text rendering; deployed injection probes pending |
| v5.0.0-1.2.2 | Local evidence | Routes/export filenames fixed or validated; URL probes pending |
| v5.0.0-1.2.3 | Local evidence | Response.json and React serialization; runtime probes pending |
| v5.0.0-1.2.4 | Local evidence | Bound PostgreSQL values; malicious SQL text regression test |
| v5.0.0-1.2.5 | Scope excluded | No web-input OS commands |
| v5.0.0-1.3.1 | Scope excluded | No HTML/WYSIWYG editor |
| v5.0.0-1.3.2 | Scope excluded | No user-input dynamic code execution found |
| v5.0.0-1.5.1 | Scope excluded | No application XML parser |
| v5.0.0-2.1.1 | Local evidence | lib/validation.ts and migration guide describe field constraints |
| v5.0.0-2.2.1 | Local evidence | Zod field and financial constraints; dated ledger tests |
| v5.0.0-2.2.2 | Local evidence | Route/import validation performed on server |
| v5.0.0-2.3.1 | Local evidence | Revision locks, refund/repayment rules; live flow testing pending |
| v5.0.0-3.2.1 | Local evidence | JSON responses, nosniff and request validation; live headers pending |
| v5.0.0-3.2.2 | Local evidence | React escapes user strings; no application HTML rendering sink found |
| v5.0.0-3.3.1 | Local evidence | Shared production __Host- Secure cookie config; wire attributes pending |
| v5.0.0-3.4.1 | Local evidence | One-year HSTS configured; live response pending |
| v5.0.0-3.4.2 | Local evidence | No application CORS allow headers; deployed check pending |
| v5.0.0-3.5.1 | Local evidence | Same-origin mutations; Next Server Action checks; negative API tests |
| v5.0.0-3.5.2 | Local evidence | Only application/json accepted for ledger mutations; negative tests |
| v5.0.0-3.5.3 | Local evidence | User mutations use POST; bootstrap GET side effects need separate review |
| v5.0.0-4.1.1 | Local evidence | JSON and framework HTML responses; live Content-Type pending |
| v5.0.0-4.4.1 | Scope excluded | No application WebSocket endpoints |
| v5.0.0-5.2.1 | Local evidence | Streaming request byte cap and backup record cap tested |
| v5.0.0-5.2.2 | Local evidence | JSON structure validated; no raw file storage; extension transport scope review pending |
| v5.0.0-5.3.1 | Scope excluded | No untrusted uploaded files persisted as public executable files |
| v5.0.0-5.3.2 | Scope excluded | Backup contents parsed; no user filesystem paths on server |
| v5.0.0-6.1.1 | Local evidence | Supabase Auth rate limiting delegated; actual policy/configuration pending |
| v5.0.0-6.2.1 | Local evidence | 12-character change minimum; administrator-created password policy pending |
| v5.0.0-6.2.2 | Local evidence | Password form/action implemented; authenticated live test pending |
| v5.0.0-6.2.3 | Local evidence | Current password required and reauthenticated; live invalid-password test pending |
| v5.0.0-6.2.4 | Provider/live pending | Complete requirement verification is outstanding |
| v5.0.0-6.2.5 | Local evidence | No password composition restrictions in application |
| v5.0.0-6.2.6 | Local evidence | Password fields masked |
| v5.0.0-6.2.7 | Local evidence | Autocomplete/password-manager and paste remain enabled |
| v5.0.0-6.2.8 | Local evidence | Password passed unchanged; live edge-case test pending |
| v5.0.0-6.3.1 | Provider/live pending | Complete requirement verification is outstanding |
| v5.0.0-6.3.2 | Local evidence | No seeded default application login; provider inspection pending |
| v5.0.0-6.4.1 | Scope excluded | No app-generated temporary password flow; manual owner/partner onboarding policy still needs review |
| v5.0.0-6.4.2 | Local evidence | No password hints or secret-question flow |
| v5.0.0-7.2.1 | Local evidence | Supabase getUser verifies identities server-side; tampered-cookie live test pending |
| v5.0.0-7.2.2 | Provider/live pending | Complete requirement verification is outstanding |
| v5.0.0-7.2.3 | Scope excluded | Supabase uses signed JWT access tokens, not app-generated reference sessions |
| v5.0.0-7.2.4 | Provider/live pending | Complete requirement verification is outstanding |
| v5.0.0-7.4.1 | Provider/live pending | Complete requirement verification is outstanding |
| v5.0.0-7.4.2 | Provider/live pending | Complete requirement verification is outstanding |
| v5.0.0-8.1.1 | Local evidence | Role restrictions documented in migration guide and route |
| v5.0.0-8.2.1 | Local evidence | Owner checks in API; live negative role matrix pending |
| v5.0.0-8.2.2 | Local evidence | One shared business; active membership + record references checked; live IDOR pending |
| v5.0.0-8.3.1 | Local evidence | Roles resolved and enforced server-side; client role flags are not trusted |
| v5.0.0-9.1.1 | Provider/live pending | Complete requirement verification is outstanding |
| v5.0.0-9.1.2 | Provider/live pending | Complete requirement verification is outstanding |
| v5.0.0-9.1.3 | Provider/live pending | Complete requirement verification is outstanding |
| v5.0.0-9.2.1 | Provider/live pending | Complete requirement verification is outstanding |
| v5.0.0-10.4.1 | Scope excluded | Application is not an OAuth authorization server |
| v5.0.0-10.4.2 | Scope excluded | Application is not an OAuth authorization server |
| v5.0.0-10.4.3 | Scope excluded | Application is not an OAuth authorization server |
| v5.0.0-10.4.4 | Scope excluded | Application is not an OAuth authorization server |
| v5.0.0-10.4.5 | Scope excluded | Application is not an OAuth authorization server; Supabase rotation still reviewed separately |
| v5.0.0-11.3.1 | Provider/live pending | Complete requirement verification is outstanding |
| v5.0.0-11.3.2 | Provider/live pending | Complete requirement verification is outstanding |
| v5.0.0-11.4.1 | Provider/live pending | Complete requirement verification is outstanding |
| v5.0.0-12.1.1 | Provider/live pending | Complete requirement verification is outstanding |
| v5.0.0-12.2.1 | Provider/live pending | Complete requirement verification is outstanding |
| v5.0.0-12.2.2 | Provider/live pending | Complete requirement verification is outstanding |
| v5.0.0-13.4.1 | Local evidence | Archive/Vercel excludes .git; production accessibility check pending |
| v5.0.0-14.2.1 | Local evidence | Credentials and mutations in body/cookies, not app URL; live traffic review pending |
| v5.0.0-14.3.1 | Local evidence | 401/403 clears ledger client state; logout/back-button/expiry tests pending |
| v5.0.0-15.1.1 | Local evidence | Remediation policy defined above |
| v5.0.0-15.2.1 | Local evidence | Dependency scans recorded below; tooling exceptions remain pending |
| v5.0.0-15.3.1 | Local evidence | Partners do not receive member list; shared ledger/audit fields need privacy review |

## Validation results

- All 29 tests passed in both the source checkout and separately extracted full archive.
- Production build passed with Next.js 16.3.8 in the extracted archive; TypeScript check passed. Verification used a symlink to the checkout's installed dependencies, which match the lockfile. A fresh remote npm ci / Vercel build is still pending.
- The current full source ZIP contains 128 files, including hooks/use-mobile.ts and local setup instructions. All local source imports were checked for packaged targets.
- npm audit --omit=dev: zero known production advisories at review time. This is a registry scan, not a guarantee of vulnerability-free code.
- npm audit across all dependencies: nine development-only findings (five high, four moderate): @next/eslint-plugin-next, eslint-config-next, fast-glob, micromatch, braces, drizzle-kit, @esbuild-kit/core-utils, @esbuild-kit/esm-loader, and esbuild. Their tools are not called by ledger requests. They remain unresolved; do not expose tool/dev servers or process untrusted build inputs. Compatible updates did not eliminate these findings; audit's suggested major downgrades were not applied. Remediation target for high tooling findings: 18 October 2026; moderate findings: 10 November 2026. These are outstanding findings, not an acceptance or a compliance pass.
- Local production runtime: /login returned 200 with the configured security headers and private/no-store caching. Cross-site JSON writes returned 403; same-host text/plain writes returned 415; same-host JSON reached the Auth configuration check (503 because credentials were intentionally absent). This verifies request gating, not authenticated mutations.
- Live Supabase sign-in, deployment, session revocation and provider controls remain unverified.

## Install/package correction — 16 October 2026

The older archive failed a fresh npm ci with Invalid Version. Two optional sharp/libvips lockfile entries had missing version metadata. Removed the malformed placeholders and asked npm to regenerate the metadata. No application dependency versions were changed by this repair. Node 24.x is now pinned in the manifest and .nvmrc, and packaging rejects missing dependency versions or a manifest/lockfile mismatch. The complete application is distributed as PIKU-Holidays-Ledger-LATEST.zip; older Fix.zip archives are partial updates and should not be used to create a fresh application.

Validation: the complete ZIP was extracted into a new temporary directory with no existing node_modules or build cache. A fresh npm ci succeeded under Node 24.19.0 and preserved the lockfile. All 29 tests and the production build passed under that runtime. This is macOS validation, not an actual Vercel/Linux deployment. The previous dependency-scan results remain dated 11 October; this install repair does not claim a new dependency security assessment or full ASVS verification.

## Linux lockfile correction — 16 October 2026

The Vercel deployment of commit 83c47dc failed npm ci because @img/sharp-libvips-linux-s390x@1.3.4 was absent from the lockfile. The earlier npm 10 macOS check did not detect the unresolved optional Linux dependency. The failure was reproduced with npm 11.21.0 using a Linux/x64/glibc target. Added the published package version, tarball URL and SHA512 integrity at the root of the locked dependency graph. No existing dependency entries or application dependency versions changed. The source packager now checks that normal and optional dependency references resolve to locked entries, including packages not installable on the packaging host.

Validation: the corrected lockfile passed the same Linux-targeted npm 11 dry-run that rejected the original file. A fresh macOS npm 11 installation, Node 24 production build, and all 29 tests passed. An attempted full Linux-targeted download was interrupted by a registry connection reset; the successful Linux check validates dependency resolution, not execution of a Linux build. The next actual Vercel deployment remains the production-platform verification. No Supabase credentials or ledger data were involved in this repair.
