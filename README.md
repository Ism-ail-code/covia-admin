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
- `src/lib/route-guards.ts` — `guardPermission(permission)` used in every
  `_app` route's `beforeLoad`; denied users land on `/access-denied`.
- `src/lib/auth.ts` — session store on top of `supabase.auth`; only admins
  get through `ensureSession` + the `_app` route guard.
- `src/lib/realtime.ts` — live refresh. `rides` is the only admin-relevant
  table in the `supabase_realtime` publication, so the monitoring page
  streams ride changes live; RLS-locked admin queues (verifications,
  reports, appeals) are polled on an interval instead.
- `src/lib/verificationDocs.ts` — signed URL creation for the private
  `verification-documents` bucket (5-minute TTL, auto-regenerated).
- `src/lib/poll.ts` — `usePollEvery`, which pauses polling intervals while
  the tab is hidden.

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

- **Support tickets** and **Standby pool** have no backend tables/RPCs yet,
  so they are shown as read-only *future feature* placeholder pages (no mock
  data, no hidden logic). They will be enabled when the backend surface lands.
- The private `verification-documents` bucket currently only accepts
  `image/jpeg`, `image/png` and `image/webp`; PDF previews are rendered when a
  document path is `.pdf`, but PDF uploads require broadening the bucket's
  allowed MIME types first.
- Do not run `tsc` against `dist`; the typecheck runs via `npm run build`.