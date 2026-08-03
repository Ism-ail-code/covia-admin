import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
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
import { adminListVerifications } from "@/lib/adminApi";

export const Route = createFileRoute("/_app/verifications")({
  component: VerificationsPage,
});

function statusBadge(status: string): { variant: "success" | "warning" | "destructive" | "secondary"; label: string } {
  switch (status) {
    case "approved":
    case "verified":
      return { variant: "success", label: status.replace("_", " ") };
    case "rejected":
      return { variant: "destructive", label: status.replace("_", " ") };
    case "in_review":
      return { variant: "warning", label: "in review" };
    case "pending":
    default:
      return { variant: "warning", label: status.replace("_", " ") };
  }
}

function VerificationsPage() {
  const query = useQuery({ queryKey: ["verifications", "list"], queryFn: () => adminListVerifications({}) });

  const rows = query.data ?? [];

  if (query.isError) {
    return <ErrorState message="Could not load the verification queue." onRetry={() => void query.refetch()} />;
  }

  return (
    <div>
      <PageHeader title="Verifications" description="Identity and document checks awaiting review." />

      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Applicant</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="font-mono text-xs">{v.id.slice(0, 8)}</TableCell>
                <TableCell>
                  {v.verification_type === "government_id" ? "Government ID" : "Student"}
                  {v.government_id_kind ? (
                    <span className="text-muted-foreground"> · {v.government_id_kind}</span>
                  ) : null}
                </TableCell>
                <TableCell>
                  <p className="text-sm font-medium">{v.user_display_name ?? v.user_email}</p>
                  <p className="text-xs text-muted-foreground">{v.user_email}</p>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(v.submitted_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Badge variant={statusBadge(v.status).variant}>{statusBadge(v.status).label}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/verifications/$verificationId" params={{ verificationId: v.id }}>
                      Review
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}