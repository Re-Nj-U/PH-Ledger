import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
export function SectionHeading({
  title,
  description,
  href,
  linkLabel = "View all",
}: {
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {description && (
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {href && (
        <Link
          href={href}
          className="flex min-h-11 items-center gap-1 text-xs font-semibold text-primary"
        >
          {linkLabel}
          <ArrowUpRight className="size-3.5" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
