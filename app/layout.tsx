import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PIKU Holidays · Business Ledger",
  description: "Every trip, accounted for. Trips, monthly performance, available cash and partner balances in one simple ledger.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
