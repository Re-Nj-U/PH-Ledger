import type { Metadata } from "next";
import { PartnersScreen } from "@/features/partners/components/partners-screen";
export const metadata: Metadata = { title: "Partner funding" };
export default function PartnersPage() {
  return <PartnersScreen />;
}
