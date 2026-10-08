import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return (
    <div role="status" aria-label="Loading workspace" className="space-y-6">
      <span className="sr-only">Loading workspace…</span>
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-5 w-60 max-w-full" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
      <Skeleton className="h-72 rounded-xl" />
    </div>
  );
}
