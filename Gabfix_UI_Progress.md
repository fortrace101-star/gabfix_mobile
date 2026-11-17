# Gabfix UI Progress

**Living document.** Created in Phase 0 of `Gabfix_Implementation_Plan.md` and updated at the end of every working session that changes a screen, at every pull request merge, and at the end of each phase.

| | |
|---|---|
| **Last updated** | 2026-11-17 by engineering (Codebuff session) |
| **Expo SDK version** | 58.0.25 (Expo Router 58.0.31 · React Native 0.88.1 · React 19.3.0) |
| **Guidelines versions** | Part 1 v1.3 · Part 2 v2.0 · Plan v1.0 |
| **Current phase** | Phase 2: Onboarding and Auth (in progress) |

**Status legend:** ⬜ Not started · 🟨 In progress · 🟦 In review · ✅ Done · 🚫 Blocked

> **Definition of Done reminder:** a page is ✅ only when it matches the guides, passes the Expo per-screen check, passes the Part 2 Section 13 acceptance checklist, and is verified on a real iOS **and** a real Android device in an EAS build. Nothing is marked ✅ yet because no EAS build or device pass has happened.

---

## 1. Overall Status

| Phase | Name | Planned weeks | Status | Summary written |
|---|---|---|---|---|
| 0 | Setup and Alignment | 1 | 🟨 In progress | 🟨 Partial |
| 1 | Foundations and UI Kit | 2 to 3 | 🟨 In progress | 🟨 Partial |
| 2 | Onboarding and Auth | 4 to 5 | 🟨 In progress | 🟨 Partial |
| 3 | Discovery | 6 to 7 | ⬜ Not started | ⬜ |
| 4 | Order Flow and Payments | 8 to 10 | ⬜ Not started | ⬜ |
| 5 | Booking Management | 11 to 12 | ⬜ Not started | ⬜ |
| 6 | Supporting and Account Pages | 13 to 14 | ⬜ Not started | ⬜ |
| 7 | Web Admin Dashboard (parallel) | 8 to 14 | ⬜ Not started | ⬜ |
| 8 | Hardening and Release | 15 to 16 | ⬜ Not started | ⬜ |

**Session outcome:** the brand foundation, shared UI kit and the complete Phase 2 onboarding/auth flow are built. **0 of 38 pages are Done**; 7 pages have a build in place and await device and acceptance verification.

---

## 2. Page Tracker

A page is ✅ only when it matches the guides, passes the **Expo per-screen check**, passes the acceptance checklist (Part 2, Section 13), and is verified on a **real iOS and a real Android device** in an EAS build.

`Build ✅` here means the screen is implemented and passes typecheck, lint and a production web export. It does **not** mean device-verified.

| ID | Page | Phase | Design | Build | Expo check | A11y | iOS device | Android device | Notes / deviations |
|---|---|---|---|---|---|---|---|---|---|
| P1 | Get Started | 2 | ✅ | ✅ | 🟨 | 🟨 | ⬜ | ⬜ | Built at `/` (default route), not `(auth)/get-started`. 3 slides, autoplay, skip, dots, yellow CTA. No real photography yet; supplied illustration fallback used. |
| P2a | Login | 2 | ✅ | ✅ | 🟨 | 🟨 | ⬜ | ⬜ | Mock submit (no auth API). Google/Apple buttons show a "not connected" alert. |
| P2b | Sign Up | 2 | ✅ | ✅ | 🟨 | 🟨 | ⬜ | ⬜ | Area picker writes to the onboarding store. Terms/Privacy links open a placeholder alert (P23 not built). |
| P2c | OTP Verification | 2 | ✅ | ✅ | 🟨 | 🟨 | ⬜ | ⬜ | 6 boxes, auto-advance, paste, resend timer, auto-submit. Verification mocked; `000000` exercises the error state. |
| P2d | Forgot / Reset Password | 2 | ✅ | ✅ | 🟨 | 🟨 | ⬜ | ⬜ | 4 steps with cross-fade and success check. Mock submit. |
| P3 | Area Selector | 2 | ✅ | ✅ | 🟨 | 🟨 | ⬜ | ⬜ | Search, grouped divisions, Coming soon + Notify me, foreground permission, reverse geocode. Provisional area list. |
| P4 | Home | 3 | 🟨 | 🟨 | ⬜ | ⬜ | ⬜ | ⬜ | **Placeholder only** to satisfy the Phase 2 exit criteria; the real dashboard is Phase 3. |
| P5 | Search and Results | 3 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| P6 | Services (Browse) | 3 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| P7 | Service Landing | 3 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| P8 | Order: Job Details | 4 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| P9 | Order: Add-ons | 4 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| P10 | Order: Schedule | 4 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| P11 | Order: Location and Contact | 4 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| P12 | Order: Review and Pay | 4 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| P13 | Payment Authorisation | 4 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| P14 | Booking Confirmed | 4 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| P15a | My Bookings | 5 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| P15b | Booking Details | 5 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| P15c | Live Tracking | 5 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| P16 | Reschedule, Cancel, Late-Fee | 5 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| P17 | Recurring Plans | 5 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| P18 | Rebook / Same Cleaner | 5 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| P19 | Receipt / Invoice | 5 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| P20 | Offers and Refer and Earn | 6 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| P21 | Reviews List | 6 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| P22 | Help Centre and Contact | 6 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| P23 | Policies | 6 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| P24 | Saved Addresses | 6 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| P25 | Quote Request | 6 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| P26 | States and Edge Cases | 6 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| P27a | Cleaner Profile | 6 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| P27b | Payments and Wallet | 6 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| P27c | Messages and Chat | 6 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| P27d | Notifications | 6 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| P27e | Profile and Settings | 6 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| P27f | Rate and Review | 6 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| P27g | Web Admin Dashboard | 7 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |

**Count:** 0 of 38 pages Done. 7 page builds in place (P1, P2a to P2d, P3, placeholder P4).

### Routes implemented

| Route | File | Purpose |
|---|---|---|
| `/` | `src/app/index.tsx` | **Default route:** P1 Get Started |
| `/login` | `src/app/login.tsx` | P2a |
| `/sign-up` | `src/app/sign-up.tsx` | P2b |
| `/otp` | `src/app/otp.tsx` | P2c |
| `/forgot-password` | `src/app/forgot-password.tsx` | P2d |
| `/area-select` | `src/app/area-select.tsx` | P3 (modal presentation) |
| `/home` | `src/app/home.tsx` | Phase 2 placeholder destination |

---

## 3. Expo Guideline Reviews

| Date | Expo SDK | Sources reviewed (docs and Expo UI Guidelines) | Findings and changes to the plan |
|---|---|---|---|
| 2026-11-17 | 58.0.25 | `https://docs.expo.dev/llms.txt`, `https://docs.expo.dev/versions/v58.0.0/sdk/font/`, SDK 58 versioned package docs, installed type definitions | 1. `expo-font` still supports runtime `useFonts` on all platforms; the config plugin is preferred for native builds, so move Poppins/Inter to the plugin before EAS production builds. 2. Row level APIs changed in React Native 0.88 types: `ViewToken` is now `ListViewToken` and `StyleSheet.absoluteFillObject` is gone; implementation adjusted. 3. React Compiler lint rejects `ref.current` during render; Animated values now initialise through `useState`. 4. Expo services are now named Expo Build/Update/Submit while `eas` commands and `eas.json` keep their names. 5. Native tabs exist in SDK 58; the native-vs-custom tab decision stays at the Phase 1 gate (no tab shell built yet). |

**Per-screen check status:** stack navigation, safe areas, back behaviour, labels and reduced-motion handling are implemented, but the check is 🟨 because no EAS development build has been run on a real device.

---

## 4. Decisions Log

| # | Date | Decision | Reason | Decided by |
|---|---|---|---|---|
| 1 | 2026-11-17 | **Get Started is the default route at `/`** (`src/app/index.tsx`), not `app/(auth)/get-started.tsx` | Explicit product requirement for this build; avoids a redirect flash on launch | Product / engineering |
| 2 | 2026-11-17 | Auth screens live at root routes (`/login`, `/sign-up`, `/otp`, `/forgot-password`, `/area-select`) | Keeps the default route clean and avoids an `(auth)` group that would still resolve to `/get-started` | Engineering |
| 3 | 2026-11-17 | **Custom tab bar postponed; no tab shell yet** | Tabs belong to Phase 3 (P4 Home); the Phase 1 native-tabs prototype decision gate remains open | Engineering |
| 4 | 2026-11-17 | **Icons:** Lucide cross-platform outline set | Matches Part 1, Section 4.5 and keeps iOS/Android identical (deviation from Expo SF Symbols guidance) | Engineering, pending design approval |
| 5 | 2026-11-17 | **Auth forms use controlled state + shared validators** instead of `react-hook-form` + `zod` | Four short forms; fewer dependencies for this pass. Revisit before the order flow (P8 to P12) | Engineering, pending tech-lead approval |
| 6 | 2026-11-17 | **Location uses `expo-location`** foreground permission + reverse geocode to match a served area | Required by P3; permission is requested only from the "Use my current location" row | Engineering |
| 7 | 2026-11-17 | **Light mode only** (`userInterfaceStyle: "light"`) | Dark mode is out of scope for launch (Plan, Section 2) | Product |
| 8 | 2026-11-17 | **Onboarding flag in SecureStore not implemented** | Get Started must always be the default route in this build; gating can be added once the launch flow is signed off | Engineering |
| 9 | 2026-11-17 | Area catalogue is a provisional Kampala/Wakiso/Entebbe list with a few "Coming soon" entries | Lets P3 behave correctly before Product confirms launch areas (Open item 6) | Engineering, pending product approval |

---

## 5. Deviations from the Guidelines

Record anything that differs from Part 1, Part 2 or Expo guidance.

| Date | Page or area | Guideline | What was done instead | Reason | Approved by |
|---|---|---|---|---|---|
| 2026-11-17 | Icons | Expo/iOS: SF Symbols | Lucide outline set | Visual consistency across iOS and Android | _pending_ |
| 2026-11-17 | P1 Get Started | Route `app/(auth)/get-started.tsx` | Route `/` (`src/app/index.tsx`) | Product requirement: Get Started is the default route | _pending_ |
| 2026-11-17 | Auth forms | `react-hook-form` + `zod` | Controlled components + `src/utils/validation.ts` | Small forms, no new dependencies; revisit for the order flow | _pending_ |
| 2026-11-17 | P1 illustration | Authentic local photography | Branded gradient illustration (rings, icon tile, floating chip) | No photography supplied yet; spec allows gradient-only fallback | _pending_ |
| 2026-11-17 | Splash | Gabfix badge on `green500` | Plain `green500` splash | Gabfix logo/app-icon assets not supplied; Expo badge cannot ship | _pending_ |
| — | Date strip, slot chips, segmented control | Expo: prefer native controls | Custom components (planned) | Identical booking UI on iOS and Android; not built yet | _pending_ |

---

## 6. Open Items and Blockers

| # | Item | Owner | Needed by | Status |
|---|---|---|---|---|
| 1 | Upload order-specification images | Product | Start of Phase 4 | ⬜ |
| 2 | Choose payment aggregator | Product and finance | Phase 0 | ⬜ |
| 3 | Define cash remittance; large-cash deposit rule | Operations | Phase 0 | ⬜ |
| 4 | Replace dummy pricing and policy values | Product and finance | Before Phase 8 | ⬜ |
| 5 | Partner (cleaner) app scope and schedule | Product | Phase 4 | ⬜ |
| 6 | Confirm launch areas and Phase 1 catalogue | Product | Phase 3 | ⬜ |
| 7 | **App icon, adaptive icon, splash artwork** — brand logo supplied (`assets/images/Gabfix.png`), now used by `LogoBadge` | Design | Phase 0 close | 🟡 |
| 8 | **EAS (Expo Build) profiles and first dev builds for iOS and Android** | Engineering | Phase 0 close | ⬜ |
| 9 | **Auth API contract + SMS OTP provider** (`/auth/*`) | Backend | Phase 2 close | ⬜ |
| 10 | **Terms, Privacy and Payment/Refund copy** for P23 and the sign-up checkbox | Product and legal | Phase 2 close | ⬜ |
| 11 | Real device matrix pass (iOS + Android) for P1, P2a to P2d, P3 | QA | Phase 2 close | ⬜ |
| 12 | Social sign-in providers (Google, Apple) configuration | Backend / product | Post-Phase 2 | ⬜ |
| 13 | Biometric login setup (`expo-local-authentication`) | Engineering | Post-Phase 2 | ⬜ |
| 14 | Onboarding flag in SecureStore, if launch requires "show once" | Product | Before Phase 8 | ⬜ |

---

## 7. QA and Device Test Results

| Date | Build | Device and OS | Pages tested | Result | Issues raised |
|---|---|---|---|---|---|
| 2026-11-17 | Local checkout (no EAS build) | Windows 11 · Node 22.22.1 · Expo SDK 58.0.25 | P1, P2a, P2b, P2c, P2d, P3, placeholder P4 | `npx tsc --noEmit` ✅ · `npx eslint src --max-warnings=0` ✅ · `npx expo export --platform web` ✅ (all seven routes bundled) | No real-device or simulator run; auth, OTP and location are mocked/untested against a live service |
| — | — | iOS / Android devices | — | ⬜ Not run | EAS profiles and dev builds outstanding |

**Not yet verified:** native gestures (iOS swipe back, Android system back), keyboard behaviour on small screens, 130% text, screen reader labels, reduced motion, location permission dialogs, SMS OTP autofill, and 360/390/430 dp layout passes.

---

## 8. Phase Summaries

_Write one entry at the end of each phase: what was delivered, what changed, what slipped and why, and next steps._

### Phase 0 — In progress
Delivered: Expo SDK 58 project confirmed; progress document created and maintained; brand tokens and shared styles; `config/pricing.ts`, `config/payments.ts` and the provisional `config/areas.ts`; brand fonts, gradient, haptics, icons and location installed with `expo install`; app name/scheme (`gabfix://`), light UI style, green splash and location permission strings; lint and TypeScript strict checks runnable.
Slipped: EAS profiles and first development builds, CI wiring, component-gallery automation, brand icon/splash artwork (Open items 7 and 8).
Next: initialise Expo Build profiles, produce iOS/Android dev builds, then close Phase 0.

### Phase 1 — In progress
Delivered: `theme.ts` equivalents (`src/theme/tokens.ts`, `styles.ts`), text styles, shadows, formatters (`ugx`, `phoneUG`, `maskPhone`, `dateLong`, `time12`), validators, haptics helpers; UI kit `Button`, `Input`, `Checkbox`, `CodeInput`, `TopBar`, `LogoBadge`; root native stack and font loading with the splash held until fonts resolve.
Outstanding: native-vs-custom tab bar decision and shell, persisted booking store and `price()` tests, API client/mock server, dev-only component gallery, Toast/Skeleton/Sheet/StatusChip components, CI check for hard-coded colours and insets.
Next: complete the remaining foundations before Phase 3 discovery screens.

### Phase 2 — In progress
Delivered: P1 Get Started (three slides, 4 s autoplay paused on touch, skip, animated dots, yellow CTA, login link); P2a Login (remember me, SMS-code alternative, Apple on iOS, mocked social entry points); P2b Sign Up (Ugandan phone rule, password strength, area picker, consent); P2c OTP (six boxes, auto-advance, paste, backspace, resend timer, auto-submit, error state, SMS autofill hints); P2d Forgot/Reset (four animated steps with success state); P3 Area Selector (search, grouped divisions, Coming soon/Notify me, current-location permission and reverse geocode); placeholder `/home` landing.
Changed: Get Started is the default route; auth screens are root routes; auth is mocked because no API exists.
Slipped: real API integration, biometric login, policies copy, onboarding "show once" flag and all device verification.
Next: connect `/auth/*`, run the device matrix, then close Phase 2 and start Phase 3 (P4 Home, P5 to P7).

---

## 9. Change Log

| Date | Author | Change |
|---|---|---|
| 2026-11-17 | Engineering | Progress document created and populated from the starter template |
| 2026-11-17 | Engineering (Codebuff) | Built Phase 0 foundations, Phase 1 UI kit and Phase 2 onboarding/auth screens; made Get Started the default route; added Expo guidance review, decisions, deviations, open items and test evidence |
| 2026-11-17 | Engineering (Codebuff) | Replaced the placeholder `LogoBadge` SVG with the supplied Gabfix artwork (`assets/images/Gabfix.png`, 512 px transparent copy at `assets/images/gabfix-logo.png`); app icon, adaptive icon and splash still use Expo starter art |
