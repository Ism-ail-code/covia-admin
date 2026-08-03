import { useEffect, useState } from "react";
import { guardPermission } from "@/lib/route-guards";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download, Search, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { adminSearchUsers, type AdminUserRow, type UserStatusFilter } from "@/lib/adminApi";

export const Route = createFileRoute("/_app/users")({
  beforeLoad: () => guardPermission("user.view"),
  component: UsersPage,
});

const PAGE_SIZE = 20;

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0))
    .join("")
    .toUpperCase();
}

const statusVariant = {
  activated: "success",
  pending: "warning",
  suspended: "destructive",
  banned: "destructive",
} as const;

type FilterKey = "all" | "pending" | "verified" | "suspended" | "banned";

const FILTERS: Record<FilterKey, { verificationStatus?: string; status?: UserStatusFilter }> = {
  all: {},
  pending: { verificationStatus: "Pending" },
  verified: { verificationStatus: "Verified" },
  suspended: { status: "suspended" },
  banned: { status: "banned" },
};

function useDebouncedValue(value: string, delay = 300): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function UsersPage() {
  const [tab, setTab] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => setPage(1), [tab, debouncedSearch]);

  const usersQuery = useQuery({
    queryKey: ["users", "all", tab, debouncedSearch, page],
    queryFn: () =>
      adminSearchUsers({
        query: debouncedSearch || null,
        verificationStatus: FILTERS[tab].verificationStatus ?? null,
        status: FILTERS[tab].status ?? null,
        page,
        pageSize: PAGE_SIZE,
      }),
  });

  const rows = usersQuery.data?.items ?? [];
  const total = usersQuery.data?.totalCount ?? 0;

  if (usersQuery.isError) {
    return <ErrorState message="Could not load users." onRetry={() => void usersQuery.refetch()} />;
  }

  return (
    <div>
      <PageHeader
        title="Users"
        description="Riders, drivers and admins across all markets."
        actions={
          <>
            <Button variant="outline" size="sm" disabled>
              <Download className="size-4" />
              Export
            </Button>
            <Button size="sm" disabled>
              <UserPlus className="size-4" />
              Invite user
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={tab} onValueChange={(v) => setTab(v as FilterKey)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending verification</TabsTrigger>
            <TabsTrigger value="verified">Verified</TabsTrigger>
            <TabsTrigger value="suspended">Suspended</TabsTrigger>
            <TabsTrigger value="banned">Banned</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search name, username or emailâ€¦"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {usersQuery.isLoading ? (
        <div className="mt-4">
          <TableSkeleton rows={8} cols={7} />
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Verification</TableHead>
                <TableHead>Reliability</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Rides</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    No users match this filter.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((u: AdminUserRow) => {
                  const status = u.is_banned ? "banned" : u.is_suspended ? "suspended" : "activated";
                  return (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-8">
                            <AvatarFallback>{initials(u.display_name ?? u.email)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{u.display_name ?? u.username ?? u.email}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            u.verification_status === "Verified"
                              ? "success"
                              : u.verification_status === "Rejected"
                                ? "destructive"
                                : u.verification_status === "In Review"
                                  ? "warning"
                                  : "secondary"
                          }
                        >
                          {u.verification_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="tabular-nums">{u.reliability_score.toFixed(1)}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[status]}>{status}</Badge>
                      </TableCell>
                      <TableCell className="tabular-nums">{u.total_completed_rides.toLocaleString()}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link to="/users/$userId" params={{ userId: u.id }}>
                            View
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
        </div>
      )}
    </div>
  );
}