# PIKU Holidays Ledger

A mobile-first travel business ledger prepared for **Next.js on Vercel**, **Supabase PostgreSQL**, and **Supabase email/password authentication**.

Work in **/Users/pikachu/Documents/ChatGPT/PH-Ledger** (GitHub: Re-Nj-U/PH-Ledger). See [START-HERE.md](START-HERE.md) for the audited workflow. Older ZIPs and other local folders are separate copies.

Start with [the go live guide](docs/VERCEL-GO-LIVE.md). The configured initial owner is `pikuholidays@gmail.com`.

## Business behavior

- Record trips, odometers, agreed INR amounts, trip costs, advances, partial payments and customer balances.
- Recognize agreed income and trip costs in the completion month. Cancelled-trip costs still count as losses.
- Separate monthly result from cash received and available cash.
- Deduct each scheduled EMI automatically in its due month; actual payments reduce cash once. Vehicle loans and purchases on EMI share one section, with optional down payments and principal/interest breakdowns.
- Track renewals, unpaid commitments, loan instalments, partner contributions, repayments and distributions.
- Show itemized monthly statements, cash reconciliation, customer/partner balances and clickable entry details.
- Download formatted Excel monthly reports with numeric INR amounts, dates and formula totals. CSV remains available for data export.
- Owners manage business settings/setup/users. Partners manage daily transactions.
- The sample workspace uses memory only and does not save to the real ledger.

## Setup

Use Node 24.x (also recorded in `.nvmrc` and `package.json`). Run the initial schema in a dedicated Supabase project, disable public signups, and create a confirmed owner Auth account. Follow [the go live guide](docs/VERCEL-GO-LIVE.md) for the exact steps.

Copy `.env.example` to `.env.local`, fill it in privately, and configure the same variables in Vercel. Do not commit credentials or financial backup files.

```sh
npm ci
npm run verify
npm run dev
```

Build and typecheck run sequentially because Next.js writes generated type files. Supabase's transaction pooler connection uses SSL, port 6543 and prepared statements disabled. TLS certificates are verified; DATABASE_SSL_CA can supply the database CA certificate. Queries are serialized on the connection to avoid transaction-pooler pipelining. The database is accessed only from the server.

Optional checks/setup with a private local environment file:

```sh
npm run db:setup
npm run deployment:check
```

## Migrating existing records

Download the real JSON ledger backup from the old site's Settings, initialize the new site as owner, then use **Settings → Records & exports → Import existing ledger backup** before adding any business records. The validated import is atomic and refuses to overwrite a nonempty ledger. Partner login access and complete old audit history are not part of the old export.

The existing Sites deployment remains separate. Stop entry there before the final export and start entry on Vercel only after comparing monthly totals and balances. Changes do not sync between the two sites.

## Documentation

- [Deployment audit, 17 October 2026](docs/DEPLOYMENT-AUDIT.md)
- [Go live guide](docs/VERCEL-GO-LIVE.md)
- [Vercel migration architecture](docs/MIGRATION-ARCHITECTURE.md)
- [Original application blueprint](docs/APPLICATION-BLUEPRINT.md): documents the Sites baseline; financial rules still apply, but hosting/auth/transactions are superseded by the migration architecture.

Legacy Sites build helpers and SQLite migrations in this checkout are reference only. The new scripts build for Vercel; do not publish the migrated source through the old Sites workflow.

### Daily-entry improvements (18 October 2026)

Trips use Details, Expenses and Payments tabs, a date-range calendar, and optional customer details. Diesel, driver, permit and trip fines stay with the trip. Business expenses default to the current expense month; actual cash uses payment dates. Monthly reports use Summary, Income, Expenses and Cash & balances tabs, with complete Excel exports. See `docs/SIMPLE-FLOWS.md` for examples and the changed EMI rule.

### Final usability update (18 October 2026)

Every date/month control uses a shared overlay calendar that stays above dialogs without moving the form. Add trip keeps Trip details, Expenses and Payments tabs and defaults to Completed — paid. The initial receipt uses the trip end date; settling an existing payment-pending trip defaults to today. A small Change control lets users correct the actual receipt date. No payment method is required. Cancellation and refunds are in Trip details. Trips lists and normal details show current balances; monthly reports, CSV and Excel show month-end balances from the same dated receipts/refunds. Existing history is never backfilled with invented payments.

Home-screen manifest and icons support mobile installation; an internet connection is still required. See `docs/WRAP-UP.md` for installation steps, test evidence, encryption boundaries and ASVS limitations.
