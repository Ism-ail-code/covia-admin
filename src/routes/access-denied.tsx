import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/layout/brand";

export const Route = createFileRoute("/access-denied")({
  component: AccessDeniedPage,
});

function AccessDeniedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-6">
      <div className="flex items-center gap-2.5">
        <BrandMark />
        <p className="font-display text-sm font-semibold tracking-tight">Covia Admin</p>
      </div>
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10">
          <ShieldX className="size-6 text-destructive" />
        </div>
        <h1 className="font-display text-xl font-semibold tracking-tight">Access denied</h1>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Your role doesn't have permission to view this section. If you think this is a mistake, ask a
          super admin to update your role.
        </p>
        <Button asChild className="mt-6">
          <Link to="/">Back to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}