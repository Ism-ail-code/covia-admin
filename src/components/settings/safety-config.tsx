import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { ErrorState } from "@/components/page";
import { getSafetyConfig, adminUpdateSafetyConfig, type SafetyConfigRow } from "@/lib/adminApi";

interface Draft {
  route_deviation_meters: string;
  stop_threshold_seconds: string;
  safety_check_timeout_seconds: string;
  never_started_minutes: string;
  exceeded_duration_minutes: string;
  sos_repeat_window_seconds: string;
  live_location_retention_hours: string;
  notify_participants_on_sos: boolean;
}

function toDraft(row: SafetyConfigRow): Draft {
  return {
    route_deviation_meters: String(row.route_deviation_meters),
    stop_threshold_seconds: String(row.stop_threshold_seconds),
    safety_check_timeout_seconds: String(row.safety_check_timeout_seconds),
    never_started_minutes: String(row.never_started_minutes),
    exceeded_duration_minutes: String(row.exceeded_duration_minutes),
    sos_repeat_window_seconds: String(row.sos_repeat_window_seconds),
    live_location_retention_hours: String(row.live_location_retention_hours),
    notify_participants_on_sos: row.notify_participants_on_sos,
  };
}

function validatePositiveInteger(value: string, label: string): string | null {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0 || !Number.isInteger(n)) {
    return `${label} must be a positive whole number.`;
  }
  return null;
}

export function SafetyConfigForm({ canManage }: { canManage: boolean }) {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["safetyConfig"], queryFn: getSafetyConfig });
  const [draft, setDraft] = useState<Draft | null>(null);

  useEffect(() => {
    if (query.data) setDraft(toDraft(query.data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.data]);

  const mutation = useMutation({
    mutationFn: (changes: Parameters<typeof adminUpdateSafetyConfig>[0]) => adminUpdateSafetyConfig(changes),
    onSuccess: () => {
      toast.success("Safety configuration saved");
      queryClient.invalidateQueries({ queryKey: ["safetyConfig"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't save the safety configuration."),
  });

  if (query.isLoading) {
    return (
      <Card>
        <CardContent className="space-y-4 p-6">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-5 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (query.isError) {
    return <ErrorState message="Could not load the safety configuration." onRetry={() => void query.refetch()} />;
  }

  const fields: Array<{ key: keyof Omit<Draft, "notify_participants_on_sos">; label: string; hint: string }> = [
    { key: "route_deviation_meters", label: "Route deviation threshold (meters)", hint: "Allowed off-route distance before monitoring flags a ride." },
    { key: "stop_threshold_seconds", label: "Stop threshold (seconds)", hint: "How long a stopped ride is flagged." },
    { key: "safety_check_timeout_seconds", label: "Safety check timeout (seconds)", hint: "Time before an unanswered check escalates." },
    { key: "never_started_minutes", label: "Never-started window (minutes)", hint: "Rides that never start within this window are flagged." },
    { key: "exceeded_duration_minutes", label: "Exceeded-duration window (minutes)", hint: "Rides running this long past ETA are flagged." },
    { key: "sos_repeat_window_seconds", label: "SOS repeat window (seconds)", hint: "Minimum interval between repeated SOS alerts." },
    { key: "live_location_retention_hours", label: "Live location retention (hours)", hint: "How long live coordinates are retained." },
  ];

  const setField = (key: keyof Draft, value: string | boolean) => {
    if (!draft) return;
    setDraft({ ...draft, [key]: value });
  };

  const handleSave = () => {
    if (!draft) return;
    for (const f of fields) {
      const error = validatePositiveInteger(draft[f.key], f.label.replace(/ \([^)]*\)$/, ""));
      if (error) {
        toast.error(error);
        return;
      }
    }
    mutation.mutate({
      routeDeviationMeters: Number(draft.route_deviation_meters),
      stopThresholdSeconds: Number(draft.stop_threshold_seconds),
      safetyCheckTimeoutSeconds: Number(draft.safety_check_timeout_seconds),
      neverStartedMinutes: Number(draft.never_started_minutes),
      exceededDurationMinutes: Number(draft.exceeded_duration_minutes),
      sosRepeatWindowSeconds: Number(draft.sos_repeat_window_seconds),
      liveLocationRetentionHours: Number(draft.live_location_retention_hours),
      notifyParticipantsOnSos: draft.notify_participants_on_sos,
    });
  };

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Safety configuration</CardTitle>
          <CardDescription>Live thresholds used by ride monitoring and SOS escalation.</CardDescription>
        </div>
        <Badge variant="success">Live</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.map((f) => (
          <div key={f.key} className="grid gap-2 sm:grid-cols-[1fr_140px] sm:items-center">
            <div>
              <Label htmlFor={f.key}>{f.label}</Label>
              <p className="text-xs text-muted-foreground">{f.hint}</p>
            </div>
            <Input
              id={f.key}
              type="number"
              min={1}
              value={draft?.[f.key] ?? ""}
              onChange={(e) => setField(f.key, e.target.value)}
              disabled={!canManage || mutation.isPending}
            />
          </div>
        ))}

        <Separator />

        <div className="flex items-center justify-between gap-3">
          <div>
            <Label htmlFor="notify_sos">Notify participants on SOS</Label>
            <p className="text-xs text-muted-foreground">Alert everyone on the ride when an SOS is triggered.</p>
          </div>
          <Switch
            id="notify_sos"
            checked={draft?.notify_participants_on_sos ?? false}
            onCheckedChange={(v) => setField("notify_participants_on_sos", Boolean(v))}
            disabled={!canManage || mutation.isPending}
          />
        </div>

        <div className="flex items-center justify-between border-t pt-4">
          <p className="text-xs text-muted-foreground">
            {mutation.isPending
              ? "Saving…"
              : query.data
                ? `Last updated ${new Date(query.data.updated_at).toLocaleString()}`
                : " "}
          </p>
          <Button size="sm" onClick={handleSave} disabled={!canManage || mutation.isPending}>
            {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}