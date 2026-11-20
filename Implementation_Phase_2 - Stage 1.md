# Implementation_Phase_2.md: Gabfix Home Solutions

Phase 2 implementation guide. Workstreams A to D are the first draft. **Workstreams E to J (Sections 11 to 16) were added on 2026-11-20 from the second change list (23 items).** Sections 5, 6, 8, 9 and 10 cover all ten workstreams.

| # | Workstream | What it delivers |
|---|---|---|
| A | **Support contact details** | One source of truth for the support phone, WhatsApp and email, used by every inquiry surface |
| B | **Job scope and media step** | A new order-flow page between Details and Add-ons: size of the job, room counts, photos and short videos |
| C | **Profile additions** | Notification preferences, Security, and Devices and Sessions, distributed across the existing Profile groups |
| D | **Housekeeping** | Fixes found by auditing the code against `Gabfix_UI_Progress.md`, plus the progress-document updates for this phase |
| E | **Payments and receipts** (Section 11) | PDF receipt download, mobile-money wallet numbers per network, Pay balance through the processing page, filterable transaction history, bottom-pinned drawers |
| F | **Booking flow, drafts and keyboard** (Section 12) | Save-draft and Discard exits, keyboard-aware fields everywhere, cleaner assignment simulation with notifications, optional job and cleaner rating |
| G | **Dashboard (Home)** (Section 13) | Hero clean-up, removed sections, stat tiles, Balance due card, new Most popular cards, extra at-a-glance suggestions |
| H | **Services catalogue and dynamic job details** (Section 14) | Twin-card services grouped by category, the 18 services, a dynamic form engine for admin-defined services, service booking page clean-up |
| I | **Remove Service Areas** (Section 15) | Location by address only; how to retire the area concept without breaking the workflows that embed it |
| J | **Bookings, Help Center and Refer polish** (Section 16) | Active tab colour, red Cancel booking, ticket-style Help Center, FAQ alignment, Refer lists |

Written against the code in `gabfix_mobile-main` (Expo SDK 58.0.26, Expo Router 58.0.32, React Native 0.88.1, React 19.3.0) on 2026-11-20. Depth, tone and structure follow `Page_refactor (1).md` and `Gabfix_App_Ui_2.md`: decisions first, then per-screen specs, per-file change lists, copy, acceptance criteria and order of work.

**Design rule for every screen in this document:** layout ideas come from the reference screenshots you supplied (Photos and video sheet, Add photos or video sheet, Notification preferences, Security, Devices and Sessions). **Everything visual stays Gabfix:** tokens from `src/theme/tokens.ts` (green/yellow palette, Poppins headings, Inter body, `radius`, `space`, `shadow`), the existing UI kit, Lucide icons, the existing `TopBar` and `StepperHeader`. The reference app's navy buttons, KLONA logo, hamburger menu and header are not carried over. Never hard-code a colour, radius or spacing value in a screen.

> **Expo reminder (from `AGENTS.md`):** Expo ships breaking changes every SDK. Before writing code against an Expo API, check the versioned docs at `https://docs.expo.dev/versions/v58.0.0/`. Packages marked **native** below need a **development build** (`eas build --profile development`); they will not all run in Expo Go. Install with `npx expo install <package>` (never `npm i`), and run `npx tsc --noEmit` and `npx expo lint` before calling any task done.

---

## 0. Decisions and assumptions (read first)

| # | Decision | Why | How to reverse |
|---|----------|-----|----------------|
| D1 | The new page is **P8b "Job scope and media"** at `/book/[slug]/scope`, inserted **between P8 Details and P9 Add-ons**. | Requested placement. P8 already carries hours, cleaners, frequency and materials, so size and rooms belong right after it, before extras are priced. | Change P8's `onNext` back to `/book/[slug]/add-ons` and delete the route. |
| D2 | The stepper becomes **five stages: Details, Scope, Schedule, Location, Confirm**. **Add-ons moves from "Details" to "Scope"** (P8 `current=0`, P8b and P9 `current=1`, P10 `2`, P11 `3`, P12 `4`). | The stepper today has four stages and says "Add-ons belong to Details". Three sub-screens under one dot hides progress. Five labels still fit a 390 dp screen (about 70 dp per label at 12 sp). | Keep four stages and pass `current={0}` from P8b. |
| D3 | Scope fields come from a **per-service form schema** (data, rendered by one generic form; Section 14.4), not from hard-coded JSX. *(Was: a TypeScript config file.)* | Matches Part 1, 15.10 ("Field variants by service type") and the project rule that values live in config. A home needs bedrooms; an office needs workstations. | Hard-code one field set in `scope.tsx`. |
| D4 | Scope **informs a suggested hours/cleaners value; it does not change the price**. The price stays `price()` in `src/lib/pricing.ts`: rate x hours x cleaners. | Prices are set by finance (Open item 4). The customer still decides; the page nudges them ("A 3-bedroom home usually needs about 5 h") with an **Apply** button. | Remove the suggestion banner. |
| D5 | **Photos and videos are optional by default.** A per-service flag `mediaRequired` can flip this without code changes. | The reference marks the whole details card "Required", but forcing photos adds friction on a first booking. The client can tighten it later. | Set `mediaRequired: true` in config. |
| D6 | **Media is stored as files** under the app's document directory. **Never** as base64 inside AsyncStorage. | Today the avatar, quote photos, chat photos and review photos are base64 data URIs stored in AsyncStorage JSON (see audit finding F6). Ten photos and two 25 MB videos would break that approach. | n/a (required). |
| D7 | **Upload starts after the booking is saved**, as the reference screen says. A failed upload never blocks or cancels a booking. | The booking id and upload targets only exist after `POST /bookings`. Customers on weak Kampala networks must still be able to confirm. | n/a (required). |
| D8 | The two-level reference sheet ("Photos and video", then "Add photos or video") is built as **one `Modal` with an internal view state**, not two stacked modals. | Stacked `Modal`s are unreliable on Android. The project already uses the platform `Modal` for sheets (Decisions 22 and 47). | Two separate sheets. |
| D9 | **Support contact details live in one config object** (`support` in `src/config/help.ts`) and every surface reads from it. | It already works this way (Decision 36). Changing a number is a one-file edit. | n/a |
| D10 | **The three notification switches leave Profile Preferences.** They move to a **Notification preferences** page. **Biometric login moves to Security.** The profile-settings store migrates to a v2 shape. | The reference puts channels, quiet hours and timezone on one page. Biometric unlock is a security setting, and today it only stores a flag (audit finding F7). | Leave the switches inline and skip the page. |
| D11 | **Two-factor authentication uses an SMS code** to the account phone for v1. | Gabfix is phone-first (OTP login, Mobile Money). Authenticator-app TOTP can follow. | Add a TOTP method later behind the same `twoFactor.method` field. |
| D12 | **Devices and Sessions are server sessions.** The app sends a stable `deviceId` at login, one session per device, and the Security page and Devices page read the **same hook**. | The reference screenshots show two defects to avoid: Security says "0 signed-in devices" while Devices shows 2, and the same phone appears twice. | Show only "Sign out everywhere". |
| D13 | **Profile keeps its four groups** (Account, Preferences, Support, Legal). **Security and Devices and sessions go in Account; Notifications goes in Preferences.** | You asked where they fit. Security and device management are account-level; notification choices are preferences. Section 4.1 has the final layout and optional extras. | Add a fifth "Security" group. |
| D14 | Everything that needs a server runs on a **local mock until the API exists** (same pattern as Decisions 15, 21 and 24). | The project has no backend yet. Screens must be exercisable end to end. | n/a |
| D15 | **Backend timing is fixed:** Supabase, Expo tools and Firebase arrive in the **next stage, right after the front end**. Until then every feature in this document is built to be plugged in and runs on local storage (mock mode). | Your answers to Q4 and the quiet-hours and wrong-password points (2026-11-20). | n/a |
| D16 | **Quiet-hours enforcement and the wrong-password status code (400/403) are implemented when the backend is activated.** This document keeps the rules as the specification (4.2.5, 4.3.3) but no front-end task depends on them. | Your decision. | n/a |
| D17 | **Progress score dip to about 59% and the name "Phase 9"** in the progress document are accepted. | Your answers to the Decisions list. | n/a |
| D18 | **Support details are final:** email `gabfixuganda@gmail.com`, call `0703195401`, WhatsApp `0752777774`. | Your answer to Q1. | One-file edit in `src/config/support.ts`. |
| D19 | **SDK "confirm" items are in scope.** The image manipulator, file system, video and crypto APIs are confirmed against the v58 docs at the start of the step that uses them, not before. | You said "go ahead". | n/a |

---

## 1. Audit: does the code match `Gabfix_UI_Progress.md`?

You asked for this first. Method: unzipped the repo, read the progress document, the implementation plan and the three design guides, then checked the claims against the files, `package.json`, `app.json` and the stores.

**Limit of this audit:** the zip has no `node_modules` and the environment has no network access, so I **could not run** `npx tsc --noEmit`, `npx expo lint`, `npm test` or `npx expo export`. Every "passes typecheck / lint / export" statement in the progress document is **unverified by me**. Everything below is from reading the code.

### 1.1 Verified: documented and present

| Progress document says | Found in code |
|---|---|
| All routes in the "Routes implemented" table exist | All 42 route files exist (auth, tabs, order flow P8 to P14, booking management, help, policies, addresses, quotes, offers, cleaner, payments, chat, notifications, profile) |
| Admin dashboard has ten modules | `admin/src/pages/` has 10 files: Overview, Bookings, Payments, Cash, Customers, Cleaners, Services, Promos, Reports, Settings |
| Twelve local stores | `src/store/` has addresses, booking, bookings, messages, notifications, onboarding, payment-methods, plans, profile-settings, quotes, reviews, session |
| Receipt PDF through `expo-print` + `expo-sharing` | Both are in `package.json`; `src/lib/receipt-export.ts` calls `Print.printToFileAsync` |
| P25 quotes and P27c chat accept photos | `MAX_PHOTOS = 5` in `quote/[slug].tsx`; `launchImageLibraryAsync` in `chat/[threadId].tsx` |
| `react-native-maps` is not installed | Correct: absent from `package.json` (P15c is gated on it) |
| No zustand, no bottom-sheet library | Correct (Decisions 17 and 22). Sheets are platform `Modal`s |
| Support details are provisional | `src/config/help.ts` holds `+256 700 000 000` and `support@gabfix.com` as placeholders |
| Location search uses local fixtures including Maganjo | `src/config/location-fixtures.ts` contains the Maganjo entries |
| Add-ons belong to the Details stage | `add-ons.tsx` renders `<StepperHeader current={0} />`, same as `details.tsx` |
| Four test suites, 41 tests | Four suites exist; I count 42 `it/test` declarations (9 + 11 + 13 + 9). Consistent within one test; not executed |

### 1.2 Findings: gaps, stale entries and risks

| # | Finding | Evidence | Severity | Fix |
|---|---|---|---|---|
| F1 | **Stale rows in the Deviations table** contradict the code. P19 says "no `expo-print`/`expo-sharing` dependency" and "PDF download is explained as pending"; P25 says "`expo-image-picker` is not installed" and "No photos"; P27c says "No image attach". | `package.json` has all three packages; `receipt-export.ts`, `quote/[slug].tsx` and `chat/[threadId].tsx` use them | Low (docs only) | Rewrite or delete those rows (see 7.1) |
| F2 | **Inconsistent Open item reference.** The change log says licensed P7 photography is "Open item 7"; the Open items table puts it at **18** (item 7 is the app icon). | Progress doc, Change log vs Section 6 | Low | Use 18 |
| F3 | **Three routes are not registered** as `Stack.Screen` in `_layout.tsx`: `policies/[doc]`, `cleaner/[id]` and `booking/[id]/receipt`. | `grep name="policies/[doc]"` returns nothing; same for the other two | Low. They still work through file-based routing with the default `screenOptions` | Register them for consistency (7.2) |
| F4 | **Support phone, WhatsApp and email are placeholders**, and the admin uses a different domain (`operations@gabfix.ug`, `admin@gabfix.ug`). | `src/config/help.ts`; `admin/src/data.ts:533` | Medium (customer-facing) | Workstream A |
| F5 | **The first call number was one digit short.** `079319401` had 9 digits. You replaced it with `0703195401` (10 digits, valid). | Counted from your messages | **Closed** | Q1 answered. Validation in Section 2 stays so a future typo cannot ship a broken `tel:` link |
| F6 | **All existing photo features store base64 data URIs inside AsyncStorage JSON** (avatar, quote photos, chat photos, review photos). | `profile.tsx` `pickAvatarImage`, `quote/[slug].tsx`, `chat/[threadId].tsx`, `rate.tsx` all pass `base64: true` | Medium. On Android, AsyncStorage has a total size cap (6 MB by default, verify for your version) and very large single values can fail to read | Do not reuse this pattern for job media (D6). Migrate the others later (7.3) |
| F7 | **Biometric login is a no-op.** The toggle writes `biometric: true` to the profile store, but `expo-local-authentication` is not installed and nothing reads the flag. | `package.json`; grep of `.biometric` shows only `profile.tsx` | Medium. The switch implies protection that is not there. The progress document does disclose it | Workstream C builds it for real (4.3.5) |
| F8 | **The camera is never used.** No `launchCameraAsync`, and the `expo-image-picker` plugin in `app.json` sets only `photosPermission` (copy mentions "profile picture and service review"). | `app.json`; grep | Blocking for Workstream B | Add `cameraPermission` and `microphonePermission`, update copy (3.9) |
| F9 | **The session has no device identity.** `AuthSession` is `{ accessToken, refreshToken, user }`; there is no `sessionId` or `deviceId`, and the mock login returns a fixed `mock-user`. | `src/lib/api/auth.ts` | Blocking for Devices and Sessions | Section 4.4 |
| F10 | **`PermissionCard` is location-specific.** It hard-codes the `MapPinOff` icon. | `src/components/ui/permission-card.tsx` | Low | Add an `icon` prop (3.10) |
| F11 | **`CounterStepper` and `Toast` from the Phase 1 plan do not exist** in `src/components/ui`. | Directory listing | Low. Needed for room counts | Build `CounterRow` (3.5) |
| F12 | **Order-specification images (Open item 1) are still open.** Your reference screens for scope and media are effectively that input. | Progress doc, Open item 1 | Info | Mark Open item 1 in progress once P8b ships |

Overall: the build is consistent with the document. The mismatches are stale documentation (F1, F2), three unregistered routes (F3), and gaps that this phase has to close (F4 to F11). Further findings that only surfaced while specifying Workstream C (account deletion scope, no UUID helper, missing packages, a duplicate icon, a phase-name collision and a page-count change) are F13 to F18 in section 7.4. A second pass over the code for this revision re-confirmed F3, F6, F7, F8, F10 and F11 by search (no matches, or the matches quoted above), and re-counted the test declarations (42).

---

## 2. Workstream A: Support contact details

You asked for one set of contact details to apply to every form of customer-support inquiry.

### 2.1 Details supplied

| Channel | Value supplied | Normalised (E.164) | Status |
|---|---|---|---|
| Email | `gabfixuganda@gmail.com` | n/a | Ready |
| WhatsApp | `0752777774` | `+256752777774` | Ready. Opens `https://wa.me/256752777774` |
| Call | `0703195401` | `+256703195401` | Ready (corrected from the first number, which had 9 digits). Opens `tel:+256703195401` |

### 2.2 Today's behaviour (from the code)

- `src/config/help.ts` exports a `support` object (`phoneDisplay`, `phoneHref`, `whatsappUrl`, `email`, `emailHref`, `hours`). Only `src/components/help/contact-options.tsx` reads it, so changing its shape is safe.
- `ContactOptions` renders Call, WhatsApp, Chat and Email rows plus the hours line, and is used by `/help` and `/help/contact`.
- The admin app imports `src/config/pricing.ts` and `src/config/services.ts` as read-only sources. **It cannot import `help.ts`**, because that file imports `lucide-react-native` (a React Native library). So the raw contact values must move to a file with no React Native imports.

### 2.3 Target structure

| File | Role |
|---|---|
| `src/config/support.ts` (**new**, pure TypeScript) | The raw values: call number, WhatsApp number, email, hours. The only place anyone edits |
| `src/lib/support.ts` (**new**, pure TypeScript) | `toUgE164()`, `formatUgDisplay()`, `buildSupport()`: normalise, validate, build `tel:`, `wa.me` and `mailto:` links |
| `src/config/help.ts` | Re-exports `support` from `./support`. FAQ and topic data stay here |
| `src/components/help/contact-options.tsx` | Builds rows from `support`, hides any channel that failed validation |
| `admin/src/data.ts`, `admin/src/pages/Settings.tsx` | Import `src/config/support.ts` for the displayed support contacts |

### 2.4 `src/lib/support.ts`

```ts
// Pure TypeScript: no React Native imports, so the admin app can use it too.
const UG_MOBILE = /^(?:\+?256|0)?(7\d{8})$/;

/** '0752777774' | '+256 752 777 774' | '256752777774' -> '+256752777774'; otherwise null. */
export const toUgE164 = (raw: string): string | null => {
  const digits = raw.replace(/[\s()-]/g, '');
  const match = UG_MOBILE.exec(digits);
  return match ? `+256${match[1]}` : null;
};

/** '+256752777774' -> '+256 752 777 774' */
export const formatUgDisplay = (e164: string): string =>
  `${e164.slice(0, 4)} ${e164.slice(4, 7)} ${e164.slice(7, 10)} ${e164.slice(10)}`;

export type SupportInput = {
  callNumber: string;
  whatsappNumber: string;
  email: string;
  hours: string;
};

export type Support = {
  /** null when the supplied call number is not a valid Ugandan mobile number. */
  phone: { e164: string; display: string; href: string } | null;
  whatsapp: { e164: string; display: string; url: (message?: string) => string } | null;
  email: string;
  mailto: (subject?: string, body?: string) => string;
  hours: string;
};

export function buildSupport(input: SupportInput): Support {
  const call = toUgE164(input.callNumber);
  const wa = toUgE164(input.whatsappNumber);

  if (__DEV__ && (!call || !wa)) {
    // Fail loudly in development, fail closed (hide the channel) in production.
    console.warn(
      `[support] Invalid number(s): call=${input.callNumber} (${call ? 'ok' : 'INVALID'}), ` +
        `whatsapp=${input.whatsappNumber} (${wa ? 'ok' : 'INVALID'})`,
    );
  }

  return {
    phone: call ? { e164: call, display: formatUgDisplay(call), href: `tel:${call}` } : null,
    whatsapp: wa
      ? {
          e164: wa,
          display: formatUgDisplay(wa),
          url: (message) =>
            `https://wa.me/${wa.slice(1)}${message ? `?text=${encodeURIComponent(message)}` : ''}`,
        }
      : null,
    email: input.email,
    mailto: (subject, body) => {
      const query = [
        subject ? `subject=${encodeURIComponent(subject)}` : '',
        body ? `body=${encodeURIComponent(body)}` : '',
      ]
        .filter(Boolean)
        .join('&');
      return `mailto:${input.email}${query ? `?${query}` : ''}`;
    },
    hours: input.hours,
  };
}
```

`__DEV__` is a React Native global. If the admin app imports this file, declare `declare const __DEV__: boolean | undefined;` at the top and guard it with `typeof __DEV__ !== 'undefined' && __DEV__`, or move the warning into `contact-options.tsx` instead.

### 2.5 `src/config/support.ts`

```ts
import { buildSupport } from '@/lib/support';

/**
 * The single source of truth for customer support contact details.
 * Edit the values here only. Hours are provisional until confirmed (Q3).
 */
export const support = buildSupport({
  callNumber: '0703195401',
  whatsappNumber: '0752777774',
  email: 'gabfixuganda@gmail.com',
  hours: 'Open 7 days · 7:00 am – 9:00 pm',
});
```

In `src/config/help.ts`, delete the old `support` literal and add `export { support } from './support';`.

### 2.6 `ContactOptions` changes

| Change | Detail |
|---|---|
| Rows | **Call** (only if `support.phone`), **WhatsApp** (only if `support.whatsapp`), **Chat** (`/chat/support`, unchanged), **Email** |
| Captions | Call: `support.phone.display`. WhatsApp: "Chat with us on WhatsApp". Email: `support.email` |
| New prop `context?: { bookingId?: string }` | When present, WhatsApp opens with the message `Hello Gabfix, I need help with booking GBX-12345.` and the email opens with subject `Help with booking GBX-12345`. Without it: `Hello Gabfix, I need help with my account.` and subject `Gabfix support` |
| Long-press | Copies the number or email with `expo-clipboard` (already installed) and shows the existing copy confirmation pattern |
| Failure | If `Linking.openURL` fails (no WhatsApp, no mail app), the alert offers **Copy number** or **Copy email** instead of a dead end |
| Order of channels | Call, WhatsApp, Chat, Email. If Call is hidden, WhatsApp is first |

### 2.7 Where support must appear

| Surface | Today | Phase 2 |
|---|---|---|
| `/help` and `/help/contact` | Contact card, placeholder numbers | Real details through `ContactOptions` |
| Profile, Support group, **Contact us** | Opens `/help/contact` | Unchanged |
| P15b Booking details, **Need help?** and **Contact support** | Opens `/help/contact` | Open `/help/contact?bookingId=<id>` so WhatsApp and email carry the booking id |
| P19 Receipt, **Report a problem** | Opens `/help/contact` | Same `?bookingId=` hand-off |
| P13 Payment failed state | **Try again** / **Choose another method** | Add a **Contact support** text link (with booking id) |
| P15c Tracking, **Call** | Explains contact is unavailable when no live phone | Add **Call support** as the fallback when `support.phone` exists |
| P23 Policies (Terms, Privacy, Payment and refund) | No contact line | Footer: "Questions about this policy? Contact support" linking to `/help/contact` |
| P26 error states | Already link to `/help/contact` | No change |
| Admin Settings and `admin/src/data.ts` | `operations@gabfix.ug` | Show the customer-support phone, WhatsApp and email from `src/config/support.ts` |

`/help/contact` reads `useLocalSearchParams<{ bookingId?: string }>()` and passes `context` to `ContactOptions`.

### 2.8 Copy sheet

| Where | Text |
|---|---|
| Contact card heading | Contact us |
| Call row | Call · `+256 …` |
| WhatsApp row | WhatsApp · Chat with us on WhatsApp |
| Email row | Email · gabfixuganda@gmail.com |
| WhatsApp pre-filled (no booking) | Hello Gabfix, I need help with my account. |
| WhatsApp pre-filled (booking) | Hello Gabfix, I need help with booking {bookingId}. |
| Email subject (booking) | Help with booking {bookingId} |
| Open-failed alert | Couldn't open {WhatsApp / your mail app}. Copy {the number / our email} instead? |
| Policy footer | Questions about this policy? Contact support |

### 2.9 Per-file checklist

**New**
- [ ] `src/config/support.ts`
- [ ] `src/lib/support.ts`
- [ ] `src/lib/__tests__/support.test.ts`

**Modified**
- [ ] `src/config/help.ts`: remove the literal, re-export `support`
- [ ] `src/components/help/contact-options.tsx`: dynamic rows, `context` prop, copy-on-long-press, failure alert
- [ ] `src/app/help/contact.tsx`: read `bookingId`, pass `context`
- [ ] `src/app/booking/[id].tsx`, `src/app/booking/[id]/receipt.tsx`: pass `bookingId` when opening `/help/contact`
- [ ] `src/app/payment/[id].tsx`: **Contact support** link in the failed state
- [ ] `src/app/booking/[id]/track.tsx`: **Call support** fallback
- [ ] `src/app/policies/[doc].tsx`: contact footer
- [ ] `admin/src/data.ts`, `admin/src/pages/Settings.tsx`: import the shared support config

### 2.10 Tests (`support.test.ts`)

| Input | Expected `toUgE164` |
|---|---|
| `0752777774` | `+256752777774` |
| `+256 752 777 774` | `+256752777774` |
| `256752777774` | `+256752777774` |
| `0793 19401` | `null` (9 digits; the first number supplied) |
| `0703195401` | `+256703195401` |
| `07527777749` | `null` (11 digits) |
| `0414123456` | `null` (landline, not a mobile) |
| `''` | `null` |

Also test `formatUgDisplay('+256752777774') === '+256 752 777 774'`, that `whatsapp.url()` returns `https://wa.me/256752777774`, and that `whatsapp.url('Hello there')` appends `?text=Hello%20there`.

### 2.11 Acceptance criteria (Workstream A)

1. With `0703195401` configured, the Call row appears on `/help`, `/help/contact` and P15c and dials `+256 703 195 401`. If the value is ever set to an invalid number, the Call row is hidden everywhere, no `tel:` link exists, and WhatsApp and Email still work.
2. Changing the call number in `src/config/support.ts` to another valid number changes every Call row; changing it to an invalid one hides them.
3. WhatsApp opens a chat with `+256 752 777 774`, pre-filled with the booking id when launched from a booking.
4. Email opens a draft to `gabfixuganda@gmail.com` with the subject line described above.
5. Changing a value in `src/config/support.ts` changes it in the mobile app and in the admin Settings page with no other edit.
6. `npx tsc --noEmit`, `npx expo lint`, `npm test` pass.

---

## 3. Workstream B: Job scope and media (P8b)

> **Superseded in part by Section 14.4 (2026-11-20).** Services and their fields will be entered by the admin, so the fixed `BookingScope` fields in 3.2 and the TypeScript per-service config in 3.3 become **data in a form schema** that one generic renderer draws. Everything in 3.2 and 3.3 still applies as the **seed schemas** for Basic cleaning, Deep cleaning and any other service that ships with the app (the field ids, ranges, hints and time estimates carry over unchanged). The page placement, the media sheet, the media pipeline and the upload rules (3.1, 3.5 to 3.16) are unchanged.

You asked for a page between the first order screen (Details: hours, cleaners, frequency) and the second (Add extras) that captures **the scale of the job** (size, number of rooms) and **photos or videos of the work to be done**, using the reference screens for the media interaction while keeping the Gabfix design.

### 3.1 Placement and flow

```
Before:  P8 Details ──▶ P9 Add-ons ──▶ P10 Schedule ──▶ P11 Location ──▶ P12 Review and Pay
After:   P8 Details ──▶ P8b Job scope and media ──▶ P9 Add-ons ──▶ P10 ──▶ P11 ──▶ P12
```

| Screen | Route | Stepper `current` (new) | Stage label |
|---|---|---|---|
| P8 Details | `/book/[slug]/details` | 0 | Details |
| **P8b Job scope and media** | `/book/[slug]/scope` | **1** | Scope |
| P9 Add-ons | `/book/[slug]/add-ons` | **1** (was 0) | Scope |
| P10 Schedule | `/book/[slug]/schedule` | **2** (was 1) | Schedule |
| P11 Location | `/book/[slug]/location` | **3** (was 2) | Location |
| P12 Review and Pay | `/book/[slug]/review` | **4** (was 3) | Confirm |

- `StepperHeader` (`src/components/booking/stepper-header.tsx`) changes its `stages` array to `['Details', 'Scope', 'Schedule', 'Location', 'Confirm']`. The connector math (`left: '-50%'`, `right: '50%'`) already adapts to the number of stages. Check the 12 sp labels at 360 dp and at 130% text; `numberOfLines={1}` is already set.
- Back behaviour follows Decision 20: P8b's back arrow returns to P8 **without** the save prompt; only the first page (P8) asks "Save as draft?". P8b's X button uses the same `confirmClose` as P9.
- P8's `onNext` changes from `/book/[slug]/add-ons` to `/book/[slug]/scope`. P8b's **Next** opens `/book/[slug]/add-ons`.
- Register the route in `src/app/_layout.tsx` with the same options object as `book/[slug]/add-ons` (`presentation: Platform.OS === 'ios' ? 'modal' : 'card'`, `animation: 'slide_from_right'`).
- The draft persists everywhere: the customer can leave and resume.

### 3.2 Data model

Add to `src/lib/pricing.ts` (next to `BookingDetails`):

```ts
export type SizeBand = 'small' | 'medium' | 'large' | 'unsure';
export type Condition = 'light' | 'typical' | 'heavy';
export type WorkstationBand = '1-5' | '6-15' | '16-40' | '40+';

/** P8b: how big the job is. Which fields apply depends on the service (config/service-scope.ts). */
export type BookingScope = {
  sizeBand?: SizeBand;
  /** Optional exact size in m², 10 to 5,000. */
  areaSqm?: number;
  bedrooms?: number;       // 0 = studio
  bathrooms?: number;
  livingAreas?: number;
  floors?: number;
  workstations?: WorkstationBand;
  meetingRooms?: number;
  toilets?: number;
  condition?: Condition;
  focusAreas?: string[];   // ids from the service's focus options
};

export type MediaKind = 'photo' | 'video';

/** One attached photo or video. Metadata only: the bytes live in a file at `uri` (D6). */
export type BookingMedia = {
  id: string;              // client-generated uuid
  kind: MediaKind;
  uri: string;             // file:// inside the app's document directory
  mimeType: string;        // image/jpeg, video/mp4, video/quicktime
  bytes: number;
  width?: number;
  height?: number;
  durationMs?: number;     // videos only
  createdAtISO: string;
};

export type BookingDraft = {
  // ...existing fields...
  scope?: BookingScope;
  media?: BookingMedia[];
};
```

- `emptyDraft()` leaves both undefined. `price()` ignores them (D4).
- Upload progress is **not** part of the draft. It lives in `src/store/media-uploads.ts` once a booking exists (3.11).
- `src/store/booking.ts` gets `patchScope(changes)`, `addMedia(items)`, `removeMedia(id)`. `resetDraft()` also deletes the draft's media files (3.8).
- `SavedBooking` (`src/store/bookings.ts`) gets `scope?: BookingScope` and `media?: BookingMedia[]`. The `rebook` snapshot gets `scope` (copied on **Book again**) but **not** media: old photos are not carried into a new job.
- The draft key `gabfix.booking.draft.v1` stays. All new fields are optional, so existing saved drafts hydrate unchanged; no migration needed.

### 3.3 Per-service scope config

`src/config/size-bands.ts` (**new**, shared). `src/lib/quotes.ts` already defines small, medium and large with the same subtitles; import from here so the quote form and the order flow always agree:

```ts
export const sizeBands = [
  { value: 'small',  label: 'Small',  subtitle: 'Up to 50 m²' },
  { value: 'medium', label: 'Medium', subtitle: '50–150 m²' },
  { value: 'large',  label: 'Large',  subtitle: '150 m² or more' },
] as const;
```

`src/config/service-scope.ts` (**new**). All numbers below are **dummy values** to be replaced by operations (Open question Q6), kept in config per the project rule:

```ts
import type { BookingScope } from '@/lib/pricing';

export type CounterField = {
  type: 'counter';
  id: 'bedrooms' | 'bathrooms' | 'livingAreas' | 'floors' | 'meetingRooms' | 'toilets';
  label: string;
  hint?: string;
  min: number;
  max: number;
  initial: number;
  required: boolean;
};
export type BandField = { type: 'workstations'; id: 'workstations'; label: string; required: boolean };
export type ConditionField = { type: 'condition'; id: 'condition'; label: string; required: boolean };
export type ScopeField = CounterField | BandField | ConditionField;

export type ServiceScopeConfig = {
  heading: string;               // 'About your home'
  sizeRequired: boolean;
  fields: readonly ScopeField[];
  focusOptions: readonly { id: string; label: string }[];
  mediaRequired: boolean;        // D5
  mediaHint: string;
  estimate: {
    baseMinutes: number;
    perBedroom?: number;
    perBathroom?: number;
    perLivingArea?: number;
    perWorkstationBand?: Record<string, number>;
    perMeetingRoom?: number;
    perToilet?: number;
    conditionMultiplier?: Record<'light' | 'typical' | 'heavy', number>;
  };
};

export const serviceScope: Record<string, ServiceScopeConfig> = {
  'home-clean': {
    heading: 'About your home',
    sizeRequired: true,
    fields: [
      { type: 'counter', id: 'bedrooms',    label: 'Bedrooms',     hint: '0 for a studio', min: 0, max: 10, initial: 2, required: true },
      { type: 'counter', id: 'bathrooms',   label: 'Bathrooms',    min: 1, max: 8, initial: 1, required: true },
      { type: 'counter', id: 'livingAreas', label: 'Living areas', hint: 'Sitting room, dining room', min: 0, max: 4, initial: 1, required: false },
    ],
    focusOptions: [
      { id: 'kitchen', label: 'Kitchen' }, { id: 'bathrooms', label: 'Bathrooms' },
      { id: 'pet-hair', label: 'Pet hair' }, { id: 'stains', label: 'Stains' },
      { id: 'windows', label: 'Windows' },
    ],
    mediaRequired: false,
    mediaHint: 'Add photos of the rooms, or a short video walkthrough.',
    estimate: { baseMinutes: 60, perBedroom: 45, perBathroom: 30, perLivingArea: 20 },
  },
  'deep-clean': {
    heading: 'About your home',
    sizeRequired: true,
    fields: [
      { type: 'counter', id: 'bedrooms',    label: 'Bedrooms',  hint: '0 for a studio', min: 0, max: 10, initial: 2, required: true },
      { type: 'counter', id: 'bathrooms',   label: 'Bathrooms', min: 1, max: 8, initial: 1, required: true },
      { type: 'counter', id: 'livingAreas', label: 'Living areas', min: 0, max: 4, initial: 1, required: false },
      { type: 'condition', id: 'condition', label: 'How dirty is it?', required: true },
    ],
    focusOptions: [
      { id: 'grease', label: 'Grease' }, { id: 'mould', label: 'Mould' },
      { id: 'limescale', label: 'Limescale' }, { id: 'stains', label: 'Stains' },
      { id: 'behind-furniture', label: 'Behind furniture' },
    ],
    mediaRequired: false,
    mediaHint: 'Photos of the worst areas help us bring the right products.',
    estimate: {
      baseMinutes: 90, perBedroom: 75, perBathroom: 45, perLivingArea: 30,
      conditionMultiplier: { light: 0.9, typical: 1, heavy: 1.25 },
    },
  },
  'move-out-clean': {
    heading: 'About the property',
    sizeRequired: true,
    fields: [
      { type: 'counter', id: 'bedrooms',    label: 'Bedrooms',  hint: '0 for a studio', min: 0, max: 10, initial: 2, required: true },
      { type: 'counter', id: 'bathrooms',   label: 'Bathrooms', min: 1, max: 8, initial: 1, required: true },
      { type: 'counter', id: 'livingAreas', label: 'Living areas', min: 0, max: 4, initial: 1, required: false },
      { type: 'condition', id: 'condition', label: 'Condition now', required: true },
    ],
    focusOptions: [
      { id: 'oven', label: 'Oven' }, { id: 'fridge', label: 'Fridge' },
      { id: 'cupboards', label: 'Inside cupboards' }, { id: 'walls', label: 'Marks on walls' },
    ],
    mediaRequired: false,
    mediaHint: 'Photos of each room help us confirm the time needed for the handover.',
    estimate: {
      baseMinutes: 90, perBedroom: 60, perBathroom: 45, perLivingArea: 30,
      conditionMultiplier: { light: 0.9, typical: 1, heavy: 1.25 },
    },
  },
  'office-clean': {
    heading: 'About your office',
    sizeRequired: true,
    fields: [
      { type: 'workstations', id: 'workstations', label: 'Desks or workstations', required: true },
      { type: 'counter', id: 'meetingRooms', label: 'Meeting rooms', min: 0, max: 20, initial: 1, required: false },
      { type: 'counter', id: 'toilets',      label: 'Toilets',       min: 1, max: 20, initial: 2, required: true },
      { type: 'counter', id: 'floors',       label: 'Floors',        min: 1, max: 6,  initial: 1, required: false },
    ],
    focusOptions: [
      { id: 'kitchenette', label: 'Kitchenette' }, { id: 'reception', label: 'Reception' },
      { id: 'carpets', label: 'Carpets' }, { id: 'glass', label: 'Glass and partitions' },
    ],
    mediaRequired: false,
    mediaHint: 'A walkthrough video of the floor plan is the fastest way to a good quote.',
    estimate: {
      baseMinutes: 60,
      perWorkstationBand: { '1-5': 0, '6-15': 60, '16-40': 150, '40+': 300 },
      perMeetingRoom: 20, perToilet: 25,
    },
  },
};

/** Any service slug without an entry gets the home-clean form. */
export const scopeFor = (slug: string): ServiceScopeConfig => serviceScope[slug] ?? serviceScope['home-clean'];
```

**Property type is not asked here.** P11 already collects Apartment / House / Office. Do not duplicate it; the service itself implies the property family.

### 3.4 Suggestion and validation logic (`src/lib/scope.ts`, **new**)

```ts
import { pricing } from '@/config/pricing';
import { scopeFor } from '@/config/service-scope';
import type { BookingScope } from '@/lib/pricing';

export type JobSuggestion = { totalMinutes: number; cleaners: number; hours: number };

export function suggestJob(slug: string, scope: BookingScope): JobSuggestion {
  const { estimate } = scopeFor(slug);
  let minutes = estimate.baseMinutes;
  minutes += (scope.bedrooms ?? 0) * (estimate.perBedroom ?? 0);
  minutes += (scope.bathrooms ?? 0) * (estimate.perBathroom ?? 0);
  minutes += (scope.livingAreas ?? 0) * (estimate.perLivingArea ?? 0);
  minutes += (scope.meetingRooms ?? 0) * (estimate.perMeetingRoom ?? 0);
  minutes += (scope.toilets ?? 0) * (estimate.perToilet ?? 0);
  if (scope.workstations && estimate.perWorkstationBand) {
    minutes += estimate.perWorkstationBand[scope.workstations] ?? 0;
  }
  if (scope.condition && estimate.conditionMultiplier) {
    minutes *= estimate.conditionMultiplier[scope.condition];
  }
  const totalMinutes = Math.round(minutes);

  const cleaners = totalMinutes <= 300 ? 1 : totalMinutes <= 600 ? 2 : totalMinutes <= 900 ? 3 : 4;
  const rawHours = Math.ceil(totalMinutes / cleaners / 60);
  const hours = Math.min(pricing.maximumHours, Math.max(pricing.minimumHours, rawHours));
  return { totalMinutes, cleaners, hours };
}

export function isScopeComplete(slug: string, scope: BookingScope | undefined): boolean {
  const config = scopeFor(slug);
  if (!scope) return false;
  if (config.sizeRequired && !scope.sizeBand) return false;
  return config.fields.every((field) => !field.required || scope[field.id] !== undefined);
}
```

Worked examples (use these as unit tests):

| Service | Scope | Minutes | Suggestion |
|---|---|---|---|
| `home-clean` | 3 bed, 2 bath, 1 living | 60 + 135 + 60 + 20 = **275** | 1 cleaner, **5 h** |
| `home-clean` | 4 bed, 3 bath, 2 living | 60 + 180 + 90 + 40 = **370** | 2 cleaners, **4 h** |
| `deep-clean` | 3 bed, 2 bath, 1 living, typical | 90 + 225 + 90 + 30 = **435** | 2 cleaners, **4 h** |
| `deep-clean` | same, heavy | 435 x 1.25 = **544** | 2 cleaners, **5 h** |
| `office-clean` | 16-40 desks, 1 meeting room, 3 toilets | 60 + 150 + 20 + 75 = **305** | 2 cleaners, **3 h** |

**Suggestion banner behaviour** (shown once `isScopeComplete`):

| Condition | Banner |
|---|---|
| Booked capacity (hours x cleaners x 60 minutes) is **below 70%** of the estimated minutes | Amber `warningBg`: "A place like this usually needs about **5 h with 1 cleaner**. Your booking may be too short." Buttons: **Apply** and a dismiss X |
| Booked capacity is within 70% to 130% of the estimate | Green `successBg` with a check: "Your booking length looks right for this job." No button |
| Booked capacity is above 130% of the estimate | Blue `infoBg`: "You may not need this long. A place like this usually takes about 4 h with 2 cleaners. [Apply]" |

**Apply** calls `patchDetails({ hours, cleaners })` and the summary bar total updates live. Show the effect on the button label when it changes the total: `Apply · total becomes UGX 59,000`, computed with `price({ ...draft, details: { ...details, hours, cleaners } }).total`. For example 5 h with 1 cleaner is UGX 10,000 x 5 = 50,000 plus 18% VAT = **UGX 59,000** with the current dummy rates. Never apply silently, and never block **Next** on the banner (D4). Dismissal is component state only.

### 3.5 New components

| Component | File | Spec |
|---|---|---|
| `CounterRow` | `src/components/booking/counter-row.tsx` | Row inside a `base.card`, height 64. Left: label (`text.bodyM`) with optional hint (`text.caption`). Right: minus button, value (`text.h3`, tabular numbers, min-width 32, centred), plus button. Buttons are 48 x 48 touch targets with a 36 dp visible circle (`border` colour, `green500` icon). Disabled at `min`/`max` (`disabledText`). `selectionHaptic()` on each tap. Accessibility: `accessibilityRole="adjustable"`, `accessibilityValue={{ now, min, max }}`, and `accessibilityActions` for `increment` and `decrement` so screen-reader swipes work. Phase 1's `CounterStepper` never shipped (finding F11); this is it |
| `MediaTile` | `src/components/booking/media-tile.tsx` | 96 x 96, `radius.tile`, `expo-image` with `contentFit="cover"`. Video: dark scrim, centred Play icon, duration pill bottom-left (`0:12`). Remove: top-right 24 dp circle with an X, `hitSlop` to 48. Accessible label "Photo 2 of 6, remove" / "Video, 12 seconds, remove" |
| `MediaSheet` | `src/components/booking/media-sheet.tsx` | The two-view sheet in 3.7 |
| `ScopeSummary` | `src/components/booking/scope-summary.tsx` | Read-only facts row plus a thumbnail strip. Used on P12, P14 and P15b (3.12) |
| `UploadStatus` | `src/components/booking/upload-status.tsx` | "4 of 6 uploaded", a thin progress bar, **Retry** when anything failed. Used on P14 and P15b |
| `PermissionCard` (changed) | `src/components/ui/permission-card.tsx` | New `icon` prop (3.10) |

`SelectableCard` already makes `subtitle`, `benefit` and `discount` optional, so the size options reuse it unchanged.

### 3.6 Screen layout: P8b `/book/[slug]/scope`

```
┌──────────────────────────────────────────┐
│ ←  Home cleaning                       ✕ │  TopBar (same as P9)
│ ① Details ─ ② Scope ─ ③ Schedule ─ ④ Location ─ ⑤ Confirm │  StepperHeader current=1
├──────────────────────────────────────────┤
│ About your home                          │  text.h2
│ Helps us send the right team and time.   │  text.caption
│                                          │
│ How big is the place?        [Required]  │  text.h3 + status pill
│ (○) Small     Up to 50 m²                │  SelectableCard x3
│ (●) Medium    50–150 m²                  │
│ (○) Large     150 m² or more             │
│   Not sure     ·    I know the exact size│  ghost text buttons
│                                          │
│ Rooms                         [Required] │
│ ┌──────────────────────────────────────┐ │  base.card
│ │ Bedrooms             ( − )  3  ( + ) │ │  CounterRow
│ │ Bathrooms            ( − )  2  ( + ) │ │
│ │ Living areas         ( − )  1  ( + ) │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ Anything needing extra attention?        │  optional, multi-select
│ [Kitchen] [Pet hair] [Stains] [Windows]  │  chip.pill, wraps
│                                          │
│ ┌ i  A place like this usually needs  ─┐ │  suggestion banner
│ │ about 5 h with 1 cleaner.            │ │
│ │ [Apply · total becomes UGX 59,000] ✕ │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ Photos and video              Optional   │  text.h3 + caption
│ Add photos of the rooms, or a short      │
│ video walkthrough.                       │
│ ┌──────────────────────────────────────┐ │  tappable row, opens MediaSheet
│ │ ＋  Add photos or video       10 left │ │
│ └──────────────────────────────────────┘ │
│ ┌────┐ ┌────┐ ┌────┐                     │  MediaTile grid, 3 per row
│ │img │ │img │ │▶0:12│                    │
│ └────┘ └────┘ └────┘                     │
│ Uploads start after your booking is saved.│  caption
├──────────────────────────────────────────┤
│ 4 h · 1 cleaner   UGX 47,200  Details  [Next] │  SummaryBar (disabled until required fields done)
└──────────────────────────────────────────┘
```

| Element | Spec |
|---|---|
| Screen background | `colors.bg`. Content padding `space[4]`, vertical `gap: space[6]` (same as P8) |
| Intro | `text.h2` heading from `scopeFor(slug).heading`; `text.caption` line below |
| Section titles | `text.h3`. Status pill to the right: **Required** (`errorBg` background, `error` text, 24 dp high, `radius.pill`, caption 12/600) turns into **Done** with a check (`successBg`, `green700`) when that section's required fields are complete. Optional sections show a muted **Optional** label instead. This adapts the reference's red "Required" pill |
| Size cards | `SelectableCard` x3. **Not sure** sets `sizeBand: 'unsure'` and counts as answered. **I know the exact size** reveals a numeric `Input` ("Size in m²", 10 to 5,000, `keyboardType="number-pad"`); a valid value also sets `areaSqm` and picks the matching band automatically |
| Rooms | A single `base.card` with one `CounterRow` per counter field in the service config, separated by `base.divider`. Condition fields render as a `SegmentedControl` (Light / Typical / Heavy) with a one-line caption under it. Workstations render as a `ChipSelector` of the four bands |
| Focus chips | Optional, multi-select, `chip.pill` style, `selected` uses `green500`. Stored as `scope.focusAreas` |
| Photos and video card | `base.card`. Title row, caption from `mediaHint`, then the pressable "Add photos or video" row: `green50` background, `radius.input`, 56 dp high, Plus icon, label `text.bodyM` semibold `green700`, and on the right a pill "`{remaining} left`" (`text.caption`, `green700`). Pressing opens the `MediaSheet` |
| Tile grid | Wraps at 3 per row with `gap: space[2]`. Newest last. Tapping a tile opens the preview viewer (3.7.3); the X removes after a confirm if it is a video |
| `SummaryBar` | Same as P8 and P9. `disabled` until `isScopeComplete(slug, scope)` and, if `mediaRequired`, at least one item. When disabled, a one-line helper above the bar names what is missing: "Choose a size and the number of bedrooms and bathrooms to continue." |
| Keyboard | `keyboardShouldPersistTaps="handled"`; the area input scrolls into view; `softwareKeyboardLayoutMode: "resize"` is already set in `app.json` |
| Loading | Instant (all local). No skeleton needed |
| First visit defaults | Counters start at `initial` from config but **do not count as answered until touched**, so a customer cannot skip past by accident: track a local `touched` set per field |

---

### 3.7 The Photos and video sheet (`MediaSheet`)

Adapted from the two reference sheets ("Photos and video" with Add media / Added, then "Add photos or video" with Take photo / Record video / Choose from library). Built as **one platform `Modal` with an internal `view` state** (D8), following the `AddOnSheet` pattern: `animationType="slide"`, transparent, `colors.scrim` backdrop, tap-outside closes.

**Shell:** white `colors.surface`, top corners `radius.sheet` (28), a 40 x 4 handle, `paddingBottom: Math.max(insets.bottom, space[4])`, max height 85% of the screen with a scrolling body. Header: title left (`text.h3`), 48 x 48 close button right (X, `colors.text`). Bottom button is the shared `Button` (green primary), never the reference's navy.

**View 1: `list`**

```
╭──────────────────────────────────────────╮
│                  ───                     │
│ Photos and video                      ✕  │
│ ──────────────────────────────────────── │
│ Add media                                │  text.bodyM, textMuted
│ Up to 10 items · Only 2 videos           │  caption
│ ┌──────────────────────────────────────┐ │
│ │ ＋  Add photos or video      10 left │ │  green50 row, 56 high
│ └──────────────────────────────────────┘ │
│                                          │
│ Added                       6 · 1 video  │
│ ┌────┐ ┌────┐ ┌────┐                     │  MediaTile grid
│ │img │ │img │ │▶0:12│                    │
│ └────┘ └────┘ └────┘                     │
│  (empty: "No media added yet" and a      │
│   bordered hint: "Add photos of rooms    │
│   or a short video walkthrough.")        │
│ Uploads start after your booking is saved│
│ [                Done                  ] │
╰──────────────────────────────────────────╯
```

**View 2: `picker`** (opened by "Add photos or video")

```
╭──────────────────────────────────────────╮
│                  ───                     │
│ Add photos or video                   ✕  │
│ ┌──────────────────────────────────────┐ │
│ │ Videos: max 2 · 30 s · 25 MB         │ │  infoBg chip
│ └──────────────────────────────────────┘ │
│ ┌──────────────────────────────────────┐ │  base.card, 3 rows
│ │ 📷 Take photo                         │ │  Camera icon
│ │    Capture a clear image              │ │
│ │ ──────────────────────────────────── │ │
│ │ 🎥 Record video                  0/2  │ │  Video icon, live count
│ │    Max 30 s · 25 MB                   │ │
│ │ ──────────────────────────────────── │ │
│ │ 🖼  Choose from library               │ │  Images icon
│ │    Select photos or video             │ │
│ └──────────────────────────────────────┘ │
│ Videos are limited to 30 s and 25 MB     │
│ to keep uploads fast.                    │
│ [                Close                 ] │  secondary, returns to list view
╰──────────────────────────────────────────╯
```

(Icons are Lucide `Camera`, `Video`, `Images`; the emoji above are only wireframe stand-ins.)

| Rule | Detail |
|---|---|
| Row layout | 72 dp high, 40 dp `green50` icon tile (`radius.input`) with a `green700` icon, title `text.bodyM`, caption `text.caption`, `Pressable` with `accessibilityRole="button"` and the title plus caption as label |
| Counts | "10 left" and "0/2" are derived from the draft, never stored separately |
| Limits reached | At 10 items every row is disabled (`disabledText`) with the line "You've reached 10 items. Remove one to add more." At 2 videos, **Record video** is disabled and its caption reads "2 of 2 videos added" |
| Busy | While files are being compressed and copied, rows are disabled and a row of `ActivityIndicator` plus "Adding 2 of 5…" shows. The sheet cannot be dismissed with the backdrop while busy |
| Errors | An inline `errorBg` banner under the header (`accessibilityRole="alert"`), auto-dismissing after 6 seconds, naming the reason in plain words (see the error table in 3.8) |
| Permission blocked | Show the `PermissionCard` (3.10) in place of the rows that need it; the others stay usable |
| Android back | In the picker view it returns to the list view; in the list view it closes the sheet (`onRequestClose`) |
| Web | The camera rows are hidden (no camera API in the scripted browser pass); **Choose from library** works |
| Reduce motion | `animationType="none"` when `useReducedMotion()` is true |

#### 3.7.3 Preview viewer (optional for v1)

Tapping a tile opens a full-screen `Modal`: photos use `expo-image` with `contentFit="contain"`; videos use `expo-video`'s `VideoView` with native controls. Remove and Close buttons sit in the top bar. If time is short, ship v1 without the viewer (tiles only show a thumbnail and a remove X) and add it in a follow-up; the data model does not change. `expo-video` is a native module and needs the development build.

### 3.8 Media pipeline (`src/lib/media.ts`, `src/config/media.ts`, both **new**)

```ts
// src/config/media.ts
export const jobMedia = {
  maxItems: 10,
  maxVideos: 2,
  videoMaxSeconds: 30,
  videoMaxBytes: 25 * 1024 * 1024,
  imageMaxEdge: 1600,        // px, long edge
  imageQuality: 0.7,         // JPEG
  durationToleranceMs: 500,  // recorders can overshoot a hair
  draftDir: 'gabfix-media/draft',
  bookingsDir: 'gabfix-media/bookings',
} as const;
```

**Steps for every pick** (camera or library):

| # | Step | Detail |
|---|---|---|
| 1 | Permission | Camera rows check or request camera permission. On iOS, request media library permission before opening the library if videos may be picked (Expo's docs recommend asking before opening so the dialog does not appear after selection) |
| 2 | Pick | See the option sets below |
| 3 | Classify | `asset.type === 'video'` is a video; `'image'` and iOS Live Photos are treated as photos (use the still) |
| 4 | Limits | Drop anything beyond `maxItems`; drop videos beyond `maxVideos`; report both |
| 5 | Validate video | Reject if `duration` (milliseconds) exceeds `videoMaxSeconds x 1000 + tolerance`, or if `fileSize` exceeds `videoMaxBytes`. If `fileSize` is missing, copy first and read the copied file's size |
| 6 | De-duplicate | Skip an `assetId` already in the draft |
| 7 | Normalise photos | Re-encode as **JPEG**, long edge at most 1600 px, quality 0.7 (this also turns iOS HEIC into a format every device can open, and removes EXIF such as GPS location, which matters for photos of someone's home) |
| 8 | Store | Copy into `documentDirectory/gabfix-media/draft/<id>.<ext>` so the OS cannot clear it like the cache |
| 9 | Record | `addMedia()` with metadata and the stored `file://` uri |

**Picker option sets** (check each option against the SDK 58 `expo-image-picker` docs before coding):

```ts
// Library: photos and videos, several at a time
await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ['images', 'videos'],
  allowsMultipleSelection: true,   // allowsEditing must stay false with multi-select
  selectionLimit: remaining,
  orderedSelection: true,          // iOS only
  quality: 1,                      // we compress ourselves in step 7
  exif: false,
});

// Camera: photo
await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8, exif: false });

// Camera: video, capped by the recorder
await ImagePicker.launchCameraAsync({ mediaTypes: ['videos'], videoMaxDuration: jobMedia.videoMaxSeconds });
```

**Do not rely on the picker to enforce the limits.** `videoMaxDuration` shapes the camera recorder, but a video chosen from the library can be any length, so step 5 always validates.

**Photo normalisation sketch** (the `expo-image-manipulator` context API; confirm names against the v58 docs, since the older `manipulateAsync` is being retired):

```ts
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

async function normalisePhoto(uri: string, width: number, height: number) {
  const ctx = ImageManipulator.manipulate(uri);
  const longEdge = Math.max(width, height);
  if (longEdge > jobMedia.imageMaxEdge) {
    ctx.resize(width >= height ? { width: jobMedia.imageMaxEdge } : { height: jobMedia.imageMaxEdge });
  }
  const rendered = await ctx.renderAsync();
  return rendered.saveAsync({ format: SaveFormat.JPEG, compress: jobMedia.imageQuality });
}
```

**File storage** uses the modern `expo-file-system` classes (`File`, `Directory`, `Paths`). Upload progress is the one thing the modern API does not give you today, so the upload step (3.11) uses `expo-file-system/legacy`, which Expo documents for SDK 58 alongside the new API.

```text
documentDirectory/
  gabfix-media/
    draft/<mediaId>.jpg | .mp4 | .mov          ← while the customer is still booking
    bookings/<bookingId>/<mediaId>.jpg | ...   ← after P12 confirms (files are moved, not copied)
```

**Lifecycle rules**

| Event | Action |
|---|---|
| Remove a tile | `removeMedia(id)` and delete the file |
| `resetDraft()` (Discard, or a different service starts a new draft) | Delete the whole `draft/` folder |
| P12 confirms | `finalizeDraftMedia(bookingId)` moves every file to `bookings/<bookingId>/` **before** `resetDraft()` runs at P14, so nothing is deleted by mistake |
| App boot | Delete `draft/` files not referenced by the hydrated draft; delete `bookings/<id>/` folders whose booking no longer exists |
| Retention of local copies | Keep until the booking is completed or cancelled plus 30 days, then delete (P15b falls back to the server URL). Confirm with Q8 |
| Account deletion | `deleteLocalAccount()` already clears `gabfix.*` AsyncStorage keys; add deletion of the whole `gabfix-media/` directory |

**Error messages** (inline banner text; plain words, no codes):

| Cause | Message |
|---|---|
| Video too long | That video is {n} seconds. Please keep videos to 30 seconds or less. |
| Video too large | That video is {n} MB. Videos can be up to 25 MB. A shorter clip is usually smaller. |
| Too many items | You can add up to 10 photos and videos. |
| Too many videos | Only 2 videos are allowed. The extra video wasn't added. |
| Unreadable file | We couldn't read that file. Please try a different one. |
| Storage full | Your phone is out of storage space. Free some space and try again. |
| Permission blocked | See 3.10 |

> **Heads-up on the 25 MB video cap.** Full-HD phone video commonly runs several MB for every 10 seconds, depending on device and settings, so a full 30-second clip can exceed 25 MB, particularly from the library. Expo's image picker does not compress video. Options: keep the cap and let the message guide people to shorter clips; raise the cap; or add a native video-compression library (third-party, development build only). This is Open question Q7.

**Web builds.** `expo-file-system` is not available on web. On web, keep the picked `blob:` URL in memory, skip the copy and the upload, and show the same UI. This keeps the scripted browser QA flow working without pretending files are persisted.

### 3.9 Permissions and `app.json`

The `expo-image-picker` config plugin currently sets only `photosPermission`, and the copy mentions only profile pictures and reviews (finding F8). Replace the plugin entry with:

```json
[
  "expo-image-picker",
  {
    "photosPermission": "Gabfix Home Solutions uses your photos so you can show your cleaner the space, set a profile picture and attach photos to a review.",
    "cameraPermission": "Gabfix Home Solutions uses your camera to take photos and videos of the space to be cleaned.",
    "microphonePermission": "Gabfix Home Solutions uses your microphone to record sound when you film a short walkthrough video."
  }
]
```

- By default the plugin adds `RECORD_AUDIO` on Android; setting `microphonePermission` to `false` blocks it (silent videos). Keep audio unless the client says otherwise (Q9).
- Permission strings are baked into the native project, so **this change needs a new development build or EAS build** (`eas build --profile development`). A Metro reload will not pick it up.

**Permission flow (camera example):**

```ts
async function ensureCamera(): Promise<'granted' | 'denied' | 'blocked'> {
  const current = await ImagePicker.getCameraPermissionsAsync();
  if (current.granted) return 'granted';
  if (!current.canAskAgain) return 'blocked';           // user chose "Don't ask again" / denied twice
  const next = await ImagePicker.requestCameraPermissionsAsync();
  return next.granted ? 'granted' : next.canAskAgain ? 'denied' : 'blocked';
}
```

| Result | UI |
|---|---|
| `granted` | Open the camera |
| `denied` | Stay in the picker, show a one-line note, allow retrying |
| `blocked` | Show `PermissionCard`: title "Camera access is off", body "Allow camera access in Settings to take photos, or choose from your library instead.", **Open settings** (`Linking.openSettings()`) |

### 3.10 `PermissionCard` generalisation

`src/components/ui/permission-card.tsx` hard-codes the `MapPinOff` icon (finding F10). Add two props and keep the old behaviour as the default so P11 is unchanged:

```tsx
type Props = {
  title: string;
  body: string;
  onOpenSettings: () => void;
  icon?: LucideIcon;          // default MapPinOff
  actionLabel?: string;       // default 'Open settings'
};
// const Icon = icon ?? MapPinOff;
```

Reuse it for camera (`CameraOff`), photos (`ImageOff`) and notifications (`BellOff`, Workstream C).

### 3.11 Upload after the booking is saved

The reference states "Upload starts after booking is saved." That fits the project: the booking id and upload targets only exist after `POST /bookings` (D7).

**Sequence on P12 Confirm** (extends the existing submit):

1. `createBooking(draft, total)` sends `scope` and `media` **metadata** (no bytes, no `uri`).
2. The response may include `uploads[]` with a target per item.
3. `finalizeDraftMedia(bookingId, draft.media)` moves the files and writes `scope` and `media` into the `SavedBooking`.
4. `enqueueUploads(bookingId, uploads)` hands the items to the queue.
5. The app navigates on to P13 or P14 immediately. Uploads continue in the background of the session. **A failed or slow upload never blocks the booking.**

**`src/lib/api/bookings.ts`** changes:

```ts
export type UploadTarget = {
  clientId: string;                       // BookingMedia.id
  mediaId: string;                        // server id
  uploadUrl: string;                      // pre-signed, one file
  headers?: Record<string, string>;
  expiresAtISO: string;
};

export type BookingResult = {
  bookingId: string;
  priceBreakdown: PriceBreakdown;
  uploads?: UploadTarget[];
};

// body additions
scope: draft.scope,
media: (draft.media ?? []).map(({ id, kind, mimeType, bytes, width, height, durationMs }) => ({
  clientId: id, kind, mimeType, bytes, width, height, durationMs,
})),
```

**Endpoints** (to confirm with backend; recorded as a new Open item):

| Method and path | Purpose |
|---|---|
| `POST /bookings` | Extended with `scope` and `media[]` metadata; returns `uploads[]` |
| `POST /bookings/{id}/media/refresh` | Body `{ clientIds }`. Returns fresh targets when links have expired |
| `PUT {uploadUrl}` | Raw bytes with the target's headers (no bearer token; the URL is the credential) |
| `POST /bookings/{id}/media/{mediaId}/complete` | Body `{ bytes }`. Marks the item ready |
| `GET /bookings/{id}` | Returns `media[]: { id, kind, url, thumbUrl, status }` |
| `DELETE /bookings/{id}/media/{mediaId}` | Customer removes an item (stretch, see 3.12) |

**Upload queue** (`src/lib/media-upload.ts`, `src/store/media-uploads.ts`, both **new**):

```ts
export type UploadItem = {
  bookingId: string;
  clientId: string;
  mediaId: string;
  uri: string;
  kind: 'photo' | 'video';
  mimeType: string;
  bytes: number;
  state: 'queued' | 'uploading' | 'uploaded' | 'failed';
  progress: number;          // 0..1
  attempts: number;
  error?: string;
  updatedAtISO: string;
};
```

| Rule | Detail |
|---|---|
| Persistence | `gabfix.media-uploads.v1` in AsyncStorage: small JSON with `file://` uris only. Hydrate at boot in `_layout.tsx`'s `Promise.all`; any item left `uploading` becomes `queued` |
| Concurrency | Two at a time, videos one at a time |
| Transport | `FileSystem.createUploadTask(uploadUrl, uri, { httpMethod: 'PUT', uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT, headers }, onProgress)` from `expo-file-system/legacy`; `await task.uploadAsync()`. The progress callback does not fire while the app is backgrounded, so treat a long background gap as "resume on return" |
| Retry | 3 attempts with 2 s, 8 s, 30 s back-off; then `failed` with a **Retry** button. A `401/403/410` from the storage URL means the link expired: call `/media/refresh` once, then retry |
| Network | Pause while offline (`expo-network`, already installed); resume on reconnect and when `AppState` returns to `active`; also kick the queue when P14 or P15b mounts |
| Completion | After a 2xx from the PUT, call `/media/{mediaId}/complete`, set `uploaded`, bump the booking's `UploadStatus` |
| Logging | Never log upload URLs, file names or uris (security review 8.6) |
| No backend (`!hasApiBaseUrl`) | Move files to the booking folder and mark every item `uploaded` immediately. Add `EXPO_PUBLIC_MOCK_UPLOAD_FAIL=2` (dev only) to fail the second item so the failed state can be exercised |

### 3.12 Where scope and media show up after P8b

| Screen | Change |
|---|---|
| **P12 Review and Pay** | New **Job scope** card in the summary area with the same **Edit** deep-link pattern as Date and Address: one line of facts ("Medium · 3 bedrooms · 2 bathrooms"), a strip of up to 4 thumbnails plus "+2", and Edit opening `/book/[slug]/scope`. Confirm runs the sequence in 3.11 |
| **P14 Booking Confirmed** | A "Photos and video" line with the count and `UploadStatus` ("Uploading 2 of 6…", "All uploaded") |
| **P15b Booking Details** | **Job scope** card, media grid (local files first, server URLs after local retention), `UploadStatus` with **Retry**. **Stretch:** for upcoming bookings an **Add more photos** button reusing `MediaSheet`, which posts to `POST /bookings/{id}/media` |
| **P18 Rebook** | `buildRebookDraft()` copies `scope` and **not** `media` |
| **Admin: Bookings** | `admin/src/types.ts` `Booking` gets `scope?` and `media?: { id: string; kind: 'photo' \| 'video'; url: string; thumbUrl?: string }[]`. The booking row shows a camera icon with the count; the details panel and `AssignCleanerDialog` show the scope facts and a gallery so dispatch can pick the right team. Sample data can use plain coloured placeholder tiles (no remote images) |
| **Summary Sheet (P8 to P12)** | No change: scope does not affect price (D4) |
| **Privacy policy** (`src/config/policies.ts`) | Add: "Photos and videos you add to a booking are shared with your assigned cleaner and Gabfix operations so they can prepare for the job. Please avoid including people or documents in your photos." Retention wording pending (Q8) |

### 3.13 Edge cases

| Case | Behaviour |
|---|---|
| Customer picks 14 photos from the library | `selectionLimit` caps at the remaining slots; anything extra reported by the banner |
| Library returns HEIC (iOS) | Re-encoded to JPEG in step 7 |
| Customer backs out mid-sheet | Items already added stay; the sheet is only a view over the draft |
| App is killed after adding photos | Files are in `documentDirectory` and the draft metadata persisted, so they reappear on resume. Draft cleanup at boot only removes unreferenced files |
| App is killed mid-upload | Queue hydrates, items resume as `queued` |
| No network at booking time | Booking still confirms (existing offline behaviour applies to `createBooking`); uploads wait |
| Phone storage full | Copy fails: show "out of storage"; nothing is added |
| Customer changes service after adding photos | A new service starts a fresh draft (existing rule), which deletes the old draft media. Show nothing extra: the Discard prompt on P8 already warns |
| 130% text size | Required pill and counter rows wrap; tiles are fixed 96 dp; the sheet body scrolls |
| TalkBack / VoiceOver | Counters are `adjustable`; tiles announce position and kind; the sheet traps focus and announces errors via `alert` role |
| Reduce motion | Sheet uses no animation; the suggestion banner appears without a fade |
| Two-finger tap on Add | `busy` guard prevents opening two pickers |
| Duplicate photo | Skipped by `assetId` |

### 3.14 Copy sheet (P8b and the sheet)

| Where | Text |
|---|---|
| Intro heading | About your home / About the property / About your office |
| Intro caption | Helps us send the right team and time. |
| Size title | How big is the place? |
| Size options | Small · Up to 50 m² / Medium · 50–150 m² / Large · 150 m² or more |
| Size links | Not sure / I know the exact size |
| Rooms title | Rooms |
| Focus title | Anything needing extra attention? |
| Condition (deep clean) | How dirty is it? · Light / Typical / Heavy |
| Banner (short) | A place like this usually needs about {h} h with {n} cleaner(s). Your booking may be too short. |
| Banner (ok) | Your booking length looks right for this job. |
| Banner (long) | You may not need this long. A place like this usually takes about {h} h with {n} cleaner(s). |
| Banner button | Apply · total becomes UGX {total} |
| Media title | Photos and video |
| Media caption | Add photos of the rooms, or a short video walkthrough. |
| Add row | Add photos or video · {n} left |
| Footer note | Uploads start after your booking is saved. |
| Disabled helper | Choose a size and the number of bedrooms and bathrooms to continue. |
| Sheet 1 title / subtitle | Photos and video · Up to 10 items · Only 2 videos |
| Sheet 1 sections | Add media / Added |
| Sheet 1 empty | No media added yet · Add photos of rooms or a short video walkthrough. |
| Sheet 2 title | Add photos or video |
| Sheet 2 chip | Videos: max 2 · 30 s · 25 MB |
| Sheet 2 rows | Take photo · Capture a clear image / Record video · Max 30 s · 25 MB / Choose from library · Select photos or video |
| Sheet 2 footer | Videos are limited to 30 s and 25 MB to keep uploads fast. |
| Buttons | Done / Close |

### 3.15 Per-file checklist (Workstream B)

**New**
- [ ] `src/app/book/[slug]/scope.tsx`
- [ ] `src/components/booking/counter-row.tsx`, `media-tile.tsx`, `media-sheet.tsx`, `scope-summary.tsx`, `upload-status.tsx`
- [ ] `src/config/service-scope.ts`, `src/config/size-bands.ts`, `src/config/media.ts`
- [ ] `src/lib/scope.ts`, `src/lib/media.ts`, `src/lib/media-upload.ts`
- [ ] `src/store/media-uploads.ts`
- [ ] `src/lib/__tests__/scope.test.ts`, `media.test.ts`

**Modified**
- [ ] `src/lib/pricing.ts`: `BookingScope`, `BookingMedia`, draft fields
- [ ] `src/store/booking.ts`: `patchScope`, `addMedia`, `removeMedia`; `resetDraft` deletes draft media
- [ ] `src/store/bookings.ts`: `SavedBooking.scope`, `media`, `rebook.scope`
- [ ] `src/lib/rebook.ts`: copy scope, not media
- [ ] `src/lib/api/bookings.ts`: payload and `uploads[]`
- [ ] `src/components/booking/stepper-header.tsx`: five stages
- [ ] `src/app/book/[slug]/details.tsx`: `onNext` to `/book/[slug]/scope`
- [ ] `src/app/book/[slug]/add-ons.tsx` (current 1), `schedule.tsx` (2), `location.tsx` (3), `review.tsx` (4); review also gets the scope card and the finalize and enqueue sequence
- [ ] `src/app/book/[slug]/confirmed.tsx`: media line and `UploadStatus`
- [ ] `src/app/booking/[id].tsx`: scope card, media grid, `UploadStatus`
- [ ] `src/app/_layout.tsx`: register `book/[slug]/scope`; add `hydrateMediaUploads()`
- [ ] `src/components/ui/permission-card.tsx`: `icon`, `actionLabel`
- [ ] `src/lib/quotes.ts`: import shared `sizeBands`
- [ ] `src/lib/account.ts`: delete the media directory on account deletion
- [ ] `src/config/policies.ts`: privacy copy
- [ ] `app.json`: image-picker permissions; `package.json` via `npx expo install`
- [ ] `admin/src/types.ts`, `admin/src/data.ts`, `admin/src/pages/Bookings.tsx`, `admin/src/components/AssignCleanerDialog.tsx`

### 3.16 Acceptance criteria (Workstream B)

1. From P8, **Next** opens P8b; from P8b, **Next** opens Add-ons; Schedule, Location and Review follow. The stepper shows five stages with the right one active on every screen, at 360, 390 and 430 dp.
2. **Next** on P8b is disabled until size and the required counters are answered; the disabled helper names what is missing; required pills turn to **Done**.
3. The suggestion banner shows the correct amber, green or blue state for the worked examples in 3.4, and **Apply** changes hours and cleaners and the summary total together.
4. The Photos and video sheet matches 3.7: both views, live "{n} left" and "{n}/2" counts, disabled rows at the limits.
5. Adding 10 items blocks further adds; a third video is refused; a 41-second video and a 30 MB video are refused with the specific messages.
6. Photos are saved as JPEG of at most 1600 px on the long edge with no GPS EXIF. Files live under `documentDirectory/gabfix-media/`. The draft JSON contains **no base64** and stays small (assert in a test).
7. Killing the app and reopening restores scope and media on P8b.
8. Denying the camera permission shows the `PermissionCard` with **Open settings** and still allows the library.
9. P12 shows the scope card with a working **Edit**; Confirm saves the booking, moves the files, starts uploads and never blocks navigation.
10. With uploads failing (mock flag), P14 and P15b show **Retry**, and retry succeeds.
11. **Book again** copies the scope but no media.
12. Admin Bookings shows the scope and the gallery for a sample booking.
13. VoiceOver and TalkBack: counters adjustable, tiles announced, sheet announces errors.
14. `npx tsc --noEmit`, `npx expo lint`, `npm test` pass; verified on a real iPhone and a real Android phone in a development build (camera, video, permissions, HEIC).

---

## 4. Workstream C: Profile additions

You asked for three missing pages (Notifications, Security, Devices and sessions), for a decision on where each belongs in the Profile list, and for suggestions. Your three reference screenshots are the layout input. Everything is rebuilt in Gabfix tokens and components.

New pages (continuing the progress tracker's numbering after P27g):

| ID | Page | Route | File |
|---|---|---|---|
| P28 | Notification preferences | `/profile/notification-preferences` | `src/app/profile/notification-preferences.tsx` |
| P29 | Security | `/profile/security` | `src/app/profile/security/index.tsx` |
| P29a | Change password | `/profile/security/password` | `src/app/profile/security/password.tsx` |
| P29b | Two-factor authentication | `/profile/security/two-factor` | `src/app/profile/security/two-factor.tsx` |
| P29c | Login activity | `/profile/security/activity` | `src/app/profile/security/activity.tsx` |
| P30 | Devices and sessions | `/profile/devices` | `src/app/profile/devices.tsx` |

**Naming note.** `/notifications` already exists (P27d) and is the **inbox**: the list of messages. The new page is the **settings** for what gets sent, so it is deliberately named `notification-preferences`. The inbox gets a gear icon that opens it (4.2.9).

### 4.0 Decisions for this workstream

| # | Decision | Why | How to reverse |
|---|----------|-----|----------------|
| C1 | **Notification settings are saved with an explicit Save preferences button**, with a dirty-state check and a discard prompt on back. | The reference does this, quiet hours and timezone belong together, and turning Push on can trigger a system permission prompt and a server registration. Personal details (`profile/edit`) already uses the same pattern. | Autosave each switch. |
| C2 | **Three message types, two channels.** Channels: In-app, Push. Types: Booking and payment updates (always on), Reminders, News and offers. | Your reference mixes channels and types in one card. Gabfix needs both: a customer must be able to mute promotions without missing "your cleaner is on the way". | Flatten to the reference's three switches. |
| C3 | **Quiet hours are enforced by the server for remote push.** The app only applies them to notifications it schedules itself. | A remote push shown while the app is closed never passes through app code, so the phone cannot hold it back. | n/a (platform limit). |
| C4 | **Critical updates bypass quiet hours; promotions never do.** Critical = booking confirmed, rescheduled, cancelled, cleaner on the way or arrived, payment result, security alerts. | Matches the reference wording ("Critical updates may bypass quiet hours. Disabled channels remain disabled."). | Let nothing bypass. |
| C5 | **Biometric login becomes "Face ID / fingerprint unlock"** and is a real app lock, built with `expo-local-authentication`. It lives in Security. | Today it is a switch that stores a flag nothing reads (finding F7). The session already persists in SecureStore, so "unlock" is the honest name. | Remove the row. |
| C6 | **Two-factor uses SMS to the account phone** (D11), with one-time recovery codes. | Phone-first product. Recovery codes cover a lost or changed SIM. | TOTP later behind `twoFactor.method`. |
| C7 | **One session per device.** The app sends a stable `deviceId`; the server upserts on login. | Fixes the duplicate "Galaxy S8+" rows in your Devices screenshot (D12). | Allow duplicates and show them. |
| C8 | **No "Trusted devices" concept in v1.** The row is renamed **Devices and sessions** and counts signed-in sessions. | "Trusted" implies a device can skip two-factor. That is not built, and the reference shows "0 signed-in devices" under that label next to a Devices page that lists 2. | Add trust later with its own field. |
| C9 | **Security and Devices and sessions sit in Profile's Account group; Notifications sits in Preferences** (D13). The three notification switches and the biometric switch leave Preferences. | Account-level controls belong with the account. | Add a fifth "Security" group. |
| C10 | **One data hook feeds both Security and Devices** (`useDeviceSessions`). | Prevents the 0-versus-2 mismatch visible in your screenshots. | n/a |

### 4.1 Profile layout (final)

```
Account
  Personal details                    Name, phone and email
  Saved addresses                     Home, Work and other places
  Payment methods                     Cards, Mobile Money and receipts
  Security                       NEW  Password, 2-step and unlock
  Devices and sessions           NEW  2 signed-in devices
  Offers and promo codes              Save on your next clean

Preferences
  Language                            English
  Notifications                  NEW  Push on · Quiet hours off     (replaces 3 switches + biometric)

Support
  Help centre
  Contact us
  Rate the app

Legal
  Terms and conditions · Privacy policy · Payment and refund policy

  Log out
  Delete account
```

Row values are computed, never hard-coded: Security shows "2-step on" or "Password and sign-in protection"; Devices shows the count from `useDeviceSessions()`; Notifications shows `notificationSummary(prefs)` (4.2.5).

**Suggestions you asked for** (not all are needed now):

| Suggestion | Where | Verdict |
|---|---|---|
| **Login activity** (recent sign-ins) | Inside Security (P29c) | **In scope.** Your reference has it; it is the audit trail behind "Sign out other devices" |
| **Report a safety concern** | Support, below Contact us | **Recommended, small.** Opens `/help/contact?topic=safety` and pre-fills WhatsApp: "Hello Gabfix, I want to report a safety concern about booking {id}." Reuses Workstream A. Worth having for a service that enters people's homes |
| About Gabfix (version, licences, social links) | Legal | Optional. A version footnote already exists |
| Privacy and data (what we store, download or delete my data) | Legal | Later, with the backend. Delete account already exists |
| Saved cleaners (favourites) | Account | Later. Needs cleaner assignment (Open item 26) |
| Communication language | Preferences | Later, with localization |
| Appearance (dark mode) | Preferences | Out of scope (light mode only, Decision 7) |

**Shared extraction (no visual change).** `Group` and `SettingRow` are private to `(tabs)/profile.tsx`. Security and Notifications need the same rows. Move them to `src/components/ui/settings-list.tsx` as `SettingsGroup` and `SettingsRow` (same props, same styles) and make `profile.tsx` import them. Do this first and confirm Profile looks identical before adding rows.

### 4.2 P28 Notification preferences

#### 4.2.1 What the reference shows, and what Gabfix does with it

| Reference element | Gabfix |
|---|---|
| In-app notifications switch ("Save new notifications to your inbox") | Kept. Card **Channels**, switch **In-app** |
| Push notifications switch ("Receive updates on your devices") | Kept. Switch **Push**, with device-permission handling (4.2.4) |
| News and offers switch | Kept in card **What we send** as **News and offers**, default off |
| Quiet hours for push, with the explanation text | Kept. Adds start and end chips (the reference shows only a timezone) |
| Timezone picker ("Kampala, Uganda / Africa/Kampala") | Kept. Opens a sheet (`TimezoneSheet`) |
| Save preferences (navy) | **Save preferences**, shared green `Button` |
| "Your device must also allow notifications in iOS or Android settings." + Open device settings | Kept as a status row plus **Open phone settings** |
| Navy hamburger header, KLONA logo, "Welcome back" | Not carried over. Gabfix `TopBar` |

#### 4.2.2 Layout

```
┌──────────────────────────────────────────┐
│ ←          Notifications                 │  TopBar (title "Notifications")
├──────────────────────────────────────────┤
│ Choose which updates you receive and     │  text.caption
│ when.                                    │
│                                          │
│ [ banner, only if both channels are off ]│  InlineBanner warning (4.2.6)
│                                          │
│ CHANNELS                                 │  group title (uppercase caption)
│ ┌──────────────────────────────────────┐ │  base.card, rows 64 high
│ │ 🔔 In-app            ( switch )      │ │
│ │    Keep updates in your inbox.       │ │
│ │ ──────────────────────────────────── │ │
│ │ 📱 Push              ( switch )      │ │
│ │    Alerts on this phone.             │ │
│ │    Phone permission: Allowed         │ │  status line (4.2.4)
│ └──────────────────────────────────────┘ │
│                                          │
│ WHAT WE SEND                             │
│ ┌──────────────────────────────────────┐ │
│ │ 📅 Booking and payment   Always on   │ │  locked row, no switch
│ │    Confirmations, your cleaner's     │ │
│ │    arrival, payments, security.      │ │
│ │ ──────────────────────────────────── │ │
│ │ ⏰ Reminders           ( switch )    │ │
│ │ ──────────────────────────────────── │ │
│ │ 🏷 News and offers     ( switch )    │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ Quiet hours for push    ( switch )   │ │
│ │ Routine pushes wait until quiet      │ │
│ │ hours end. Critical updates may      │ │
│ │ bypass quiet hours. Turned-off       │ │
│ │ channels stay off.                   │ │
│ │ (when on)                            │ │
│ │ From   [21:00][22:00][23:00][00:00]  │ │  chips
│ │ Until  [05:00][06:00][07:00][08:00]  │ │
│ │ Timezone                             │ │
│ │ ┌──────────────────────────────────┐ │ │
│ │ │ 🌍 Kampala, Uganda            ⌄  │ │ │  opens TimezoneSheet
│ │ │    Africa/Kampala                │ │ │
│ │ └──────────────────────────────────┘ │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ [        Save preferences        ]       │  Button primary, disabled until dirty
│ Your phone must also allow Gabfix        │  caption
│ notifications.                           │
│ [      Open phone settings      ]        │  Button secondary
└──────────────────────────────────────────┘
```

| Element | Spec |
|---|---|
| Screen | `colors.bg`, `ScrollView`, padding `space[4]`, `gap: space[4]`, bottom padding `insets.bottom + space[8]`. No sticky bar: the Save button is at the end of the content, as in the reference |
| Group titles | The existing Profile group title style (caption, semibold, 0.8 letter-spacing, uppercase, `textMuted`) |
| Rows | `SettingsRow` with a 36 dp `green50` icon tile (Lucide `Bell`, `Smartphone`, `CalendarClock`, `Clock3`, `Tag`), label `bodyM` semibold, caption below. Minimum height 64 here because captions are two lines. The `Switch` uses the Profile switch colours (`trackColor` border/green500, `thumbColor` surface) |
| Locked row | **Booking and payment updates** shows a muted "Always on" label and a `Lock` icon instead of a switch. It is still read aloud: "Booking and payment updates, always on" |
| Quiet hours card | Switch row on top, the explanation in `caption`, and when on, two `ChipSelector` rows (Start, End) plus the timezone selector. Selector: 72 dp high, `radius.input`, `green50` background, `Globe2` icon, city line `bodyM` semibold, IANA id `caption`, `ChevronDown` |
| Save | Shared `Button`, `loading` while saving. Disabled when not dirty or invalid |
| Open phone settings | `Button variant="secondary"`, `Linking.openSettings()` |
| Reduce motion | The quiet-hours options expand without animation when `useReducedMotion()` is true |
| Web | Push row hidden (no push in the scripted browser pass); everything else works |

#### 4.2.3 Data model and migration

`src/store/profile-settings.ts` moves to **v2** (decision D10). Avatar and language stay; the notification block is replaced and `biometric` leaves (it moves to `src/store/security.ts`, 4.3.5).

```ts
export type QuietHours = { enabled: boolean; start: string; end: string }; // 'HH:mm', 24-hour

export type NotificationPreferences = {
  inApp: boolean;          // default true
  push: boolean;           // default true
  reminders: boolean;      // default true
  offers: boolean;         // default false
  quietHours: QuietHours;  // default { enabled: false, start: '22:00', end: '07:00' }
  timezone: string;        // IANA id, default 'Africa/Kampala'
};

export type ProfileSettings = {
  avatarUri?: string;
  language: 'en';
  notifications: NotificationPreferences;
  hydrated: boolean;
};
```

Storage key `gabfix.profile-settings.v2`. Hydration order: read v2; if absent, read v1, migrate, write v2, then remove v1.

```ts
type V1 = {
  avatarUri?: string;
  notifications?: { bookingUpdates?: boolean; reminders?: boolean; offers?: boolean };
  biometric?: boolean;
};

export function migrateV1(v1: V1): { settings: Pick<ProfileSettings, 'avatarUri' | 'notifications'>; biometric: boolean } {
  const old = v1.notifications ?? {};
  const bookingUpdates = old.bookingUpdates !== false;
  const reminders = old.reminders !== false;
  return {
    settings: {
      avatarUri: typeof v1.avatarUri === 'string' ? v1.avatarUri : undefined,
      notifications: {
        inApp: true,
        push: bookingUpdates || reminders, // either old switch on means the customer wanted push
        reminders,
        offers: old.offers === true,
        quietHours: { enabled: false, start: '22:00', end: '07:00' },
        timezone: 'Africa/Kampala',
      },
    },
    biometric: v1.biometric === true, // handed to the security store; it has no effect until C5 ships
  };
}
```

The old `bookingUpdates` switch disappears because booking updates are always on (C4). Test the migration (4.13).

Setters in the store: `saveNotificationPreferences(next)` replaces `setNotificationPreference`; delete the old function and its two call sites in `profile.tsx`.

`validateQuietHours(q)`: returns an error string when `start === end` ("Start and end can't be the same time.") or either is not `HH:mm`. The `ChipSelector` options make other invalid values impossible, but the function also guards values that come back from the server.

#### 4.2.4 Device permission and push registration

Install `expo-notifications` with `npx expo install expo-notifications`. In SDK 58 it needs a **development build** for remote push on Android (Expo Go supports local notifications only) and the docs list `~58.1.9` as the recommended version. Re-read the versioned page before coding: `https://docs.expo.dev/versions/v58.0.0/sdk/notifications/`.

`src/lib/push.ts` (**new**):

```ts
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export type PushPermission = 'granted' | 'undetermined' | 'denied' | 'unsupported';

export async function getPushPermission(): Promise<PushPermission> {
  if (Platform.OS === 'web') return 'unsupported';
  const current = await Notifications.getPermissionsAsync();
  if (current.granted || current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return 'granted';
  }
  return current.canAskAgain ? 'undetermined' : 'denied';
}

/** Android 13+ shows its prompt only after a channel exists, so channels are created first. */
export async function requestPushPermission(): Promise<PushPermission> {
  if (Platform.OS === 'web') return 'unsupported';
  await ensureAndroidChannels();
  const next = await Notifications.requestPermissionsAsync();
  if (next.granted) return 'granted';
  return next.canAskAgain ? 'undetermined' : 'denied';
}

export async function registerPushToken(deviceId: string): Promise<string | null> {
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) return null;
  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    return data; // sent to POST /me/push-tokens with the deviceId (4.9)
  } catch {
    return null; // offline, or Expo Go on Android: keep the toggle on, retry on next launch
  }
}
```

The project id already exists in `app.json` (`extra.eas.projectId`). Never log the token.

**Android channels** (`ensureAndroidChannels`, called at boot and before the first permission request). Android lets you change only a channel's name and description after it is created, so pick ids once:

| Channel id | Name shown in system settings | Importance | Used for |
|---|---|---|---|
| `critical` | Booking, payment and security | `HIGH` | Critical updates |
| `routine` | Reminders | `DEFAULT` | Reminders and system messages |
| `promotions` | News and offers | `LOW` | Promotions |

Customers can then silence promotions at system level without losing booking alerts. Set `defaultChannel: "routine"` in the plugin (4.12).

**Foreground behaviour.** In `src/app/_layout.tsx`, at module scope:

```ts
Notifications.setNotificationHandler({
  handleNotification: async (n) => {
    const critical = n.request.content.data?.importance === 'critical';
    return { shouldShowBanner: critical, shouldShowList: true, shouldPlaySound: critical, shouldSetBadge: false };
  },
});
```

SDK 58 uses `shouldShowBanner` and `shouldShowList`; `shouldShowAlert` is deprecated. Check the shape against the v58 page before coding.

**Tap handling.** Listen once in the root layout with `addNotificationResponseReceivedListener` plus `getLastNotificationResponse()` at start (the pattern in Expo's docs). Read `data.url`, accept it only if it starts with `/` and matches an allowlist (`/booking/`, `/profile/`, `/notifications`, `/offers`, `/messages`, `/chat/`), then `router.push(url as Href)` and `clearLastNotificationResponse()`. Reject anything else: a push payload is not trusted input.

**Toggle behaviour on the page:**

| Customer action | Result |
|---|---|
| Turns **Push** on, permission `granted` | Switch on |
| Turns **Push** on, permission `undetermined` | System prompt. Granted: switch on. Not granted: switch snaps back off and a one-line note appears |
| Turns **Push** on, permission `denied` | Switch stays off. `PermissionCard` (icon `BellOff`) replaces the status line: "Notifications are off for Gabfix on this phone." **Open settings** |
| Returns from phone settings | Permission is re-read on screen focus and on `AppState` becoming `active`; if now granted, the status line updates (the switch is not turned on for them) |
| **Save** with Push on and permission `granted` | `registerPushToken` then `POST /me/push-tokens`. Failure does not fail the save: preferences are saved, and registration retries next launch |
| **Save** with Push off | `DELETE /me/push-tokens/{deviceId}` so the server stops sending |

Status line text: `Phone permission: Allowed`, `Phone permission: Not asked yet`, `Phone permission: Off`.

**Do not ask for permission at launch.** Ask at the moment it is useful: after the first booking is confirmed (P14), show a card "Get a message when your cleaner is on the way" with **Turn on** and **Not now**. **Turn on** opens the system prompt. If **Not now**, do not ask again for 30 days. This is a small addition to `confirmed.tsx` and it is the highest-value place to ask.

#### 4.2.5 Rules in code (`src/lib/notify-policy.ts`, `src/lib/quiet-hours.ts`, both **new**, pure TypeScript)

```ts
// quiet-hours.ts
const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/** Minutes since local midnight in the given IANA timezone. */
export function minutesInZone(now: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .formatToParts(now);
  const h = Number(parts.find((p) => p.type === 'hour')?.value ?? 0) % 24;
  const m = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  return h * 60 + m;
}

export function isInQuietHours(now: Date, q: { enabled: boolean; start: string; end: string }, timeZone: string): boolean {
  if (!q.enabled) return false;
  const s = toMinutes(q.start);
  const e = toMinutes(q.end);
  if (s === e) return false;
  const t = minutesInZone(now, timeZone);
  return s < e ? t >= s && t < e : t >= s || t < e; // the second form crosses midnight
}
```

```ts
// notify-policy.ts
import type { NotificationKind } from '@/store/notifications';

export type Importance = 'critical' | 'routine' | 'promo';
export const importanceOf: Record<NotificationKind, Importance> = {
  booking: 'critical',
  payment: 'critical',
  security: 'critical',
  reminder: 'routine',
  system: 'routine',
  promo: 'promo',
};

export type PushDecision = 'deliver' | 'defer' | 'drop';

export function decidePush(kind: NotificationKind, prefs: NotificationPreferences, now = new Date()): PushDecision {
  if (!prefs.push) return 'drop';
  if (kind === 'reminder' && !prefs.reminders) return 'drop';
  if (kind === 'promo' && !prefs.offers) return 'drop';
  if (importanceOf[kind] === 'critical') return 'deliver';
  return isInQuietHours(now, prefs.quietHours, prefs.timezone) ? 'defer' : 'deliver';
}

export const decideInApp = (kind: NotificationKind, prefs: NotificationPreferences): 'save' | 'skip' =>
  !prefs.inApp ? 'skip' : kind === 'reminder' && !prefs.reminders ? 'skip' : kind === 'promo' && !prefs.offers ? 'skip' : 'save';

export function notificationSummary(p: NotificationPreferences): string {
  const channels = p.push ? (p.inApp ? 'Push and in-app on' : 'Push on') : p.inApp ? 'In-app only' : 'All off';
  return p.quietHours.enabled && p.push ? `${channels} · Quiet ${p.quietHours.start}–${p.quietHours.end}` : channels;
}
```

The **server must implement the same rules** for remote push (C3). Give the backend this function as the specification. The client copy decides what the local inbox saves and when its own scheduled reminders fire (a deferred reminder is rescheduled to the next quiet-hours end).

Extend `src/store/notifications.ts`: `NotificationKind` gains `'security'` and `'promo'`; update the `isNotification` guard and `iconFor` in `app/notifications.tsx` (`ShieldAlert`, `Tag`). Existing stored records stay valid. `addNotification` consults `decideInApp` with the current preferences and returns early on `'skip'`.

#### 4.2.6 Warnings and states

| State | UI |
|---|---|
| In-app and Push both off | `InlineBanner` warning: "With both channels off you won't be alerted about booking changes. You can still check status in My bookings." Not blocking |
| Quiet hours on, Push off | The card's chips are dimmed and a caption says "Quiet hours only apply to push." |
| Dirty, customer presses back | `Alert`: "Save your changes?" with **Save**, **Discard**, **Keep editing** (same prompt style as P8's draft prompt) |
| Save succeeds | `InlineBanner` success at the top, "Preferences saved", announced with `AccessibilityInfo.announceForAccessibility`, auto-dismiss after 4 s |
| Save fails (network) | `InlineBanner` error with **Try again**. Local state is kept dirty |
| Unsupported timezone string from the server | Falls back to `Africa/Kampala` and shows its label |

`InlineBanner` (`src/components/ui/inline-banner.tsx`, **new**) fills the "Toast" gap (finding F11) without a new dependency: variants `success`, `warning`, `error`, `info` mapped to `successBg`/`warningBg`/`errorBg`/`infoBg`, a leading Lucide icon, optional action label, optional dismiss X, `accessibilityRole="alert"` and `accessibilityLiveRegion="polite"`. Workstream B's error banner (3.7) and suggestion banner (3.4) use the same component.

#### 4.2.7 Timezone (`src/config/timezones.ts`, **new**)

Launch is Uganda only, so keep a short list and detect the phone's zone:

```ts
export const timezones = [
  { id: 'Africa/Kampala',       city: 'Kampala',       country: 'Uganda' },
  { id: 'Africa/Nairobi',       city: 'Nairobi',       country: 'Kenya' },
  { id: 'Africa/Kigali',        city: 'Kigali',        country: 'Rwanda' },
  { id: 'Africa/Dar_es_Salaam', city: 'Dar es Salaam', country: 'Tanzania' },
  { id: 'Africa/Lagos',         city: 'Lagos',         country: 'Nigeria' },
  { id: 'Europe/London',        city: 'London',        country: 'United Kingdom' },
] as const;

export const deviceTimezone = (): string | null => {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone ?? null; } catch { return null; }
};
```

`TimezoneSheet` (platform `Modal`, same shell as `LanguageSheet` in `profile.tsx`): a radio list of the six plus, when `deviceTimezone()` is set and not in the list, a first row "Use my phone's timezone (`<id>`)". Confirm that Hermes on both platforms returns an IANA id and supports `formatToParts` with `timeZone` on a development build (Open question Q16 covers the zone list).

#### 4.2.8 Copy sheet

| Where | Text |
|---|---|
| Title | Notifications |
| Intro | Choose which updates you receive and when. |
| Channels | In-app · Keep updates in your inbox. / Push · Alerts on this phone. |
| What we send | Booking and payment updates · Always on · Confirmations, your cleaner's arrival, payments and security alerts. / Reminders · Before a clean, and after it. / News and offers · Promotions and new services from Gabfix. |
| Quiet hours | Quiet hours for push · Routine pushes wait until quiet hours end. Critical updates may bypass quiet hours. Turned-off channels stay off. |
| Timezone | Timezone |
| Buttons | Save preferences / Open phone settings |
| Footer | Your phone must also allow Gabfix notifications. |
| Permission off | Notifications are off for Gabfix on this phone. Allow them in Settings to get alerts. |
| Both off | With both channels off you won't be alerted about booking changes. You can still check status in My bookings. |
| Saved | Preferences saved |
| Discard prompt | Save your changes? · Save / Discard / Keep editing |

#### 4.2.9 Entry points

| From | Change |
|---|---|
| Profile, Preferences, **Notifications** | `router.push('/profile/notification-preferences')` |
| Inbox (`/notifications`) header | A `Settings` (gear) icon button, 48 dp, label "Notification settings" |
| Inbox empty state | Secondary link "Notification settings" |
| P14 Booking Confirmed | The permission pre-prompt card (4.2.4) |
| Push received while permission off | n/a |

### 4.3 P29 Security

#### 4.3.1 What the reference shows, and what Gabfix does with it

| Reference element | Gabfix |
|---|---|
| Dark header with back arrow and "Manage password, authentication, and account protection" | Gabfix `TopBar` (title "Security") and an intro line |
| "Keep your account secure" card | Kept as a `green50` summary card with a `ShieldCheck` tile and a three-check **protection level** (4.3.2) |
| Change Password, "Last updated: Not available" | **Change password**. If no date is known the caption reads "Change it regularly to stay safe", never "Not available" |
| Two-Factor Authentication switch | **Two-factor authentication**. A tap opens P29b; the switch is a status indicator that is not tappable by itself, so the flow cannot be skipped |
| Trusted Devices, "0 signed-in devices" | **Devices and sessions** with the real count from the shared hook (C8, C10) |
| Login Activity, "Last login" | **Login activity** with the last successful sign-in |
| Info note about identity checks | Kept, reworded (4.3.7) |
| Biometric (Gabfix addition) | **Face ID / fingerprint unlock** row (4.3.5) |

#### 4.3.2 Layout

```
┌──────────────────────────────────────────┐
│ ←            Security                    │
├──────────────────────────────────────────┤
│ ┌──────────────────────────────────────┐ │  base.card, green50 tint
│ │ 🛡  Keep your account secure         │ │
│ │ Protection: Good   ▮▮▮▯              │ │  4 segments, same look as the sign-up meter
│ │ ✓ Password updated recently          │ │
│ │ ✓ Two-factor is on                   │ │
│ │ ○ Face ID unlock is off   [Turn on]  │ │  only unmet items show an action
│ └──────────────────────────────────────┘ │
│                                          │
│ SIGN-IN                                  │
│ ┌──────────────────────────────────────┐ │
│ │ 🔒 Change password                 › │ │
│ │    Last changed 12 Oct 2026          │ │
│ │ 🛡 Two-factor authentication  On   › │ │
│ │    Code sent to +256 ••• ••• 774     │ │
│ │ 👆 Face ID unlock          (switch)  │ │
│ │    Lock Gabfix when you leave it     │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ ACTIVITY                                 │
│ ┌──────────────────────────────────────┐ │
│ │ 📱 Devices and sessions            › │ │
│ │    2 signed-in devices               │ │
│ │ 🔑 Login activity                  › │ │
│ │    Last login 20 Nov 2026, 05:03     │ │
│ └──────────────────────────────────────┘ │
│ For your protection, Gabfix may ask you  │
│ to verify your identity when something   │
│ unusual is detected.                     │  info chip (infoBg)
└──────────────────────────────────────────┘
```

**Protection level** is a convenience, not a score the server owns. Three checks: password changed within 180 days, two-factor on, unlock on. Level: 0 or 1 met = **Basic**, 2 = **Good**, 3 = **Strong**. Unmet checks show a text action. If a check's data is unknown (no password date yet), it is counted as unmet and its line says "Not checked yet". Drop the card if product prefers a plainer page; nothing else depends on it.

All rows use `SettingsRow`. Row values come from `useSecuritySummary()` (4.3.6) and `useDeviceSessions()` (4.4.4). While loading, rows show a `Skeleton` line in place of the value. If the summary request fails, rows keep their labels and show "Couldn't load" with a `RetryHint`.

#### 4.3.3 P29a Change password

`/profile/security/password`, shaped like `profile/edit.tsx` (`TopBar`, keyboard-avoiding scroll, `Input` fields, sticky-free Save button at the end).

| Field | Rules |
|---|---|
| Current password | `Input secure`, `textContentType="password"`, required |
| New password | `Input secure`, `textContentType="newPassword"`, `isStrongEnoughPassword` (8+), must differ from current. Strength meter beneath |
| Confirm new password | Must match; error appears on blur, not on every keystroke |
| Checkbox | **Sign out my other devices** (default on). Sent as `revokeOtherSessions` |
| Link | **Forgot your current password?** opens `/forgot-password` |

- The strength meter is currently inline in `sign-up.tsx` with glass styling. Extract `PasswordStrengthMeter` to `src/components/ui/strength-meter.tsx` with a `variant: 'light' | 'glass'`; use `passwordStrength()` from `src/utils/validation.ts`. Switching sign-up to the shared component is optional in this phase; building the light variant is not.
- **Button** `Update password`, disabled until valid, `loading` while saving.
- On success: `markPasswordChanged()` in the security store, a `security` inbox record "Your password was changed", an inline success state with **Back to Security**. If `revokeOtherSessions` was on, also refresh the sessions store.
- **Contract hazard (important).** `apiRequest` treats **any 401** as an expired session: it tries a refresh, then signs the user out (`client.ts`). A wrong *current password* must therefore come back from the server as **400 or 403 with `code: "wrong_password"`**, never 401, or the customer is logged out for a typo. Put this in the API contract (4.9). The screen maps `wrong_password` to the field error "That password isn't right." and keeps the form.
- Mock (no API): any current password works except `wrongpass`, which returns the `wrong_password` error so the error state can be exercised (same idea as OTP `000000`).
- 429 uses the existing client message ("Too many attempts. Please wait a moment and try again.").

#### 4.3.4 P29b Two-factor authentication

`/profile/security/two-factor`. One screen, three states driven by local `step` state.

```
State "off" (intro)                    State "verify"                    State "on"
┌────────────────────────┐   ┌─────────────────────────────┐   ┌─────────────────────────────┐
│ 🛡  Add a second step  │   │ Enter the 6-digit code      │   │ ✓ Two-factor is on          │
│ At sign-in we text a   │   │ sent to +256 ••• ••• 774    │   │ Codes go to +256 ••• ••• 774│
│ code to your phone.    │   │ [ ][ ][ ][ ][ ][ ]          │   │                             │
│ • Stops sign-ins from  │   │ Resend in 0:42              │   │ Recovery codes              │
│   stolen passwords     │   │ [   Verify and turn on   ]  │   │ [ View new codes ]          │
│ • Takes a few seconds  │   └─────────────────────────────┘   │ [ Turn off two-factor ]     │
│ [   Send me a code   ] │                                     └─────────────────────────────┘
└────────────────────────┘
```

- **Needs a phone number on the account.** If `useAuthUser().phone` is empty, the intro shows a warning card "Add a phone number first" with **Add phone number** opening `/profile/edit`.
- Reuse `CodeInput` (variant `default`), the resend timer pattern from `otp.tsx`, and the same error behaviour. Mock: `000000` fails, anything else passes.
- After a successful verify the server returns **8 one-time recovery codes**. Show them once in a `base.card` with **Copy all** (`expo-clipboard`) and the warning "Save these now. Each works once and we can't show them again." A checkbox **I saved my codes** enables **Done**. Never write recovery codes to AsyncStorage or logs; hold them in component state only.
- **Turning off** needs the current password (a small sheet with one `Input`) and then calls `POST /me/2fa/disable`. Success writes a `security` inbox record.
- **Sign-in with two-factor on.** `login()` and `verifyOtp()` in `src/lib/api/auth.ts` may now return `{ twoFactorRequired: true, challengeId, phoneMasked }` instead of a session. Change their return type to `AuthSession | TwoFactorChallenge`, add a type guard, and in `login.tsx` and `otp.tsx` route a challenge to `/otp` with params `mode=2fa&challengeId=…&phoneMasked=…`. In that mode `otp.tsx` calls `POST /auth/2fa/verify { challengeId, code, device }` and then `startSession` as before. Add **Use a recovery code** under the boxes in this mode (one text `Input`).
- Mock behaviour: the security store's `twoFactor.enabled` flag makes the mock `login()` return a challenge. Because that flag lives on the phone, it is a demo only; the screen says nothing about "protection" in mock mode beyond what the flow does.
- Cost and abuse: SMS is paid and attackable. The server must rate-limit sends (suggest 5 per hour per account) and cap resends; the client already disables Resend during the timer. Open question Q11 covers the provider and cost.

#### 4.3.5 Face ID / fingerprint unlock (real implementation of finding F7)

Install `npx expo install expo-local-authentication`. Re-read `https://docs.expo.dev/versions/v58.0.0/sdk/local-authentication/` first. Face ID needs a **development build** (not Expo Go on iOS). Plugin entry in 4.12.

`src/lib/biometrics.ts` (**new**):

```ts
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

export type BiometricStatus = 'ready' | 'no-hardware' | 'not-enrolled' | 'unsupported';

export async function getBiometricStatus(): Promise<BiometricStatus> {
  if (Platform.OS === 'web') return 'unsupported';
  if (!(await LocalAuthentication.hasHardwareAsync())) return 'no-hardware';
  if (!(await LocalAuthentication.isEnrolledAsync())) return 'not-enrolled';
  return 'ready';
}

export async function biometricLabel(): Promise<'Face ID' | 'Fingerprint' | 'Biometrics'> {
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return 'Face ID';
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) return 'Fingerprint';
  return 'Biometrics';
}

export type ConfirmResult = { ok: true } | { ok: false; reason: 'cancelled' | 'lockout' | 'not-enrolled' | 'failed' };

export async function confirmIdentity(promptMessage: string): Promise<ConfirmResult> {
  const result = await LocalAuthentication.authenticateAsync({ promptMessage, cancelLabel: 'Cancel' });
  if (result.success) return { ok: true };
  switch (result.error) {
    case 'user_cancel':
    case 'system_cancel':
    case 'app_cancel': return { ok: false, reason: 'cancelled' };
    case 'lockout': return { ok: false, reason: 'lockout' };
    case 'not_enrolled': return { ok: false, reason: 'not-enrolled' };
    default: return { ok: false, reason: 'failed' };
  }
}
```

The label on the row is dynamic: "Face ID unlock", "Fingerprint unlock" or "Biometric unlock". iOS shows "Face ID" or "Touch ID" through the system prompt; use the generic "Face ID / fingerprint" only when the label cannot be read.

**What the switch does:**

| Step | Behaviour |
|---|---|
| Availability | `getBiometricStatus()` on focus. `no-hardware`: row disabled, caption "This phone doesn't support it". `not-enrolled`: row disabled, caption "Set up Face ID or fingerprint in your phone settings first", **Open settings** |
| Turn on | Must pass `confirmIdentity("Confirm it's you to turn on unlock")` first. Only then is `security.biometric` set |
| App lock | While on and signed in, the app locks on **cold start** and when it returns from the background after more than 30 seconds (`appLock.graceSeconds` in config). Locked state shows `AppLockScreen` over everything |
| Lock screen | Full-screen `colors.green500`, the `LogoBadge`, "Gabfix is locked", a primary-on-green `Button` **Unlock** (and the system prompt opens automatically once), and a ghost **Log out instead**. Android back is disabled (`BackHandler`) while locked |
| Failure | Three failed attempts in a row show "Too many tries" and require **Log out instead** or waiting for the system lockout to clear. `lockout` from the OS shows its own message and keeps the device passcode option the system offers |
| Enrolment removed later | `not_enrolled` while unlocking turns the setting off, writes an inbox record "Unlock turned off: no Face ID or fingerprint is set up", and lets the customer in (the session itself is still valid) |
| Turn off | Requires `confirmIdentity` once, same as turning on |
| Sign out / delete account | `endSession()` clears `security.biometric`. The next account on the same phone starts with it off |

**Interaction with camera and pickers (important).** Opening the camera, the video recorder, the photo library or a system permission dialog sends the app to `background` or `inactive`. Without a guard, a customer who films a walkthrough on P8b would come back to a lock screen, and an interrupted flow could drop their place. Provide `runExternalFlow(fn)` in `src/store/app-lock.ts`: it sets a `suppress` flag before `fn` runs and keeps it for 5 seconds after `fn` settles. Wrap every call to `launchCameraAsync`, `launchImageLibraryAsync`, `requestCameraPermissionsAsync`, `requestMediaLibraryPermissionsAsync`, `requestPermissionsAsync` and `Linking.openSettings` (including the existing avatar, quote, chat and review pickers). Lock only on `AppState === 'background'`, not on `inactive`.

**Be honest about what this is.** It is a privacy lock that stops someone browsing the app on an unlocked phone. It does not encrypt the stored tokens (those are in SecureStore as today). The setting is device-local and is never sent to the server. A later hardening step could bind the stored refresh token to biometrics with SecureStore's authentication option; that is not part of this phase.

`src/store/app-lock.ts` and `src/components/ui/app-lock.tsx` (**new**). Mount `<AppLockScreen />` beside `<OfflineBanner />` and `<SessionExpiredModal />` in `_layout.tsx`. The initial `locked` value is computed during boot, before the first frame (the layout already returns `null` until hydration finishes), so protected content never flashes.

#### 4.3.6 Security store and summary (`src/store/security.ts`, **new**)

```ts
export type TwoFactorState = { enabled: boolean; method: 'sms'; enabledAtISO?: string };

export type SecuritySummary = {
  passwordChangedAtISO?: string;
  twoFactor: TwoFactorState;
  lastLoginISO?: string;
};

type SecurityState = SecuritySummary & { biometric: boolean; hydrated: boolean; loadedAt?: number };
```

- Persisted as `gabfix.security.v1`. `biometric` is device-local; everything else is a **cache of the server**. With an API base URL set, `useSecuritySummary()` calls `GET /me/security` on mount (stale after 60 s) and the server wins. Without one, the store is the source and the Security page says nothing about being "verified".
- `markPasswordChanged()`, `setTwoFactor(state)`, `setBiometric(on)` and `clearSecurity()`.
- Hydrated in `_layout.tsx`'s `Promise.all`. On first run, `biometric` is seeded from `migrateV1().biometric` and then ignored until the customer turns it on again through the new flow (an old stored `true` must not lock the app without ever having been confirmed).
- `deleteLocalAccount()` clears all `gabfix.*` AsyncStorage keys already, which covers this store.

#### 4.3.7 P29c Login activity

`/profile/security/activity`. A `SectionList` grouped Today / Earlier, using the inbox's row style (44-plus high rows with a 36 dp icon tile).

| Element | Spec |
|---|---|
| Row | Icon tile (`Smartphone` for success, `ShieldAlert` for failed attempts), title "Signed in" / "Failed sign-in attempt" / "Password changed" / "Two-factor turned on", caption "Galaxy S8+ · Android · Kampala (approx.)", time on the right |
| Method | Caption suffix: Password, SMS code, Google |
| Flags | A `New device` pill (`infoBg`) when the device was not seen before |
| Footer | "Don't recognise something? **Change password** and **Sign out other devices**" with two text links |
| Empty | `EmptyState`: "No sign-ins to show yet." |
| Retention | Last 20 events, 90 days (Q13) |
| Privacy | The app shows an approximate city and never an IP address |

Source `GET /me/login-activity`. Mock: `startSession()` appends an event to a local list (`gabfix.login-activity.v1`, max 20) so the screen has real content on a phone.

Copy for the info chip on Security: "For your protection, Gabfix may ask you to verify your identity when something unusual is detected."

### 4.4 P30 Devices and sessions

#### 4.4.1 What the reference shows, and what Gabfix does with it

| Reference element | Gabfix |
|---|---|
| "Your devices" card with SIGNED-IN DEVICES 2 and OTHER DEVICES 1 | Kept as a summary card with two stat tiles |
| Red **Sign out other devices** | `Button variant="destructive"` (shared red), full width |
| THIS DEVICE card with "Current device" badge, last used, signed in, "mobile" chip, "This is the device you are currently using." | Kept. Badge uses `successBg`/`green700`. The chip shows the platform ("Android", "iOS") instead of the vague "mobile" |
| OTHER SIGNED-IN DEVICES with **Sign out device** | Kept. Pink row becomes an `errorBg` pressable, 48 dp, `LogOut` icon |
| Monitor icon for a phone | `Smartphone` icon (`Monitor` for a future web session) |
| Two identical "Galaxy S8+" rows | Prevented at the source (C7, 4.4.2) |

#### 4.4.2 The duplicate-device defect, and the fix

Your Devices screenshot lists the same phone twice (16/11/2026 10:25 and 16/11/2026 16:19). Without a device identity, every login is a new session, so signing in twice on one phone makes two rows. Security also said "0 signed-in devices" while this page said 2, because the two screens read different things.

Fix:

1. The app creates a **`deviceId`** once (a random UUID), stores it in SecureStore (`gabfix.device-id.v1`; `localStorage` on web), and **keeps it across logout**. It is deleted only by delete-account.
2. It sends `{ deviceId, name, platform, osVersion, appVersion }` as `device` on `POST /auth/login`, `/auth/otp/verify`, `/auth/2fa/verify` and `/auth/refresh`.
3. The server keeps **one active session per (user, deviceId)**: a new login on the same device replaces the old session and revokes its refresh token.
4. Both pages read `useDeviceSessions()` (4.4.4).

`src/lib/device.ts` (**new**):

```ts
import * as Crypto from 'expo-crypto';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEY = 'gabfix.device-id.v1';
let cached: string | null = null;

export async function getDeviceId(): Promise<string> {
  if (cached) return cached;
  const existing = Platform.OS === 'web' ? window.localStorage.getItem(KEY) : await SecureStore.getItemAsync(KEY);
  if (existing) return (cached = existing);
  const created = Crypto.randomUUID();
  if (Platform.OS === 'web') window.localStorage.setItem(KEY, created);
  else await SecureStore.setItemAsync(KEY, created);
  return (cached = created);
}

export async function getDeviceInfo() {
  return {
    deviceId: await getDeviceId(),
    name: Device.modelName ?? Device.deviceName ?? 'This phone',
    platform: Platform.OS as 'android' | 'ios' | 'web',
    osVersion: Device.osVersion ?? undefined,
    appVersion: Constants.expoConfig?.version ?? '1.0.0',
  };
}

export async function clearDeviceId() { /* used only by delete account */ }
```

`expo-device` is already in `package.json`; `expo-crypto` is not (`npx expo install expo-crypto`). Confirm `randomUUID` against the v58 page. Wrap web `localStorage` calls in try/catch as `session-storage.ts` does. Do not collect advertising ids, IMEI, serial numbers or precise location.

`AuthSession` in `src/lib/api/auth.ts` gains optional `sessionId?: string` and `deviceId?: string`. They are optional so sessions already saved on phones still load (`loadSession` only checks `accessToken` and `user.id`).

`deleteLocalAccount()` (`src/lib/account.ts`) today clears only AsyncStorage keys that start with `gabfix.`. SecureStore items are not touched. Add `clearDeviceId()` there, plus the push-token unregistration (4.2.4) and the media directory (3.8). See finding F13.

#### 4.4.3 Layout

```
┌──────────────────────────────────────────┐
│ ←        Devices and sessions            │
├──────────────────────────────────────────┤
│ ┌──────────────────────────────────────┐ │  base.card
│ │ 🛡 Your devices                      │ │
│ │ Review where your Gabfix account is  │ │
│ │ signed in and remove any you don't   │ │
│ │ recognise.                           │ │
│ │ ┌─────────────┐ ┌─────────────┐      │ │
│ │ │ SIGNED IN   │ │ OTHER       │      │ │  two stat tiles (green50)
│ │ │     2       │ │     1       │      │ │
│ │ └─────────────┘ └─────────────┘      │ │
│ └──────────────────────────────────────┘ │
│ [ ⎋  Sign out other devices ]            │  destructive; hidden when there are none
│                                          │
│ THIS DEVICE                              │
│ ┌──────────────────────────────────────┐ │
│ │ 📱 Galaxy S8+  [Current device]      │ │
│ │ 🕒 Last used: now                     │ │
│ │ Signed in: 16 Nov 2026, 16:19        │ │
│ │ [Android] · Kampala (approx.)        │ │
│ │ This is the phone you're using.      │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ OTHER SIGNED-IN DEVICES                  │
│ ┌──────────────────────────────────────┐ │
│ │ 📱 iPhone 13                         │ │
│ │ 🕒 Last used: 16 Nov 2026, 12:43     │ │
│ │ Signed in: 16 Nov 2026, 10:25        │ │
│ │ [iOS]                                │ │
│ │ [ ⎋  Sign out device ]               │ │
│ └──────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

| Element | Spec |
|---|---|
| Date format | Use the app formatter (`dateLong`, `time12` in `src/utils/format.ts`), not the reference's `20/11/2026, 05:03:28` with seconds. Relative for the last hour: "Last used: just now / 5 min ago" |
| Counts | `signedIn = sessions.length`, `others = signedIn - 1`. The current session is always present |
| Current device card | `base.card`, 3 lines, `green50` note row at the bottom. No sign-out button (use **Log out** in Profile) |
| Other device cards | Same card with the sign-out row. Order: most recently used first |
| Empty others | A single `EmptyState`-style card: "You're only signed in on this phone." and the **Sign out other devices** button is hidden |
| Loading | Three `Skeleton` cards |
| Error | `ErrorState` with **Try again** and a `RetryHint` after 8 s |
| Pull to refresh | `RefreshControl` calls `refresh()` |
| Offline | Destructive buttons disabled with the caption "Connect to the internet to sign out a device." |

Destructive actions use a shared `ConfirmSheet` (`src/components/ui/confirm-sheet.tsx`, **new**): extract the shell of `DeleteAccountSheet` (handle, icon disc, title, body, a destructive `Button`, a ghost cancel `Button`) so Delete account, Sign out device and Sign out other devices share it. Copy in 4.4.6.

#### 4.4.4 Sessions store and hook

`src/store/device-sessions.ts` (module store, `useSyncExternalStore`, like the other stores) and `src/hooks/use-device-sessions.ts`:

```ts
export type DeviceSession = {
  id: string;
  deviceId: string;
  name: string;
  platform: 'android' | 'ios' | 'web';
  osVersion?: string;
  appVersion?: string;
  approxLocation?: string;   // 'Kampala, Uganda'
  signedInAtISO: string;
  lastUsedAtISO: string;
  current: boolean;
};

type State = { sessions: DeviceSession[]; status: 'idle' | 'loading' | 'ready' | 'error'; loadedAt?: number };

export function useDeviceSessions() {
  // returns { sessions, current, others, status, refresh, signOutDevice(id), signOutOthers() }
}
```

- `refresh()` calls `GET /me/sessions`. Results are stale after 60 s; Security and P30 both call `refresh()` on focus and share the cached list, so their counts always agree.
- `signOutDevice(id)` removes the row **optimistically**, calls `DELETE /me/sessions/{id}`, and restores the row with an error banner if the call fails. `signOutOthers()` does the same for `POST /me/sessions/revoke-others`.
- Never allow `signOutDevice` on the current session (it is not offered in the UI and the function refuses it).
- Without an API base URL: the store seeds the current device from `getDeviceInfo()` only. To exercise the "other devices" UI in development, set `EXPO_PUBLIC_MOCK_SESSIONS=2`; the store then adds one fake other device (clearly named "Sample device"). Sign-outs in mock mode only change local state.
- **Honest copy about timing.** A revoked device's refresh token stops working at once, but an access token already issued keeps working until it expires. State the access-token lifetime in the copy (assumed 15 minutes, Q12): "They'll be signed out within 15 minutes."

When a session is revoked from elsewhere, the next authenticated call returns 401 and the existing `SessionExpiredModal` flow runs. No new code is needed for that path.

#### 4.4.5 Server notifications that belong here

A new sign-in on an unrecognised `deviceId` triggers a **critical** push and inbox record: "New sign-in on {device name}. If this wasn't you, review your devices." with `href: '/profile/devices'`, kind `security`. This is the reason `security` bypasses quiet hours (C4).

#### 4.4.6 Copy sheet (Security, Change password, Two-factor, Login activity, Devices)

| Where | Text |
|---|---|
| Security title / card | Security · Keep your account secure |
| Security rows | Change password · Last changed {date} (else: Change it regularly to stay safe) / Two-factor authentication · On: Code sent to {masked phone}; Off: Add an extra layer of protection / {Face ID, Fingerprint or Biometric} unlock · Lock Gabfix when you leave it / Devices and sessions · {n} signed-in devices / Login activity · Last login {date} |
| Protection | Basic / Good / Strong |
| Info chip | For your protection, Gabfix may ask you to verify your identity when something unusual is detected. |
| Password | Update password · That password isn't right. · Passwords don't match. · Use at least 8 characters. · Choose a password you haven't used here. · Sign out my other devices |
| Password success | Your password was updated. |
| Two-factor intro | Add a second step · When you sign in, we text a code to your phone. · Send me a code |
| Two-factor verify | Enter the 6-digit code sent to {masked phone} · Verify and turn on · Resend in {m:ss} |
| Recovery | Save these now. Each code works once and we can't show them again. · Copy all · I saved my codes |
| Two-factor off | Turn off two-factor? Your account will rely on your password alone. · Turn off · Keep it on |
| Unlock | Confirm it's you to turn on unlock · Gabfix is locked · Unlock · Log out instead · Set up Face ID or fingerprint in your phone settings first · This phone doesn't support it |
| Devices | Devices and sessions · Your devices · Review where your Gabfix account is signed in and remove any you don't recognise. · SIGNED IN / OTHER DEVICES · This device · Other signed-in devices · Current device · This is the phone you're using. · Sign out device / Sign out other devices |
| Devices confirm | Sign out this device? {name} will be signed out within 15 minutes. · Sign out / Cancel · Sign out other devices? {n} devices will be signed out within 15 minutes. |
| Devices result | Signed out {name}. / Signed out {n} devices. |
| Activity | Login activity · Signed in · Failed sign-in attempt · Password changed · Two-factor turned on · New device · Don't recognise something? |

### 4.5 New shared components (Workstream C)

| Component | File | Spec |
|---|---|---|
| `SettingsGroup`, `SettingsRow` | `src/components/ui/settings-list.tsx` | Moved out of `profile.tsx`, unchanged. Adds an optional `locked` label prop for "Always on" and `accessibilityHint` |
| `InlineBanner` | `src/components/ui/inline-banner.tsx` | Variants success/warning/error/info, icon, action, dismiss, live-region role (4.2.6). Also used by Workstream B |
| `ConfirmSheet` | `src/components/ui/confirm-sheet.tsx` | Shell extracted from `DeleteAccountSheet`: handle, icon disc, title, body, destructive primary, ghost cancel, `busy` state |
| `PasswordStrengthMeter` | `src/components/ui/strength-meter.tsx` | `variant` light/glass, 4 segments, label |
| `TimezoneSheet` | `src/components/profile/timezone-sheet.tsx` | Radio list in the standard sheet shell |
| `TimeChips` | `src/components/profile/time-chips.tsx` | Thin wrapper over `ChipSelector` for the quiet-hours start and end |
| `AppLockScreen` | `src/components/ui/app-lock.tsx` | 4.3.5 |
| `StatTile` | `src/components/ui/stat-tile.tsx` | `green50` tile with an uppercase caption and a `poppinsSemi` 24/32 number; used by P29 and P30 (and available to P27a) |
| `BottomSheet` | `src/components/ui/bottom-sheet.tsx` | The one pinned drawer shell for every sheet (11.5); `ConfirmSheet` is built on it |
| `FilterChip` | `src/components/ui/filter-chip.tsx` | Centred pill chip (16.4) |
| `Avatar` | `src/components/ui/avatar.tsx` | Photo circle with initials fallback (12.3) |
| `KeyboardScreen`, `KeyboardSheetBody`, `StickyComposer` | `src/components/ui/` | Keyboard behaviour (12.2) |
| `MomoNumberPicker` | `src/components/payment/momo-number-picker.tsx` | Saved numbers per network plus "Use new number" (11.2) |
| `DynamicForm`, `MeasurementInput` | `src/components/booking/` | Schema-driven job details (14.4) |

### 4.6 Per-file checklist (Workstream C)

**New**
- [ ] `src/app/profile/notification-preferences.tsx`
- [ ] `src/app/profile/security/index.tsx`, `password.tsx`, `two-factor.tsx`, `activity.tsx`
- [ ] `src/app/profile/devices.tsx`
- [ ] `src/components/ui/settings-list.tsx`, `inline-banner.tsx`, `confirm-sheet.tsx`, `strength-meter.tsx`, `app-lock.tsx`, `stat-tile.tsx`
- [ ] `src/components/profile/timezone-sheet.tsx`, `time-chips.tsx`
- [ ] `src/config/timezones.ts`
- [ ] `src/lib/quiet-hours.ts`, `notify-policy.ts`, `push.ts`, `biometrics.ts`, `device.ts`, `id.ts` (shared `newId()` wrapping `Crypto.randomUUID`, also used by Workstream B for media ids)
- [ ] `src/store/security.ts`, `device-sessions.ts`, `app-lock.ts`, `login-activity.ts`
- [ ] `src/hooks/use-device-sessions.ts`, `use-security-summary.ts`, `use-push-permission.ts`
- [ ] `src/lib/__tests__/quiet-hours.test.ts`, `notify-policy.test.ts`, `src/store/__tests__/profile-settings.test.ts`, `device-sessions.test.ts`, `security.test.ts`

**Modified**
- [ ] `src/app/(tabs)/profile.tsx`: import `SettingsGroup`/`SettingsRow`; add Security, Devices and sessions, Notifications rows; remove the three notification switches and the biometric switch; `MapPinned` icon for Service area; optional Report a safety concern row; wrap `pickAvatarImage` in `runExternalFlow`
- [ ] `src/store/profile-settings.ts`: v2 shape, `migrateV1`, `saveNotificationPreferences`; remove `setNotificationPreference` and `setBiometricEnabled`
- [ ] `src/store/notifications.ts`: kinds `security` and `promo`; `decideInApp` in `addNotification`
- [ ] `src/app/notifications.tsx`: icons for the new kinds; gear button in the header; empty-state link
- [ ] `src/lib/api/auth.ts`: `AuthSession.sessionId/deviceId`, `device` in every auth call, `TwoFactorChallenge` return type, `verifyTwoFactor`, `changePassword`
- [ ] `src/app/login.tsx`, `src/app/otp.tsx`: handle the 2FA challenge (`mode=2fa`)
- [ ] `src/store/session.ts`: `endSession()` clears `security.biometric`; `startSession()` records a login event
- [ ] `src/lib/account.ts`: `clearDeviceId()`, push-token unregistration, media directory deletion
- [ ] `src/app/book/[slug]/confirmed.tsx`: push permission pre-prompt card
- [ ] `src/app/_layout.tsx`: register the six routes; `hydrateSecurity()`, `hydrateLoginActivity()` in `Promise.all`; `setNotificationHandler`, response listener, `ensureAndroidChannels()`; mount `AppLockScreen`
- [ ] `src/components/ui/permission-card.tsx`: `icon`, `actionLabel` (shared with Workstream B, 3.10)
- [ ] `src/app/sign-up.tsx`: optional switch to `PasswordStrengthMeter variant="glass"`
- [ ] `app.json`: `expo-notifications` and `expo-local-authentication` plugins (4.12)
- [ ] `package.json` through `npx expo install expo-notifications expo-local-authentication expo-crypto`

### 4.7 Acceptance criteria (Workstream C)

1. Profile shows Security and Devices and sessions under Account and Notifications under Preferences. The three notification switches and the biometric switch are gone. Screenshots of Profile before and after the extraction (4.1) look identical apart from the added rows.
2. **P28:** Save is disabled until something changes; leaving with unsaved changes prompts; saving persists to the v2 store and survives a restart. A phone upgraded from v1 keeps its previous choices (migration test passes).
3. **P28:** Turning on Push with permission denied leaves it off and shows the `PermissionCard` with **Open settings**; returning from settings updates the status line without turning the switch on.
4. **P28:** Quiet hours chips and timezone work; the unit tests for `isInQuietHours` and `decidePush` pass, including a window that crosses midnight.
5. **P28:** Booking and payment updates cannot be switched off. With both channels off, the warning banner appears.
6. **P29:** Rows show real values. The device count equals the P30 count on every visit (same hook). "Not available" never appears.
7. **P29a:** A wrong current password shows a field error and does **not** sign the user out (mock `wrongpass`; and the contract requires 400/403).
8. **P29b:** The enable flow sends and verifies a code, shows recovery codes once, and the sign-in flow then asks for a code. Turning off needs the password.
9. **Unlock:** With it on, a cold start and a return after 30 s show the lock screen; Face ID/fingerprint unlocks it; **Log out instead** works; removing enrolment turns it off gracefully. Taking a photo or video on P8b does **not** trigger the lock.
10. **P30:** Signing in twice on the same phone yields one row (verified against the mock with a repeated `startSession` and the same `deviceId`). Sign out device and Sign out other devices confirm first, update the list immediately, and roll back on failure.
11. A new sign-in notification routes to `/profile/devices`.
12. `deleteLocalAccount()` removes the device id, security cache, push registration and media directory.
13. VoiceOver and TalkBack: switches are labelled with state, the locked row reads "always on", counters and stat tiles read as one phrase, destructive buttons announce the device name. 130% text does not clip any row.
14. `npx tsc --noEmit`, `npx expo lint`, `npm test` pass. Verified on a real iPhone and a real Android phone in a development build: push permission prompt, settings round trip, biometric prompt, lock/unlock, and background/foreground.

### 4.8 Edge cases (Workstream C)

| Case | Behaviour |
|---|---|
| Customer toggles Push on, accepts the prompt, then disables notifications in system settings | Next focus re-reads permission: status line says Off; the saved preference stays on and shows the `PermissionCard` |
| Android 13 and the prompt never appears | Channels are created before the request (4.2.4); if it still does not appear, treat as `denied` and show the settings card |
| Expo Go on Android | Push registration fails quietly; the page works; a caption says "Push needs the installed app" in development builds only |
| Quiet hours start equals end | Save disabled, inline error |
| Phone timezone differs from the saved one | Show "Your phone is set to {zone}" with **Use it** under the selector; never switch silently |
| Daylight saving | Uganda has none; `Intl` handles zones that do |
| Two phones, different preferences | Preferences are per account on the server (4.9); the push toggle is per device because a token belongs to a device. Show "Push on this phone" in the caption when the API is live |
| Biometric succeeds but the session is expired | The unlock lets the customer in; the next API call shows the existing session-expired modal |
| Customer force-quits during the lock screen | Next cold start locks again (locked is computed at boot) |
| App update changes the lock timeout | Value comes from config; no stored copy |
| Customer deletes the app and reinstalls | New `deviceId`, so the old row remains on the server until revoked; the Devices page lets them remove it. Document in Q12 |
| Offline while saving preferences | Saved locally, banner "Saved on this phone. We'll sync when you're online."; sync on reconnect |
| Offline while signing out a device | Disabled with the caption in 4.4.3 |
| 2FA SMS not received | Resend after the timer; **Use a recovery code** in sign-in mode |
| Password changed on another device | This phone's refresh fails; existing expiry modal |

---

### 4.9 API contracts (to confirm with the backend; recorded as Open items 32 to 35)

All requests go through `src/lib/api/client.ts` (bearer token, one refresh on 401, normalised `ApiError`). Every function below has a local fallback when `EXPO_PUBLIC_API_BASE_URL` is unset (4.10). New file: `src/lib/api/account.ts`.

| Method and path | Purpose | Notes |
|---|---|---|
| `GET /me/notification-preferences` | Read | Returns the `NotificationPreferences` shape in 4.2.3 |
| `PUT /me/notification-preferences` | Save | Whole object. Server validates `HH:mm`, IANA timezone, `start !== end` |
| `POST /me/push-tokens` | Register | Body `{ deviceId, token, platform }`. Upsert by `deviceId` |
| `DELETE /me/push-tokens/{deviceId}` | Unregister | On Push off, logout and delete account |
| `GET /me/security` | Summary | `{ passwordChangedAt, twoFactor: { enabled, method }, lastLoginAt }` |
| `POST /auth/password/change` | Change password | Body `{ currentPassword, newPassword, revokeOtherSessions }`. **A wrong current password returns 400 or 403 with `code: "wrong_password"`, never 401** (4.3.3) |
| `POST /me/2fa/sms/enable` | Send the setup code | Rate-limited |
| `POST /me/2fa/sms/verify` | Confirm the code | Returns `{ recoveryCodes: string[8] }` once |
| `POST /me/2fa/disable` | Turn off | Body `{ currentPassword }` |
| `POST /auth/login` | Sign in | Body adds `device`. May return `{ twoFactorRequired: true, challengeId, phoneMasked }` instead of a session |
| `POST /auth/2fa/verify` | Second step | Body `{ challengeId, code, device }` or `{ challengeId, recoveryCode, device }`. Returns a session |
| `POST /auth/otp/verify`, `POST /auth/refresh` | Existing | Body adds `device` |
| `GET /me/login-activity?cursor=` | Recent events | `{ events: { id, type, atISO, deviceName, platform, method, approxLocation?, newDevice? }[], nextCursor? }` |
| `GET /me/sessions` | List sessions | `{ sessions: DeviceSession[] }`. The server marks `current` from the token's session |
| `DELETE /me/sessions/{id}` | Sign out one device | Refuses the caller's own session |
| `POST /me/sessions/revoke-others` | Sign out the rest | Returns `{ revoked: number }` |

Server rules the client relies on: one active session per `(user, deviceId)`; revoked sessions lose their refresh token immediately; access tokens live no longer than 15 minutes (Q12); quiet hours and the critical list in 4.2.5 are applied to every remote push; security events (new device, password changed, 2FA changed) create a critical push and an inbox record.

### 4.10 Behaviour with no backend (mock mode)

This follows Decisions 15, 21 and 24: screens must be exercisable end to end today.

| Feature | Mock behaviour |
|---|---|
| Notification preferences | Saved to the v2 store only. Push token is requested and kept in memory; nothing is sent |
| Quiet hours | Applied to locally generated notifications only (there is no remote push) |
| Security summary | Read from `gabfix.security.v1` |
| Change password | Succeeds except `wrongpass` (error test). Records the date locally |
| Two-factor | Local flag; code `000000` fails, others pass; recovery codes generated locally and shown once. Mock `login()` returns a challenge when the flag is on. The Security page does not claim server verification |
| Login activity | Local list written by `startSession()` |
| Sessions | Current device only; `EXPO_PUBLIC_MOCK_SESSIONS=2` adds one sample device |
| Unlock | Fully real (it is on-device) |

### 4.11 Admin and backend notes

- **Admin (`admin/`)** gains nothing for Workstream C in this phase. Workstream A changes Settings; Workstream B changes Bookings. A later admin addition could show a customer's active sessions for support; it is not specified here.
- **Backend** needs, in order of how much they unblock: sessions with `deviceId`, preferences, security summary, password change, push token registry, 2FA, login activity. The first three make the Security and Devices pages real; push delivery additionally needs FCM and APNs credentials (Section 5).

### 4.12 `app.json` and build configuration

Final `plugins` block for Phase 2 (merge with Workstream B's change in 3.9; entries not shown stay as they are today):

```json
[
  "expo-image-picker",
  {
    "photosPermission": "Gabfix Home Solutions uses your photos so you can show your cleaner the space, set a profile picture and attach photos to a review.",
    "cameraPermission": "Gabfix Home Solutions uses your camera to take photos and videos of the space to be cleaned.",
    "microphonePermission": "Gabfix Home Solutions uses your microphone to record sound when you film a short walkthrough video."
  }
],
[
  "expo-notifications",
  {
    "color": "#118E45",
    "defaultChannel": "routine"
  }
],
[
  "expo-local-authentication",
  {
    "faceIDPermission": "Gabfix Home Solutions uses Face ID to unlock the app."
  }
]
```

- `color` is `colors.green500`. Add `"icon": "./assets/images/notification-icon.png"` only when design supplies a **96 x 96 all-white PNG with transparency** (Expo's requirement for the Android status-bar icon); until then, omit the key (Q14).
- `expo-video` (3.7.3) and `expo-file-system` / `expo-image-manipulator` (3.8) may need no plugin entry; check each package's v58 page when you install it.
- These are native changes. **One new development build covers every item in this document**: `eas build --profile development --platform android` and `--platform ios`. A Metro reload will not pick them up.
- **Push credentials** (needed only to *send* real pushes): Android needs an FCM credential uploaded to EAS; iOS needs an APNs key (Apple Developer account). Follow `https://docs.expo.dev/push-notifications/push-notifications-setup/`. The screens work and can be reviewed without them.
- `eas.json` already defines a `development` profile (`developmentClient: true`, internal distribution), so no config change is needed. The progress document (Open item 8) records that no development build has been produced yet, so this will be the first.

### 4.13 Tests (Workstream C)

| Suite | Cases |
|---|---|
| `quiet-hours.test.ts` | `22:00–07:00` at 23:30, 00:00, 06:59 → true; at 07:00, 12:00, 21:59 → false. `13:00–15:00` at 13:00 → true, 15:00 → false. `start === end` → false. Disabled → false. A fixed UTC instant (`2026-11-20T20:30:00Z`) is 23:30 in `Africa/Kampala` → true; the same instant in `Europe/London` (20:30) → false |
| `notify-policy.test.ts` | Push off → `drop` for every kind. `reminder` with reminders off → `drop`. `promo` with offers off → `drop`. `booking`, `payment`, `security` in quiet hours → `deliver`. `reminder` and `promo` in quiet hours → `defer`. `decideInApp` with In-app off → `skip` for all. `notificationSummary` strings for the four channel combinations and quiet hours |
| `profile-settings.test.ts` | `migrateV1`: `{ bookingUpdates: false, reminders: false }` → `push: false`; `{ bookingUpdates: false, reminders: true }` → `push: true`; `offers: true` preserved; `biometric: true` returned separately; missing fields use defaults; v1 key removed after v2 is written. `validateQuietHours` rejects equal times and bad strings |
| `security.test.ts` | Hydration of missing and corrupt JSON; `markPasswordChanged`; `clearSecurity` resets `biometric`; a seeded legacy `biometric: true` is **not** treated as an enabled lock |
| `device-sessions.test.ts` | `getDeviceId` returns the same value twice and across a simulated logout; second login with the same `deviceId` yields one session; `signOutDevice` removes optimistically and restores on failure; `signOutDevice(current)` is refused; counts from Security and P30 agree because they read one store |
| Existing suites | `session.test.ts` gains: `endSession()` clears `security.biometric`; `startSession()` appends one login event |

Scripted browser pass (390 × 844, as in earlier QA rows) for what runs on web: Profile rows and navigation, P28 save/discard/dirty, quiet-hours chips, P29 values, P29a wrong-password error without sign-out, P29b mock flow, P29c list, P30 sign-out with confirm. Not testable on web, so device-only: push permission prompt, settings round trip, biometric prompt and lock, background and foreground timing, camera and video with the lock suppressed, notification tap deep links.

---

## 5. Dependencies, native changes and builds (all workstreams)

None of these packages is a direct dependency today (checked against `package.json`). Install each with `npx expo install` so SDK 58 resolves the right version.

| Package | Workstream | Why | Native module | Dev build needed |
|---|---|---|---|---|
| `expo-notifications` | C, F | Permission, token, channels, tap handling; the local "cleaner assigned" notification (12.3) | Yes | Yes for remote push on Android; local notifications work in Expo Go |
| `expo-local-authentication` | C | Face ID / fingerprint unlock | Yes | Yes for Face ID on iOS |
| `expo-crypto` | B, C | `randomUUID` for media ids and the device id | Yes | Included in Expo Go; rebuild anyway |
| `expo-file-system` | B, E | Draft media files, upload; receipt PDF download (11.1) | Yes | Check Expo Go support on the v58 page; the dev build covers it |
| `expo-image-manipulator` | B | Resize and JPEG re-encode photos | Yes | Dev build |
| `expo-video` | B (optional) | Preview viewer | Yes | Dev build |
| `expo-device` | C | Already installed | Yes | n/a |
| `react-native-keyboard-controller` | F | Keyboard-aware screens, sheets and chat composer (12.2); **confirm SDK 58 / RN 0.88 support in its docs first** | Yes | Dev build |
| `expo-print`, `expo-sharing`, `expo-location` | E, I | Already installed (receipt PDF, share, current location) | Yes | n/a |
| `expo-image-picker` | B, J | Already installed; ticket screenshots too; **config changes** (3.9) | Yes | Rebuild |

Order: install everything in one commit, update `app.json` once, run `npx expo-doctor`, `npx tsc --noEmit` and `npx expo lint`, then produce **one** development build for Android and one for iOS. Do not build per feature.

Before coding against any of these, read the matching page under `https://docs.expo.dev/versions/v58.0.0/sdk/` (the rule in `AGENTS.md`). The signatures quoted in this document were checked against the SDK 58 notifications page and the SDK 57/58 local-authentication pages on 2026-11-20; `expo-image-manipulator`, `expo-file-system`, `expo-video`, `expo-crypto` and `expo-device` are **not** re-verified here and are marked "confirm" where they appear.

---

## 6. Order of work

Sizes are relative (S under a day, M one to three days, L three to five days) for one developer; they are estimates, not commitments.

| Step | Work | Size | Depends on | Notes |
|---|---|---|---|---|
| 0 | Housekeeping that is pure documentation or registration: 7.1, 7.2 | S | none | Zero risk; do it first so the baseline is clean |
| 1 | **Workstream A**: `support.ts` files, `ContactOptions`, `/help/contact` hand-offs, admin import, tests | S to M | 0 | Smallest, unblocks customer inquiries. All three channels are live |
| 2 | Install packages, edit `app.json`, `npx expo-doctor`, **start the dev builds** (they take time and block device checks) | S | 0 | Start early and let it run while you work |
| 3 | Shared components: `settings-list` extraction (confirm Profile unchanged), `InlineBanner`, `ConfirmSheet`, `StatTile`, `PermissionCard` props, `newId()` | M | 0 | Used by B and C |
| 4 | **B data layer**: types, `service-scope.ts`, `scope.ts`, stores, tests (3.2 to 3.4) | M | 3 | Pure logic; testable without UI |
| 5 | **B UI**: `CounterRow`, P8b screen, stepper to five stages, route wiring, summary of scope on P12 | L | 4 | Ship P8b without media first if needed (media rows hidden) |
| 6 | **B media**: pipeline, `MediaSheet`, permissions, draft file lifecycle | L | 2, 5 | Needs a dev build to test the camera |
| 7 | **B upload**: queue, `UploadStatus`, P14 and P15b, mock failure flag | M | 6 | Backend contract can lag; mock first |
| 8 | **C data layer**: profile-settings v2 and migration, notification policy, quiet hours, security store, device id, sessions store and hook, auth changes (`device`, challenge type), tests | M | 3 | Do the migration before any screen reads the new shape |
| 9 | **C P28** Notification preferences, push helpers, channels, handler, inbox gear, P14 pre-prompt | M | 8, 2 | Real permission behaviour needs the dev build |
| 10 | **C P30** Devices and sessions, then **P29** Security rows and P29a/P29c | M | 8 | P29 depends on the hook from P30 |
| 11 | **C P29b** Two-factor, 2FA sign-in branch in `login.tsx`/`otp.tsx`, recovery codes | M | 10 | |
| 12 | **C unlock**: `biometrics.ts`, app-lock store and screen, `runExternalFlow` across all pickers | M | 2, 6 | Touch every picker call, including the existing avatar, quote, chat and review flows |
| 13 | Profile rows and layout (4.1), final polish, copy pass | S | 9 to 12 | |
| 14 | Progress document updates (Section 8), Open items, tests green, scripted browser pass | S | all | |
| 15 | Device matrix pass on a real iPhone and a real Android phone, then flip statuses | M | 2, 14 | Nothing is marked Done before this (progress doc's Definition of Done) |
| 16 | **Shared UI for E to J:** `BottomSheet` and the sheet migration, `FilterChip`, `Avatar`, `KeyboardScreen` set (11.5, 12.2, 16.4) | M | 2, 3 | Do before the screens that use them; needs the dev build for the keyboard library |
| 17 | **Workstream I: remove Service Areas** (15.3 steps 1 to 8) | M | 0 | **Do before step 5 and step 22**, because the location step and Home both lose the area |
| 18 | **Workstream H data layer:** categories, 18 services, `form-schema.ts`, seed schemas, tests (14.2, 14.4, 14.8) | M to L | 3 | **Replaces step 4's `service-scope.ts`**: P8b is built on the schema engine, not on hard-coded fields |
| 19 | **Workstream E:** `momo.ts` and picker, review changes, Pay balance flow, transaction query, receipt download (11.1 to 11.4) | L | 16 | Mock processing page only; no money moves |
| 20 | **Workstream F, drafts and keyboard:** `use-draft-exit`, draft guard, keyboard conversion of the listed screens (12.1, 12.2) | M | 16, 17 | Android device pass for the keyboard rule |
| 21 | **Workstream F, assignment, completion and rating** (12.3, 12.4) | M | 8, 19 | Needs notification channels from step 9 |
| 22 | **Workstream G:** Home clean-up, stat tiles, Balance due card, Most popular row (Section 13) | M | 17, 19 | Balance due reads `dueSummary` from step 19 |
| 23 | **Workstream H UI:** Services tab twin cards, P8b dynamic form, service page clean-up, quote-mode branch (14.3, 14.4, 14.5) | L | 5, 18 | Quote-mode services reuse the existing quote screens |
| 24 | **Workstream J:** ticket centre and Help Center, FAQ chips, red Cancel booking, Bookings label, Refer lists (Section 16) | M | 16 | Ticket screenshots reuse the media pipeline from step 6 |
| 25 | Progress document updates for E to J (Section 8), tests green, device matrix for the new items | S to M | 16 to 24 | Same rule: nothing is Done before a real-device pass |

**Recommended order for the second change list:** 16, 17, 18, then 19 and 20 in parallel, then 21, 22, 23, 24, then 25. The backend stage (Supabase, Expo tools, Firebase) starts after step 25 (D15).

Parallel lanes for a team of two: lane 1 = steps 1, 4 to 7; lane 2 = steps 8 to 13. Step 3 is the shared start for both.

---

## 7. Workstream D: Housekeeping

Findings F1 to F3 and F6 from Section 1, plus the extra findings below. None changes behaviour a customer can see, except 7.4.

### 7.1 Stale rows in `Gabfix_UI_Progress.md` (finding F1)

In Section 5, **Deviations from the Guidelines**, replace or delete these rows:

| Row (date and area) | Problem | Action |
|---|---|---|
| 2026-11-18 · P19 Receipt | Says there is no `expo-print`/`expo-sharing` and PDF is "explained as pending" | Delete. The 2026-11-20 session built the PDF export. Keep one row: "PDF receipt is built client-side from a shared model; server-issued invoices remain Open item 27" |
| 2026-11-19 · P25 Quote Request (first row) | Says photos are not collected and `expo-image-picker` is not installed | Rewrite: "Up to five downscaled base64 photos stored with the request; no upload or quote-reply flow. Base64 in AsyncStorage is a known limit (7.3)" |
| 2026-11-19 · P27c Messages and Chat | Says "No image attach" | Rewrite: "Image attach stores a downscaled data URI in the message; no upload endpoint" |
| 2026-11-18 · P7 hero and the 2026-11-18 · P7 sticky bar | Parallax and the fading header were built later | Rewrite the hero row to describe the final build; keep the sticky bar row (still always visible) |
| 2026-11-19 · P27e / P27f | Say photos are base64 and capped; still true | Leave, but link them to 7.3 |

Also reconcile the unit test count text ("41 tests"): the four suites declare 42 `it`/`test` cases (9, 11, 13, 9). Re-run `npm test` and write the number it prints.

### 7.2 Register the unregistered routes (finding F3)

In `src/app/_layout.tsx` add (above the closing `</Stack>`), copying the default screen options:

```tsx
<Stack.Screen name="policies/[doc]" />
<Stack.Screen name="cleaner/[id]" />
<Stack.Screen name="booking/[id]/receipt" />
```

and the new Phase 2 routes: `book/[slug]/scope` (same options as `book/[slug]/add-ons`), `profile/notification-preferences`, `profile/security/index`, `profile/security/password`, `profile/security/two-factor`, `profile/security/activity`, `profile/devices`. Note the existing file uses `addresses/index` and `help/index` for index routes; follow that.

### 7.3 Replace base64 photo storage everywhere else (finding F6), later phase

Workstream B stores files, not base64 (D6). The four older features still write data URIs into AsyncStorage JSON: avatar (`profile.tsx`), quote photos (`quote/[slug].tsx`), chat photos (`chat/[threadId].tsx`) and review photos (`rate.tsx`). Plan for a follow-up, not this phase:

1. Extract the file-copy and JPEG-normalise steps from `src/lib/media.ts` into a shared `src/lib/local-media.ts` (`saveImageFile(uri, folder) → { uri, bytes }`).
2. Change each store to hold a `file://` uri instead of a data URI. Keep reading data URIs for old records.
3. One-time migration at boot: for any record with a `data:` uri, write the bytes to a file and replace the field. Delete the data URI only after the file is confirmed written.
4. Add the folders to the retention rules in 3.8 and to `deleteLocalAccount()`.

Until then, keep the existing caps (5 photos quotes, 3 reviews) and do not add new base64 uses.

### 7.4 Other findings

| # | Finding | Evidence | Fix |
|---|---|---|---|
| F13 | `deleteLocalAccount()` clears only AsyncStorage keys starting with `gabfix.`. It does **not** clear SecureStore items. Today that is only the session (cleared by `endSession`), but Phase 2 adds a device id (SecureStore), push registration and a media directory | `src/lib/account.ts` | Extend it as listed in 4.4.2 and 3.8, and add a unit test with mocked stores |
| F14 | There is no UUID helper in the project; `localBookingId()` uses the clock and several places would need ids (media, device) | grep for `randomUUID`, `uuid`, `expo-crypto` returns nothing | Add `src/lib/id.ts` with `newId()` over `expo-crypto`. Do not use `Math.random()` for ids |
| F15 | Five packages this phase needs are not in `package.json`: `expo-notifications`, `expo-local-authentication`, `expo-crypto`, `expo-file-system`, `expo-image-manipulator` (`expo-video` optional) | `package.json` | Section 5 |
| F16 | ~~Profile's Service area and Saved addresses both use the `MapPin` icon~~ | `profile.tsx` | **Closed by Section 15:** the Service area row is removed |
| F17 | **Naming collision.** The Implementation Plan's "Phase 2" is Onboarding and Auth. This document is the second implementation guide, not that phase | `Gabfix_Implementation_Plan.md`; progress doc Section 8 | Call the new phase **Phase 9: Scope, support and account security** in the progress document (Section 8 below) |
| F18 | The progress document says "all 40 page builds complete". With the specified pages (P8b, P28, P29, P29a, P29b, P29c, P30, P22a, P22b, P26a) and P3 Area select removed, the tracker has **49** active pages, **39** built | Progress doc header and Section 2 | Update every "40" (Section 8) |
| F19 | **The receipt PDF exists but is a share action, not a download.** `receipt-export.ts` prints to a random-named file and opens the share sheet; the only entry point is P19 | `src/lib/receipt-export.ts`, `receipt.tsx` | Medium | 11.1 |
| F20 | **One `payerPhone` serves both mobile-money networks** and is prefilled from the contact phone or the account phone; `isValidPhone` accepts any `7XXXXXXXX`; two demo numbers are seeded as "saved" | `review.tsx` lines 108, 299; `config/payments.ts` | High | 11.2 |
| F21 | **Pay balance has no processing page.** `onPay` writes to the bookings store immediately and never asks for a number or card | `profile/payments.tsx` line 246 | High | 11.3 |
| F22 | **Discard leaves a blank screen.** It calls `resetDraft()` then `router.back()`; the previous booking step renders nothing without a draft. Save draft also just goes back one step. The prompt is a native `Alert` | `add-ons.tsx`, `location.tsx`, `review.tsx`, `schedule.tsx` | Medium | 12.1 |
| F23 | **Nothing sets `status: 'completed'`**, rating requires stars, and cleaners have no photo field | `store/bookings.ts`, `rate.tsx`, `config/cleaners.ts` | Medium | 12.3, 12.4 |
| F24 | **`price()` (rate x hours x cleaners) cannot price trades** such as painting, tiling or renovation | `lib/pricing.ts` | High | H2, 14.1 |
| F25 | **FAQ chips are not centred** (`chip.pill` lacks `alignItems`/`justifyContent`), and the Bookings active label is already `green700`, not the deepest green | `help/faq.tsx`, `theme/styles.ts`, `segmented-control.tsx` | Low | 16.1, 16.4 |
| F26 | **The stats reference image was not among the images received** (six arrived: help ticket, notifications, security, devices, two photo sheets) | This conversation | Low | 13.3, Q17 |
| F27 | **The service area is threaded through more than 20 files** (auth, onboarding, Home, Profile, addresses, booking location, availability, catalogue hooks, quotes, admin) | Inventory in 15.1 | High | Section 15 |

---

## 8. Progress document updates (`Gabfix_UI_Progress.md`)

Do these in the same pull request that merges the code, as the plan requires ("updated at every pull request merge").

1. **Header table.** Last updated, "Current phase" gains Phase 9; "Guidelines versions" gains `Implementation_Phase_2 v1.0`.
2. **Overall status (Section 1).** Add a row: Phase 9, "Scope, support and account security", status 🟨 until Done, summary 🟨 Partial.
3. **Page tracker (Section 2)** gains ten rows, and **P3 Area select is marked ⛔ Removed in Phase 9** (Section 15). Draft text:

| ID | Page | Phase | Design | Build | Notes (draft) |
|---|---|---|---|---|---|
| P8b | Order: Job scope and media | 9 | 🟨 | ⬜ | `/book/[slug]/scope` between P8 and P9; per-service size and room fields, suggestion banner (does not change price), Photos and video sheet (10 items, 2 videos, 30 s, 25 MB), files stored under `documentDirectory`, uploads start after booking save |
| P28 | Notification preferences | 9 | 🟨 | ⬜ | `/profile/notification-preferences`; In-app and Push channels, Reminders and News and offers, quiet hours with timezone, explicit Save, device-permission handling. Server enforces quiet hours for remote push |
| P29 | Security | 9 | 🟨 | ⬜ | `/profile/security`; protection level, change password, two-factor, unlock, devices, login activity |
| P29a | Change password | 9 | 🟨 | ⬜ | Wrong current password must be 400/403, not 401 |
| P29b | Two-factor authentication | 9 | 🟨 | ⬜ | SMS to the account phone, recovery codes; sign-in challenge through `/otp?mode=2fa` |
| P29c | Login activity | 9 | 🟨 | ⬜ | Last 20 events; approximate location only |
| P30 | Devices and sessions | 9 | 🟨 | ⬜ | One session per `deviceId`; shared hook with Security; confirm before sign-out |
| P22a | Support tickets | 9 | 🟨 | ⬜ | `/help/tickets`; list of the customer's tickets with status; created from the Help Center form (16.3) |
| P22b | Ticket detail | 9 | 🟨 | ⬜ | `/help/tickets/[id]`; message, screenshots, thread, mark resolved |
| P26a | Referral friends | 9 | 🟨 | ⬜ | `/refer/[stage]`; invited, joined, first booking and rewards lists (16.5) |

   Also update the **P4 Home** note (Section 13), **P6 Services** (twin cards, 14.3), **P7 Service detail** (14.5), **P12** (per-network mobile-money numbers, 11.2), **P15, P19** (downloads, 11.1), **P27b/P27d** (Pay balance flow, 11.3), **P27f** (two optional ratings, 12.4), **P22** (ticket centre, 16.3), **P26 Refer**, **P10** and the address form (no service area, Section 15) and the **P8, P9, P10, P11, P12, P14, P15b, P18** notes for the five-stage stepper, scope and media, and the **P27e** note (preferences moved to P28, biometric moved to Security and now real). Update the **P22** note with the real support details.
4. **Count line.** "0 of **49** active pages Done. **39** page builds in place (P3 removed); 10 specified, not built." Replace every "40 of 40" or "all 40 page builds complete" in the header, Section 1 and the change log.
5. **Implementation progress score.** Track 1 is "pages implemented and passing checks" with weight 45%. With 49 active pages and 39 built, the track falls from 100% to **39 / 49 = 79.6%**, which is 35.8 points. The other tracks stay at 20.6 points (65.6% minus 45), so the total moves from 65.6% to about **56.4%** until the Phase 9 builds land (it was about 59% before the second change list added three pages and removed one). This is correct and should be reported as such, with a one-line explanation in the session log; do not hide it by changing the weights.
6. **Routes table** gains the seven routes in Sections 3.1 and 4.
7. **Decisions log** (continue from #47): #48 Support details live in `src/config/support.ts` with validation (D9, Workstream A); #49 P8b inserted before P9 with a five-stage stepper (D1, D2); #50 Scope informs a suggestion, not the price (D4); #51 Job media stored as files, not base64 (D6); #52 Uploads start after booking save and never block it (D7); #53 Notification settings split into channels and types with server-enforced quiet hours (C2, C3); #54 Biometric becomes a real app lock in Security (C5); #55 One session per device with a stable `deviceId` (C7); #56 SMS two-factor with recovery codes (C6).
8. **Deviations** gains: stepper has five stages (Part 2, 6.0 had four); P8b is an addition to the spec; Photos and video is a single `Modal` with two internal views (D8); P28 has an explicit Save and a locked "always on" row; P29/P30 omit the reference's "Trusted devices" label (C8).
9. **Open items (Section 6)** gains:

| # | Item | Owner | Needed by |
|---|---|---|---|
| 32 | **Media and scope contracts**: `POST /bookings` with `scope` and `media[]` metadata, pre-signed upload targets, refresh, complete, `GET /bookings/{id}` media list (3.11) | Backend | Phase 9 close |
| 33 | **Notification contracts and push credentials**: preferences, push-token registry, FCM and APNs credentials in EAS, server-side quiet hours and the critical list (4.2.5, 4.9) | Backend / engineering | Phase 9 close |
| 34 | **Account security contracts**: `/me/security`, password change (400/403 on wrong password), SMS two-factor, login activity, 2FA login challenge (4.9) | Backend | Phase 9 close |
| 35 | **Session contracts**: `deviceId` on auth calls, one session per device, `GET/DELETE /me/sessions`, revoke-others, access-token lifetime (4.4.4) | Backend | Phase 9 close |
| 36 | ~~Support call number~~ confirmed as `0703195401` (Q1 answered 2026-11-20) | Product | Closed |
| 37 | **Notification icon** (96 x 96 white PNG) and a decision on custom notification sounds | Design | Before store build |
| 38 | **Support ticket contracts**: `POST /support/tickets` (multipart screenshots), list, detail, replies, status (16.3) | Backend | Backend stage |
| 39 | **Catalogue and form-schema API**: `GET /services`, `GET /service-categories`, form schemas with versions, admin form builder (14.2, 14.4, 14.6) | Backend / admin | Backend stage |
| 40 | **Assignment and completion**: real cleaner or technician assignment, completion events, push and in-app notifications replace the mock (12.3, 12.4) | Backend | Backend stage |
| 41 | **Payments contracts**: balance payment, saved mobile-money numbers per network, receipt PDF hosting (11.1 to 11.3) | Backend | Backend stage |
| 42 | **Referral list API** (16.5) | Backend | Backend stage |
| 43 | **Hourly rates and pricing mode** for each of the 18 services (H2, 14.2) | Finance / ops | Before release |
| 44 | **Dashboard stats image** to match the tiles (13.3, Q17) | Design | Phase 9 build |

   Update **Open item 1** (order-specification images): the reference screenshots for the scope and media sheets, notifications, security and devices now exist; mark it 🟡 and link P8b. Update **item 24** (support): email, WhatsApp and call number (`0703195401`) all supplied. Update **item 28** to note that notification preferences and biometric moved to P28 and Security.
10. **Change log.** One row for this document and one per merged workstream (A to J).
11. **Phase summaries (Section 8 of the tracker).** Add "Phase 9: Scope, support and account security" with Delivered, Changed, Slipped, Next written at the end of the phase, not before.
12. **QA table.** Add rows only for checks that were actually run, with the same wording discipline used so far ("code-reviewed", "not run on a device").

13. **Decisions log (second batch).** Record: service areas removed, location by address (Section 15); services and categories are data with two levels (H1); pricing mode per service (H2); job details are a form schema rendered by one generic form, with a snapshot stored on the booking (H3, H4); mobile-money numbers are per network with prefix validation (11.2); Pay balance uses the processing page (11.3); one shared bottom-sheet component for all drawers (11.5); the keyboard rule and `react-native-keyboard-controller` (12.2); mock assignment after 6 minutes and mock completion (12.3, 12.4); job and cleaner ratings optional (12.4); Help Center becomes a ticket centre (16.3).
14. **Deviations (second batch).** Add: stepper unchanged at five stages but Scope is schema-driven (not hard-coded); Home no longer contains trust capsules, Top cleaners, category sections, How it works or Loved by customers; service pages no longer show Reviews, Related services, Top cleaners, How it works, a discount badge or a trust strip; `service/[slug]/reviews` is unlinked; P3 Area select removed.
15. **Routes table** also gains `/help/tickets`, `/help/tickets/[id]`, `/refer/[stage]` and loses `/area-select`.
---

## 9. Open questions

Each question has a default so work is not blocked. Answers change config, not architecture.

| # | Question | Default used until answered |
|---|---|---|
| Q1 | ✅ **Answered:** the call number is `0703195401`. | Used everywhere through `src/config/support.ts` |
| Q2 | Is a Gmail address acceptable as the public support email, or should it move to a Gabfix domain later? The admin dashboard uses `@gabfix.ug` addresses | `gabfixuganda@gmail.com` everywhere; admin shows the same support values from `src/config/support.ts` |
| Q3 | What are the real support hours? | "Open 7 days · 7:00 am – 9:00 pm" (provisional) |
| Q4 | Who answers in-app Chat? It is a local simulation today (P27c) | Keep Chat visible; the contact card text says WhatsApp and calls reach the same team |
| Q5 | Should WhatsApp and email pre-fills include the customer's name or phone? | Booking id only (less personal data in a message) |
| Q6 | Real values for the scope time model (3.3 `estimate`) and the size bands | The dummy values in 3.3 |
| Q7 | The 25 MB video cap can be hit by a 30-second clip. Keep the cap, raise it, or add native compression? | Keep both caps and guide customers with the specific error message |
| Q8 | How long do job photos and videos live on the server and on the phone after a booking ends? | 30 days on the phone after completion or cancellation; server retention unspecified |
| Q9 | Record sound with videos? | Yes (microphone permission string added) |
| Q10 | Are photos mandatory for any service? Default is optional everywhere (D5). Quiet-hours default window and the critical list (C4) need product approval | Optional; 22:00–07:00; the list in C4 |
| Q11 | SMS provider and cost for two-factor codes; should two-factor be mandatory for admin accounts? | Optional for customers; admin out of scope |
| Q12 | Access-token lifetime and refresh-token lifetime; what happens to the server row when an app is deleted and reinstalled? | 15 minutes; copy says "within 15 minutes"; the stale row is removable on P30 |
| Q13 | Login activity: how long to keep it, and is approximate location (GeoIP) wanted? | 90 days, last 20 events; location shown only if the server sends it |
| Q14 | Notification icon and sound artwork | Omit the icon key; default sound |
| Q15 | Backend owner and date for Open items 32 to 35 | Mock mode everywhere |
| Q16 | Should the timezone list go beyond Uganda before launch? | The six zones in 4.2.7 |
| Q17 | Please resend the **dashboard stats image** (it was not among the images I received). What numbers should the tiles show? | Three tiles: Upcoming, Completed, Total spent (13.3) |
| Q18 | Which of the 18 services are **hourly** and which are **quote**? What are the hourly rates of the new hourly services? | Cleaning, carpet, sofa and chair services hourly (reusing today's table); everything else quote (14.2) |
| Q19 | Is "Landscaping and grass cutting" one service or two? | One service |
| Q20 | Are the seven categories in 14.2 right? Names and grouping | The table in 14.2 |
| Q21 | Remove the rating chip ("4.8 · 120 reviews") from the service hero too? | Yes, it points at the removed reviews |
| Q22 | With no service areas: if a location truly cannot be reached, do you refund in full and cancel? Will a travel or call-out fee ever apply? | Full refund, no fee (15.2) |
| Q23 | Refer: should **Reward earned** also open a list, or stay a plain row? | It opens a rewards list |
| Q24 | Bookings active tab: do you want the deepest green (`green900`, as the tab bar) or the current `green700`? | `green900` |
| Q25 | What is the ticket reply promise and are replies in business hours only? | "Within one business day"; support hours from Q3 |
| Q26 | Keep **Office cleaning** and **Move-in / move-out** as hidden (inactive) services so old bookings still open? | Yes (H5) |
| Q27 | Who creates categories and sub-categories later: the **admin only**, or customers too? | Admin only |
| Q28 | Should the 6-minute assignment and the demo completion stay in the first release build or be removed when the backend arrives? | Remove when the backend arrives (`config/mock.ts`) |
| Q29 | Do you want a **custom date range** in the transaction filters later? | Presets only for v1 (11.4) |

---

## 10. Risks and definition of done

### 10.1 Risks

| Risk | Impact | Mitigation |
|---|---|---|
| A support number is mistyped in future | Customers cannot call support | Validation hides the channel; WhatsApp and email still work |
| Quiet hours cannot be enforced on the phone for remote push (C3) | Customers get routine pushes at night if the server does not implement the rule | Give the backend `decidePush` as the specification; verify with a server test before launch |
| App lock triggers while the camera or picker is open | Customers lose their place filming a walkthrough | `runExternalFlow` around every picker and permission call; lock only on `background`; acceptance test 9 |
| A wrong password returns 401 | The customer is signed out for a typo | Contract requires 400/403; mock tests the path (4.3.3) |
| 25 MB cap versus a 30-second clip (Q7) | Frequent video rejections | Specific messages; revisit after real-device data |
| AsyncStorage size on Android with base64 photos elsewhere | Failed reads, lost drafts | Do not add new base64 uses; follow 7.3 |
| `expo-image-manipulator` and `expo-file-system` APIs differ from the sketches | Build or runtime errors | Marked "confirm"; read the v58 pages before coding; small, isolated modules |
| Push does not work in Expo Go on Android | Confusing test results | Use the development build; the page degrades quietly |
| SMS two-factor cost and abuse | Spend or lockouts | Server rate limits; optional for customers; recovery codes |
| Five stepper labels at 130% text | Clipped labels | `numberOfLines={1}`; test at 360 dp and 130% |
| Reference screenshots show defects (0 vs 2 devices; duplicate device rows) | Copying them would repeat them | C7, C8, C10 and 4.4.2 |
| Removing service areas touches more than 20 files | A half-removed concept leaves broken screens | The ordered steps and the search in 15.3 step 8; keep the stored `area` key |
| A schema-driven form is harder to test than fixed fields | Wrong or missing questions reach cleaners | Pure `form-schema.ts` with tests; booking snapshot; default schema fallback; invalid schema falls back |
| Quote-mode services have no price in the app | Customers expect an instant price | Clear "Get a quote" labels and the quote flow; confirm modes in Q18 |
| `react-native-keyboard-controller` may not support SDK 58 or `Modal` | The keyboard rule fails on Android | Confirm in docs first; built-in fallback in 12.2; Android device pass |
| Mock assignment, completion and referrals look real | Customers or testers believe a real cleaner was assigned | All three sit behind `config/mock.ts` and are removed with the backend |
| A pinned bottom sheet still leaves a gap on some Android navigation modes | The visible defect returns | One shared component; test on gesture and three-button navigation; no fixed offsets |
| Saved mobile-money numbers are personal data on the device | Privacy exposure | Stored locally only until the backend; masked display; removable from Payments |
| Ticket screenshots may show personal data | Privacy exposure | Max 3 images, resized, stored as files, deleted with the ticket or account (extend `deleteLocalAccount`, F13) |

### 10.2 Definition of done for this phase

A workstream is done when **all** of these are true, matching the standard in the progress document:

1. Every item in its acceptance criteria (2.11, 3.16, 4.7, 11.7, 12.6, 13.7, 14.9, 15.5, 16.7) passes.
2. `npx tsc --noEmit`, `npx expo lint` and `npm test` pass, and `npx expo-doctor` reports no new problems.
3. A scripted 390 × 844 browser pass covers everything that runs on web, with results written in the QA table.
4. A development build has been installed on a real iPhone and a real Android phone and the device-only checks in 4.13, 3.16, 11.5, 12.2 and 12.3 have been run and recorded.
5. Section 8's progress updates are merged with the code.
6. No colour, radius or spacing value is hard-coded; every new screen uses tokens, the shared UI kit and Lucide icons.

**Nothing in this phase is marked ✅ until item 4 is complete.** Until then the status is 🟨, as for every existing page.

---

## 11. Workstream E: Payments and receipts

Covers change-list items 1, 2, 6, 7 and 10. Everything here runs on local storage until the backend stage (D15); money movement stays simulated by `/payment/[id]` exactly as it is today.

### 11.0 What the code does today

| Area | Today (from the code) | Consequence |
|---|---|---|
| Receipt PDF | `src/lib/receipt-export.ts` already renders the receipt to a PDF (`expo-print`) and opens the **share sheet** (`expo-sharing`). `receipt.tsx` has a "Download PDF" button. Web opens a print view. | The button exists, but it is a share action, not a download: the file name is random, nothing says where it went, and the only entry point is P19. Item 1 is therefore "make it a real download, name it properly and put it where customers look". |
| Mobile-money number | `review.tsx` keeps **one** `payerPhone`, prefilled from `draft.location.contactPhone` or `user.phone`, shared by "Pay now with" and the after-service balance. `isValidPhone` only checks `^7\d{8}$`. | One number serves both networks, is chosen for the customer, and an Airtel number is accepted under MTN. All three conflict with item 2. |
| Saved mobile money | `SavedMobileMoney { id, provider: 'MTN' \| 'Airtel', phone }` already carries the network. `config/payments.ts` seeds two demo numbers (`772123456`, `701234567`) and the store starts from them. | The data model is right. The demo seeds make numbers appear "saved" that the customer never saved. |
| Pay balance | `profile/payments.tsx` opens `PaymentMethodSheet`; `onPay` calls `payBookingBalance` or `settleLateFees` **immediately**. No processing page, no choice of saved number or card. | Item 10 replaces this with the same processing flow as a new booking. |
| Transaction history | `lib/wallet.ts` has `transactionFilters` (All, Deposits, Balances, Cash, Refunds) and `filterTransactions`. No search, no method, date or amount filter. | Item 7 extends this into a query. |
| Drawers | `payments.tsx` ("Remove this method?") builds its own `Modal` with `paddingBottom: insets.bottom + space[4]`. `PaymentMethodSheet` and `AddMethodSheet` use `Math.max(insets.bottom, space[4])`. Each sheet is hand-built. | Three sheets, two padding rules, none shared. That is the likely reason one of them floats. See 11.5. |

### 11.1 Receipts: real PDF download (item 1)

**Goal:** from any place a customer sees a paid or completed booking, one tap saves `Gabfix-Receipt-GBX-12345.pdf` to the phone, with a visible confirmation. Sharing stays available as a second action.

| Platform | Behaviour |
|---|---|
| Android | Ask once for a folder with the Storage Access Framework, remember it, and write the PDF there. Show "Saved to Downloads" (or the folder name). If the customer cancels the folder prompt, fall back to the share sheet. |
| iOS | There is no public Downloads folder. Keep the share sheet and label the row "Save to Files". The success message says "Choose Save to Files". |
| Web | Keep the print view ("Save as PDF"). |

**Code:**

1. `src/lib/receipt-export.ts`: split into `createReceiptPdf(booking): Promise<{ uri, fileName }>` (print to file, then move or copy to `FileSystem.cacheDirectory + fileName`), `downloadReceiptPdf(booking)` (platform behaviour above) and `shareReceiptPdf(booking)` (today's share). **Confirm the v58 `expo-file-system` API** (the class-based `File`/`Directory` API versus the legacy functions) before writing the move and the Android folder write, and note the answer in the PR.
2. File name rule: `Gabfix-Receipt-${booking.id}.pdf`. If a file exists, overwrite it (the content is derived from the same record).
3. `src/lib/receipt.ts`: the receipt HTML header and footer read `support` from `src/config/support.ts` (email, call, WhatsApp) so the PDF carries the support details. Title is "Receipt" when anything is paid and "Invoice" when nothing is paid.
4. Entry points:

| Surface | Control |
|---|---|
| P19 `booking/[id]/receipt` | Primary button "Download PDF"; secondary "Share" |
| P15 booking details (`booking/[id]`) | "Download receipt" row, shown when `paid > 0` or `status === 'completed'` |
| P13 confirmed (`book/[slug]/confirmed`) | "Download receipt" link under the booking code |
| Payments and wallet transaction rows | A download icon button (48 dp target) on each row that opens the same action for that booking |

5. Loading state: the button shows "Preparing PDF…" (already in P19) and is disabled while working. Errors reuse the existing alert text.
6. Add `expo-file-system` to the install list in Section 5 if it is not already there.

**Tests:** `receiptFileName('GBX-12345') === 'Gabfix-Receipt-GBX-12345.pdf'`; `receiptHtml` contains the support email and WhatsApp number from config.

### 11.2 Mobile-money numbers per network (item 2)

**Rules:**

1. The number is **never** prefilled from the contact phone, the account phone or any other field. A network with no saved number shows only the option "Use new number".
2. MTN and Airtel keep **separate** saved numbers, separate drafts and separate "save" choices, because they are different networks.
3. Validation by network (digits after removing spaces, `+` and a leading `256`; the customer types the local form with the leading `0`):

| Network | Allowed prefixes | Stored form (9 digits) | Error text when violated |
|---|---|---|---|
| MTN Mobile Money | `077`, `078`, `076`, `079` | `7[6789]XXXXXXX` | "MTN numbers start with 077, 078, 076 or 079." |
| Airtel Money | `075`, `074`, `070` | `7[540]XXXXXXX` | "Airtel numbers start with 075, 074 or 070." |

Other messages: fewer than 10 digits, "Enter all 10 digits, for example 0771 234 567."; letters are stripped silently; an Airtel prefix typed under MTN adds "That looks like an Airtel number. Choose Airtel Money instead." (and the mirror for MTN). Errors show after blur or on Continue, never while the customer is still typing the first digits.

**Pure module `src/lib/momo.ts` (new):**

```ts
export type MomoNetwork = 'mtn_momo' | 'airtel_money';

export const momoPrefixes: Record<MomoNetwork, readonly string[]> = {
  mtn_momo: ['077', '078', '076', '079'],
  airtel_money: ['075', '074', '070'],
};

/** Local form with leading 0, max 10 digits. Accepts +256 and 256 prefixes. */
export const normalizeMomoInput = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  const local = digits.startsWith('256') ? `0${digits.slice(3)}` : digits;
  return local.slice(0, 10);
};

export const networkOfNumber = (local: string): MomoNetwork | null =>
  (Object.keys(momoPrefixes) as MomoNetwork[]).find((n) =>
    momoPrefixes[n].some((p) => local.startsWith(p)),
  ) ?? null;

export const validateMomo = (network: MomoNetwork, local: string): string | null => {
  if (local.length < 10) return 'Enter all 10 digits, for example 0771 234 567.';
  if (networkOfNumber(local) === network) return null;
  const other = networkOfNumber(local);
  const base = network === 'mtn_momo'
    ? 'MTN numbers start with 077, 078, 076 or 079.'
    : 'Airtel numbers start with 075, 074 or 070.';
  return other ? `${base} That looks like ${other === 'mtn_momo' ? 'an MTN' : 'an Airtel'} number.` : base;
};

/** 0771234567 -> 771234567 (the shape `SavedMobileMoney.phone` already uses). */
export const toStoredMomo = (local: string): string => local.replace(/^0/, '');
export const formatMomo = (stored: string): string =>
  `0${stored.slice(0, 2)} ${stored.slice(2, 5)} ${stored.slice(5)}`;
```

**Data model changes:**

| Item | Change |
|---|---|
| `BookingDraft.payment` | Replace `payerPhone?: string` with `payerPhones?: Partial<Record<MomoNetwork, string>>` (local form), `savedMomoIds?: Partial<Record<MomoNetwork, string \| 'new'>>` and `saveNumber?: Partial<Record<MomoNetwork, boolean>>`. Pay now and the after-service balance read the entry for **their own** method, so MTN now and Airtel later no longer share a number. |
| Draft migration | An old `payerPhone` is copied to a network only if `validateMomo` passes for it, otherwise dropped. Bump the draft storage version. |
| `config/payments.ts` | `savedMobileMoney` becomes `[]`. Demo numbers are removed so nothing appears saved unless the customer saved it. Customers who already persisted numbers keep them. |
| `store/payment-methods.ts` | `addMobileMoney` ignores a number already saved for the same provider and returns the existing one. `isMobileMoney` also checks the prefix with `validateMomo`; invalid persisted rows are dropped on hydrate. |

**UI, `src/components/payment/momo-number-picker.tsx` (new, shared):**

Props: `network`, `saved: SavedMobileMoney[]`, `selected: string | 'new'`, `onSelect`, `value`, `onChange`, `save`, `onSaveChange`, `error`.

- Renders the saved numbers of that network as radio rows (`+256 771 234 567`, small "Saved" tag), then a last row **"+ Use new number"** with the same style and 48 dp height as the existing "+ Use a new card" row. With no saved numbers, "+ Use new number" is the only row and is selected.
- When "Use new number" is selected, show the `Input` (label "Mobile money number", placeholder `0771 234 567`, `keyboardType="phone-pad"`, `maxLength` 12 to allow spaces) and the checkbox **"Save this number for next time"** (default off).
- Used three times: "Pay now with" in P12, "Pay the balance with" in P12, and the Pay balance flow (11.3). The "Add payment method" sheet in Payments and wallet also uses `validateMomo`, so the same rules apply everywhere a number is entered.

**P12 changes (`review.tsx`):** delete `phoneDigits`/`isValidPhone` and the prefill from `contactPhone` and `user.phone`; read `payerPhones[method]`; the Continue button stays disabled until the selected saved number exists or the new number validates. Pass `phone`, `saveNumber` and `network` to `/payment/[id]`.

**`payment/[id].tsx`:** after approval, `if (params.saveNumber === '1') addMobileMoney(provider, toStoredMomo(phone))`, mirroring `saveNewCard`. Failed or abandoned payments save nothing.

**Tests (`momo.test.ts`):** `077…`, `078…`, `076…`, `079…` valid for MTN and invalid for Airtel; `075…`, `074…`, `070…` valid for Airtel and invalid for MTN; `+256 771 234 567` and `256771234567` normalise to `0771234567`; `071…` and `072…` fail both; 9 digits fails; `toStoredMomo` and `formatMomo` round-trip; the store does not duplicate a number and keeps MTN and Airtel entries separate.

### 11.3 Pay balance goes through the processing page (item 10)

**Flow (same for "Pay balance" on one booking and "Pay account balance" for late fees):**

1. Tap **Pay balance** → drawer step 1 "Choose a payment method": MTN Mobile Money, Airtel Money, Visa card (cash is never offered here, as today).
2. Step 2 in the **same drawer** (D8 pattern: one `Modal`, internal view state, back arrow to step 1): the alternatives for that method. MTN or Airtel shows `MomoNumberPicker`; Visa shows the saved cards plus "+ Use a new card" (existing card UI) and the "Save this card" checkbox. The button reads "Pay UGX 45,000" and is disabled until the choice is valid.
3. The drawer closes and the app pushes `/payment/[id]` with `kind: 'balance'` (or `'account'`), `bookingId` (or `bookingIds` as a comma list), `amount`, `method`, `phone`, `last4`, `saveNumber`, `saveCard`.
4. The processing page behaves like a booking payment (simulated provider prompt, approval, expiry) and on approval runs `payBookingBalance(id, method)` or `settleLateFees(ids, method)`, then replaces to `/profile/payments` with a success banner "Balance paid. Receipt available." and a link to the receipt.

**Changes:**

| File | Change |
|---|---|
| `components/wallet/payment-method-sheet.tsx` | Two internal views, `onPay` becomes `onContinue(selection)` where `selection = { method, phone?, savedMomoId?, cardId?, saveNumber?, saveCard? }`. Uses the shared `BottomSheet` (11.5). |
| `profile/payments.tsx` | `onPay` becomes a `router.push` to the processing page; no store write happens before approval. |
| `payment/[id].tsx` | Support `kind: 'balance' \| 'account'` next to `'tip'`. The "Use another method" button returns to `/profile/payments` and reopens the drawer. **A failed balance payment must not call `markPaymentFailed` or cancel the booking**: that hold only applies to an unpaid new booking (`PAYMENT_HOLD_MS`). Check `expireUnpaidBookings` cannot touch a booking that only owes a balance. |
| `store/bookings.ts` | No new functions; `payBookingBalance` and `settleLateFees` are called from the processing page. |

**Acceptance:** paying a balance shows the processing screen; backing out leaves the balance unchanged; a failure leaves the booking as it was; success clears the Balance due row, adds the transaction and offers the receipt.

### 11.4 Transaction history: filter and query (item 7)

**Fields a customer can use:**

| Control | Behaviour |
|---|---|
| Search box | Matches service name, booking id (`GBX-…`), method label, month name and amount (digits only, so `45000` matches `UGX 45,000`). Debounced 200 ms. Clear (X) button. |
| Type chips (existing) | All, Deposits, Balances, Cash, Refunds. |
| **Filters** button (new) with a count badge | Opens a drawer with **Method** (All, MTN, Airtel, Visa, Cash), **Period** (All time, Last 7 days, Last 30 days, Last 90 days, This month), **Direction** (All, Money in, Money out) and **Sort** (Newest, Oldest, Highest amount). Buttons: "Show results" and "Reset". |
| Result line | "12 transactions" or "No transactions match" with a "Clear filters" button. |

**Code (`src/lib/wallet.ts`):**

```ts
export type TransactionQuery = {
  text: string;
  kind: TransactionFilter;
  method: 'all' | 'mtn_momo' | 'airtel_money' | 'visa_card' | 'cash';
  period: 'all' | '7d' | '30d' | '90d' | 'month';
  direction: 'all' | 'in' | 'out';
  sort: 'newest' | 'oldest' | 'amount';
};

export const defaultTransactionQuery: TransactionQuery = {
  text: '', kind: 'all', method: 'all', period: 'all', direction: 'all', sort: 'newest',
};

export const queryTransactions = (
  all: WalletTransaction[],
  q: TransactionQuery,
  now: Date = new Date(),
): WalletTransaction[] => { /* kind -> method -> period -> direction -> text -> sort */ };

export const activeFilterCount = (q: TransactionQuery): number => /* count of non-default method, period, direction, sort */ 0;
```

- Add `serviceName` to `WalletTransaction` and fill it in `walletTransactions` so text search can match it.
- `filterTransactions` stays as a thin wrapper so existing tests keep passing.
- The query lives in component state (not persisted). Leaving and returning resets it.
- A custom date range is not in v1 (it needs a date picker); recorded as Q29.

**Tests (`wallet.test.ts`, new):** each filter alone; text matching on id, service, method label and amount; period boundaries with a fixed `now`; sort orders; `activeFilterCount`; empty result.

### 11.5 Bottom-pinned drawers (item 6)

**Problem:** "Remove this method" and "Pay balance" float with space below them. The three hand-built sheets use different bottom padding and none sets the modal window to cover the system bars.

**Fix: one shared `src/components/ui/bottom-sheet.tsx` (new), used by every drawer.**

```tsx
// Shape of the component. Confirm Modal props in the React Native 0.88 docs.
<Modal
  transparent
  animationType="slide"
  statusBarTranslucent
  navigationBarTranslucent   // Android: the window covers the navigation bar area
  visible={visible}
  onRequestClose={onClose}>
  <View style={styles.backdrop}>                 {/* flex: 1, justifyContent: 'flex-end' */}
    <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
    <View style={[styles.sheet, { paddingBottom: insets.bottom + space[4] }]}>
      {children}
    </View>
  </View>
</Modal>
```

Rules for the sheet: `alignSelf: 'stretch'`, **no `margin`** on any side, only the top corners rounded (`radius.sheet`), the safe-area bottom inset added **once** (inside the sheet, never on the backdrop), and the surface colour runs to the very bottom edge so there is never a gap. Content taller than 85% of the screen height scrolls inside the sheet.

**Apply to:** the "Remove this method?" confirm, `PaymentMethodSheet` (Pay balance), `AddMethodSheet`, `cancel-sheet`, `reschedule-sheet`, `plan-sheet`, `add-on-sheet`, `summary-sheet`, and the new `MediaSheet` (3.7) and `ConfirmSheet` (4.5). Delete each file's private `backdrop`, `sheet` and padding styles.

**Verify on a real Android phone with gesture navigation and one with three-button navigation, and on an iPhone with a home indicator.** If a gap remains on Android, record the device and the window insets in the PR; do not add a fixed offset.

### 11.6 Per-file checklist (Workstream E)

| File | Change |
|---|---|
| `src/lib/receipt-export.ts` | Split create, download, share; file name rule |
| `src/lib/receipt.ts` | Support details in the PDF; "Invoice" title when unpaid |
| `src/app/booking/[id]/receipt.tsx`, `booking/[id].tsx`, `book/[slug]/confirmed.tsx` | Download controls |
| `src/lib/momo.ts` (new), `src/lib/__tests__/momo.test.ts` (new) | Network rules |
| `src/components/payment/momo-number-picker.tsx` (new) | Shared saved-number picker |
| `src/app/book/[slug]/review.tsx` | Remove prefill and shared `payerPhone`; use the picker twice |
| `src/store/booking.ts` | New draft payment fields, migration, storage version bump |
| `src/config/payments.ts`, `src/store/payment-methods.ts` | Empty seed, dedupe, prefix check |
| `src/components/wallet/add-method-sheet.tsx` | Use `validateMomo` |
| `src/components/wallet/payment-method-sheet.tsx`, `src/app/profile/payments.tsx`, `src/app/payment/[id].tsx` | Pay balance flow |
| `src/lib/wallet.ts`, `src/lib/__tests__/wallet.test.ts` (new) | Query and filters |
| `src/components/ui/bottom-sheet.tsx` (new) and every sheet listed in 11.5 | Shared pinned drawer |

### 11.7 Acceptance criteria (Workstream E)

1. Download PDF on Android writes `Gabfix-Receipt-<id>.pdf` to the chosen folder and says where; on iOS the share sheet offers Save to Files; web opens the print view. The same action is reachable from P19, P15, P13 and each transaction row.
2. P12 shows no mobile-money number the customer did not type or save. MTN and Airtel each list only their own saved numbers plus "+ Use new number".
3. An MTN number starting `075`, `074` or `070`, or an Airtel number starting `077`, `078`, `076` or `079`, is rejected with the exact messages in 11.2.
4. "Save this number for next time" saves only after an approved payment, only for the chosen network, and never duplicates.
5. Pay balance shows the method step, then the alternatives step, then the processing page, and only an approved payment changes the balance.
6. Transaction search, type chips, method, period, direction and sort combine; the count and the empty state are correct.
7. Every drawer in 11.5 touches the bottom edge of the screen on the three devices listed there.
8. `npx tsc --noEmit`, `npx expo lint` and `npm test` pass.

---

## 12. Workstream F: Booking flow, drafts, keyboard, assignment and rating

Covers change-list items 3, 8, 11, 12 and 15. Section 3 (P8b) adds a sixth screen that must follow the same rules.

### 12.0 What the code does today

| Area | Today (from the code) | Consequence |
|---|---|---|
| Draft exit | `add-ons.tsx`, `location.tsx`, `review.tsx` and `schedule.tsx` each define their own `confirmClose` with `Alert.alert('Save as draft?', …)`. **Save draft** calls `leave()` = `router.back()`; **Discard** calls `resetDraft()` then `leave()`. `details.tsx` has no exit prompt. | Back goes to the previous booking step, not Home. After Discard the previous step renders with no draft and shows nothing (the blank screen you saw). The prompt is a native alert, so it cannot match the drawer style. |
| Home draft card | `home.tsx` shows "Continue your booking" when a draft exists and resumes at Details. | This is the target for **Save draft**. |
| Keyboard | 13 files use `KeyboardAvoidingView` or `keyboardShouldPersistTaps` with different settings. `app.json` has `softwareKeyboardLayoutMode: "resize"`. | Behaviour differs by screen. On current Android versions the screen is edge-to-edge and `resize` no longer moves content on its own, so fields stay hidden behind the keyboard. |
| Cleaner | `SavedBooking` has `cleanerId` and `cleanerName`. `booking/[id].tsx` shows a Cleaner section with text only. `config/cleaners.ts` has initials but **no photo field**. | Item 11 needs a photo source and an assignment step that does not exist yet. |
| Completion | **Nothing in the app ever sets `status: 'completed'`.** The bookings store has `cancelBooking` but no completion function. | Rating "after the job is complete" needs a completion trigger. In mock mode this document adds a simulated one (12.4). The real one comes from the backend or admin. |
| Rating | `booking/[id]/rate.tsx` (P27f) requires a star rating (`rating < 1` blocks Send) and rates the visit and the cleaner as one number. | Item 15 splits this into two optional ratings. |

### 12.1 Draft exits (items 3 and 12)

**Behaviour, on every booking step (Details, Scope, Add-ons, Schedule, Location, Review):**

| Action | Result |
|---|---|
| X button, header back or Android hardware back, with changes in the draft | Opens the **Save as draft?** drawer |
| Same, with no changes since the draft was created | Leaves without a prompt, no draft is kept, goes to Services |
| **Save draft** | The draft is written to storage, then `router.replace('/(tabs)/home')`. Home scrolls to the top, where the **Continue your booking** card sits, and shows a short "Draft saved" confirmation. |
| **Discard** | `resetDraft()`, then `router.replace('/(tabs)/services')`. Never `router.back()`. |
| **Keep editing** | Closes the drawer |

**Code:**

1. New hook `src/lib/use-draft-exit.ts`: `useDraftExit(slug)` returns `{ requestExit, sheet }`. It owns the hardware-back listener (today every screen repeats it), checks "has changes" with a `draftIsDirty(draft)` helper in `store/booking.ts`, and renders the drawer. Screens only call `requestExit()` and render `{sheet}`.
2. The drawer is a `ConfirmSheet` (4.5) on the shared `BottomSheet` (11.5), with the existing wording: title "Save as draft?", body "Your choices are kept so you can finish booking later.", buttons **Save draft** (primary), **Discard** (destructive text), **Keep editing** (ghost). Replace all five `Alert.alert` blocks.
3. `store/booking.ts`: make `saveDraftNow(): Promise<void>` that awaits the AsyncStorage write, and call it before navigating so Home never reads a stale draft.
4. **Draft guard:** `useDraftGuard(slug)` in every booking screen. If there is no draft for the slug (after Discard, a deep link, or a cold start), it does `router.replace('/(tabs)/services')` instead of rendering nothing. This removes the blank screen at the cause.
5. `confirmed.tsx` calls `resetDraft()` on mount (line 90). Keep it, and keep the guard from firing there.
6. Home: the draft card is the first block under the search bar (Section 13). Add `draft.lastStep` (route name) so **Resume** opens the step the customer left, not always Details. Add a small "Discard" text button on the card, with the same drawer, so an old draft can be cleared without opening it.

### 12.2 Keyboard: the active field stays above the keyboard (item 8)

**Rule:** when a field takes focus, its bottom edge sits at least 16 dp above the top of the keyboard, on every screen, sheet and chat.

**Approach (recommended): `react-native-keyboard-controller`.** It is the usual fix for edge-to-edge Android, is **native** (needs a development build) and provides `KeyboardAwareScrollView`, `KeyboardAvoidingView` and `KeyboardStickyView`. **Confirm it supports Expo SDK 58 and React Native 0.88 in its docs before installing**, and install with `npx expo install`. Fallback if it does not: built-in `KeyboardAvoidingView` with `behavior="padding"` on both platforms plus `scrollTo` on focus, accepting weaker animation.

**Shared components (new, in `src/components/ui/`):**

| Component | Use |
|---|---|
| `KeyboardScreen` | Replaces the per-screen `KeyboardAvoidingView` + `ScrollView` pairs. A scroll view that scrolls the focused input into view (`bottomOffset={24}`), keeps `keyboardShouldPersistTaps="handled"` and `keyboardDismissMode="on-drag"` |
| `KeyboardSheetBody` | For inputs inside a `Modal` sheet (add method, Filters, ticket sheet). A `Modal` is a separate window, so it needs its own wrapper; confirm the library's behaviour inside `Modal` |
| `StickyComposer` | The chat message bar. Follows the keyboard exactly and keeps the list's last message visible |

`Input`, `TextArea` (multiline fields grow to a maximum of 6 lines, then scroll inside) and `CodeInput` get an `onFocus` that asks the parent `KeyboardScreen` to reveal them.

**Screens to convert:** `chat/[threadId]`, `book/[slug]/details`, `scope` (new), `location`, `review`, `schedule` (notes field), `booking/[id]/rate`, `profile/edit`, `addresses/[id]`, `quote/[slug]`, `help/index` and `help/contact` (ticket form, Section 16), `search`, `components/auth/auth-screen`, `components/wallet/add-method-sheet`, the Payments and wallet search and Filters drawer (11.4), `MomoNumberPicker` (11.2) and the Support ticket form. Remove `softwareKeyboardLayoutMode: "resize"` from `app.json` only after the Android pass proves the new behaviour (record the result).

**Tests (device):** on a 360 x 640 Android phone, on a tall phone and on an iPhone, open each screen above, focus the lowest field and the multiline field, and check the 16 dp rule with text size at 130%. Rotate the phone (if rotation is allowed) with the keyboard open.

### 12.3 Cleaner assignment simulation (item 11)

**Goal (mock only):** 6 minutes after an order is created, a cleaner or technician is "assigned": the Cleaner section of the order details shows their photo in a circle, and the customer gets a push and an in-app notification. Real assignment arrives with the backend (D15); every piece below is isolated behind one config flag so it can be deleted.

**Config (`src/config/mock.ts`, new):**

```ts
export const mock = {
  assignment: { enabled: true, delayMs: 6 * 60_000 },
  completion: { enabled: true, afterScheduleEnd: true, devButton: __DEV__ },
} as const;
```

**Data:**

| Item | Change |
|---|---|
| `SavedBooking` | Add `assignAtISO?: string` (created time + `delayMs`, set in `addBooking`) and `assignedAtISO?: string`. Keep `cleanerId` and `cleanerName`. |
| `Cleaner` (`config/cleaners.ts`) | Add `photoUri?: string` (a bundled image or a remote URL). With no photo the circle shows the existing initials on a brand-colour background. |
| Roster | The roster is cleaners today. Add `kind: 'cleaner' \| 'technician'` so electrical, plumbing and handyman work shows "Technician". Dummy entries only. |

**Logic (`src/lib/assignment.ts`, new, pure plus one runner):**

1. `pickAssignee(booking, roster)`: keeps the preferred cleaner if the customer chose one (P18 "same cleaner"); otherwise the highest-rated roster member whose `serviceSlugs` include the booking's service, with a deterministic tie-break by id.
2. `processDueAssignments(now)`: for every `upcoming` booking with `assignAtISO <= now` and no `assignedAtISO`, set the assignee, set `assignedAtISO`, and call `addNotification({ kind: 'booking', title: 'Your cleaner is assigned', body: '<Name> will handle your <service> on <date>.', href: '/booking/<id>' })`. Idempotent: running it twice never double-notifies.
3. When it runs: once after hydration in `_layout.tsx`, whenever the app returns to the foreground (`AppState`), and on a `setTimeout` for the next due booking while the app is open.
4. **Push while the app is closed:** at booking creation, schedule a local notification with `expo-notifications` for `delayMs` later (`scheduleNotificationAsync`, a time-interval trigger; **confirm the v58 trigger shape**). Store its id on the booking and cancel it if the booking is cancelled or rescheduled. It respects the Notifications settings from Section 4.2 (the in-app and push channels). The notification channel name is "Booking updates".
5. Cancelled bookings are never assigned. A booking created in the past (rebook, test data) assigns on the next run.

**UI (`booking/[id].tsx`, Cleaner section; also P27c chat header and P27d tracking):**

- Unassigned: the current text, plus "A cleaner is usually assigned within a few minutes." in mock mode only.
- Assigned: a 56 dp circular photo (`radius` full, 2 dp brand border), the name, the rating and jobs done, and the **Message** and **View profile** buttons that already exist elsewhere. Use the shared `Avatar` component (new, with the initials fallback and `accessibilityLabel="<Name>, assigned cleaner"`).
- Show the same circle on the booking card in the Bookings list and in the Home upcoming card (Section 13).

### 12.4 Completion and rating (item 15)

**Completion (mock):** because no code completes a booking, add `completeBooking(id)` to `store/bookings.ts` (sets `status: 'completed'`, `completedAtISO`). In mock mode `processDueCompletions(now)` completes a booking when its scheduled end (`dateISO` + `startTime` + `hours`) has passed, and a development-only button "Mark job complete (demo)" on the order details does it on demand. On completion: add an in-app and push notification "How did it go?" with `href: '/booking/<id>/rate'`.

**Rating screen (P27f, `rate.tsx`):** two optional parts, then the existing tip block.

| Part | Content | Required? |
|---|---|---|
| **Rate the job** | 1 to 5 stars for the service, quick tags ("On time", "Spotless", "Good value"...), comment, photos | **No** |
| **Rate your cleaner** (or "technician") | Cleaner circle and name, 1 to 5 stars, tags ("Polite", "Careful", "Professional"...), comment | **No** |
| Tip | As today | No |

- The **Send** button is enabled when at least one star rating, comment or tip is present, and the screen has a **Skip** text button that records "skipped" so the prompt is not repeated.
- Remove the error "Choose a star rating before sending your review." and the `rating < 1` guard.
- `store/reviews.ts`: replace `stars` with `jobStars?: number` and `cleanerStars?: number` (each 1 to 5 when present), keep `tags`, `comment`, `photos`; `isReview` accepts a review with either rating; migrate old rows to `jobStars = cleanerStars = stars`. The cleaner's displayed rating uses `cleanerStars` only; the service rating uses `jobStars`.
- **Prompts:** a "Rate your clean" card on Home and on the order details for a completed booking with no review and no skip (dismiss with "Not now", which hides it for 3 days), and the notification above. Rating is always optional and never blocks Book again, the receipt or support.
- Copy: "Rate your clean (optional)", "Rate the job", "Rate Rose (optional)", "Skip for now", "Thanks for your feedback."

### 12.5 Per-file checklist (Workstream F)

| File | Change |
|---|---|
| `src/lib/use-draft-exit.ts` (new), `store/booking.ts` | Exit hook, `saveDraftNow`, `draftIsDirty`, `lastStep`, `useDraftGuard` |
| `add-ons.tsx`, `location.tsx`, `review.tsx`, `schedule.tsx`, `details.tsx`, `scope.tsx` (new) | Use the hook and the guard; delete local `confirmClose` and the five alerts |
| `src/components/ui/bottom-sheet.tsx`, `confirm-sheet.tsx` | Shared drawers (11.5, 4.5) |
| `package.json`, `app.json` | `react-native-keyboard-controller` (after the docs check), provider in `_layout.tsx` |
| `keyboard-screen.tsx`, `keyboard-sheet-body.tsx`, `sticky-composer.tsx` (new) and the screens listed in 12.2 | Keyboard behaviour |
| `src/config/mock.ts`, `src/lib/assignment.ts`, `src/lib/__tests__/assignment.test.ts` (new) | Assignment and completion simulation |
| `config/cleaners.ts`, `store/bookings.ts`, `_layout.tsx`, `booking/[id].tsx`, `components/ui/avatar.tsx` (new) | Photo circle, fields, runners |
| `booking/[id]/rate.tsx`, `store/reviews.ts`, `components/reviews/*` | Two optional ratings and migration |

### 12.6 Acceptance criteria (Workstream F)

1. **Save draft** from any booking step lands on Home with the Continue your booking card visible at the top and the draft intact; Resume opens the step the customer left.
2. **Discard** lands on Services and never on an empty screen; opening a booking route with no draft redirects to Services.
3. On every listed screen, sheet and chat, the focused field is at least 16 dp above the keyboard on both platforms, including with 130% text.
4. Six minutes after an order is created (also if the app was closed or killed), the order details show the assigned person's circular photo (initials if none), and one in-app and one push notification arrive, once.
5. Cancelling or rescheduling an order cancels its pending assignment notification.
6. A completed order offers the rating screen; the job rating, the cleaner rating and the tip are each optional, and sending with nothing but a comment works.
7. `npx tsc --noEmit`, `npx expo lint` and `npm test` pass.

---

## 13. Workstream G: Dashboard (Home tab)

Covers change-list items 4, 5, 13 and 14, the Most popular card change from item 23, and the "at a glance" suggestions you asked for. File: `src/app/(tabs)/home.tsx` (1,106 lines today).

### 13.0 What the screen holds today, and what happens to each part

| # | Today (top to bottom) | Decision |
|---|---|---|
| 1 | Green gradient hero with the **yellow `Blob` shape (`variant="topRight"`)**, greeting, avatar, bell, **area chip** (`MapPin` + served area), search bar | **Keep the hero, remove the yellow shape** (item 14). The area chip changes (see 13.2 and Section 15). |
| 2 | "Continue your booking" draft card | **Keep**, now the first block under the search bar (item 3 lands here). |
| 3 | Offers carousel (yellow promo cards, dots) | Keep (not in your list). |
| 4 | Trust capsules: **Vetted cleaners, Free cancellation, Satisfaction promise** | **Remove** (item 4). |
| 5 | **Top cleaners** ("Vetted pros near you") | **Remove** (item 4). |
| 6 | Most popular: 2-column grid of full-photo cards with a dark scrim | **Keep the section, change the card** to the category-card look (13.4). |
| 7 | **Home cleaning** and **Property and office** category sections (horizontal rows of photo-over-text cards) | **Remove** (item 5). Their card design moves to Most popular. |
| 8 | "Book again" card and "Next clean" card (shown when data exists) | Keep, moved up (13.1). |
| 9 | **How it works** | **Remove** (item 13). |
| 10 | **Loved by customers** (All reviews) | **Remove** (item 13). |

**Not touched:** the bottom tab bar, the search screen, the notifications screen, and the Services tab.

### 13.1 New order of blocks

```
Hero (green only, no yellow shape): greeting, avatar, bell, location chip, search
Continue your booking        (only with a draft)
Balance due                  (only when something is owed)
Rate your clean              (only for a completed, unrated booking)
Next clean                   (only with an upcoming booking; shows the assigned person's photo, 12.3)
Your activity                (stat tiles, 13.3)
Offers                       (existing carousel)
Most popular                 (card row, 13.4)
Book again                   (only with a past booking)
```

Spacing: the blocks use `space[4]` gaps and the first block starts `space[3]` under the search bar. Because items 4, 5, 7, 9 and 10 are gone, nothing is left to "pull up": remove their `sectionBlock` wrappers and any empty `marginTop` so there are no gaps where a removed section used to be.

### 13.2 Hero clean-up (items 14 and 23)

1. Delete `<Blob variant="topRight" ratio={0.34} />` and the `Blob` import from `home.tsx`. The hero stays the existing `LinearGradient` from `auth.bgTop` to `auth.bgBottom`. `Blob` keeps being used by the auth screens, which are shown logged out; `area-select.tsx` (its other user) is retired in Section 15.
2. The location chip no longer shows a served area. It shows the customer's default saved address, shortened (for example "Kireka, Kampala"), or "Add your address" when none is saved. Tapping opens `addresses/index`. With Service Areas gone (Section 15), `useOnboardingArea` is not read here any more.

### 13.3 "Your activity" stat tiles and the Balance due card (item 5)

**Image note:** your message refers to a stats image, but the images I received are the help ticket page, notifications, security, devices and sessions, and the two photo sheets. The stats reference was not among them. The tiles below are my default; **please resend the image and the tiles will be matched to it (Open question Q17).**

**Stat tiles (default): one row of three equal tiles**

| Tile | Value | Tap opens |
|---|---|---|
| Upcoming | Count of `upcoming` bookings | Bookings tab on the Upcoming tab |
| Completed | Count of `completed` bookings | Bookings tab on the Completed tab |
| Total spent | Sum of `paid` over non-cancelled bookings, compact (`UGX 1.2M`) | Payments and wallet, Transactions |

Tile style: `StatTile` from Section 4.5 (surface card, `radius.card`, big number in `text.h2`, label in `text.caption`, icon in a tinted circle). Numbers have `accessibilityLabel="3 upcoming bookings"`. A customer with no bookings sees 0, 0 and UGX 0, not a hidden row, so the layout never shifts when the first booking arrives.

**Balance due card:**

| Element | Content |
|---|---|
| Visibility | Only when `dueSummary(bookings).total > 0`. Hidden otherwise. |
| Content | Kicker "Balance due", the amount in large type, a caption "2 bookings waiting for payment" (or "Late fees on your account"), and a **Pay balance** button |
| Action | `router.push({ pathname: '/profile/payments', params: { focus: 'balance-due' } })` |
| Target | Payments and wallet scrolls to its **Balance due** section (a `ref` plus `scrollTo` on layout) and gives the section a 1.5 s highlight. The actual per-booking numbers and the Pay balance buttons are there, and Pay balance now runs the processing flow from 11.3. |
| Colour | A warm warning surface from existing tokens (the error/yellow tint already used for balances), never a new hex. |

**Code:** add `dueSummary(bookings): { count: number; bookingTotal: number; accountTotal: number; total: number }` to `src/lib/wallet.ts`, built from `totalBalanceDue` and `totalAccountBalance`, and use it for **both** this card and the header number on Payments and wallet so the two always agree. Add `focus` handling to `profile/payments.tsx`.

### 13.4 Most popular: new card (item 23)

The Most popular cards take the layout of the removed Home cleaning and Property and office rows:

- A **horizontal row** (`ScrollView horizontal`, `showsHorizontalScrollIndicator={false}`, `categoryRow` spacing), not a 2-column grid.
- Each card is the existing `categoryCard`: **photo on top** (`ServicePhoto` with `categoryPhoto`), a text body under it with the service name (up to 2 lines) and "From UGX …/hr" (`categoryName`, `categoryPrice`). No dark scrim and no text on the photo. The "Popular" tag stays as a small chip on the photo corner only when `service.tag` is set.
- Header: "Most popular" with a **See all** link to the Services tab, as today.
- **Which services:** add `popularRank?: number` to `Service` (Section 14.2); show the six lowest ranks, falling back to the first six services. The admin sets the rank when it manages the catalogue.

Delete the now unused styles (`grid`, `serviceCard`, `servicePhoto`, `serviceScrim`, `serviceName`, `servicePrice`, `sectionBlock`, `categoryHeading` and the removed sections' styles) and the imports `serviceCategories`, `cleaners`, `reviewsForService`, `Star`, `ShieldCheck`, `Timer` and `Sparkles` if nothing else uses them. Run `npx expo lint` to catch the leftovers.

### 13.5 Other at-a-glance ideas (suggestions, not yet in scope)

| Idea | What it shows | Worth it? |
|---|---|---|
| **Quick actions row** | Four round buttons: Book, Track, Pay, Support | Yes. Cheapest shortcut for repeat customers; fits under the hero |
| **Active job tracker** | A live strip "Rose is on the way, 12 min" while a booking is in progress | Yes, when tracking is real (the tracking screen already exists) |
| **Rate your clean** | Prompt for a completed booking (12.4) | Included above |
| **Recurring plan** | "Next visit: Tuesday" for a repeating plan | Yes, if plans are kept (P27g exists) |
| **Open support ticket** | Status chip for the latest ticket (Section 16) | Yes after tickets exist |
| **Referral** | "Invite a friend, earn UGX 10,000" | Later; Refer is one tap away in Profile |
| **Wallet credit** | Balance of credit or refunds | Only if credits are introduced |
| **Seasonal tips or reminders** | "Rainy season: book roof and gutter care" | Later, admin-driven content |

My pick for the next round: quick actions and the active job tracker.

### 13.6 Per-file checklist (Workstream G)

| File | Change |
|---|---|
| `src/app/(tabs)/home.tsx` | Remove blocks 4, 5, 7, 9, 10 and the blob; new order; stat tiles; Balance due card; Most popular row; location chip; delete dead styles and imports |
| `src/components/ui/stat-tile.tsx` (new, Section 4.5) | Stat tile |
| `src/components/home/balance-due-card.tsx`, `rate-prompt-card.tsx` (new) | Cards |
| `src/lib/wallet.ts` | `dueSummary` |
| `src/app/profile/payments.tsx` | `focus=balance-due` scroll and highlight; header uses `dueSummary` |
| `src/app/(tabs)/bookings.tsx` | Accept a `tab` param so tiles open the right tab |
| `src/config/services.ts` | `popularRank` |

### 13.7 Acceptance criteria (Workstream G)

1. Logged in, the top of Home is plain green: no yellow shape. The auth screens still have theirs.
2. No trust capsules, Top cleaners, Home cleaning, Property and office, How it works or Loved by customers on Home, and no gap where they were.
3. The Continue your booking card is the first block under the search bar when a draft exists.
4. With a balance owed, Balance due shows the same amount as the Payments and wallet header and opens that page scrolled to its Balance due section; with nothing owed, the card is absent.
5. The three stat tiles show correct counts and open the right tab or page.
6. Most popular is a horizontal row of photo-over-text cards identical in look to the old category cards, with a See all link.
7. `npx tsc --noEmit`, `npx expo lint` and `npm test` pass, and `home.tsx` has no unused imports or styles.

---

## 14. Workstream H: Services catalogue and dynamic job details

Covers change-list item 9 (services page, categories, dynamic details) and item 16 (service booking page clean-up). Files: `config/services.ts`, `(tabs)/services.tsx`, `service/[slug].tsx`, `book/[slug]/scope.tsx` (P8b), `admin/src/pages/Services.tsx`.

### 14.0 What exists today

| Area | Today (from the code) | Consequence |
|---|---|---|
| Catalogue | `config/services.ts` has 4 services and **two hard-coded categories** (`'home' \| 'property'`, a TypeScript union). `Service` has `category`, `tag`, `cardImage`, `areaImage`. | The category list cannot be edited as data. The type must become a string id before an admin can add categories. |
| Services tab (P6) | Category chips plus sections, one `ServiceCard` per service (`name`, `tagline`, `price`, `tag`). | Re-lay as twin cards (14.2). |
| Pricing | `price()` is rate x hours x cleaners (`pricing.ts`). | Fine for cleaning. **It is wrong for painting, tiling, renovation, electrical, plumbing and similar jobs**, which are priced per job. See decision H2. |
| Service content | `config/service-content.ts` and `use-service-content.ts` hold intro, included, pricing, extras, FAQ per slug. | The 14 new services need content or a fallback so no page crashes. |
| Admin | `admin/src/pages/Services.tsx` exists and imports read-only config. | It is where categories, services and form fields will be managed (14.6). |

### 14.1 Decisions for this workstream

| # | Decision | Why |
|---|---|---|
| H1 | **Categories and services are data, not types.** `ServiceCategoryId` becomes `string`. A category has `parentId` for sub-categories (two levels). | You said the admin will add categories and sub-categories later. |
| H2 | **Each service has a `pricingMode`: `'hourly'` or `'quote'`.** Hourly services use the existing flow and `price()`. Quote services skip the hourly price, send the job details and photos through the **existing quote flow** (`quote/[slug]`, `quote-request-card`) and show "Get a quote" instead of "From UGX …/hr". | Trades and construction cannot be priced from hours x cleaners. **Default below: cleaning services are hourly; everything else is quote.** Confirm in Q18. |
| H3 | **The "Details" questions are a form schema attached to the service** (or inherited from its category, or the global default). One generic renderer draws any schema. The admin cannot invent new field **types**, only choose from a fixed set. | This is the answer to "we cannot predict what the admin will add". See 14.4. |
| H4 | **A booking stores a snapshot** of the questions and answers (label, type, value, display text), not only the answers. | If the admin renames or deletes a field later, old bookings, receipts and the cleaner's job card still read correctly. |
| H5 | **Old slugs are kept.** `home-clean` stays the id of what is shown as **Basic cleaning**. `office-clean` and `move-out-clean` stay in the data as **inactive** (hidden in the app, still resolvable). | Existing bookings, rebooks, receipts and reviews point at these slugs. |
| H6 | **"Landscaping and grass cutting" is one service** in the first list. | Your message reads it as one item; Q19 asks if it should be two. |

### 14.2 Catalogue data model and the 18 services

```ts
// src/config/services.ts (replaces the union types)
export type ServiceCategory = {
  id: string;
  name: string;
  caption: string;
  order: number;
  parentId?: string;         // sub-category support (H1)
  formSchemaId?: string;     // inherited by services in this category (14.4)
  active: boolean;
};

export type Service = {
  slug: string;
  name: string;
  tagline: string;
  categoryId: string;
  subcategoryId?: string;
  pricingMode: 'hourly' | 'quote';
  popularRank?: number;      // used by Home > Most popular (13.4)
  tag?: string;
  cardImage?: string;
  formSchemaId?: string;     // overrides the category's schema
  active: boolean;
};
```

**Proposed categories and the 18 services you listed (proposal; the grouping is for you to confirm, Q20):**

| Category (order) | Services | Pricing mode |
|---|---|---|
| **Cleaning** (1) | Basic cleaning (`home-clean`), Deep cleaning (`deep-clean`), Post-construction cleaning | hourly, hourly, **quote** |
| **Upholstery and carpets** (2) | Carpet cleaning, Sofa sets cleaning, Dining chairs cleaning | hourly |
| **Surface care** (3) | Pavers cleaning, Roof tile cleaning, Terrazzo and tile polishing | **quote** |
| **Pest control** (4) | Fumigation | **quote** |
| **Repairs and installations** (5) | Electrical works, Plumbing works, Handyman works | **quote** |
| **Building and finishing** (6) | Tiling, Painting, Renovation works | **quote** |
| **Outdoor and landscaping** (7) | Pavers laying, Landscaping and grass cutting | **quote** |

Total: 3 + 3 + 3 + 1 + 3 + 3 + 2 = 18. `popularRank` defaults: Basic cleaning 1, Deep cleaning 2, Sofa sets cleaning 3, Carpet cleaning 4, Fumigation 5, Painting 6.

Because the first release has no admin yet, the catalogue ships as `src/config/services.ts` plus `src/config/service-categories.ts` and is replaced by `GET /services` and `GET /service-categories` at the backend stage (D15); the shape above is the API shape.

**Content and images for the 14 new services:** add dummy entries to `config/service-content.ts` (intro, included, pricing text, FAQ) and `config/service-images.ts`. `useServiceContent` gets a **fallback**: if a slug has no entry, build generic content from the service name and its category, so a new admin-created service never opens a blank page. Hourly rates for new hourly services reuse the existing table until finance sets them (Open item 4).

### 14.3 Services tab: twin cards grouped by category

- **Layout:** for each active category (by `order`): a section header (category name, caption, count), then the services as a **two-column grid of twin cards**, each card exactly half the width minus the gap: `(width - space[4]*2 - space[3]) / 2`. If a category has a sub-category, a smaller sub-heading sits above its cards. An odd count leaves an empty half-slot, never a stretched card.
- **Card (reuse the category card from Section 13.4):** photo on top, service name (2 lines max), then "From UGX …/hr" for hourly services or **"Get a quote"** for quote services; the "Popular" tag as a chip on the photo.
- **Chips bar (existing):** "All" plus one chip per category, built from data. Selecting a chip scrolls to that category's header (or filters to it, keep the current filter behaviour); the chips scroll horizontally.
- **Search** (existing search screen) matches service name, tagline and category name.
- **Empty and error states** stay as today. A category with no active services is not shown.
- **Performance:** use a `SectionList` or `FlatList` with `numColumns={2}` per section (not a `ScrollView` of all 18 cards) so adding 100 services later stays smooth.

### 14.4 The dynamic details form (answer to the "we cannot predict the services" problem)

**Principle:** the admin does not design screens; the admin fills in a **schema** (a list of questions) from a **fixed catalogue of field types** the app already knows how to draw. The app draws any schema the same way. Anything the admin cannot express with these types is handled by two escape hatches: a free-text "Describe the job" field and photo or video slots. That covers every service without an app update.

**Where the schema comes from (first match wins):** the service's `formSchemaId` → its category's `formSchemaId` → the global default schema. So a new category (for example "Tiling") can ship with one schema that all its services share, and a single service can still override it.

**Field types (closed set, v1):**

| Type | The customer sees | Stored value | Typical use |
|---|---|---|---|
| `text` | One-line input | string | "Roof material", "Pipe location" |
| `textarea` | Multi-line input | string | "Describe the job" |
| `number` | Numeric input with a unit label | number | Area, length, quantity |
| `counter` | Minus / plus stepper | integer | Rooms, sofas, chairs, points |
| `select` | Radio cards (up to 6) or a picker (more) | option id | Size band, surface type |
| `multiselect` | Chips | option id list | Focus areas, extras |
| `boolean` | Yes / No | boolean | "Is there a ladder on site?" |
| `measurement` | Number plus a unit choice (m², m, ft) | `{ value, unit }` | Land size, wall length |
| `media-slot` | A labelled photo or video prompt ("Photo of the leak") | media ids | Targeted evidence |

**Field definition:**

```ts
export type FieldOption = {
  id: string;                 // stable slug, never reused
  label: string;
  hint?: string;
  minutes?: number;           // optional time effect when chosen (14.4 estimates)
  flagsQuote?: boolean;       // forces "we will confirm the price"
};

export type FormField = {
  id: string;                 // stable slug, unique inside the schema
  type: 'text' | 'textarea' | 'number' | 'counter' | 'select' | 'multiselect'
      | 'boolean' | 'measurement' | 'media-slot';
  label: string;              // max 60 characters
  helper?: string;            // max 140 characters
  placeholder?: string;
  required: boolean;
  default?: FormValue;
  min?: number; max?: number; step?: number; unit?: string;
  options?: FieldOption[];    // select, multiselect (2 to 20)
  minutesPerUnit?: number;    // counter, number, measurement
  showIf?: { fieldId: string; op: 'eq' | 'neq' | 'in' | 'gt' | 'lt' | 'truthy'; value?: FormValue };
  maxMedia?: number;          // media-slot
};

export type FormSection = { id: string; title: string; fields: FormField[] };

export type FormSchema = {
  id: string;
  version: number;            // incremented on every admin save
  heading: string;            // 'About your home'
  sections: FormSection[];    // 1 to 5 sections, 1 to 12 fields each, 40 fields maximum
  mediaRequired: boolean;
  mediaHint: string;
};

export type FormValue = string | number | boolean | string[] | { value: number; unit: string } | null;
```

**What the customer's draft stores (replaces `BookingScope` in 3.2):**

```ts
export type BookingScope = {
  schemaId: string;
  schemaVersion: number;
  answers: Record<string, FormValue>;       // keyed by field id
  notes?: string;                            // the always-present "Anything else?" box
  snapshot?: ScopeSnapshotRow[];             // written when the booking is saved (H4)
};

export type ScopeSnapshotRow = {
  fieldId: string; label: string; type: FormField['type']; value: FormValue; display: string;
};
```

**Pure module `src/lib/form-schema.ts` (no React Native imports, so the admin web app can import it too):**

| Function | Purpose |
|---|---|
| `validateSchema(schema)` | Checks limits, unique ids, options count, `showIf` points at an earlier field, no cycles. Used by the admin before saving and by the app when it loads a schema (invalid schema falls back to the default schema and logs) |
| `visibleFields(schema, answers)` | Applies `showIf`; hidden fields are skipped and their answers dropped |
| `validateAnswers(schema, answers)` | Required, min, max, option membership; returns `{ [fieldId]: message }` |
| `suggestedMinutes(schema, answers)` | Sums `minutesPerUnit x value` and chosen option `minutes`; returns `undefined` when no field has a time effect |
| `requiresQuote(schema, answers)` | True when any chosen option has `flagsQuote` |
| `buildSnapshot(schema, answers)` | Produces the `ScopeSnapshotRow[]` with human display text |
| `defaultSchema` | The global fallback: "Describe the job" (textarea, required), "Rough size" (select Small, Medium, Large, Not sure), "How urgent?" (select Flexible, This week, Urgent), photos optional |

**Renderer `src/components/booking/dynamic-form.tsx` (new):** maps each `type` to a shared control (`CounterRow` from 3.5, `Input`, `TextArea`, `ChipSelector`, `SelectableCard`, a new `MeasurementInput` and the `media-slot` row that opens `MediaSheet` for that slot). It never reads a service slug; it only reads the schema. It sits inside P8b where the fixed fields were, and keeps the P8b layout, stepper, suggestion banner (Apply sets hours or cleaners for hourly services) and media section from Section 3.

**Behaviour rules:**

1. **Unknown field type** (an old app meeting a newer schema): the renderer skips the field and, if it was required, treats it as optional. The schema carries `minAppVersion` for fields that need a newer app; the admin sees a warning.
2. **Required fields** block Continue and scroll to the first error (and respect Section 12.2 keyboard rules).
3. **`media-slot`** media is stored in `draft.media` with a `slotId`, so the job card can show "Photo of the leak" with its picture.
4. **Quote mode** (H2 or `requiresQuote`): the footer says "Request quote" and the flow continues to the quote screen with `scope`, `notes` and `media` attached instead of Add-ons and payment.
5. **Draft safety:** if the schema version on the server is newer than the draft's, keep every answer whose field id and type still match and ask only the new required fields (never wipe the draft).
6. **Old drafts and bookings** (no `schemaId`) are read through the seed schemas in 3.3: the old fixed fields are exactly those schemas' fields.

**Seed schemas shipped with the app (data in `src/config/form-schemas.ts`):** `cleaning-home` (Basic, Deep: the 3.3 fields), `upholstery` (counter "How many sofas / chairs / rugs", select material, boolean "Pet stains", media), `surface` (measurement area, select surface, select condition, boolean "Access with a ladder", media-slot "Photo of the surface"), `repairs` (select "What needs attention", textarea, boolean "Is it urgent or an emergency?", media-slot), `building` (measurement, select "Stage" and "Materials supplied by", counter "Rooms", media), `outdoor` (measurement land size, select terrain, boolean "Debris to remove", media) and the global `default`. All labels and options are dummy copy for you to correct.

**Why this scales:** a new service in an existing category needs **no schema work** (it inherits). A new category needs one schema, built from nine field types. A genuinely new kind of question (a signature, a map pin) needs one new field type: one enum value, one control and one `validate`/`display` case, added once and available to every service.

### 14.5 Service page clean-up (item 16)

On `service/[slug].tsx`, for **every** service (Basic cleaning, Deep cleaning and the new ones), remove:

| Remove | Where in the code |
|---|---|
| **Reviews** section (rating summary, review cards, "Read all reviews") | Lines about 378 to 405, plus the `reviewsForService`, `ReviewCard` and `Stars` imports |
| **Related services** | The block at about line 489 |
| **Top cleaners** | The block at about line 410 |
| **How it works** | The timeline block at about line 349 and the `steps` array at line 61 |
| **Discount badge** (the "20% off first clean" stamp) | `styles.stamp` block at about line 241 |
| **Trust strip** ("Vetted cleaners, Upfront pricing, Free changes 24 h") | The `TrustItem` row at about line 251 and the `TrustItem` component if unused |
| **Rating chip** in the hero ("4.8 · 120 reviews") | About line 231. It points at the removed reviews, so it goes too (Q21) |

**What stays:** hero, intro, **What's included**, **Pricing** (for quote services it explains how quotes work: "Send the job details and photos, we reply with a price"), **Popular extras** (hourly services only) and **Questions**, plus the bottom button ("Book now" for hourly, "Get a quote" for quote services). The `service/[slug]/reviews` route and the review data stay in the repo but nothing links to them; list the route under "unlinked" in the progress document rather than deleting it.

The same trust claims ("Vetted cleaners", "Free cancellation") also appear in the confirm and booking-flow screens in places; run a search for `Vetted`, `Free cancellation`, `Satisfaction promise`, `Free changes` and `20% off` across `src/` and remove or reword anything left, except in the policies text (`config/policies.ts`), which is legal copy.

### 14.6 Admin: managing categories, services and forms (backend stage, specified now)

`admin/src/pages/Services.tsx` gets three panes: **Categories** (add, rename, reorder, nest one level, deactivate), **Services** (name, tagline, category, pricing mode, hourly rate, image, popular rank, active, form schema) and **Form builder** (add field, pick type, label, helper, required, options, unit, min and max, show-if rule, time effect, reorder, delete, and a read-only preview rendered from the same `FormSchema`). The builder calls `validateSchema` from `src/lib/form-schema.ts` before saving, and saving increments `version`. **Deleting a field never deletes old answers** (snapshots keep them). Nothing from this section is built now (D15); it is recorded so the data shapes above do not change when the backend is built.

### 14.7 Per-file checklist (Workstream H)

| File | Change |
|---|---|
| `src/config/services.ts`, `service-categories.ts` (new) | Types, 7 categories, 18 services plus 2 inactive, helpers `activeServices`, `servicesByCategoryId` |
| `src/config/service-content.ts`, `service-images.ts`, `hooks/use-service-content.ts` | Content for new services, fallback content |
| `src/hooks/use-services.ts`, `use-service-search.ts`, `lib/api/discovery.ts` | Use `categoryId` strings and `active`; categories come with the services response |
| `src/app/(tabs)/services.tsx` | Twin cards, section list, chips from data |
| `src/app/(tabs)/home.tsx` | Most popular reads `popularRank` (13.4) |
| `src/lib/form-schema.ts`, `src/config/form-schemas.ts` (new), `__tests__/form-schema.test.ts` (new) | Engine, seeds, tests |
| `src/components/booking/dynamic-form.tsx`, `measurement-input.tsx` (new) | Renderer |
| `src/app/book/[slug]/scope.tsx` (P8b), `lib/pricing.ts`, `store/booking.ts`, `store/bookings.ts` | Use `BookingScope` (schema, answers, snapshot); quote-mode branch |
| `src/app/service/[slug].tsx` | Section 14.5 removals; quote-mode button |
| `src/lib/quotes.ts`, `app/quote/[slug].tsx` | Accept `scope` and `media` from the order flow |
| `src/lib/receipt.ts`, `booking/[id].tsx`, `admin/src/pages/Bookings.tsx` | Show the snapshot rows as "Job details" |

### 14.8 Tests (`form-schema.test.ts`)

`validateSchema` rejects duplicate ids, a `showIf` that points forward, 41 fields and a `select` with 1 option; `visibleFields` hides and drops answers for hidden fields; `validateAnswers` covers required, min, max and an unknown option id; `suggestedMinutes` returns `undefined` without time effects and sums counters and options with them; `requiresQuote` follows `flagsQuote`; `buildSnapshot` renders display text for every type; a schema with an unknown field type renders without throwing; a draft keeps matching answers when the version changes.

### 14.9 Acceptance criteria (Workstream H)

1. The Services tab shows the 18 services in 7 category sections, two cards per row, with a working chip bar; quote services say "Get a quote".
2. Adding a service to `config/services.ts` with only a category id shows it on the tab, in search and with a working page and form, with no screen code changed.
3. Changing a schema (add a field, change an option) changes P8b for that service and nothing else; a booking made earlier still shows its original questions.
4. A required `media-slot` or field blocks Continue with an inline message; hidden fields never block.
5. A quote-mode service never shows an hourly price or a payment step and ends in the quote flow with its details and photos attached.
6. No service page shows Reviews, Related services, Top cleaners, How it works, a discount badge, the trust strip or the rating chip.
7. `npx tsc --noEmit`, `npx expo lint` and `npm test` pass.

---

## 15. Workstream I: Remove Service Areas

Covers change-list item 23. Gabfix has no branches or service areas: it goes to wherever the customer is. The area is threaded through sign-up, the first-run flow, Home, Profile, addresses, the booking location step, availability, the services catalogue, quotes and the admin app. This section removes it without breaking those flows.

### 15.0 Principle

**An area stops being a rule and becomes, at most, a label.** Nothing checks whether a place is "served", nothing asks the customer to pick from a list, and nothing is filtered or priced by area. What the customer provides is an **address**: a map pin or searched place, a street or landmark, a contact phone. A neighbourhood name (`locality`) is filled in automatically from the place search or the pin and shown as text only.

### 15.1 Where the area lives today (full inventory)

| Layer | Place | What it does today | Change |
|---|---|---|---|
| Config | `src/config/areas.ts` | List of areas with a `served` flag; "Coming soon" for unserved ones | **Delete** (last step) |
| Config | `src/config/location-fixtures.ts` | Place suggestions each carry `area`, "matching `config/areas.ts`" | Keep the data; rename the field to `locality`; remove the comment and any matching to areas |
| Route | `src/app/area-select.tsx` (385 lines) and its registration in `_layout.tsx` (line 96) | Modal area picker with a notify-me flow and a yellow `Blob` | **Delete** the file and the `Stack.Screen` |
| Store | `src/store/onboarding.ts` | `area`, `setArea`, `useOnboardingArea`, first-run flag | Remove the area parts; on hydrate, delete a stored `area` key. Keep the user name and first-run flags |
| Auth | `src/app/otp.tsx` (line 42) | First run goes to `/area-select` before Home | Go straight to `/home` (or the welcome step you already have) |
| Auth | `src/app/sign-up.tsx` | Required "Area / neighbourhood" field, `errors.area`, `areaId` in the sign-up call | Remove the field, the validation and the `areaId` property |
| Auth API | `src/lib/api/auth.ts` | Sends `areaId` | Remove it (contract note: the backend must not require it) |
| Home | `(tabs)/home.tsx` | Area chip in the hero | Replaced by the default-address chip (13.2) |
| Profile | `(tabs)/profile.tsx` (about line 224) | "Service area" row | **Remove** (already removed from the layout in 4.1) |
| Addresses | `addresses/[id].tsx` | Required "Service area" picker row, `areaError`, `setArea`, `allAreas` | Replace with an **optional "Neighbourhood" text field**, auto-filled; required fields are the street or landmark, or a map pin |
| Booking P10 | `book/[slug]/location.tsx` | Area row that opens the picker, `matchedArea` logic, "Choose an area to continue. We only serve the areas listed…", captions built from `areaName` | See 15.2 |
| Booking P9a | `book/[slug]/schedule.tsx`, `hooks/use-availability.ts`, `lib/api/availability.ts` | Availability is requested per `areaId` | Drop `areaId`; availability is per service (and cleaner) only |
| Catalogue | `hooks/use-services.ts`, `use-service-content.ts`, `use-service-search.ts`, `lib/api/discovery.ts`, `lib/api/service-content.ts` | `areaId` argument; `Service.areaImage` override | Drop the argument and `areaImage`; one catalogue for everyone (Section 14.2 already omits `areaImage`) |
| Quote | `quote/[slug].tsx` | Quote needs `areaName` (line 137); the success text says "pricing … for {areaName}" | Replace with a required **"Where is the job?"** text field (address or landmark) plus the optional pin; text says "for {locality or the street}" |
| Types | `lib/pricing.ts` (`BookingLocation.area`), `store/bookings.ts` (`area?`) | Stored with drafts and bookings | **Keep the stored key `area`** so saved drafts, bookings, receipts and the admin keep working (no migration); document it as "free-text neighbourhood" |
| Admin | `admin/src/types.ts` (`area` on bookings, customers; `serviceAreas` setting), `data.ts`, `pages/Bookings.tsx` (All areas filter and column), `pages/Settings.tsx` | Filter and settings by area | Rename the column "Location"; replace the area dropdown with the existing search box (it already searches `area`); delete the `serviceAreas` setting and its card |

### 15.2 Booking location step (P10) after the change

- **Required to continue:** a map pin **or** a street/landmark text (and the contact phone and name that are already required). Nothing about an area.
- **Ways to give the location (all exist today):** search a place (`use-place-search`), use my current location (`expo-location`, already installed), type the street or landmark, or pick a saved address.
- **Neighbourhood:** read-only caption under the address ("Kireka"), filled from the place or the pin, editable through a small text field that is hidden unless the customer taps "Edit neighbourhood". It is never required.
- **Removed copy:** the Area row, "Choose your area", "No area chosen yet", "Your cleaner is matched to this area" (replace with "Your cleaner will use this address and pin to find you"), and "We only serve the areas listed in the area picker".
- **Footer caption:** the street and neighbourhood when known, otherwise "Add your address".
- **Reachability:** because there is no list to check, a job in a place the team truly cannot reach is handled **after** booking: support contacts the customer and offers a full refund, and the admin cancels with the reason "Location not reachable". This is the policy default; confirm it, and whether a travel or call-out fee will ever apply (Q22). No distance pricing is built now.

### 15.3 Order of removal (so every commit builds)

1. Add `locality` helpers and make every consumer tolerate a missing `area` (no code requires it any more).
2. Remove the **gates**: sign-up validation, the P10 requirement, the address requirement, the quote requirement, the first-run redirect in `otp.tsx`.
3. Switch the **screens** to the new copy and fields (P10, address form, quote, Home chip, Profile).
4. Drop `areaId` and `areaImage` from hooks, API clients and the `Service` type.
5. Delete `area-select.tsx`, its `Stack.Screen`, `config/areas.ts` and the area parts of `store/onboarding.ts`.
6. Admin: types, filter, Settings.
7. Update docs: `Gabfix_UI_Progress.md` (mark **P3 Area select** as "Removed in Phase 9", note it in Deviations and the Decisions log), `Location_Fixtures.md` and the plan references, and Section 8 of this document (the page count loses P3).
8. **Prove it:** `rg -n "useOnboardingArea|setArea|allAreas|area-select|areaId|areaImage|config/areas|served"` over `src/` and `admin/src/` returns nothing (apart from the `area` storage key and the comments that explain it), and `npx tsc --noEmit` passes.

### 15.4 Data and migration

- Existing drafts, bookings, addresses and receipts keep their `area` string and show it as the neighbourhood. No migration.
- The stored onboarding `area` entry is deleted on hydrate.
- Customers who signed up with an area are not asked again; customers who signed up without one are never asked.
- The `rebook` snapshot keeps `location.area` unchanged.

### 15.5 Tests and acceptance (Workstream I)

1. A new customer can sign up, log in and reach Home without ever seeing an area picker or a "Coming soon" message.
2. Profile has no Service area row; Home shows the address chip.
3. P10 continues with only a pin or a street plus the contact details; no text mentions areas.
4. An existing booking, draft and saved address that carry an area still open and display it as a neighbourhood.
5. Quotes and availability work with no `areaId` in any request.
6. The search in 15.3 step 8 finds nothing; `npx tsc --noEmit`, `npx expo lint` and `npm test` pass; the admin builds with no area filter or setting.

---

## 16. Workstream J: Bookings, Help Center and Refer polish

Covers change-list items 17 to 22. The Help Center follows the ticket reference screenshot you attached (a "What do you need help with?" grid, a "Submit a request" form, "Recent tickets" and "Common questions"), in Gabfix colours, type and components only. The navy header, hamburger menu and KLONA branding are not carried over.

### 16.0 What the code does today

| Area | Today (from the code) | Consequence |
|---|---|---|
| Bookings tabs | `SegmentedControl` (`components/booking/segmented-control.tsx`): the active label is already `colors.green700` (`#1A5E2F`). The bottom tab bar's active label is `colors.green900` (`#1C411E`). | Green700 is the mid-deep green; green900 is the deepest in the palette and what the tab bar uses. See 16.1. |
| Cancel booking | `booking/[id].tsx` line 362 uses `variant="ghost"`, which paints the label and icon **green** (`ghost` colour is `green500`). `cancel-sheet.tsx` has "Cancel booking" in the title (line 132) and on its button (line 212). | Needs a red text variant. |
| Help Center (P22) | `help/index.tsx`: search, "Popular questions", **Browse by topic** (tiles that open FAQs by topic), then an inline `<ContactOptions />` block. There is no ticket system anywhere in the app. | Tiles become ticket categories; the FAQ topics move into the FAQ screen's chips (they already exist there); Contact becomes a button. |
| FAQ chips | `help/faq.tsx` uses `chip.pill` (height 32, **no `alignItems` or `justifyContent`**, no border width) overridden by `styles.filter` (height 34). Only `chip.base` centres its content. | The label sits at the top-left of the green pill instead of the centre: the misalignment on the selected chip. |
| Refer | `refer.tsx` shows four `ProgressRow`s with hard-coded values ("3", "2", "1" and the UGX reward). They are not tappable. | Rows become lists of the actual friends. |

### 16.1 Bookings: active tab label (item 18)

1. Add an optional prop `activeLabelColor?: string` to `SegmentedControl` (default stays `colors.green700` so other screens do not change).
2. In `(tabs)/bookings.tsx` pass `activeLabelColor={colors.green900}`, the same deep green the bottom tab bar uses for its active label. Semibold weight stays.
3. If you meant a different green (for example the darker end of the hero gradient, which is `green700`), say so and the value changes in one place (Q24). Today's code already uses `green700`, so this change is only visible if you wanted the deepest green.

### 16.2 Cancel booking in red (item 22)

1. Add a `dangerGhost` variant to `Button` (`ButtonVariant`): transparent background, label and icon in `colors.error` (`#D32F2F`), pressed state `colors.errorBg`. Not the existing filled `destructive`.
2. `booking/[id].tsx`: `variant="dangerGhost"` on **Cancel booking**.
3. `cancel-sheet.tsx`: the title text "Cancel booking" and the confirm button stay as they are visually (the button is the final destructive action and is already red if it uses `destructive`; check line 212). Any "Cancel booking" text link anywhere else (`rg "Cancel booking" src`) uses the same variant.
4. Contrast: `#D32F2F` on `colors.surface` passes 4.5:1; check on `errorBg`.

### 16.3 Help Center as a ticket centre (items 19 and 21)

**New order on `/help`:**

```
Title: "How can we help?"  + subtitle
Search the FAQs                                  (existing; results replace everything below)
What do you need help with?                      six category tiles (2 x 3)
Submit a request                                 form card (below)
Recent tickets                       View all    last 3 tickets, or "No support tickets yet"
Common questions                     See all     3 top FAQs (accordions, existing)
[ Contact us ]                                   button at the very bottom
```

**Category tiles (replace "Browse by topic"):** General, Booking, Payments, Account, Cleaner, App issue. One is always selected (General by default); the selected tile gets the existing selected card style (green border and tint). The selection sets the ticket's `category`. The old FAQ topics (Booking, Pricing, Add-ons, Payments, Cancellation, Safety) are still reachable from **See all** under Common questions and from the chips on `/help/faq`; `help-topics` data stays in `config/help.ts`.

**Submit a request card:**

| Element | Rule |
|---|---|
| Subject | Single line, placeholder "Briefly describe the issue". Error "Subject must be at least 4 characters." (shown after blur or on submit). Max 80 characters. |
| Booking code | Optional. A picker of the customer's recent bookings (code, service, date) plus typed entry. Pre-filled when the Help Center is opened from a booking (P15 has "Get help"). |
| Message | Multi-line, placeholder "Share the details…". Error "Message must be at least 10 characters." Max 1,000 characters with a counter near the limit. |
| Add screenshots | Dashed button, up to 3 images from the library (`expo-image-picker` is installed; use the media pipeline from 3.8 for resize and storage as files, D6). Thumbnails with a remove (X) button. Each image 5 MB or less after resize. |
| Note | "For urgent booking or payment issues, call support during business hours." with the **Call** and **WhatsApp** links from `support` (config). |
| **Submit ticket** | Primary button, loading state. Disabled until subject and message are valid. |
| After submit | The card is replaced by a confirmation: "Ticket GBT-48213 received. We reply within one business day." (hours and promise are Q3 and Q25), the ticket appears at the top of Recent tickets, an in-app notification is added, and the form resets. Failure keeps the form and shows an inline error. |

All of this respects the keyboard rule in 12.2 and the bottom-sheet rule in 11.5 (the booking picker is a sheet).

**Recent tickets:** up to three rows: category icon, subject, ticket code, status chip (Open, In progress, Resolved) and relative time. **View all** opens `/help/tickets` (P22a). Tapping a row opens `/help/tickets/[id]` (P22b): header with code, category and status; the original message and screenshots; a thread of replies (support replies appear in mock mode only if a mock reply is enabled, and a **Reply** box is shown only when the backend exists, D15); and a **Mark as resolved** action on open tickets.

**Data (`src/store/tickets.ts`, new, AsyncStorage `gabfix.tickets.v1`):**

```ts
export type TicketCategory = 'general' | 'booking' | 'payments' | 'account' | 'cleaner' | 'app';
export type TicketStatus = 'open' | 'in_progress' | 'resolved';

export type Ticket = {
  id: string;                 // 'GBT-' + 5 digits
  category: TicketCategory;
  subject: string;
  message: string;
  bookingId?: string;
  screenshots: { id: string; uri: string; bytes: number }[];   // files, not base64
  status: TicketStatus;
  createdAtISO: string;
  updatedAtISO: string;
  thread: { from: 'customer' | 'support'; text: string; atISO: string }[];
};
```

`createTicket(input)`, `useTickets()`, `useTicket(id)`, `markTicketResolved(id)`, `hydrateTickets()` (add to `_layout.tsx` hydration). `validateTicket(input)` is a pure function with the two length rules, tested. Backend later: `POST /support/tickets` (multipart for screenshots, same pre-signed pattern as 3.11), `GET /support/tickets`, `GET /support/tickets/{id}`, `POST /support/tickets/{id}/messages` (Open item added in Section 8).

**Contact us as a button (item 21):** delete `<ContactOptions />` from `help/index.tsx`. At the bottom of the screen add `<Button label="Contact us" variant="secondary" />` that opens `/help/contact`, built exactly like the **Read the FAQs** button at the bottom of the Contact page (`help/contact.tsx`, line 47). The Contact page keeps `ContactOptions` (call, WhatsApp, email, hours). The "Still need a hand?" card on `/help/faq` keeps its Contact support button.

### 16.4 FAQ chip alignment (item 20)

Cause: `chip.pill` has a fixed height and rounded corners but does not centre its content, so the label sits at the top-left of the green pill. Fix with one shared component:

```tsx
// src/components/ui/filter-chip.tsx (new)
const styles = StyleSheet.create({
  chip: {
    height: 36,
    paddingHorizontal: space[3],
    borderRadius: radius.pill,
    borderWidth: 1.5,                 // same width selected or not, so nothing shifts
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: { backgroundColor: colors.green500, borderColor: colors.green500 },
  label: { ...text.caption, fontFamily: font.bodySemi, color: colors.textMuted, includeFontPadding: false },
  labelSelected: { color: colors.surface },
});
```

- The horizontal `ScrollView` gets `style={{ flexGrow: 0 }}` and `contentContainerStyle={{ alignItems: 'center', gap: space[2] }}` so chips are never stretched.
- Use `FilterChip` for "All topics" and every topic on `/help/faq`, and replace the other `chip.pill` users (`rg "chip.pill" src`), including the Services tab chips and the new Transactions chips (11.4), so the same fix applies everywhere.
- Check at 130% text size: the label must stay centred and on one line (`numberOfLines={1}`).

### 16.5 Refer and Earn: tappable rows with the friends behind them (item 17)

**Behaviour:** each row in "Your referrals" is a button with a count and a chevron. Tapping opens a list page for that stage.

| Row | Opens | Lists |
|---|---|---|
| Friends invited | `/refer/invited` | Everyone invited |
| Joined Gabfix | `/refer/joined` | Friends who created an account |
| First booking done | `/refer/booked` | Friends who completed a first booking |
| Reward earned | `/refer/rewards` | One line per reward: friend, date, amount, and the total |

You asked for the Friends invited row and "the other two"; the section has four rows, so all four open a list. Q23 asks whether Reward earned should stay a plain row.

**List page (P26a, `src/app/refer/[stage].tsx`, new; `refer.tsx` stays and the two coexist like `booking/[id].tsx` and `booking/[id]/rate.tsx`):** `TopBar` with the stage title and count, then friend rows: initials circle, first name, masked phone ("0772 ••• 456"), a status chip (Invited, Joined, First booking done), the date of the last step and, for rewards, the amount. Empty state: "No friends here yet" with an **Invite a friend** button that opens the share sheet. Pull-to-refresh is a no-op until the API exists. Privacy: only a first name and a masked number are shown, never a full phone number.

**Data:** `src/lib/referral.ts` gets `Referral { id, firstName, maskedPhone, invitedAtISO, joinedAtISO?, bookedAtISO?, rewardUgx? }` and pure helpers `stageCounts(list)` and `forStage(list, stage)`. The counts on the four rows are **computed from the list**, never typed in, so a row and its list always agree. A small store (`src/store/referrals.ts`) holds the list; in mock mode (`mock.referrals`, in `config/mock.ts`) it is seeded with three dummy friends matching today's "3, 2, 1" and one UGX 10,000 reward; otherwise it is empty and the rows show 0. A real referral list arrives with the backend (D15).

### 16.6 Per-file checklist (Workstream J)

| File | Change |
|---|---|
| `components/booking/segmented-control.tsx`, `(tabs)/bookings.tsx` | `activeLabelColor`; Bookings passes green900 |
| `components/ui/button.tsx`, `booking/[id].tsx`, `cancel-sheet.tsx` | `dangerGhost` variant and use |
| `app/help/index.tsx` | New order, category tiles, ticket form, recent tickets, Contact us button; remove `ContactOptions` |
| `app/help/tickets.tsx`, `app/help/tickets/[id].tsx` (new, P22a and P22b), `_layout.tsx` | Ticket list and detail, routes |
| `store/tickets.ts`, `lib/__tests__/tickets.test.ts` (new) | Store and validation tests |
| `config/help.ts` | `ticketCategories` (id, label, icon); FAQ topics unchanged |
| `components/ui/filter-chip.tsx` (new), `app/help/faq.tsx`, `(tabs)/services.tsx`, `profile/payments.tsx` | Chip alignment |
| `app/refer.tsx`, `app/refer/[stage].tsx` (new, P26a), `lib/referral.ts`, `store/referrals.ts` (new), `config/mock.ts` | Referral lists |

### 16.7 Acceptance criteria (Workstream J)

1. The active label in Bookings is `green900`; other segmented controls are unchanged.
2. Cancel booking on the order details is red, with a red icon, and its pressed state is visible.
3. `/help` shows the six category tiles, the Submit a request form with the two validation messages, Recent tickets, Common questions and a **Contact us** button at the bottom that opens the Contact page; no contact block is inline.
4. Submitting a valid ticket creates `GBT-xxxxx`, shows the confirmation, lists it under Recent tickets and View all, and survives an app restart; screenshots are stored as files.
5. Every FAQ chip, selected or not, has its label centred in its pill, at 100% and 130% text size.
6. Each Refer row opens its list; counts equal list lengths; no full phone number is displayed.
7. `npx tsc --noEmit`, `npx expo lint` and `npm test` pass.
