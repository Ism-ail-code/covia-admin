import { createFileRoute } from "@tanstack/react-router";
import { Radar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/page";
import { guardPermission } from "@/lib/route-guards";

export const Route = createFileRoute("/_app/standby")({
  beforeLoad: async () => {
    await guardPermission("config.view");
  },
  component: StandbyPage,
});

function StandbyPage() {
  return (
    <div>
      <PageHeader
        title="Standby Pool"
        description="Checkpoints that catch missed taps and keep short rides on track."
        actions={<Badge variant="outline">Future feature</Badge>}
      />
      <Card>
        <CardContent>
          <EmptyState
            title="Standby pool is coming soon"
            description="There is no standby backend yet, so this page has nothing to show. It will be enabled in a future release."
            action={
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Radar className="size-4" />
                Not available in this build
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}