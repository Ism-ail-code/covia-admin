# Covia Admin Console (covia-admin)

Web administration console for the Covia coordination platform. Built with Vite + React 19 + TypeScript + Tailwind v4 + TanStack Router/Query, and backed by the same live Supabase project as `covia-mobile`.

## Getting started

```bash
npm install
cp .env.example .env.local   # fills in your Supabase credentials
npm run dev                  # http://localhost:5173
```

Required environment (Vite):

```ini
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

The same project used by the mobile app. The anon key is safe to ship — all
sensitive reads/writes go through `admin_*` security-definer RPCs that
re-auth the caller and re-check RBAC server-side.

## Signing in

Use any account listed in the `admin_*` role tables (`admin_list_admin_users`).
Only administrators pass the guard; regular members are rejected with a clear
message. Test with an existing admin account, e.g. `aalikhanpubg@gmail.com`.

## How the console talks to the backend

- `src/lib/supabase.ts` — the single Supabase client (localStorage session, PKCE).
- `src/lib/adminApi.ts` — typed wrappers over the Phase 10 `admin_*` RPCs
  (migrations 0027–0035). Mirrors `covia-mobile/src/services/admin.ts`.
- `src/lib/rbac.ts` — client-side mirror of `admin_role_permissions` to hide
  actions a signed-in role can't take (`can(role, permission)`).
- `src/lib/auth.ts` — session store on top of `supabase.auth`; only admins
  get through `ensureSession` + the `_app` route guard.
- `src/lib/realtime.ts` — live refresh. `rides` is the only admin-relevant
  table in the `supabase_realtime` publication, so dashboard analytics stream
  live on ride changes; RLS-locked admin queues (verifications, reports,
  appeals) are polled on an interval instead.

Error contract: RPC failures are mapped to friendly messages
(`42501` → permission, `28000` → not signed in).

## Scripts

```bash
npm run dev     # dev server
npm run gen     # regenerate the TanStack Router route tree
npm run build   # type-check + production build
npm run lint    # oxlint
npm run preview # preview the production build
```

## Notes

- Pages still browsing in-memory mock data (`src/data/mock.ts`,
  `src/lib/api.ts`, `src/lib/actions.ts`) are documented as such in the UI and
  are the next swap candidates once Phase 1 (auth/RBAC/dashboard/realtime) is
  signed off.
- Do not run `tsc` against `dist`; the typecheck runs via `npm run build`.