# PIKU Holidays Vercel go live guide

Updated 17 October 2026. Owner email: **pikuholidays@gmail.com**.

The source is now prepared for **Next.js on Vercel + Supabase PostgreSQL + Supabase Auth**. The existing Sites website remains available. A local build is not a live deployment: the steps below connect your accounts, create the database, configure login and publish the new application.

## 1 Download the current ledger before switching

1. Open the current website: https://piku-holidays-ledger.psrenju08.chatgpt.site/.
2. Use your real business workspace, not the sample workspace.
3. Open **Settings → Records & exports → Download full ledger backup**.
4. Keep the JSON file on your computer. Do not upload it to GitHub or share it publicly.
5. Export the latest monthly report and note closing cash, customer outstanding and each partner's balance. These are the migration comparison values.

The old backup contains business settings and financial records. It does not contain login accounts or the complete old audit history. Recreate partner login access on the new site. Keep the old site available if you need to inspect its history.

## 2 Prepare your Supabase project

Use a new project for this application, or a dedicated project you have already created for it. Choose a database region close to your Vercel function region and your users.

1. Open https://supabase.com/dashboard and select the project.
2. Open **SQL Editor → New query**.
3. Copy the complete contents of `supabase/schema.sql` into the editor and run it.
4. The script creates a private `ledger` schema and four tables: `business`, `members`, `records` and `audit`. It does not delete existing records. Do not run the old SQLite files in `drizzle/`.
5. Open **Authentication → Sign In / Providers** (or the corresponding Auth settings page). Keep email/password enabled and **disable public user signups**.
6. Open **Authentication → Users → Add user → Create new user**. Create `pikuholidays@gmail.com` with a strong password and mark its email confirmed / auto confirmed. Enter passwords privately in Supabase; do not put them into this guide, source files or chat.
7. Create the other partner's email/password account in the same way. They will also need ledger access granted by the owner in the application.

There is no public registration page. A Supabase login account alone does not grant ledger access. Only the configured owner can initialize a fresh business, and other users need an active partner membership. Changing OWNER_EMAIL later does not transfer an existing business to another user. Use the owner-only Settings → Business owner flow instead; see [Owner transfer](OWNER-TRANSFER.md).

If you delete and recreate the owner Auth account, its Supabase user ID changes. Do not do this as a password-reset method; use the account password controls or an administrator recovery flow.

## 3 Collect the four deployment variables

Open the Supabase project's **Connect** dialog and API key settings.

| Variable | What to enter | Visibility |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL, e.g. `https://your-project.supabase.co` | Public |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key, typically beginning `sb_publishable_` | Public; not the secret key |
| `DATABASE_URL` | **Transaction pooler** Postgres connection URI from Connect, using port **6543**, with the real database password | Secret; server only |
| `OWNER_EMAIL` | `pikuholidays@gmail.com` | Server configuration |

Copy the actual pooler host from Supabase rather than guessing the region or hostname. If your password contains URI special characters, percent encode the password portion of the connection URI. Keep the full DATABASE_URL private. The app disables prepared statements and uses a small, SSL-protected connection pool for this connection mode.

TLS certificate verification is enabled for the application and all database tools. If `npm run deployment:check` fails with a certificate trust problem, download your project's CA certificate from **Supabase → Database Settings → SSL Configuration**. Set **DATABASE_SSL_CA** (server only) to the PEM certificate in `.env.local` and Vercel. Literal `\n` sequences between certificate lines are supported. Redeploy after changing Vercel variables and rerun the check. Do not use `rejectUnauthorized: false` or disable TLS to bypass an error. An optional CA placeholder is in `.env.example`. See [Supabase's certificate instructions](https://supabase.com/docs/guides/platform/ssl-enforcement).

No Supabase secret/service-role API key is needed by this application. Browser code uses the publishable key for Auth; financial tables are accessed by the server over Postgres, never directly by the browser.

## 4 Publish the prepared source

### Option A Vercel dashboard with GitHub

The existing main folder is **/Users/pikachu/Documents/ChatGPT/PH-Ledger**, connected to **Re-Nj-U/PH-Ledger**. Continue committing and pushing from that folder; do not re-extract an older ZIP over it. Your existing Vercel project can deploy the latest pushed main commit. The steps below also describe initial setup for a new project.

1. Create a **private GitHub repository** for the Vercel version, for example `piku-holidays-ledger`.
2. Upload the prepared project source or extracted source ZIP. Upload the files and folders inside the ZIP, not the ZIP file itself. `package.json` must be at the repository root.
3. Include `app/`, `components/`, `hooks/`, `lib/`, `db/`, `public/`, `supabase/`, `tests/`, the scripts/ directory, configuration files, `package.json` and `package-lock.json`.
4. Never upload `.env.local`, financial backup JSON, `node_modules`, `.next`, `.wrangler`, `.git`, or `outputs`. The source ZIP excludes private/runtime data.
5. Open https://vercel.com/new, import that repository, and choose **Next.js**.
6. Use **Node.js 24.x** (pinned by the project), root directory the repository root, build command `npm run build`, and install command `npm ci`.
7. Add the four environment variables from section 3 before clicking **Deploy**. Give them Production scope. Preview deployments should use a separate test Supabase project if you want to change/test financial data; do not share a live database with untrusted preview changes.
8. Deploy. Copy the actual production URL Vercel gives you, such as `https://your-chosen-project.vercel.app`.

Your business use requires a Vercel plan that permits commercial use. The Hobby plan is restricted to personal/non-commercial projects; use Pro or another appropriate commercial plan. Partners using the ledger do not each need a Vercel developer seat.

### Option B Vercel CLI without GitHub

Use this if you prefer to publish the local project directly.

1. Open Terminal in the project directory:

```sh
cd /Users/pikachu/Documents/ChatGPT/PH-Ledger
npx vercel login
npx vercel
```

2. Select your Vercel account/team, create or link the project, use the current directory as the root and accept the Next.js framework configuration. The first command creates a preview/project; if environment variables are not set yet, sign-in remains unconfigured.
3. In that project's Vercel dashboard, open **Settings → Environment Variables**. Add all four values with Production scope.
4. Publish production from the same Terminal directory:

```sh
npx vercel --prod
```

Environment variables added or changed in Vercel take effect in new deployments. Redeploy after changes.

## 5 Configure the production login URL

If you connected Supabase through Vercel Marketplace, confirm it is the **same Supabase project** where you ran `schema.sql` and created the owner. The integration can populate the public URL/key automatically. It often uses `POSTGRES_URL` for the database connection; this application reads **`DATABASE_URL`**, so explicitly set that name to the verified transaction pooler URI. `OWNER_EMAIL` must also be set manually. Do not use a non-pooling URI or a Prisma-specific URI for this application's connection.

Before importing real data, review [the scoped security assessment](SECURITY-REVIEW.md). It does not claim full ASVS compliance; live authentication, session, TLS and provider settings remain part of verification.

In **Supabase → Authentication → URL Configuration**, set **Site URL** to the actual production URL. Add `http://localhost:3000` only if you plan to develop locally. If you later use your own domain, update this Site URL to match it.

The current app uses password login without an email callback. Owner/partner accounts can be created directly through Supabase, so SMTP is not needed for initial sign-in. There is no public forgot-password email form. Users can change a known password from Settings. For forgotten passwords, the administrator must use Supabase account recovery; email recovery or invitations need SMTP and redirect configuration. Do not rely on the built-in test mail service for production delivery.

## 6 Initialize the owner and import existing records

1. Open the new production site and select **Sign in**.
2. Sign in as `pikuholidays@gmail.com` using the password you created privately in Supabase.
3. Your first successful authorized ledger load creates the owner/business rows. An unapproved email cannot claim the business.
4. Before adding vehicles, trips, partners or other business records, open **Settings → Records & exports → Import existing ledger backup**.
5. Choose the real JSON backup from section 1. Review its business name and record count, then click **Import ledger**.
6. Import is limited to a real backup under 3 MB and up to 10,000 records. It validates fields, references, dated repayments/refunds and EMI limits. The whole import is atomic. Invalid data leaves the target ledger unchanged.
7. The importer copies financial records and business settings while keeping the new Supabase owner identity. It does not copy old login accounts or audit history. It records the import in the new audit trail.
8. Existing records are never overwritten. After an import, the import button disappears. If you already created records in the target, stop and inspect them; do not delete/reset a database just to make import work.

If you have no existing financial records, skip import and configure business start date, opening cash, reserve, vehicle, loan and partner accounts in Settings.

## 7 Give the partner access

1. In Supabase Authentication, ensure the partner has a confirmed email/password account.
2. As owner in the new application, open **Settings → Users → Add user**.
3. Enter the partner's name and the exact same email used in Supabase.
4. The partner signs in at the same website URL. They can manage daily transactions and read reports; business/user/setup settings remain owner only.
5. To revoke ledger access, deactivate the user in application Settings. The backend checks active membership on every request.

Partner login users and financial partner accounts are separate. Imported contributions/repayments belong to the existing financial accounts and do not depend on matching a partner login ID.

## 8 Verify before switching daily work

Compare the old and new sites for the same month. Use actual values from your ledger rather than making test entries in production.

- Trip count, names, statuses, odometers and agreed amounts match.
- Trip income and expense totals match the completed-trip rules.
- Full paid EMI reduces that month's result and cash; principal/interest fields remain intact.
- Closing cash, customer outstanding, unpaid commitments and partner balances match the old reports.
- A partner can read reports and enter daily transactions, but cannot save owner-only settings or users.
- An unapproved Supabase account gets no business data. A signed-out `/api/ledger` request returns 401.
- Login, sign-out and change-password screens work on mobile and desktop.
- A backup and monthly CSV can be downloaded from the new site.

Choose a short switching window. Ask both partners to finish entry on the old site, take the final backup, import once into the empty new ledger, compare reports, and then start new entries on Vercel. Do not enter transactions on both sites after switching: the databases do not synchronize.

Keep the existing site and final backup available until migration is verified. If the new setup is not verified, continue using the old site. If you later roll back after adding new transactions, those transactions need to be reconciled; the old site will not have them automatically.

## 9 Optional custom domain

In Vercel **Project → Settings → Domains**, add your domain and follow the exact DNS records shown there. Once it is working, update Supabase's Site URL. A custom domain is optional; the production `vercel.app` URL is sufficient to start.

## 10 Local checks and maintenance

For local development, copy `.env.example` to `.env.local` and fill it in privately. Use a separate test Supabase project for development.

```sh
npm ci
npm run db:setup
npm run deployment:check
npm run verify
npm run dev
```

Run `build` and `typecheck` sequentially, since Next.js generates type files during its build. `db:setup` creates tables without deleting existing records. `deployment:check` checks required variables, database/schema access and disabled public signups. It never prints credentials. It does not replace real owner/partner login tests.

An optional command-line import is available after owner initialization:

```sh
npm run db:import -- /absolute/path/to/real-backup.json
```

It uses the same validation and empty-ledger guard as the UI. Keep backups in ignored `migration-backups/` if storing them in the project directory.

Keep a regular ledger JSON export. Supabase backup/restore availability depends on its plan; review it separately. This migration adds initial import, not a general overwrite/restore operation. Monthly edits still recalculate historic reports; month locking remains future work.

## What has changed in the source

- Standard Next.js commands replace the Sites/Vinext/Cloudflare build.
- Supabase cookie-based Auth verifies identities with the Auth service; Sites authentication headers are no longer used.
- Email/password login, own-password change and sign-out are added.
- Only the configured confirmed owner email can initialize a new business.
- The API uses a private PostgreSQL schema and parameterized values.
- Writes lock the business row, compare its revision, and atomically commit records, audit and revision. Stale edits return 409.
- The owner can import a validated backup into an empty ledger.
- Existing financial calculations and monthly report behavior remain intact.
- The earlier application blueprint describes the Sites baseline. This guide and `MIGRATION-ARCHITECTURE.md` document the Vercel differences; financial rules still apply.

## Official references

- Next.js hosting: https://vercel.com/docs/frameworks/full-stack/nextjs
- Vercel environment variables: https://vercel.com/docs/environment-variables
- Vercel CLI deploy: https://vercel.com/docs/cli/deploy
- Vercel commercial plan rules: https://vercel.com/docs/plans/hobby
- Supabase SSR clients: https://supabase.com/docs/guides/auth/server-side/creating-a-client
- Supabase PostgreSQL connection/pooler: https://supabase.com/docs/guides/database/connecting-to-postgres
- Supabase password login and email recovery: https://supabase.com/docs/guides/auth/passwords
