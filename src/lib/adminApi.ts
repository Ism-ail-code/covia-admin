/**
 * Admin API service — typed wrappers over the Covia Phase 10 `admin_*`
 * RPCs (migrations 0027–0035). Mirrors `covia-mobile/src/services/admin.ts`.
 *
 * Every function is security definer and re-checks its own permission
 * server-side; the console mirrors the RBAC matrix (see `supabaseRoles.ts`)
 * to hide actions the signed-in role cannot take.
 *
 * Error contract: 42501 → "you don't have permission", 28000 → not signed in.
 */

import { supabase, isSupabaseConfigured } from "./supabase";

export class AdminError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminError";
  }
}

function toAdminError(error: unknown, fallback: string): AdminError {
  if (error && typeof error === "object" && "message" in error) {
    const message = String((error as { message: unknown }).message);
    if (message.includes("42501")) {
      return new AdminError("You don't have permission for this action.");
    }
    if (message.includes("28000")) {
      return new AdminError("You need to be logged in.");
    }
    return new AdminError(message || fallback);
  }
  return new AdminError(fallback);
}

function pageResult<T extends { total_count: string | null }>(rows: T[]): { items: T[]; totalCount: number } {
  return { items: rows, totalCount: rows.length > 0 ? Number(rows[0].total_count) : 0 };
}

// ── RBAC ────────────────────────────────────────────────────────────

export async function isAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_admin");
  if (error) return false;
  return data === true;
}

export async function currentAdminRole(): Promise<string | null> {
  const { data, error } = await supabase.rpc("current_admin_role");
  if (error) return null;
  return (data as string | null) ?? null;
}

export async function hasPermission(permission: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("has_permission", { p_permission: permission });
  if (error) return false;
  return data === true;
}

// ── Dashboard / analytics ───────────────────────────────────────────

export async function adminGetAnalytics(): Promise<AnalyticsJson> {
  const { data, error } = await supabase.rpc("admin_get_analytics");
  if (error) throw toAdminError(error, "Couldn't load analytics.");
  return data as AnalyticsJson;
}

export async function getPlatformHealth(): Promise<PlatformHealth> {
  const { data, error } = await supabase.rpc("get_platform_health");
  if (error) throw toAdminError(error, "Couldn't check platform health.");
  return data as PlatformHealth;
}

// ── Users ───────────────────────────────────────────────────────────

export async function adminSearchUsers(input: {
  query?: string | null;
  verificationStatus?: string | null;
  status?: UserStatusFilter;
  page?: number;
  pageSize?: number;
}): Promise<AdminUserPage> {
  const { data, error } = await supabase.rpc("admin_search_users", {
    p_query: input.query ?? null,
    p_verification_status: input.verificationStatus ?? null,
    p_status: input.status ?? null,
    p_page: input.page ?? 1,
    p_page_size: input.pageSize ?? 50,
  });
  if (error) throw toAdminError(error, "Couldn't search users.");
  return pageResult((data as AdminUserPage["items"]) ?? []);
}

export async function adminGetUserProfile(userId: string): Promise<AdminUserProfile> {
  const { data, error } = await supabase.rpc("admin_get_user_profile", { p_user_id: userId });
  if (error) throw toAdminError(error, "Couldn't load the user profile.");
  return data as AdminUserProfile;
}

export async function adminGetUserRideHistory(
  userId: string,
  page = 1,
  pageSize = 20,
): Promise<AdminUserRideHistoryRow[]> {
  const { data, error } = await supabase.rpc("admin_get_user_ride_history", {
    p_user_id: userId,
    p_page: page,
    p_page_size: pageSize,
  });
  if (error) throw toAdminError(error, "Couldn't load the user's ride history.");
  return (data as AdminUserRideHistoryRow[]) ?? [];
}

export async function adminSuspendUser(userId: string, reason: string, durationHours?: number | null): Promise<void> {
  const { error } = await supabase.rpc("admin_suspend_user", {
    p_user_id: userId,
    p_reason: reason,
    p_duration_hours: durationHours ?? null,
  });
  if (error) throw toAdminError(error, "Couldn't suspend the user.");
}

export async function adminBanUser(userId: string, reason: string): Promise<void> {
  const { error } = await supabase.rpc("admin_ban_user", { p_user_id: userId, p_reason: reason });
  if (error) throw toAdminError(error, "Couldn't ban the user.");
}

export async function adminReactivateUser(userId: string, reason: string): Promise<void> {
  const { error } = await supabase.rpc("admin_reactivate_user", { p_user_id: userId, p_reason: reason });
  if (error) throw toAdminError(error, "Couldn't reactivate the user.");
}

// ── Rides ───────────────────────────────────────────────────────────

export async function adminSearchRides(input: {
  query?: string | null;
  status?: string | null;
  page?: number;
  pageSize?: number;
}): Promise<AdminRidePage> {
  const { data, error } = await supabase.rpc("admin_search_rides", {
    p_query: input.query ?? null,
    p_status: input.status ?? null,
    p_page: input.page ?? 1,
    p_page_size: input.pageSize ?? 50,
  });
  if (error) throw toAdminError(error, "Couldn't search rides.");
  return pageResult((data as AdminRidePage["items"]) ?? []);
}

export async function adminGetRideDetails(rideId: string): Promise<AdminRideDetails> {
  const { data, error } = await supabase.rpc("admin_get_ride_details", { p_ride_id: rideId });
  if (error) throw toAdminError(error, "Couldn't load the ride details.");
  return data as AdminRideDetails;
}

export async function adminGetRideTimeline(rideId: string): Promise<AdminTimelineEvent[]> {
  const { data, error } = await supabase.rpc("admin_get_ride_timeline", { p_ride_id: rideId });
  if (error) throw toAdminError(error, "Couldn't load the ride timeline.");
  return (data as AdminTimelineEvent[]) ?? [];
}

// ── Verification ────────────────────────────────────────────────────

export async function adminListVerifications(input: {
  status?: string;
  search?: string | null;
  verificationType?: string | null;
}): Promise<VerificationQueueRow[]> {
  const { data, error } = await supabase.rpc("admin_list_verifications", {
    p_status: input.status ?? "pending",
    p_search: input.search ?? null,
    p_verification_type: input.verificationType ?? null,
  });
  if (error) throw toAdminError(error, "Couldn't load the verification queue.");
  return (data as VerificationQueueRow[]) ?? [];
}

export async function adminReviewVerification(
  submissionId: string,
  action: "approve" | "reject" | "request_resubmission",
  reason?: string | null,
): Promise<void> {
  const { error } = await supabase.rpc("admin_review_verification", {
    p_submission_id: submissionId,
    p_action: action,
    p_reason: reason ?? null,
  });
  if (error) throw toAdminError(error, "Couldn't review the submission.");
}

// ── Safety / moderation ─────────────────────────────────────────────

export async function adminListModerationRules(): Promise<ModerationRuleRow[]> {
  const { data, error } = await supabase.rpc("admin_list_moderation_rules", { p_page: 1, p_page_size: 100 });
  if (error) throw toAdminError(error, "Couldn't load moderation rules.");
  return (data as ModerationRuleRow[]) ?? [];
}

export async function adminUpdateModerationRule(input: {
  ruleName: string;
  threshold?: number | null;
  actionType?: string | null;
  durationHours?: number | null;
  enabled?: boolean | null;
}): Promise<void> {
  const { error } = await supabase.rpc("admin_update_moderation_rule", {
    p_rule_name: input.ruleName,
    p_threshold: input.threshold ?? null,
    p_action_type: input.actionType ?? null,
    p_duration_hours: input.durationHours ?? null,
    p_enabled: input.enabled ?? null,
  });
  if (error) throw toAdminError(error, "Couldn't update the rule.");
}

export async function adminUpdateSafetyConfig(changes: {
  routeDeviationMeters?: number | null;
  stopThresholdSeconds?: number | null;
  safetyCheckTimeoutSeconds?: number | null;
  neverStartedMinutes?: number | null;
  exceededDurationMinutes?: number | null;
  notifyParticipantsOnSos?: boolean | null;
  sosRepeatWindowSeconds?: number | null;
  liveLocationRetentionHours?: number | null;
}): Promise<void> {
  const { error } = await supabase.rpc("admin_update_safety_config", {
    p_route_deviation_meters: changes.routeDeviationMeters ?? null,
    p_stop_threshold_seconds: changes.stopThresholdSeconds ?? null,
    p_safety_check_timeout_seconds: changes.safetyCheckTimeoutSeconds ?? null,
    p_never_started_minutes: changes.neverStartedMinutes ?? null,
    p_exceeded_duration_minutes: changes.exceededDurationMinutes ?? null,
    p_notify_participants_on_sos: changes.notifyParticipantsOnSos ?? null,
    p_sos_repeat_window_seconds: changes.sosRepeatWindowSeconds ?? null,
    p_live_location_retention_hours: changes.liveLocationRetentionHours ?? null,
  });
  if (error) throw toAdminError(error, "Couldn't update the safety config.");
}

export async function getSafetyConfig(): Promise<SafetyConfigRow> {
  const { data, error } = await supabase.rpc("get_safety_config");
  if (error) throw toAdminError(error, "Couldn't load the safety config.");
  return data as SafetyConfigRow;
}

export async function adminListMonitoringEvents(input: {
  level?: string | null;
  source?: string | null;
  page?: number;
  pageSize?: number;
}): Promise<MonitoringEventPage> {
  const { data, error } = await supabase.rpc("admin_list_monitoring_events", {
    p_level: input.level ?? null,
    p_source: input.source ?? null,
    p_page: input.page ?? 1,
    p_page_size: input.pageSize ?? 50,
  });
  if (error) throw toAdminError(error, "Couldn't load monitoring events.");
  return pageResult((data as MonitoringEventPage["items"]) ?? []);
}

export async function adminListReliabilityEvents(userId?: string | null): Promise<ReliabilityEventRow[]> {
  const { data, error } = await supabase.rpc("admin_list_reliability_events", {
    p_user_id: userId ?? null,
    p_page: 1,
    p_page_size: 100,
  });
  if (error) throw toAdminError(error, "Couldn't load reliability events.");
  return (data as ReliabilityEventRow[]) ?? [];
}

export async function adminListModerationActions(input: {
  userId?: string | null;
  status?: string | null;
  page?: number;
  pageSize?: number;
}): Promise<ModerationActionRow[]> {
  const { data, error } = await supabase.rpc("admin_list_moderation_actions", {
    p_user_id: input.userId ?? null,
    p_status: input.status ?? null,
    p_page: input.page ?? 1,
    p_page_size: input.pageSize ?? 50,
  });
  if (error) throw toAdminError(error, "Couldn't load moderation actions.");
  return (data as ModerationActionRow[]) ?? [];
}

// ── Reports ─────────────────────────────────────────────────────────

export async function adminListReports(input: {
  status?: string | null;
  page?: number;
  pageSize?: number;
}): Promise<ReportPage> {
  const { data, error } = await supabase.rpc("admin_list_reports", {
    p_status: input.status ?? null,
    p_page: input.page ?? 1,
    p_page_size: input.pageSize ?? 20,
  });
  if (error) throw toAdminError(error, "Couldn't load reports.");
  return pageResult((data as ReportPage["items"]) ?? []);
}

export async function adminReviewReport(reportId: string, confirm: boolean, note?: string | null): Promise<void> {
  const { error } = await supabase.rpc("admin_review_report", {
    p_report_id: reportId,
    p_confirm: confirm,
    p_note: note ?? null,
  });
  if (error) throw toAdminError(error, "Couldn't review the report.");
}

// ── Appeals ─────────────────────────────────────────────────────────

export async function adminListAppeals(input: {
  status?: string | null;
  page?: number;
  pageSize?: number;
}): Promise<AppealPage> {
  const { data, error } = await supabase.rpc("admin_list_appeals", {
    p_status: input.status ?? null,
    p_page: input.page ?? 1,
    p_page_size: input.pageSize ?? 20,
  });
  if (error) throw toAdminError(error, "Couldn't load appeals.");
  return pageResult((data as AppealPage["items"]) ?? []);
}

export async function adminDecideAppeal(appealId: string, approve: boolean, note?: string | null): Promise<void> {
  const { error } = await supabase.rpc("admin_decide_appeal", {
    p_appeal_id: appealId,
    p_approve: approve,
    p_note: note ?? null,
  });
  if (error) throw toAdminError(error, "Couldn't decide the appeal.");
}

// ── Audit / Team ────────────────────────────────────────────────────

export async function adminListAuditLog(input: {
  actorUserId?: string | null;
  action?: string | null;
  targetType?: string | null;
  from?: string | null;
  to?: string | null;
  page?: number;
  pageSize?: number;
}): Promise<AuditPage> {
  const { data, error } = await supabase.rpc("admin_list_audit_log", {
    p_actor_user_id: input.actorUserId ?? null,
    p_action: input.action ?? null,
    p_target_type: input.targetType ?? null,
    p_target_id: null,
    p_from: input.from ?? null,
    p_to: input.to ?? null,
    p_page: input.page ?? 1,
    p_page_size: input.pageSize ?? 50,
  });
  if (error) throw toAdminError(error, "Couldn't load the audit log.");
  return pageResult((data as AuditPage["items"]) ?? []);
}

export async function adminListAdminUsers(): Promise<AdminTeamRow[]> {
  const { data, error } = await supabase.rpc("admin_list_admin_users");
  if (error) throw toAdminError(error, "Couldn't load the admin team.");
  return (data as AdminTeamRow[]) ?? [];
}

export async function adminSetAdminRole(userId: string, roleName: string): Promise<void> {
  const { error } = await supabase.rpc("admin_set_admin_role", { p_user_id: userId, p_role_name: roleName });
  if (error) throw toAdminError(error, "Couldn't update the admin role.");
}

export async function adminRemoveAdmin(userId: string): Promise<void> {
  const { error } = await supabase.rpc("admin_remove_admin", { p_user_id: userId });
  if (error) throw toAdminError(error, "Couldn't remove the admin.");
}

export { isSupabaseConfigured };

// ── Admin domain types (mirrors covia-mobile/src/types/admin.ts) ────

export type AdminRole = "super_admin" | "admin" | "moderator" | "support_agent";

export type UserStatusFilter = "active" | "suspended" | "banned" | null;

export type AdminUserRow = {
  id: string;
  username: string | null;
  display_name: string | null;
  email: string;
  phone: string | null;
  verification_status: "Pending" | "In Review" | "Verified" | "Rejected";
  reliability_score: number;
  rating: string | null;
  total_completed_rides: number;
  total_cancelled_rides: number;
  is_banned: boolean;
  is_suspended: boolean;
  created_at: string;
  total_count: string;
};

export type AdminUserPage = { items: AdminUserRow[]; totalCount: number };

export type AdminUserProfile = {
  user_id: string;
  username: string | null;
  display_name: string | null;
  email: string;
  phone: string | null;
  home_city: string | null;
  bio: string | null;
  verification_status: "Pending" | "In Review" | "Verified" | "Rejected";
  is_government_id_verified: boolean;
  is_student_verified: boolean;
  is_banned: boolean;
  is_suspended: boolean;
  suspension_end_at: string | null;
  rating: number | null;
  reliability_score: number;
  total_completed_rides: number;
  total_cancelled_rides: number;
  created_at: string;
  latest_verification: {
    id: string;
    verification_type: "government_id" | "student";
    status: string;
    submitted_at: string;
    reviewed_at: string | null;
    rejection_reason: string | null;
  } | null;
  active_restrictions: number;
  reports_received_total: number;
  trust: Record<string, unknown>;
};

export type AdminUserRideHistoryRow = {
  ride_id: string;
  role: string;
  origin: string;
  destination: string;
  ride_status: string;
  departure_time: string;
  created_at: string;
  total_count: string;
};

export type AdminRideRow = {
  id: string;
  host_id: string;
  host_name: string | null;
  origin: string;
  destination: string;
  pickup_point: string | null;
  departure_time: string;
  ride_status: string;
  fare_mode: string;
  fixed_fare: string | null;
  total_seats: number;
  available_seats: number;
  passenger_count: string;
  is_student_only: boolean;
  is_women_only: boolean;
  created_at: string;
  total_count: string;
};

export type AdminRidePage = { items: AdminRideRow[]; totalCount: number };

export type AdminParticipant = {
  user_id: string;
  role: string;
  display_name: string | null;
  username: string | null;
  rating: number | null;
  reliability_score: number | null;
  joined_at: string;
  left_at: string | null;
};

export type RideTargetReport = {
  id: string;
  reporter_user_id: string;
  reporter_name: string | null;
  reason: string;
  details: string | null;
  evidence_refs: unknown;
  status: string;
  is_confirmed: boolean;
  created_at: string;
};

export type AdminRideDetails = {
  ride_id: string;
  origin: string;
  destination: string;
  pickup_point: string | null;
  destination_point: string | null;
  departure_time: string;
  estimated_arrival: string | null;
  ride_status: string;
  fare_mode: string;
  fixed_fare: string | null;
  total_seats: number;
  available_seats: number;
  is_student_only: boolean;
  is_women_only: boolean;
  notes: string | null;
  created_at: string;
  host: {
    user_id: string;
    display_name: string | null;
    username: string | null;
    email: string;
    phone: string | null;
    rating: number | null;
    reliability_score: number | null;
    verification_status: string;
  };
  pending_requests: number;
  participants: AdminParticipant[];
  reports: RideTargetReport[];
};

export type AdminTimelineEvent = {
  id: string;
  ride_id: string;
  event_type: string;
  actor_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type VerificationQueueRow = {
  id: string;
  user_id: string;
  user_email: string;
  user_display_name: string | null;
  verification_type: "government_id" | "student";
  government_id_kind: string | null;
  status: string;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
  front_document_url: string | null;
  back_document_url: string | null;
  selfie_url: string | null;
  student_card_url: string | null;
  university_email: string | null;
  created_at: string;
};

export type ReportRow = {
  id: string;
  reporter_user_id: string;
  reporter_name: string | null;
  target_type: string;
  target_user_id: string | null;
  target_user_name: string | null;
  target_ride_id: string | null;
  reason: string;
  details: string | null;
  evidence_refs: unknown;
  status: string;
  is_confirmed: boolean;
  resolution_note: string | null;
  created_at: string;
  total_count: string;
};

export type ReportPage = { items: ReportRow[]; totalCount: number };

export type AppealRow = {
  id: string;
  user_id: string;
  user_name: string | null;
  moderation_action_id: string;
  action_type: string;
  appeal_reason: string;
  status: string;
  moderator_note: string | null;
  decided_at: string | null;
  created_at: string;
  total_count: string;
};

export type AppealPage = { items: AppealRow[]; totalCount: number };

export type AuditRow = {
  id: string;
  actor_user_id: string;
  actor_name: string | null;
  actor_role: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  details: Record<string, unknown> | null;
  created_at: string;
  total_count: string;
};

export type AuditPage = { items: AuditRow[]; totalCount: number };

export type AdminTeamRow = {
  user_id: string;
  email: string;
  display_name: string | null;
  role_name: AdminRole;
  created_at: string;
};

export type ModerationRuleRow = {
  rule_name: string;
  threshold: number | null;
  action_type: string | null;
  duration_hours: number | null;
  severity: number;
  enabled: boolean;
  total_count: string;
};

export type MonitoringEventRow = {
  id: string;
  source: string;
  level: string;
  message: string;
  details: unknown;
  created_at: string;
  total_count: string;
};

export type MonitoringEventPage = { items: MonitoringEventRow[]; totalCount: number };

export type SafetyConfigRow = {
  id: boolean;
  route_deviation_meters: number;
  stop_threshold_seconds: number;
  safety_check_timeout_seconds: number;
  never_started_minutes: number;
  exceeded_duration_minutes: number;
  notify_participants_on_sos: boolean;
  sos_repeat_window_seconds: number;
  live_location_retention_hours: number;
  updated_at: string;
};

export type ModerationActionRow = {
  id: string;
  user_id: string;
  user_name: string | null;
  action_type: string;
  reason: string | null;
  status: string;
  source: string;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  total_count: string;
};

export type ReliabilityEventRow = {
  id: string;
  user_id: string;
  user_name: string | null;
  event_type: string;
  weight: number;
  reason: string | null;
  ride_id: string | null;
  created_at: string;
  total_count: string;
};

export type AnalyticsDaily = { day: string; registrations: number };

export type AnalyticsJson = {
  users: {
    overview: {
      total_users: number;
      verified_users: number;
      government_id_verified: number;
      student_verified: number;
      banned_users: number;
      suspended_users: number;
      new_users_7d: number;
      active_users_7d: number;
      active_users_30d: number;
    };
    daily_registrations: AnalyticsDaily[];
    weekly_retention: Array<{ cohort: string; signups: number; active_next_week: number; retention: number | null }>;
  };
  rides: {
    overview: {
      total_rides: number;
      published_rides: number;
      in_progress_rides: number;
      completed_rides: number;
      cancelled_rides: number;
      expired_rides: number;
      average_occupancy: number | null;
      rides_7d: number;
    };
    popular_routes: Array<{ origin: string; destination: string; rides: number }>;
  };
  safety: {
    safety_events: number;
    reports_submitted: number;
    reports_pending: number;
    reports_resolved: number;
    by_event_type: Array<{ event_type: string; count: number }>;
  };
  platform: {
    notifications_sent: number;
    notifications_unread: number;
    push_tokens: number;
    outbound_by_status: Record<string, number>;
    pending_outbound: number;
    database: {
      database_size_mb: number;
      active_connections: number;
      cache_hit_ratio: number | null;
      transaction_commit_rate: number | null;
    };
    storage: Array<{ bucket: string; objects: number; bytes: number }>;
    rpc_latency: Array<{ name: string; calls: number; avg_ms: number }> | null;
    largest_tables: Array<{ table: string; rows: number; size_mb: number }> | null;
  };
};

export type PlatformHealth = {
  status: "ok" | "degraded";
  checked_at: string;
  checks: HealthCheck[];
  database_size_mb: number;
};

export type HealthCheck = { name: string; ok: boolean; detail: string | null };