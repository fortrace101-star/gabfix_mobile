# Implementation Phase 2 - Stage 5: Release and operations

Builds on **S1 to S4**. It adds **no screens, schema or API** and repeats none of them. It covers only how the app is built, signed, submitted, monitored and rolled back.

> **Status.** Written 2026-11-21. Not run: no repo, network or store accounts were available to me in this pass, so file names such as `eas.json` and `app.json` are referred to by role and every store or tool rule marked **confirm** must be checked against current docs when you reach that step. Store policies change often.

**Precondition:** S4 Section 7 cutover passes on a development build, and `npx tsc --noEmit`, lint and tests are green (S4 Section 7, last paragraph).

---

## 1. Build profiles (EAS)

Keep three profiles in `eas.json` (the repo already has `development`; **confirm** the others exist).

| Profile | Purpose | Distribution | API base URL | Mock flags |
|---|---|---|---|---|
| `development` | Daily work, remote push tests | Internal, dev client | Staging Supabase | Mocks allowed (`EXPO_PUBLIC_MOCK_*`) |
| `preview` | Testers and the owner | Internal (APK / TestFlight) | Staging Supabase | **All mocks off** except `devButton` for completion |
| `production` | Store release | Store | Production Supabase | **All `EXPO_PUBLIC_MOCK_*` removed; `mock.assignment.enabled` and `mock.completion.enabled` false** (S4 Section 1 row 7) |

Rules:

- Two Supabase projects, **staging and production**, with the same migrations. Never point `preview` at production data.
- Only public values ship in the bundle (`EXPO_PUBLIC_SUPABASE_URL`, anon key). The service-role key, SMS and Expo push access tokens live as Supabase function secrets (S4 Section 2.2), never in the repo or `eas.json`.
- Set `autoIncrement` for the build number on `production` and use `appVersionSource: "remote"` (**confirm** current EAS option names).
- Use one **signing keystore** managed by EAS. Back up its credentials export to a password manager; losing the Android upload key means a store support request.

## 2. Versioning and updates

- Version scheme: `MAJOR.MINOR.PATCH` in `app.json` (`expo.version`); this front-end release is **1.0.0**.
- **Over-the-air updates (`expo-updates`, confirm install):** set `runtimeVersion` with the `appVersion` policy so an update can only reach binaries it is compatible with. Any native change (a new permission, a new native package) needs a new store build, not an OTA update.
- Release channels: `preview` branch for testers, `production` branch for customers. Publish to `preview` first, promote after a day with no crash spike.
- Never ship a change to Android notification channel ids or the schema contract in S3 Section 3 by OTA; both need a coordinated binary plus backend release (S4 Section 6, item 5).

## 3. Permissions and store declarations

Every permission must be justified in the store form and by an in-app purpose string.

| Capability | Used for | Where requested | Purpose text (keep short) |
|---|---|---|---|
| Camera | Take photo and Record video on Job scope (S1 3.7) | On tapping the action, not at launch | "Take photos or video of the job so the cleaner can prepare." |
| Microphone | Video audio | With the camera video action | "Record a short video walkthrough." |
| Photo library | Choose from library | On tapping the action | "Choose photos or video of the job." |
| Notifications | Booking and security updates (S1 4.2) | After login, with a pre-prompt | "Get updates about your booking." |
| Biometrics | App lock (S1 4.3) | When the user turns the lock on | "Unlock Gabfix with Face ID or fingerprint." |

Checks:

- The camera and microphone entries in `app.json` must cover video capture (S1 audit finding: the image-picker permissions did not cover the camera). **Confirm** the config plugin options in SDK 58.
- Do **not** request background location, contacts or SMS reading. Remove any permission in the merged Android manifest the app does not use (**confirm** with `eas build` output or the manifest viewer).
- Provide the iOS usage-description strings (camera, microphone, photo library, Face ID) in `app.json`.

## 4. Privacy, data deletion and legal

| Item | Requirement | Action |
|---|---|---|
| Privacy policy | A public URL, plus the in-app route `policies/[doc]` (already exists, S1 audit) | Publish one policy covering the data in S4 Section 2: profile, phone, bookings, media, tickets, device ids, push tokens, login events |
| Terms | Same | Link from sign-up and Profile > Legal |
| Account deletion | Stores require an in-app path and, for Google Play, a web link (**confirm**) | Deleting the account must call a backend function that removes the user's rows and storage objects, then the app clears AsyncStorage **and the device id** (the S1 audit finding: the old deletion cleared only AsyncStorage) |
| Retention | Media deleted 90 days after completion (S4 Q34 default); login events and sessions 12 months | Scheduled job; document the periods in the policy |
| Data safety form (Google Play) / privacy labels (Apple) | Must match the real data flow | Declare: contact info, user content (photos, video), identifiers (device id, push token), purchases or payments info (mobile money numbers), diagnostics (crash data) |
| Mobile money numbers | Sensitive | Store only the number, never a PIN or card CVV; card data goes only to the payment gateway, never to Supabase (S4 Q31) |

## 5. Store listings

**Google Play first** (primary Ugandan Android audience); iOS follows once the Apple Developer account and APNs key exist (S4 Section 6).

| Asset | Content |
|---|---|
| Name and short description | Gabfix Home Solutions: home cleaning and repair services in Uganda (adjust wording to your voice) |
| Screenshots | Reuse real app screens: Home, Services (twin cards), Job scope, Confirm order, Bookings, Payments and Wallet; 4 to 8 per form factor (**confirm** current size rules) |
| Icon and feature graphic | Existing brand assets; no new colours |
| Support contact | `gabfixuganda@gmail.com`, `0703195401`, WhatsApp `0752777774` from `src/config/support.ts` (S1 D18) |
| Content rating | Complete the questionnaire honestly; no user-to-user chat except support |
| Test access | Provide a review login and a test OTP route for the store reviewer; disable it for real users |
| Release track | Internal testing, then closed testing, then production with a staged rollout (for example 10%, 50%, 100%) |

Note: Google Play may require a minimum closed-testing period for new personal developer accounts (**confirm** current rule) before production access.

## 6. Monitoring and analytics

| Need | Tool (confirm choice, Q36) | Minimum setup |
|---|---|---|
| Crash and error reporting | Sentry (`sentry-expo` successor, confirm package for SDK 58) or Firebase Crashlytics | Upload source maps in the `production` build; tag each event with app version and user id hash, **no phone numbers or message text** |
| Product analytics | Firebase Analytics or PostHog | Track only: booking started, scope completed, booking confirmed, payment succeeded/failed, ticket created, rating sent. No free-text content |
| Backend health | Supabase logs and alerts | Alert on 5xx rate on Edge Functions and on failed logins spike |
| Push queue | `push_queue` table (S4 Section 5.4) | Alert if any row is older than `send_after` + 15 minutes; alert on a rising share of `DeviceNotRegistered` receipts |
| Upload failures | `booking_media` with `status = 'failed'` | Daily count; investigate if more than 5% |
| Payments | `payments` with `status = 'failed'` | Same-day review until the gateway is stable |

Dashboards to build first: crash-free sessions, bookings per day, payment success rate, median time from booking to assignment.

## 7. Release gate (run before every store submission)

1. `npx tsc --noEmit`, lint and unit tests green (includes the quiet-hours, form-schema and media-limit tests, S4 Section 7).
2. Device matrix from S3 Section 7 passed on the `preview` build, plus two real Android devices on different Android versions and, when iOS is live, one iPhone.
3. Fresh install and upgrade-from-previous-build both tested (store migrations such as `profile-settings` v1 to v2, S1 4.2).
4. Airplane-mode and slow-network passes for booking, media upload and payments.
5. No `console.log` of personal data; no mock flag present in the production bundle (search the built config).
6. Privacy policy URL, deletion path and store forms match the actual data flow (Section 4).
7. Backend migrations applied to production **before** the binary is promoted, and the app tolerates the old and the new API during rollout.

## 8. Rollback plan

| Failure | Response |
|---|---|
| Bad OTA update | Republish the last good update to the `production` branch (**confirm** `eas update:rollback` or republish); no store action |
| Bad binary | Halt the staged rollout in the Play Console; keep the previous release live; fix forward with a patch build |
| Bad migration | Every migration has a down script written and tested on staging before it runs on production; take a database backup before each production migration |
| Push storm or wrong notification | Disable sending via a `notify_enabled` flag in a settings table checked by `notify` (add this in S4 Section 5.4), then purge `push_queue` |
| Payment gateway outage | Show the existing payment-failed state and keep the booking as unpaid; the Balance due card remains the recovery path |
| Compromised key | Rotate the Supabase keys and function secrets, revoke all sessions (`sessions.revoked_at`), and force sign-in on next refresh |

## 9. Launch checklist

- [ ] Staging and production Supabase projects created; migrations match
- [ ] Production EAS profile has no mock flags; keystore backed up
- [ ] Firebase and Expo push credentials uploaded (S4 Section 6)
- [ ] Privacy policy and terms live; in-app deletion works end to end
- [ ] Store listing, data safety form and screenshots complete
- [ ] Crash reporting and alerts verified with a deliberate test error
- [ ] Review account for the store reviewer ready
- [ ] Support inbox, phone and WhatsApp staffed for the first week
- [ ] Staged rollout started at 10%; crash-free sessions above 99% before widening

## 10. Open questions (defaults adopted)

| Q | Question | Default |
|---|---|---|
| Q36 | Crash and analytics vendor | Sentry for crashes; Firebase Analytics for events (already needed for push) |
| Q37 | Launch platforms | Android first; iOS after Apple account and APNs key |
| Q38 | Who staffs support at launch | You, using the three support channels, within the "one business day" promise (S2 Q25) |
| Q39 | Staged rollout steps | 10%, 50%, 100% over about one week |

Still needing you from earlier stages: the **dashboard stats image** (Q17), the SMS provider (S4 Q30) and the mobile money gateway (S4 Q31).

---

## 11. Hand-off summary (so any later document never repeats an instruction)

**Settled across S1 to S5, do not restate:** support contacts, Phase 9 naming, front-end scope, job-scope schema, media limits, profile layout, service-area removal, backend contract (tables, RLS, functions, push, cutover), and now build profiles, update policy, permissions, privacy and deletion, store plan, monitoring, release gate, rollback and launch checklist.

**New in this stage:** Sections 1 (EAS profiles), 2 (versions and OTA), 3 (permissions), 4 (privacy and deletion), 5 (store listings), 6 (monitoring), 7 (release gate), 8 (rollback), 9 (launch checklist), 10 (Q36 to Q39).

**One addition to an earlier document:** add a `notify_enabled` kill switch to S4 Section 5.4 (Section 8 above).

**Still unchecked:** everything marked confirm, plus the items listed in S4 Section 9 and S3 8.3.

**Context to drop:** S1 to S4 can be reduced to their hand-off sections; keep S1 layouts only while building screens.

**After Stage 5:** the document series is complete. The next useful step is not another guide but execution: apply S1 to S3 to the repo in the S3 Section 5 build order, run `npx tsc --noEmit`, then start the S4 cutover.
