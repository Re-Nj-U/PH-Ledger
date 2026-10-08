"use client";

import { useId, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Route,
  ReceiptText,
  Wallet,
  UsersRound,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { demoBusiness, mockTrips } from "@/lib/mock-data";
import { formatMoney, parseDecimal, minor, subtractMinor } from "@/lib/money";

type ActionKind = "trip" | "payment" | "expense" | "funding";
const actions = [
  {
    kind: "trip",
    label: "New trip",
    description: "Plan your next journey",
    icon: Route,
  },
  {
    kind: "payment",
    label: "Customer payment",
    description: "Preview a customer collection",
    icon: Wallet,
  },
  {
    kind: "expense",
    label: "Add expense",
    description: "Capture a business cost",
    icon: ReceiptText,
  },
  {
    kind: "funding",
    label: "Partner contribution",
    description: "Preview repayable partner funding",
    icon: UsersRound,
  },
] as const;

export function QuickAdd({
  compact = false,
  kind,
  label,
  variant = "default",
}: {
  compact?: boolean;
  kind?: ActionKind;
  label?: string;
  variant?: "default" | "outline" | "ghost";
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<ActionKind | null>(kind ?? null);
  const [preview, setPreview] = useState<{
    name: string;
    amount: string;
    date: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [startDate, setStartDate] = useState("");
  const id = useId();
  const action = actions.find((item) => item.kind === selected);
  const unpaidTrips = mockTrips.filter(
    (trip) => minor(subtractMinor(trip.agreed, trip.received)) > 0n,
  );

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      const amount = parseDecimal(
        String(data.get("amount")),
        demoBusiness.exponent,
      );
      if (minor(amount) <= 0n)
        throw new Error("Enter an amount greater than zero.");
      const name = String(data.get("name") ?? "").trim();
      if (!name) throw new Error("Choose or enter a name.");
      const date = String(data.get("date"));
      if (selected === "trip" && String(data.get("endDate")) < date)
        throw new Error("End date cannot precede start date.");
      setError("");
      setPreview({ name, amount, date });
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Check the entered details.",
      );
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        setSelected(kind ?? null);
        setPreview(null);
        setError("");
        setStartDate("");
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant={variant}
          aria-label={
            label ??
            (kind
              ? actions.find((item) => item.kind === kind)?.label
              : "Quick add")
          }
        >
          <Plus className="size-4" aria-hidden="true" />
          <span className={compact ? "hidden sm:inline" : ""}>
            {label ??
              (kind
                ? actions.find((item) => item.kind === kind)?.label
                : "Quick add")}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85dvh] overflow-y-auto bg-card">
        <DialogHeader>
          <DialogTitle>
            {action?.label ?? "What would you like to add?"}
          </DialogTitle>
          <DialogDescription>
            {selected
              ? "Explore the entry form. Previewing does not save or change any data."
              : "Quick entry previews for your everyday business tasks."}
          </DialogDescription>
        </DialogHeader>
        {!selected ? (
          <div className="grid gap-2">
            {actions.map((item) => (
              <button
                key={item.kind}
                onClick={() => setSelected(item.kind)}
                className="flex min-h-18 items-center gap-3 rounded-xl border p-4 text-left transition-colors hover:bg-accent"
              >
                <span className="rounded-lg bg-accent p-2.5 text-primary">
                  <item.icon className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">
                    {item.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {item.description}
                  </span>
                </span>
                <ArrowRight
                  className="size-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>
        ) : (
          <form
            onSubmit={submit}
            onChange={() => {
              setPreview(null);
              setError("");
            }}
            className="space-y-5"
          >
            {selected === "payment" || selected === "funding" ? (
              <div className="space-y-2">
                <Label htmlFor={`${id}-name`}>
                  {selected === "payment" ? "Trip" : "Partner"}
                </Label>
                <select
                  required
                  id={`${id}-name`}
                  name="name"
                  className="h-11 w-full min-w-0 rounded-lg border border-input bg-card px-3 text-sm"
                >
                  {selected === "payment" ? (
                    unpaidTrips.map((trip) => (
                      <option key={trip.id} value={trip.name}>
                        {trip.name} ·{" "}
                        {formatMoney(
                          subtractMinor(trip.agreed, trip.received),
                          demoBusiness,
                        )}{" "}
                        outstanding
                      </option>
                    ))
                  ) : (
                    <>
                      <option>Alex Morgan</option>
                      <option>Jamie Ellis</option>
                    </>
                  )}
                </select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor={`${id}-name`}>
                  {selected === "trip" ? "Trip name" : "Expense description"}
                </Label>
                <Input
                  id={`${id}-name`}
                  name="name"
                  required
                  maxLength={120}
                  placeholder={
                    selected === "trip"
                      ? "e.g. Coastal weekend"
                      : "e.g. Vehicle service"
                  }
                />
              </div>
            )}
            {selected === "trip" && (
              <div className="space-y-2">
                <Label htmlFor={`${id}-customer`}>Customer</Label>
                <Input
                  id={`${id}-customer`}
                  name="customer"
                  required
                  maxLength={120}
                  placeholder="Customer or company name"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor={`${id}-amount`}>
                {selected === "trip"
                  ? "Agreed trip amount"
                  : selected === "expense"
                    ? "Cost incurred"
                    : "Amount"}{" "}
                (USD)
              </Label>
              <Input
                id={`${id}-amount`}
                name="amount"
                inputMode="decimal"
                autoComplete="off"
                required
                placeholder="0.00"
                maxLength={24}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `${id}-error` : undefined}
              />
              <p className="text-xs text-muted-foreground">
                Demo currency ·{" "}
                {selected === "expense"
                  ? "No payment is recorded in this preview."
                  : "Exact amounts, up to 2 decimal places."}
              </p>
            </div>
            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              <div className="min-w-0 space-y-2">
                <Label htmlFor={`${id}-date`}>
                  {selected === "trip" ? "Start date" : "Business date"}
                </Label>
                <Input
                  id={`${id}-date`}
                  name="date"
                  type="date"
                  required
                  onChange={(event) => setStartDate(event.target.value)}
                />
              </div>
              {selected === "trip" && (
                <div className="min-w-0 space-y-2">
                  <Label htmlFor={`${id}-end`}>End date</Label>
                  <Input
                    id={`${id}-end`}
                    name="endDate"
                    type="date"
                    required
                    min={startDate || undefined}
                  />
                </div>
              )}
            </div>
            {error && (
              <p
                role="alert"
                id={`${id}-error`}
                className="text-sm text-destructive"
              >
                {error}
              </p>
            )}
            {preview && (
              <div
                role="status"
                className="rounded-xl border border-primary/20 bg-accent p-4"
              >
                <p className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <Eye className="size-4" aria-hidden="true" />
                  Preview only — nothing saved
                </p>
                <p className="mt-2 text-sm">
                  {preview.name} · {formatMoney(preview.amount, demoBusiness)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {preview.date} · No balances have changed.
                </p>
              </div>
            )}
            <div className="flex flex-wrap justify-between gap-2 border-t pt-4">
              {!kind ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setSelected(null);
                    setPreview(null);
                    setError("");
                  }}
                >
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  Back
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Close
                </Button>
              )}
              <Button type="submit">
                <Eye className="size-4" aria-hidden="true" />
                Preview details
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
