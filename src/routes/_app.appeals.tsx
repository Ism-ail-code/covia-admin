import { createFileRoute } from "@tanstack/react-router";
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
import type { AppealStatus } from "@/lib/types";

export const Route = createFileRoute("/_app/appeals")({
  component: AppealsPage,
});

const statusVariant: Record<AppealStatus, "warning" | "secondary" | "success"> = {
  open: "warning",
  reviewed: "secondary",
  resolved: "success",
};

function AppealsPage() {
  const appealsQuery = useQuery({ queryKey: ["appeals"], queryFn: api.getAppeals });

  return (
    <div>
      <PageHeader title="Appeals" description="Challenges to bans, suspensions and enforcement decisions." />

      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Appeal</TableHead>
              <TableHead>Appealer</TableHead>
              <TableHead>Case ID</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appealsQuery.data?.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-mono text-xs">{a.id}</TableCell>
                <TableCell>
                  <p className="text-sm font-medium">{a.appealer.name}</p>
                  <p className="text-xs text-muted-foreground">{a.appealer.phone}</p>
                </TableCell>
                <TableCell className="font-mono text-xs">{a.caseId}</TableCell>
                <TableCell className="max-w-xs">
                  <p className="truncate text-sm">{a.reason}</p>
                </TableCell>
                <TableCell className="text-muted-foreground">{a.submittedAt}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[a.status]}>{a.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">
                    Review
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