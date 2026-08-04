/**
 * Covia Admin Constants — centralized admin console values.
 */

/** Admin route paths. */
export const ADMIN_ROUTES = {
  DASHBOARD: "/",
  USERS: "/users",
  RIDES: "/rides",
  VERIFICATIONS: "/verifications",
  REPORTS: "/reports",
  APPEALS: "/appeals",
  SAFETY: "/safety",
  MONITORING: "/monitoring",
  ANALYTICS: "/analytics",
  SETTINGS: "/settings",
  TEAM: "/team",
  BETA: "/beta",
  TICKETS: "/tickets",
  STANDBY: "/standby",
} as const;

/** Admin permission keys. */
export const PERMISSIONS = {
  VIEW_USERS: "view_users",
  MANAGE_USERS: "manage_users",
  VIEW_RIDES: "view_rides",
  MANAGE_RIDES: "manage_rides",
  REVIEW_VERIFICATIONS: "review_verifications",
  MANAGE_SAFETY: "manage_safety",
  VIEW_ANALYTICS: "view_analytics",
  MANAGE_SETTINGS: "manage_settings",
  MANAGE_TEAM: "manage_team",
  VIEW_MONITORING: "view_monitoring",
  MANAGE_REPORTS: "manage_reports",
  MANAGE_APPEALS: "manage_appeals",
} as const;

/** Pagination defaults. */
export const ADMIN_PAGINATION = {
  DEFAULT_PAGE_SIZE: 25,
  MAX_PAGE_SIZE: 100,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
} as const;

/** Auto-refresh intervals in milliseconds. */
export const REFRESH_INTERVALS = {
  DASHBOARD: 30_000,
  MONITORING: 15_000,
  REALTIME_RIDES: 10_000,
  HEALTH_CHECKS: 30_000,
  EVENT_LOG: 20_000,
} as const;

/** Date format strings. */
export const DATE_FORMATS = {
  FULL: "DD MMM YYYY, HH:mm",
  DATE_ONLY: "DD MMM YYYY",
  TIME_ONLY: "HH:mm",
  SHORT: "DD/MM/YY",
  ISO: "YYYY-MM-DD",
} as const;

/** Status colors for Tailwind. */
export const STATUS_COLORS = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800",
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  suspended: "bg-orange-100 text-orange-800",
  banned: "bg-red-100 text-red-800",
  completed: "bg-blue-100 text-blue-800",
  cancelled: "bg-gray-100 text-gray-800",
  in_progress: "bg-blue-100 text-blue-800",
} as const;
