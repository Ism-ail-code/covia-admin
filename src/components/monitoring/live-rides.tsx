import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ErrorState } from "@/components/page";
import { adminSearchRides, type AdminRideRow } from "@/lib/adminApi";
import { subscribeToRides, type RideRealtimePayload } from "@/lib/realtime";

function statusBadge(status: string): { variant: "success" | "warning" | "secondary"; label: string } {
  switch (status) {
    case "in_progress":
      return { variant: "success", label: "in progress" };
    case "published":
    case "full":
      return { variant: "warning", label: status };
    default:
      return { variant: "secondary", label: status.replace("_", " ") };
  }
}

function mergePayload(prev: AdminRideRow | undefined, payload: RideRealtimePayload): AdminRideRow {
  const base = prev ?? {};
  const incoming = (payload.new ?? payload.old ?? {}) as Record<string, unknown>;
  return { ...base, ...incoming } as unknown as AdminRideRow;
}

export function LiveRides() {
  const snapshotQuery = useQuery({
    queryKey: ["monitoring", "rides", "live"],
    queryFn: () => adminSearchRides({ status: "in_progress", pageSize: 100 }),
    refetchInterval: 30_000,
  });
  const [rides, setRides] = useState<Record<string, AdminRideRow>>({});

  useEffect(() => {
    if (snapshotQuery.data) {
      setRides(() => {
        const next: Record<string, AdminRideRow> = {};
        for (const ride of snapshotQuery.data.items) next[ride.id] = ride;
        return next;
      });
    }
  }, [snapshotQuery.data]);

  useEffect(() => {
    return subscribeToRides((payload) => {
      setRides((prev) => {
        const id = (payload.new as Record<string, unknown> | null)?.id?.toString()
          ?? (payload.old as Record<string, unknown> | null)?.id?.toString();
        if (!id) return prev;
        const next = { ...prev };
        if (payload.eventType === "DELETE") {
          delete next[id];
          return next;
        }
        next[id] = mergePayload(prev[id], payload);
        return next;
      });
    });
  }, []);

  const items = Object.values(rides).filter(
    (r) => r.ride_status !== "completed" && r.ride_status !== "cancelled" && r.ride_status !== "expired",
  );

  if (snapshotQuery.isLoading && Object.keys(rides).length === 0) {
    return (
      <Card>
        <CardContent className="space-y-2 p-6">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (snapshotQuery.isError && Object.keys(rides).length === 0) {
    return <ErrorState message="Could not load live rides." onRetry={() => void snapshotQuery.refetch()} />;
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Active rides</CardTitle>
          <CardDescription>Streaming from the rides table via realtime.</CardDescription>
        </div>
        <Badge variant="success">{items.length} active</Badge>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Route</TableHead>
              <TableHead>Departure</TableHead>
              <TableHead>Seats</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No active rides right now.
                </TableCell>
              </TableRow>
            ) : (
              items.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <p className="font-medium">
                      {r.origin} → {r.destination}
                    </p>
                    {r.pickup_point && (
                      <p className="text-xs text-muted-foreground">pickup: {r.pickup_point}</p>
                    )}
                  </TableCell>
                  <TableCell>{new Date(r.departure_time).toLocaleTimeString()}</TableCell>
                  <TableCell className="tabular-nums">
                    {r.available_seats}/{r.total_seats}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusBadge(r.ride_status).variant}>{statusBadge(r.ride_status).label}</Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}