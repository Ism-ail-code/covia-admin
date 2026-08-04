import { createFileRoute } from "@tanstack/react-router";
import { guardPermission } from "@/lib/route-guards";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/page";
import { ErrorState } from "@/components/page";
import { adminListModerationRules } from "@/lib/adminApi";

export const Route = createFileRoute("/_app/safety")({
  beforeLoad: () => guardPermission("config.view"),
  component: SafetyPage,
});

function ruleBadge(actionType: string | null): { variant: "warning" | "destructive" | "secondary"; label: string } {
  if (!actionType) return { variant: "secondary", label: "monitor only" };
  if (actionType === "ban") return { variant: "destructive", label: "ban" };
  if (actionType === "suspend") return { variant: "warning", label: "suspend" };
  return { variant: "secondary", label: actionType.replace("_", " ") };
}

function SafetyPage() {
  const rulesQuery = useQuery({ queryKey: ["safetyRules"], queryFn: adminListModerationRules });

  const rows = rulesQuery.data ?? [];

  if (rulesQuery.isLoading) {
    return (
      <div>
        <Skeleton className="mb-6 h-10 w-48" />
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="mb-3 h-5 w-32" />
                <Skeleton className="mb-2 h-4 w-24" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (rulesQuery.isError) {
    return <ErrorState message="Could not load safety policies." onRetry={() => void rulesQuery.refetch()} />;
  }

  return (
    <div>
      <PageHeader
        title="Safety & Policies"
        description="Reliability thresholds that trigger moderation automatically."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {rows.map((r) => (
          <Card key={r.rule_name}>
            <CardHeader className="flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="text-base">{r.rule_name.replace(/_/g, " ")}</CardTitle>
                <p className="mt-0.5 font-mono text-xs text-muted-foreground">{r.rule_name}</p>
              </div>
              <Switch defaultChecked={r.enabled} aria-label="Toggle policy" disabled />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Threshold</p>
                  <p className="font-medium tabular-nums">{r.threshold ?? "â€”"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Action</p>
                  <Badge variant={ruleBadge(r.action_type).variant}>{ruleBadge(r.action_type).label}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="font-medium tabular-nums">
                    {r.duration_hours ? `${r.duration_hours}h` : "â€”"}
                  </p>
                </div>
              </div>
              <Separator className="my-4" />
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Severity {r.severity}</span>
                <Badge variant={r.enabled ? "success" : "secondary"}>
                  {r.enabled ? "enabled" : "disabled"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}