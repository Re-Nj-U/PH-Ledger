// shadcn/ui (MIT), upstream 97ddbf4274ed09d02aa7fd34375f2cf1e48cbbf0; application token/target customizations.
import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-accent", className)}
      {...props}
    />
  );
}

export { Skeleton };
