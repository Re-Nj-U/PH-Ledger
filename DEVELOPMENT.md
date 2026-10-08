# VanLedger — Running the UI Foundation

## Local development

Use Node.js **22.18 or newer** (validated here with Node 24.19) and npm. From the repository root:

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`. The root redirects to `/b/demo`, the read-only sample workspace. No environment variables, Supabase project, authentication credentials, or database are needed for this phase.

For a production build locally:

```bash
npm run build
npm run start
```

Stop the server with Ctrl+C. No financial entries or settings are persisted. Quick-add forms produce an in-memory preview; closing/reloading does not create a trip, collection, cost, or funding record. Sample CSV download is a local export of synthetic figures.

`next.config.ts` sets `agentRules: false` so the development server preserves the approved AGENTS.md rather than appending generated framework instructions.

## Implemented routes

| Route | Screen |
| --- | --- |
| `/b/demo` | Dashboard; period filter, exact cash summaries, cash chart, upcoming reminders, recent trips |
| `/b/demo/trips` | Search, lifecycle tabs, empty state, and trip detail preview |
| `/b/demo/vehicles/expenses` | Incurred/paid costs, financing schedule, renewals |
| `/b/demo/vehicles/expenses?tab=emi` | Financing tab directly |
| `/b/demo/vehicles/expenses?tab=renewals` | Renewal tab directly |
| `/b/demo/partners` | Partner advances, repayments, separate withdrawals, sample history |
| `/b/demo/reports` | Monthly/Q3 cash reconciliation and sample CSV |
| `/b/demo/settings` | Read-only business, vehicles, team, policy, and audit placeholders |

Unknown workspace IDs return 404. This guard is not production authentication or tenant isolation; those remain later implementation work.

## Code organization

- `app/`: App Router pages/layouts, loading/error/404 boundaries, icon and metadata.
- `components/ui/`: shadcn/ui primitives, with the upstream MIT license retained.
- `components/shell/`: desktop/sidebar rail, header, mobile bottom navigation, More dialog.
- `components/shared/`: quick-add preview, page/section headings, period filter, status badge.
- `components/financial/`: exact money text, summary cards, shared Recharts cash-flow view and exact table.
- `features/*/components/`: the six module screens and their interactive details.
- `lib/mock-data.ts`: all read-only synthetic business/vehicle/trip/expense/partner/period fixtures and read-side demo summaries.
- `lib/money.ts`: integer-string/bigint arithmetic, exact formatting/input parsing, checked display-only chart conversion.
- `app/globals.css`: approved semantic tokens, light theme, system typography, focus, reduced motion and safe-area utilities.

Demo currency **USD**, timezone **UTC**, dates **July–September 2026**, and fictional identities are presentation fixtures, not approved business settings. Select August to exercise a cash deficit. Income received is customer cash; agreed trip value is separate. No accounting profit, EMI interest, sharing percentage, entitlement, or retained earnings is invented.

## shadcn/ui provenance

The environment's network proxy denied the `ui.shadcn.com` registry. Components were installed from the official `shadcn-ui/ui` GitHub source at commit `97ddbf4274ed09d02aa7fd34375f2cf1e48cbbf0`, directory `apps/v4/registry/new-york-v4/ui`, with normal TLS verification. Import aliases were adapted to `@/lib/utils` and `@/components/ui`; buttons/inputs/dialog controls were adjusted for touch targets and viewport sizing.

`components.json` declares the shadcn configuration. Radix UI, Lucide, class-variance-authority, clsx, tailwind-merge, and animation dependencies are installed. Future CLI additions use `npx shadcn@4.21.4 add <component>` when the registry is reachable; they must preserve local token/accessibility customizations. Runtime does not contact that registry. The current official Next.js scaffold uses the Tailwind 4 Turbopack loader configured in `next.config.ts`.

## Validation

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run build
```

Unit checks cover exact large amounts, currency exponents, negative subunit values, precision rejection, fixture reconciliation, and funding/withdrawal category consistency.

Browser checks require Chromium. On a normal local machine, install Playwright's supported browser once, then run after the production build:

```bash
npx playwright install chromium
npm run test:e2e
```

The cloud instance already supplies `/usr/bin/chromium`; it was validated with:

```bash
PLAYWRIGHT_CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e
```

The runner starts/stops the production server on loopback port 3100. Checks cover six screens at 320/390/768/1440px, horizontal overflow, runtime exceptions, automated WCAG AA rules, trip filtering/details, form preview, mobile More navigation, EMI deep links, negative-month reports, sample CSV, and invalid workspace handling. Browser artifacts are ignored by Git.

Automated checks do not establish full accessibility conformance, real-device installation, authentication security, accounting correctness under unknown policies, or deployment. Manual assistive-technology/device checks and the PWA manifest/install/offline work remain later phases. No service worker, Supabase client, real transaction endpoints, or production deployment is included here.
