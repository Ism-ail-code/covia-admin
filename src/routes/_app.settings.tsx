import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/page";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const user = useAuth();

  return (
    <div>
      <PageHeader title="Settings" description="Workspace preferences and security." />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Workspace profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="workspace">Workspace name</Label>
              <Input id="workspace" defaultValue="Covia" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="market">Primary market</Label>
              <Input id="market" defaultValue="Pakistan" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input id="currency" defaultValue="PKR" />
            </div>
          </CardContent>
        </Card>

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
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Email notifications</p>
                <p className="text-xs text-muted-foreground">Digest for pending moderation</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Two-factor authentication</p>
                <p className="text-xs text-muted-foreground">Require a code on this device</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Danger zone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Badge variant="destructive">Read-only preview</Badge>
            <p className="text-sm text-muted-foreground">
              Actions become live once Supabase auth is wired in.
            </p>
            <Button variant="outline" size="sm" className="w-full" disabled>
              Export workspace data
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}