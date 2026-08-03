import { createFileRoute } from "@tanstack/react-router";
import { memo } from "react";
import { guardPermission } from "@/lib/route-guards";
import { useQuery } from "@tanstack/react-query";
import { Activity, ShieldAlert, FileCheck, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, ErrorState, EmptyState } from "@/components/page";
import { LiveRides } from "@/components/monitoring/live-rides";
import { HealthChecks } from "@/components/monitoring/health-checks";
import { MonitoringEventsLog } from "@/components/monitoring/events-log";
import {
  adminListModerationActions,
  adminListVerifications,
  getPlatformHealth,
} from "@/lib/adminApi";
import { usePollEvery } from "@/lib/poll";

export const Route = createFileRoute("/_app/monitoring")({
  beforeLoad: () => guardPermission("monitor.view"),
  component: MonitoringPage,
});

const StatTile = memo(function StatTile({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  tone?: "default" | "danger" | "warning" | "success";
}) {
  const toneClass =
    tone === "danger"
      ? "bg-destructive/10 text-destructive"
      : tone === "warning"
        ? "bg-warning/10 text-warning"
        : tone === "success"
          ? "bg-success/10 text-success"
          : "bg-primary/10 text-primary";
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={cn("flex size-9 items-center justify-center rounded-md", toneClass)}>
          <Icon className="size-4" />
        </div>
        <div>
          <p className="text-2xl font-semibold tabular-nums leading-none">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{label}</p>
        </div>
</CardContent>
    </Card>
  );
});

function MonitoringPage() {
  const healthInterval = usePollEvery(30_000);
  const healthQuery = useQuery({
    queryKey: ["monitoring", "health"],
    queryFn: getPlatformHealth,
    refetchInterval: healthInterval,
  });
  const actionsInterval = usePollEvery(30_000);
  const moderationQuery = useQuery({
    queryKey: ["monitoring", "moderation"],
    queryFn: () => adminListModerationActions({ page: 1, pageSize: 20 }),
    refetchInterval: actionsInterval,
  });
  const verificationInterval = usePollEvery(30_000);
  const verificationQuery = useQuery({
    queryKey: ["monitoring", "verifications"],
    queryFn: () => adminListVerifications({ status: "pending" }),
    refetchInterval: verificationInterval,
  });

  const health = healthQuery.data;
  const openSos = health?.checks.find((c) => c.name === "open_emergencies");
  const errors24h = health?.checks.find((c) => c.name === "monitoring_errors_24h");
  const actions = moderationQuery.data ?? [];
  const pendingVerifications = verificationQuery.data?.length ?? 0;

  return (
    <div>
      <PageHeader
        title="Live Monitoring"
        description="Realtime ride stream, health probes and backend events."
        actions={
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-success" />
            </span>
            LIVE
          </span>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          icon={Activity}
          label="Platform status"
          value={health ? (health.status === "ok" ? "OK" : "Degraded") : "â€¦"}
          tone={health ? (health.status === "ok" ? "success" : "danger") : "default"}
        />
        <StatTile
          icon={ShieldAlert}
          label="Unresolved SOS"
          value={openSos ? openSos.detail?.split(" ")[0] ?? "â€¦" : "â€¦"}
          tone={openSos?.ok ? "success" : "danger"}
        />
        <StatTile
          icon={FileCheck}
          label="Pending verifications"
          value={verificationQuery.isLoading ? "â€¦" : pendingVerifications}
          tone={pendingVerifications > 0 ? "warning" : "success"}
        />
        <StatTile
          icon={Gauge}
          label="Errors (24h)"
          value={errors24h ? errors24h.detail?.split(" ")[0] ?? "â€¦" : "â€¦"}
          tone={errors24h?.ok ? "success" : "danger"}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <LiveRides />
        <HealthChecks />
      </div>

      <div className="mt-4">
        <MonitoringEventsLog />
      </div>

      <div className="mt-4">
        <Card>
          <CardHeader className="flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Recent moderation actions</CardTitle>
              <CardDescription>Automatic and manual actions applied to accounts.</CardDescription>
            </div>
            <Badge variant={actions.length > 0 ? "warning" : "success"}>{actions.length} recent</Badge>
          </CardHeader>
          <CardContent>
            {moderationQuery.isError ? (
              <ErrorState
                message="Could not load moderation actions."
                onRetry={() => void moderationQuery.refetch()}
              />
            ) : actions.length === 0 ? (
              <EmptyState title="No moderation actions" description="Actions will appear here as they are applied." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="text-right">Applied</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {actions.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.user_name ?? a.user_id.slice(0, 8)}</TableCell>
                      <TableCell>{a.action_type.replace(/_/g, " ")}</TableCell>
                      <TableCell>
                        <Badge variant={a.status === "active" ? "destructive" : "secondary"}>{a.status}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-muted-foreground">{a.reason ?? "â€”"}</TableCell>
                      <TableCell className="text-right text-xs tabular-nums text-muted-foreground">
                        {new Date(a.created_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
