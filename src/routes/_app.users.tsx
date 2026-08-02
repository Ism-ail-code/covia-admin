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
import { api } from "@/lib/api";

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
  active: "success",
  pending: "warning",
  suspended: "destructive",
  banned: "destructive",
  invited: "secondary",
} as const;

const roleLabel = { rider: "Rider", driver: "Driver", admin: "Admin", super_admin: "Super admin" } as const;

function UsersPage() {
  const usersQuery = useQuery({ queryKey: ["users"], queryFn: api.getUsers });

  return (
    <div>
      <PageHeader
        title="Users"
        description="Riders, drivers and admins across all markets."
        actions={
          <>
            <Button variant="outline" size="sm">
              <Download className="size-4" />
              Export
            </Button>
            <Button size="sm">
              <UserPlus className="size-4" />
              Invite user
            </Button>
          </>
        }
      />

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="riders">Riders</TabsTrigger>
          <TabsTrigger value="drivers">Drivers</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="restricted">Suspended / Banned</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-4 overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Trips</TableHead>
              <TableHead>Last active</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usersQuery.data?.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="size-8">
                      <AvatarFallback>{initials(u.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.phone}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{roleLabel[u.role]}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{u.city}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[u.status]}>{u.status}</Badge>
                </TableCell>
                <TableCell className="tabular-nums">{u.trips.toLocaleString()}</TableCell>
                <TableCell className="text-muted-foreground">{u.lastActive}</TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/users/$userId" params={{ userId: u.id }}>
                      View
                    </Link>
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