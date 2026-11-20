# Implementation Phase 2 - Stage 4: Backend plug-in contract (Supabase, Expo push, Firebase)

Builds on **Stage 1 (S1)**, **Stage 2 (S2)** and **Stage 3 (S3)**. It adds **no screens** and repeats **no front-end instruction**. It only says what the front end now expects of the backend and how to switch each mock off. Where a decision is already fixed, this document cites it (for example "S1 D16") and moves on.

> **Status.** Written 2026-11-20. Nothing here was compiled or run: no `node_modules`, no network, no Supabase project was available. SQL and Edge Function code are **unverified**. Supabase, Expo and Firebase APIs marked **confirm** must be checked against their current docs in the step that uses them.

**Precondition (S1 D15):** this stage starts only after the front end is finished and `npx tsc --noEmit` passes on a clean install (S3 8.3 item 3).

---

## 1. Mock switch inventory (what gets replaced)

Every item below already has a local fallback in the front end. Cut over one row at a time, in this order. Each row says what flips and what is deleted.

| # | Mock today | Source | Replaced by | Then delete or flip |
|---|---|---|---|---|
| 1 | No API base URL means local storage mode | `src/lib/api/client.ts`, `hasApiBaseUrl` | `EXPO_PUBLIC_API_BASE_URL` set per build | Nothing; the fallback stays for tests |
| 2 | Mock `login()` and mock 2FA challenge from a phone-side flag | S1 security store | Supabase Auth plus `/auth/2fa/*` functions (Section 5.2) | `twoFactor.enabled` as the source of truth; keep it as a cache |
| 3 | Sessions: current device only, `EXPO_PUBLIC_MOCK_SESSIONS=2` | S1 devices | `sessions` table (Section 2) | The env var (dev only) |
| 4 | Media: files moved to the booking folder and marked `uploaded`; `EXPO_PUBLIC_MOCK_UPLOAD_FAIL` | S1 3.11 | Storage signed uploads (Section 3) | The env var |
| 5 | Notification preferences in `profile-settings` | S1 4.2 | `notification_preferences` table | Keep local copy as cache |
| 6 | Quiet hours checked on the phone only | S1 D16, `isInQuietHours` | Server-side rule (Section 5.4) | Nothing; phone logic stays for local notifications |
| 7 | Cleaner assignment after 6 minutes, demo completion | `src/config/mock.ts` | Admin/dispatch assignment (Section 5.5) | **Set `mock.assignment.enabled` and `mock.completion.enabled` to false** (S2 Q28) |
| 8 | Referrals, reviews, tickets in local stores | S1 Sections 13 and 16 | Tables in Section 2 | Local stores become caches |
| 9 | Services and categories from `config/services.ts` | S1 14 | `service_categories`, `services` with `form_schema` | Config file stays as offline seed only |
| 10 | Wrong current password returns 401 | S1 D16 | **400 with a code, never 401** (Section 5.1) | Nothing |

Rule: a cutover is done when the matching row in Section 7 passes and the env var for that mock is removed from the production profile in `eas.json`.

---

## 2. Supabase schema

Use one `public` schema. All ids are `uuid`. Every table has `created_at timestamptz default now()`. Enable **row-level security (RLS) on every table**; no table is readable without a policy.

### 2.1 Tables

| Table | Key columns | Notes |
|---|---|---|
| `profiles` | `id` (= `auth.users.id`), `full_name`, `phone`, `locality_label` | Locality is an **optional text label** only (S1 15); no service-area table |
| `service_categories` | `id`, `name`, `parent_id null`, `sort`, `active` | Supports sub-categories; **admin writes only** (S2 Q27) |
| `services` | `id`, `category_id`, `name`, `pricing` (`'hourly'`\|`'quote'`), `form_schema jsonb`, `schema_version int`, `active` | `form_schema` is the admin-defined scope form (S3 Section 3). Validate it server-side before saving |
| `cleaners` | `id`, `name`, `kind` (`'cleaner'`\|`'technician'`), `photo_path`, `active` | Dummy roster becomes real rows |
| `bookings` | `id`, `code`, `user_id`, `service_id`, `status`, `scheduled_at`, `scope_snapshot jsonb`, `schema_version`, `cleaner_id null`, `assign_at null`, `assigned_at null`, `total_ugx`, `paid_ugx`, `created_at` | `scope_snapshot` stores answers **and** the field labels at booking time, so later schema edits never change an old booking (S3 Section 3) |
| `booking_media` | `id`, `booking_id`, `slot_id`, `kind` (`'image'`\|`'video'`), `path`, `bytes`, `duration_s`, `status` (`'pending'`\|`'uploaded'`\|`'failed'`) | `slot_id` matches S3 C5. Server enforces limits (Section 3.2) |
| `payments` | `id`, `booking_id`, `user_id`, `method` (`'card'`\|`'mtn'`\|`'airtel'`), `amount_ugx`, `status`, `provider_ref` | Balance due = `bookings.total_ugx - paid_ugx` |
| `saved_wallet_numbers` | `id`, `user_id`, `network` (`'mtn'`\|`'airtel'`), `msisdn`, unique(`user_id`,`network`) | **One number per network**, never shared between MTN and Airtel (S1 workstream for item 2) |
| `receipts` | `id`, `payment_id`, `number`, `issued_at` | PDF itself is generated on the phone (S1 11.1); the row only guarantees a stable receipt number |
| `reviews` | `id`, `booking_id` unique, `user_id`, `job_rating null`, `cleaner_rating null`, `comment null`, `tip_ugx null`, `skipped bool` | Both ratings optional (S1 item 15) |
| `tickets`, `ticket_messages` | `tickets(id, code, user_id, category, subject, status, created_at)`; `ticket_messages(id, ticket_id, author, body, created_at)` | Categories as in S1 16.3 |
| `ticket_attachments` | `id`, `ticket_id`, `path`, `bytes` | |
| `referrals` | `id`, `referrer_id`, `first_name`, `masked_phone`, `invited_at`, `joined_at`, `booked_at`, `reward_ugx` | Backs the three lists in S1 13 |
| `notification_preferences` | `user_id` pk, `in_app`, `push`, `news`, `quiet_enabled`, `quiet_start time`, `quiet_end time`, `timezone text` | Shape mirrors the `profile-settings` v2 store |
| `notifications` | `id`, `user_id`, `type`, `title`, `body`, `critical bool`, `read_at`, `payload jsonb` | The in-app inbox |
| `devices` | `id` (the app's generated device id), `user_id`, `name`, `platform` | One row per physical device |
| `sessions` | `id`, `user_id`, `device_id`, `signed_in_at`, `last_used_at`, `revoked_at null` | **One live session per device** (fixes the duplicate-phone defect noted in S1 4.4) |
| `push_tokens` | `device_id` pk, `user_id`, `expo_token`, `fcm_token null`, `updated_at` | Replaced on each registration |
| `login_events` | `id`, `user_id`, `device_id`, `at`, `result` | Backs Login Activity |
| `two_factor` | `user_id` pk, `method` (`'sms'`), `enabled_at` | |

### 2.2 RLS pattern (apply to every user-owned table)

```sql
alter table public.bookings enable row level security;

create policy "own rows read"   on public.bookings for select using (user_id = auth.uid());
create policy "own rows insert" on public.bookings for insert with check (user_id = auth.uid());
-- no update/delete policy: status changes go through Edge Functions using the service role
```

Rules:

- Customers can **insert** bookings, tickets, ticket messages, reviews and referrals for themselves, and **read** their own rows. They cannot update `status`, `paid_ugx`, `cleaner_id`, `assigned_at` or `reward_ugx`.
- `service_categories`, `services`, `cleaners`: `select` for any signed-in user where `active`; writes need an `admin` role. Store the role in `auth.users.app_metadata` and check it in the policy (**confirm** the current Supabase claim path).
- `booking_media`: insert and read only when the parent booking belongs to the caller (`exists (select 1 from bookings b where b.id = booking_id and b.user_id = auth.uid())`).
- Never expose the service-role key in the app. Only `EXPO_PUBLIC_SUPABASE_URL` and the anon key ship in the bundle.

### 2.3 Booking code and totals

Generate `bookings.code` in the database (a sequence plus a prefix), not in the app, so two phones can never collide. Compute `total_ugx` in the `create-booking` function (Section 5.3), not on the phone; the phone's number is only a preview.

---

## 3. Storage and uploads (media, ticket screenshots, avatars)

### 3.1 Buckets

| Bucket | Public | Path | Who writes |
|---|---|---|---|
| `booking-media` | No | `{user_id}/{booking_id}/{media_id}.{ext}` | The customer, through a signed upload URL |
| `ticket-files` | No | `{user_id}/{ticket_id}/{file_id}.{ext}` | Same |
| `cleaner-photos` | Yes (read) | `{cleaner_id}.jpg` | Admin only |

### 3.2 Upload flow (matches S1 3.11; the front end already does steps 1 to 3 and 5)

1. After the booking is saved, the app calls `POST /bookings/{id}/media` with the slot list (`slot_id`, `kind`, `bytes`, `duration_s`).
2. The function validates: at most 10 items, at most 2 videos, each video 30 s or less and 25 MB or less (S1 3.7). It inserts `pending` rows and returns one signed upload URL per item (`createSignedUploadUrl`, **confirm** current name and expiry).
3. The app uploads each file directly to storage (the legacy `FileSystem.createUploadTask`, still **unchecked**, S3 8.3 item 2), never as base64.
4. The app calls `POST /bookings/{id}/media/{mediaId}/complete`. The function reads the object size from storage, rejects anything over the limit, and sets `uploaded`.
5. `POST /bookings/{id}/media/refresh` re-issues expired URLs for `pending` or `failed` items. `DELETE /bookings/{id}/media/{mediaId}` removes the row and the object.

An upload failure never changes the booking status (S1 3.7: uploads never block a booking).

---

## 4. API surface: which backend piece serves each call

The client already calls these paths through `src/lib/api/client.ts` (bearer token, one refresh on 401, normalised `ApiError`). Keep the paths; put a thin Edge Function or a PostgREST view behind each.

| Path | Backed by |
|---|---|
| `POST /auth/login`, `/auth/otp/verify`, `/auth/refresh` | Supabase Auth, wrapped so the response includes a session id and `device` handling |
| `POST /auth/password/change` | Edge Function (Section 5.1) |
| `POST /auth/2fa/verify`, `/me/2fa/sms/enable`, `/me/2fa/sms/verify`, `/me/2fa/disable` | Edge Functions (Section 5.2) |
| `GET /me/security` | View: `passwordChangedAt`, `twoFactor`, `lastLoginAt` |
| `GET /me/sessions`, `DELETE /me/sessions/{id}`, `POST /me/sessions/revoke-others` | Edge Functions over `sessions` |
| `GET /me/login-activity?cursor=` | `login_events`, cursor pagination |
| `GET`/`PUT /me/notification-preferences` | PostgREST on `notification_preferences` |
| `POST /me/push-tokens`, `DELETE /me/push-tokens/{deviceId}` | Upsert/delete on `push_tokens` |
| `GET /service-categories`, `GET /services` | PostgREST, `active = true` |
| `POST /bookings`, `GET /bookings/{id}` | Edge Function `create-booking`; view |
| `/bookings/{id}/media...` | Section 3 |
| `GET`/`POST /support/tickets`, `GET /support/tickets/{id}`, `POST /support/tickets/{id}/messages` | PostgREST plus a function for ticket code generation |

Error shape for every function: `{ error: { code: string, message: string } }`, so `ApiError` keeps working. Use HTTP 401 **only** for a missing or expired token.

---

## 5. Edge Functions (Deno; **confirm** the current Supabase Edge Function runtime and import style)

### 5.1 `password-change` (S1 D16, S2 Section 1.3)

```ts
// pseudocode, unverified
const { currentPassword, newPassword, deviceId } = await req.json();
// re-authenticate with the current password using a throwaway client
const { error } = await anon.auth.signInWithPassword({ email, password: currentPassword });
if (error) return json({ error: { code: 'wrong_password', message: 'Current password is incorrect.' } }, 400);
await admin.auth.admin.updateUserById(user.id, { password: newPassword });
await admin.from('sessions').update({ revoked_at: new Date() })
  .eq('user_id', user.id).neq('device_id', deviceId);   // sign out other devices
```

- **Wrong current password returns 400 (or 403), never 401**, or the API client signs the customer out for a typo (S1 D16).
- Rate-limit by user and IP (for example five attempts per ten minutes) and return 429 with a `retry_after`.
- Record `passwordChangedAt` for `GET /me/security`.

### 5.2 Two-factor (SMS)

- `enable`: send a 6-digit code to `profiles.phone`; store only a hash and an expiry (10 minutes, five tries).
- `verify`: on success insert `two_factor`.
- `login` with 2FA on returns `{ challengeId }`; `POST /auth/2fa/verify` completes it and creates the session.
- SMS delivery needs a provider; the choice is open (Section 8, Q30).

### 5.3 `create-booking`

Validate `scope` against the stored `form_schema` for that `schema_version` (types, required fields, option values), recompute the price, set `assign_at` only if dispatch is automatic, insert the booking with `scope_snapshot`, and return the booking. Reject unknown field ids; never trust labels sent by the phone.

### 5.4 Quiet hours and push dispatch (S1 D16)

A closed app cannot hold a remote push, so **the server decides**. One function `notify(userId, notification)` is the only way anything sends a push:

1. Insert into `notifications` if `in_app` is on (always insert critical ones).
2. If `push` is off, stop.
3. If `critical` is true (payment failure, cleaner assigned, booking cancelled by support, security alert), send now.
4. Otherwise, convert `now()` to the user's `timezone` and test it against `quiet_start`/`quiet_end`; the window may cross midnight (default 22:00 to 07:00). Inside the window, store a row in `push_queue(user_id, notification_id, send_after)` where `send_after` is the next `quiet_end` in that timezone.
5. A scheduled job (`pg_cron` every 5 minutes, **confirm** availability on the plan) sends due queue rows.
6. News and offers are sent only if `news` is on.

Mirror the exact rule in `src/lib/` `isInQuietHours` tests so phone and server agree; add the same table of cases (midnight crossing, DST-free Africa/Kampala, timezone change) to both test suites.

### 5.5 Cleaner assignment (replaces the 6-minute mock, S2 Q28)

- Real assignment is made by an admin (or a dispatch rule) writing `cleaner_id` and `assigned_at` through an Edge Function that then calls `notify` with `critical = true` and type `cleaner_assigned`.
- Remove the mock: `mock.assignment.enabled = false` and `mock.completion.enabled = false`, and delete the local timer path from the production build.
- The Confirmed Order screen already reads `cleanerId` and the photo; it only needs the booking refresh to return `cleaner { id, name, kind, photoUrl }`.
- Completion also becomes a server event (`status = 'completed'`), which triggers the rating prompt notification.

### 5.6 Sessions

- Create or reuse the session row keyed on (`user_id`, `device_id`) at login: one row per device.
- Touch `last_used_at` on token refresh.
- `revoke` sets `revoked_at` and revokes the refresh token for that session (**confirm** how Supabase scopes sign-out per session). The revoked device finds out on its next refresh and signs itself out.
- `GET /me/security` counts the same rows the Devices screen lists, so the "0 signed-in devices" vs "2" mismatch seen in the reference screenshots cannot occur (S1 4.4).

---

## 6. Push: Expo and Firebase

1. **Android:** create a Firebase project, add the Android app (package name from `app.json`), download `google-services.json`, and upload FCM credentials to Expo (`eas credentials`; **confirm** the current FCM v1 steps). Reference the file in `app.json` (`android.googleServicesFile`).
2. **iOS:** needs an Apple Developer account and an APNs key uploaded through `eas credentials`. Until then iOS runs in-app notifications only.
3. **Token registration:** after login and after every permission change the app calls `getExpoPushTokenAsync({ projectId })` (**confirm** option names in SDK 58) and posts it to `POST /me/push-tokens` with the `deviceId`. On sign-out or session revoke call `DELETE /me/push-tokens/{deviceId}`.
4. **Sending:** the `notify` function posts batches to the Expo push API (`https://exp.host/--/api/v2/push/send`, **confirm**), reads the receipts later, and deletes tokens reported `DeviceNotRegistered`.
5. **Android channels:** the app already defines channels by type; critical types use the high-importance channel. Do not rename a channel id after release (Android keeps the old settings).
6. **Development builds:** remote push on Android does not work in Expo Go on current SDKs (**confirm** for SDK 58). Test remote push on an EAS development build; local notifications still work in Expo Go.

---

## 7. Cutover checklist (one row per mock in Section 1)

| Step | Pass condition |
|---|---|
| 1 Auth and sessions | Log in on two phones: both appear in Devices; Security shows 2; revoking one signs that phone out within one refresh |
| 2 Password change | Wrong password returns 400 `wrong_password` and the user stays signed in; success signs out the other device |
| 3 Two-factor | Enable, log out, log in: a challenge appears and a wrong code fails after five tries |
| 4 Services and forms | An admin adds a category and a service with a new field type; it renders on Job scope with no app update; an old booking still shows its original labels |
| 5 Booking | Price on the server equals the preview; unknown scope field ids are rejected |
| 6 Media | Airplane-mode upload fails without affecting the booking; retry succeeds; an 11th item and a 26 MB video are rejected by the server |
| 7 Payments | MTN and Airtel numbers are stored per network; a balance payment reduces the Balance due card |
| 8 Push and quiet hours | Routine push at 23:00 Kampala time arrives at 07:00; a critical push arrives immediately |
| 9 Assignment | With the mock off, an admin assignment shows the cleaner circle and sends in-app and push |
| 10 Reviews, tickets, referrals | Each list loads from the server and survives a reinstall |

Add `npx tsc --noEmit`, lint, and the unit tests for `isInQuietHours`, the form-schema validator and the media-limit checker to the CI job before the first production build.

---

## 8. Open questions (defaults adopted; change one row if you answer)

| Q | Question | Default |
|---|---|---|
| Q30 | SMS provider for two-factor and OTP | Supabase Auth phone provider with a provider that covers Uganda; decide at step 1 |
| Q31 | Mobile money gateway for MTN and Airtel | Left behind the existing payment-processing screen; decide before step 7. Card payments follow the same choice |
| Q32 | Dispatch: manual by admin or automatic | **Manual** at launch (Section 5.5) |
| Q33 | Admin tool: Supabase Studio or a custom dashboard | Studio with the role policies above until the admin dashboard exists |
| Q34 | Data retention for media | Delete booking media 90 days after completion |
| Q35 | Region for the Supabase project | The closest available to Kampala; check latency before choosing |

Still needing you from earlier stages: the **dashboard stats image** (Q17).

---

## 9. Hand-off summary (so Stage 5 never repeats an instruction)

**Settled, do not restate:**

- Support details, Phase 9 naming, the 56% score, Job scope schema design, media limits, Profile layout, service-area removal, `dismissTo` navigation, keyboard library, Q17 to Q29 defaults: unchanged from S1, S2 and S3 (S3 8.1).
- Backend order: front end first, then this stage (S1 D15).
- Wrong password returns 400 or 403, never 401; quiet hours are enforced on the server; both specified in Sections 5.1 and 5.4.
- One session per device; Security and Devices read the same rows (5.6).
- MTN and Airtel numbers are stored separately per network (2.1).
- The 6-minute assignment and demo completion are switched off in release (5.5, Section 1 row 7).

**New in this stage:**

| Topic | Where |
|---|---|
| Mock-to-real switch order | Section 1 |
| Tables and RLS | Section 2 |
| Storage and upload protocol | Section 3 |
| Endpoint-to-backend map | Section 4 |
| Edge Functions: password, 2FA, booking, push and quiet hours, assignment, sessions | Section 5 |
| Expo and Firebase push setup | Section 6 |
| Cutover pass conditions | Section 7 |
| Open questions Q30 to Q35 | Section 8 |

**Still unchecked (confirm in the step that uses it):** admin claim path in RLS, `createSignedUploadUrl`, `pg_cron` availability, per-session sign-out, Expo push `projectId` option and Android remote push in Expo Go on SDK 58, FCM v1 credential steps, plus the three signatures listed in S3 8.3 item 2.

**Context to drop from the working window:** Stages 1 to 3 can be summarised to their hand-off sections (S3 8.1 and this Section 9). Keep S1 only for screen layouts when building, and the repository snapshot for re-verification.

**Proposed Stage 5:** release and operations only (EAS build profiles, store listings, privacy policy and data-deletion flow, analytics and crash reporting, monitoring of the push queue, and a rollback plan), with no repeated screens or schema.
