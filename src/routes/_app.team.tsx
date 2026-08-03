import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { UserPlus } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page";
import { ErrorState } from "@/components/page";
import { adminListAdminUsers } from "@/lib/adminApi";
import { ROLE_PERMISSIONS } from "@/lib/rbac";

export const Route = createFileRoute("/_app/team")({
  component: TeamPage,
});

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0))
    .join("")
    .toUpperCase();
}

function TeamPage() {
  const adminsQuery = useQuery({ queryKey: ["admins"], queryFn: adminListAdminUsers });

  const rows = adminsQuery.data ?? [];

  if (adminsQuery.isError) {
    return <ErrorState message="Could not load the admin team." onRetry={() => void adminsQuery.refetch()} />;
  }

  return (
    <div>
      <PageHeader
        title="Team"
        description="Admins and the permissions they hold."
        actions={
          <Button size="sm" disabled>
            <UserPlus className="size-4" />
            Invite admin
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rows.map((a) => (
          <div key={a.user_id} className="rounded-lg border bg-card p-4">
            <div className="flex items-start justify-between">
              <Avatar className="size-10">
                <AvatarFallback>{initials(a.display_name ?? a.email)}</AvatarFallback>
              </Avatar>
              <Badge variant={a.role_name === "super_admin" ? "default" : "secondary"}>
                {a.role_name.replace("_", " ")}
              </Badge>
            </div>
            <p className="mt-3 text-sm font-semibold">{a.display_name ?? a.email}</p>
            <p className="text-xs text-muted-foreground">{a.email}</p>
            <p className="mt-2 text-xs text-muted-foreground">Since {new Date(a.created_at).toLocaleDateString()}</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {ROLE_PERMISSIONS[a.role_name].map((p) => (
                <Badge key={p} variant="outline" className="font-mono">
                  {p}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}