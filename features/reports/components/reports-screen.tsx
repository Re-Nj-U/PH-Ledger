"use client";
import { useState } from "react";
import {
  Download,
  Wallet,
  TrendingUp,
  ArrowDownLeft,
  Info,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { mockPeriods, periodSummary, demoBusiness } from "@/lib/mock-data";
import { sumMinor, minor } from "@/lib/money";
import { PageHeader } from "@/components/shared/page-header";
import { PeriodSelect } from "@/components/shared/period-select";
import { SectionHeading } from "@/components/shared/section-heading";
import { SummaryCard } from "@/components/financial/summary-card";
import { MoneyText } from "@/components/financial/money-text";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CashFlowChart } from "@/components/financial/cash-flow-chart";

function csvCell(value: string): string {
  const safe =
    /^[\s]*[=+\-@]/.test(value) || /^[\t\r\n]/.test(value)
      ? `'${value}`
      : value;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function ReportsScreen() {
  const [periodId, setPeriodId] = useState("2026-09");
  const [view, setView] = useState("month");
  const selected =
    view === "quarter"
      ? mockPeriods
      : mockPeriods.filter((period) => period.id === periodId);
  const summaries = selected.map(periodSummary);
  const label = view === "quarter" ? "July–September 2026" : selected[0].label;
  const receipts = sumMinor(summaries.map((summary) => summary.received));
  const paid = sumMinor(summaries.map((summary) => summary.paid));
  const emi = sumMinor(selected.map((period) => period.emi));
  const movement = sumMinor(summaries.map((summary) => summary.movement));
  const closing = summaries.at(-1)!.closing;
  const breakdown = [
    {
      label: "Opening cash",
      amount: selected[0].opening,
      description: "At the start of the period",
    },
    {
      label: "Customer collections",
      amount: receipts,
      description: "Actual payments received",
    },
    {
      label: "Operating costs paid",
      amount: `-${paid}`,
      description: "Trip and shared costs · Cash basis",
    },
    {
      label: "EMI cash paid",
      amount: `-${emi}`,
      description: "Principal/interest breakdown unavailable",
    },
    {
      label: "Partner contributions",
      amount: sumMinor(selected.map((period) => period.funding)),
      description: "Repayable funding · Not revenue",
    },
    {
      label: "Partner advance repayments",
      amount: `-${sumMinor(selected.map((period) => period.repayments))}`,
      description: "Cash outflow · Not an operating cost",
    },
    {
      label: "Profit withdrawals",
      amount: `-${sumMinor(selected.map((period) => period.distributions))}`,
      description: "Recorded separately from expenses",
    },
  ];

  function exportSample() {
    const rows = [
      ["Metric", "Amount in minor units", "Currency", "Period", "Data source"],
      ...[...breakdown, { label: "Closing cash", amount: closing }].map(
        (row) => [
          row.label,
          row.amount,
          demoBusiness.currency,
          label,
          "Synthetic sample data",
        ],
      ),
    ]
      .map((row) => row.map(csvCell).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(
      new Blob(["\ufeff", rows], { type: "text/csv;charset=utf-8;" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `vanledger-demo-${view === "quarter" ? "2026-q3" : periodId}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Reports"
        description="Understand the numbers behind every journey."
      >
        <Button variant="outline" onClick={exportSample}>
          <Download className="size-4" aria-hidden="true" />
          Sample CSV
        </Button>
      </PageHeader>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <label htmlFor="report-view" className="sr-only">
            Report range
          </label>
          <select
            id="report-view"
            value={view}
            onChange={(event) => setView(event.target.value)}
            className="h-11 rounded-lg border border-input/60 bg-card px-3 text-sm font-medium"
          >
            <option value="month">Monthly</option>
            <option value="quarter">Q3 2026 · Demo quarter</option>
          </select>
          {view === "month" ? (
            <PeriodSelect
              id="reports-month"
              value={periodId}
              onChange={setPeriodId}
            />
          ) : (
            <p className="text-sm font-medium">{label}</p>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          USD · UTC · Sample data
        </span>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Customer collections"
          amount={receipts}
          description="Cash received during selected period"
          icon={ArrowDownLeft}
        />
        <SummaryCard
          label="Total cash movement"
          amount={movement}
          description="All inflows less all outflows"
          icon={TrendingUp}
          tone={minor(movement) < 0n ? "negative" : "positive"}
        />
        <SummaryCard
          label="Closing business cash"
          amount={closing}
          description="Opening balance plus cash movement"
          icon={Wallet}
        />
      </div>
      <div className="grid min-w-0 items-start gap-6 xl:grid-cols-2">
        <Card className="min-w-0 gap-0 py-0 shadow-none">
          <CardContent className="p-5 sm:p-6">
            <SectionHeading title="Cash reconciliation" description={label} />
            <dl className="mt-5 divide-y">
              {breakdown.map((row) => (
                <div
                  key={row.label}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <dt className="text-sm font-medium">
                    <span className="block">{row.label}</span>
                    <span className="mt-1 block text-xs font-normal leading-5 text-muted-foreground">
                      {row.description}
                    </span>
                  </dt>
                  <dd>
                    <MoneyText
                      amount={row.amount}
                      className="text-sm font-semibold"
                    />
                  </dd>
                </div>
              ))}
            </dl>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-accent p-4 text-primary">
              <p className="text-sm font-semibold">Closing cash balance</p>
              <MoneyText amount={closing} className="text-xl font-semibold" />
            </div>
          </CardContent>
        </Card>
        <Card className="min-w-0 gap-0 py-0 shadow-none">
          <CardContent className="p-5 sm:p-6">
            <SectionHeading
              title="Monthly cash trend"
              description="Collections and payments · Includes a negative-flow month"
            />
            <CashFlowChart
              through={view === "quarter" ? "2026-09" : periodId}
            />
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              Cash movement includes partner funding, repayments, and
              withdrawals. It is different from operating cash surplus.
            </p>
          </CardContent>
        </Card>
      </div>
      <Card className="gap-0 py-0 shadow-none">
        <CardContent className="p-5 sm:p-6">
          <SectionHeading title="Explore the detail" />
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              {
                label: "Trip profitability",
                detail: "Agreed value, direct costs, and collections",
                href: "/b/demo/trips",
              },
              {
                label: "Vehicle expenses",
                detail: "Operating costs, EMI, and renewals",
                href: "/b/demo/vehicles/expenses",
              },
              {
                label: "Partner statements",
                detail: "Advances, repayments, and withdrawals",
                href: "/b/demo/partners",
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl border p-4 transition-colors hover:bg-accent"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold">{item.label}</h3>
                  <ArrowUpRight
                    className="size-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                </div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  {item.detail}
                </p>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
      <div className="flex items-start gap-3 rounded-xl border border-warning/15 bg-warning-surface p-4">
        <Info
          className="mt-0.5 size-5 shrink-0 text-warning"
          aria-hidden="true"
        />
        <div>
          <h2 className="text-sm font-semibold text-warning">
            Accounting result is not available yet
          </h2>
          <p className="mt-2 text-xs leading-5 text-warning">
            Recognition policies, financing components, tax treatment, and
            noncash adjustments must be configured before reporting accounting
            profit or retained earnings. These cash figures remain illustrative.
          </p>
        </div>
      </div>
    </div>
  );
}
