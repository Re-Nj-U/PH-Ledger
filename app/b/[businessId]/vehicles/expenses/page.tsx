import type { Metadata } from "next";
import { ExpensesScreen } from "@/features/vehicles/components/expenses-screen";
export const metadata: Metadata = { title: "Vehicle expenses" };
export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const initialTab = tab === "emi" || tab === "renewals" ? tab : "costs";
  return <ExpensesScreen key={initialTab} initialTab={initialTab} />;
}
