# VanLedger — Product Requirements

Status: proposed specification for approval. No application implementation is authorized yet.

## 1. Purpose and users

VanLedger is a mobile-first PWA for two partners running a travel van rental business. It brings trips, customer collections, vehicle obligations, partner advances, and cash reporting into one shared record. Launch with one vehicle, but never encode that limit into the database or financial calculations.

The product must answer: What did trips earn? What was collected? What remains due? What costs were incurred and paid? What cash remains after EMI and partner transactions? What is owed to each partner? These are different questions and require different measures.

The initial product is a management system, not a certified accounting, tax, payroll, or invoicing system. It must support a separate accounting-result view without claiming statutory profit when recognition policies, financing splits, taxes, or depreciation are incomplete. See [BUSINESS_RULES.md](BUSINESS_RULES.md).

## 2. Scope and release boundary

### Required first release

- Supabase authentication; owner and partner memberships; owner-controlled invitations and permissions.
- Business configuration, a single currency and timezone per business, multiple vehicle records, opening financial positions.
- Trip lifecycle, agreed revenue, odometer readings, expense obligations, customer collections, and customer balances.
- Expense obligations and payments for diesel, drivers, other trip costs, insurance, road tax, maintenance, and repairs.
- Existing EMI plan registration, legacy-paid instalment handling, remaining schedules, and explicitly confirmed payments.
- Repayable partner funding, opening advances, partial repayments, and partner-specific histories.
- Separate profit distributions; configurable, explicitly approved sharing percentages; no automatic withdrawals.
- Dashboard, monthly/yearly reports, vehicle/trip reporting, funding statements, CSV export, audit history.
- Responsive navigation, accessible forms, manifest and icons, installation guidance for Android and iPhone.
- Production security, concurrent-write protection, observability, backups and restore procedure.

### Later phases

- Offline reads and writes, background synchronization, push notifications, bank integrations, attachment storage, invoice generation, tax calculations, multi-currency, multiple cash accounts, automated vehicle scheduling, and advanced accounting integrations.
- Service-worker caching of financial data is not part of the first release. Network failure must never look like a successful save.

### Explicit exclusions

Do not create financial postings automatically from reminders, due dates, estimated expenses, an EMI schedule, sharing percentages, or a planned trip. Do not infer cash from profit or treat owner funding as sales.

## 3. Decisions and missing requirements

The following defaults are engineering proposals, not established business facts. Record decisions before implementing dependent financial behavior.

| ID | Missing decision | Proposed approach / release effect |
| --- | --- | --- |
| D01 | Currency, jurisdiction, business timezone, fiscal year | Require owner configuration; ISO currency and its minor-unit exponent, IANA timezone, configurable fiscal start. Do not assume INR, an Indian jurisdiction, or the browser timezone. |
| D02 | Cash cutover and opening positions | Require a dated opening cash balance and separately confirmed partner advances, receivables/payables, and existing EMI history; do not count them as new cash. |
| D03 | Revenue/expense recognition | Propose recognition of agreed revenue on completed trip date and expenses on incurred date. Cross-month trips, cancellation income, and period adjustments need approval. Block authoritative profit reports until decided. |
| D04 | EMI meaning and finance breakdown | Confirm first due date, contiguous historical-paid count, due-day convention, interest/principal/fee breakdown availability, partial-payment component allocation, prepayment and late-fee rules. Never derive amortization from instalment count alone. |
| D05 | Ownership shares and distributable profit | No automatic 50/50 default. Require approved percentages and effective date. Confirm reserves, unpaid liabilities, loss carryforward, withdrawal limits, and entitlement settlement. |
| D06 | Overpayments, refunds, cancellations | Record only approved business cases; decide deposit treatment, cancellation charges, refund authority, and whether customer credit can be held. Pending this, reject receipts above the outstanding balance and disable discretionary refunds. |
| D07 | Trip cost allocation | Direct costs attach to a trip; vehicle/business overhead stays separate. Any allocation of EMI, insurance, tax, shared fuel, or driver costs to trip profitability needs an explicit policy. |
| D08 | Tax and depreciation | Confirm tax-inclusive/exclusive amounts, recoverable tax, depreciation, and required accounting standard. No estimated tax/depreciation; mark accounting output incomplete as applicable. |
| D09 | Historical edits and period closure | Propose owner-only financial reversals, backdating, and reopening closed periods; daily partner entry into open periods. Confirm permissible backdating window and closed-period correction policy. |
| D10 | Operations and privacy | Confirm invitation email provider, owner recovery, data retention, backup/restore targets, compliance region, reminder lead times, and export requirements. |
| D11 | Payment methods and reconciliations | Propose one logical business cash pool, recording method/reference for each payment. Bank/account reconciliation and cash transfers require a later cash-account model. |
| D12 | Trip operations | Confirm vehicle overlap policy, driver/customer details required, price discounts, expense ceilings, and unpaid-trip completion policy. Propose warnings for overlapping trips and allow completion with unpaid balances. |

D01–D04 must be resolved before financial onboarding and authoritative reports. D05 must be resolved before entitlement calculations or profit distribution activation. D06 and D09 must be resolved before their privileged actions are enabled. Other unresolved features remain visibly unavailable or clearly labeled; silence is not approval.

## 4. Roles and permissions

Both partners must be able to perform daily work without sharing credentials. A membership belongs to a business and an authenticated user; a financial partner record can also exist before that partner is invited.

| Operation | Owner | Partner |
| --- | --- | --- |
| View dashboard, trips, reports, business audit history | Yes | Yes |
| Create/edit operational trips, complete trips | Yes | Yes, optimistic version checks |
| Record customer receipts and ordinary expense obligations/payments | Yes | Yes, within open periods and approved rules |
| Confirm scheduled EMI payments | Yes | Yes, within approved plan |
| Record partner contributions, repayments, profit distributions | Yes | No; can view histories |
| Reverse posted transactions, enter opening positions, post cash adjustments, backdate outside normal entry rules | Yes | No |
| Create/change EMI terms, sharing policies, financial period locks | Yes | No |
| Manage profile, vehicles, members, invitations, critical settings | Yes | No |
| Change own authentication credentials | Yes | Yes, through Supabase auth |

Partner funding and distribution permissions are a conservative proposed default because these alter partner claims and critical finances. Obtain approval before broadening them. Navigation visibility is not authorization; enforce the same matrix in server handlers, database functions, and RLS.

## 5. Functional requirements and acceptance criteria

### Dashboard

- Show selected business/month, currency, and data freshness. Display agreed trip amount, recognized revenue (only under an approved policy), collections, incurred costs, paid operating costs, EMI cash paid, operational result, monthly cash movement, and closing available cash with distinct labels.
- Label the agreed-value cohort explicitly: proposed default is trips starting in the selected month, valued from approved price events through the report cutoff. This is a planning metric, not income recognized in that month; completed/cancelled status must be interpreted as of the same cutoff.
- Monthly cash movement includes all posted cash categories; separately show operating cash after EMI so funding cannot disguise operating losses. Negative values must remain negative and clearly labeled.
- Show outstanding customer balances, partner advances, upcoming/overdue EMI, insurance, and road tax. A reminder is an obligation or renewal event, never a payment.
- Provide drilldowns from every financial total to underlying records. The report and dashboard must agree for identical filters and cutoff.

### Trips

- Draft → booked → in progress → completed, with cancellation allowed through an approved cancellation workflow. Record vehicle, name, customer/contact as needed, date range, agreed amount, and odometer readings.
- End date cannot precede start; end odometer cannot be below start. Unknown readings stay null, never become zero. Distance is calculated only with both readings present.
- Record diesel, driver, and additional expense obligations with incurred dates; payment is a separate action. Show direct-cost margin and payment/outstanding summaries separately.
- Record advance, partial, and final receipts with payment date, method, reference, and notes. These labels describe payment timing, not different revenue categories.
- Completed trips remain collectible. A trip cannot be deleted after financially relevant activity; archive or correct it with audited history.
- Receipt screens provide current balance, save-in-progress feedback, idempotent retry, and server confirmation before totals change.

### Vehicle expenses and EMI

- Register existing EMI with original instalment count, historically-paid count, first original due date, monthly amount, and the owner-confirmed history assumptions. Generate only the remaining schedule; historical payments must not become current cash outflow.
- Due/overdue states are derived from dates and net payment allocations. Permit partial payment across multiple confirmations; no instalment may be overpaid through the ordinary flow.
- Preserve fixed plan terms once financially used. Restructuring, irregular history, prepayment, rate changes, and balloon payments require an explicit amendment workflow rather than inferred recalculation.
- Track insurance/tax renewal due dates separately from expense/payment records. Renewal completion and payment are separate facts.
- Allow shared business costs without forcing them onto the first vehicle. Deactivated vehicles remain in historical reports.

### Partner funding and distribution

- Every contribution names a partner and is explicitly repayable. Nonrepayable capital is unsupported until a separate approved model exists.
- Show opening advance + contributions − net repayments per partner; support partial repayment and prohibit repayment above outstanding advance.
- Show profit distributions separately from repayments and costs. Store the sharing-policy version used; changing shares must not rewrite history.
- Cash on hand does not establish distributable profit. Display only recorded withdrawals until the owner approves entitlement/reserve rules. Do not show a fabricated “safe to withdraw” amount.
- Retention means earnings not withdrawn, under an approved earnings policy; it is not another cash receipt.

### Reports

- Monthly and yearly summaries by business-local dates; fiscal-year reporting follows configured fiscal start. Include exact period boundaries and currency.
- Report trip agreed amount, collections, recognized revenue, direct incurred cost, direct margin, and outstanding balance without conflating them.
- Provide expenses by category/vehicle, EMI due/paid/outstanding, all-category cash-flow reconciliation, and partner funding/repayment/distribution histories.
- Include a separate accounting-result report only when required recognition, EMI finance components, tax, and noncash entries are supplied. Show completeness warnings rather than zero-filled unknowns.
- CSV exports must preserve exact amounts, protect against spreadsheet formula injection in text fields, enforce tenant permissions, and include business/period/policy context. Export is not a backup.

### Settings and audit

- Owners manage memberships, vehicle records, policy versions, business locale, reminders, opening positions, and financial period locks. Do not remove the last active owner.
- Critical changes and financial writes create audit events in the same transaction. Members can inspect actor, action, business-local effective date, server timestamp, entity, and approved before/after fields.
- No UI operation silently destroys financial history or rewrites a previously used sharing policy.

## 6. User journeys

1. Owner signs in, creates business, sets currency/timezone, confirms cutover positions and policies, adds vehicle and existing EMI, invites partner.
2. Partner creates booked trip, records customer advance, enters odometer/daily costs, confirms payments, then completes trip. Customer balance remains visible until settled.
3. A reminder opens the relevant instalment/renewal; a user confirms an actual payment. The cash total changes only after the database commits.
4. Owner records funding or repayment and reviews the partner statement; the same cash movement appears once in the cash report.
5. Owner corrects an erroneous posting through a linked reversal/replacement and reason; all partners can trace the change.

## 7. Nonfunctional requirements

- Strict TypeScript, exact money arithmetic, keyboard/screen-reader access, WCAG 2.2 AA target, responsive layouts from 320px width, touch targets at least 44×44px where practical.
- HTTPS, per-business isolation, secure server validation, no browser/service-role secrets, no cross-user response caches, and safe invitation/redirect handling.
- Financial operations are atomic, idempotent, and serialized per business. Read reports from a consistent database snapshot, not client-side sums of paginated records.
- Proposal to verify in staging: p95 daily financial write under 2s and dashboard under 3s on a representative mobile connection at 10,000 trips/100,000 cash postings; measure, do not promise from local results.
- Paginate histories, index tenant/date queries, test two simultaneous partner sessions, and document recovery behavior. Backups require a restore rehearsal before production; targets are D10.
- No offline write queue in v1. Failed/unknown responses must allow a retry with the same operation key without duplicate posting.

## 8. Release gates

Release requires approved blocking decisions, reconciled representative financial fixtures, automated tenant/role/concurrency tests, PWA installation checks on real Android/iOS devices, accessible daily forms, production migration rehearsal, backup restoration, and no unresolved high-severity security defects.

Success indicators: all cash totals reconcile to postings; receipt/repayment retries never duplicate balances; all financial changes identify their actor; the partners can create/collect/pay a trip using a phone; a second vehicle works without schema changes. Track completion rates and latency without collecting sensitive trip details in analytics.

See [ARCHITECTURE.md](ARCHITECTURE.md), [DATABASE.md](DATABASE.md), [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md), and [TASKS.md](TASKS.md) for delivery details.
