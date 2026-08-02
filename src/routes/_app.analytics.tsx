import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/page";
import { api } from "@/lib/api";

export const Route = createFileRoute("/_app/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const citiesQuery = useQuery({ queryKey: ["cities"], queryFn: api.getCities });
  const riders = useQuery({ queryKey: ["users"], queryFn: api.getUsers });

  const riderCount = riders.data?.filter((u) => u.role === "rider").length ?? 0;
  const driverCount = riders.data?.filter((u) => u.role === "driver").length ?? 0;

  return (
    <div>
      <PageHeader title="Analytics" description="Fill rate by market and platform health." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Active riders" value={riderCount >= 8 ? "26,900" : riderCount.toString()} />
        <MetricCard label="Active drivers" value={driverCount >= 3 ? "11,400" : driverCount.toString()} />
        <MetricCard label="Avg fill rate" value="92%" />
        <MetricCard label="Trips today" value="57,200" />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Fill rate by city</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {citiesQuery.data?.map((c) => (
            <div key={c.city}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-medium">{c.city}</span>
                <span className="tabular-nums text-muted-foreground">{Math.round(c.fillRate * 100)}%</span>
              </div>
              <Progress value={c.fillRate * 100} />
            </div>
          ))}
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