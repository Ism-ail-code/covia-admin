import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/page";
import { api } from "@/lib/api";

export const Route = createFileRoute("/_app/safety")({
  component: SafetyPage,
});

function SafetyPage() {
  const policiesQuery = useQuery({ queryKey: ["safetyPolicies"], queryFn: api.getSafetyPolicies });

  return (
    <div>
      <PageHeader
        title="Safety & Policies"
        description="Guard rails that shape ride routing and rider care."
        actions={
          <Button size="sm">
            <Plus className="size-4" />
            New policy
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {policiesQuery.data?.map((p) => (
          <Card key={p.id}>
            <CardHeader className="flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="text-base">{p.name}</CardTitle>
                <p className="mt-0.5 font-mono text-xs text-muted-foreground">{p.id}</p>
              </div>
              <Switch defaultChecked={p.enabled} aria-label="Toggle policy" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{p.description}</p>
              <Separator className="my-4" />
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Updated {p.updatedAt}</span>
                <Badge variant="secondary">
                  {p.rules} rule{p.rules === 1 ? "" : "s"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}