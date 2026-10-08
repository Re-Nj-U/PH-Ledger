import { ArrowDownLeft, ArrowUpRight, UsersRound, Info } from "lucide-react";
import { mockPartners, mockFundingHistory } from "@/lib/mock-data";
import { formatDate } from "@/lib/dates";
import { sumMinor, subtractMinor } from "@/lib/money";
import { PageHeader } from "@/components/shared/page-header";
import { QuickAdd } from "@/components/shared/quick-add";
import { SectionHeading } from "@/components/shared/section-heading";
import { MoneyText } from "@/components/financial/money-text";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function PartnersScreen() {
  return (
    <div className="page-stack">
      <PageHeader
        title="Partner funding"
        description="A shared business. A clear record for each partner."
      >
        <QuickAdd kind="funding" />
      </PageHeader>
      <div className="grid gap-5 lg:grid-cols-2">
        {mockPartners.map((partner) => (
          <Card key={partner.id} className="gap-0 py-0 shadow-none">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-primary">
                  {partner.initials}
                </span>
                <div className="flex-1">
                  <h2 className="text-base font-semibold">{partner.name}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Financial partner · Demo profile
                  </p>
                </div>
                <Badge variant="outline">{partner.role}</Badge>
              </div>
              <div className="mt-6 rounded-xl bg-background p-4">
                <p className="text-xs text-muted-foreground">
                  Outstanding repayable advance
                </p>
                <MoneyText
                  amount={subtractMinor(
                    sumMinor([partner.opening, partner.contributions]),
                    partner.repaid,
                  )}
                  className="mt-2 block text-[28px] font-semibold"
                />
              </div>
              <dl className="mt-5 space-y-3 text-sm">
                {[
                  ["Opening advance", partner.opening],
                  ["September contributions", partner.contributions],
                  ["September repayments", partner.repaid],
                  ["Recorded profit withdrawals", partner.distributions],
                ].map(([label, amount]) => (
                  <div
                    key={label}
                    className="flex flex-wrap justify-between gap-2"
                  >
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd>
                      <MoneyText amount={amount} className="font-medium" />
                    </dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="gap-0 py-0 shadow-none">
        <CardContent className="p-5 sm:p-6">
          <SectionHeading
            title="Partner transaction history"
            description="September 2026 · Sample funding and withdrawal records"
          />
          <div className="mt-5 divide-y">
            {[...mockFundingHistory].reverse().map((event) => (
              <div
                key={event.id}
                className="flex flex-wrap items-center gap-3 py-4 first:pt-0"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  {event.direction === "in" ? (
                    <ArrowDownLeft className="size-4" aria-hidden="true" />
                  ) : (
                    <ArrowUpRight className="size-4" aria-hidden="true" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{event.kind}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {event.partner} · {formatDate(event.date)}
                  </p>
                </div>
                <div className="text-right">
                  <MoneyText
                    amount={
                      event.direction === "out"
                        ? `-${event.amount}`
                        : event.amount
                    }
                    className="text-sm font-semibold"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Cash {event.direction === "in" ? "inflow" : "outflow"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-start gap-3 rounded-xl border bg-card p-5">
          <UsersRound
            className="mt-0.5 size-5 shrink-0 text-primary"
            aria-hidden="true"
          />
          <div>
            <h2 className="text-sm font-semibold">Funding is not revenue</h2>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Contributions increase cash and the partner advance. Repayments
              reduce both, without becoming an operating expense.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-warning/15 bg-warning-surface p-5">
          <Info
            className="mt-0.5 size-5 shrink-0 text-warning"
            aria-hidden="true"
          />
          <div>
            <h2 className="text-sm font-semibold text-warning">
              Profit-sharing policy not configured
            </h2>
            <p className="mt-2 text-xs leading-5 text-warning">
              Sample withdrawals are shown separately. Sharing percentages,
              entitlements, and retained earnings are intentionally not
              inferred.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
