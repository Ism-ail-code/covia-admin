import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Ban, Loader2, ShieldCheck, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/page";
import { api } from "@/lib/api";
import { actions } from "@/lib/actions";
import type { AccountStatus } from "@/lib/types";

export const Route = createFileRoute("/_app/users/$userId")({
  component: UserDetailPage,
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

function UserDetailPage() {
  const { userId } = Route.useParams();
  const queryClient = useQueryClient();
  const userQuery = useQuery({ queryKey: ["user", userId], queryFn: () => api.getUser(userId) });

  const statusMutation = useMutation({
    mutationFn: (status: AccountStatus) => actions.setUserStatus(userId, status),
    onSuccess: (_, status) => {
      toast.success(
        status === "active" ? "Account reactivated" : `User ${status}`,
      );
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: () => toast.error("Could not update user"),
  });

  const user = userQuery.data;

  if (!user) return null;

  const isRestricted = user.status === "banned" || user.status === "suspended";

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2 text-muted-foreground">
        <Link to="/users">
          <ArrowLeft className="size-4" />
          Back to users
        </Link>
      </Button>

      <PageHeader
        title={user.name}
        description={`${user.id} · member since ${user.joinedAt}`}
        actions={
          <>
            {isRestricted ? (
              <Button
                variant="outline"
                size="sm"
                disabled={statusMutation.isPending}
                onClick={() => statusMutation.mutate("active")}
              >
                {statusMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <UserCheck className="size-4" />
                )}
                Reactivate
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                disabled={statusMutation.isPending}
                onClick={() => statusMutation.mutate("suspended")}
              >
                {statusMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ShieldCheck className="size-4" />
                )}
                Suspend
              </Button>
            )}
            <Button
              variant="destructive"
              size="sm"
              disabled={statusMutation.isPending}
              onClick={() => statusMutation.mutate("banned")}
            >
              <Ban className="size-4" />
              Ban
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex-row items-center gap-3 space-y-0">
            <Avatar className="size-12">
              <AvatarFallback>{initials(user.name)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base">{user.name}</CardTitle>
              <p className="text-xs text-muted-foreground">{user.phone}</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Separator />
            <Row label="Role" value={user.role} />
            <Row label="Status" value={<Badge variant={statusVariant[user.status]}>{user.status}</Badge>} />
            <Row label="City" value={user.city} />
            <Row label="Verified" value={user.verified ? "Yes" : "Pending"} />
            <Row label="Rating" value={user.rating?.toFixed(1) ?? "—"} />
            <Row label="Trips" value={user.trips.toLocaleString()} />
            <Row label="Joined" value={user.joinedAt} />
            <Row label="Last active" value={user.lastActive} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Account activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Trip history, payouts and moderation events surface here once the backend is connected.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}