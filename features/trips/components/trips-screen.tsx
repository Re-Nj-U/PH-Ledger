"use client";
import { useState } from "react";
import { Route, CircleDollarSign, Search, MapPin } from "lucide-react";
import { mockTrips } from "@/lib/mock-data";
import { subtractMinor, sumMinor } from "@/lib/money";
import { PageHeader } from "@/components/shared/page-header";
import { QuickAdd } from "@/components/shared/quick-add";
import { SummaryCard } from "@/components/financial/summary-card";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TripList } from "./trip-list";

export function TripsScreen() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const filtered = mockTrips.filter(
    (trip) =>
      (status === "all" || trip.status === status) &&
      `${trip.name} ${trip.customer} ${trip.id}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const outstanding = sumMinor(
    mockTrips.map((trip) => subtractMinor(trip.agreed, trip.received)),
  );
  return (
    <div className="page-stack">
      <PageHeader
        title="Trips"
        description="From the first booking to the final collection."
      >
        <QuickAdd kind="trip" />
      </PageHeader>
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Agreed trip value"
          amount={sumMinor(mockTrips.map((trip) => trip.agreed))}
          description={`${mockTrips.length} sample trips · All dates`}
          icon={Route}
        />
        <SummaryCard
          label="Payments received"
          amount={sumMinor(mockTrips.map((trip) => trip.received))}
          description="Customer collections · All sample trips"
          icon={CircleDollarSign}
        />
        <SummaryCard
          label="Customer balances"
          amount={outstanding}
          description="Agreed amount less payments received"
          icon={MapPin}
        />
      </div>
      <Card className="min-w-0 gap-0 py-0 shadow-none">
        <CardContent className="p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-base font-semibold">Your journeys</h2>
            <div className="relative w-full sm:w-64">
              <Search
                className="pointer-events-none absolute top-3.5 left-3 size-4 text-muted-foreground"
                aria-hidden="true"
              />
              <label htmlFor="trip-search" className="sr-only">
                Search trips, customers, or trip IDs
              </label>
              <Input
                id="trip-search"
                type="search"
                className="pl-9"
                placeholder="Search trips or customers"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          </div>
          <Tabs value={status} onValueChange={setStatus}>
            <TabsList className="mb-5 grid h-auto! w-full grid-cols-2 gap-1 sm:w-fit sm:grid-cols-4">
              {["all", "In progress", "Booked", "Completed"].map((value) => (
                <TabsTrigger
                  className="min-h-11 px-3"
                  key={value}
                  value={value}
                >
                  {value === "all" ? "All trips" : value}
                </TabsTrigger>
              ))}
            </TabsList>
            {["all", "In progress", "Booked", "Completed"].map((value) => (
              <TabsContent key={value} value={value}>
                <p role="status" className="mb-4 text-xs text-muted-foreground">
                  {filtered.length} {filtered.length === 1 ? "trip" : "trips"}{" "}
                  found · Sample data
                </p>
                {filtered.length ? (
                  <TripList
                    trips={[...filtered].sort((a, b) =>
                      b.startDate.localeCompare(a.startDate),
                    )}
                  />
                ) : (
                  <div className="rounded-xl bg-muted/50 px-5 py-10 text-center">
                    <Route
                      className="mx-auto mb-3 size-7 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <h3 className="text-sm font-semibold">No matching trips</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Try another name or switch to All trips.
                    </p>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
