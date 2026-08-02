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
import type { SupportTicket } from "@/lib/types";

export const Route = createFileRoute("/_app/tickets")({
  component: TicketsPage,
});

const statusVariant: Record<SupportTicket["status"], "warning" | "secondary" | "success"> = {
  open: "warning",
  unassigned: "secondary",
  resolved: "success",
};

const priorityVariant: Record<SupportTicket["priority"], "secondary" | "warning" | "destructive"> = {
  low: "secondary",
  medium: "warning",
  high: "destructive",
};

function TicketsPage() {
  const ticketsQuery = useQuery({ queryKey: ["tickets"], queryFn: api.getTickets });

  return (
    <div>
      <PageHeader title="Support tickets" description="Inbound issues from riders and drivers." />

      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticket</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>From</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ticketsQuery.data?.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-mono text-xs">{t.id}</TableCell>
                <TableCell className="max-w-xs">
                  <p className="truncate text-sm">{t.subject}</p>
                  <p className="text-xs text-muted-foreground">{t.createdAt}</p>
                </TableCell>
                <TableCell>
                  <p className="text-sm">{t.from.name}</p>
                  <p className="text-xs text-muted-foreground">{t.from.phone}</p>
                </TableCell>
                <TableCell className="text-muted-foreground">{t.channel}</TableCell>
                <TableCell>
                  <Badge variant={priorityVariant[t.priority]}>{t.priority}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant[t.status]}>{t.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">
                    Open
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