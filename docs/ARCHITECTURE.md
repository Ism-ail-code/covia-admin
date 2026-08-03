# Covia Admin Console — Architecture

## Overview

`covia-admin` is the web operations console for the Covia coordination
platform. It shares the live Supabase project with `covia-mobile` and never
touches shielded tables directly: every read/write flows through
security-definer `admin_*` RPCs that re-authorize the caller server-side.

Stack: Vite 8 · React 19 · TypeScript (strict) · Tailwind v4 · TanStack
Router 1.x (file-based) · TanStack Query 5.x · Radix · sonner · CVA.
Lint: oxlint. Build/typecheck: `npm run build` (runs `tsc -b` first).

## Layering

```
routes/               page components + createFileRoute({ beforeLoad, component })
  └── guarded by lib/route-guards.ts → per-permission RBAC
components/           shared UI primitives (ui/) + feature components
  ├── ui/             buttons, cards, tables, dialogs, pagination, skeletons…
  ├── verification/   secure document previews
  ├── settings/       safety config + moderation rules editors
  ├── monitoring/     realtime rides, health checks, event log
  └── layout/         app shell (sidebar nav, brand, user menu)
lib/                  typed RPC wrappers, auth, RBAC, realtime, docs, polling
```

## Data access

- `src/lib/supabase.ts` — single `createClient` (anon key, PKCE, localStorage
  session). Sensitive data is never fetched via the tables API; only RPCs.
- `src/lib/adminApi.ts` — one function per backend RPC. All return typed rows.
  Errors are normalized through `AdminError.toAdminError` (permission per
  `42501`, auth per `28000`).
- `src/lib/rbac.ts` + `src/lib/route-guards.ts` — UI gating only. The server
  (`require_permission` inside every RPC) is the source of truth.

## Auth

`src/lib/auth.ts` keeps a module-level store fed by `supabase.auth` events.
`ensureSession()` restores the persisted session once; `currentAdminUser()`
calls `is_admin()` + `current_admin_role()` and returns `null` for non-admins.
The `_app` layout route guards every page; child routes add a permission.

## RBAC model

Permissions mirror `admin_role_permissions`:

| Role            | Highlights                                                            |
| --------------- | --------------------------------------------------------------------- |
| super_admin     | everything, incl. admin.manage (team)                                 |
| admin           | everything except admin.manage                                        |
| moderator       | user/ride/verification/report/appeal.view, moderation.apply, config.view |
| support_agent   | user/ride/verification/report/appeal.view, config.view                |

## Realtime + polling

- `rides` is the only admin-relevant table in `supabase_realtime`.
  `subscribeToRides` streams INSERT/UPDATE/DELETE to the monitoring page;
  a 30s snapshot keeps the map primed.
- RLS-locked queues and probes (verifications, health, moderation actions,
  monitoring events) use TanStack Query `refetchInterval`.
- `usePollEvery(ms)` in `src/lib/poll.ts` damps polling while the tab is
  hidden to cut background RPC load.

## Key flows

- **Verification review** — `_app/verifications/$verificationId` lists all
  submissions (`admin_list_verifications`), renders signed-URL previews of
  documents (`verificationDocs.ts`, 5-min TTL + auto-refresh) and calls
  `admin_review_verification` for approve / reject / request-resubmission.
  Safe-file types are `image/jpeg`, `image/png`, `image/webp`.
- **Monitoring** — `_app/monitoring` shows platform health
  (`get_platform_health`), the realtime ride stream, monitoring events
  (`admin_list_monitoring_events`), open-SOS + error counts and recent
  moderation actions.
- **Settings** — `_app/settings` tabs: Safety (editable `safety_config` via
  `admin_update_safety_config`) and Moderation (`admin_update_moderation_rule`
  per rule) are live; Platform and Verification are future placeholders.
- **Model placeholders** — `_app/tickets` and `_app/standby` render
  read-only "coming soon" empty states (no backend table exists yet).

## Testing

Manual E2E coverage is tracked in `docs/ADMIN_TEST_REPORT.md`; the delivery
checklist is `docs/ADMIN_COMPLETION_REPORT.md`.

## Limitations / future work

- Support tickets and standby pool have no backend surface.
- Verification documents do not yet accept PDF uploads (bucket MIME
  allow-list); the client already renders PDFs if one exists.
- SMS/outbound-delivery queue health depends on edge functions / pg_cron
  writing `monitoring_events` via `record_monitoring_event()` (server-only).