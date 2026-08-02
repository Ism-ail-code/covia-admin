import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/page";
import { adminSearchUsers } from "@/lib/adminApi";

export const Route = createFileRoute("/_app/users")({
  component: UsersPage,
});

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

function UsersPage() {
  const usersQuery = useQuery({ queryKey: ["users", "all"], queryFn: () => adminSearchUsers({ page: 1, pageSize: 50 }) });

  const rows = usersQuery.data?.items ?? [];

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

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending verification</TabsTrigger>
          <TabsTrigger value="restricted">Suspended / Banned</TabsTrigger>
        </TabsList>
      </Tabs>

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
            {rows.map((u) => {
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
                  <TableCell className="tabular-nums">
                    {u.total_completed_rides.toLocaleString()}
                  </TableCell>
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
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}