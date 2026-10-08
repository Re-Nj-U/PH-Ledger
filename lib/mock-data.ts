/**
 * Read-only synthetic fixtures. No database, persistence, or posting functions.
 * USD and UTC describe this demonstration, not the business's approved configuration.
 */
import { subtractMinor, sumMinor, type CurrencyFormat } from "./money.ts";

export const demoBusiness = {
  id: "demo",
  name: "Horizon Travels",
  vehicle: "Touring Van 01",
  registration: "DEMO · 001",
  currency: "USD",
  exponent: 2,
  locale: "en-US",
  timezone: "UTC",
  snapshotDate: "2026-09-30",
} satisfies CurrencyFormat & Record<string, string | number>;

export type TripStatus = "Completed" | "In progress" | "Booked";
export type MockTrip = {
  id: string;
  name: string;
  customer: string;
  startDate: string;
  endDate: string;
  status: TripStatus;
  agreed: string;
  received: string;
  costs: string;
  distance: number | null;
};
export const mockTrips: readonly MockTrip[] = [
  {
    id: "TR-107",
    name: "Coastal weekend",
    customer: "Olivia Bennett",
    startDate: "2026-09-04",
    endDate: "2026-09-06",
    status: "Completed",
    agreed: "480000",
    received: "480000",
    costs: "142000",
    distance: 684,
  },
  {
    id: "TR-108",
    name: "Mountain retreat",
    customer: "Daniel Park",
    startDate: "2026-09-09",
    endDate: "2026-09-11",
    status: "Completed",
    agreed: "320000",
    received: "260000",
    costs: "98000",
    distance: 512,
  },
  {
    id: "TR-109",
    name: "Airport group transfer",
    customer: "Atlas Events",
    startDate: "2026-09-14",
    endDate: "2026-09-14",
    status: "Completed",
    agreed: "185000",
    received: "185000",
    costs: "44000",
    distance: 176,
  },
  {
    id: "TR-110",
    name: "Wedding guest shuttle",
    customer: "Sophie Wilson",
    startDate: "2026-09-18",
    endDate: "2026-09-19",
    status: "Completed",
    agreed: "275000",
    received: "275000",
    costs: "73000",
    distance: 268,
  },
  {
    id: "TR-111",
    name: "City explorer",
    customer: "Mason Reed",
    startDate: "2026-09-22",
    endDate: "2026-09-23",
    status: "Completed",
    agreed: "225000",
    received: "160000",
    costs: "61000",
    distance: 312,
  },
  {
    id: "TR-112",
    name: "Valley trail getaway",
    customer: "Emma Brooks",
    startDate: "2026-09-26",
    endDate: "2026-09-28",
    status: "Completed",
    agreed: "355000",
    received: "330000",
    costs: "105000",
    distance: 596,
  },
  {
    id: "TR-113",
    name: "Lakeside long weekend",
    customer: "Noah Ellis",
    startDate: "2026-09-30",
    endDate: "2026-10-02",
    status: "In progress",
    agreed: "210000",
    received: "150000",
    costs: "0",
    distance: null,
  },
  {
    id: "TR-114",
    name: "Autumn group tour",
    customer: "Northstar Studio",
    startDate: "2026-10-08",
    endDate: "2026-10-10",
    status: "Booked",
    agreed: "385000",
    received: "0",
    costs: "0",
    distance: null,
  },
  {
    id: "TR-104",
    name: "Northern lakes",
    customer: "Avery Morgan",
    startDate: "2026-08-05",
    endDate: "2026-08-08",
    status: "Completed",
    agreed: "600000",
    received: "300000",
    costs: "200000",
    distance: 810,
  },
  {
    id: "TR-105",
    name: "Countryside escape",
    customer: "Leo Anderson",
    startDate: "2026-08-16",
    endDate: "2026-08-18",
    status: "Completed",
    agreed: "580000",
    received: "120000",
    costs: "170000",
    distance: 740,
  },
  {
    id: "TR-106",
    name: "Summer festival",
    customer: "River Events",
    startDate: "2026-08-24",
    endDate: "2026-08-25",
    status: "Completed",
    agreed: "320000",
    received: "0",
    costs: "90000",
    distance: 420,
  },
  {
    id: "TR-101",
    name: "Island connection",
    customer: "Grace Taylor",
    startDate: "2026-07-06",
    endDate: "2026-07-08",
    status: "Completed",
    agreed: "620000",
    received: "620000",
    costs: "170000",
    distance: 690,
  },
  {
    id: "TR-102",
    name: "Summer coast",
    customer: "James Chen",
    startDate: "2026-07-15",
    endDate: "2026-07-18",
    status: "Completed",
    agreed: "510000",
    received: "510000",
    costs: "130000",
    distance: 620,
  },
  {
    id: "TR-103",
    name: "Garden route",
    customer: "Lily Foster",
    startDate: "2026-07-25",
    endDate: "2026-07-27",
    status: "Completed",
    agreed: "430000",
    received: "430000",
    costs: "120000",
    distance: 540,
  },
];

export type MockPeriod = {
  id: string;
  label: string;
  shortLabel: string;
  cutoff: string;
  opening: string;
  tripPaid: string;
  sharedPaid: string;
  sharedIncurred: string;
  emi: string;
  funding: string;
  repayments: string;
  distributions: string;
};
export const mockPeriods: readonly MockPeriod[] = [
  {
    id: "2026-07",
    label: "July 2026",
    shortLabel: "Jul",
    cutoff: "2026-07-31",
    opening: "485000",
    tripPaid: "420000",
    sharedPaid: "90000",
    sharedIncurred: "90000",
    emi: "145000",
    funding: "0",
    repayments: "0",
    distributions: "75000",
  },
  {
    id: "2026-08",
    label: "August 2026",
    shortLabel: "Aug",
    cutoff: "2026-08-31",
    opening: "1315000",
    tripPaid: "460000",
    sharedPaid: "200000",
    sharedIncurred: "200000",
    emi: "145000",
    funding: "100000",
    repayments: "50000",
    distributions: "0",
  },
  {
    id: "2026-09",
    label: "September 2026",
    shortLabel: "Sep",
    cutoff: "2026-09-30",
    opening: "980000",
    tripPaid: "493000",
    sharedPaid: "139000",
    sharedIncurred: "139000",
    emi: "145000",
    funding: "200000",
    repayments: "80000",
    distributions: "70000",
  },
];

export function tripsForPeriod(id: string): readonly MockTrip[] {
  return mockTrips.filter((trip) => trip.startDate.startsWith(id));
}

export function periodSummary(period: MockPeriod) {
  const trips = tripsForPeriod(period.id);
  const received = sumMinor(trips.map((trip) => trip.received));
  const agreed = sumMinor(trips.map((trip) => trip.agreed));
  const tripCosts = sumMinor(trips.map((trip) => trip.costs));
  const paid = sumMinor([period.tripPaid, period.sharedPaid]);
  const incurred = sumMinor([tripCosts, period.sharedIncurred]);
  const operatingCash = subtractMinor(received, sumMinor([paid, period.emi]));
  const movement = subtractMinor(
    sumMinor([operatingCash, period.funding]),
    sumMinor([period.repayments, period.distributions]),
  );
  const closing = sumMinor([period.opening, movement]);
  return {
    trips,
    received,
    agreed,
    tripCosts,
    paid,
    incurred,
    operatingCash,
    movement,
    closing,
    outstanding: subtractMinor(agreed, received),
    unpaidCosts: subtractMinor(incurred, paid),
  };
}

export const mockExpenses = [
  {
    id: "EX-041",
    title: "Diesel · September trips",
    category: "Diesel",
    date: "2026-09-28",
    incurred: "270000",
    paid: "250000",
    scope: "Trip costs",
  },
  {
    id: "EX-042",
    title: "Driver allowances",
    category: "Driver",
    date: "2026-09-28",
    incurred: "180000",
    paid: "180000",
    scope: "Trip costs",
  },
  {
    id: "EX-043",
    title: "Tolls & parking",
    category: "Additional",
    date: "2026-09-28",
    incurred: "73000",
    paid: "63000",
    scope: "Trip costs",
  },
  {
    id: "EX-044",
    title: "Service & inspection",
    category: "Maintenance",
    date: "2026-09-15",
    incurred: "89000",
    paid: "89000",
    scope: "Vehicle costs",
  },
  {
    id: "EX-045",
    title: "Cleaning & supplies",
    category: "Maintenance",
    date: "2026-09-29",
    incurred: "50000",
    paid: "50000",
    scope: "Vehicle costs",
  },
] as const;

export const mockPayments = [
  {
    id: "emi-oct",
    name: "Monthly vehicle EMI",
    detail: "Touring Van 01 · Instalment 19 of 48",
    date: "2026-10-02",
    amount: "145000",
    kind: "EMI",
    href: "/b/demo/vehicles/expenses?tab=emi",
  },
  {
    id: "insurance",
    name: "Insurance renewal",
    detail: "Comprehensive vehicle cover · quoted amount",
    date: "2026-10-12",
    amount: "96000",
    kind: "Insurance",
    href: "/b/demo/vehicles/expenses?tab=renewals",
  },
  {
    id: "tax",
    name: "Road tax renewal",
    detail: "Touring Van 01 · estimated amount",
    date: "2026-10-25",
    amount: "42000",
    kind: "Road tax",
    href: "/b/demo/vehicles/expenses?tab=renewals",
  },
] as const;

export const mockPartners = [
  {
    id: "alex",
    name: "Alex Morgan",
    initials: "AM",
    role: "Owner",
    opening: "500000",
    contributions: "200000",
    repaid: "50000",
    distributions: "40000",
  },
  {
    id: "jamie",
    name: "Jamie Ellis",
    initials: "JE",
    role: "Partner",
    opening: "350000",
    contributions: "0",
    repaid: "30000",
    distributions: "30000",
  },
] as const;

export const mockFundingHistory = [
  {
    id: "PF-021",
    date: "2026-09-05",
    partner: "Alex Morgan",
    kind: "Contribution",
    amount: "200000",
    direction: "in",
  },
  {
    id: "PF-022",
    date: "2026-09-18",
    partner: "Alex Morgan",
    kind: "Advance repayment",
    amount: "50000",
    direction: "out",
  },
  {
    id: "PF-023",
    date: "2026-09-22",
    partner: "Jamie Ellis",
    kind: "Advance repayment",
    amount: "30000",
    direction: "out",
  },
  {
    id: "PF-024",
    date: "2026-09-30",
    partner: "Alex Morgan",
    kind: "Profit withdrawal",
    amount: "40000",
    direction: "out",
  },
  {
    id: "PF-025",
    date: "2026-09-30",
    partner: "Jamie Ellis",
    kind: "Profit withdrawal",
    amount: "30000",
    direction: "out",
  },
] as const;
