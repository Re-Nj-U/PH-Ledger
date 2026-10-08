# VanLedger — Instructions for Development Agents

## Scope and approval

The repository currently contains planning documents for VanLedger. The user explicitly requested documentation first and approval before application scaffolding. Until that approval arrives, edit/review documentation only: do not create application packages, source scaffolds, dependencies, migrations, cloud resources, deployments, or generated UI components. This planning gate ends when the user explicitly authorizes the next implementation phase; do not ask repeatedly for work already authorized.

User instructions take precedence over these instructions. Never infer approval of unresolved financial rules from approval of general scaffolding. Track the relevant D01–D12 decisions in PRD.md and complete independent authorized work while decisions are pending.

## Read before implementation

Read PRD.md, BUSINESS_RULES.md, ARCHITECTURE.md, DATABASE.md, DESIGN_SYSTEM.md, and TASKS.md. Keep terminology, permissions, formulas, schema contracts, and phase gates consistent. Explain discrepancies and correct the documents before encoding conflicting rules. These documents are proposals, not evidence that an implementation or deployment exists.

Use the existing checkout: cloud tasks already run in isolated environments. Do not create a Git worktree unless the user explicitly requests one. Inspect `git status` before edits and preserve existing user changes. Do not reset, delete, or overwrite unrelated work. Do not publish/deploy or send messages to other people without authorization.

## Stack and structure

- Next.js App Router, strict TypeScript, Tailwind, shadcn/ui, Supabase PostgreSQL/Auth, Recharts, PWA, Vercel.
- Pin compatible supported versions at scaffolding; use one package manager and lockfile, frozen installs in CI, and the actual scripts subsequently defined in package.json. There are no valid build/test commands to claim before scaffolding.
- Keep Server Components as the default; introduce client boundaries only for browser interactivity. Server-only modules cannot be imported into client components.
- Organize feature modules and shared money/date/auth utilities according to ARCHITECTURE.md; avoid generic abstraction layers without a concrete repeated need.

## Financial correctness

- Use bigint minor units in PostgreSQL and TypeScript; money DTOs are integer strings. Never use JavaScript floating-point money arithmetic, silently round excess precision, or assume a two-decimal currency.
- Keep agreed/recognized revenue, collections, incurred/paid cost, EMI, funding, repayment, distribution, and cash distinct. Contributions are not revenue; repayments/distributions are not expenses; whole EMI is not automatically cost.
- Do not invent amortization, recognition, tax, depreciation, cancellation charges, profit entitlement, equal shares, or overhead allocation. Implement only approved policies and show incomplete inputs clearly.
- Financial commands must atomically authorize, serialize by business, validate dates/allocations/claims, persist immutable events, store idempotency results, and audit. Never use separate client requests as a transaction.
- Corrections use linked reversals/replacements and reasons. As-of reporting respects each event's effective date. Validate backdated changes across affected historical boundaries, not only today's balance.
- Support negative cash. Never introduce a global sufficient-cash guard that contradicts that requirement. Opening claims and legacy EMI history must not create duplicate current cash.

## Security and data access

- Every business-owned row and relationship is tenant-scoped; use composite business foreign keys. RLS plus server/database role checks are mandatory. IDs and hidden controls are not access control.
- Routine flows use verified user-scoped Supabase clients and narrow RPCs; no service-role shortcut. No secret values in browser variables, code, logs, examples, fixtures, commits, or chat. Check existing binding names/status before requesting secure configuration.
- Financial tables are append-only with no direct authenticated writes. Narrow definer functions require fixed search path, explicit auth/role checks, qualified names, least privileges, and revoked PUBLIC execution.
- Owners manage users/critical settings/funding/distributions/corrections. Partners manage approved daily trips/collections/costs/EMI payments and read reports. Last-owner protection and revocation use the same business lock.
- Never shared-cache authenticated data. Validate safe redirects, invitation token/email rules, CSV text escaping, and log redaction. No offline mutation queue or financial response caching in v1.

## UX and quality

- Follow semantic design tokens, mobile bottom navigation/desktop sidebar, exact money labels, accessible touch targets, visible focus, and responsive daily forms.
- Treat loading, empty, invalid, stale, unauthorized, network-failed, and outcome-unknown states explicitly. Same-intent payment retries reuse the operation key. Confirm success only from committed server results.
- Charts are display-only and have accessible exact tables. Unknown accounting data is not zero. Do not expose implementation details to end users unless needed for a decision.

## Verification and workflow

Before finishing implementation, run the meaningful checks available for the changed scope: typecheck/build for application changes, unit tests for money/date/policy logic, real Postgres integration tests for RLS/constraints/atomicity/concurrency, and relevant E2E for daily workflows. Security/financial regressions need focused tests; documentation-only changes need consistency/link checks, not invented application tests.

Do not disable assertions, signature/checksum/TLS verification, or RLS to force a pass. Distinguish passed, failed, skipped, and unrun checks; never claim deployment or accounting compliance based on a local build. Investigate whether failures are setup defects or repository bugs and report concrete blockers.

Use `rg` for search, batch independent reads, make focused changes, and keep TASKS.md/status evidence current. Report changes, rationale, actual validation, and remaining risks plainly. Run final diff/status checks; retain only intended files. Future changes to these instructions require the same financial/security care as application code.
