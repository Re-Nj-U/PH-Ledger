"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BusFront,
  ChevronRight,
  Ellipsis,
  FlaskConical,
  ArrowUpRight,
  ChevronDown,
} from "lucide-react";
import { navigation } from "./navigation";
import { cn } from "@/lib/utils";
import { demoBusiness } from "@/lib/mock-data";
import { QuickAdd } from "@/components/shared/quick-add";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/b/demo"
      aria-label="VanLedger dashboard"
      className="flex min-h-11 items-center gap-2.5"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <BusFront className="size-6" aria-hidden="true" />
      </span>
      <span
        className={cn(
          "text-xl font-bold tracking-tight",
          compact && "md:hidden lg:block",
        )}
      >
        VanLedger<span className="text-primary">.</span>
      </span>
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const active = (href: string) =>
    href === "/b/demo" ? pathname === href : pathname.startsWith(href);
  const current =
    navigation.find((item) => active(item.href))?.label ?? "Workspace";

  return (
    <div className="min-h-dvh">
      <a
        href="#main-content"
        className="fixed top-3 left-3 z-100 -translate-y-24 rounded-lg bg-primary px-5 py-3 text-primary-foreground focus:translate-y-0"
      >
        Skip to content
      </a>
      <aside
        className="fixed inset-y-0 left-0 z-30 hidden w-20 flex-col border-r bg-card px-3 py-6 md:flex lg:w-60 lg:px-5"
        aria-label="Desktop sidebar"
      >
        <div className="mb-9 lg:px-1">
          <Brand compact />
        </div>
        <div className="mb-6 hidden rounded-xl border bg-background p-3 lg:block">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold">{demoBusiness.name}</span>
            <BusFront
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Travel van business · Demo
          </p>
        </div>
        <p className="mb-3 hidden px-3 text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase lg:block">
          Workspace
        </p>
        <nav aria-label="Main navigation" className="space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active(item.href) ? "page" : undefined}
              title={item.label}
              className={cn(
                "relative flex min-h-11 items-center justify-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors lg:justify-start",
                active(item.href)
                  ? "bg-accent text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="size-5 shrink-0" aria-hidden="true" />
              <span className="sr-only lg:not-sr-only">{item.label}</span>
              {active(item.href) && (
                <span
                  className="absolute inset-y-3 left-0 w-[3px] rounded-full bg-primary"
                  aria-hidden="true"
                />
              )}
            </Link>
          ))}
        </nav>
        <div className="mt-auto space-y-4 pt-8">
          <div className="hidden rounded-xl border border-primary/15 bg-accent/60 p-4 lg:block">
            <FlaskConical
              className="mb-2 size-5 text-primary"
              aria-hidden="true"
            />
            <p className="text-sm font-semibold">Make yourself at home</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Explore the workspace with sample data. Nothing here is saved.
            </p>
            <Link
              href="/b/demo/settings"
              className="mt-2 flex min-h-11 items-center gap-1 text-xs font-semibold text-primary"
            >
              About this demo{" "}
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </Link>
          </div>
          <div className="flex items-center justify-center gap-3 border-t pt-4 lg:justify-start">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
              AM
            </span>
            <div className="hidden lg:block">
              <p className="text-sm font-semibold">Alex Morgan</p>
              <p className="text-xs text-muted-foreground">
                Owner · Demo profile
              </p>
            </div>
          </div>
        </div>
      </aside>

      <div className="min-w-0 md:pl-20 lg:pl-60">
        <header className="sticky top-0 z-20 border-b bg-card/95 backdrop-blur-sm">
          <div className="mx-auto flex h-18 max-w-[1440px] items-center justify-between gap-2 px-4 md:px-6 lg:px-8">
            <div className="md:hidden">
              <Brand />
            </div>
            <div className="hidden items-center gap-2 text-sm md:flex">
              <span className="text-muted-foreground">Workspace</span>
              <ChevronRight
                className="size-3.5 text-muted-foreground"
                aria-hidden="true"
              />
              <span className="font-medium">{current}</span>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="hidden items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground sm:flex">
                <FlaskConical className="size-3.5" aria-hidden="true" /> Sample
                data
              </span>
              <QuickAdd compact />
            </div>
          </div>
        </header>

        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto min-w-0 max-w-[1440px] px-4 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))] outline-none md:px-6 md:pt-8 md:pb-8 lg:px-8"
        >
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground md:hidden">
            <span className="flex items-center gap-1.5">
              <FlaskConical className="size-3.5" aria-hidden="true" />
              Demo workspace · Sample data only
            </span>
            <span>USD</span>
          </div>
          {children}
          <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t pt-5 text-xs text-muted-foreground">
            <span>VanLedger · A little clarity for every journey.</span>
            <span>Read-only demo · USD</span>
          </footer>
        </main>
      </div>

      <nav
        aria-label="Mobile navigation"
        className="safe-bottom fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-card px-1 pt-2 md:hidden"
      >
        {navigation.slice(0, 4).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active(item.href) ? "page" : undefined}
            className={cn(
              "flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 py-1 text-[11px] font-medium",
              active(item.href)
                ? "bg-accent text-primary"
                : "text-muted-foreground",
            )}
          >
            <item.icon className="size-5" aria-hidden="true" />
            <span>{item.mobile}</span>
          </Link>
        ))}
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "h-auto min-h-12 flex-col gap-1 rounded-lg px-1 py-1 text-[11px]",
                navigation.slice(4).some((item) => active(item.href))
                  ? "bg-accent text-primary"
                  : "text-muted-foreground",
              )}
            >
              <Ellipsis className="size-5" aria-hidden="true" />
              <span>More</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Your workspace</DialogTitle>
              <DialogDescription>
                Reports and business preferences.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2">
              {navigation.slice(4).map((item) => (
                <DialogClose key={item.href} asChild>
                  <Link
                    href={item.href}
                    className="flex min-h-14 items-center gap-3 rounded-lg border p-3 hover:bg-accent"
                  >
                    <item.icon
                      className="size-5 text-primary"
                      aria-hidden="true"
                    />
                    <span className="font-medium">{item.label}</span>
                    <ChevronDown
                      className="ml-auto size-4 -rotate-90"
                      aria-hidden="true"
                    />
                  </Link>
                </DialogClose>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </nav>
    </div>
  );
}
