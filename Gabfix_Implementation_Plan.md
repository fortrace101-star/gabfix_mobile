# Gabfix App: UI Implementation Plan

**Derived from:** `Gabfix_App_Ui_1.md` (design guide v1.3) and `Gabfix_App_Ui_2.md` (implementation specs v2.0)
**Stack:** React Native + Expo (TypeScript, Expo Router), iOS and Android
**Status:** Draft v1.0 | **Owner:** Product and design lead

---

## 1. Two Standing Requirements

These apply to **every phase** and are tracked in the plan, not treated as optional extras.

### 1.1 A Progress Document Must Be Created and Maintained

A living file, **`Gabfix_UI_Progress.md`**, records the progress of the interface design and build. It is created in **Phase 0** (a starter version accompanies this plan) and updated throughout.

| Rule | Detail |
|---|---|
| **Location** | Repository root, next to `README.md`, and versioned with the code |
| **Owner** | The design lead (updates design status) and the tech lead (updates build status) |
| **Update cadence** | At the **end of each working session that changes a screen**, at every **pull request merge**, and at the **end of each phase** (phase summary) |
| **Mandatory sections** | 1. Overall status and phase tracker 2. **Page tracker** (every page, P1 to P27, with design, build, Expo-guideline, accessibility, iOS and Android status) 3. Decisions log 4. Deviations from the guidelines (with reason and approver) 5. Open items and blockers 6. QA and device test results 7. Change log |
| **Status legend** | ⬜ Not started · 🟨 In progress · 🟦 In review · ✅ Done · 🚫 Blocked |
| **Definition of "Done"** | Matches the acceptance checklist (Part 2, Section 13) **and** the Expo guideline check (Section 2 of this plan) **and** is verified on a real iOS device and a real Android device |
| **Phase gate** | A phase cannot be closed until its pages are ✅ in the tracker and the phase summary is written |
| **Sharing** | The latest progress summary is shared with stakeholders at the end of each phase and every two weeks |

### 1.2 Expo Design Guidelines Must Be Applied

Expo publishes official guidance on building native-feeling interfaces (the **Expo documentation** under *Develop → User interface*, and the **Expo UI Guidelines** distributed as the `building-native-ui` skill in the `expo/skills` repository). These guidelines are applied to every screen, and the Gabfix design guides are the **brand layer on top**.

> **Verify before use:** Expo moves quickly. At the start of Phase 0 and again at the start of each phase, re-read the current Expo docs and the Expo UI Guidelines, and record the Expo SDK version and any guideline changes in the progress document (Decisions log). The summary below reflects the guidance found when this plan was written.

**How they are applied (principles and Gabfix decisions):**

| Expo guideline area | Principle | Gabfix decision |
|---|---|---|
| **Navigation** | Use Expo Router with **native stacks** for screen hierarchy; navigate with `<Link>` and `router`; set titles with `Stack.Screen options` | Adopt. Order flow, booking details and tracking are native stack screens. Modal flows use stack `presentation` options (`modal`, `formSheet` where suitable). |
| **Tabs** | Prefer **native tabs** for top-level sections where possible | **Decision gate in Phase 1:** prototype Expo Router native tabs. If they cannot deliver the yellow-pill active state and the badge from Part 2, Section 2.2, keep the custom tab bar and log the deviation. |
| **Sheets and modals** | Prefer platform sheets where they meet the need | Use native sheet presentation for simple sheets (confirmations, pickers). Keep `@gorhom/bottom-sheet` only for sheets that need custom snap points or inputs (Summary sheet, Reschedule, Cancel, Add-on details). |
| **Safe areas** | Use `react-native-safe-area-context` (`SafeAreaView` / `useSafeAreaInsets`) and never hard-code insets | Adopt. Already specified in Part 2, Section 1.2. A lint rule or review check flags hard-coded top and bottom paddings. |
| **Native controls** | Use native controls (Switch, date and time pickers, segmented controls, alerts, action sheets) where they fit | Use native `Switch`, `Alert` and share sheets. **Keep the custom date strip, slot chips and segmented control** (Part 2, P8 and P10) so the booking UI is identical on both platforms. Log as a justified deviation. |
| **Expo Go vs development builds** | Expo Go covers many expo-* packages; features needing custom native configuration need a **development build** | Use **EAS development builds** from Phase 0 (maps, notifications, secure storage, bottom sheets and Reanimated are verified on real builds, not only in Expo Go). |
| **Styling and layout** | Flexbox, consistent spacing scale, `gap`, platform-appropriate typography | Adopt. Tokens live in `theme.ts` (Part 2, Section 2.1). Brand fonts (Poppins, Inter) replace system fonts by design. |
| **Dark mode and semantic colours** | Use semantic colour tokens so dark mode is possible | Light mode at launch. Colours are already semantic tokens, so dark mode (Part 1, Section 10) can follow in Phase 2 of the product. |
| **Accessibility** | Roles, labels, hints, logical focus order, touch targets, Dynamic Type, Reduce Motion | Adopt. Touch targets use the **larger** of Apple (44) and Android (48) minimums. Rules in Part 2, Section 2.3. |
| **Animation** | Use Reanimated for entering, exiting and layout animation; honour reduced-motion settings | Adopt. Specs in Part 2, Section 11.1. |
| **Performance** | Efficient lists and images | Adopt: `FlashList`, `expo-image`, Hermes, lazy-loaded heavy screens. |
| **Icons and splash** | Configure through Expo config; test in a real build | Adopt. Splash uses the Gabfix badge on `green500`. Verified in EAS builds. |
| **Icons (system vs brand)** | iOS may use SF Symbols | Use one **cross-platform outline icon set** (Lucide or Phosphor) so iOS and Android match. Logged as a deviation. |

**Per-screen Expo check (run before marking any page ✅):**

- [ ] Uses the native stack and `Link` / `router` correctly; screen titles set through `Stack.Screen options`.
- [ ] Safe areas handled through `react-native-safe-area-context` (no hard-coded insets).
- [ ] Native controls used where the table above says so.
- [ ] Back gesture (iOS) and system back (Android) both behave correctly.
- [ ] Verified in an **EAS development build** on a real device, not only Expo Go or a simulator.
- [ ] Reduce Motion, larger text and screen reader checked.
- [ ] Any deviation from Expo guidance is written in the progress document with a reason.

---

## 2. Scope and Inputs

| Input | Source |
|---|---|
| Brand, colours, type, layout, components | Part 1, Sections 1 to 10 |
| Marketplace study and navigation | Part 1, Sections 11 to 13 |
| Page specs (27 pages, P1 to P27) | Part 2, Sections 4 to 12 |
| Payment model (MTN, Airtel, Visa, Cash, deposits) | Part 2, Section 3 |
| Dummy pricing, 18% VAT, deposit and late-fee rules | Part 1, 15.12 and Part 2, Section 0 |

**Out of scope for this plan:** backend services, the cleaner (partner) app and dark mode. The plan lists the **backend dependencies** the UI needs, so they can be scheduled in parallel.

---

## 3. Team and Assumptions

| Role | Count (assumed) |
|---|---|
| React Native / Expo engineers | 2 |
| UI/UX designer | 1 |
| QA engineer | 1 (from Phase 2) |
| Backend engineer | 1 to 2 (parallel, outside this plan) |

Estimates below are **planning estimates in working weeks for this team** and should be re-baselined after Phase 1.

---

## 4. Phases

### Phase 0: Setup and Alignment (Week 1)

**Goal:** a running app shell, tooling, and the process in place.

| # | Task | Output |
|---|---|---|
| 0.1 | Create the Expo project (TypeScript, Expo Router). Record the **Expo SDK version**. | Repo with CI |
| 0.2 | **Create `Gabfix_UI_Progress.md`** from the starter file, fill in the page tracker. | Progress document (Requirement 1.1) |
| 0.3 | **Review the current Expo docs and Expo UI Guidelines**, record findings and any changes to Section 1.2 in the Decisions log. | Requirement 1.2 |
| 0.4 | Set up **EAS** (development, preview, production profiles) and make the first dev builds for iOS and Android. | Installable builds |
| 0.5 | Install the stack from Part 1, 12.1 and Part 2, 1.3. Configure Reanimated, Gesture Handler, fonts and the splash hold. | Working dependencies |
| 0.6 | Configure lint, formatting, TypeScript strict mode, path aliases, and a check for hard-coded insets and colours. | CI checks |
| 0.7 | Create `config/pricing.ts` with the **dummy values** and a `config/payments.ts` with the deposit rule. | Config files |
| 0.8 | Resolve open items: **order-specification images**, payment aggregator, cash remittance process. | Decisions logged |

**Exit criteria:** app launches on a real iPhone and a real Android device from EAS builds; progress document exists; Expo review recorded.

---

### Phase 1: Foundations and UI Kit (Weeks 2 to 3)

**Goal:** everything pages are built from.

| # | Task | Reference |
|---|---|---|
| 1.1 | `theme.ts`, text styles, shadows, format helpers | Part 2, 2.1 |
| 1.2 | Core components: Button, Input (with ring), Chip, SelectableCard, SegmentedControl, CounterStepper, StatusChip, Card, Skeleton, Toast, EmptyState, ErrorState, OfflineBanner | Part 2, 2.2 and 6.0 |
| 1.3 | Navigation shell: auth stack, tab layout, order-flow modal stack, deep link scheme `gabfix://` | Part 1, 13.1 |
| 1.4 | **Tabs decision gate:** prototype native tabs, choose native or custom, log it. | Section 1.2 |
| 1.5 | Booking store (zustand, persisted) and `price()` function with unit tests | Part 2, 3.5, 3.6, 6.0 |
| 1.6 | API client (auth refresh, idempotency keys, offline-first query defaults), mock server for UI work | Part 2, 11.2 |
| 1.7 | **Component gallery screen** (dev only) showing every component and state | Visual QA |
| 1.8 | Unit tests: pricing, deposit validation, formatters | Part 2, 3.1 |

**Exit criteria:** gallery matches Part 1 and Part 2 on 360, 390 and 430 dp widths; pricing tests pass; tab decision logged.

---

### Phase 2: Onboarding and Auth (Weeks 4 to 5)

**Pages:** P1 Get Started, P2a Login, P2b Sign Up, P2c OTP, P2d Reset password, P3 Area selector.

| Key work | Notes |
|---|---|
| Slides pager, dots animation, illustrations | Prefetch images in the splash phase |
| Forms with `react-hook-form` and `zod` | Phone rule `^7\d{8}$` |
| OTP with SMS autofill | iOS `oneTimeCode`, Android `sms-otp` |
| Biometric login option | `expo-local-authentication` |
| Area selector with location permission pre-prompt | Part 2, P3 |

**Exit criteria:** a user can register, verify by OTP, choose an area and land on a placeholder Home, on both platforms.

---

### Phase 3: Discovery (Weeks 6 to 7)

**Pages:** P4 Home, P5 Search, P6 Services, P7 Service landing.

| Key work | Notes |
|---|---|
| Home blocks (offer banner, trust strip, categories, rebook, upcoming) | Trust numbers from the API only |
| Category chip bar with scroll-linked active state | Part 2, P6 |
| Service landing with parallax hero, sticky Book bar, FAQ accordion | Part 2, P7 |
| Skeleton states and pull to refresh | Part 2, 2.2 |

**Exit criteria:** browse from Home to a service landing page and tap **Book now**, which creates a draft.

---

### Phase 4: Order Flow and Payments (Weeks 8 to 10)

**Pages:** P8 Job details, P9 Add-ons, P10 Schedule, P11 Location, P12 Review and pay, P13 Payment authorisation, P14 Confirmed.

| Key work | Notes |
|---|---|
| Shared shell: stepper, top bar, summary bar, summary sheet | Part 2, 6.0 |
| Service form config (`serviceForms[slug]`) for variants | Part 1, 15.10 |
| Date strip, slot chips, availability loading | Part 2, P10 |
| Address and map with permission flow | Part 2, P11 |
| **Payment plans**: full, deposit (30%, 50%, custom), after service | Part 2, 3.1 |
| **Methods**: MTN, Airtel (push approval), Visa (hosted page, 3-D Secure), **Cash only after service** | Part 2, 3.3 |
| Polling, timeouts, failure and retry states | Part 2, P13 |
| Draft persistence, resume from Home | Part 2, 6.0 |

**Backend dependencies:** `POST /bookings`, `POST /payments`, `GET /payments/{id}`, availability, promos, aggregator webhooks.

**Exit criteria (end to end):** a booking can be created with each plan, each method (cash after service only) and a promo code, ending on P14 with correct deposit and balance figures. Verified with the **aggregator's test environment**.

---

### Phase 5: Booking Management (Weeks 11 to 12)

**Pages:** P15 My bookings, booking details and tracking, P16 Reschedule and Cancel, P17 Recurring plans, P18 Rebook, P19 Receipt.

| Key work | Notes |
|---|---|
| Booking list with tabs and `BookingCard` payment row | Part 2, P15a |
| Balance due and **Cash due** cards, pay online instead | Part 2, P15b |
| Live tracking (map, WebSocket with polling fallback) | Part 2, P15c |
| Late-fee warning, account balance for cash late fees | Part 2, 3.1, P16 |
| Receipt PDF through `expo-print` and `expo-sharing` | Part 2, P19 |

**Exit criteria:** a customer can track, reschedule, cancel (with correct refund or fee), repay a balance, and share a receipt.

---

### Phase 6: Supporting and Account Pages (Weeks 13 to 14)

**Pages:** P20 Offers and referral, P21 Reviews, P22 Help, P23 Policies, P24 Addresses, P25 Quote request, P26 States, P27a to f (Cleaner profile, Payments and wallet, Messages, Notifications, Profile, Rate and review).

| Key work | Notes |
|---|---|
| Push notifications (channels, payloads, deep links) | Part 2, 11.3 |
| Chat with WebSocket and optimistic send | Part 2, P27c |
| Wallet, methods, account balance | Part 2, P27b |
| Policies web view and in-app summaries | Part 2, P23 |
| Global empty, error and offline states applied across the app | Part 2, Section 10 |

---

### Phase 7: Web Admin Dashboard (parallel, Weeks 8 to 14)

**Page:** P27g (real CSS). Can run in parallel with Phases 4 to 6 by a separate engineer.

Modules: Overview, Bookings (assign cleaner), Payments, **Cash collections**, Customers, Cleaners, Services and pricing, Promos, Reports. Specs in Part 2, Section 12.

---

### Phase 8: Hardening and Release (Weeks 15 to 16)

| # | Task | Criteria |
|---|---|---|
| 8.1 | Accessibility pass (screen readers, 130% text, reduce motion, touch targets) | No blockers |
| 8.2 | Device matrix: at least 3 iPhones (small, standard, large) and 5 Android devices (low, mid, high; Android 10 and newer) | Pass on all |
| 8.3 | Performance: cold start under 3 s, smooth scroll, image sizes | Part 2, 11.5 |
| 8.4 | Network tests: 3G throttle, offline, flaky connections, draft recovery | Pass |
| 8.5 | Payments UAT with real sandbox flows for every plan and method | Signed off by finance |
| 8.6 | Security review: tokens in SecureStore, no card data, logs without PII | Passed |
| 8.7 | Store assets, permissions strings, privacy labels, icons and splash | Ready |
| 8.8 | EAS production builds, TestFlight and Google Play internal testing, beta feedback | Go or no-go |
| 8.9 | **Final progress report** completed in `Gabfix_UI_Progress.md` | Closed |

---

## 5. Timeline Summary (planning estimate)

| Week | 1 | 2 to 3 | 4 to 5 | 6 to 7 | 8 to 10 | 11 to 12 | 13 to 14 | 15 to 16 |
|---|---|---|---|---|---|---|---|---|
| Phase | 0 Setup | 1 Foundations | 2 Auth | 3 Discovery | 4 Order and payments | 5 Management | 6 Supporting | 8 Hardening |
| Parallel | | | | | 7 Admin dashboard (weeks 8 to 14) | | | |

Total: about **16 working weeks** to a release candidate, depending on backend readiness and the open decisions below.

---

## 6. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Aggregator not chosen or sandbox delayed | Blocks Phase 4 | Decide in Phase 0; build P12 and P13 against a mock payment service first |
| Order-specification images not received | Rework of P8 to P12 | Upload before Phase 4; reconcile fields in a short review |
| Native tabs cannot match the brand tab bar | Visual deviation | Decision gate in Phase 1; keep a custom tab bar and log it |
| Expo SDK changes break libraries | Delays | Pin the SDK, upgrade between phases only, test in EAS builds |
| Low-end Android performance | Poor experience in target market | Test early (Phase 3), use `FlashList` and `expo-image`, lazy-load maps |
| Cash handling and remittance process undefined | Admin and cleaner-app gaps | Decide in Phase 0; schedule the partner app flow |
| Pricing and policy values change | Rework | All values in config files; never hard-coded in UI |
| Mobile Money delays and timeouts | Failed or duplicate payments | Idempotency keys, polling with timeout, clear retry states |

---

## 7. Open Decisions (to log in the progress document)

| # | Decision | Needed by |
|---|---|---|
| 1 | Upload the **order-specification images** | Start of Phase 4 |
| 2 | **Payment aggregator** (MoMo push, Visa hosted page, webhooks) | Phase 0 |
| 3 | **Cash remittance** process (cleaner to Gabfix), and whether large cash bookings need a deposit | Phase 0 |
| 4 | Real **pricing**, deposit limits, late-fee and refund timelines | Before Phase 8 |
| 5 | **Native tabs or custom tab bar** | Phase 1 |
| 6 | Cleaner (partner) app scope and schedule | Phase 4 |
| 7 | Launch areas and catalogue (Part 1, 11.3) | Phase 3 |

---

## 8. Quality Gates Summary

A page is **Done** only when **all** are true:

1. Matches Part 1 and Part 2 (tokens, layout, behaviour, states).
2. Passes the **Expo per-screen check** (Section 1.2).
3. Passes the acceptance checklist (Part 2, Section 13).
4. Verified on a real iOS and a real Android device in an EAS build.
5. Entry in `Gabfix_UI_Progress.md` updated, including any deviations and who approved them.

A phase is **closed** only when its pages are Done, its exit criteria are met, and its phase summary is written in the progress document.
