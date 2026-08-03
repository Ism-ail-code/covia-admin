import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/page";
import { SafetyConfigForm } from "@/components/settings/safety-config";
import { ModerationRulesEditor } from "@/components/settings/moderation-rules";
import { useAuth } from "@/lib/auth";
import { can } from "@/lib/rbac";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

function FutureSettingsCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Badge variant="outline">Coming soon</Badge>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            This section is read-only for now. Once the corresponding backend settings are exposed,
            it will become editable here.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function SettingsPage() {
  const user = useAuth();
  const canView = can(user?.role ?? null, "config.view");
  const canManage = can(user?.role ?? null, "config.manage");

  if (!canView) {
    return (
      <div>
        <PageHeader title="Settings" description="Workspace preferences and configuration." />
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            You don't have permission to view configuration settings.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Safety, moderation and platform configuration."
        actions={!canManage ? <Badge variant="outline">Read-only</Badge> : undefined}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Tabs defaultValue="safety">
            <TabsList>
              <TabsTrigger value="safety">Safety</TabsTrigger>
              <TabsTrigger value="moderation">Moderation</TabsTrigger>
              <TabsTrigger value="platform">Platform</TabsTrigger>
              <TabsTrigger value="verification">Verification</TabsTrigger>
            </TabsList>
            <TabsContent value="safety" className="space-y-4">
              <SafetyConfigForm canManage={canManage} />
            </TabsContent>
            <TabsContent value="moderation" className="space-y-4">
              <ModerationRulesEditor canConfigure={canManage} />
            </TabsContent>
            <TabsContent value="platform" className="space-y-4">
              <FutureSettingsCard
                title="Platform settings"
                description="Feature flags, maintenance mode and platform-wide preferences."
              />
            </TabsContent>
            <TabsContent value="verification" className="space-y-4">
              <FutureSettingsCard
                title="Verification settings"
                description="Document requirements, verification thresholds and expiry policies."
              />
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Signed in as</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-md border bg-muted/40 px-3 py-2">
                {user?.name}
                <span className="text-muted-foreground">
                  {" "}· {user?.email} ({user?.role.replace("_", " ")})
                </span>
              </div>
              <Separator />
              <p className="text-xs text-muted-foreground">
                {canManage
                  ? "You can edit safety and moderation settings. Changes are written to the backend and recorded in the audit log."
                  : "You have read-only access to these settings. Request an admin to make changes."}
              </p>
            </CardContent>
          </Card>

          <FutureSettingsCard
            title="Danger zone"
            description="Export workspace data and other destructive actions."
          />
        </div>
      </div>
    </div>
  );
}
