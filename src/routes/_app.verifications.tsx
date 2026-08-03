import { useEffect, useMemo, useState } from "react";
import { guardPermission } from "@/lib/route-guards";
import { createFileRoute, Link } from "@tanstack/react-router";
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
import { adminListVerifications } from "@/lib/adminApi";

export const Route = createFileRoute("/_app/verifications")({
  beforeLoad: () => guardPermission("verification.view"),
  component: VerificationsPage,
});

const PAGE_SIZE = 20;

function statusBadge(status: string): { variant: "success" | "warning" | "destructive" | "secondary"; label: string } {
  switch (status) {
    case "approved":
      return { variant: "success", label: status.replace("_", " ") };
    case "rejected":
      return { variant: "destructive", label: status.replace("_", " ") };
    case "pending":
    case "in_review":
    case "resubmission_requested":
      return { variant: "warning", label: status.replace("_", " ") };
    case "expired":
    default:
      return { variant: "secondary", label: status.replace("_", " ") };
  }
}

type StatusKey = "pending" | "approved" | "rejected" | "resubmission_requested" | "all";

const STATUSES: Array<{ key: StatusKey; label: string }> = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "resubmission_requested", label: "Resubmission" },
  { key: "all", label: "All" },
];

function useDebouncedValue(value: string, delay = 300): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function VerificationsPage() {
  const [tab, setTab] = useState<StatusKey>("pending");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search);

  const query = useQuery({
    queryKey: ["verifications", "list", tab, debouncedSearch],
    queryFn: () => adminListVerifications({ status: tab, search: debouncedSearch || null }),
  });

  useEffect(() => setPage(1), [tab, debouncedSearch]);

  const allRows = query.data ?? [];
  const total = allRows.length;
  const rows = useMemo(
    () => allRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [allRows, page],
  );

  if (query.isError) {
    return <ErrorState message="Could not load the verification queue." onRetry={() => void query.refetch()} />;
  }

  return (
    <div>
      <PageHeader title="Verifications" description="Identity and document checks awaiting review." />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={tab} onValueChange={(v) => setTab(v as StatusKey)}>
          <TabsList>
            {STATUSES.map((s) => (
              <TabsTrigger key={s.key} value={s.key}>
                {s.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search applicant or emailâ€¦"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {query.isLoading ? (
        <div className="mt-4">
          <TableSkeleton rows={8} cols={6} />
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-lg border bg-card">
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
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    No verifications match this filter.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-mono text-xs">{v.id.slice(0, 8)}</TableCell>
                    <TableCell>
                      {v.verification_type === "government_id" ? "Government ID" : "Student"}
                      {v.government_id_kind ? (
                        <span className="text-muted-foreground"> Â· {v.government_id_kind}</span>
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