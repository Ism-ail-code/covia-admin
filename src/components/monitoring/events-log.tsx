import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState, ErrorState } from "@/components/page";
import { adminListMonitoringEvents, type MonitoringEventRow } from "@/lib/adminApi";
import { cn } from "@/lib/utils";

const LEVELS = ["warn", "error", "critical"] as const;

function levelBadge(level: string): { variant: "warning" | "destructive" | "secondary"; label: string } {
  switch (level) {
    case "warn":
      return { variant: "warning", label: "warn" };
    case "error":
    case "critical":
      return { variant: "destructive", label: level };
    default:
      return { variant: "secondary", label: level };
  }
}

export function MonitoringEventsLog() {
  const [level, setLevel] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ["monitoring", "events", level ?? "all"],
    queryFn: () => adminListMonitoringEvents({ level, page: 1, pageSize: 50 }),
    refetchInterval: 15_000,
  });

  const rows = query.data?.items ?? [];

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Monitoring events</CardTitle>
          <CardDescription>Structured log from backend subsystems. Polls every 15s.</CardDescription>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant={level === null ? "default" : "outline"}
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setLevel(null)}
          >
            All
          </Button>
          {LEVELS.map((l) => (
            <Button
              key={l}
              variant={level === l ? "default" : "outline"}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setLevel(level === l ? null : l)}
            >
              {l}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {query.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : query.isError ? (
          <ErrorState message="Could not load monitoring events." onRetry={() => void query.refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState title="No events match this filter" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Level</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Message</TableHead>
                <TableHead className="text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>
                    <Badge variant={levelBadge(e.level).variant}>{levelBadge(e.level).label}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{e.source}</TableCell>
                  <TableCell className="max-w-md">
                    <p className={cn("truncate", e.level === "critical" && "font-medium text-destructive")}>
                      {e.message}
                    </p>
                  </TableCell>
                  <TableCell className="text-right text-xs tabular-nums text-muted-foreground">
                    {new Date(e.created_at).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export type { MonitoringEventRow };