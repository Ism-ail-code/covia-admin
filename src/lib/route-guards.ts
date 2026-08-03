import { redirect } from "@tanstack/react-router";
import { ensureSession, isAuthenticated, requireAuth } from "./auth";
import { can, type AdminPermission } from "./rbac";

/**
 * Route-level RBAC guard. Every `_app` page declares the permission it
 * needs in its own `beforeLoad`; the server-side `admin_*` RPCs still
 * enforce the same rules, this only gates the UI routes themselves.
 */
export async function guardPermission(permission: AdminPermission): Promise<void> {
  await ensureSession();
  if (!isAuthenticated()) {
    throw redirect({ to: "/login" });
  }
  const user = requireAuth();
  if (!can(user.role, permission)) {
    throw redirect({ to: "/access-denied" });
  }
}