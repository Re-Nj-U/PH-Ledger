"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  CalendarClock,
  CircleDollarSign,
  Fuel,
  Landmark,
  Wallet,
  Info,
  ChevronRight,
} from "lucide-react";
import {
  mockPeriods,
  periodSummary,
  mockPayments,
  demoBusiness,
} from "@/lib/mock-data";
import { minor } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { Card, CardContent } from "@/components/ui/card";
import { SummaryCard } from "@/components/financial/summary-card";
import { MoneyText } from "@/components/financial/money-text";
import { PageHeader } from "@/components/shared/page-header";
import { PeriodSelect } from "@/components/shared/period-select";
import { SectionHeading } from "@/components/shared/section-heading";
import { QuickAdd } from "@/components/shared/quick-add";
import { TripList } from "@/features/trips/components/trip-list";
import { CashFlowChart } from "@/components/financial/cash-flow-chart";

export function Dashboard() {
  const [periodId, setPeriodId] = useState("2026-09");
  const period = mockPeriods.find((item) => item.id === periodId)!;
  const totals = periodSummary(period);
  const positive = minor(totals.operatingCash) >= 0n;
  const payments = mockPayments.filter(
    (payment) => payment.date > period.cutoff,
  );

  return (
    <div className="page-stack">
      <PageHeader
        title="Dashboard"
        description="A clear view of your business, one journey at a time."
      >
        <PeriodSelect value={periodId} onChange={setPeriodId} />
      </PageHeader>
      <div className="grid min-w-0 gap-4 lg:grid-cols-[1.25fr_1fr]">
        <Card className="min-w-0 border-primary/15 bg-primary py-0 text-primary-foreground shadow-none">
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-white/85">
                  Available business cash
                </p>
                <p className="mt-1 text-xs text-white/75">
                  As of {formatDate(period.cutoff, { year: "numeric" })} · USD
                </p>
              </div>
              <span className="rounded-xl bg-white/10 p-2.5">
                <Wallet className="size-5" aria-hidden="true" />
              </span>
            </div>
            <MoneyText
              amount={totals.closing}
              className="mt-5 block text-[34px] font-semibold sm:text-[38px]"
            />
            <div className="mt-5 flex flex-wrap items-end justify-between gap-3 border-t border-white/20 pt-4">
              <div>
                <p className="text-xs text-white/75">Opening cash</p>
                <MoneyText
                  amount={period.opening}
                  className="mt-1 block text-sm font-medium"
                />
              </div>
              <Link
                href="/b/demo/reports"
                className="flex min-h-11 items-center gap-1.5 text-xs font-semibold"
              >
                See cash breakdown
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </CardContent>
        </Card>
        <Card className="min-w-0 py-0 shadow-none">
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Monthly cash {positive ? "surplus" : "deficit"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  From operations, after EMI
                </p>
              </div>
              <span className="rounded-xl bg-muted p-2.5">
                <Banknote
                  className="size-5 text-muted-foreground"
                  aria-hidden="true"
                />
              </span>
            </div>
            <MoneyText
              amount={totals.operatingCash}
              className={`mt-5 block text-[34px] font-semibold sm:text-[38px] ${positive ? "text-positive" : "text-destructive"}`}
            />
            <div className="mt-5 flex flex-wrap justify-between gap-3 border-t pt-4 text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Info className="size-3.5" aria-hidden="true" />
                Excludes partner funding & withdrawals
              </span>
              <Link
                href="/b/demo/reports"
                className="min-h-11 font-semibold text-primary"
              >
                View report
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Monthly income received"
          amount={totals.received}
          description="Actual customer collections"
          icon={ArrowDownLeft}
          href="/b/demo/trips"
        />
        <SummaryCard
          label="Trip expenses"
          amount={totals.tripCosts}
          description={`${totals.trips.length} trips · Direct costs incurred`}
          icon={Fuel}
          href="/b/demo/vehicles/expenses"
        />
        <SummaryCard
          label="EMI cash paid"
          amount={period.emi}
          description="Kept separate from operating costs"
          icon={Landmark}
          href="/b/demo/vehicles/expenses?tab=emi"
        />
        <SummaryCard
          label="Customer balances"
          amount={totals.outstanding}
          description="Outstanding on this month's trips"
          icon={CircleDollarSign}
          href="/b/demo/trips"
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3">
        <p className="text-sm font-medium">
          A little less admin. A little more road.
        </p>
        <div className="flex flex-wrap gap-2">
          <QuickAdd kind="trip" label="New trip" variant="outline" />
          <QuickAdd kind="payment" label="Collect payment" variant="outline" />
          <QuickAdd kind="expense" label="Add expense" variant="outline" />
        </div>
      </div>
      <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[1.55fr_1fr]">
        <Card className="min-w-0 gap-0 py-0 shadow-none">
          <CardContent className="p-5 sm:p-6">
            <SectionHeading
              title="Cash flow at a glance"
              description="Collections, cash paid, and total monthly movement · USD"
            />
            <CashFlowChart through={period.id} />
          </CardContent>
        </Card>
        <Card className="min-w-0 gap-0 py-0 shadow-none">
          <CardContent className="p-5 sm:p-6">
            <SectionHeading
              title="Upcoming payments"
              description={`After ${formatDate(period.cutoff)} · Reminders only`}
              href="/b/demo/vehicles/expenses"
            />
            {period.id === "2026-09" ? (
              <div className="mt-4 divide-y">
                {payments.map((payment) => (
                  <Link
                    href={payment.href}
                    key={payment.id}
                    className="flex min-w-0 items-center gap-3 py-4 first:pt-0"
                  >
                    <div className="flex w-12 shrink-0 flex-col items-center rounded-lg border bg-background py-2">
                      <span className="text-[10px] font-medium text-muted-foreground uppercase">
                        {
                          formatDate(payment.date, { month: "short" }).split(
                            " ",
                          )[0]
                        }
                      </span>
                      <span className="text-base font-semibold">
                        {Number(payment.date.slice(-2))}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{payment.name}</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {payment.kind === "EMI"
                          ? "Instalment 19 of 48"
                          : "Estimate · No payment posted"}
                      </p>
                    </div>
                    <MoneyText
                      amount={payment.amount}
                      className="text-sm font-semibold"
                    />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-xl bg-muted/60 p-5">
                <CalendarClock
                  className="mb-2 size-5 text-muted-foreground"
                  aria-hidden="true"
                />
                <p className="text-sm font-medium">Historical month selected</p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  Choose September to explore the sample upcoming payment
                  reminders.
                </p>
              </div>
            )}
            <p className="mt-3 border-t pt-4 text-xs leading-5 text-muted-foreground">
              Due dates never deduct cash. Payments will require manual
              confirmation.
            </p>
          </CardContent>
        </Card>
      </div>
      <Card className="min-w-0 gap-0 py-0 shadow-none">
        <CardContent className="p-5 sm:p-6">
          <SectionHeading
            title="Recent trips"
            description={`${demoBusiness.vehicle} · ${period.label}`}
            href="/b/demo/trips"
          />
          <div className="mt-5">
            <TripList trips={[...totals.trips].reverse().slice(0, 4)} compact />
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">
            Agreed value · Trips starting this month
          </p>
          <MoneyText
            amount={totals.agreed}
            className="mt-2 block text-lg font-semibold"
          />
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">
            All operating costs incurred
          </p>
          <MoneyText
            amount={totals.incurred}
            className="mt-2 block text-lg font-semibold"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Paid: <MoneyText amount={totals.paid} />
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">
            Total monthly cash movement
          </p>
          <MoneyText
            amount={totals.movement}
            className="mt-2 block text-lg font-semibold"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Includes funding, repayments & withdrawals
          </p>
        </div>
      </div>
      <div className="flex items-start gap-3 rounded-xl border border-warning/15 bg-warning-surface p-4">
        <Info
          className="mt-0.5 size-4 shrink-0 text-warning"
          aria-hidden="true"
        />
        <p className="text-xs leading-5 text-warning">
          Cash is not accounting profit. Revenue recognition, EMI interest
          splits, and noncash costs are not configured in this demo.{" "}
          <Link
            className="font-semibold underline underline-offset-2"
            href="/b/demo/reports"
          >
            Explore reports{" "}
            <ChevronRight className="inline size-3" aria-hidden="true" />
          </Link>
        </p>
      </div>
    </div>
  );
}
