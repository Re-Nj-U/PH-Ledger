# PIKU Holidays Ledger

A mobile-first travel business ledger prepared for **Next.js on Vercel**, **Supabase PostgreSQL**, and **Supabase email/password authentication**.

Start with [the go live guide](docs/VERCEL-GO-LIVE.md). The configured initial owner is `pikuholidays@gmail.com`.

## Business behavior

- Record trips, odometers, agreed INR amounts, trip costs, advances, partial payments and customer balances.
- Recognize agreed income and trip costs in the completion month. Cancelled-trip costs still count as losses.
- Separate monthly result from cash received and available cash.
- Deduct the full paid EMI from its payment month's result and cash, while keeping principal/interest breakdowns visible.
- Track renewals, unpaid commitments, loan instalments, partner contributions, repayments and distributions.
- Show itemized monthly statements, cash reconciliation, customer/partner balances and clickable entry details.
- Owners manage business settings/setup/users. Partners manage daily transactions.
- The sample workspace uses memory only and does not save to the real ledger.

## Setup

Use Node 24.x (also recorded in `.nvmrc` and `package.json`). Run the initial schema in a dedicated Supabase project, disable public signups, and create a confirmed owner Auth account. Follow [the go live guide](docs/VERCEL-GO-LIVE.md) for the exact steps.

Copy `.env.example` to `.env.local`, fill it in privately, and configure the same variables in Vercel. Do not commit credentials or financial backup files.

```sh
npm ci
npm test
npm run build
npm run typecheck
npm run dev
```

Build and typecheck run sequentially because Next.js writes generated type files. Supabase's transaction pooler connection uses SSL, port 6543 and prepared statements disabled. The database is accessed only from the server.

Optional checks/setup with a private local environment file:

```sh
npm run db:setup
npm run deployment:check
```

## Migrating existing records

Download the real JSON ledger backup from the old site's Settings, initialize the new site as owner, then use **Settings → Records & exports → Import existing ledger backup** before adding any business records. The validated import is atomic and refuses to overwrite a nonempty ledger. Partner login access and complete old audit history are not part of the old export.

The existing Sites deployment remains separate. Stop entry there before the final export and start entry on Vercel only after comparing monthly totals and balances. Changes do not sync between the two sites.

## Documentation

- [Go live guide](docs/VERCEL-GO-LIVE.md)
- [Vercel migration architecture](docs/MIGRATION-ARCHITECTURE.md)
- [Original application blueprint](docs/APPLICATION-BLUEPRINT.md): documents the Sites baseline; financial rules still apply, but hosting/auth/transactions are superseded by the migration architecture.

Legacy Sites build helpers and SQLite migrations in this checkout are reference only. The new scripts build for Vercel; do not publish the migrated source through the old Sites workflow.
