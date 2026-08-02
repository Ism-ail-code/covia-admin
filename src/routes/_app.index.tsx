import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, CarFront, Users, Wallet, Waves } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page";
import { api } from "@/lib/api";
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
  const usersQuery = useQuery({ queryKey: ["users"], queryFn: api.getUsers });
  const weeklyQuery = useQuery({ queryKey: ["weekly"], queryFn: api.getWeeklyRides });
  const verificationsQuery = useQuery({ queryKey: ["verifications"], queryFn: api.getVerifications });
  const reportsQuery = useQuery({ queryKey: ["reports"], queryFn: api.getReports });

  const week = weeklyQuery.data ?? [];
  const peak = Math.max(...week.map((d) => d.rides), 1);

  const railPending = verificationsQuery.data?.filter((v) => v.status === "pending").length ?? 0;
  const openReports = reportsQuery.data?.filter((r) => r.status === "open").length ?? 0;

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
        <StatCard label="Total riders" value="26,900" delta="18.2% vs last wk" trend="up" icon={Users} />
        <StatCard label="Live rides" value="4" delta="Peak at 18:00" trend="up" icon={CarFront} />
        <StatCard label="Weekly GTV" value="PKR 42.7M" delta="+9.4% vs last wk" trend="up" icon={Wallet} />
        <StatCard label="Cancellation rate" value="3.1%" delta="-0.4 pts" trend="down" icon={Waves} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Rides this week</CardTitle>
            <p className="text-sm text-muted-foreground">Completed trips across all cities</p>
          </CardHeader>
          <CardContent>
            {weeklyQuery.isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <div className="flex h-40 items-end gap-2">
                {week.map((d) => (
                  <div key={d.day} className="flex flex-1 flex-col items-center gap-1.5">
                    <div
                      className="w-full rounded-t-md bg-primary/80 transition-all hover:bg-primary"
                      style={{ height: `${Math.max(8, (d.rides / peak) * 140)}px` }}
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
            <AttentionItem label="Verifications awaiting review" value={`${railPending} pending`} to="/verifications" />
            <AttentionItem label="Open safety reports" value={`${openReports} open`} to="/reports" />
            <AttentionItem label="Appeals in queue" value="1 open" to="/appeals" />
            <AttentionItem label="Standby candidates active" value="4 active" to="/standby" />
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
            {(usersQuery.data ?? []).slice(0, 5).map((u) => (
              <div key={u.id} className="flex items-center gap-3 rounded-md border px-3 py-2">
                <Avatar className="size-8">
                  <AvatarFallback>{initials(u.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{u.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {u.role} · {u.city}
                  </p>
                </div>
                <Badge
                  variant={u.status === "active" ? "success" : u.status === "pending" ? "warning" : "secondary"}
                >
                  {u.status}
                </Badge>
              </div>
            ))}
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