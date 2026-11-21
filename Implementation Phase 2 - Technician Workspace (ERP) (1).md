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
| `GET /g/{token}`, `GET /g/{token}/receipt.pdf`, `POST /g/{token}/feedback` | public (token) | Guest job-complete page, Section 17.5 |
| `POST /admin/guest-links/{bookingId}/revoke`, `/resend` | operations | Section 17.6 |

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
| 14 | Guest job-complete page and App-only fallback (Section 17), served by the Express SSR module (Section 18) | `modules/guest/*`, `guest_links` migration, scheduled clean-up |

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
| T13 | Guest page checks | All cases in Section 17.7 pass |

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

Guest page questions Q56 to Q60 are in Section 17.8 and the Express module defaults Q61 to Q63 are in Section 18.8.

Still deferred by you: SMS provider (S4 Q30) and mobile money gateway (S4 Q31); neither blocks this guide.

---

## 16. Hand-off summary

- **Settled:** the technician workspace is a role in the existing ERP with its own mobile shell, one backend, RLS-enforced access, an idempotent action queue, cash confirmation as the only way cash jobs become Paid, and the location contract of LT 4.2.
- **Changes to existing ERP code:** remove demo accounts, add the `technician` role, drop `area`, extend `AssignCleanerDialog`, make the Cash and Cleaners pages database backed, add `#/tech` routes and a `#/live` page.
- **Known limit:** a web page cannot guarantee background location; surface B is the planned fallback (Section 2, T9).
- **Depends on:** S4 Supabase and `notify`, LT endpoints and map, S3 form engine (read-only scope view), S1 12.3 and 12.4 for customer notifications and ratings.
- **Add to the Index:** under "After the screens", plus the Q49 to Q55 defaults.

---

## 17. Guest job-complete page (public link after a job)

Added 2026-11-21. When a job is completed, a customer **without the app** gets a link to a small public page. Customers who have the app do not get the link; they get the in-app receipt and the in-app rating prompt (S1 11.1, S1 12.4). Nothing here is compiled or run; items marked **confirm** need checking when built.

### 17.1 What the page does (three jobs, one visit)

| Block | Behaviour |
|---|---|
| **Download receipt** | Button that downloads the receipt PDF for this one booking (generated on the server, so it works without the app) |
| **Give feedback** | One short form: job rating (1 to 5, optional), technician rating (1 to 5, optional), comment (optional), same fields as the in-app rating (S1 12.4). Submitting is allowed **once** |
| **Get the app** | Store buttons (Google Play now; App Store when it exists, S5 Section 5) and a line saying receipts and bookings are kept there |

The page shows the minimum: first name, service name, date, amount and payment status. **No full address, no phone number.** After feedback is submitted the form is replaced by "Thanks, your feedback is received"; the receipt and app buttons stay until the link ends.

### 17.2 Who gets the link

| Customer | Gets |
|---|---|
| Has the app and is signed in | In-app receipt and rating prompt only; **no link** |
| Guest (booked by phone, through operations, or without the app) | The link, sent by WhatsApp or email when the technician taps **Complete job** (Section 7). SMS is deferred with the provider decision (S4 Q30) |

For a cash job the link is created only **after** the technician confirms cash received (Section 7), so the receipt always matches a paid booking.

### 17.3 Link lifetime: the link never "dies", it changes into a get-the-app page

Updated 2026-11-21 at your request. The link is **permanent as an address** but **not permanent as a view of personal data**. It has two states:

| State | When | What the page shows |
|---|---|---|
| **Active** | From creation until feedback is submitted **or** 30 days pass (default Q56), whichever is first | Receipt download, the one-time feedback form, and the app store buttons (17.1) |
| **App-only** | After that, and for revoked links | **Download the app** page: store buttons, a short line ("Your receipts, bookings and support are in the Gabfix app"), and the support contacts. **No receipt, no name, no amounts, no booking details** |

So a customer who returns to the link months later is sent straight to the app, which is what you wanted, and nothing personal is exposed. The same page is used for unknown or malformed tokens, so a guessed address reveals nothing and cannot be told apart from an old link.

| Rule | Value |
|---|---|
| Token | Random, at least 128 bits, never a booking number; only its hash is stored |
| Revoke | Operations can revoke one link, which moves it to App-only immediately. Deleting the customer's account revokes all of that customer's links |
| Smart store button | The app-only page sends Android visitors to Google Play and iPhone visitors to the App Store (or a "coming soon" note until that listing exists, S5 Section 5); other devices see both |
| Deep link (optional, later) | If the app is installed, the link can open it directly on the booking (**confirm** Android App Links and iOS Universal Links setup in the Expo build, needs a hosted association file on your domain); signed-in customers then see the receipt in the app, behind login |
| Clean-up job | A scheduled job (`pg_cron`, **confirm**) deletes link rows **12 months** after they become App-only. After that the same address still shows the App-only page, because an unknown token and an old one look identical. It deletes only the link row, never the feedback or the receipt record (S5 Section 4 retention) |
| Repeat visits while Active | Allowed; the feedback form is not shown a second time |

The receipt PDF, once downloaded or forwarded, cannot be taken back; the link rules do not change that.

### 17.4 Data (extends Section 4)

| Table | Columns | Notes |
|---|---|---|
| `guest_links` | `id`, `booking_id` unique, `token_hash` unique, `created_at`, `expires_at`, `used_at null`, `revoked_at null`, `last_viewed_at`, `view_count` | One link per booking. State is derived: **Active** while `used_at` and `revoked_at` are null and `now() < expires_at`, otherwise **App-only** |
| `reviews` (S4 2.1, extended) | add `source` (`'app'` or `'guest_link'`), allow `user_id` null for guests | Same table as in-app ratings; `booking_id` is already unique, which blocks duplicates |

### 17.5 Endpoints (public, no sign-in; extends Section 12)

| Path | Behaviour |
|---|---|
| `GET /g/{token}` | Server-rendered page (Express, modular SSR; see the Express module note) |
| `GET /g/{token}/receipt.pdf` | Returns the PDF only while Active; otherwise the neutral refusal |
| `POST /g/{token}/feedback` | Saves the review, sets `used_at`; a second submit returns "already received" and saves nothing |
| `POST /admin/guest-links/{bookingId}/revoke` | Operations only |

Rules for all of them: look up by token hash; for unknown, expired, used and revoked tokens return the **same App-only page** (HTTP 200, no personal data) and refuse the receipt and feedback endpoints with a neutral message; rate-limit per IP and per token; add `noindex`, `no-store` and `Referrer-Policy: no-referrer` headers; keep auto-escaping on and add CSRF protection for the form.

### 17.6 Where it appears in the technician workspace

- **Complete job** (Section 7): after the status change succeeds, the server creates the link if the customer is a guest and queues the WhatsApp or email message. The technician sees "Receipt link sent to the customer", never the link or its token.
- **Job detail**: for operations only, a "Guest link" row showing sent, viewed, feedback received or ended, plus Revoke and Resend (Resend creates a new token and ends the old one).
- A failed send never blocks completion; operations sees an alert and can resend (Section 6.4).

### 17.7 Tests

| Check | Expectation |
|---|---|
| Guest completes a job | Link created and queued once, even if Complete is retried (idempotency key, Section 12) |
| App user completes a job | No link created |
| Submit feedback twice | One review stored; second attempt shows "already received" |
| Open an expired, revoked, used or unknown token | Identical App-only page: store buttons and support contacts, no personal data, same HTML for all four cases |
| Cash job before cash is confirmed | No link |
| Day 31, or after feedback | Page switches to App-only; receipt still available in the app after login |
| Open the link on Android, iPhone and desktop | Store button matches the device; desktop shows both |
| Request receipt.pdf or POST feedback on an App-only link | Refused, nothing saved |
| Clean-up job (12 months after App-only) | Link rows removed; review and receipt rows untouched; the old address still shows the App-only page |
| Page content | No address or phone number anywhere in the HTML |

### 17.8 Open questions (defaults adopted)

| Q | Question | Default |
|---|---|---|
| Q56 | Maximum link lifetime | 30 days, or earlier when feedback is submitted |
| Q57 | Keep the receipt and app buttons after feedback is submitted | Yes, until the link ends |
| Q58 | Send the link to app users too | No |
| Q59 | What an ended link shows | **App-only download page** (replaces "link ended"), same for unknown tokens |
| Q60 | Deep link into the installed app | Later; plain store buttons first |

### 17.9 Hand-off note

Add `guest_links` to the schema list, the four endpoints to Section 12, and the tests above to Section 14. The link rules here replace any earlier idea of a permanent receipt link. Section 17.3 (App-only page) replaces the earlier "link ended" message everywhere it appears in this document and in the Express note (Section 18).

---

## 18. Express modular SSR note (serves the guest page, receipts and legal pages)

Added 2026-11-21. Answers "can Express do modular server-side rendering" for this project. Nothing here is compiled or run; package choices marked **confirm** need checking at build time.

### 18.1 Where it fits (and where it does not)

| Part of Gabfix | Rendering | Why |
|---|---|---|
| Mobile app | No SSR; JSON APIs (S4 Section 4) | It is a native app |
| ERP and technician workspace (`admin/`) | Stays a Vite React single-page app | Login-gated, no SEO need |
| **Guest job-complete page (Section 17)** | **Express SSR** | Public, opens fast on any phone, no app or sign-in needed |
| Receipt and invoice HTML and PDF | **Express SSR** | One server-side source for the receipt shown in the app and on the guest page |
| Privacy policy, terms, account-deletion page (S5 Section 4) | **Express SSR** | Public URLs the stores require |
| Email and WhatsApp message templates | Same template engine | Reuse layouts |

### 18.2 Stack (defaults)

- **Template engine:** Nunjucks with auto-escaping on (**confirm** current version). Plain HTML on the server; no client hydration for these pages, because they only need a download button and one small form.
- **Optional:** htmx for the feedback form so it submits without a full page reload; the form must still work without JavaScript.
- **Hardening:** `helmet`, CSRF protection for the form post, `express-rate-limit` keyed by IP and token, request size limits, `noindex` and `no-store` headers on `/g/*`.
- **PDF:** render the receipt HTML to PDF on the server with a headless browser library (**confirm** hosting limits and memory) or a PDF library; cache the result per receipt number.
- **Language and runtime:** TypeScript on a current Node LTS (**confirm**), same repo conventions as `admin/`.

### 18.3 Modular layout

```
server/
  src/
    app.ts                  // creates Express, mounts each module
    shared/
      layouts/base.njk      // brand layout (Gabfix tokens, no new colours)
      middleware/           // rateLimit, security headers, errors
      supabase.ts           // service-role client, server only
    modules/
      guest/                // Section 17
        guest.router.ts  guest.service.ts  views/{active,app-only}.njk
      receipts/             // receipt HTML and PDF
      legal/                // policies and account-deletion page
      messages/             // email and WhatsApp templates
```

Each module owns its router, service, views and tests and exposes one `mount(app)` function, so a module can be added or removed without touching the others.

### 18.4 Relationship to Supabase (decision Q61)

S4 puts business logic in Supabase Edge Functions. With Express added, keep **Supabase as the database and auth layer** and give Express only what needs server rendering: the guest page, receipt pages and PDFs, legal pages and message templates. The mobile and ERP JSON endpoints stay as specified in S4 and Section 12. Express uses the **service-role key only on the server**, never in any bundle, and talks to the same tables.

### 18.5 Guest module behaviour

- `GET /g/:token`: hash the token, load `guest_links` plus the booking. State **Active** renders `active.njk` (receipt button, feedback form, store buttons). Every other case, including unknown tokens, renders `app-only.njk` with HTTP 200 and no personal data (Section 17.3).
- Store buttons use the user agent to pick Google Play or the App Store; both are shown for other devices.
- `POST /g/:token/feedback`: validate input, insert into `reviews` with `source = 'guest_link'`, set `used_at` in the same transaction; a second submission saves nothing.
- Log only the token's last four characters and the state; never log names, phones or addresses.

### 18.6 Hosting and domain

One small Node service behind HTTPS on its own domain or subdomain (for example the short links domain used in WhatsApp messages). Use a short path (`/g/{token}`) so links stay readable in chat. The `/.well-known` files for app links, if you add deep links later (Q60), are served from the same domain.

### 18.7 Tests

| Check | Expectation |
|---|---|
| Template injection | A review comment containing HTML renders as plain text |
| Missing JavaScript | Feedback form still submits |
| CSRF | Post without the token is rejected |
| Rate limit | Repeated requests for random tokens are throttled |
| Active and App-only pages | Match the cases in Section 17.7 |
| PDF | Amount and date on the PDF match the receipt in the app |

### 18.8 Open questions (defaults adopted)

| Q | Question | Default |
|---|---|---|
| Q61 | Express alongside Supabase or instead of the Edge Functions | Alongside; Express renders pages only |
| Q62 | PDF generation method | Decide at build; cache per receipt |
| Q63 | Separate short-links domain | Yes, if you can; otherwise a subdomain of the main site |

### 18.9 Hand-off note

Section 17 defines what the guest page shows and when the link changes state; this section defines how it is served. Add the `server/` folder and the guest migration to the build order (Section 13, step 14). Index entry: add this file's Sections 17 and 18 under "After the screens".
