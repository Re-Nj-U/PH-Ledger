import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";

export default async function BusinessLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  if (businessId !== "demo") notFound();
  return <AppShell>{children}</AppShell>;
}
