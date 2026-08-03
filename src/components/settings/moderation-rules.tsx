import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { ErrorState } from "@/components/page";
import { adminListModerationRules, adminUpdateModerationRule, type ModerationRuleRow } from "@/lib/adminApi";

function ruleBadge(actionType: string | null): { variant: "warning" | "destructive" | "secondary"; label: string } {
  if (!actionType) return { variant: "secondary", label: "monitor only" };
  if (actionType === "ban") return { variant: "destructive", label: "ban" };
  if (actionType === "suspension") return { variant: "warning", label: "suspension" };
  return { variant: "secondary", label: actionType.replace(/_/g, " ") };
}

interface RuleDraft {
  threshold: string;
  durationHours: string;
  enabled: boolean;
}

export function ModerationRulesEditor({ canConfigure }: { canConfigure: boolean }) {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["safetyRules"], queryFn: adminListModerationRules });
  const [drafts, setDrafts] = useState<Record<string, RuleDraft>>({});

  const mutation = useMutation({
    mutationFn: (input: Parameters<typeof adminUpdateModerationRule>[0]) => adminUpdateModerationRule(input),
    onSuccess: (_, input) => {
      toast.success(`Rule "${input.ruleName.replace(/_/g, " ")}" saved`);
      queryClient.invalidateQueries({ queryKey: ["safetyRules"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't save the rule."),
  });

  if (query.isLoading) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="space-y-3 p-6">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (query.isError) {
    return <ErrorState message="Could not load moderation rules." onRetry={() => void query.refetch()} />;
  }

  const rows = query.data ?? [];

  const draftFor = (r: ModerationRuleRow): RuleDraft => {
    const existing = drafts[r.rule_name];
    if (existing) return existing;
    return {
      threshold: r.threshold !== null ? String(r.threshold) : "",
      durationHours: r.duration_hours !== null ? String(r.duration_hours) : "",
      enabled: r.enabled,
    };
  };

  const setDraft = (ruleName: string, patch: Partial<RuleDraft>) => {
    setDrafts((prev) => ({ ...prev, [ruleName]: { ...draftFor(rows.find((r) => r.rule_name === ruleName)!), ...patch } }));
  };

  const handleSave = (r: ModerationRuleRow) => {
    const d = draftFor(r);
    const threshold = d.threshold.trim() === "" ? null : Number(d.threshold);
    if (threshold !== null && (!Number.isFinite(threshold) || threshold < 0)) {
      toast.error("Threshold must be a number (or empty to leave unchanged).");
      return;
    }
    const duration = d.durationHours.trim() === "" ? null : Number(d.durationHours);
    if (duration !== null && (!Number.isFinite(duration) || duration <= 0)) {
      toast.error("Duration must be a positive number of hours.");
      return;
    }
    mutation.mutate({
      ruleName: r.rule_name,
      threshold,
      durationHours: duration,
      enabled: d.enabled,
    });
  };

  const reset = (r: ModerationRuleRow) => {
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[r.rule_name];
      return next;
    });
  };

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Moderation rules</CardTitle>
          <CardDescription>
            Thresholds evaluated by the automatic moderation engine (reliability, cancellations, no-shows, reports).
          </CardDescription>
        </div>
        <Badge variant="success">Live</Badge>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 lg:grid-cols-2">
          {rows.map((r) => {
            const d = draftFor(r);
            return (
              <Card key={r.rule_name}>
                <CardHeader className="flex-row items-start justify-between space-y-0">
                  <div>
                    <CardTitle className="text-base">{r.rule_name.replace(/_/g, " ")}</CardTitle>
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">{r.rule_name}</p>
                  </div>
                  <Badge variant={ruleBadge(r.action_type).variant}>{ruleBadge(r.action_type).label}</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor={`${r.rule_name}-threshold`}>Threshold</Label>
                      <Input
                        id={`${r.rule_name}-threshold`}
                        type="number"
                        min={0}
                        placeholder={r.threshold !== null ? String(r.threshold) : "—"}
                        value={d.threshold}
                        onChange={(e) => setDraft(r.rule_name, { threshold: e.target.value })}
                        disabled={!canConfigure || mutation.isPending}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`${r.rule_name}-duration`}>Duration (hours)</Label>
                      <Input
                        id={`${r.rule_name}-duration`}
                        type="number"
                        min={1}
                        placeholder={r.duration_hours !== null ? String(r.duration_hours) : "—"}
                        value={d.durationHours}
                        onChange={(e) => setDraft(r.rule_name, { durationHours: e.target.value })}
                        disabled={!canConfigure || mutation.isPending}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`${r.rule_name}-enabled`}
                        checked={d.enabled}
                        onCheckedChange={(v) => setDraft(r.rule_name, { enabled: Boolean(v) })}
                        disabled={!canConfigure || mutation.isPending}
                        aria-label={`Toggle ${r.rule_name}`}
                      />
                      <span className="text-sm">{d.enabled ? "Enabled" : "Disabled"}</span>
                    </div>
                    <Badge variant="outline">Severity {r.severity}</Badge>
                  </div>
                  <div className="flex items-center justify-end gap-2 border-t pt-3">
                    <Button variant="ghost" size="sm" onClick={() => reset(r)} disabled={!canConfigure || mutation.isPending}>
                      <RotateCcw className="size-3.5" />
                      Reset
                    </Button>
                    <Button size="sm" onClick={() => handleSave(r)} disabled={!canConfigure || mutation.isPending}>
                      {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                      Save rule
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}