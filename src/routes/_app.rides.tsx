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
import type { RideStatus } from "@/lib/types";

export const Route = createFileRoute("/_app/rides")({
  component: RidesPage,
});

const statusVariant: Record<RideStatus, "success" | "warning" | "secondary" | "destructive" | "default"> = {
  searching: "secondary",
  confirmed: "warning",
  in_progress: "default",
  completed: "success",
  cancelled: "destructive",
};

function RidesPage() {
  const ridesQuery = useQuery({ queryKey: ["rides"], queryFn: api.getRides });

  return (
    <div>
      <PageHeader title="Rides" description="Live and recent trips across all cities." />

      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ride</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Rider</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Fare</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ridesQuery.data?.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-xs">{r.id}</TableCell>
                <TableCell>
                  <p className="text-sm">{r.origin}</p>
                  <p className="text-xs text-muted-foreground">{r.destination}</p>
                </TableCell>
                <TableCell className="text-sm">{r.rider.name}</TableCell>
                <TableCell className="text-sm">{r.driver?.name ?? "—"}</TableCell>
                <TableCell className="tabular-nums">{r.fare}</TableCell>
                <TableCell className="text-muted-foreground">{r.startedAt}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[r.status]}>{r.status.replace("_", " ")}</Badge>
                </TableCell>
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