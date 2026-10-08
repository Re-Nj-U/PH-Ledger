import type { Metadata } from "next";
import { TripsScreen } from "@/features/trips/components/trips-screen";
export const metadata: Metadata = { title: "Trips" };
export default function TripsPage() {
  return <TripsScreen />;
}
