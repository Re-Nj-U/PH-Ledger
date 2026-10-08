import { LayoutDashboard, Route, ReceiptText, UsersRound, ChartNoAxesCombined, Settings2 } from "lucide-react";

export const navigation = [
  { label: "Dashboard", mobile: "Home", href: "/b/demo", icon: LayoutDashboard },
  { label: "Trips", mobile: "Trips", href: "/b/demo/trips", icon: Route },
  { label: "Vehicle expenses", mobile: "Expenses", href: "/b/demo/vehicles/expenses", icon: ReceiptText },
  { label: "Partner funding", mobile: "Partners", href: "/b/demo/partners", icon: UsersRound },
  { label: "Reports", mobile: "Reports", href: "/b/demo/reports", icon: ChartNoAxesCombined },
  { label: "Settings", mobile: "Settings", href: "/b/demo/settings", icon: Settings2 },
] as const;
