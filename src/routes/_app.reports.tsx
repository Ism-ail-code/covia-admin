import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page";
import { adminListReports, adminReviewReport } from "@/lib/adminApi";

export const Route = createFileRoute("/_app/reports")({
  component: ReportsPage,
});

function statusBadge(status: string): { variant: "destructive" | "warning" | "success"; label: string } {
  switch (status) {
    case "resolved":
    case "dismissed":
      return { variant: "success", label: status.replace("_", " ") };
    case "in_review":
      return { variant: "warning", label: "in review" };
    case "open":
    default:
      return { variant: "destructive", label: status.replace("_", " ") };
  }
}

function ReportsPage() {
  const queryClient = useQueryClient();
  const reportsQuery = useQuery({ queryKey: ["reports", "list"], queryFn: () => adminListReports({ page: 1, pageSize: 20 }) });

  const reviewMutation = useMutation({
    mutationFn: ({ id, confirm }: { id: string; confirm: boolean }) => adminReviewReport(id, confirm),
    onSuccess: (_, { confirm }) => {
      toast.success(confirm ? "Report confirmed" : "Report dismissed");
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not update report"),
  });

  return (
    <div>
      <PageHeader title="Reports" description="Safety and trust incidents raised by users." />

      <div className="space-y-3">
        {reportsQuery.data?.items.map((r) => (
          <Card key={r.id}>
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{r.id.slice(0, 8)}</span>
                  <Badge variant="outline">{r.target_type.replace("_", " ")}</Badge>
                  <Badge variant={statusBadge(r.status).variant}>{statusBadge(r.status).label}</Badge>
                  {r.is_confirmed ? <Badge variant="warning">confirmed</Badge> : null}
                </div>
                <p className="mt-1.5 text-sm">{r.reason}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Reported by {r.reporter_name ?? r.reporter_user_id.slice(0, 8)} ·{" "}
                  {r.target_user_name ?? r.target_user_id?.slice(0, 8) ?? "ride"} ·{" "}
                  {new Date(r.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={reviewMutation.isPending}
                  onClick={() => reviewMutation.mutate({ id: r.id, confirm: false })}
                >
                  Dismiss
                </Button>
                <Button
                  size="sm"
                  disabled={reviewMutation.isPending}
                  onClick={() => reviewMutation.mutate({ id: r.id, confirm: true })}
                >
                  {reviewMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : "Confirm"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}