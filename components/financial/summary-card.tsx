import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { MoneyText } from "./money-text";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function SummaryCard({
  label,
  amount,
  description,
  icon: Icon,
  href,
  tone = "neutral",
}: {
  label: string;
  amount: string;
  description: string;
  icon: LucideIcon;
  href?: string;
  tone?: "neutral" | "positive" | "negative";
}) {
  const content = (
    <CardContent className="min-w-0 p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
        <span className="rounded-lg bg-muted p-2 text-muted-foreground">
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </div>
      <MoneyText
        amount={amount}
        className={cn(
          "block text-[26px] font-semibold md:text-[28px]",
          tone === "positive" && "text-positive",
          tone === "negative" && "text-destructive",
        )}
      />
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-xs leading-5 text-muted-foreground">
          {description}
        </span>
        {href && (
          <ArrowUpRight
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
        )}
      </div>
    </CardContent>
  );
  return (
    <Card className="min-w-0 gap-0 py-0 shadow-none">
      {href ? (
        <Link
          href={href}
          className="block rounded-xl transition-colors hover:bg-muted/35"
        >
          {content}
        </Link>
      ) : (
        content
      )}
    </Card>
  );
}
