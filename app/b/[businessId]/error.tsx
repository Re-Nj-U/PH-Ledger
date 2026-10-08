"use client";
import { CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
export default function WorkspaceError({ reset }: { reset: () => void }) {
  return (
    <div role="alert" className="rounded-xl border bg-card p-6">
      <CircleAlert
        className="mb-4 size-7 text-destructive"
        aria-hidden="true"
      />
      <h1 className="text-xl font-semibold">This page needs another try</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        The workspace couldn’t load. Your preview did not save any data.
      </p>
      <Button className="mt-5" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
