import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, CarFront, Users, Wallet } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page";
import { adminGetAnalytics, adminListAppeals, adminListVerifications, adminSearchUsers } from "@/lib/adminApi";
import { subscribeToRides } from "@/lib/realtime";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/")({
  component: DashboardPage,
});

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0))
    .join("")
    .toUpperCase();
}

function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  trend,
}: {
  label: string;
  value: string;
  delta: string;
  icon: React.ComponentType<{ className?: string }>;
  trend: "up" | "down";
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 font-display text-2xl font-semibold tracking-tight">{value}</p>
          <p
            className={cn(
              "mt-2 inline-flex items-center gap-1 text-xs font-medium",
              trend === "down" ? "text-destructive" : "text-success",
            )}
          >
            <ArrowUpRight className={cn("size-3", trend === "down" && "rotate-90")} />
            {delta}
          </p>
        </div>
        <div className="rounded-lg bg-primary/10 p-2.5">
          <Icon className="size-4 text-primary" />
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardPage() {
  const queryClient = useQueryClient();
  const analyticsQuery = useQuery({ queryKey: ["analytics"], queryFn: adminGetAnalytics });
  const verificationsQuery = useQuery({
    queryKey: ["verifications", "pending"],
    queryFn: () => adminListVerifications({ status: "pending" }),
    refetchInterval: 60_000,
  });
  const appealsQuery = useQuery({
    queryKey: ["appeals", "open"],
    queryFn: () => adminListAppeals({ status: "open" }),
    refetchInterval: 60_000,
  });
  const recentUsersQuery = useQuery({
    queryKey: ["users", "recent"],
    queryFn: () => adminSearchUsers({ page: 1, pageSize: 5 }),
    refetchInterval: 60_000,
  });

  useEffect(() => {
    const unsubscribe = subscribeToRides(() => {
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    });
    return unsubscribe;
  }, [queryClient]);

  const analytics = analyticsQuery.data;

  const registrations = analytics?.users.daily_registrations ?? [];
  const peak = Math.max(...registrations.map((d) => d.registrations), 1);

  const completed = analytics?.rides.overview.completed_rides ?? 0;
  const cancelled = analytics?.rides.overview.cancelled_rides ?? 0;
  const cancellationRate = completed + cancelled > 0 ? ((cancelled / (completed + cancelled)) * 100).toFixed(1) : "0.0";

  const pendingVerifications = verificationsQuery.data?.length ?? 0;
  const openAppeals = appealsQuery.data?.items?.length ?? 0;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Live overview of Covia's coordination platform."
        actions={
          <Button variant="outline" size="sm">
            Export report
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total riders"
          value={analytics ? analytics.users.overview.total_users.toLocaleString() : "…"}
          delta={`${analytics?.users.overview.new_users_7d ?? 0} new (7d)`}
          trend="up"
          icon={Users}
        />
        <StatCard
          label="Live rides"
          value={analytics ? String(analytics.rides.overview.in_progress_rides) : "…"}
          delta={`${analytics?.rides.overview.rides_7d ?? 0} rides (7d)`}
          trend="up"
          icon={CarFront}
        />
        <StatCard
          label="Completed rides"
          value={analytics ? completed.toLocaleString() : "…"}
          delta={`available ${analytics?.rides.overview.published_rides ?? 0}`}
          trend="up"
          icon={Wallet}
        />
        <StatCard
          label="Cancellation rate"
          value={analytics ? `${cancellationRate}%` : "…"}
          delta={`${cancelled} cancelled`}
          trend="down"
          icon={CarFront}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">New registrations</CardTitle>
            <p className="text-sm text-muted-foreground">Daily sign-ups across the platform</p>
          </CardHeader>
          <CardContent>
            {analyticsQuery.isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : registrations.length === 0 ? (
              <p className="grid h-40 place-items-center text-sm text-muted-foreground">No registration data yet.</p>
            ) : (
              <div className="flex h-40 items-end gap-2">
                {registrations.map((d) => (
                  <div key={d.day} className="flex flex-1 flex-col items-center gap-1.5">
                    <div
                      className="w-full rounded-t-md bg-primary/80 transition-all hover:bg-primary"
                      style={{ height: `${Math.max(8, (d.registrations / peak) * 140)}px` }}
                    />
                    <span className="text-[11px] text-muted-foreground">{d.day}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Pending attention</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <AttentionItem label="Verifications awaiting review" value={`${pendingVerifications} pending`} to="/verifications" />
            <AttentionItem
              label="Open safety reports"
              value={`${analytics?.safety.reports_pending ?? 0} open`}
              to="/reports"
            />
            <AttentionItem label="Appeals in queue" value={`${openAppeals} open`} to="/appeals" />
            <AttentionItem label="Standby candidates active" value="—" to="/standby" />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Recently joined</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/users">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentUsersQuery.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-11 w-full" />
                ))}
              </div>
            ) : recentUsersQuery.data?.items.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No users found.</p>
            ) : (
              recentUsersQuery.data?.items.map((u) => (
                <div key={u.id} className="flex items-center gap-3 rounded-md border px-3 py-2">
                  <Avatar className="size-8">
                    <AvatarFallback>{initials(u.display_name ?? u.email)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{u.display_name ?? u.username ?? u.email}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {u.verification_status} · {new Date(u.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={u.is_banned ? "destructive" : u.is_suspended ? "warning" : "success"}>
                    {u.is_banned ? "banned" : u.is_suspended ? "suspended" : "active"}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AttentionItem({ label, value, to }: { label: string; value: string; to: string }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border px-3 py-2.5">
      <p className="text-sm">{label}</p>
      <div className="flex items-center gap-2">
        <Badge variant="warning">{value}</Badge>
        <Button asChild variant="ghost" size="icon" className="size-7">
          <Link to={to as never}>
            <ArrowUpRight className="size-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}