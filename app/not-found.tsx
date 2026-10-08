import Link from "next/link";
import { BusFront } from "lucide-react";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-6">
      <BusFront className="size-10 text-primary" aria-hidden="true" />
      <h1 className="text-2xl font-semibold">That route isn’t on the map</h1>
      <p className="text-sm leading-6 text-muted-foreground">
        This foundation has one demo workspace. Return to the dashboard to
        explore it.
      </p>
      <Button asChild className="mt-2 w-fit">
        <Link href="/b/demo">Back to dashboard</Link>
      </Button>
    </main>
  );
}
