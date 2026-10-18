# Application wrap-up — 18 October 2026

## Security status

OWASP ASVS 5.0.0 is the application's review baseline. Implemented controls include server-verified Supabase identities, active membership/owner checks, a private ledger schema, RLS with no browser-facing ledger grants, bound SQL, validated transaction batches with revisions, same-origin JSON writes, bounded request bodies, protected production cookies, verified database TLS, safe errors and export formula-injection protection. A source review and passing tests do not constitute a full ASVS assessment or certification.

Public production checks against https://ph-ledger.vercel.app/login confirmed HTTPS, private/no-store caching, HSTS, frame blocking, nosniff, no-referrer, a restrictive permissions policy and the configured limited CSP. The signed-out ledger API denied access. These checks do not test authenticated owner/partner endpoints or every hosting control.

A fresh `npm audit --omit=dev` returned zero known production dependency advisories on this date. It does not cover development-tool findings, undisclosed vulnerabilities or application business logic. See SECURITY-REVIEW.md and DEPLOYMENT-AUDIT.md for the earlier unresolved development-tool findings. No dependency versions changed in this usability update.

Still unverified: the full ASVS requirements; deployed role/record-access negative tests; provider signup/password/rate-limit configuration; session revocation; complete script CSP; database least-privilege credentials; backup retention and a proved recovery exercise. No provider account settings, credentials, database permissions or authentication rules were changed here.

References: [OWASP ASVS](https://owasp.org/projects/asvs), [Supabase security](https://supabase.com/security), [Vercel security](https://vercel.com/docs/security).

## Encryption boundaries

Vercel serves the site over HTTPS. The server database client explicitly requires TLS certificate verification and supports the Supabase CA certificate. Supabase documents AES-256 encryption at rest and TLS in transit for its hosted service. This provider assurance is distinct from independently verifying every setting in this particular account.

The ledger does not implement end-to-end or per-field encryption: authenticated users and authorized database administrators can read permitted records. Downloaded Excel, CSV and JSON files are not password-encrypted. Protect devices and downloaded backups accordingly. The application does not create an offline cache of financial records.

## Mobile and home screen

The interface is responsive and was checked at 390 × 844, including the calendar, expense switches and combined completion/payment flow. No horizontal page overflow was observed. The new manifest includes standalone display, scope/start URL, a dark-green theme, 192/512 icons, a maskable icon and an Apple touch icon. Actual installation on the user's iPhone/Android has not been performed here; browser support and the wording of installation prompts vary.

- iPhone: open the deployed site in Safari → Share → Add to Home Screen → Add. If the browser offers Open as Web App, leave it enabled.
- Android: open in Chrome → menu ⋮ → Add to Home screen / Install app.

Sign in normally. An internet connection is needed to read/save records. Installing does not bypass login or add offline transactions. The Settings page contains the same instructions.

References: [Apple instructions](https://support.apple.com/guide/iphone/bookmark-a-website-iph42ab2f3a7/ios), [web app installability](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable).

## Consistent trip/payment rules

Completed — paid confirms the remaining payment and writes it with the trip in one atomic batch, using the trip end date for a new completion or today for a later settlement, with a Change control for the actual receipt date. Existing advances are deducted. Editing an already settled trip adds no duplicate receipt. A server check rejects a settlement if another device changed the balance first; the database revision guard also prevents writes racing after validation.

Completed — payment pending marks the journey ended without inventing a full payment. It still counts agreed trip income and trip expenses in its end month. Its balance carries until paid. Existing completed/unpaid trips display this pending label without migrating their stored data. Labels use the selected cutoff when viewed in reports.

Trip details, filters, customer balances, dashboard cash, monthly report, CSV and Excel all use the same underlying dated receipts/refunds. Refunds or corrections can restore a pending balance. Advances and partial payments remain available through Update payment and the trip's Payments tab; cancellation and refunds live in Trip details; fully paid trips have no redundant collection button in their payment history.

## UI corrections

All day/month fields share one styled overlay calendar with month/year selection, Today/This month, date ranges, optional Clear, min/max dates and keyboard Escape. This includes business settings, expenses, EMI plans, partner transactions, payment forms and report month selection.

Trip expense, Business expense and Bought on EMI remain available in the same expense-entry flow. Switching preserves the draft for each choice until the dialog is closed. Other expense descriptions are required for new or changed generic records; older generic records remain readable/importable. Tap, dialog, selection and success cues respect reduced-motion preferences.

No SQL migration or new dependency is required. Deploy the entire source update including public/icons; keep secrets in Vercel environment settings.

## Final trip simplification check — 18 October 2026

New entries default to Completed — paid and retain the Trip details, Expenses and Payments tabs. In progress and payment-method selectors are removed. Trip amount is the agreed total. Current Trips lists and normal details share current payment totals; monthly reports/exports retain historical month-end totals. Late settlement defaults to today rather than silently backdating cash. Original payment records are preserved.

The calendar uses a native top-layer popover (with a positioned fallback). Desktop and 390 × 844 mobile checks verified that opening the calendar does not change form geometry; Escape closes only the calendar. A sample September trip settled in October showed paid in the current list/details, unpaid in September's report, and one dated October receipt. Cancellation confirmed and recorded one full refund. No SQL migration or dependency change is needed for this update.
