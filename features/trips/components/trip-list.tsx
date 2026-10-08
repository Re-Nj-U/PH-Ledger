"use client";

import { useState } from "react";
import { Route, CalendarDays, ArrowUpRight, Gauge, Wallet } from "lucide-react";
import { type MockTrip, demoBusiness } from "@/lib/mock-data";
import { formatDate } from "@/lib/dates";
import { subtractMinor, minor } from "@/lib/money";
import { MoneyText } from "@/components/financial/money-text";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function TripList({
  trips,
  compact = false,
}: {
  trips: readonly MockTrip[];
  compact?: boolean;
}) {
  const [selected, setSelected] = useState<MockTrip | null>(null);
  return (
    <>
      <div className="divide-y">
        {trips.map((trip) => (
          <div
            key={trip.id}
            className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-3 py-4 first:pt-0 last:pb-0 sm:flex-nowrap"
          >
            <span className="hidden size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground sm:flex">
              <Route className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1 basis-[55%] sm:basis-auto">
              <button
                className="min-h-11 text-left text-sm font-semibold leading-5 hover:text-primary"
                onClick={() => setSelected(trip)}
              >
                {trip.name}
              </button>
              <p className="text-xs leading-5 text-muted-foreground">
                {compact ? formatDate(trip.startDate) : trip.customer}{" "}
                <span aria-hidden="true">·</span> {demoBusiness.vehicle}
              </p>
            </div>
            <div className="text-right">
              <MoneyText
                amount={trip.agreed}
                className="block text-sm font-semibold"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Agreed amount
              </p>
            </div>
            <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
              <StatusBadge label={trip.status} />
              {!compact && (
                <span className="text-xs text-muted-foreground sm:hidden">
                  {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
                </span>
              )}
              <Button
                variant="ghost"
                size="icon"
                aria-label={`View ${trip.name}`}
                className="hidden text-muted-foreground sm:inline-flex"
                onClick={() => setSelected(trip)}
              >
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="max-h-[85dvh] overflow-y-auto bg-card">
          <DialogHeader>
            <DialogTitle>{selected?.name ?? "Trip details"}</DialogTitle>
            <DialogDescription>
              Read-only trip preview · {selected?.id} · Sample data
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm">{selected.customer}</p>
                <StatusBadge label={selected.status} />
              </div>
              <div className="space-y-3 rounded-xl bg-muted/60 p-4">
                <p className="flex items-center gap-2 text-sm">
                  <CalendarDays
                    className="size-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                  {formatDate(selected.startDate)} –{" "}
                  {formatDate(selected.endDate, { year: "numeric" })}
                </p>
                <p className="flex items-center gap-2 text-sm">
                  <Gauge
                    className="size-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                  {selected.distance === null
                    ? "Distance not yet recorded"
                    : `${selected.distance} km traveled`}
                </p>
              </div>
              <dl className="space-y-3 text-sm">
                {[
                  ["Agreed amount", selected.agreed],
                  ["Payments received", selected.received],
                  [
                    "Outstanding balance",
                    subtractMinor(selected.agreed, selected.received),
                  ],
                  ["Direct costs incurred", selected.costs],
                  [
                    "Direct margin estimate",
                    subtractMinor(selected.agreed, selected.costs),
                  ],
                ].map(([label, amount]) => (
                  <div
                    key={label}
                    className="flex flex-wrap justify-between gap-2"
                  >
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd>
                      <MoneyText amount={amount} className="font-semibold" />
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="border-t pt-4 text-xs leading-5 text-muted-foreground">
                <Wallet className="mr-1 inline size-3.5" aria-hidden="true" />
                {minor(subtractMinor(selected.agreed, selected.received)) > 0n
                  ? "This sample trip has an outstanding customer balance."
                  : "This sample trip is fully collected."}{" "}
                Direct margin excludes shared costs and EMI; it is not
                accounting profit.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
