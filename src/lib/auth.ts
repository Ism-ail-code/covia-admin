import { useSyncExternalStore } from "react";

/**
 * Mock auth store — NO backend.
 *
 * Swap point: replace `signIn` with a real Supabase `auth.signInWithPassword`
 * call and persist the session token instead of the user object. Every
 * component reads state through `useAuth()`/`isAuthenticated()` so the
 * swap requires no UI changes.
 */

export type AdminRole = "super_admin" | "admin" | "moderator" | "support_agent";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  avatarUrl?: string | null;
};

const STORAGE_KEY = "covia-admin.session";

/** Demo credentials (shown on the login screen). */
export const DEMO_CREDENTIALS = {
  email: "admin@covia.pk",
  password: "covia123",
};

const demoUser: AuthUser = {
  id: "u_admin_001",
  name: "Aisha Khan",
  email: DEMO_CREDENTIALS.email,
  role: "super_admin",
};

function readSession(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

let cached = readSession();
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function setSession(user: AuthUser | null) {
  cached = user;
  if (user) window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  else window.sessionStorage.removeItem(STORAGE_KEY);
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

/**
 * Mock login. Accepts the demo account, or any `@covia.pk` address
 * (so a casual preview "just works") — real role checks land with Supabase.
 */
export async function signIn(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  await new Promise((r) => setTimeout(r, 550));
  const normalized = email.trim().toLowerCase();
  const validPassword = password.length >= 6;
  const isDemo = normalized === DEMO_CREDENTIALS.email && password === DEMO_CREDENTIALS.password;
  const isCoviaStaff = /@covia\.pk$/i.test(normalized) && validPassword;
  if (!validPassword) return { ok: false, error: "Password must be at least 6 characters." };
  if (!isDemo && !isCoviaStaff) {
    return { ok: false, error: "Only Covia administrators can sign in." };
  }
  setSession(demoUser);
  return { ok: true };
}

export function signOut(): void {
  setSession(null);
}