# VanLedger — Design System and Interaction Contract

Status: proposed light-theme design specification. Validate tokens and interactions in the implemented components before claiming accessibility conformance.

## 1. Product feel and information hierarchy

VanLedger should feel calm, precise, and quick to use on a phone. Use restrained teal accents, neutral surfaces, readable amounts, generous touch spacing, and plain financial labels. The visual hierarchy is: business/context → primary financial status → next action → supporting detail. Avoid decorative gradients, crowded cards, misleading rounded totals, and color-only signals.

Daily tasks should work one-handed: create trip, collect payment, record expense, confirm EMI. Advanced administrative controls should be discoverable without competing with those actions. A premium interface comes from consistent spacing, typography, feedback, and data clarity, not visual effects.

## 2. Foundations and tokens

Use semantic CSS variables mapped into Tailwind and shadcn/ui conventions (`background`, `foreground`, `card`, `primary`, `muted`, `border`, `ring`, `destructive`). Components consume semantic tokens instead of inline hex values. Use the syntax compatible with the pinned Tailwind/shadcn version; these are design values, not a generated config.

| Token | Initial value | Use |
| --- | --- | --- |
| background | `#F6F8FA` | App canvas |
| surface/card | `#FFFFFF` | Cards, forms, dialogs |
| foreground | `#0F172A` | Main text, exact amounts |
| muted-foreground | `#475569` | Supporting labels; still readable |
| muted-surface | `#EEF2F6` | Secondary areas and skeletons |
| border | `#DCE3EA` | Decorative separators; not sufficient alone for essential input boundaries |
| input-border | `#64748B` | Visible editable/control boundaries |
| primary | `#115E59` | Primary actions and active navigation |
| primary-foreground | `#FFFFFF` | Text on primary |
| ring | `#0F766E` | High-visibility focus ring |
| positive | `#166534` | Positive financial status text |
| positive-surface | `#F0FDF4` | Supporting status background |
| negative/destructive | `#B42318` | Deficit, error, reversal warning |
| negative-surface | `#FEF3F2` | Error/negative support background |
| warning | `#92400E` | Upcoming/overdue and caution text |
| warning-surface | `#FFFBEB` | Warning support background |
| information | `#1D4ED8` | Neutral informational state |

Text contrast target ≥4.5:1 for normal text; ≥3:1 for large text and essential control/graphic boundaries. Verify actual foreground/background pairs, including hover, selected, disabled, and focus states. The decorative border is not an accessible input outline by itself. Do not rely on shadows alone to identify a field.

Typography: system sans-serif initially, with optional locally hosted Inter after licensing/build review. Base 16px/24px; secondary 14px/20px; small metadata 12px/16px; section title 20px/28px; page title 24px/32px; financial headline 28–32px with tabular numerals. Labels and key financial text must not shrink to fit; wrap context and use responsive layout. Avoid all-uppercase paragraphs.

Spacing scale in px: 4, 8, 12, 16, 24, 32, 48, 64. Mobile page inset 16; tablet/desktop 24–32. Forms use 16–24 vertical spacing. Radius: fields/buttons 8, cards 12, dialogs 16; badges pill. Borders 1px, focus ring 2px with visible offset; subtle shadow only for raised surfaces. Motion 120–180ms for state changes; respect reduced-motion, avoid animated balances.

## 3. Responsive shell and navigation

- Support 320px and wider; test 200% text zoom and reflow. Breakpoints proposed: mobile <768px, tablet 768–1023px, desktop ≥1024px. Breakpoints are layout choices, not device detection.
- Mobile: compact header with business/month context; bottom navigation with five labeled targets: **Home, Trips, Expenses, Partners, More**. More contains Reports, Vehicles, Settings, and Activity. Expenses groups trip-independent costs, EMI, and renewals; Trips owns trip-specific costs.
- Desktop: 240px sidebar, top context header, main content max-width ~1440px. Sidebar includes Dashboard, Trips, Vehicle Expenses, Partners, Reports, Settings. Indicate current route with label/icon and active background, not color alone.
- Tablet: responsive rail or sidebar with accessible expand control; preserve primary actions. Do not show both bottom navigation and full sidebar simultaneously.
- Bottom navigation respects `safe-area-inset-bottom`; content receives matching bottom padding so totals/actions are never obscured. Sticky form actions must sit above the keyboard/navigation and remain usable in landscape.
- Use labeled icons, `aria-current`, correct landmarks, skip link, and stable back navigation. No onboarding localhost preview links are needed.

## 4. Reusable component contract

Use reviewed shadcn/ui primitives (Button, Input, Label, Select, Dialog, Sheet, AlertDialog, Table, Tabs, Badge, Skeleton, Toast equivalents). Check the generated components' accessibility rather than assuming all custom compositions are accessible.

| Component | Required behavior |
| --- | --- |
| `MoneyText` | Exact formatted minor units, currency context, tabular digits, explicit minus sign; full accessible value; no floating-point parse. |
| `FinancialSummaryCard` | Label, amount, date scope, optional completeness note, drilldown; never use an ambiguous “Profit” label. |
| `BalanceBreakdown` | Separate agreed/recognized/collected/outstanding or opening/in/movement/out/closing values; reconcile visually. |
| `AmountInput` | Decimal keyboard hint, currency label, exact parsing, exponent validation, visible errors; no implicit rounding. |
| `BusinessDateInput` | Business-local date with accessible manual entry and calendar; no timezone-shifted ISO conversion. |
| `EntityPicker` | Vehicle/partner selection from authorized active records; historical archived value still visible. |
| `StatusBadge` | Text plus icon if useful; booked/in-progress/completed/unpaid/overdue/partial states not conveyed only by color. |
| `RecordList` | Mobile cards with primary text, date, amount, status; accessible table on desktop or equivalent labels. |
| `FinancialHistory` | Stable pagination, effective date and recorded timestamp, actor, reversal/reference links. |
| `ConfirmFinancialAction` | Amount, beneficiary/obligation, date, cash effect, operation summary; prevent duplicate intent and allow same-key retry. |
| `EmptyState` | Distinguish no records, no matching filters, forbidden, unavailable configuration, and failed loading. |
| `PolicyIncompleteNotice` | Names the missing input; displays reliable cash figures while marking unavailable accounting output. |

Do not use a toast as the only evidence of payment success. Show a persistent confirmation/reference and updated record. Destructive/correction actions require explicit context and reason; no swipe gesture may irreversibly post/reverse a transaction.

## 5. Dashboard layout

Mobile sequence:

1. Business and period selector with freshness/refresh state.
2. Available business cash (cumulative cutoff), and operating cash after EMI for selected month; negative values labeled deficit.
3. Monthly collections, recognized revenue, incurred operating cost, paid cost, EMI paid, and operational result before financing/noncash. Show unavailable accounting figures with an explanation instead of a zero.
4. Action row: New trip, Collect payment, Add expense.
5. Outstanding customers and upcoming/overdue payments.
6. Cash-flow chart and recent activity with drilldowns.

Desktop uses a restrained summary grid and two-column chart/reminders region. Do not put all seven measures in one unlabeled total. Partner funding must have a visible separate cash category so a contribution cannot look like trip performance.

## 6. Forms and daily-entry UX

- Trip form sections: identity/customer/vehicle, dates, agreed amount, odometers. Expenses and collections are subsequent explicit actions, not implicitly posted nested drafts.
- Show optional readings as empty; calculated distance is read-only. Keep unit visible. Validate required values inline after interaction and on submit; preserve inputs and focus the first invalid field.
- Payment form begins with target/outstanding. Default amount may suggest outstanding, but user confirms amount/date/method. Never auto-post an EMI when opening its reminder.
- Expense form distinguishes “cost incurred” from “paid now.” A paid-now command creates obligation and payment atomically with one operation key; unpaid entry creates no cash movement.
- Business date defaults to today's date in the business timezone after configuration. Display timezone context where date ambiguity matters.
- Use large numeric inputs with `inputMode="decimal"`; avoid `type="number"` conversions that lose precision. Dates/selectors/buttons must remain keyboard operable.
- Save states: idle → validating → sending → confirmed / failed / outcome unknown. Disable duplicate confirmation while sending. On unknown outcome offer same-key retry and refresh; do not invite a new payment blindly.
- Warn on stale edit versions and show the refreshed differences; never silently overwrite a partner's changes. Browser back must not erase an acknowledged posting or submit it again.

## 7. Partner, EMI, and report UX

- Partner detail separates outstanding repayable advance, contributions, repayments, and recorded profit withdrawals. Sharing percentage and effective version are explicit; distribution actions are owner-only and disabled until approved rules exist.
- EMI registration shows original count, historically settled count, first original due date, monthly amount, attestation, and preview of remaining schedule. Clearly explain that historical paid rows do not reduce current cash. Unknown breakdown is labeled.
- Each instalment shows due, net paid, outstanding, due date, and manual-confirmation action. A partly paid overdue item remains partial/overdue; do not collapse it into one misleading paid flag.
- Reports show business, period, currency, recognition policy/completeness, and drilldown. Desktop tables remain accessible; mobile uses labeled summaries or horizontal scrolling confined to the table region.
- Export buttons explain scope. Exact values remain available even if charts scale to thousands. No inferred “safe to withdraw” card before the entitlement policy exists.

## 8. Chart conventions

Recharts is an enhancement, not the only representation of data. Provide equivalent tables/text, legend, exact tooltips, and meaningful titles. Use muted teal for income/collections, slate for operating payments, amber for EMI, violet for partner funding, and labeled negative bars for outflows. Avoid interpreting red/green alone as financial meaning.

Cash-flow axes include negative values and an evident zero line. Do not truncate a deficit to zero. Use a legend when recognized revenue and collections appear together. Default month view uses modest data density; no decorative 3D/pie charts for reconciliation. Chart computations never feed authoritative ledger calculations.

## 9. Accessibility, content, and PWA states

- All controls have labels, visible focus, logical tab order, appropriate autocomplete, error association, and screen-reader status messages. Dialogs trap/restore focus; important confirmation text is not clipped.
- Do not place essential information solely in hover tooltips. Minimum 44×44px touch targets and sufficient spacing; contrast checks include all token states. Test keyboard, VoiceOver/TalkBack, zoom, and reduced-motion.
- Plain labels: “Customer payments received,” “Operating costs incurred,” “EMI cash paid,” “Partner advance repayment,” “Recorded profit withdrawals.” Currency is visible; “—” means unknown and is explained, not treated as zero.
- Loading uses stable skeleton layout; network errors retain entered values. Auth expiry offers safe sign-in without persisting sensitive drafts by default. Logout/tenant switch clears client caches and stale form context.
- Installation UI appears only when supported; iPhone instructions describe Safari Add to Home Screen. Installation does not promise offline data access. Offline state explains that saves require a connection; no fake success or queued financial entry.

## 10. Design acceptance

Before release, verify the daily journey on small Android and iPhone viewports, standalone mode/safe areas, desktop keyboard use, long labels, large negative values, unknown data, empty business, two vehicles, expired sessions, and concurrent edits. Automated accessibility checks complement manual screen-reader/keyboard checks. Freeze reusable tokens after review and document intentional exceptions rather than accumulate one-off CSS.
