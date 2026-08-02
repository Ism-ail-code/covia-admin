/**
 * Admin RBAC mirror — static copy of `admin_role_permissions` used to
 * show/hide actions client-side. The `admin_*` RPCs still enforce the
 * same rules server-side; this only drives the UI.
 */

import type { AdminRole } from "./adminApi";

export type AdminPermission =
  | "user.view"
  | "user.manage"
  | "ride.view"
  | "ride.cancel"
  | "verification.view"
  | "verification.review"
  | "report.view"
  | "report.review"
  | "appeal.view"
  | "appeal.decide"
  | "moderation.apply"
  | "moderation.configure"
  | "analytics.view"
  | "audit.view"
  | "monitor.view"
  | "config.view"
  | "config.manage"
  | "admin.manage";

export const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  super_admin: [
    "user.view", "user.manage", "ride.view", "ride.cancel",
    "verification.view", "verification.review",
    "report.view", "report.review",
    "appeal.view", "appeal.decide",
    "moderation.apply", "moderation.configure",
    "analytics.view", "audit.view", "monitor.view",
    "config.view", "config.manage", "admin.manage",
  ],
  admin: [
    "user.view", "user.manage", "ride.view", "ride.cancel",
    "verification.view", "verification.review",
    "report.view", "report.review",
    "appeal.view", "appeal.decide",
    "moderation.apply", "moderation.configure",
    "analytics.view", "audit.view", "monitor.view",
    "config.view", "config.manage",
  ],
  moderator: [
    "user.view", "ride.view", "verification.view", "verification.review",
    "report.view", "report.review", "appeal.view",
    "moderation.apply", "audit.view", "config.view",
  ],
  support_agent: ["user.view", "ride.view", "verification.view", "report.view", "appeal.view", "config.view"],
};

export function can(role: string | null, permission: AdminPermission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role as AdminRole]?.includes(permission) ?? false;
}