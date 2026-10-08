# VanLedger — Business and Financial Rules

Status: proposed contract. Rules labeled **decision required** must be approved before the dependent feature becomes authoritative. Technical safeguards and distinctions below apply regardless of the chosen accounting policy. Decision IDs refer to [PRD.md](PRD.md).

## 1. Vocabulary and boundaries

| Term | Meaning | Cash effect |
| --- | --- | --- |
| Agreed trip revenue | Current contractual price, with versioned amendments | None until collection |
| Recognized revenue | Amount attributed to a period under an approved policy | None by itself |
| Customer receipt | Actual customer payment received, including advance/partial/final | Inflow |
| Expense obligation | Incurred cost, paid or unpaid | None until payment |
| Operating expense payment | Settlement of a recorded ordinary expense | Outflow |
| EMI payment | Actual loan-instalment cash payment | Outflow; whole payment is not automatically expense |
| Partner contribution | Repayable funding advanced to business | Inflow; not revenue |
| Partner advance repayment | Settlement of that partner's advance | Outflow; not expense |
| Profit distribution | Recorded partner profit withdrawal | Outflow; not expense or advance repayment |
| Available business cash | Opening cash plus signed posted movements through a cutoff | May be negative; not bank-verified or withdrawable profit |
| Retained earnings | Cumulative recognized result less distributions, subject to opening equity and accounting policy | Not a new cash transaction |

The management subledger is not a general-purpose double-entry ledger. Each actual external cash event appears once in the cash ledger. Expense records, reminder dates, and loan schedules never create duplicate cash entries. Transfers between physical accounts are outside the single-pool v1 model.

## 2. Money, dates, and signs

- Store amounts as signed-range PostgreSQL `bigint` **minor units**; ordinary transaction amount fields are positive, with inflow/outflow stored separately. Cash balances may be negative. Use checked integer arithmetic and reject overflow.
- API money values are base-10 integer strings; server/client arithmetic uses `bigint`, not floating-point `number`. Parse localized input from a decimal string using the configured exponent. Reject excess precision rather than silently round.
- The business selects one supported ISO currency and exponent (e.g., 0, 2, or 3); never assume two digits. Every ledger transaction carries matching business currency. Currency/exponent cannot change after opening positions or financial records exist.
- Percentages are integer basis points; an active policy sums to 10,000. No implicit equal split. Only an approved rounding rule may allocate a remainder; no cumulative rounding loss may create money.
- Approved policy versions apply prospectively and are pinned on their financial events. A newly dated version cannot silently replace a policy interval already used; historical changes need the approved amendment/correction workflow.
- `business_date` is the explicit effective financial date in the configured timezone; `created_at` is the server UTC audit timestamp. Do not derive financial date from a UTC midnight or a phone clock.
- Periods use inclusive start, exclusive end. Backdated entries change relevant open-period reports; closed-period changes require owner reopening or a separately approved current-period correction policy (D09).
- Timezone changes after postings require owner review and must never reinterpret stored business dates. Fiscal calendar changes affect presentation, not posted dates.

## 3. Source of truth and lifecycle

- Draft operational data does not affect cash. Posted cash transactions, allocations, recognition events, and opening claims are immutable. Do not edit/delete a posting to correct it.
- Each financial command has a business-scoped idempotency key and canonical payload hash. Identical retries return the original outcome. Reusing the key with another payload is a conflict.
- Validate authorization, period, balance limits, links, idempotency, and audit insertion in one database transaction. Serialize financial writes with the business finance lock; compare entity versions for operational edits.
- A correction reverses a posted event and may post a linked replacement atomically. Require actor, effective date, reason, and link to the original. The reversal copies original amount/relationships and flips the effect. An original can be reversed once; reversal records cannot themselves be reversed.
- Corrections must preserve dependent invariants: reversing funding cannot make advance claims negative; reversing cost cannot strand its payment; reversing a receipt may reopen receivables; reversing an EMI payment must reopen its allocation. Reject invalid corrections and explain required dependent actions.
- Closed-period protection applies to effective dates for both original/reversal/replacement. A reversal dated later does not erase an original from an earlier as-of report. Reporting nets events by their own effective dates.
- Ordinary users cannot supply arbitrary signed cash entries. Only typed commands derive directions; an owner-only opening/adjustment command requires explicit sign and reason. Technical audit logs cannot be used as a financial source of truth.

## 4. Cash formulas

For a business and period `[a, b)`:

```text
movement = customer_receipts - customer_refunds
         - operating_expense_payments - EMI_payments
         + partner_contributions - partner_advance_repayments
         - profit_distributions + signed_cash_adjustments
opening_at_a = baseline_opening_cash + movements_before_a
closing_at_b = opening_at_a + movement
operating_cash_after_EMI = customer_receipts - customer_refunds
                        - operating_expense_payments - EMI_payments
```

Every term is net of dated reversals. The one-time baseline opening posting is outside recurring monthly movement and establishes cash at the cutover start. Owner opening cash can be negative; zero opening cash is stored in the cutover record without a zero transaction. Adjustments are visible as their own category and never disguised as revenue.

“Monthly cash surplus/deficit” means operating cash after EMI and must be labeled as such. “Total monthly cash movement” includes financing, distributions, and adjustments. Both are needed. Closing cash is cumulative, not merely this month's result. No cash-sufficiency rejection is applied globally: negative cash is supported, though the UI warns that reconciliation may be needed.

Opening receivables/payables and partner claims are separate obligations, not fresh cash. A legacy customer payment after cutover increases cash and settles opening receivable but does not create new revenue. A legacy payable payment reduces cash without re-expensing a prior-period obligation.

Reports begin at or after cutover. Generic cash reversal excludes the baseline `opening_cash` posting; opening corrections require a separately approved D02/D09 amendment workflow preserving the baseline and dated history, and remain disabled in v1 until specified.

## 5. Revenue, cost, and accounting result

**Decision required: D03, D07, D08.** Proposed management policy:

- Recognize a completed trip's approved agreed amount on its completion business date. Store an immutable recognition event with trip revision/policy. Draft/booked/in-progress trips show agreed amount but not recognized revenue.
- Recognize ordinary cost on incurred date, independent of cash payment. Direct trip costs and shared costs remain distinct. Cross-month trips may therefore incur costs before revenue; do not shift dates merely to make monthly margins positive.
- Current trip direct margin = current approved agreed price − net direct incurred costs. It is a lifetime estimate while unfinished, and excludes unallocated overhead/EMI. It is not the cash collected or the accounting profit.
- Management operating result = recognized trip revenue − recognized operating costs. Accounting result additionally includes approved interest/fees, tax treatment, depreciation, and other approved noncash adjustments. Label scope precisely; avoid double-counting finance interest already included as a recognized cost.
- EMI principal is liability settlement, not expense. EMI interest/fees may be recognized costs under the approved accounting policy. When the breakdown is unknown, report EMI cash and **accounting result incomplete**, not zero interest or an invented schedule.
- A price amendment after recognition needs an immutable delta recognition event with policy, reason, and approved effective date. Do not mutate the original recognition. Completion cancellation/reopening needs a controlled recognition correction, not a free status toggle.
- Noncash accounting entries must reference an approved adjustment type/policy and remain separate from cash adjustments. Depreciation and opening retained earnings require actual owner-supplied inputs, not estimates.

Do not claim “accounting profit” or “retained earnings available to withdraw” until the approved policy, opening result/equity inputs, financing components, and required adjustments make that statement complete. The accounting-result view must state its policy, completeness, and unsupported statutory features.

## 6. Trips and customer balances

- One trip belongs to one business and one vehicle. Vehicles cannot be switched after posting activity through an ordinary edit; an audited owner correction must preserve attribution.
- End date ≥ start date. Odometer values are nullable nonnegative integers in kilometers in v1; confirm alternate units before rollout. End ≥ start; distance = end − start only when both exist. Never overwrite another trip's readings to fix a conflict.
- Agreed amount is nonnegative; zero-price trips require an explicit confirmation. Price amendments are versioned and cannot reduce the obligation below net collections without the approved credit/refund workflow.
- Proposed v1 receipt allocation: one customer receipt belongs to one trip, or one identified opening receivable. Multi-trip receipts/unallocated customer wallets are deferred. The full receipt is allocated; no orphan cash payment.
- Outstanding = net current collectible amount − net allocated receipts. Advances reduce receivables, not recognition. Receipt timing labels do not affect accounting.
- **Decision required: D06.** Until credit/refund policy is approved, prohibit receipts exceeding outstanding. If credits are later allowed, show customer credit separately rather than silently clamp negative outstanding to zero.
- Refunds are outflows linked to an original receipt and reason, with cumulative refunds capped by eligible collected funds. Refund does not by itself reduce agreed/recognized revenue. Cancellation/price credit changes require their own versioned obligation and recognition adjustments.
- Expense “additional” means explicit category/description; no generic untraceable offset to trip income.
- Proposed: allow completed-but-unpaid trips; warn on overlap. Cancellation with receipts/costs cannot proceed without a documented settlement decision. Do not automatically refund, recognize cancellation charges, or erase incurred expenses.

## 7. Expenses, renewal events, and payments

- Expense obligation includes incurred date, category, amount, business, optional vehicle/trip, creator, and whether it is an opening payable. A trip-linked expense must use the trip's vehicle and business.
- Multiple payment allocations may settle an expense. Net allocations cannot exceed its net obligation. V1 supports one expense per payment; record separate payments for a batch rather than create ambiguous amounts.
- Unpaid cost affects recognized costs if the approved policy requires it, but not cash. Paying it affects cash once and must not recognize the cost again.
- Once linked to a payment or recognition, changing amount/category/date requires an expense revision/adjustment, appropriate period permission, and audit. Proposed v1: full correction by dependency-safe reversal/replacement; partial supplier credits require approved return/refund workflows.
- Insurance/tax reminders record due/expiry dates, not cash expense. Paying a renewal and updating the renewal date are separately audited actions. The period over which annual insurance/tax is expensed is D03/D08; do not automatically amortize.
- Shared business overhead uses no vehicle/trip ID. Reports show “Business/shared” as a separate group. Trip allocation methods and fuel stock accounting remain unimplemented until D07 is approved.

## 8. EMI rules

- Original count `N > 0`; historical contiguous paid count `0 ≤ P ≤ N`; instalment amount > 0; remaining count = `N − P`. These are schedule counts, not proof of remaining principal.
- **Decision required: D04.** Proposed monthly schedule anchors each due date to the original due-day and clamps to the last day of shorter months, without drifting subsequent months. Example: 31 January → 28/29 February → 31 March. First due date means original instalment #1, not loan disbursement date.
- The contiguous-paid shortcut is allowed only after owner attestation that instalments 1..P were settled and no residual arrears exist. For noncontiguous/partial history, require explicit imported instalment states and unpaid amounts; block shortcut registration rather than invent history.
- Historical settled instalments create no new ledger entries. All known remaining instalments use original sequence numbers P+1..N and immutable term version. A fully paid plan creates no remaining dues.
- Partial manual payments use allocation rows and business dates. Paid amount is net allocation; remaining = due − paid. Overdue means due date earlier than current business date with balance > 0; “paid” requires full settlement.
- Do not accrue late fees, mark paid, or deduct cash when time passes. Confirmed payments can occur early/late; prepayment across future instalments, balloons, and lender restructuring need explicitly approved workflows.
- A supplied principal/interest/fee breakdown must be complete and sum to the due amount. All components may be unknown; partial invented components are invalid. Create approved interest/fee expense obligations once per instalment/component, with no duplication through manual expense entry.
- Partial-payment allocation among principal, interest, and fees is D04, not automatically proportional. Until approved, only total instalment cash and total remaining scheduled amount are authoritative; do not display a fabricated principal-paid balance.
- “Remaining scheduled payments” is the sum of outstanding schedule amounts. Do not label it loan principal, foreclosure amount, or lender-confirmed balance.

## 9. Partner claims and distributions

```text
outstanding_advance(partner, cutoff)
  = opening_advance + net_contributions - net_repayments
```

- Opening advance is a noncash dated claim; it must not also be posted as a new contribution. Opening claims are auditable and immutable after confirmation.
- Each funding/repayment identifies one partner and the business. Proposed repayment allocation consumes that partner's aggregate repayable balance; tranche-specific repayment priorities/interest are deferred pending agreement.
- Outstanding advance may not become negative at any effective-date boundary. Validate current and historical affected balances when backdating or reversing, not only today's aggregate. The same applies to trip, payable, and instalment allocation ceilings.
- A partner's personal expense is not automatically business funding. If a partner paid a supplier directly, require an approved explicit noncash advance + obligation settlement workflow; v1 must not fake cash in/out to accommodate it.
- Profit distributions reduce cash and equity/result allocation, not advance claims or expense. An available advance balance cannot authorize a profit distribution.
- Sharing percentages are versioned, effective-dated, owner-approved, sum to 100%, and never rewrite earlier withdrawals. Owner UI must require confirmation of both partners' agreed shares.
- **Decision required: D05.** Entitlements, rounding remainder, reserves, treatment of prior losses, and distributions above earned entitlement require business agreement. Before that, only record authorized withdrawals; do not auto-calculate or enforce a guessed entitlement limit. Do not enable profit-distribution posting until the recording/approval rule is approved.
- Negative cash does not automatically prohibit distributions under the cash model; withdrawal safeguards are an explicit business policy, not an inferred accounting rule.

## 10. Opening positions and reconciliations

- Owner confirms one business cutover date and a non-secret provenance note. Opening cash is effective at start of that date; ordinary transaction dates cannot precede cutover.
- Opening trip/customer balances, unpaid expenses, partner advances, and EMI history carry import references and are excluded from current-period revenue/cost recognition unless explicitly part of the approved cutover policy.
- Opening balances require reconciliation to external records. Opening retained earnings/equity cannot be inferred from opening cash. A negative opening cash does not establish a new liability without a supplied obligation.
- Cash adjustments require owner reason, evidence reference, and dedicated category. No silent balancing entry to make a report match.
- Report invariant: opening + inflows − outflows = closing, including all categories and reversals. Review mismatches as defects/data issues, not a rounding tolerance.

## 11. Worked acceptance fixture

Amounts below are whole currency units for readability; implementations store their exact minor-unit equivalents. Assume an approved completion/incurred-date policy, no finance interest or noncash adjustments included in the operating result.

| Event in month | Amount | Cash | Operating result |
| --- | ---: | ---: | ---: |
| Opening cash | 1,000 | Baseline 1,000 | 0 |
| Completed trip agreed amount | 10,000 | 0 | +10,000 |
| Customer collections | 6,000 | +6,000 | 0 |
| Operating costs incurred 3,000, of which paid 2,500 | 3,000 | −2,500 | −3,000 |
| EMI paid, breakdown unknown | 2,000 | −2,000 | Unknown finance component |
| Partner contribution | 4,000 | +4,000 | 0 |
| Partner repayment | 1,000 | −1,000 | 0 |
| Approved recorded distribution | 500 | −500 | 0 |

Results: operational result before financing/noncash = 7,000; customer outstanding = 4,000; payable = 500; operating cash after EMI = 1,500; total cash movement = 4,000; closing cash = 5,000; net new partner advance = 3,000. Accounting profit is incomplete because the EMI breakdown/accounting inputs are unknown. A second month with no collections and 2,000 paid costs has negative cash movement; do not clamp it to zero.

## 12. Required edge-case tests

- Duplicate receipt submissions, timeout after commit, reused key with different payload, and two simultaneous receipts competing for the final balance.
- Simultaneous partner repayments, membership revocation during a command, and tenant-spoofed linked IDs.
- Receipt in a different month from recognition; unpaid incurred cost; pre-cutover obligation settled after cutover; negative opening/monthly/closing cash.
- Leap-year/short-month EMI dates, P=0/P=N, partial/early/late payment, noncontiguous legacy history, payment reversal, and no due-date-generated cash.
- Unknown odometers, zero-price trip, cross-month trip, completed-unpaid trip, cancellation with collections, price reduction below receipts.
- Backdated reversal crossing periods, funding reversal after repayment, backdated repayment before funding, and closed-period rejection.
- Large amounts beyond JavaScript safe integer range, currencies with 0/3 decimals, arithmetic overflow, basis-point remainder, and export formatting.

Tests must encode approved policies with explicit policy fixtures. An unresolved financial decision must not be turned into a test that accidentally establishes the rule.
