import { useSyncExternalStore } from "react";
import { supabase, isSupabaseConfigured } from "./supabase";
import { currentAdminRole, isAdmin } from "./adminApi";

/**
 * Supabase-backed auth store for the admin console.
 *
 * Replaces the previous mock store. `signIn` calls
 * `supabase.auth.signInWithPassword`, the session is persisted by the
 * Supabase client (localStorage) and restored on reload via `ensureSession`.
 *
 * Only accounts that pass the server-side `is_admin` + `has_role` RPCs
 * are allowed in — everyone else is rejected at sign-in and by the
 * `_app` route guard.
 */

export type AdminRole = "super_admin" | "admin" | "moderator" | "support_agent";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  avatarUrl?: string | null;
};

const ROLE_LABEL: Record<string, string> = {
  super_admin: "Super admin",
  admin: "Admin",
  moderator: "Moderator",
  support_agent: "Support agent",
};

let cached: AuthUser | null = null;
let initPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function setUser(user: AuthUser | null) {
  cached = user;
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): AuthUser | null {
  return cached;
}

/** Reactive hook — returns the signed-in admin or null. */
export function useAuth(): AuthUser | null {
  return useSyncExternalStore(subscribe, getSnapshot);
}

export function isAuthenticated(): boolean {
  return cached !== null;
}

export function requireAuth(): AuthUser {
  if (!cached) throw new Error("Not authenticated");
  return cached;
}

function friendlyAuthError(message: string): string {
  if (/invalid login credentials|invalid email/i.test(message)) {
    return "Email or password is incorrect.";
  }
  if (/email not confirmed/i.test(message)) {
    return "Please confirm your email address first.";
  }
  if (/rate limit/i.test(message)) {
    return "Too many attempts — please wait a moment and try again.";
  }
  return message;
}

/**
 * Builds the admin user from the current session. Returns null when the
 * signed-in account is not an administrator (or the session is missing).
 */
async function currentAdminUser(): Promise<AuthUser | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const [admin, role] = await Promise.all([isAdmin(), currentAdminRole()]);
  if (!admin || !role || !ROLE_LABEL[role]) return null;

  const meta = session.user.user_metadata as Record<string, unknown> | undefined;
  return {
    id: session.user.id,
    name: typeof meta?.full_name === "string" ? (meta.full_name as string) : (session.user.email ?? "Admin"),
    email: session.user.email ?? "",
    role: role as AdminRole,
    avatarUrl: null,
  };
}

/**
 * Restores the persisted session (idempotent). Call once before the app
 * renders guards; safe to call from multiple route `beforeLoad`s.
 */
export async function ensureSession(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session ? await currentAdminUser() : null);

      supabase.auth.onAuthStateChange((_event, nextSession) => {
        if (!nextSession) {
          setUser(null);
          return;
        }
        void currentAdminUser().then(setUser).catch(() => setUser(null));
      });
    })();
  }
  return initPromise;
}

export async function signIn(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { ok: false, error: "Supabase is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your env." };
  }
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) return { ok: false, error: friendlyAuthError(error.message) };

  const user = await currentAdminUser();
  if (!user) {
    await supabase.auth.signOut();
    return { ok: false, error: "Only Covia administrators can sign in to this console." };
  }
  setUser(user);
  return { ok: true };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
  setUser(null);
}