"use client";
import { CalendarDays } from "lucide-react";
import { mockPeriods } from "@/lib/mock-data";
export function PeriodSelect({
  value,
  onChange,
  id = "report-period",
}: {
  value: string;
  onChange: (value: string) => void;
  id?: string;
}) {
  return (
    <div className="relative min-w-0">
      <CalendarDays
        className="pointer-events-none absolute top-3.5 left-3 size-4 text-muted-foreground"
        aria-hidden="true"
      />
      <label htmlFor={id} className="sr-only">
        Report month
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-lg border border-input/60 bg-card pr-8 pl-9 text-sm font-medium shadow-xs"
      >
        {[...mockPeriods].reverse().map((period) => (
          <option key={period.id} value={period.id}>
            {period.label}
          </option>
        ))}
      </select>
    </div>
  );
}
