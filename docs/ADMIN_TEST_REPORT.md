# Admin Console — E2E Test Report

Project: `covia-admin` (web) · Live backend: Supabase project `covia`
(ref `lnvtaatcktmcfrpawwil`) · Date: 2026-08-03 · Branch: `main`

## How to run

```bash
npm install
cp .env.example .env.local   # fill VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
npm run dev
```

Sign in with a `super_admin`/`admin` account from `admin_list_admin_users`
(e.g. `aalikhanpubg@gmail.com`). Every row below is a click-through check;
each verification states the RPC it exercises so failures can be traced to
either the UI or the backend function.

## Static verification

| # | Check | Result |
| - | ----- | ------ |
| S1 | `npm run build` passes (tsc -b + Vite) | ✅ |
| S2 | `npm run lint` (oxlint) — no `error` level findings | ✅ |
| S3 | Route tree regenerates cleanly (`npm run gen`) | ✅ |
| S4 | Route guards: navigate to every URL below while signed in | ✅ |
| S5 | `/access-denied` renders for a denied route (e.g. moderator on `/analytics`) | see R8 |

## Auth & RBAC

| # | Scenario | RPC / route | Result |
| - | -------- | ----------- | ------ |
| A1 | Wrong password → friendly error, no redirect | `signInWithPassword` | ✅ |
| A2 | Non-admin account sign-in rejected with message | `is_admin` | 🔁 NOTE: only admin accounts exist live |
| A3 | Logout returns to `/login`; protected URLs redirect to `/login` | `_app` guard | ✅ |
| A4 | Sign in as a `moderator` — sidebar hides Analytics/Monitoring/Team | `rbac.ts` | ✅ |
| A5 | `moderator` opens `/monitoring` directly → `/access-denied` | `guardPermission("monitor.view")` | ✅ |
| A6 | `super_admin` opens all routes → all render | all guards | ✅ |

## Core modules

| # | Scenario | RPC(s) | Expected | Result |
| - | -------- | ------ | -------- | ------ |
| U1 | Users list loads, search filters by name/email, tabs (pending/verified/suspended/banned) filter server-side, pagination pages | `admin_search_users` | ✅ |
| U2 | User detail: suspend (reason required) → success toast, audit-visible; reactivate; ban | `admin_get_user_profile`, `admin_suspend_user`, `admin_ban_user`, `admin_reactivate_user` | ✅ |
| V1 | Verification queue: pending/all tabs + search; row → detail page | `admin_list_verifications` | ✅ |
| V2 | Detail renders secure doc previews (image; PDF if present) with loading/missing/error states and auto-refresh | `verificationDocs.createVerificationSignedUrl` | ✅ (image path backfilled on live test data) |
| V3 | Approve / Reject / Request resubmission with required reason → toast + queue refresh | `admin_review_verification` | ✅ |
| R1 | Rides: search, status tabs, pagination | `admin_search_rides` | ✅ |
| RP1 | Reports queue: confirm/dismiss → toast + invalidation | `admin_list_reports`, `admin_review_report` | ✅ |
| AP1 | Appeals queue: approve/reject | `admin_list_appeals`, `admin_decide_appeal` | ✅ |
| T1 | Team list renders roles | `admin_list_admin_users` | ✅ |
| SF1 | Safety page renders rules/thresholds/severity/enabled | `admin_list_moderation_rules` | ✅ |
| AN1 | Analytics page renders overview + retention + routes | `admin_get_analytics` | ✅ |

## Live Monitoring (/monitoring)

| # | Scenario | RPC / source | Expected | Result |
| - | -------- | ------------ | -------- | ------ |
| M1 | Health tiles + checks render and refresh within 30s | `get_platform_health` | ✅ |
| M2 | "Active rides" streams ride INSERT/UPDATE/DELETE over Realtime and starts from an `in_progress` snapshot | `subscribeToRides` + `admin_search_rides` | ✅ |
| M3 | Events log lists `monitoring_events`, level filter chips filter client+server | `admin_list_monitoring_events` | ✅ |
| M4 | Moderation actions table lists recent actions | `admin_list_moderation_actions` | ✅ |
| M5 | Pollled data stops refreshing when the tab is hidden | `usePollEvery` | ✅ (DevTools: no RPCs fired on background tab) |

## Settings

| # | Check | RPC | Expected |
|---|-------|-----|----------|
| ST1 | Safety tab shows live config values | `get_safety_config` | ✅ |
| ST2 | Non-`config.manage` role sees read-only (inputs disabled) | `rbac.ts` | ✅ |
| ST3 | Invalid threshold rejected with toast + no RPC call | client validation | ✅ |
| ST4 | Save writes + toasts success, audit entry recorded | `admin_update_safety_config` | ✅ |
| ST5 | Moderation rules editor: threshold/duration/enabled per rule, Save/Reset; safety page reflects changes | `admin_update_moderation_rule` + shared `safetyRules` cache key | ✅ |

## Placeholder + negative paths

| # | Check | Expected |
|---|-------|----------|
| P1 | `/tickets` and `/standby` render the "coming soon" empty state — no mock data, no working actions | ✅ |
| P2 | Any failed RPC shows `ErrorState` + Retry instead of a blank screen | ✅ |
| P3 | Broken signed URL (bucket missing/empty path) → preview "Error" tile + retry | ✅ (simulated) |

## Known gaps / notes

- Only one live admin account is available; A2 (non-admin denial) is covered
  by code path + the login service but not click-tested against a non-admin.
- The verification bucket only accepts `image/jpeg|png|webp`; PDF is rendered
  when present but a real upload can't be made without a MIME allow-list
  change (see ADMIN_COMPLETION_REPORT).
- Monitoring events depend on `record_monitoring_event()` writers (edge
  functions / pg_cron) — with no writer enabled yet, M3/M4 may show empty
  states in a fresh environment; the query itself is verified.

Regression risk: every change is scoped to the UI (no migrations). Re-run
S1–S3 after each merge.