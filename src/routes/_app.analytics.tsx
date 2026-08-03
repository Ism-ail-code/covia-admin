import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/page";
import { adminGetAnalytics } from "@/lib/adminApi";

export const Route = createFileRoute("/_app/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const analyticsQuery = useQuery({ queryKey: ["analytics"], queryFn: adminGetAnalytics });

  const analytics = analyticsQuery.data;

  const activeRiders = analytics?.users.overview.active_users_30d ?? 0;
  const verified = analytics?.users.overview.verified_users ?? 0;
  const completedRides = analytics?.rides.overview.completed_rides ?? 0;
  const avgOccupancy = analytics?.rides.overview.average_occupancy ?? 0;

  const maxRoute = analytics ? Math.max(...analytics.rides.popular_routes.map((r) => r.rides), 1) : 1;

  return (
    <div>
      <PageHeader title="Analytics" description="Platform metrics and popular routes." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Active riders (30d)" value={activeRiders.toLocaleString()} />
        <MetricCard label="Verified members" value={verified.toLocaleString()} />
        <MetricCard label="Completed rides" value={completedRides.toLocaleString()} />
        <MetricCard label="Avg occupancy" value={avgOccupancy > 0 ? avgOccupancy.toFixed(1) : "—"} />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Popular routes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {analytics?.rides.popular_routes.map((r) => (
            <div key={`${r.origin}-${r.destination}`}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-medium">
                  {r.origin} → {r.destination}
                </span>
                <span className="tabular-nums text-muted-foreground">{r.rides} rides</span>
              </div>
              <Progress value={(r.rides / maxRoute) * 100} />
            </div>
          ))}
          {analytics && analytics.rides.popular_routes.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No route data yet.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 font-display text-2xl font-semibold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}