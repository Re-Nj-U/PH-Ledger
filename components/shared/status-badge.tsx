import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
export function StatusBadge({ label }: { label: string }) {
  const positive = ["Completed", "Paid", "Settled"].includes(label);
  const warning = ["In progress", "Partial", "Upcoming"].includes(label);
  return (
    <Badge
      variant="secondary"
      className={cn(
        "max-w-full border font-medium",
        positive
          ? "border-positive/15 bg-positive-surface text-positive"
          : warning
            ? "border-warning/15 bg-warning-surface text-warning"
            : "border-border bg-muted text-muted-foreground",
      )}
    >
      {label}
    </Badge>
  );
}
