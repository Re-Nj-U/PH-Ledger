# VanLedger — Implementation Roadmap

Status: blueprint approved and the user's **Phase 2 — Application Foundation & UI** implemented with read-only synthetic data. This corresponds to the UI/tooling subset of Phase 1 in the original roadmap below; Phase 2 tenancy/finance remains pending. Approval of the blueprint does not supply missing business facts or authorize production deployment.

## 1. Delivery approach

Build vertical, testable slices on top of a secured financial foundation. Demonstrate exact cash reconciliation before dashboard polish. Multiple vehicles and business isolation must work from the first schema; offline behavior remains later work.

Each completed task should link to its implementation/review and actual verification evidence. Do not mark planned commands or UI mockups as working capabilities. Avoid adding a broad unrelated suite after relevant checks pass.

## 2. Phase 0 — Review and approve decisions

Dependencies: these seven documents. No application scaffolding until user approval.

- [x] Review PRD, architecture, schema, financial rules, design system, and agent instructions together.
- [x] Obtain explicit approval for scaffolding and the next phase's scope (Application Foundation & UI; mock data only).
- [ ] Resolve D01: currency/exponent, jurisdiction, timezone, fiscal year.
- [ ] Resolve D02: cutover, opening cash, opening receivables/payables/advances, equity/result inputs.
- [ ] Resolve D03: completion/cost recognition, cross-month/cancellation adjustments, annual cost timing.
- [ ] Resolve D04: EMI first due date/convention, historical paid attestation, irregular history, breakdown availability.
- [ ] Resolve D05 before distribution activation: shares, policy effective date, authority, reserves/entitlements, loss/rounding treatment.
- [ ] Resolve D06 before enabling credits/refunds/cancellation settlement.
- [ ] Resolve D07/D08 to the required accounting scope; explicitly defer unsupported allocations/tax/noncash features rather than estimate.
- [ ] Resolve D09: period closure, backdating permissions, correction effective dates.
- [ ] Confirm D10–D12: email/recovery/privacy/backup targets, payment recording scope, trip operations.
- [ ] Record decision owner/date and update all affected documents; leave unanswered decisions pending.

Exit: approved implementation scope, identified unresolved gates, and policy decisions needed by the first financial slice. Scaffolding can proceed after explicit approval even while later financial decisions remain pending.

## 3. Phase 1 — Application and delivery foundation

Dependencies: scaffolding approval; D01 required before financial business onboarding.

- [ ] Pin compatible Next.js/React/TypeScript/Tailwind/shadcn/Supabase/Recharts versions; select one package manager and lockfile.
- [ ] Create App Router structure, strict TS, lint/typecheck/build scripts, environment-name examples without credentials.
- [x] Establish semantic tokens, accessible shell, mobile navigation, desktop sidebar, loading/error boundaries.
- [ ] Configure separate local/staging/production plans; inspect existing bindings before requesting provider configuration.
- [ ] Add CI frozen install, lint/typecheck/build, and test scaffolding appropriate to later slices.
- [ ] Configure Supabase local/integration testing workflow or an isolated development project with deterministic synthetic fixtures.
- [ ] Add request-scoped Auth SSR clients, verified session handling, login/logout/recovery, safe callback origins, private caching policy.

Exit evidence: successful build/typecheck, authenticated shell, unauthenticated rejection, no cross-session cache leak, documented reproducible development startup. Provider provisioning/deployment needs its own authorized scope.

## 4. Phase 2 — Tenancy, financial infrastructure, and cutover

Dependencies: Phase 1; D01–D03 and D09 policies for enabled behavior.

- [ ] Create businesses, memberships, financial partners, vehicles, finance state, policies, periods, cutover/opening-position migrations.
- [ ] Implement RLS/helpers/grants, safe business bootstrap and owner invitations, member revocation and last-owner protection.
- [ ] Implement integer-string money serialization, exact input parsing/formatting, business-local dates, checked sums, fiscal periods.
- [ ] Implement command idempotency, per-business lock, optimistic versions, immutable cash/allocation/recognition events, redacted atomic audit.
- [ ] Implement typed opening/adjustment/correction primitives and as-of report queries with completeness metadata.
- [ ] Enforce cross-business composite FKs, direction/source constraints, effective-date ceilings, and closed-period rules.
- [ ] Seed two businesses, two roles, two vehicles, and representative opening positions without real data.

Exit evidence: authenticated outsider/tenant-spoof tests fail safely; partner owner-only calls rejected; direct ledger writes rejected; same-key retry creates one posting; payload mismatch rejected; concurrent commands preserve invariants; opening cash reconciles exactly; historical reversal fixture stays correct.

## 5. Phase 3 — Trips, costs, and customer collections

Dependencies: Phase 2; approved D03 and supported D06/D07/D12 scope.

- [ ] Build trip list/detail/create/edit/status workflows and immutable price amendments.
- [ ] Validate vehicle/date/readings, calculated distance, stale edits, archive rules, unpaid completion, overlap warning.
- [ ] Add expense obligations, adjustments, incurred/paid distinction, atomic paid-now command, partial settlement.
- [ ] Add customer advance/partial/final collection with one-trip allocations, exact outstanding, idempotent retry.
- [ ] Settle opening receivables/payables without new revenue/cost recognition.
- [ ] Add completed-trip recognition and supported correction workflow under approved policies.
- [ ] Add mobile forms, validation/error announcements, unsaved-input protection, history/drilldowns.
- [ ] Implement refund/cancellation settlement only if D06 is approved; otherwise clearly disable unsupported flows.

Exit evidence: create/book/start/complete/collect/pay journey works on mobile; two receipts racing for final balance cannot overcollect; price adjustment cannot strand balances; completed-unpaid and cross-month fixtures report correctly; expense payment changes cash once.

## 6. Phase 4 — Vehicle costs, EMI, and reminders

Dependencies: Phases 2–3; D04 and expense/recognition decisions.

- [ ] Build owner EMI registration with legacy-history attestation and remaining-schedule preview.
- [ ] Generate deterministic month-end/leap-year dates and retain original sequence numbers.
- [ ] Implement partial/manual instalment confirmation, due/overdue views, payment reversal, and no implicit date-based postings.
- [ ] Implement supplied finance components and single-source finance cost recognition; display unknown breakdown completeness.
- [ ] Reject unsupported irregular history/restructuring/prepayment workflows with explicit guidance.
- [ ] Add insurance/road-tax renewal records/reminders and maintenance/repair costs; distinguish renewal status from payment.
- [ ] Use derived in-app reminders; choose approved lead times. No email/push/background job required for v1 reminders.

Exit evidence: historical-paid count causes no new cash; P=0/P=N and 31st-day schedules are correct; partial overdue instalments remain outstanding; reversal restores balance; EMI finance costs cannot be paid twice through expense flow.

## 7. Phase 5 — Partner funding and withdrawals

Dependencies: Phase 2; D02/D05/D09; receipt/cash foundation.

- [ ] Add partner opening advance, owner contributions, partial/full repayments, partner-specific statements.
- [ ] Enforce aggregate claim and all affected effective-date limits; test reversal after dependent repayment.
- [ ] Add owner-approved effective-dated profit-sharing versions; require shares total exactly 100%.
- [ ] Add separately classified distribution posting/history only after withdrawal authority rules are approved.
- [ ] Display recorded withdrawals and retained/result values only at their supported completeness level.
- [ ] Implement entitlement/reserve enforcement only if D05 defines it; no inferred distributable balance or 50/50 split.

Exit evidence: funding/repayment/distribution affect the correct cash and claim categories; two simultaneous repayments cannot exceed advance; partner cannot invoke owner-only commands; share changes preserve history; no funding appears in revenue.

## 8. Phase 6 — Dashboard and reports

Dependencies: completed required financial slices; approved recognition/accounting scope.

- [ ] Build one-snapshot dashboard totals and drilldowns for agreed/recognized/received/incurred/paid/EMI/operating result/cash.
- [ ] Build monthly/yearly/fiscal reports, exact opening/movement/closing reconciliation, negative-cash states.
- [ ] Build trip margin, vehicle/shared expenses, outstanding customers, EMI, partner statement, audit reports.
- [ ] Implement separate accounting-result view with finance/noncash completeness; no statutory compliance claim.
- [ ] Add exact accessible tables and display-only Recharts, tested safe conversions, negative axes, filters/pagination.
- [ ] Add permission-scoped CSV exports with formula injection protection and exact formatting.
- [ ] Measure report indexes/query plans and mobile performance using representative synthetic volume.

Exit evidence: worked BUSINESS_RULES fixture reconciles; dashboard/report agreement for same period; no paginated-client balance sums; opening claims are not re-recognized; incomplete finance data is visibly incomplete; two-vehicle reports retain shared/unattributed categories.

## 9. Phase 7 — PWA, security, and production readiness

Dependencies: working required slices; D10 operations decisions; deployment authorization when needed.

- [ ] Add manifest, 192/512 regular and maskable icons, Apple touch icon, standalone display/safe-area behavior, HTTPS deployment configuration.
- [ ] Test installation and authenticated use on real Android and iPhone; no offline financial caching/queue.
- [ ] Test offline/network failure, timeout after commit, session expiry, logout and tenant-switch cache clearing.
- [ ] Complete keyboard, screen-reader, contrast, touch-target, reflow, and automated accessibility checks.
- [ ] Audit RLS/RPC/grants, definer functions, auth redirects, invitations, last-owner behavior, logs, CSV, dependency/security configuration.
- [ ] Implement safe structured telemetry, correlation IDs, redaction, alerting and incident/owner-recovery procedures.
- [ ] Rehearse migrations and actual backup restoration; approve retention, recovery targets, secrets separation, and rollback/forward-fix plan.
- [ ] Validate staging E2E/performance and provider settings; obtain any required authorization for production release.

Exit evidence: all required gates pass with actual results recorded; backups restore; no unresolved high-severity security issue; financial decisions reflected in active policies; credentials absent from builds/browser; production publication/deployment explicitly confirmed only when performed.

## 10. Later roadmap

After stable daily use: private attachments; notification providers; multi-account reconciliations/transfers; advanced EMI amendments; explicit accounting/tax integrations; offline read policy; and finally offline writes with per-operation idempotency, conflict resolution, encrypted local storage, tenant/logout cleanup, and human review of financial conflicts. Each requires its own PRD/schema/security review.

## 11. Mandatory regression evidence

| Area | Required cases |
| --- | --- |
| Money | 0/2/3 decimal currencies, excess precision rejection, amounts above JS safe integer, overflow, exact negative reconciliation |
| Dates | business timezone midnight boundaries, leap/year/month boundaries, fiscal year, effective vs created date |
| Claims | ordinary/legacy receivable settlement, partial cost/EMI settlement, funding repayment, backdated ceilings |
| Transaction safety | repeat key, changed payload, committed-timeout retry, two independent concurrent sessions, atomic audit failure rollback |
| Security | anon, outsider, partner, owner, revoked owner/partner, cross-business linked IDs, direct DML/RPC, invite misuse |
| Reporting | recognition ≠ collection, cost ≠ payment, opening + movement = closing, same-period dashboard, late reversal as-of correctness |
| UX/PWA | 320px, text zoom, touch/keyboard/screen reader, two vehicles, stale edit, negative/unknown totals, standalone install and network loss |

The initial documentation stage used consistency, internal-link, and intended-diff review. Current UI validation is recorded below; future database/security/production gates remain pending.

## 12. Completed delivery — User's Phase 2: Application Foundation & UI

Scope: an interactive, read-only application foundation. No Supabase connection, auth, migrations, real financial transactions, or persistent settings. Original blueprint files remain unchanged; this task status is updated as requested. See [DEVELOPMENT.md](DEVELOPMENT.md) for local commands and source provenance.

- [x] Initialize Next.js 16.4 App Router, React 19.3, strict TypeScript, Tailwind 4, npm lockfile, and reproducible scripts.
- [x] Configure shadcn/ui and install official component source, Radix dependencies and Lucide icons; retain upstream MIT license.
- [x] Implement light-theme semantic tokens, system typography, reusable cards/money/status/heading/filter components, visible focus and reduced motion.
- [x] Build mobile bottom navigation, tablet icon rail, desktop sidebar, responsive header, safe-area spacing, skip link, and global quick-add preview.
- [x] Build Dashboard, Trips, Vehicle Expenses, Partner Funding, Reports, and Settings routes.
- [x] Separate fictional business/trip/expense/EMI/partner data in `lib/mock-data.ts`; use exact minor-unit arithmetic and read-side demo summaries.
- [x] Show monthly collections, trip costs, EMI cash paid, operating surplus/deficit, cumulative cash, reminders and recent trips; keep agreed value and accounting completeness distinct.
- [x] Add trip search/status filters/detail dialog, expense/EMI/renewal tabs and deep links, month/quarter reports, sample CSV, empty/loading/error/404 states.
- [x] Keep quick-add forms preview-only; no dataset mutation, financial posting, persistence, fabricated profit entitlement, or Supabase connection.
- [x] Add focused exact-money/fixture checks and responsive/interaction/accessibility browser checks.

Validation evidence for this delivery (2026-10-08):

| Check | Result |
| --- | --- |
| `npm ci` | Passed using `package-lock.json`; reproducible dependency installation verified |
| `npm run lint` | Passed with zero errors and zero warnings (`--max-warnings=0`) |
| `npm run typecheck` | Passed under strict TypeScript |
| `npm run build` | Passed; all six App Router screens and icon generated successfully |
| `npm run dev` | Started successfully; dashboard and trips returned HTTP 200 with expected content; automatic AGENTS.md generation disabled and original hash restored |
| `npm run test:unit` | 6 passed; no failed/skipped tests |
| `PLAYWRIGHT_CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e` | 36 passed; no failed/skipped tests |
| Responsive browser checks | All six screens at 320, 390, 768, and 1440px; no horizontal page overflow or uncaught runtime exceptions |
| Accessibility checks | Automated WCAG AA scans passed for all six screens and quick-add dialog; Reports definition-list semantics corrected before final pass |
| Functional UI checks | Period/deficit reconciliation, trip search/filter/details, preview-only entry, mobile More menu, EMI deep link, renewals, sample CSV, and unknown workspace 404 passed |
| Visual review | Desktop and mobile full-page renders inspected; fixed navigation, spacing, summaries, chart, and negative-value rendering checked |
| Documentation preservation | Original PRD, architecture, database, business rules, design system, AGENTS, and README verified unchanged; TASKS updated as requested |

Real auth/RLS/concurrency tests, production financial policies, full manual accessibility verification, PWA installation/offline behavior, and deployment are not completed by this UI phase.
