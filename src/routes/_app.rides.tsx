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
import { ErrorState } from "@/components/page";
import { adminSearchRides } from "@/lib/adminApi";

export const Route = createFileRoute("/_app/rides")({
  component: RidesPage,
});

function statusBadge(status: string): { variant: "success" | "warning" | "secondary" | "destructive" | "default"; label: string } {
  switch (status) {
    case "completed":
      return { variant: "success", label: status.replace("_", " ") };
    case "cancelled":
      return { variant: "destructive", label: status.replace("_", " ") };
    case "in_progress":
    case "in_transit":
      return { variant: "default", label: status.replace("_", " ") };
    case "searching":
    case "scheduled":
    case "confirmed":
      return { variant: "warning", label: status.replace("_", " ") };
    default:
      return { variant: "secondary", label: status.replace("_", " ") };
  }
}

function RidesPage() {
  const ridesQuery = useQuery({ queryKey: ["rides", "all"], queryFn: () => adminSearchRides({ page: 1, pageSize: 50 }) });

  const rows = ridesQuery.data?.items ?? [];

  if (ridesQuery.isError) {
    return <ErrorState message="Could not load rides." onRetry={() => void ridesQuery.refetch()} />;
  }

  return (
    <div>
      <PageHeader title="Rides" description="Live and recent trips across all cities." />

      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ride</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Host</TableHead>
              <TableHead>Fare</TableHead>
              <TableHead>Departure</TableHead>
              <TableHead>Seats</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-xs">{r.id.slice(0, 8)}</TableCell>
                <TableCell>
                  <p className="text-sm">{r.origin}</p>
                  <p className="text-xs text-muted-foreground">{r.destination}</p>
                </TableCell>
                <TableCell className="text-sm">{r.host_name ?? r.host_id.slice(0, 8)}</TableCell>
                <TableCell className="tabular-nums">
                  {r.fare_mode === "fixed" && r.fixed_fare ? `PKR ${r.fixed_fare}` : r.fare_mode}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(r.departure_time).toLocaleDateString()}
                </TableCell>
                <TableCell className="tabular-nums">
                  {r.available_seats}/{r.total_seats}
                </TableCell>
                <TableCell>
                  <Badge variant={statusBadge(r.ride_status).variant}>{statusBadge(r.ride_status).label}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" disabled>
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