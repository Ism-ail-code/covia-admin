import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Radar } from "lucide-react";
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
import type { StationStatus } from "@/lib/types";

export const Route = createFileRoute("/_app/standby")({
  component: StandbyPage,
});

const statusVariant: Record<StationStatus, "success" | "warning" | "secondary"> = {
  active: "success",
  rehearsal: "warning",
  disabled: "secondary",
};

function StandbyPage() {
  const standbyQuery = useQuery({ queryKey: ["standby"], queryFn: api.getStandbyPool });

  return (
    <div>
      <PageHeader
        title="Standby Pool"
        description="Checkpoints that catch missed taps and keep short rides on track."
        actions={
          <>
            <Badge variant="secondary">mock data — no standby backend yet</Badge>
            <Button variant="outline" size="sm">
              <Radar className="size-4" />
              Test coverage
            </Button>
          </>
        }
      />

      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Checkpoint</TableHead>
              <TableHead>Station</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Pings saved</TableHead>
              <TableHead>Last contact</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {standbyQuery.data?.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">{c.id}</p>
                </TableCell>
                <TableCell className="text-muted-foreground">{c.station}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[c.status]}>{c.status}</Badge>
                </TableCell>
                <TableCell className="tabular-nums">{c.pingsSaved}</TableCell>
                <TableCell className="text-muted-foreground">{c.lastContact}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">
                    Details
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