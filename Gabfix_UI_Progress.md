# Gabfix UI Progress

**Living document.** Created in Phase 0 of `Gabfix_Implementation_Plan.md` and updated at the end of every working session that changes a screen, at every pull request merge, and at the end of each phase.

| | |
|---|---|
| **Last updated** | 2026-11-18 by engineering (Codebuff session) |
| **Expo SDK version** | 58.0.26 (Expo Router 58.0.32 · React Native 0.88.1 · React 19.3.0) |
| **Guidelines versions** | Part 1 v1.3 · Part 2 v2.0 · Plan v1.0 · Page_refactor v1.0 |
| **Current phase** | Phase 3 (Discovery) and Phase 4 (Order flow) in progress; P4, P5, P6, P8, P9 and P10 built |

**Status legend:** ⬜ Not started · 🟨 In progress · 🟦 In review · ✅ Done · 🚫 Blocked

> **Definition of Done reminder:** a page is ✅ only when it matches the guides, passes the Expo per-screen check, passes the Part 2 Section 13 acceptance checklist, and is verified on a real iOS **and** a real Android device in an EAS build. Nothing is marked ✅ yet because no EAS build or device pass has happened.

---

## 1. Overall Status

| Phase | Name | Planned weeks | Status | Summary written |
|---|---|---|---|---|
| 0 | Setup and Alignment | 1 | 🟨 In progress | 🟨 Partial |
| 1 | Foundations and UI Kit | 2 to 3 | 🟨 In progress | 🟨 Partial |
| 2 | Onboarding and Auth | 4 to 5 | 🟨 In progress | 🟨 Partial |
| 3 | Discovery | 6 to 7 | 🟨 In progress | 🟨 Partial |
| 4 | Order Flow and Payments | 8 to 10 | 🟨 In progress | 🟨 Partial |
| 5 | Booking Management | 11 to 12 | ⬜ Not started | ⬜ |
| 6 | Supporting and Account Pages | 13 to 14 | ⬜ Not started | ⬜ |
| 7 | Web Admin Dashboard (parallel) | 8 to 14 | ⬜ Not started | ⬜ |
| 8 | Hardening and Release | 15 to 16 | ⬜ Not started | ⬜ |

**Session outcome:** the brand foundation, shared UI kit, the Phase 2 auth flow and the first Phase 3/4 screens are built: the four-tab shell (Home, Services, Bookings, Profile) with the custom brand bar, the P4 Home dashboard shell, P5 Search with recent/popular terms and catalogue results, a P6 Services list, P8 Job Details, P9 Add-ons and P10 Schedule, plus the discovery layer (`GET /services`, `GET /search`, `GET /availability`) that falls back to local data until a backend is configured. The auth surfaces follow the `Page_refactor (1).md` design (Splash → Welcome → Login/Sign Up/Reset/OTP → Welcome Back → Area → Home). **0 of 40 pages are Done**; 15 pages have a build in place and await device and acceptance verification.

---

## 2. Page Tracker

A page is ✅ only when it matches the guides, passes the **Expo per-screen check**, passes the acceptance checklist (Part 2, Section 13), and is verified on a **real iOS and a real Android device** in an EAS build.

`Build ✅` here means the screen is implemented and passes typecheck, lint and a production web export. It does **not** mean device-verified.

| ID | Page | Phase | Design | Build | Expo check | A11y | iOS device | Android device | Notes / deviations |
|---|---|---|---|---|---|---|---|---|---|
| P0 | Splash | 2 | ✅ | ✅ | 🟨 | 🟨 | ⬜ | ⬜ | `Page_refactor` 5.1: badge + two-line wordmark on flat brand colour, 1.6 s, then `/welcome`. Native splash uses the same artwork. |
| P1 | Welcome | 2 | ✅ | ✅ | 🟨 | 🟨 | ⬜ | ⬜ | Built at `/welcome`; carousel, dots and skip removed. Interim art is the badge in a white disc (illustration pending, Open item 7). |
| P2a | Login | 2 | ✅ | ✅ | 🟨 | 🟨 | ⬜ | ⬜ | Glass pills on the brand gradient; Remember me + Forgot Password? on one 36-high row; Apple removed; SMS link under Login; success opens Welcome Back. Mock submit (no auth API). |
| P2b | Sign Up | 2 | ✅ | ✅ | 🟨 | 🟨 | ⬜ | ⬜ | Glass pills, Retype Password added, white-to-accent strength meter, area picker writes to the onboarding store. Terms/Privacy links open a placeholder alert (P23 not built). First name stored for Welcome Back. |
| P2c | OTP Verification | 2 | ✅ | ✅ | 🟨 | 🟨 | ⬜ | ⬜ | Glass code boxes, back chevron, resend timer, auto-submit. Verification mocked; `000000` exercises the error state. |
| P2d | Forgot / Reset Password | 2 | ✅ | ✅ | 🟨 | 🟨 | ⬜ | ⬜ | Email/Phone radios (Phone default), glass steps 2–3, success disc; mock submit. |
| P2e | Welcome Back | 2 | ✅ | ✅ | 🟨 | 🟨 | ⬜ | ⬜ | New post-login success screen (`/welcome-back`). Interim badge art in a disc with three white chips; Go To Home / Dashboard both route to `/home` until Phase 3. |
| P3 | Area Selector | 2 | ✅ | ✅ | 🟨 | 🟨 | ⬜ | ⬜ | Green gradient + glass search/location/rows and white selected pill. Search, grouped divisions, Coming soon + Notify me, foreground permission, reverse geocode. Provisional area list. |
| P4 | Home | 3 | 🟨 | 🟨 | ⬜ | ⬜ | ⬜ | ⬜ | First real shell at `/home` inside the `(tabs)` group: greeting + area pill hero, search entry, draft-resume card, trust strip, popular services grid and how-it-works. The grid now loads through `useServices()` (`GET /services`, bundled fallback); trust copy and promos are local and `GET /home` is still pending. |
| P5 | Search and Results | 3 | 🟨 | 🟨 | ⬜ | 🟨 | ⬜ | ⬜ | `/search`: 48-high search field with clear, popular chips, recent searches (AsyncStorage, max 8, Clear) and 300 ms debounced results that highlight the matched text. `GET /search?q=&areaId=` falls back to filtering the bundled catalogue. Empty state offers “Request a custom service” (P25 not built → alert). Rows open P8 details until the P7 landing exists. Entry points: Home search card and the Services header. |
| P6 | Services (Browse) | 3 | 🟨 | 🟨 | ⬜ | ⬜ | ⬜ | ⬜ | Shell list at `/services` reads `GET /services` through `useServices()`; the bundled catalogue is returned until `EXPO_PUBLIC_API_BASE_URL` is set, and an inline Retry appears on a failed fetch. A search button opens P5. Category chips and sections are still pending. |
| P7 | Service Landing | 3 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| P8 | Order: Job Details | 4 | 🟨 | 🟨 | ⬜ | ⬜ | ⬜ | ⬜ | `/book/[slug]/details`: cleaner/hour chips, frequency cards, materials segmented control, notes (300 chars), sticky price bar from `price()`, and a save-draft prompt on close/back. **Next** opens P9 and keeps the draft. |
| P9 | Order: Add-ons | 4 | 🟨 | 🟨 | ⬜ | ⬜ | ⬜ | ⬜ | `/book/[slug]/add-ons`: four extras from `config/add-ons.ts` and `pricing.addOns`, tap-anywhere toggle card with a visual checkbox, “What’s included” sheet (included / not included), duration in the summary bar, and the >8 h warning with “Add a cleaner”. **Next** opens P10. |
| P10 | Order: Schedule | 4 | 🟨 | 🟨 | ⬜ | 🟨 | ⬜ | ⬜ | `/book/[slug]/schedule`: 30-day strip (56 × 72 tiles, today outlined), month header with week-back/week-forward chevrons, three-per-row slot grid 07:00–16:00, fully booked slots struck through, “Few left” at ≤2 places, a 3-hour same-day lead, repeat summary (“Every Thursday at 7:00 am · starting 19 Nov”), the 24-hour change/cancel note, and a live total. **Next** stays disabled until a time is chosen and then alerts because P11 is not built. Availability comes from `GET /availability` with a local slot grid as fallback. |
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

**Count:** 0 of 40 pages Done. 13 page builds in place (P0, P1, P2a to P2e, P3, P4, P6 shell, P8, P9).

### Routes implemented

| Route | File | Purpose |
|---|---|---|
| `/` | `src/app/index.tsx` | **Default route:** P0 Splash |
| `/welcome` | `src/app/welcome.tsx` | P1 Welcome |
| `/login` | `src/app/login.tsx` | P2a |
| `/sign-up` | `src/app/sign-up.tsx` | P2b |
| `/otp` | `src/app/otp.tsx` | P2c |
| `/forgot-password` | `src/app/forgot-password.tsx` | P2d |
| `/area-select` | `src/app/area-select.tsx` | P3 (modal presentation) |
| `/welcome-back` | `src/app/welcome-back.tsx` | P2e post-login success |
| `/home` | `src/app/(tabs)/home.tsx` | P4 Home tab (the splash keeps `/`) |
| `/services` | `src/app/(tabs)/services.tsx` | P6 Services tab shell |
| `/bookings` | `src/app/(tabs)/bookings.tsx` | P15 empty state inside the tab shell |
| `/profile` | `src/app/(tabs)/profile.tsx` | P27e shell: identity, area shortcut, log out |
| `/search` | `src/app/search.tsx` | P5 Search and Results |
| `/book/[slug]/details` | `src/app/book/[slug]/details.tsx` | P8 Job Details |
| `/book/[slug]/add-ons` | `src/app/book/[slug]/add-ons.tsx` | P9 Add-ons |
| `/book/[slug]/schedule` | `src/app/book/[slug]/schedule.tsx` | P10 Schedule |

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
| 3 | 2026-11-17 | **Custom tab bar postponed; no tab shell yet** (bar style settled in #16) | Tabs belong to Phase 3 (P4 Home) | Engineering |
| 4 | 2026-11-17 | **Icons:** Lucide cross-platform outline set | Matches Part 1, Section 4.5 and keeps iOS/Android identical (deviation from Expo SF Symbols guidance) | Engineering, pending design approval |
| 5 | 2026-11-17 | **Auth forms use controlled state + shared validators** instead of `react-hook-form` + `zod` | Four short forms; fewer dependencies for this pass. Revisit before the order flow (P8 to P12) | Engineering, pending tech-lead approval |
| 6 | 2026-11-17 | **Location uses `expo-location`** foreground permission + reverse geocode to match a served area | Required by P3; permission is requested only from the "Use my current location" row | Engineering |
| 7 | 2026-11-17 | **Light mode only** (`userInterfaceStyle: "light"`) | Dark mode is out of scope for launch (Plan, Section 2) | Product |
| 8 | 2026-11-17 | **Onboarding flag in SecureStore not implemented** | Get Started must always be the default route in this build; gating can be added once the launch flow is signed off | Engineering |
| 9 | 2026-11-17 | Area catalogue is a provisional Kampala/Wakiso/Entebbe list with a few "Coming soon" entries | Lets P3 behave correctly before Product confirms launch areas (Open item 6) | Engineering, pending product approval |
| 10 | 2026-11-17 | **Adopt `Page_refactor (1).md` with Palette A (green/yellow)**; the Get Started carousel is replaced by a Splash at `/` and a single Welcome page at `/welcome` | Explicit product request; aligns every auth surface with one full-bleed glass design instead of white sheets | Product / engineering |
| 11 | 2026-11-17 | Login success goes to `/welcome-back`, and Home is reached only from its CTA | Matches the mockup flow; keeps the success moment visible before the dashboard | Product |
| 12 | 2026-11-17 | **Apple sign-in removed** on auth surfaces; Google retained | Mockup only has Google; Apple was an extra, not part of the refactor | Product |
| 13 | 2026-11-17 | **Session layer:** tokens persist in `expo-secure-store` on iOS/Android and `localStorage` on web, restored before the first frame; `useSessionStatus()` drives the Splash destination and guards `/home` | Without it a reload or token expiry lost the user, and every later phase needs one authenticated client. SecureStore has no web implementation, hence the platform split | Engineering |
| 14 | 2026-11-17 | **One HTTP core** (`src/lib/api/client.ts`) with bearer auth, a single 401 refresh-and-retry, `Idempotency-Key` support, 15 s timeout and a normalised `ApiError`; auth endpoints moved to `src/lib/api/auth.ts` | Phase 1.6 of the implementation plan; gives bookings and payments the same retry/idempotency behaviour instead of ad-hoc `fetch` calls | Engineering |
| 15 | 2026-11-17 | **Mock auth is kept** behind an unset `EXPO_PUBLIC_API_BASE_URL` (documented in `.env.example`) | The UI flow stays testable until the backend contract is confirmed; no mock code runs once the base URL is configured | Engineering |
| 16 | 2026-11-17 | **Custom tab bar, not Expo native tabs** (Phase 1.4 gate closed) | Evaluated `expo-router/native-tabs` in SDK 58 against `Gabfix_App_Ui_2.md` 2.2. The native API only exposes `backgroundColor` (iOS 26 draws the bar itself and ignores it), `labelStyle`, icon colours, `badgeBackgroundColor` and an Android-only `indicatorColor`; there is no pill behind the active icon, no 16 dp pill, no 20 dp bar corner radius and no upward custom shadow. Expo's own guide points to custom tabs when the design is not possible with system tabs, so the branded bar stays a custom `Tabs` `tabBar` | Engineering |
| 17 | 2026-11-17 | **Booking draft store is a hand-rolled `useSyncExternalStore` module with AsyncStorage**, not zustand | Matches the existing session/onboarding stores, keeps one dependency model, and AsyncStorage is already the Expo-supported persistence layer. Swap to zustand only if the order flow needs middleware/devtools | Engineering |
| 18 | 2026-11-18 | **Tabs use `expo-router/js-tabs` with the custom `BrandTabBar`**; the Home tab lives at `/home` instead of `/` | The plain `Tabs` export is deprecated in SDK 58 and native tabs cannot render the yellow active pill (Decision 16). `/home` keeps the splash on `/` | Engineering |
| 19 | 2026-11-18 | ~~P8 "Next" confirms the draft with an alert instead of navigating~~ (superseded by #20) | P9 add-ons did not exist yet; a dead route would have been worse than an explicit message | Engineering |
| 20 | 2026-11-18 | **P8 "Next" now pushes `/book/[slug]/add-ons`** (P9's half superseded by #23) | P9 is built, so the flow continues inside "Details" as the stepper already shows. A later page's back arrow returns to P8 without a save prompt; only the first page asks on close | Engineering |
| 21 | 2026-11-18 | **Discovery goes through `src/lib/api/discovery.ts` + `useServices()`**, with the bundled `src/config/services.ts` list as the fallback while `EXPO_PUBLIC_API_BASE_URL` is unset | Same mock pattern as auth (Decision 15): Home and Services read one catalogue source, and pointing the app at the backend needs no screen change. A failed fetch keeps the bundled list and shows an inline Retry | Engineering |
| 22 | 2026-11-18 | **P9's "What's included" sheet uses the platform `Modal`** at 70% height | `@gorhom/bottom-sheet` is not a dependency in this build and the settled Expo guidance prefers platform presentations for simple sheets; a 50% snap point can follow if the library is added for the order flow | Engineering |
| 23 | 2026-11-18 | **P9 "Next" now pushes `/book/[slug]/schedule`** and the schedule screen registers on the root stack with the iOS modal presentation | The stepper's Schedule step is built; the draft's `schedule` field carries the chosen date and time into the remaining order screens | Engineering |
| 24 | 2026-11-18 | **Search goes through `searchServices()` + `useServiceSearch()`** (300 ms debounce), and **availability through `getAvailability()` + `useAvailability()`**, both with local fallbacks | Same mock pattern as discovery (Decision 21): screens read one contract, so a configured backend needs no screen change. Recent searches are stored locally (max 8) because the spec does not require server-side history | Engineering |
| 25 | 2026-11-18 | **P10 defaults to tomorrow when no slot can start three hours out**, and the month chevrons move the selection by one week instead of opening a calendar | The 30-day strip is the whole date range in this build; landing on an empty “No times left” grid after 13:00 would look broken. A calendar month sheet needs a dependency that is not installed | Engineering |

---

## 5. Deviations from the Guidelines

Record anything that differs from Part 1, Part 2 or Expo guidance.

| Date | Page or area | Guideline | What was done instead | Reason | Approved by |
|---|---|---|---|---|---|
| 2026-11-17 | Icons | Expo/iOS: SF Symbols | Lucide outline set | Visual consistency across iOS and Android | _pending_ |
| 2026-11-17 | P0 / P1 | Route `app/(auth)/get-started.tsx` | Splash at `/` (`src/app/index.tsx`) and Welcome at `/welcome` | Product requirement: the first frame is the brand splash, then the single welcome page | _pending_ |
| 2026-11-17 | Auth forms | `react-hook-form` + `zod` | Controlled components + `src/utils/validation.ts` | Small forms, no new dependencies; revisit for the order flow | _pending_ |
| 2026-11-17 | P1 illustration | Authentic local photography | Branded gradient illustration (rings, icon tile, floating chip) | No photography supplied yet; spec allows gradient-only fallback | _pending_ |
| 2026-11-17 | Splash | Gabfix badge on `green500` | Flat `green500` with the real badge (168 px native, 120 px JS) and a two-line white/accent wordmark | Real logo supplied; native splash plugin now uses `gabfix-logo.png` | _pending_ |
| 2026-11-17 | Welcome, Welcome Back | Supplied character illustrations | Interim on-brand SVG illustrations (`welcome-illustration.tsx`, `welcome-back-illustration.tsx`) | Character art files not supplied; vector scenes keep the flow shippable and match the refactor | _pending_ |
| 2026-11-17 | Welcome heading | Accent colour on the brand name | `green700` instead of `yellow500` on the light hill | Yellow on the light-grey hill is ~1.3:1; deep green keeps the brand emphasis readable | _pending_ |
| 2026-11-18 | Date strip, slot chips, segmented control | Expo: prefer native controls | Custom `ChipSelector` and `SegmentedControl` in `src/components/booking/` | Identical booking UI on iOS and Android; the native controls do not match the design | _pending_ |
| 2026-11-18 | P9 "What's included" | Bottom sheet with a 50% snap point (Part 2, 2.2) | Platform `Modal` slide-up sheet at up to 70% height | No bottom-sheet dependency is installed; the sheet needs scrolling for longer lists | _pending_ |
| 2026-11-18 | P10 schedule | Month chevrons change the month and “Pick another date” opens a calendar | Chevrons move the selection by one week inside the 30-day strip; no calendar sheet | No calendar dependency is installed; the strip is the only booking horizon until a date picker is chosen | _pending_ |
| 2026-11-18 | P10 working hours | Server-defined availability | Local hourly grid 07:00–16:00 with a 3-hour same-day lead until `GET /availability` is live | Screens must work without a backend; slot rules are placeholder values (Open item 17) | _pending_ |

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
| 7 | **App icon and adaptive icon** — brand logo supplied (`assets/images/Gabfix.png`) and used by `LogoBadge`/native splash; Welcome and Welcome Back now use interim SVG illustrations, but launcher icons still use Expo starter art | Design | Phase 0 close | 🟡 |
| 8 | **EAS (Expo Build) profiles and first dev builds for iOS and Android** | Engineering | Phase 0 close | ⬜ |
| 9 | **Auth API contract + SMS OTP provider** (`/auth/*`) — typed calls, persisted sessions and refresh are implemented against the documented contract; payload/response shapes and `/auth/refresh` still need confirming against the real service | Backend | Phase 2 close | 🟡 |
| 10 | **Terms, Privacy and Payment/Refund copy** for P23 and the sign-up checkbox | Product and legal | Phase 2 close | ⬜ |
| 11 | Real device matrix pass (iOS + Android) for P1, P2a to P2d, P3, P4, P6 shell, P8 | QA | Phase 2 close | ⬜ |
| 12 | Social sign-in providers (Google, Apple) configuration | Backend / product | Post-Phase 2 | ⬜ |
| 13 | Biometric login setup (`expo-local-authentication`) | Engineering | Post-Phase 2 | ⬜ |
| 14 | Onboarding flag in SecureStore, if launch requires "show once" | Product | Before Phase 8 | ⬜ |
| 15 | **Confirm the `GET /services` contract** (`{ services: Service[] }`, `areaId` filter) before pointing the app at the backend | Backend | Phase 3 close | 🟡 |
| 16 | **Confirm the `GET /search` contract** (`{ services: Service[] }`, `q` and `areaId`) and whether recent searches should sync to the account | Backend | Phase 3 close | 🟡 |
| 17 | **Confirm the `GET /availability` contract** (`{ slots: { time, available, remaining }[]`) plus working hours, the same-day lead time and the booking horizon (30 days used) | Backend / operations | Phase 4 close | 🟡 |

---

## 7. QA and Device Test Results

| Date | Build | Device and OS | Pages tested | Result | Issues raised |
|---|---|---|---|---|---|
| 2026-11-17 | Local checkout (no EAS build) | Windows 11 · Node 22.22.1 · Expo SDK 58.0.26 | P0, P1, P2a to P2e, P3, placeholder P4 | `npx tsc --noEmit` ✅ · `npx expo lint` ✅ after the refactor (the earlier `npx expo export --platform web` pass covered the pre-refactor routes) | No real-device or simulator run; auth, OTP and location are mocked/untested against a live service. Stale Metro bundle on the phone was cleared by reinstalling Expo packages and restarting with `--clear`; Android bundle then compiled (HTTP 200), web rendered, and the hook error was not reproducible in either |
| 2026-11-17 | Local checkout (no EAS build) | Windows 11 · Node 22.22.1 · Expo SDK 58.0.26 | Auth module + session layer (all routes bundled) | `npx tsc --noEmit` ✅ · `npx expo lint` ✅ · `npx expo export --platform android` ✅ (Hermes bundle built) | Session restore, 401 refresh and sign-out are not verified against a live API or on a device |
| 2026-11-17 | Local checkout (no EAS build) | Node 22.22.1 · Expo SDK 58.0.26 | Foundations unit tests (4 suites, no UI) | `npx tsc --noEmit` ✅ · `npx expo lint` ✅ · `npm test` ✅ 41/41 (pricing, deposits, draft store, API client, session store) | Behaviour is proven against stubs only: AsyncStorage/SecureStore are mocked and `fetch` is stubbed, so no real backend or device was exercised |
| 2026-11-18 | Local checkout (no EAS build) | Windows 11 · Node 22.22.1 · Expo SDK 58.0.26 | Metro dev server (Windows watcher) | `npx expo start --clear --max-workers 3` ✅ · web bundle 200 (832 modules, ~19 s) · Android bundle 200 (1,402 modules, ~28 s) · ~322 handles / ~329 MB, no EMFILE and no heap OOM | Root cause: `@expo/metro-file-map` enables its native recursive watcher only on macOS, so Windows fell back to one `fs.watch` per directory and exhausted the handle limit. `metro.config.js` now forces the native watcher on `win32` behind a guarded patch and caps `maxWorkers` at 4 |
| 2026-11-18 | Local checkout (no EAS build) | Windows 11 · headless Chrome (web output) | P2a Login (390 × 844), plus code review of P4/P6/P8 | `npx tsc --noEmit` ✅ · `npx expo lint` ✅ · Remember me and Forgot Password? render on one 36-high row, checkbox vertically centred | Compact checkbox fixed (`flexBasis: 'auto'`; the base row's `flex: 1` had left the label at `flex-basis: 0%`, wrapping it letter by letter). The session guard redirects `/home` to `/login` without a session. Web static render can show `Requiring unknown module "NN"` if routes are added while Metro is running; restarting the server clears it |
| 2026-11-18 | Local checkout (no EAS build) | Windows 11 · headless Chrome (390 × 844) | P5 Search, P10 Schedule | `npx tsc --noEmit` ✅ · `npx expo lint` ✅ · typing “deep” gave “1 result for “deep”” with the match highlighted and the row opened `/book/deep-clean/details` · going back and clearing the field listed “deep” under Recent searches · “zzz” showed the empty state with **Request a custom service** · P10 rendered 30 date tiles and the 07:00–16:00 grid on the selected day, fully booked slots disabled, **Next** disabled until a time was picked, then “Every Thursday at 7:00 am · starting 19 Nov” and `schedule: { dateISO: '2026-11-19', startTime: '07:00' }` in the persisted draft | Run at 17:50 local: today correctly hid all slots under the 3-hour lead, which is why P10 now defaults to tomorrow. No native run; calendar, keyboard avoidance and the availability skeleton were not exercised on hardware |
| 2026-11-18 | Local checkout (no EAS build) | Windows 11 · headless Chrome (390 × 844) | P8 → P9, P4 Home, P6 Services | `npx tsc --noEmit` ✅ · `npx expo lint` ✅ · P8 **Next** reaches `/book/home-clean/add-ons` · 4 add-on cards and 4 “What's included” links render · the sheet lists “Not included” without toggling the card · toggling 4 extras gave `6 h · 4 extras` / UGX 81,420 → `5.5 h · 3 extras` / UGX 71,980 · selecting 8 h then one extra showed “This booking is 8.5 h long” with **Add a cleaner** · Home and Services each rendered the 4 bundled services through `useServices()` | Unlike React Native, RN Web does not map `accessibilityState.checked` to the DOM, so the card also sets `aria-checked`. No native or device run; the sheet and haptics were not exercised on hardware |
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
Delivered (1.6, partial): HTTP core `src/lib/api/client.ts` (bearer auth, 401 refresh-and-retry, idempotency keys, timeout, `ApiError`), typed auth endpoints in `src/lib/api/auth.ts`, session bridge, persistent session store `src/store/session.ts`, secure storage adapter (`expo-secure-store`, `localStorage` on web) and `.env.example`.
Delivered (1.5 + 1.8): booking model and `price()` preview (`src/lib/pricing.ts`), add-on/promo catalogue and deposit rules from the spec, persisted draft store (`src/store/booking.ts`: start, patch, add-ons, promo, reset, boot hydration) wired into the root layout, and the Jest foundation (`jest-expo`, `jest`, `@types/jest`, `npm test`) with 41 tests across pricing, deposit validation, the draft store, the API client and the session store.
Delivered (1.4): native-tabs gate closed — custom tab bar retained (Decision 16); the shell itself landed on 2026-11-18 with P4.
Outstanding: dev-only component gallery, Toast/Skeleton/Sheet/StatusChip components, CI check for hard-coded colours and insets, formatter tests.
Next: complete the remaining foundations before Phase 3 discovery screens.

### Phase 2 — In progress
Delivered: the `Page_refactor` auth system — `AuthScreen`, `Blob`, `BrandMark`, `GlassInput`, `PillButton`, `SocialButton`, `OrDivider`, `RadioPill`, `LoadingOverlay` and the SVG Google glyph; P0 Splash (1.6 s, native-splash hand-off); P1 Welcome (single page, Let's Go pill); P2a Login (glass pills, Remember me + Forgot Password? row, SMS link, Google only); P2b Sign Up (Retype Password, strength meter, area picker, consent); P2c OTP (glass code boxes); P2d Reset Password (Email/Phone radios, glass steps, success disc); P2e Welcome Back; rethemed P3 Area Selector and placeholder `/home`.
Changed: the Get Started carousel, white auth sheets, centred badge headers, Apple button and negative-margin options row are gone; every auth page is a full-bleed green gradient with yellow blobs; app display name is **Gabfix Home Solutions**; Poppins 400/500 loaded; auth loading uses the dimmed page + pulsing logo + `Loading..`.
Changed (architecture): auth calls now go through `src/lib/api/client.ts`; login and OTP verification open a persisted session (`startSession`) that survives reloads, refreshes once on 401 and signs out when refresh fails; Splash sends signed-in users to Welcome Back and `/home` redirects to Login without a session; Log out clears the stored session.
Slipped: contract confirmation against a live API, biometric login, policies copy, onboarding "show once" flag, final illustrations and all device verification.
Next: confirm `/auth/*` and `/auth/refresh` against the backend, supply the two illustrations, run the device matrix, then close Phase 2 and start Phase 3 (P4 Home, P5 to P7).

### Phase 3 — In progress
Delivered: P4 Home at `/home` (brand hero with area pill and notifications, search entry, booking-draft resume card, trust strip, popular-services grid, how-it-works), the four-tab shell (`src/app/(tabs)/_layout.tsx`) with the custom `BrandTabBar` and a session guard, a P6 Services list, and P5 Search at `/search` (popular chips, recent searches, debounced catalogue results with match highlighting and an empty state).
Changed: `src/app/home.tsx` was replaced by the `(tabs)` group; tab navigation now uses `expo-router/js-tabs` because plain `Tabs` is deprecated in SDK 58 and native tabs cannot render the brand pill. Both tabs now read the catalogue from `useServices()` (`GET /services`), which returns the bundled `src/config/services.ts` list until an API base URL is configured. Search is a separate root route so it can be opened from Home and from the Services header.
Slipped: category chips, service landing (P7), the `/home` discovery payload, promos and dynamic trust copy; recent searches do not sync across devices; no device verification.
Next: build P7 service landing, confirm the `/services` and `/search` contracts, wire `/home`, then replace the remaining local copy.

### Phase 4 — In progress
Delivered: P8 Job Details at `/book/[slug]/details` with `ChipSelector` (cleaners, hours), `SelectableCard` frequency options, `SegmentedControl` for materials, a 300-character notes field, `StepperHeader`, `SummaryBar` and a save/discard prompt on close and Android back; P9 Add-ons at `/book/[slug]/add-ons` with four extras, tap-anywhere toggle cards, a “What's included” sheet, duration in the summary bar and the >8 h cleaner warning; P10 Schedule at `/book/[slug]/schedule` with the 30-day `DateStrip`, `SlotChips`, availability states, repeat summary and a disabled-until-ready **Next**.
Changed: a service slug starts or resumes one persisted draft; the totals come from `price()` in `src/lib/pricing.ts`, so no order screen talks to a backend. P8's **Next** opens P9, P9's opens P10, and all three routes are registered on the root stack with the modal presentation on iOS. Slot data is read through `useAvailability()` (`GET /availability`), which falls back to a local grid.
Slipped: location/contact, review/pay, payment and confirmation; P10's **Next** acknowledges that P11 is not built yet. The month calendar, summary sheet, promo entry and service-specific form variants are still outstanding.
Next: implement P11 location and contact over the draft's `location` field, point P10's "Next" at it, then continue through P14.

---

## 9. Change Log

| Date | Author | Change |
|---|---|---|
| 2026-11-17 | Engineering | Progress document created and populated from the starter template |
| 2026-11-17 | Engineering (Codebuff) | Built Phase 0 foundations, Phase 1 UI kit and Phase 2 onboarding/auth screens; made Get Started the default route; added Expo guidance review, decisions, deviations, open items and test evidence |
| 2026-11-17 | Engineering (Codebuff) | Replaced the placeholder `LogoBadge` SVG with the supplied Gabfix artwork (`assets/images/Gabfix.png`, 512 px transparent copy at `assets/images/gabfix-logo.png`); app icon, adaptive icon and splash still use Expo starter art |
| 2026-11-17 | Engineering (Codebuff) | Applied `Page_refactor (1).md`: new auth component kit, Splash + Welcome + Welcome Back routes, rebuilt Login/Sign Up/Reset/OTP, rethemed Area Select and Home, renamed the app to Gabfix Home Solutions, aligned Expo SDK 58 packages, cleared stale Metro caches and fixed the development-bundle hook error |
| 2026-11-17 | Engineering (Codebuff) | Added the session/API architecture: `expo-secure-store` session persistence with a web fallback, `restoreSession` before the first frame, persistent session store, refresh-on-401 HTTP core with idempotency keys, auth endpoints moved to `src/lib/api/auth.ts`, Splash/session routing and a `/home` guard, plus `.env.example` |
| 2026-11-17 | Engineering (Codebuff) | Added the order-flow foundation: `src/lib/pricing.ts` (typed draft, `price()` with tiers, materials, add-ons, frequency and promo discounts, VAT), dummy add-on/promo catalogue, persisted booking draft store with boot hydration, and a Jest setup (jest-expo) with 41 unit tests for pricing, deposits, the draft store, the API client and the session store |
| 2026-11-17 | Engineering (Codebuff) | Closed the Phase 1.4 tab gate: native tabs in Expo SDK 58 cannot express the brand pill, bar radius or shadow, so the custom tab bar from Part 2 is retained (Decision 16) |
| 2026-11-18 | Engineering (Codebuff) | Fixed the Windows Metro crash: forced the native recursive watcher in `metro.config.js` (Expo only enables it on macOS) and capped workers, clearing EMFILE, cache-write and heap failures |
| 2026-11-18 | Engineering (Codebuff) | Built the P4 Home shell, the four-tab shell with `BrandTabBar`, the P6 Services list and P8 Job Details; deleted the Phase 2 placeholder `/home`; added `src/config/services.ts` and the booking components (`ChipSelector`, `SelectableCard`, `SegmentedControl`, `StepperHeader`, `SummaryBar`) |
| 2026-11-18 | Engineering (Codebuff) | Fixed the Login "Remember me" label collapsing to zero width (the base row's `flex: 1` left `flex-basis: 0%`; the compact variant now sets `flexBasis: 'auto'`) and confirmed the 36-high options row in a 390 × 844 web render |
| 2026-11-18 | Engineering (Codebuff) | Built P9 Add-ons: `config/add-ons.ts` display metadata, `AddOnCard`, the `AddOnSheet` inclusions sheet, `/book/[slug]/add-ons`, the >8 h warning with "Add a cleaner", and P8's **Next** now navigating to P9; registered both order routes on the root stack |
| 2026-11-18 | Engineering (Codebuff) | Added the discovery layer: `src/lib/api/discovery.ts` (`GET /services?areaId=`) and `useServices()` with the bundled catalogue as the no-backend fallback; Home and Services now read from it, with an inline Retry on failure |
| 2026-11-18 | Engineering (Codebuff) | Built P10 Schedule: `DateStrip`, `SlotChips`, `src/lib/api/availability.ts` + `useAvailability()` with a local slot fallback, `/book/[slug]/schedule` (repeat summary, availability states, disabled Next), and P9's **Next** now opens it |
| 2026-11-18 | Engineering (Codebuff) | Built P5 Search: `/search` with popular chips, recent searches (`src/lib/recent-searches.ts`, max 8), 300 ms debounced `searchServices()` + `useServiceSearch()`, match highlighting, skeleton and empty states; wired the Home search card and a Services header button, and registered the route on the root stack |
