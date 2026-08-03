import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/page";
import { ErrorState } from "@/components/page";
import { adminDecideAppeal, adminListAppeals } from "@/lib/adminApi";

export const Route = createFileRoute("/_app/appeals")({
  component: AppealsPage,
});

function statusBadge(status: string): { variant: "warning" | "secondary" | "success"; label: string } {
  switch (status) {
    case "resolved":
    case "approved":
      return { variant: "success", label: status.replace("_", " ") };
    case "open":
      return { variant: "warning", label: "open" };
    default:
      return { variant: "secondary", label: status.replace("_", " ") };
  }
}

function AppealsPage() {
  const queryClient = useQueryClient();
  const appealsQuery = useQuery({
    queryKey: ["appeals", "list"],
    queryFn: () => adminListAppeals({ page: 1, pageSize: 20 }),
  });

  const decideMutation = useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) => adminDecideAppeal(id, approve),
    onSuccess: (_, { approve }) => {
      toast.success(approve ? "Appeal approved" : "Appeal rejected");
      queryClient.invalidateQueries({ queryKey: ["appeals"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not decide appeal"),
  });

  const rows = appealsQuery.data?.items ?? [];

  if (appealsQuery.isError) {
    return <ErrorState message="Could not load appeals." onRetry={() => void appealsQuery.refetch()} />;
  }

  return (
    <div>
      <PageHeader title="Appeals" description="Challenges to bans, suspensions and enforcement decisions." />

      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Appeal</TableHead>
              <TableHead>Appealer</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-mono text-xs">{a.id.slice(0, 8)}</TableCell>
                <TableCell>
                  <p className="text-sm font-medium">{a.user_name ?? a.user_id.slice(0, 8)}</p>
                  <p className="text-xs text-muted-foreground">{a.action_type.replace("_", " ")}</p>
                </TableCell>
                <TableCell className="font-mono text-xs">{a.moderation_action_id.slice(0, 8)}</TableCell>
                <TableCell className="max-w-xs">
                  <p className="truncate text-sm">{a.appeal_reason}</p>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(a.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Badge variant={statusBadge(a.status).variant}>{statusBadge(a.status).label}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={decideMutation.isPending}
                      onClick={() => decideMutation.mutate({ id: a.id, approve: false })}
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      disabled={decideMutation.isPending}
                      onClick={() => decideMutation.mutate({ id: a.id, approve: true })}
                    >
                      {decideMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : "Approve"}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}