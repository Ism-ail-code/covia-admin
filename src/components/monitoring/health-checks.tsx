import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/page";
import { getPlatformHealth } from "@/lib/adminApi";

export function HealthChecks() {
  const query = useQuery({ queryKey: ["monitoring", "health"], queryFn: getPlatformHealth, refetchInterval: 30_000 });

  if (query.isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-5 w-1/3" />
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (query.isError) {
    return <ErrorState message="Could not check platform health." onRetry={() => void query.refetch()} />;
  }

  const health = query.data;
  if (!health) return null;

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Platform health</CardTitle>
          <CardDescription>Probe results refreshed every 30s.</CardDescription>
        </div>
        <Badge variant={health.status === "ok" ? "success" : "destructive"}>
          {health.status === "ok" ? "operational" : "degraded"}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 sm:grid-cols-2">
          {health.checks.map((c) => (
            <div
              key={c.name}
              className="flex items-center justify-between gap-2 rounded-md border bg-muted/30 px-3 py-2"
            >
              <span className="text-sm">{c.name.replace(/_/g, " ")}</span>
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                {c.detail}
                <span
                  className={c.ok ? "size-2 rounded-full bg-success" : "size-2 rounded-full bg-destructive"}
                  aria-hidden
                />
              </span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Database size: {health.database_size_mb} MB · Checked at{" "}
          {new Date(health.checked_at).toLocaleTimeString()}
        </p>
      </CardContent>
    </Card>
  );
}