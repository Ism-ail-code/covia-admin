import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page";
import { api } from "@/lib/api";
import type { Report, ReportSeverity } from "@/lib/types";

export const Route = createFileRoute("/_app/reports")({
  component: ReportsPage,
});

const severityVariant: Record<ReportSeverity, "secondary" | "warning" | "destructive"> = {
  low: "secondary",
  medium: "warning",
  high: "destructive",
  critical: "destructive",
};

const statusVariant: Record<Report["status"], "destructive" | "warning" | "success"> = {
  open: "destructive",
  in_review: "warning",
  resolved: "success",
};

function ReportsPage() {
  const reportsQuery = useQuery({ queryKey: ["reports"], queryFn: api.getReports });

  return (
    <div>
      <PageHeader title="Reports" description="Safety and trust incidents raised by users." />

      <div className="space-y-3">
        {reportsQuery.data?.map((r) => (
          <Card key={r.id}>
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{r.id}</span>
                  <Badge variant={severityVariant[r.severity]}>{r.severity}</Badge>
                  <Badge variant="outline">{r.category}</Badge>
                  <Badge variant={statusVariant[r.status]}>{r.status.replace("_", " ")}</Badge>
                </div>
                <p className="mt-1.5 text-sm">{r.summary}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Reported by {r.reporter.name} · against {r.subject.name} · {r.reportedAt}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button variant="outline" size="sm">
                  Assign
                </Button>
                <Button variant="ghost" size="sm">
                  Review
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}