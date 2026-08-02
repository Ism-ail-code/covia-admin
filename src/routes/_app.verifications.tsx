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
import { api } from "@/lib/api";
import type { VerificationStatus } from "@/lib/types";

export const Route = createFileRoute("/_app/verifications")({
  component: VerificationsPage,
});

const statusVariant: Record<VerificationStatus, "success" | "warning" | "destructive" | "secondary"> = {
  pending: "warning",
  approved: "success",
  rejected: "destructive",
  needs_review: "secondary",
};

const typeLabel: Record<string, string> = {
  cnic: "CNIC",
  license: "Licence",
  vehicle: "Vehicle",
  document: "Document",
};

function VerificationsPage() {
  const query = useQuery({ queryKey: ["verifications"], queryFn: api.getVerifications });

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
              <TableHead>Confidence</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.data?.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="font-mono text-xs">{v.id}</TableCell>
                <TableCell>{typeLabel[v.type]}</TableCell>
                <TableCell>
                  <p className="text-sm font-medium">{v.applicant.name}</p>
                  <p className="text-xs text-muted-foreground">{v.applicant.phone}</p>
                </TableCell>
                <TableCell className="text-muted-foreground">{v.submittedAt}</TableCell>
                <TableCell className="tabular-nums">{Math.round(v.confidence * 100)}%</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[v.status]}>{v.status.replace("_", " ")}</Badge>
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