# Implementation Phase 2 - Technician Workspace (embedded in the ERP)

The field-staff side of Gabfix: how a cleaner or technician sees jobs, travels, works, finishes, confirms cash and shares location, **built inside the existing ERP (`admin/`) rather than as a separate system**. It answers Q44 of the Live Tracking Addendum (LT) and extends S4 (backend), S5 (release) and the Dashboard Addendum. It repeats none of them. Written 2026-11-21 against the repo snapshot; nothing was compiled or run, and external APIs marked **confirm** must be checked in the step that uses them.

"Technician" below means both cleaners and technicians (S4 `cleaners.kind`).

---

## 1. What I checked in the `admin/` project

| Fact | Where | Consequence |
|---|---|---|
| Vite 7 + React 19 + TypeScript; **only** `react` and `react-dom` as dependencies (no router, no data library, no Supabase client) | `admin/package.json` | Technician pages follow the same pattern: hash routing, plain React state. Add only what Section 13 lists |
| Navigation is a `page` state synced to `window.location.hash`; page ids are a union `PageId` | `App.tsx`, `types.ts` | Add a **separate technician shell** with its own routes rather than more sidebar pages |
| Roles are `'admin' \| 'operations'`; operations cannot open Settings | `lib/auth.ts` | Add a third role `'technician'` with a far narrower view |
| **Demo accounts and passwords are hard-coded in the client bundle** | `lib/auth.ts` (`ACCOUNTS`) | Must be removed before any real data is used (Section 10) |
| All data is in-memory mock arrays (`data.ts`, 567 lines) with app-level state | `App.tsx` | Technician actions go through the same `Booking`, `Cleaner`, `CashCollection` types until the backend is wired |
| `Booking` has `area`; `Cleaner` has `area`, `cashDue`, `cashConfirmedOn`, `cashRemitted`, `cashDispute`; statuses are `Pending / Confirmed / In progress / Completed / Cancelled` | `types.ts` | Cash fields already exist (cleaner confirms, ops remits, disputes). `area` must go (Section 9) |
| Existing modules: Overview, Bookings (with `AssignCleanerDialog`), Payments, Cash, Customers, Cleaners, Services, Promos, Reports, Settings | `admin/src/pages` | The technician workspace reuses these records; it adds screens, not a second system |
| Plan: cash payments are confirmed **only by the cleaner in the partner app**; the customer cannot mark cash paid | `Gabfix_App_Ui_2.md` (cash section) | The workspace is that "partner app" (Section 6.5) |

---

## 2. What "embedded in the ERP" means here, and one hard limit

**Embedded =** one backend (S4 Supabase), one login system, one role model, one data set (bookings, cash, media, tracking), one admin view of everything, one release and monitoring process. No second database, no separate admin for technicians.

**Delivery surface (decision Q49):**

| Surface | What it is | Good for | Limit |
|---|---|---|---|
| **A. Technician workspace in the ERP (default)** | A mobile-first, installable (PWA) part of `admin/` at `#/tech/...` for role `technician` | Job list, job details, trip and work status, checklists and photos, cash confirmation, availability | **A web page cannot reliably send location once it is in the background or the screen is off** |
| B. Native companion (later, only if needed) | A tiny Expo app that signs in to the same ERP backend and only sends location and push | Reliable background location while the technician uses a navigation app | Separate store listing and background-location declaration (LT Section 5) |

The hard limit matters because technicians will normally switch to a navigation app during a trip. With surface A alone, live location will pause then. **Ship A first** (it is what you asked for and delivers everything except guaranteed background tracking), run a pilot, and add B only if the pilot shows gaps (acceptance test T9). Surface A mitigations: the Screen Wake Lock API to keep the screen on during a trip (**confirm** support and battery cost), a visible "Location sharing paused, open Gabfix" banner, and `last seen` handling already specified in LT M4.

---

## 3. Roles and access

| Role | Sees | Cannot |
|---|---|---|
| `admin` | Everything, including Settings | |
| `operations` | All modules except Settings | Change roles, rates |
| `technician` (new) | **Only** the technician workspace and **only their own** jobs, cash records and profile | Open any ERP module, see other technicians, see other customers' data, change prices or assignments |

Rules:

- Role lives in the Supabase user's `app_metadata.role` and is **enforced by RLS**, never only by hiding screens (S4 2.2).
- A technician row in `cleaners` links to one `auth.users` id (`cleaners.user_id`, new, unique). A deactivated technician (`active = false`) is signed out and cannot sign in.
- Technicians are **invited** by an admin or operations user (Section 6.2). Self sign-up does not exist.
- Customer phone and exact address are visible to the technician **only for jobs assigned to them in status Confirmed to In progress**; they disappear on `Completed` (the call and navigation buttons stop working). Job history keeps the service name, date, amount and the technician's own notes.

---

## 4. Data model (extends S4 2.1 and LT 4.1)

| Table or change | Columns | Notes |
|---|---|---|
| `cleaners` (extend) | `user_id`, `phone`, `languages`, `verified`, `available`, `skills text[]`, `locality_label` | Drops `area`. `skills` replaces area-based matching (Section 9) |
| `technician_invites` | `id`, `email_or_phone`, `cleaner_id`, `token_hash`, `expires_at`, `used_at` | One-time link, 72 h expiry |
| `job_events` | `id`, `booking_id`, `cleaner_id`, `event` (`'accepted'\|'declined'\|'trip_started'\|'arrived'\|'work_started'\|'completed'\|'cash_confirmed'\|'issue_reported'`), `at`, `lat`, `lng`, `note`, `idempotency_key unique` | An append-only audit trail; the idempotency key makes retries from a flaky network safe |
| `job_checklists` | `service_id`, `items jsonb` | Admin-defined per service/category, same pattern as the scope forms (S3 Section 3); versioned |
| `job_checklist_answers` | `booking_id`, `schema_version`, `answers jsonb`, `completed_at` | Snapshot like `scope_snapshot` |
| `job_media` | `id`, `booking_id`, `cleaner_id`, `phase` (`'before'\|'after'\|'issue'`), `path`, `bytes`, `captured_at` | Reuses the S4 Section 3 upload flow; bucket path `booking-media/{customer}/{booking}/tech/...` |
| `cash_collections` (extend, matches `CashCollection`) | `id`, `cleaner_id`, `period`, `amount_due`, `confirmed_on`, `remitted bool`, `remitted_on`, `dispute text` | Already modelled in `types.ts`; move to the database |
| `cash_receipts` | `booking_id` unique, `cleaner_id`, `amount_ugx`, `confirmed_at` | One per cash job; the source of the customer's "Paid" state (S4 `payments`) |
| `time_off` | `cleaner_id`, `from`, `to`, `reason` | Used by assignment (Section 6.3) |

**Status mapping (one source of truth, server side):**

| ERP `BookingStatus` | `tracking_state.status` (LT 4.1) | Set by |
|---|---|---|
| Pending | none | Booking created |
| Confirmed | `confirmed` | Assigned and accepted |
| In progress | `on_the_way`, then `in_progress` | Technician: Start trip, then Start work |
| Completed | `completed` | Technician: Complete (after checklist and, for cash, confirmation) |
| Cancelled | `cancelled` | Customer or operations |

Customer-facing `upcoming/completed/cancelled` (S4) stays derived from these.

---

## 5. Screens (technician shell, mobile first)

Use the ERP's own styles (`styles.css`), tokens and `ui.tsx`/`Icon.tsx` components; **no new colours, radii or spacing values**. Layout: a single column, large touch targets, a bottom tab bar (Today, Jobs, Cash, Me), no sidebar.

| Route | Screen | Content |
|---|---|---|
| `#/tech` | **Today** | Header with name, an **Available** switch, and today's jobs as cards (time, service, locality, status chip). Empty state: "No jobs today". Pull to refresh; refresh also on focus |
| `#/tech/job/{id}` | **Job detail** | Customer first name and (while active) phone buttons **Call** and **WhatsApp** (support rules from S1 D18 apply to deep links), address text and **Navigate** (opens the maps app with the destination coordinates; **confirm** the universal link format), the **job scope** from `scope_snapshot` rendered with the same form engine in read-only mode (S3 Section 4.4), customer's photos and videos (tap to open), notes, price and payment method (Cash shows "Collect UGX X") |
| (same screen) | **Primary action button**, one at a time | Accept or Decline (Pending), **Start trip** (Confirmed), **I have arrived**, **Start work**, **Complete job** with the rules in Section 7 |
| `#/tech/job/{id}/checklist` | **Checklist** | Items from `job_checklists`; required items block completion; before and after photo slots (same media sheet pattern as the customer app: up to 10 items per phase, 2 videos max, 30 s, 25 MB) |
| `#/tech/job/{id}/cash` | **Confirm cash** | Amount to collect (read-only), a field "Amount received" (defaults to the amount), **Confirm received**; a difference requires a note and creates a dispute for operations (matches `cashDispute`) |
| `#/tech/jobs` | **Jobs** | Tabs Upcoming, Completed; search by booking code |
| `#/tech/cash` | **Cash** | Balance owed to Gabfix, confirmed collections, remitted vs outstanding, disputes; read-only (operations records remittance) |
| `#/tech/me` | **Me** | Profile (name, phone, languages, skills; edit only phone and availability), notification settings, install-app prompt, sign out, support contacts from `support.ts` |

Notes: all state changes use the idempotency key (Section 12); each action shows a confirm sheet bottom pinned with no gap (same rule as app item 6); the active field stays above the keyboard on notes inputs (app item 8 equivalent in CSS: `scrollIntoView` plus `visualViewport` handling; **confirm** on iOS Safari).

---

## 6. ERP side (dispatcher and admin)

### 6.1 Bookings and assignment
Extend `AssignCleanerDialog.tsx` (65 lines): list technicians who are `verified`, `available`, not in `time_off`, matching the service `skills`, and **not double-booked at that time**; show workload today and, once coordinates exist, straight-line distance to the customer. Assigning sets `cleaner_id` and `assigned_at` and calls `notify` (S4 5.5). The technician must **Accept** within a window (Q50 default 15 minutes); a decline or timeout returns the booking to the Unassigned list with an alert.

### 6.2 Cleaners page (technician management)
Add: **Invite technician** (creates `technician_invites`, shows the one-time link and sends it by WhatsApp/email now; SMS is deferred with the provider decision), **Verify**, **Deactivate** (also revokes sessions), **Reset device**, skills and availability editing, document uploads (ID check record, no ID numbers stored in the ERP, S5 Section 4 rules).

### 6.3 Live map (new `#/live` page, roles admin and operations)
Shows all `on_the_way` and `in_progress` technicians on one map with the destination pins, status chips and "last seen" age, refreshed every 10 s from the same tracking data as the customer app. Uses the **Google Maps JavaScript API** with a **separate key restricted by HTTP referrer** to the ERP origin (**confirm**; never reuse the mobile key). Click a marker opens the booking.

### 6.4 Alerts panel (Overview)
Technician has not started a trip within 15 minutes of the scheduled time; no location update for 3 minutes during a trip; job running over its booked hours by more than 30 minutes; unconfirmed cash older than 24 h; declines and timeouts.

### 6.5 Cash module (existing `pages/Cash.tsx`, 318 lines)
Becomes database backed. Operations sees technicians' confirmed collections, marks **remitted**, resolves **disputes**. The technician's confirmation (Section 5) is the only way a cash booking becomes **Paid**; the customer app only displays "Pay UGX X in cash" (`Gabfix_App_Ui_2.md`).

---

## 7. Job lifecycle and rules

| Action | Allowed when | Side effects |
|---|---|---|
| Accept | Booking Pending or reassigned to this technician | Status Confirmed, `job_events`, customer notification (S1 12.3 push and in-app) |
| Decline | Before Start trip | Booking returns to Unassigned, alert to operations |
| Start trip | Confirmed, scheduled date is today (grace 2 h either side) | `on_the_way`, location sharing starts (Section 8), customer push **critical** |
| I have arrived | After Start trip; within about 300 m of the destination **or** with a reason when GPS is poor | Customer notified; location sharing continues |
| Start work | After arrival | `in_progress`, records start time |
| Complete job | After Start work; checklist required items done; **at least one After photo** (configurable); for cash jobs, cash confirmed first | `completed`, location row deleted (LT 6), customer rating prompt (S1 12.4), receipt available (S1 11.1) |
| Report issue | Any active status | Event with photo and note; alert to operations; the customer is not notified automatically |

The technician cannot edit price, scope or the customer's details. Changes to scope or extra work go through operations, who update the booking (and the customer sees the revised total).

---

## 8. Location from the workspace (uses LT 4.2 endpoints, unchanged)

1. Sharing begins only when the technician taps **Start trip** and grants browser location permission (the first-run screen explains it is shared with the customer only during active jobs).
2. The page calls `navigator.geolocation.watchPosition` with high accuracy; send to `POST /technician/location` every ~10 s or after about 25 m (LT 5 rules). Keep the latest point only; never replay history.
3. Hold a Screen Wake Lock during the trip (**confirm**); if the page is hidden, stop silently and on return show "Location sharing paused" with a Resume button, then send one fresh point.
4. Stop on **Arrived** (customer map stays on destination), or on Complete, Decline, sign-out or Stop sharing.
5. If the pilot shows frequent gaps (T9), move this single module to the native companion (surface B) without changing the server contract.

---

## 9. Removing Service Area from the ERP (consistency with S1 Section 15)

| Item | Change |
|---|---|
| `Booking.area`, `Cleaner.area` | Replace with `locality` (free text from the address) and drop from filters |
| Assignment | Match on `skills`, availability and distance, not area |
| `data.ts`, Customers, Overview "by area" widgets | Replace with "by locality" derived from the address text, or remove |
| Reports | Remove area dimension; keep service and technician dimensions |
| Technician invite | No area field |

---

## 10. Security and privacy

- **Delete the client-side `ACCOUNTS` array and passwords in `lib/auth.ts`** and sign in through Supabase Auth; sessions in memory plus refresh handled by the SDK, not `sessionStorage` copies of a user object.
- RLS first (S4 2.2): a technician can `select` only bookings where `cleaner_id` is theirs and status is active, insert `job_events` for those, and write only their own `technician_locations` row.
- Mask customer contact outside active jobs (Section 3); no screenshots of PII in logs; error reports must not include phone or address (S5 Section 6).
- Audit: `job_events` is append-only; every operations change to an assignment, cash record or dispute writes an `audit_log` row (`who`, `what`, `before`, `after`, `at`).
- Rate limits and device rules: five failed sign-ins per ten minutes locks the account for 15 minutes; one active session per technician device (S4 5.6); operations can force sign-out.
- Technician consent text for location sharing and photo capture is part of the invite flow and is stored with a timestamp.

---

## 11. Offline and reliability (surface A)

- Installable PWA: web manifest and service worker (`vite-plugin-pwa`, **confirm** compatibility with Vite 7); cache the app shell and the **last loaded Today list** for read-only offline viewing.
- Status changes and cash confirmations made offline go into a **local queue** with idempotency keys and send in order when online; a queued action shows "Waiting to send". The server rejects out-of-order transitions with a clear error (the screen then refreshes).
- Photos queue the same way and upload after the booking action succeeds, never blocking a status change (same principle as S1 3.7).
- Web push for new assignments (**confirm** the Web Push setup and that iOS requires the installed PWA); in-app list and an unread badge are the fallback. SMS fallback is deferred with the provider decision.

---

## 12. API additions (extends S4 Section 4 and LT 4.2)

| Path | Role | Purpose |
|---|---|---|
| `GET /technician/jobs?from=&to=` | technician | Own jobs (RLS-filtered) with the fields in Section 5 |
| `POST /technician/booking/{id}/accept`, `/decline` | technician | Section 7 |
| `POST /technician/booking/{id}/status` | technician | `trip_started`, `arrived`, `work_started`, `completed` (LT 4.2, now with the checks in Section 7) |
| `POST /technician/booking/{id}/checklist` | technician | Save answers |
| `POST /technician/booking/{id}/media` and `/complete` | technician | Same protocol as S4 Section 3.2 |
| `POST /technician/booking/{id}/cash-confirm` | technician | Cash received (reconcile with the path named in `Gabfix_App_Ui_2.md` when implementing) |
| `GET /technician/cash` | technician | Own collections |
| `POST /admin/technicians/invite`, `PATCH /admin/technicians/{id}` | admin, operations | Section 6.2 |
| `POST /admin/bookings/{id}/assign` | admin, operations | Section 6.1 |
| `POST /admin/cash/{id}/remit`, `/resolve-dispute` | operations | Section 6.5 |

All mutating calls carry `Idempotency-Key`; the server stores the key in `job_events` and returns the original result on retry.

---

## 13. Build order and files

| # | Task | Files |
|---|---|---|
| 1 | Replace demo auth with Supabase Auth; add role `technician`; sign-in screen variant | `lib/auth.ts`, `Login.tsx`, `main.tsx`; add `@supabase/supabase-js` |
| 2 | Remove `area` from types and mock data (Section 9) | `types.ts`, `data.ts`, pages using area |
| 3 | Technician shell and routes | new `admin/src/tech/TechShell.tsx`, `tech/routes.ts`; extend `PageId`/hash parsing in `App.tsx` |
| 4 | Today and Job detail (read-only) on mock data | `tech/Today.tsx`, `tech/JobDetail.tsx` |
| 5 | Lifecycle actions and `job_events` with the idempotent queue | `tech/actions.ts`, `lib/queue.ts` |
| 6 | Checklist, media capture and upload (reuse the customer-app limits) | `tech/Checklist.tsx`, `tech/MediaSheet.tsx` |
| 7 | Cash confirm and Cash page wiring | `tech/CashConfirm.tsx`, `pages/Cash.tsx` |
| 8 | Dispatch: extend assignment, accept/decline timer, alerts | `AssignCleanerDialog.tsx`, `pages/Bookings.tsx`, `pages/Overview.tsx` |
| 9 | Technician management (invite, verify, deactivate) | `pages/Cleaners.tsx` |
| 10 | Location sender (Section 8) | `tech/useLocationShare.ts` |
| 11 | Live map page | `pages/Live.tsx`; Google Maps JS key (referrer-restricted) |
| 12 | PWA, offline queue, web push | `vite.config.ts`, service worker, manifest |
| 13 | Backend cutover per S4 Section 7, plus RLS tests | Supabase migrations |

`npm run typecheck` (the project's own `tsc -b --pretty false` script) runs after each step; add Vitest for the pure logic (status transitions, idempotent queue, cash difference rule) if you accept one new dev dependency.

---

## 14. Tests and acceptance

| # | Check | Expectation |
|---|---|---|
| T1 | Technician signs in | Sees only the workspace; ERP URLs redirect back |
| T2 | Technician requests another technician's job by id | Denied by RLS (not just hidden) |
| T3 | Offline Start trip then reconnect | One `trip_started` event despite retries (idempotency key) |
| T4 | Complete without required checklist item or After photo | Blocked with a clear message |
| T5 | Cash job: confirm a different amount | Dispute created; operations alerted; booking not marked Paid until resolved |
| T6 | Decline or 15 minute timeout | Booking Unassigned; alert shown |
| T7 | After Completed | Customer phone and address no longer visible to the technician; location row deleted |
| T8 | Operations deactivates a technician | Signed out on next request; assigned future jobs flagged for reassignment |
| T9 | Pilot: Start trip, switch to a navigation app for 10 minutes | Record how often location pauses; decide whether surface B is needed |
| T10 | Customer app Track screen | Marker moves from the workspace's location within 10 s; "Last seen" works when paused |
| T11 | No `area` field anywhere in the ERP | Searches in Bookings, Customers and Cleaners still work |
| T12 | `npm run typecheck` | Passes |

---

## 15. Open questions (defaults adopted)

| Q | Question | Default |
|---|---|---|
| Q49 | Surface for technicians | A (ERP workspace) first; B only if the pilot needs it |
| Q50 | Accept window for an assignment | 15 minutes |
| Q51 | Require an After photo to complete | **Yes**, configurable per service |
| Q52 | Technician sees customer's full address before accepting | **No**, locality only until accepted |
| Q53 | Language of the workspace | English; the `languages` field exists for later |
| Q54 | Technician payout or earnings screen | **Out of scope**; the Cash tab shows only cash owed to Gabfix. Decide payouts with finance |
| Q55 | WhatsApp or email for invites until SMS is decided | WhatsApp link plus email |

Still deferred by you: SMS provider (S4 Q30) and mobile money gateway (S4 Q31); neither blocks this guide.

---

## 16. Hand-off summary

- **Settled:** the technician workspace is a role in the existing ERP with its own mobile shell, one backend, RLS-enforced access, an idempotent action queue, cash confirmation as the only way cash jobs become Paid, and the location contract of LT 4.2.
- **Changes to existing ERP code:** remove demo accounts, add the `technician` role, drop `area`, extend `AssignCleanerDialog`, make the Cash and Cleaners pages database backed, add `#/tech` routes and a `#/live` page.
- **Known limit:** a web page cannot guarantee background location; surface B is the planned fallback (Section 2, T9).
- **Depends on:** S4 Supabase and `notify`, LT endpoints and map, S3 form engine (read-only scope view), S1 12.3 and 12.4 for customer notifications and ratings.
- **Add to the Index:** under "After the screens", plus the Q49 to Q55 defaults.
