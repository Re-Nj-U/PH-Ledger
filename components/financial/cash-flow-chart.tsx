"use client";
import { useId } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { mockPeriods, periodSummary, demoBusiness } from "@/lib/mock-data";
import { chartAmount, sumMinor } from "@/lib/money";
import { MoneyText } from "@/components/financial/money-text";

export function CashFlowChart({ through = "2026-09" }: { through?: string }) {
  const id = useId();
  const periods = mockPeriods.filter((period) => period.id <= through);
  const data = periods.map((period) => {
    const totals = periodSummary(period);
    return {
      month: period.shortLabel,
      receipts: chartAmount(totals.received, demoBusiness.exponent),
      payments: -chartAmount(
        sumMinor([totals.paid, period.emi]),
        demoBusiness.exponent,
      ),
      movement: chartAmount(totals.movement, demoBusiness.exponent),
    };
  });
  return (
    <div>
      <div
        role="img"
        aria-label="Cash flow chart. Collections above zero, operating and EMI payments below zero, and total cash movement shown as a line. Exact figures are in the expandable table."
        className="mt-5 h-[250px] min-w-0"
      >
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <ComposedChart
            data={data}
            margin={{ top: 12, right: 8, left: -15, bottom: 0 }}
            accessibilityLayer
          >
            <CartesianGrid
              stroke="var(--border)"
              strokeDasharray="3 4"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              tickFormatter={(value: number) =>
                `${value < 0 ? "−" : ""}$${Math.abs(value) / 1000}k`
              }
            />
            <ReferenceLine y={0} stroke="var(--input)" />
            <Tooltip
              content={({ active, payload, label }) =>
                active && payload?.length ? (
                  <div className="rounded-xl border bg-card p-3 text-xs shadow-md">
                    <p className="mb-2 font-semibold">{label} 2026 · USD</p>
                    {payload.map((item) => (
                      <p key={item.dataKey as string} className="mt-1">
                        {item.name}:{" "}
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                        }).format(Number(item.value))}
                      </p>
                    ))}
                  </div>
                ) : null
              }
            />
            <Bar
              dataKey="receipts"
              name="Customer collections"
              fill="var(--chart-1)"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
              isAnimationActive={false}
            />
            <Bar
              dataKey="payments"
              name="Operating + EMI cash paid"
              fill="var(--chart-2)"
              radius={[0, 0, 4, 4]}
              maxBarSize={32}
              isAnimationActive={false}
            />
            <Line
              dataKey="movement"
              name="Total cash movement"
              stroke="var(--chart-4)"
              strokeWidth={2}
              dot={{ r: 4, fill: "var(--card)" }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-chart-1" />
          Collections
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-chart-2" />
          Operating + EMI payments
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-3 bg-chart-4" />
          Total cash movement
        </span>
      </div>
      <details className="mt-4 border-t pt-2">
        <summary className="flex min-h-11 cursor-pointer items-center text-xs font-medium text-primary">
          View exact cash-flow figures
        </summary>
        <div className="overflow-x-auto">
          <table id={id} className="w-full text-left text-xs">
            <caption className="sr-only">
              Monthly cash flow in USD. Total movement includes funding,
              repayments, and withdrawals.
            </caption>
            <thead>
              <tr className="border-b">
                <th scope="col" className="py-3 pr-3">
                  Month
                </th>
                <th scope="col" className="px-3">
                  Collections
                </th>
                <th scope="col" className="px-3">
                  Payments
                </th>
                <th scope="col" className="px-3">
                  Movement
                </th>
              </tr>
            </thead>
            <tbody>
              {periods.map((period) => {
                const summary = periodSummary(period);
                return (
                  <tr key={period.id} className="border-b last:border-0">
                    <th scope="row" className="py-3 pr-3 font-medium">
                      {period.shortLabel}
                    </th>
                    <td className="whitespace-nowrap px-3">
                      <MoneyText amount={summary.received} />
                    </td>
                    <td className="whitespace-nowrap px-3">
                      <MoneyText
                        amount={`-${sumMinor([summary.paid, period.emi])}`}
                      />
                    </td>
                    <td className="whitespace-nowrap px-3">
                      <MoneyText amount={summary.movement} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
