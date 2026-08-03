import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Ban, Loader2, ShieldCheck, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/page";
import {
  adminBanUser,
  adminGetUserProfile,
  adminGetUserRideHistory,
  adminReactivateUser,
  adminSuspendUser,
} from "@/lib/adminApi";

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

function statusBadge(isBanned: boolean, isSuspended: boolean): { variant: "success" | "destructive"; label: string } {
  if (isBanned) return { variant: "destructive", label: "banned" };
  if (isSuspended) return { variant: "destructive", label: "suspended" };
  return { variant: "success", label: "active" };
}

function UserDetailPage() {
  const { userId } = Route.useParams();
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");

  const profileQuery = useQuery({
    queryKey: ["user", userId],
    queryFn: () => adminGetUserProfile(userId),
  });
  const historyQuery = useQuery({
    queryKey: ["user", userId, "rides"],
    queryFn: () => adminGetUserRideHistory(userId),
  });

  const mutation = useMutation({
    mutationFn: ({ fn, verb }: { fn: () => Promise<void>; verb: string }) => fn().then(() => verb),
    onSuccess: (verb) => {
      toast.success(verb);
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not update user"),
  });

  const u = profileQuery.data;
  const rides = historyQuery.data ?? [];

  if (!u) return null;

  const isRestricted = u.is_banned || u.is_suspended;
  const status = statusBadge(u.is_banned, u.is_suspended);

  const runWithReason = (fn: (reason: string) => Promise<void>, verb: string, checkReason = true) => {
    if (checkReason && !reason.trim()) {
      toast.error("A reason is required");
      return;
    }
    mutation.mutate({ fn: () => fn(reason.trim()), verb });
    setReason("");
  };

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2 text-muted-foreground">
        <Link to="/users">
          <ArrowLeft className="size-4" />
          Back to users
        </Link>
      </Button>

      <PageHeader
        title={u.display_name ?? u.username ?? u.email}
        description={`${u.user_id} · member since ${new Date(u.created_at).toLocaleDateString()}`}
        actions={
          <>
            {isRestricted ? (
              <Button
                variant="outline"
                size="sm"
                disabled={mutation.isPending}
                onClick={() => runWithReason((reason) => adminReactivateUser(u.user_id, reason), "Account reactivated")}
              >
                {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <UserCheck className="size-4" />}
                Reactivate
              </Button>
            ) : (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={mutation.isPending}>
                    <ShieldCheck className="size-4" />
                    Suspend
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Suspend account</DialogTitle>
                    <DialogDescription>Give a reason for the suspension (visible in the audit log).</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-2">
                    <Input
                      placeholder="Reason…"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      size="sm"
                      disabled={mutation.isPending}
                      onClick={() => runWithReason((reason) => adminSuspendUser(u.user_id, reason), "User suspended")}
                    >
                      Confirm suspension
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={mutation.isPending}>
                  <Ban className="size-4" />
                  Ban
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ban account</DialogTitle>
                  <DialogDescription>Banned users lose access and can appeal. A reason is required.</DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                  <Input
                    placeholder="Reason…"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    autoFocus
                  />
                </div>
                <DialogFooter>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={mutation.isPending}
                    onClick={() => runWithReason((r) => adminBanUser(u.user_id, r), "User banned")}
                  >
                    {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : "Ban account"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex-row items-center gap-3 space-y-0">
            <Avatar className="size-12">
              <AvatarFallback>{initials(u.display_name ?? u.email)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base">{u.display_name ?? u.username ?? u.email}</CardTitle>
              <p className="text-xs text-muted-foreground">{u.phone ?? "no phone"}</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Separator />
            <Row label="Email" value={u.email} />
            <Row label="City" value={u.home_city ?? "—"} />
            <Row label="Verification" value={u.verification_status} />
            <Row label="Status" value={<Badge variant={status.variant}>{status.label}</Badge>} />
            <Row label="Rating" value={u.rating?.toFixed(1) ?? "—"} />
            <Row label="Reliability" value={u.reliability_score.toFixed(1)} />
            <Row label="Rides completed" value={u.total_completed_rides.toLocaleString()} />
            <Row label="Rides cancelled" value={u.total_cancelled_rides.toLocaleString()} />
            <Row label="Reports received" value={u.reports_received_total.toLocaleString()} />
            <Row label="Joined" value={new Date(u.created_at).toLocaleDateString()} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recent rides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {historyQuery.isLoading ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
              ) : rides.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No ride history yet.</p>
              ) : (
                rides.map((r) => (
                  <div
                    key={r.ride_id}
                    className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {r.origin} → {r.destination}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {r.ride_status.replace("_", " ")} · {new Date(r.departure_time).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline">{r.role}</Badge>
                  </div>
                ))
              )}
            </div>
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