# Implementation Phase 2 - Technician Mobile App and Console Split

**Decision (2026-11-21, yours):** three pieces on **one Supabase backend**:

| Piece | Who | Form |
|---|---|---|
| Customer app | Customers | Existing Expo app (`gabfix_mobile-main`) |
| **Technician app** | Cleaners and technicians | **New Expo mobile app** (this document) |
| Admin console | Admin and operations only | Existing `admin/` Vite app, **installable PWA** |

**Whole-system architecture and the end-to-end job workflow are in Section 14** (customer app, technician app, console PWA, Express and the Supabase backend, with the integration phases after the customer front end).

This document **replaces** the web technician workspace as the main route. It supersedes Technician Workspace (TW) Sections 2, 3, 5, 8 and 11 and the technician parts of Sections 12 to 14. Everything else in TW stands: job lifecycle (TW 7), data model (TW 4), ERP-side dispatch and cash (TW 6), `area` removal (TW 9), security (TW 10), guest job-complete page and Express note (TW 17 and 18). Written 2026-11-21; nothing was compiled or run, and items marked **confirm** must be checked against current docs when built.

---

## 1. Why a native app for technicians

A web page or PWA cannot keep sending location once the technician opens a maps app or the screen locks, which is exactly the drive you want customers to watch. A native app can run background location with an Android foreground notice. That makes the Live Tracking Addendum (LT) work reliably. The PWA limit in TW Section 2 is therefore no longer a risk to accept; it is removed.

---

## 2. Repository and build structure

**Default (Q64): one repository, two Expo apps sharing code.**

```
gabfix/
  apps/
    customer/        (the current gabfix_mobile-main moves here, or stays and is referenced)
    technician/      (new Expo app, own bundle id and store listing)
  packages/
    shared/          (types, theme tokens, support config, api client, status machine, idempotency)
  admin/             (console, PWA)
  server/            (Express SSR: guest page, receipts, legal; TW 18)
```

Why two apps, not one app with a role switch: only the technician build asks for background location and runs a foreground service, so the customer listing stays simple for store review and customers never download staff code. Each app has its own Android package name, iOS bundle id, EAS project and icon.

If you prefer to **keep the existing repo as it is** (lower risk), create `gabfix_technician` as a second repository and copy `src/theme`, `src/lib/api/client.ts` and `src/config/support.ts`. Sharing a package later is a refactor, not a blocker (Q64 alternative). Do not try to convert the customer repo to a workspace in the middle of Phase 9 work.

**Tooling (confirm for SDK 58):** Expo SDK 58 as in the customer app, Expo Router, same TypeScript and lint setup, same design tokens (Gabfix colours, Poppins and Inter, Lucide icons; no new hex values).

---

## 3. Roles and access (replaces TW 3)

| Role | Where they sign in | Sees |
|---|---|---|
| `admin` | Console | Everything including settings |
| `operations` | Console | Everything except settings |
| `technician` | **Technician app only** | Own jobs, own cash records, own profile |
| customer | Customer app | Own data |

- The console **no longer has a technician role or `#/tech` routes**. A technician who opens the console is signed out with "Use the Gabfix Technician app".
- The technician app refuses sign-in for any role except `technician`.
- Enforcement is in the database (row-level security, S4 2.2 and TW 10), not in the apps. Hiding screens is only presentation.
- Technicians are invited by admin or operations (TW 6.2); no self sign-up. Deactivating a technician revokes sessions and push tokens at once.

---

## 4. Screens (Expo Router; replaces TW 5)

Bottom tabs: **Today, Jobs, Cash, Me**. Same visual language as the customer app (surface cards, `radius.card`, bottom-pinned sheets with no gap, keyboard-aware fields as in S1 12.2).

| Route | Screen | Content |
|---|---|---|
| `(tabs)/index` | **Today** | Name, **Available** switch, today's jobs as cards (time, service, locality, status chip); pull to refresh; new-assignment banner |
| `job/[id]` | **Job detail** | First name, **Call** and **WhatsApp** buttons (active jobs only), address text and **Navigate** button (opens the maps app with the coordinates; **confirm** the link format), scope read-only through the S3 form engine, customer photos and videos, notes, price and payment method (Cash shows "Collect UGX X"). One **primary action button** at a time: Accept or Decline, Start trip, I have arrived, Start work, Complete job (rules in TW 7) |
| `job/[id]/checklist` | **Checklist** | Admin-defined items per service (TW 4 `job_checklists`), required items block completion; Before and After photo slots using the same media limits as the customer app (10 items, 2 videos, 30 s, 25 MB) |
| `job/[id]/cash` | **Confirm cash** | Amount to collect (read-only), "Amount received", **Confirm received**; a difference needs a note and creates a dispute (TW 6.5) |
| `(tabs)/jobs` | **Jobs** | Upcoming and Completed, search by booking code |
| `(tabs)/cash` | **Cash** | Owed to Gabfix, confirmed, remitted, disputes (read-only) |
| `(tabs)/me` | **Me** | Profile (edit phone and availability only), notification settings, location-sharing status, support contacts from the shared support config, sign out |
| `trip-active` banner | **Location sharing ON** | Persistent banner during a trip with a **Stop sharing** control |

Sign-in: email or phone plus password (OTP later, with the SMS provider decision, which you deferred). Optional biometric unlock reuses the customer app's app-lock design (S1 4.3).

---

## 5. Background location (replaces TW 8; extends LT 5)

1. **Start trip** starts sharing; **I have arrived**, **Complete**, **Decline**, sign-out or **Stop sharing** stops it. Nothing runs outside an active job.
2. Packages (confirm names and options for SDK 58): `expo-location` and `expo-task-manager`. A background task receives updates and posts them to `POST /technician/location` (LT 4.2).
3. Settings: balanced accuracy, about 10 s time interval and about 25 m distance filter (LT 5). Keep only the **latest point** if the network is down; never replay history.
4. **Android:** a foreground service with a notification "Sharing your location with the customer", with the location foreground-service type and permission declared (**confirm** manifest entries and the target SDK rules). Request foreground permission first, then background ("Allow all the time"); show a pre-prompt screen explaining the purpose before each system prompt. Provide a battery-optimisation hint screen for devices that kill background tasks (**confirm** a library or deep link per manufacturer).
5. **iOS:** "Always" location with the background-modes capability and the blue-bar indicator; needs an Apple Developer account (S5 Section 5). Ship Android first.
6. **Arrival check:** compare the last good point to the destination coordinates (about 300 m, TW 7).
7. **Failure states:** GPS off, permission revoked, or no update for 3 minutes shows a warning on the Job screen and raises the alert in TW 6.4.
8. **Server-side filters** (LT 4.2 and LT 6): jump rejection, rate limit, deletion of the location row on completion.
9. **Play Store:** background location needs a declaration form and a short demo video of the in-app disclosure (**confirm** current policy). This applies only to the technician listing, which is why it is a separate app.

---

## 6. Offline and reliability (replaces TW 11)

- Store the **action queue** locally (AsyncStorage or SQLite, **confirm** choice): every status change, checklist save and cash confirmation carries an idempotency key and sends in order; the server rejects out-of-order transitions and the app refreshes.
- Cache today's job list for read-only viewing offline; queued actions show "Waiting to send".
- Photos queue separately and upload after the action succeeds (S4 3.2 protocol); they never block a status change.
- Push notifications for new assignments through Expo Push and Firebase (S4 Section 6), including channels: assignments are **critical** and bypass quiet hours; there are no news and offers for technicians.
- Without a connection at **Start trip** the trip can start locally, with the first location post queued.

---

## 7. What changes in the console (`admin/`)

| Item | Change |
|---|---|
| Role model | Roles are `admin` and `operations` only; remove any technician role and `#/tech` routes from the plan |
| Auth | Replace the demo accounts in `lib/auth.ts` (hard-coded passwords) with Supabase Auth before real data |
| PWA | Add a web manifest and service worker (confirm `vite-plugin-pwa` support for Vite 7) so the console installs; **cache the app shell only**; do not cache API data containing personal information; show "You are offline" and disable actions rather than queueing admin changes |
| Keep from TW 6 | Assignment dialog upgrade, technician management (invite, verify, deactivate), Live map page, Alerts panel, Cash module |
| Live map | Reads the same tracking data as the customer app (LT 4.2); uses a Maps JavaScript key restricted by HTTP referrer (LT 3) |
| Guest links | Operations can revoke or resend (TW 17.6) |
| `area` | Removed as in TW 9 |

---

## 8. Backend and API deltas

No new tables beyond TW 4 and LT 4.1. Changes:

| Item | Change |
|---|---|
| Endpoints `/technician/*` (TW 12) | Unchanged; now called by the technician app, with a `device_id` and app version header |
| Push tokens | Technician tokens stored in `push_tokens` with `app = 'technician'` (add column) so a notification goes to the right app |
| Sessions | One session per device (S4 5.6); operations can force sign-out |
| Version gate | `GET /app-config?app=technician` returns `minVersion`; the app blocks use below it with an update screen (needed because job statuses are server-critical) |
| RLS | Unchanged (TW 10): technician reads only bookings assigned to them in active statuses |

---

## 9. Release for the technician app (extends S5)

| Item | Rule |
|---|---|
| Distribution | Start with **internal and closed testing** on Google Play (or direct APK/EAS internal distribution) rather than a public listing; staff-only apps can use an unlisted or closed track (**confirm** current options) |
| Build profiles | `development`, `preview`, `production` as in S5 Section 1, separate EAS project |
| Permissions | Location (when in use and always), notifications, camera and photo library for evidence photos; no contacts, SMS or microphone unless video is used |
| Data safety | Declare precise location collected, shared with customers during active jobs only, and photos; link the same privacy policy with a technician section (S5 Section 4) |
| Monitoring | Same crash and alert setup (S5 Section 6); alert on `on_the_way` jobs with no location for 3 minutes |
| Kill switch | `notify_enabled` and the version gate from Section 8 |

---

## 10. Build order

| # | Task | Depends on |
|---|---|---|
| 1 | Backend: technician role, `cleaners.user_id`, invites, RLS tests, `/technician/*` endpoints (TW 12) | S4 cutover step 1 |
| 2 | Technician app skeleton: Expo project, shared theme and API client, sign-in, role check, version gate | 1 |
| 3 | Today and Job detail (read-only, mock then live data) | 2 |
| 4 | Lifecycle actions with the idempotent queue (TW 7) | 3 |
| 5 | Checklist and evidence photos and upload | 4 |
| 6 | Cash confirm and Cash tab | 4 |
| 7 | Background location, foreground notice, permission flow (Section 5) | 4; development build required |
| 8 | Push for assignments, accept and decline window (TW 6.1) | 4, S4 Section 6 |
| 9 | Console: remove technician route plans, add PWA, replace demo auth, upgrade dispatch and live map | 1 |
| 10 | Real-device pilot (Section 11) | 7 to 9 |
| 11 | Guest page and Express module (TW 17 and 18) | 4 |

Lane suggestion for two developers: lane 1 is steps 2 to 8 (technician app); lane 2 is steps 1, 9 and 11 (backend, console, guest page).

---

## 11. Tests and pilot

| # | Check | Expectation |
|---|---|---|
| P1 | Technician signs in to the console | Refused with "Use the Gabfix Technician app" |
| P2 | Admin signs in to the technician app | Refused |
| P3 | Start trip, switch to a maps app for 15 minutes, screen locked | Customer marker keeps moving; location updates arrive about every 10 s |
| P4 | Revoke location permission mid-trip | Warning shown; alert reaches operations within 3 minutes |
| P5 | Airplane mode at Complete job | Action queued; one event after reconnect |
| P6 | Request another technician's job by id | Denied by RLS |
| P7 | After Completed | Phone and address hidden; location row deleted |
| P8 | Low-end Android with aggressive battery saver | Record failures; adjust the battery hint screen |
| P9 | Version below `minVersion` | Update screen blocks use |
| P10 | Console install as PWA | Installs; goes read-only offline; no cached personal data |
| P11 | Lifecycle, cash, dispute and guest-link rules | All TW 14 and 17.7 checks still pass |

---

## 12. Open questions (defaults adopted)

| Q | Question | Default |
|---|---|---|
| Q64 | Repository layout | One repository with `apps/` and `packages/shared` if you are willing to restructure after Phase 9; otherwise a second repository |
| Q65 | Technician app distribution | Closed or internal testing first |
| Q66 | iOS for technicians | Android first |
| Q67 | Sign-in method | Email or phone plus password; OTP after the SMS decision |
| Q68 | Technician app name and bundle ids | You choose; for example "Gabfix Technician" |

Still deferred by you: SMS provider (S4 Q30) and mobile money gateway (S4 Q31).

---

## 13. Hand-off summary

- **Settled:** customer app, **technician mobile app**, and admin console as an installable PWA, all on one Supabase backend; roles enforced in the database; technicians never use the console and admins never use the technician app.
- **Supersedes in TW:** Sections 2, 3, 5, 8 and 11, and the technician-shell items of Sections 12 to 14.
- **Unchanged:** TW 4, 6, 7, 9, 10, 17, 18, and all of S1 to S5, LT and the Dashboard Addendum.
- **Known requirements:** development build, background-location store declaration for the technician app, Android foreground notice, real-device pilot.
- **Architecture:** Section 14 holds the system diagram, the 18-step job workflow, status ownership, integration phases A to H and environments.
- **Index:** add this file as entry 10 in the reading order.

---

## 14. System architecture and end-to-end workflow

Added 2026-11-21. This is the whole-system view: four clients, one Supabase backend, and how a job moves through all of them. **Today only the customer app front end is being built** (local storage, mock mode, S1 D15); this section is the plan for plugging everything in afterwards. It points to the detailed documents instead of repeating them. Nothing here is compiled or run; items marked **confirm** need checking at build time.

### 14.1 The pieces

| # | Piece | Users | Built with | Status |
|---|---|---|---|---|
| 1 | **Customer app** | Customers | Expo, React Native | Front end in progress (Phase 9); mock mode until the backend is switched on |
| 2 | **Technician app** | Cleaners and technicians | Expo, React Native (this document) | To build |
| 3 | **Admin and dispatch console** | Admin, operations (dispatch manager) | Vite + React, **installable PWA** (`admin/`) | UI exists on mock data; to be wired |
| 4 | **Web server (Express SSR)** | Guests and the public | Node, Express, Nunjucks (TW 18) | To build |
| 5 | **Supabase backend** | All of the above | Postgres, Auth, Storage, Realtime, Edge Functions, scheduled jobs | To build after the customer front end (S4) |
| 6 | **External services** | Backend only | Firebase and Expo Push, Google Maps and Directions, SMS and mobile money (both deferred), WhatsApp and email | Chosen per step |

Dispatch manager is a **role in the console** (`operations`), not a separate app.

### 14.2 Architecture at a glance

```
 Customer app      Technician app        Admin and dispatch PWA      Guest browser
 (Expo)            (Expo, background     (Vite, installable)         (opens /g/token)
                    location)
     |                  |                       |                         |
     |  HTTPS + JWT     |  HTTPS + JWT          |  HTTPS + JWT            |  HTTPS (token only)
     v                  v                       v                         v
 +-----------------------------------------------------+        +-----------------+
 |                    SUPABASE                         |<-------| Express SSR     |
 |  Auth (roles in JWT)    Postgres + RLS              | server |  guest page,    |
 |  Storage (media)        Realtime (optional)         | key    |  receipts, PDF, |
 |  Edge Functions: create-booking, notify, assign,    |        |  legal pages    |
 |    password-change, 2FA, tracking, status machine   |        +-----------------+
 |  Scheduled jobs: push queue, link clean-up, retention|
 +----+----------------+---------------------+---------+
      |                |                     |
      v                v                     v
  Expo Push +      Google Maps /         WhatsApp, email
  Firebase (FCM)   Directions API        (SMS and mobile money later)
```

(Plain-text sketch; for a drawn version, ask for one in the text chat.)

### 14.3 Rules that keep the architecture sound

1. **One database, one source of truth.** All four clients read and write the same Supabase tables (S4 Section 2, TW 4, LT 4.1). No app keeps its own authoritative copy; local stores are caches (S4 Section 1).
2. **The database decides access.** Row-level security enforces who sees what, using the role in the user's token (customer, technician, operations, admin). Apps hide screens only for presentation (TW 10).
3. **State changes go through server functions.** A customer or technician app never writes `status`, `paid_ugx`, `cleaner_id` or `assigned_at` directly. Edge Functions apply the status machine, write `job_events`, and call `notify` (S4 5.4).
4. **Secrets stay on the server.** Only the Supabase URL and anon key ship in apps. The service-role key, SMS, payment and Directions keys live in Edge Function secrets or the Express server environment.
5. **One notification path.** Every push, in-app message and WhatsApp or email goes through `notify`, which applies preferences, quiet hours and critical overrides (S4 5.4).
6. **Idempotent actions.** Every mutating call carries an idempotency key so flaky networks never double-apply a step (TW 12).
7. **Clients are replaceable.** The API contract (S4 Section 4, TW 12, LT 4.2) is the boundary; a client change never needs a database change.

### 14.4 Who talks to what

| From | To | What | Where specified |
|---|---|---|---|
| Customer app | Supabase | Sign-in, services and form schemas, create booking, media upload, payments, tickets, reviews, referrals, tracking read, notification preferences | S4 Section 4 |
| Technician app | Supabase | Sign-in, own jobs, status changes, checklist, evidence photos, cash confirm, location posts | TW 12, LT 4.2 |
| Console (PWA) | Supabase | Bookings, assignment, technician management, cash and remittance, live map, reports, services and form schemas, ticket replies | TW 6, S4 2.1 |
| Express | Supabase (server key) | Guest page, receipt pages and PDFs, legal pages, message templates | TW 17 and 18 |
| Supabase functions | Expo Push and FCM | Push to customer and technician apps | S4 Section 6 |
| Supabase functions | Google Directions | Route and ETA, cached 60 s | LT 4.3 |
| Supabase functions | WhatsApp and email | Guest links, invites, receipts | TW 17.2 |

### 14.5 End-to-end workflow (one job, all pieces)

| Step | What happens | Piece doing it |
|---|---|---|
| 1 | Customer opens the app, picks a service, fills the admin-defined scope form, adds photos and videos, chooses date and payment method | Customer app |
| 2 | The app calls `create-booking`; the server validates the form against the stored schema, recomputes the price, saves the booking with a scope snapshot, and returns a booking code | Edge Function |
| 3 | Media uploads go straight to storage with signed URLs after the booking exists; failures never block the booking | Customer app and Storage |
| 4 | Payment is recorded by method: mobile money or card through the gateway (deferred decision), or cash later | Customer app and Edge Function |
| 5 | The booking appears in the console as **Pending**; dispatch sees an unassigned-jobs alert | Console and Realtime or polling |
| 6 | Dispatch assigns a technician by skills, availability and workload; the function sets `cleaner_id` and calls `notify` | Console and Edge Function |
| 7 | The technician gets a critical push, opens the job, and **accepts** within the window (15 minutes); decline or timeout returns it to dispatch | Technician app |
| 8 | The customer is notified with the technician's photo and name (in-app and push) | `notify` |
| 9 | On the day, the technician taps **Start trip**; background location starts, the booking moves to on-the-way, and the customer is notified | Technician app and Edge Function |
| 10 | Every ~10 s the technician app posts its position; the server stores only the latest point and refreshes the route and ETA about once a minute | Technician app and Edge Function |
| 11 | The customer's Track screen polls the tracking endpoint every 10 s and moves the technician marker along the route; the console live map shows all active trips | Customer app and Console |
| 12 | The technician taps **I have arrived**, then **Start work** | Technician app |
| 13 | The technician completes the checklist, takes after photos, and for cash jobs confirms the amount received | Technician app |
| 14 | **Complete job** is accepted by the server only if the rules in TW 7 pass; location sharing stops and the location row is deleted | Edge Function |
| 15 | The customer receives the receipt (in-app PDF) and a rating prompt. A **guest** customer instead gets the WhatsApp or email link to the guest page (receipt, one feedback form, app download) | `notify`, Express |
| 16 | Feedback lands in `reviews`; the guest link switches to the App-only page after use or 30 days | Express and scheduled job |
| 17 | Operations reviews cash collections, resolves disputes and marks remittance; reports update | Console |
| 18 | Retention jobs run: media after 90 days, link rows after 12 months of being App-only, login events after 12 months (S5 Section 4) | Scheduled jobs |

### 14.6 Status ownership (one machine, one writer)

| Status | Set by | Visible to |
|---|---|---|
| Pending | `create-booking` | Customer, console |
| Confirmed | Technician accepts | Customer, technician, console |
| On the way, In progress | Technician actions through the status function | All three |
| Completed | Status function after rule checks | All three |
| Cancelled | Customer (within policy) or operations | All three |

The customer-facing `upcoming / completed / cancelled` values stay derived from these (TW 4). Nobody sets a status by editing a row.

### 14.7 Integration phases (what happens after the customer front end)

| Phase | Goal | Done when |
|---|---|---|
| **A. Customer front end** (now) | All Phase 9 screens on local storage | S3 build order complete; device matrix passed |
| **B. Backend foundation** | Supabase projects (staging and production), schema, RLS, roles, Auth, Storage buckets | RLS tests pass; two test phones can sign in (S4 cutover steps 1 to 2) |
| **C. Customer app cutover** | Replace mocks one by one (S4 Section 1 order): services and form schemas, booking, media, payments, notifications, sessions, tickets, reviews | S4 Section 7 checklist passes |
| **D. Console wiring** | Replace demo auth and mock arrays with live queries; assignment, cash, technician management; PWA install | Dispatch can assign a real booking end to end |
| **E. Technician app** | Build and pilot (this document, Section 10) | Pilot P3 passes on real devices |
| **F. Live tracking** | Directions caching, tracking endpoints, customer map, console live map | LT Section 8 tests pass |
| **G. Guest page and Express** | Guest link, receipts, PDFs, legal pages | TW 17.7 tests pass |
| **H. Release and operations** | Store listings, monitoring, rollback, staged rollout | S5 launch checklist complete |

Phases D to G can overlap once B and C are done; the console (D) and technician app (E) are the critical pair because dispatch and the technician must work together for the first real job.

### 14.8 Environments and deployment

| Environment | Purpose | Notes |
|---|---|---|
| Local | Mock mode (no backend) for UI work | Existing behaviour (S1 D15) |
| **Staging** | Full stack with test data | Own Supabase project, own Express service, own Maps and push credentials; used by `preview` builds (S5 Section 1) |
| **Production** | Real customers | Separate project and secrets; migrations applied before binaries are promoted (S5 Section 7) |

Deployment targets: apps through EAS and the stores; console as static files on a CDN host with HTTPS (**confirm** host); Express as a small Node service with HTTPS on the short-links domain; Edge Functions and database on Supabase. Same migration scripts run on both environments.

### 14.9 Cross-cutting concerns

| Concern | Approach |
|---|---|
| Authentication | Supabase Auth for all four clients; role in the token; technician and admin sign-in refused in the wrong client (Section 3) |
| Authorisation | RLS on every table; tests prove customers cannot read other customers and technicians cannot read other jobs |
| Real-time | Polling every 10 s first (LT 4.4 option A); Supabase Realtime later where it clearly helps (console dashboards, live map) |
| Observability | Crash reporting per app, Edge Function logs, push-queue age and location-gap alerts (S5 Section 6, LT 7) |
| Audit | `job_events` append-only and `audit_log` for operations changes (TW 10) |
| Privacy | Minimum data on every surface; technician location shared only during active jobs and deleted after; guest page shows no address or phone (TW 17) |
| Versioning | Version gate per app (Section 8) and one API contract with backward-compatible changes during staged rollout |
| Failure handling | Queued, idempotent actions on the technician app; neutral fallbacks on the guest page; payment failure keeps the booking unpaid and recoverable from Balance due (S5 Section 8) |

### 14.10 Open questions (defaults adopted)

| Q | Question | Default |
|---|---|---|
| Q69 | Real-time transport for the console | Polling every 10 s first; Realtime later |
| Q70 | Console hosting | Static host with a CDN and HTTPS; decide at Phase D |
| Q71 | Whether dispatch assignment becomes automatic later | Manual first (S4 Q32); revisit after the pilot |
| Q72 | Where Express is hosted | A small managed Node host with HTTPS; decide at Phase G |

### 14.11 Hand-off note for this section

Section 14 is the single architecture view. If it disagrees with S4 on where a piece lives, S4 wins on schema and endpoints, and this section wins on workflow and order. Add Q69 to Q72 to the Index.
