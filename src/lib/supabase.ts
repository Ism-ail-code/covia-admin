/**
 * Supabase client — the single authenticated gateway for the admin console.
 *
 * Configuration comes from Vite environment variables:
 *   VITE_SUPABASE_URL      — project URL (safe to expose)
 *   VITE_SUPABASE_ANON_KEY — anon key (safe to expose)
 *
 * Sessions are persisted to localStorage so the admin stays signed in
 * across reloads. Access tokens auto-refresh while the tab is open.
 */

import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";
export const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? "";

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY && !SUPABASE_URL.includes("YOUR_PROJECT_REF"),
);

export const supabase = createClient(
  SUPABASE_URL || "https://placeholder.supabase.co",
  SUPABASE_ANON_KEY || "placeholder",
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  },
);