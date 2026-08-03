import { useEffect, useState } from "react";
import { guardPermission } from "@/lib/route-guards";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pagination } from "@/components/ui/pagination";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { PageHeader } from "@/components/page";
import { ErrorState } from "@/components/page";
import { adminSearchRides } from "@/lib/adminApi";

export const Route = createFileRoute("/_app/rides")({
  beforeLoad: () => guardPermission("ride.view"),
  component: RidesPage,
});

const PAGE_SIZE = 20;

function statusBadge(status: string): { variant: "success" | "warning" | "secondary" | "destructive" | "default"; label: string } {
  switch (status) {
    case "completed":
      return { variant: "success", label: status.replace("_", " ") };
    case "cancelled":
      return { variant: "destructive", label: status.replace("_", " ") };
    case "in_progress":
      return { variant: "default", label: status.replace("_", " ") };
    case "published":
    case "full":
      return { variant: "warning", label: status.replace("_", " ") };
    default:
      return { variant: "secondary", label: status.replace("_", " ") };
  }
}

type StatusFilter = "all" | "published" | "in_progress" | "completed" | "cancelled";

function useDebouncedValue(value: string, delay = 300): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function RidesPage() {
  const [tab, setTab] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => setPage(1), [tab, debouncedSearch]);

  const ridesQuery = useQuery({
    queryKey: ["rides", "all", tab, debouncedSearch, page],
    queryFn: () =>
      adminSearchRides({
        query: debouncedSearch || null,
        status: tab === "all" ? null : tab,
        page,
        pageSize: PAGE_SIZE,
      }),
  });

  const rows = ridesQuery.data?.items ?? [];
  const total = ridesQuery.data?.totalCount ?? 0;

  if (ridesQuery.isError) {
    return <ErrorState message="Could not load rides." onRetry={() => void ridesQuery.refetch()} />;
  }

  return (
    <div>
      <PageHeader title="Rides" description="Live and recent trips across all cities." />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={tab} onValueChange={(v) => setTab(v as StatusFilter)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="published">Published</TabsTrigger>
            <TabsTrigger value="in_progress">In progress</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search origin, destination or hostâ€¦"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {ridesQuery.isLoading ? (
        <div className="mt-4">
          <TableSkeleton rows={8} cols={8} />
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-lg border bg-card">
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
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                    No rides match this filter.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
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
                ))
              )}
            </TableBody>
          </Table>
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
        </div>
      )}
    </div>
  );
}