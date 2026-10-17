# Deployment audit — 17 October 2026

Main project: **/Users/pikachu/Documents/ChatGPT/PH-Ledger**. Repository: **Re-Nj-U/PH-Ledger**, branch main, audited starting at commit 72adb225. This audit used this repository's files, not the old Sites workspace or an earlier ZIP.

## Outcome

The source passes local deployment checks after the fixes below. No required source/configuration files were missing. This is a scoped source, dependency and local runtime audit, **not full OWASP ASVS certification, a penetration test or confirmation of a live Vercel deployment**. No live Supabase credentials were available, so real Auth, database connectivity and production configuration remain to be verified.

## Fixes made

- Owner-only opening balances now check both the submitted and stored record. A partner cannot remove the opening flag to edit the record, or delete an existing opening trip.
- Due payments reject duplicate settlements, including two expenses in one request and an existing expense relinked to an already-paid item. Settled expenses cannot detach from/change their due link. Category, paid status and full amount must match. A due item and its settlement must be saved separately to prevent conflicting writes. New recurring settlements create the next due even when attaching an existing expense; editing an existing settlement does not create another renewal.
- Backup validation also rejects duplicate settlements and mismatched categories before any database write.
- Database clients now verify TLS certificates rather than using Postgres.js SSL require, which disables certificate verification. An optional server-only DATABASE_SSL_CA supports the Supabase CA certificate. All four clients share the same connection settings, disable prepared statements, and set max_pipeline to 1 to serialize queries. Real pooler/transaction testing remains pending.
- Database tools catch connection-construction errors without printing connection strings. The deployment checker identifies certificate verification failures without exposing credentials.
- The password page redirects to login when public Auth configuration is absent. The proxy also disables caching for unconfigured responses.
- Added an automatic prebuild source check: Node 24, required files, local imports, manifest/lockfile agreement and complete locked normal/optional dependencies. It catches the earlier missing hook and missing Linux sharp dependency. The Vercel exclusions and source packager include this new script.
- Added npm run verify for tests, production build and TypeScript checks in order. Updated setup instructions to use PH-Ledger consistently and stop mixing separate folders/ZIP versions.

The agreed financial formulas were preserved: completed-trip agreed income and trip costs use the completion month; actual cash uses payment dates; the full paid EMI reduces the payment month's result and cash; partner funding, repayments and distributions stay separate from operating income/expenses.

## Verification performed

Validation used a clean temporary copy of the actual repository, with no environment file, secrets, business backup, installed dependencies or build cache copied from the working folder. Source files applied back to the main folder are checked for byte equality with the verified files.

| Check | Result |
| --- | --- |
| Fresh npm 11.21.0 install on macOS / Node 24.19.0 | Passed |
| npm run verify | Passed: all 34 tests, prebuild check, Next.js 16.3.8 production build, TypeScript |
| PostgreSQL tests | Private schema/RLS, bound SQL, atomic rollback, revisions, owner initialization, partner access and validated import passed in embedded PostgreSQL |
| Financial regression tests | Completion-month income/costs, full EMI, partial payments, refunds, partner debt and monthly/cash report reconciliation passed |
| New safeguard tests | Opening record permissions, duplicate/relinked due settlements, backup checks and TLS option handling passed |
| Linux x64/glibc npm 11 clean-install dry-run in an empty folder | Passed: dependency resolution; not an executed Linux build |
| Missing-file/lockfile regression probes | Correctly rejected a removed hooks/use-mobile.ts and the removed Linux sharp dependency |
| Complete source packager and local import checks | Passed |
| Production runtime without credentials | /login 200; / and /account/password 307 to login; API 503 with safe missing-configuration response |
| Request security/runtime headers | Cross-site write 403, non-JSON write 415; no-store caching and configured security headers present |
| npm audit --omit=dev --package-lock-only | Zero known production advisories on 17 October 2026 |
| Full npm dependency audit | Nine findings remain: five high, four moderate, all development dependencies |

A passing source/build check does not exercise authenticated business flows against Supabase. The initial local verification command needed an npm executable added to the temporary runtime PATH; the complete npm run verify then passed. This was a temporary audit-runtime setup issue, not a source/build error.

## Outstanding dependency findings

The high dependency chain is eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces (GHSA-vfj7-8cjw-p6xm). The moderate chain is drizzle-kit → @esbuild-kit/esm-loader → @esbuild-kit/core-utils → esbuild (GHSA-67mh-4wv8-2f99). These tools are not called by ledger HTTP requests. They are present in the build/development environment and remain findings; the production-only audit result must not be used to dismiss them.

At audit time braces latest is still 3.0.3, within the advisory range, and drizzle-kit latest still depends on the affected legacy loader. No verified compatible patch eliminating these findings was identified. npm's suggested major downgrades were not applied. Follow up on compatible fixes by **18 October 2026** for high findings and **10 November 2026** for moderate findings. Do not expose development tool servers to the internet or process untrusted source/build inputs with the affected tools. No automatic security acceptance is implied by this report.

## Before using real financial records

1. Confirm the deployed commit is the latest main commit from this folder and Vercel uses Next.js, root ./, Node 24.x, npm ci and npm run build.
2. Check the four required Production environment names in .env.example. The application reads DATABASE_URL, not POSTGRES_URL. Never share the values publicly. Use DATABASE_SSL_CA if the database certificate requires it; do not disable verification.
3. Run npm run deployment:check with a private local .env.local, or the equivalent environment. It must pass schema/RLS/access, verified TLS and disabled-public-signup checks. Missing local variables currently cause a safe failure; this is not a live provider check.
4. Verify confirmed owner sign-in (pikuholidays@gmail.com), active partner access, denial of unapproved/inactive users, owner-only actions, session refresh/sign-out, and correct/incorrect current-password behavior on a separate test environment.
5. Verify production HTTPS, secure cookies, no caching, error behavior and concurrent transactions through the real Supabase pooler. Review least-privilege credentials, Auth policy/rate limits, immediate session revocation and secret rotation. These controls were not independently tested here.
6. Import once into the empty target ledger only after preserving the old backup. Compare monthly result, cash, customer outstanding, commitments and partner balances before switching daily entry. Test recovery/backup policy separately.

For the original ASVS Level 1 inventory and broader pending controls, see [SECURITY-REVIEW.md](SECURITY-REVIEW.md). Script-source CSP, provider controls, backup recovery and full Level 2 assessment remain outside the verified claims.

References: [Supabase TLS verification](https://supabase.com/docs/guides/platform/ssl-enforcement), [Supabase Postgres.js/pipelining guidance](https://supabase.com/docs/guides/database/postgres-js), [braces advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), [esbuild advisory](https://github.com/advisories/GHSA-67mh-4wv8-2f99).
