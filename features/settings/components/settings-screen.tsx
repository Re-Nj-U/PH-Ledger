import {
  Building2,
  BusFront,
  ShieldCheck,
  FlaskConical,
  CircleDashed,
  UsersRound,
} from "lucide-react";
import { demoBusiness, mockPartners } from "@/lib/mock-data";
import { PageHeader } from "@/components/shared/page-header";
import { SectionHeading } from "@/components/shared/section-heading";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";

export function SettingsScreen() {
  return (
    <div className="page-stack">
      <PageHeader
        title="Settings"
        description="Your business, your team, and the way you work."
      />
      <div className="flex items-start gap-3 rounded-xl border border-primary/15 bg-accent/60 p-4">
        <FlaskConical
          className="mt-0.5 size-5 shrink-0 text-primary"
          aria-hidden="true"
        />
        <div>
          <p className="text-sm font-semibold text-primary">
            You’re in a demo workspace
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            The profiles and figures below are fictional. Settings are
            read-only; your business configuration will be added in a later
            phase.
          </p>
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="gap-0 py-0 shadow-none">
          <CardContent className="p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-2">
              <Building2 className="size-5 text-primary" aria-hidden="true" />
              <h2 className="text-base font-semibold">Business profile</h2>
            </div>
            <dl className="space-y-4 text-sm">
              {[
                ["Business name", demoBusiness.name],
                ["Currency", "USD · 2 decimal places · Demo only"],
                ["Business timezone", "UTC · Demo only"],
                ["Sample financial dates", "July–September 2026"],
                ["Cash accounts", "One logical business cash pool"],
              ].map(([key, value]) => (
                <div
                  key={key}
                  className="grid gap-1 border-b pb-3 last:border-0"
                >
                  <dt className="text-xs text-muted-foreground">{key}</dt>
                  <dd className="font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
        <Card className="gap-0 py-0 shadow-none">
          <CardContent className="p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-2">
              <BusFront className="size-5 text-primary" aria-hidden="true" />
              <h2 className="text-base font-semibold">Vehicles</h2>
            </div>
            <div className="rounded-xl border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">
                  {demoBusiness.vehicle}
                </h3>
                <StatusBadge label="Active" />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {demoBusiness.registration} · Distance in kilometers
              </p>
              <div className="mt-4 border-t pt-4 text-sm">
                <span className="text-muted-foreground">Vehicle EMI</span>
                <p className="mt-1 font-medium">
                  Illustrative 48-instalment plan
                </p>
              </div>
            </div>
            <p className="mt-5 text-xs leading-5 text-muted-foreground">
              The interface uses vehicle-specific records from the start.
              Additional vehicles and owner-managed vehicle settings will follow
              in the connected application.
            </p>
          </CardContent>
        </Card>
      </div>
      <Card className="gap-0 py-0 shadow-none">
        <CardContent className="p-5 sm:p-6">
          <SectionHeading
            title="Team & permissions"
            description="Sample roles · Authentication and invitations are not connected"
          />
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {mockPartners.map((partner) => (
              <div
                key={partner.id}
                className="flex items-start gap-3 rounded-xl border p-4"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                  {partner.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{partner.name}</p>
                  <Badge variant="outline" className="mt-2">
                    {partner.role}
                  </Badge>
                  <p className="mt-3 text-xs leading-5 text-muted-foreground">
                    {partner.role === "Owner"
                      ? "Full access, including users, policies, funding, and financial corrections."
                      : "Daily trips, collections, costs, and scheduled EMI payments; reports are viewable."}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-muted-foreground">
            <ShieldCheck
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
            Roles shown here are explanatory. Authentication, row-level
            security, and server authorization are scheduled for a future phase.
          </p>
        </CardContent>
      </Card>
      <div className="grid gap-6 sm:grid-cols-2">
        <Card className="gap-0 py-0 shadow-none">
          <CardContent className="p-5 sm:p-6">
            <SectionHeading
              title="Financial policies"
              description="Business decisions still needed for connected finance"
            />
            <div className="mt-4 space-y-4">
              {[
                "Revenue and expense recognition",
                "EMI principal / interest allocation",
                "Profit-sharing percentages and withdrawal rules",
                "Opening positions and financial period locks",
              ].map((label) => (
                <div key={label} className="flex items-start gap-2 text-sm">
                  <CircleDashed
                    className="mt-0.5 size-4 shrink-0 text-warning"
                    aria-hidden="true"
                  />
                  <span>
                    {label}
                    <span className="mt-1 block text-xs text-muted-foreground">
                      Not configured in the demo
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="gap-0 py-0 shadow-none">
          <CardContent className="p-5 sm:p-6">
            <SectionHeading
              title="Activity & audit"
              description="A clear history for a shared business"
            />
            <UsersRound
              className="mt-5 size-6 text-muted-foreground"
              aria-hidden="true"
            />
            <p className="mt-3 text-sm font-medium">
              Audit history will arrive with real entries
            </p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Financial commands and critical settings will create append-only
              history with actor, effective date, and correction links.
              Previewing this interface creates no audit or financial record.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
