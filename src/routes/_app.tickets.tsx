import { createFileRoute } from "@tanstack/react-router";
import { TicketCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/page";
import { guardPermission } from "@/lib/route-guards";

export const Route = createFileRoute("/_app/tickets")({
  beforeLoad: async () => {
    await guardPermission("config.view");
  },
  component: TicketsPage,
});

function TicketsPage() {
  return (
    <div>
      <PageHeader
        title="Support tickets"
        description="Inbound issues from riders and drivers."
        actions={<Badge variant="outline">Future feature</Badge>}
      />
      <Card>
        <CardContent>
          <EmptyState
            title="Support tickets are coming soon"
            description="There is no support-ticket backend yet, so this page has nothing to show. It will be enabled in a future release."
            action={
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TicketCheck className="size-4" />
                Not available in this build
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}