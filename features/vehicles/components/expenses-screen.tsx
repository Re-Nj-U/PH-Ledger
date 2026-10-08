"use client";
import {
  Fuel,
  Landmark,
  ReceiptText,
  BusFront,
  CalendarClock,
  Info,
} from "lucide-react";
import {
  demoBusiness,
  mockExpenses,
  mockPeriods,
  mockPayments,
  periodSummary,
} from "@/lib/mock-data";
import { formatDate } from "@/lib/dates";
import { subtractMinor, minor } from "@/lib/money";
import { PageHeader } from "@/components/shared/page-header";
import { QuickAdd } from "@/components/shared/quick-add";
import { SectionHeading } from "@/components/shared/section-heading";
import { StatusBadge } from "@/components/shared/status-badge";
import { SummaryCard } from "@/components/financial/summary-card";
import { MoneyText } from "@/components/financial/money-text";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export function ExpensesScreen({
  initialTab = "costs",
}: {
  initialTab?: "costs" | "emi" | "renewals";
}) {
  const summary = periodSummary(mockPeriods[2]);
  return (
    <div className="page-stack">
      <PageHeader
        title="Vehicle expenses"
        description="Keep running costs and upcoming obligations in view."
      >
        <QuickAdd kind="expense" />
      </PageHeader>
      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4">
        <span className="rounded-lg bg-accent p-2.5">
          <BusFront className="size-5 text-primary" aria-hidden="true" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold">{demoBusiness.vehicle}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {demoBusiness.registration} · September 2026 snapshot
          </p>
        </div>
        <StatusBadge label="Active" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Operating costs incurred"
          amount={summary.incurred}
          description="Trip and vehicle costs · September"
          icon={ReceiptText}
        />
        <SummaryCard
          label="Operating costs paid"
          amount={summary.paid}
          description="Cash paid · Excludes EMI"
          icon={Fuel}
        />
        <SummaryCard
          label="EMI cash paid"
          amount="145000"
          description="September instalment · Separate cash outflow"
          icon={Landmark}
        />
      </div>
      <Tabs defaultValue={initialTab} className="gap-5">
        <TabsList className="grid h-auto! w-full grid-cols-3 sm:w-fit">
          <TabsTrigger className="min-h-11 px-3" value="costs">
            Costs
          </TabsTrigger>
          <TabsTrigger className="min-h-11 px-3" value="emi">
            EMI
          </TabsTrigger>
          <TabsTrigger className="min-h-11 px-3" value="renewals">
            Renewals
          </TabsTrigger>
        </TabsList>
        <TabsContent value="costs">
          <Card className="gap-0 py-0 shadow-none">
            <CardContent className="p-5 sm:p-6">
              <SectionHeading
                title="Operating costs"
                description="September sample totals · Costs and payments kept separate"
              />
              <div className="mt-5 divide-y">
                {mockExpenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex flex-wrap items-start justify-between gap-3 py-4 first:pt-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{expense.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {expense.scope} · {formatDate(expense.date)}
                      </p>
                      <div className="mt-2">
                        <StatusBadge
                          label={
                            minor(
                              subtractMinor(expense.incurred, expense.paid),
                            ) > 0n
                              ? "Partial"
                              : "Paid"
                          }
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <MoneyText
                        amount={expense.incurred}
                        className="text-sm font-semibold"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        Paid <MoneyText amount={expense.paid} />
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap justify-between gap-2 rounded-lg bg-warning-surface p-3 text-sm text-warning">
                <span>Unpaid cost balance</span>
                <MoneyText
                  amount={summary.unpaidCosts}
                  className="font-semibold"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="emi" id="emi">
          <Card className="gap-0 py-0 shadow-none">
            <CardContent className="p-5 sm:p-6">
              <SectionHeading
                title="Vehicle financing"
                description="Illustrative fixed-instalment plan · No lender connection"
              />
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-muted/50 p-4">
                  <p className="text-xs text-muted-foreground">
                    Monthly instalment
                  </p>
                  <MoneyText
                    amount="145000"
                    className="mt-2 block text-xl font-semibold"
                  />
                </div>
                <div className="rounded-xl bg-muted/50 p-4">
                  <p className="text-xs text-muted-foreground">
                    Already settled at cutover
                  </p>
                  <p className="mt-2 text-xl font-semibold">15 of 48</p>
                </div>
                <div className="rounded-xl bg-muted/50 p-4">
                  <p className="text-xs text-muted-foreground">
                    Remaining at Sep 30
                  </p>
                  <p className="mt-2 text-xl font-semibold">30 instalments</p>
                </div>
              </div>
              <p className="mt-4 text-xs leading-5 text-muted-foreground">
                Original first due date: April 2, 2025. Instalments 1–17 are
                illustrative historical settlements; July #16, August #17, and
                September #18 are shown as paid. Historical entries do not
                deduct current cash.
              </p>
              <div className="mt-5 divide-y">
                {[
                  { date: "2026-09-02", sequence: 18, paid: true },
                  { date: "2026-10-02", sequence: 19, paid: false },
                  { date: "2026-11-02", sequence: 20, paid: false },
                ].map((item) => (
                  <div
                    className="flex flex-wrap items-center justify-between gap-3 py-4"
                    key={item.sequence}
                  >
                    <div>
                      <p className="text-sm font-medium">
                        Instalment {item.sequence}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDate(item.date, { year: "numeric" })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <MoneyText
                        amount="145000"
                        className="text-sm font-semibold"
                      />
                      <StatusBadge label={item.paid ? "Paid" : "Upcoming"} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 flex items-start gap-2 rounded-lg bg-warning-surface p-3 text-xs leading-5 text-warning">
                <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                Principal and interest breakdown is unavailable. This is a
                payment schedule, not a statement of remaining loan principal.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="renewals" id="renewals">
          <Card className="gap-0 py-0 shadow-none">
            <CardContent className="p-5 sm:p-6">
              <SectionHeading
                title="Renewal calendar"
                description="Upcoming reminders as of September 30 · Quotes are estimates"
              />
              <div className="mt-5 space-y-4">
                {mockPayments
                  .filter((item) => item.kind !== "EMI")
                  .map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-wrap items-center gap-3 rounded-xl border p-4"
                    >
                      <CalendarClock
                        className="size-5 shrink-0 text-warning"
                        aria-hidden="true"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{item.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Due {formatDate(item.date, { year: "numeric" })}
                        </p>
                      </div>
                      <div>
                        <MoneyText
                          amount={item.amount}
                          className="text-sm font-semibold"
                        />
                        <p className="mt-1 text-right text-xs text-muted-foreground">
                          Estimated
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
              <p className="mt-5 text-xs leading-5 text-muted-foreground">
                Renewal dates are reminders only. No expense or payment is
                created by a due date.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
