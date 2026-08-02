import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { supabase } from "./supabase";

/**
 * Realtime helper for the admin console.
 *
 * NOTE: the Phase 10 `admin_*` tables (verifications, reports, appeals, …)
 * are RLS-locked and are NOT part of the `supabase_realtime` publication,
 * so admin queues cannot stream straight off the wire. The published admin-
 * relevant table is `rides`, so we stream ride changes live and poll the
 * locked queues on an interval.
 */

export type RideRealtimePayload = RealtimePostgresChangesPayload<Record<string, unknown>>;

export function subscribeToRides(onChange: (payload: RideRealtimePayload) => void): () => void {
  const channel = supabase
    .channel("admin-rides")
    .on("postgres_changes", { event: "*", schema: "public", table: "rides" }, (payload) => {
      onChange(payload as RideRealtimePayload);
    })
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}