import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Car,
  CheckCircle,
  Star,
  Bug,
  TrendingUp,
  Activity,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/_app/beta")({
  component: BetaDashboard,
});

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  color = "text-primary",
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
  color?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && <p className="text-xs text-muted-foreground">{trend}</p>}
      </CardContent>
    </Card>
  );
}

function BetaDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["beta-stats"],
    queryFn: async () => {
      const [users, rides, verifications, feedback] = await Promise.all([
        supabase.from("profiles" as any).select("id", { count: "exact", head: true }),
        supabase.from("rides" as any).select("id, ride_status, created_at"),
        supabase.from("verification_submissions" as any).select("id, status"),
        supabase.from("feedback_reports" as any).select("id, category, created_at").limit(100),
      ]);

      const totalUsers = users.count ?? 0;
      const totalRides = rides.data?.length ?? 0;
      const completedRides = rides.data?.filter((r: any) => r.ride_status === "completed").length ?? 0;
      const pendingVerifications = verifications.data?.filter((v: any) => v.status === "pending").length ?? 0;
      const approvedVerifications = verifications.data?.filter((v: any) => v.status === "approved").length ?? 0;
      const totalFeedback = feedback.data?.length ?? 0;
      const bugReports = feedback.data?.filter((f: any) => f.category === "bug").length ?? 0;

      // Rides created in last 7 days
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const recentRides = rides.data?.filter((r: any) => r.created_at > weekAgo).length ?? 0;

      return {
        totalUsers,
        totalRides,
        completedRides,
        pendingVerifications,
        approvedVerifications,
        totalFeedback,
        bugReports,
        recentRides,
        completionRate: totalRides > 0 ? Math.round((completedRides / totalRides) * 100) : 0,
      };
    },
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Beta Dashboard</h1>
          <Badge variant="secondary">Loading...</Badge>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-24 mb-2" />
                <div className="h-8 bg-muted rounded w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Activity className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Beta Dashboard</h1>
        <Badge variant="secondary">Live</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Users" value={stats?.totalUsers ?? 0} icon={Users} trend="Registered beta testers" />
        <StatCard title="Total Rides" value={stats?.totalRides ?? 0} icon={Car} trend={`${stats?.recentRides ?? 0} this week`} />
        <StatCard title="Completed Rides" value={stats?.completedRides ?? 0} icon={CheckCircle} trend={`${stats?.completionRate ?? 0}% completion rate`} color="text-green-600" />
        <StatCard title="Avg Rating" value="—" icon={Star} trend="Not enough data" color="text-yellow-600" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Pending Verifications" value={stats?.pendingVerifications ?? 0} icon={Clock} color="text-orange-600" />
        <StatCard title="Approved Verifications" value={stats?.approvedVerifications ?? 0} icon={CheckCircle} color="text-green-600" />
        <StatCard title="Bug Reports" value={stats?.bugReports ?? 0} icon={Bug} trend={`${stats?.totalFeedback ?? 0} total feedback`} color="text-red-600" />
        <StatCard title="Ride Growth" value={`${stats?.recentRides ?? 0}/wk`} icon={TrendingUp} color="text-blue-600" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Beta Health Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">User Registration</span>
              <span className="font-medium">{(stats?.totalUsers ?? 0) > 0 ? "Active" : "No users yet"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Ride Activity</span>
              <span className="font-medium">{(stats?.totalRides ?? 0) > 0 ? `${stats?.recentRides ?? 0} rides/week` : "No rides yet"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Verification Pipeline</span>
              <span className="font-medium">{stats?.pendingVerifications ?? 0} pending</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Bug Report Rate</span>
              <span className="font-medium">{stats?.bugReports ?? 0} bugs reported</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <a href="/verifications" className="block p-2 rounded hover:bg-muted text-sm">
              Review pending verifications ({stats?.pendingVerifications ?? 0})
            </a>
            <a href="/reports" className="block p-2 rounded hover:bg-muted text-sm">
              View reported issues
            </a>
            <a href="/monitoring" className="block p-2 rounded hover:bg-muted text-sm">
              Live monitoring dashboard
            </a>
            <a href="/settings" className="block p-2 rounded hover:bg-muted text-sm">
              Platform settings
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
