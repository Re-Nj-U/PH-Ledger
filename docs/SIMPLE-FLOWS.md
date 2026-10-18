# Daily entry and monthly EMI rules

Updated 18 October 2026. This supersedes the earlier rule that recognised EMI expenses in the payment month.

## Trips

Create/edit a trip using Trip details, Expenses and Payments tabs. Customer name, phone and notes are optional. Select a start/end range, tapping the same date twice for a one-day trip. Add up to ten new costs and a received payment together; the server saves the batch atomically. Saved costs/payments retain their own editable records through Trip details.

Diesel, driver, permit, fines and other trip costs follow the trip's completion month (or cancellation month for losses). Older fines without trip links remain business costs until explicitly changed. When finishing, choose Completed — fully paid (records the remaining receipt with its confirmed date/method in the same save) or Trip ended — payment pending (creates no full-settlement receipt). Both count income when the journey ends. Customer balances carry until receipts or refunds settle them.

## Business expenses

Select Trip expense or Business expense first. Business expense month defaults to the current month, independently of actual payment date. Existing records without an expense month retain their original date month. Insurance and road tax show renewal fields. New fines, maintenance and other one-off costs have no renewal fields. Unpaid costs can still have payment due dates. Historical due items and their settlement relationships remain intact.

## Vehicle and purchase EMI plans

Expenses → EMIs contains vehicle loans and purchase plans (for example, tyres). The owner sets the item/loan name, vehicle, start date, first due date, EMI amount, total count and already-paid instalments. Existing vehicle loans continue to work. Optional down payment and its actual date are stored on the plan, contributing one derived business expense and one cash movement; do not also enter the purchase's full value as an expense. There is no extra SQL migration.

Full scheduled instalments reduce the monthly result in their due month. No background job, duplicate expense record or automatic bank transfer is created. The calculation works even if nobody opens the app that month and stops at the end of the schedule. Instalments already paid before ledger start are excluded.

Mark EMI paid prefills the plan, instalment and remaining amount. Confirm payment date and amount; enter optional principal/interest if known. Partial payments leave the unpaid remainder. Cash uses the actual payment date. A late payment does not deduct the expense again in the later month; an early payment reduces cash now, but its monthly deduction stays in the due month. The server caps combined payments at the instalment amount and prevents changing schedules after payments exist.

Example: tyres financed for six instalments of ₹3,000 with a ₹6,000 down payment. The purchase month records the ₹6,000 down payment once. Each instalment's due month deducts ₹3,000. Confirmed payments reduce cash separately. Never add another ₹24,000 expense for the same purchase.

## Profit, available cash and partner contributions

Monthly result = completed-trip agreed income − trip costs − business costs − full scheduled EMI.

Actual cash = opening cash + customer receipts + partner contributions − refunds − paid expenses − actual EMI payments − partner repayments − distributions.

Cash available = actual cash − unpaid commitments due through the selected month end − protected reserve. Paying an already-reserved instalment reduces actual cash and the pending commitment together; it does not reduce available cash twice. Future months' instalments and all partner debt are not automatically reserved by this figure.

Partner contributions remain manual records of money actually invested. They increase cash and repayable partner debt, not income or monthly profit. A loss does not automatically create a contribution; carried-forward cash can cover it.

The optional interest-based profit breakdown is incomplete until the scheduled instalments have complete known interest amounts. The main monthly result always uses the full instalment.

## Reports and compatibility

Summary, Income, Expenses and Cash & balances tabs keep the page shorter. Entries open their underlying details. Scheduled EMI rows open the plan schedule/history; down-payment rows open the plan. Excel and CSV include the full report regardless of the selected tab.

Because the EMI rule changed, older reports can show different monthly results when payments were early, late or partial. Actual cash and stored payment history are unchanged. Backup/export retains new plan fields and expense month. No credentials, schema permissions or owner/partner access rules changed.

## Shared experience rules

All date and month fields use one calendar, including trip ranges, standalone payments, expenses, partner transactions, due dates, loan setup and business settings. The expense entry type selector remains visible when switching to a purchase EMI plan and preserves drafts for each type. Other trip/business costs require meaningful descriptions on new entries. Small motion/tap cues respect the operating system's reduced-motion setting.

Displayed trip payment status is derived from dated receipts and refunds. Fully paid completion creates only the remaining receipt; repeating an edit adds no receipt if the trip is already settled. The server checks that the submitted settlement matches the current ledger and rejects stale balances before the atomic write. Existing ended/unpaid trips display payment pending without rewriting history. Payment corrections and refunds can change that derived status again.
