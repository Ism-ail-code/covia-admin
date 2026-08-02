import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/app-shell";
import { ensureSession, isAuthenticated } from "@/lib/auth";

export const Route = createFileRoute("/_app")({
  beforeLoad: async () => {
    await ensureSession();
    if (!isAuthenticated()) {
      throw redirect({ to: "/login" });
    }
  },
  component: AppLayout,
});