# Gabfix App UI: Design Layout Guidelines (Part 1)

**Product:** Gabfix, on-demand cleaning services app
**Market:** Uganda, primarily Kampala (Kampala Central, Nakawa, Makindye, Kawempe, Rubaga, plus Entebbe Road and Wakiso corridors)
**Platforms:** Mobile app built with **React Native + Expo** (iOS and Android), plus a responsive web admin dashboard
**Version:** 1.3 | **Status:** Draft for design kickoff

---

## 0. Notes on Sources

| Source | Status |
|---|---|
| Gabfix logo (`Gabfix_Logo.png`) | Analysed. Colours were sampled directly from the file. |
| Dribbble multi-screen board (Get Started, Dashboard, Service Booking and more) | The link returns an image I could not open. This document uses the page list you described and common patterns for this type of board. |
| Dribbble "Login Page UI Design" (shot 24798919) | The page is JavaScript-rendered and returned no readable content. The Login layout below follows a standard modern pattern. |
| ServiceMarket Dubai (home page, Home Cleaning page, booking step 1) | Studied. Findings are in Section 11, and the order flow in Section 15. |
| Part 2 (`Gabfix_App_Ui_2.md`) | Page-by-page build specs with style values, behaviours and payment model. |
| Order-specification images | **Not received** with the latest message. Section 15 is derived from the ServiceMarket flow and needs reconciling once the images are re-uploaded. |
| Upright multi-screen board (second link) | Same as above. I have applied its stated principle: **all screens are portrait and upright, aligned in one row**. |

**Next step:** once you export the reference screens as PNGs (or describe their layout), I will run a diff pass on Section 6 and adjust spacing, card styles and illustrations to match.

---

## 1. Brand Foundation

### 1.1 Logo Analysis

The logo is a **circular badge** with these parts:

- **Outer ring:** bright yellow, with a bevel or embossed finish.
- **Field:** rich green.
- **Symbol:** a house outline split by a crossed **wrench and screwdriver**, all in yellow. It signals *home + care + service*.
- **Style:** flat symbol with a soft embossed edge. The overall feel is trustworthy, solid and local.

### 1.2 Brand Personality

| Trait | Expression in UI |
|---|---|
| Trustworthy | Generous whitespace, clear pricing, verified badges |
| Fresh and clean | Light surfaces, green accents, crisp icons |
| Energetic and friendly | Yellow used for action and highlights |
| Local and familiar | UGX currency, Mobile Money, Kampala neighbourhood names, simple English with Luganda greetings as an optional touch |

---

## 2. Colour System

### 2.1 Core Palette (sampled from the logo)

| Role | Name | HEX | Source in logo |
|---|---|---|---|
| **Primary** | Gabfix Green | `#118E45` | Badge field (main) |
| **Primary Dark** | Forest | `#1A5E2F` | Lower field shading |
| **Primary Deepest** | Night Green | `#1C411E` | Shadows and embossed edges |
| **Accent** | Gabfix Yellow | `#F7EB15` | Symbol and ring highlight |
| **Accent Gold** | Warm Gold | `#E7BE1F` | Symbol shading |
| **Accent Light** | Soft Yellow | `#F5EE5E` | Ring highlight |

### 2.2 Proportion: the 60 / 30 / 10 Rule

Matching the logo's balance of **green field to yellow symbol**:

```
60%  Neutral + Green surfaces   (backgrounds, headers, hero areas, nav)
30%  Yellow                     (CTAs, highlights, icons, active states)
10%  Deep greens + status       (text emphasis, borders, alerts)
```

- **Green** is the base identity (headers, hero cards, bottom nav, onboarding backgrounds).
- **Yellow** is the action colour (primary buttons on green, selected chips, ratings, progress).
- **Never place yellow text on white.** Contrast is too low (see 2.5).

### 2.3 Extended Tokens

**Green scale**

| Token | HEX | Use |
|---|---|---|
| `green-50` | `#E8F6EE` | Subtle backgrounds, selected rows |
| `green-100` | `#C5E8D3` | Chips, tags |
| `green-300` | `#5BBF86` | Illustrations, secondary icons |
| `green-500` | `#118E45` | **Primary** |
| `green-700` | `#1A5E2F` | Pressed state, headers on dark |
| `green-900` | `#1C411E` | Dark text on yellow, dark mode base |

**Yellow scale**

| Token | HEX | Use |
|---|---|---|
| `yellow-50` | `#FFFCE0` | Promo banners, highlight backgrounds |
| `yellow-200` | `#F5EE5E` | Hover and soft fills |
| `yellow-500` | `#F7EB15` | **Accent / CTA on green** |
| `yellow-600` | `#E7BE1F` | CTA pressed, rating stars |
| `yellow-800` | `#8A6D00` | Yellow-family text on light backgrounds |

**Neutrals**

| Token | HEX | Use |
|---|---|---|
| `white` | `#FFFFFF` | Cards, inputs |
| `bg` | `#F6F8F6` | App background (faint green tint) |
| `border` | `#DDE5DF` | Dividers, input borders |
| `text-muted` | `#5F6F65` | Secondary text |
| `text` | `#16221A` | Primary text |

**Status colours** (kept distinct from brand)

| State | HEX | Background |
|---|---|---|
| Success | `#118E45` | `#E8F6EE` |
| Warning | `#E7A500` | `#FFF4D6` |
| Error | `#D32F2F` | `#FDECEC` |
| Info | `#1976D2` | `#E8F1FB` |

### 2.4 Gradients (use sparingly)

- **Hero gradient:** `linear-gradient(160deg, #118E45 0%, #1A5E2F 100%)`
- **Gold shine (badges and premium):** `linear-gradient(135deg, #F7EB15, #E7BE1F)`
- Mimic the logo's **embossed look** only on the logo, rating badges and the "Premium" plan. Keep everything else flat.

### 2.5 Contrast Rules (WCAG AA)

| Combination | Allowed? |
|---|---|
| White text on `#118E45` | ✅ about 4.6:1 (large and bold text, or buttons) |
| White text on `#1A5E2F` | ✅ about 8:1 (body text) |
| `#1C411E` text on `#F7EB15` | ✅ about 11:1 (**primary button style**) |
| `#16221A` text on white | ✅ |
| Yellow text on white | ❌ Never |
| Green `#118E45` text on white | ✅ for 16px bold or larger and links |

---

## 3. Typography

**Recommended pair** (free, Google Fonts, readable on low-end Android devices):

| Use | Font | Fallback |
|---|---|---|
| Headings | **Poppins** (600 / 700) | `system-ui, sans-serif` |
| Body and UI | **Inter** (400 / 500 / 600) | `system-ui, sans-serif` |
| Numbers and prices | Inter, **tabular figures** on | |

### 3.1 Type Scale (mobile)

| Style | Size / Line | Weight | Use |
|---|---|---|---|
| Display | 32 / 40 | 700 | Get Started headline |
| H1 | 26 / 34 | 700 | Screen titles |
| H2 | 20 / 28 | 600 | Section headers |
| H3 | 17 / 24 | 600 | Card titles |
| Body L | 16 / 24 | 400 | Main reading text |
| Body | 14 / 20 | 400 | Default |
| Caption | 12 / 16 | 500 | Meta, timestamps |
| Button | 16 / 20 | 600 | CTAs |
| Price | 20 / 24 | 700 | UGX amounts |

**Rules**

- Minimum body size is **14px**. Avoid 12px for anything needed for a decision.
- Currency format: `UGX 45,000` (with a thousands separator, no decimals).
- Sentence case for buttons and labels. Avoid ALL CAPS except tiny tags.

---

## 4. Layout Foundation

### 4.1 Screen Frames

| Platform | Frame | Grid |
|---|---|---|
| **Mobile (primary design size)** | **390 × 844** (iPhone 14 / modern Android) | 4 columns, 16px margins, 16px gutters |
| Small mobile (test) | 360 × 640 | Same grid |
| Tablet | 768 × 1024 | 8 columns, 24px margins |
| Desktop dashboard | 1440 × 900 | 12 columns, 32px margins, 24px gutters |

### 4.2 The Upright Multi-Screen Board

Per the reference board, all screens are **portrait and upright**, aligned in a single row on the presentation canvas.

```
Canvas: 4000 px wide
Frame:  390 × 844, corner radius 40 (device mockup)
Gap between frames: 80 px
Alignment: top edges aligned; all frames centred on one baseline
Flow order (left to right): Get Started → Sign Up → Login → Home → ...
Under each frame: screen title (H3) + one-line purpose (Caption)
Canvas background: #F6F8F6 or a Night Green #1C411E for dark presentation
```

### 4.3 Spacing Scale (8-pt system)

`4 · 8 · 12 · 16 · 24 · 32 · 40 · 48 · 64`

| Context | Value |
|---|---|
| Screen side padding | 16 (24 on Get Started and Login) |
| Between sections | 24 |
| Card inner padding | 16 |
| Between related items | 8 to 12 |
| Safe areas | Respect top status bar (44–54) and bottom home indicator (34) |

### 4.4 Radius, Elevation, Borders

| Element | Radius |
|---|---|
| Buttons | 14 |
| Inputs | 12 |
| Cards | 20 |
| Chips and tags | 999 (pill) |
| Bottom sheets | 28 (top corners) |
| Avatars | 999 |

**Elevation**

- **Card:** `0 4px 16px rgba(26, 94, 47, 0.08)` (green-tinted shadow, never grey-black)
- **Floating (bottom nav, sheets):** `0 -4px 24px rgba(28, 65, 30, 0.12)`
- Borders: 1px `#DDE5DF` when shadow is not used.

### 4.5 Iconography

- Style: **rounded outline, 2px stroke, 24px grid** (Lucide or Phosphor "regular").
- Active icons are filled and tinted green. Selected icons sit on a yellow pill where emphasis is needed.
- Service icons (illustrated, 48–64px): use green outlines with yellow fills. This echoes the logo's tool-and-house language (house, spray bottle, broom, mop, sofa, window, sparkle).

---

## 5. Core Components

### 5.1 Buttons

| Type | Fill | Text | When |
|---|---|---|---|
| **Primary (on light)** | `#118E45` | White | Main action on white screens |
| **Primary (on green)** | `#F7EB15` | `#1C411E` | Main action on green hero screens |
| Secondary | White, 1.5px `#118E45` border | `#118E45` | Alternative actions |
| Tertiary / text | None | `#118E45` | Skip, Forgot password |
| Destructive | `#D32F2F` | White | Cancel booking |
| Disabled | `#E3E8E4` | `#9AA79F` | |

Size: height **52**, full width on mobile, 16px label. Pressed state darkens one step. Loading state shows an inline spinner and keeps the label width.

### 5.2 Inputs

- Height 52, radius 12, 1.5px border `#DDE5DF`, white fill.
- Focus: border `#118E45` plus 3px ring `rgba(17,142,69,0.18)`.
- Error: red border plus helper text below, with an icon (not colour alone).
- Label sits above the field (14 / 500). Placeholder is `#9AA79F`.
- **Phone field:** `+256` prefix chip with a flag, then 9 digits (for example `7XX XXX XXX`). Support MTN, Airtel and other local prefixes.

### 5.3 Cards

- **Service card:** icon or illustration, title, "From UGX …", rating, duration.
- **Booking card:** status chip, service, date and time, address, cleaner avatar, action row.
- **Stat card (dashboard):** label, big number, trend chip (↑ green / ↓ red).

### 5.4 Chips and Tags

- Selected: `green-500` fill with white text, or yellow fill with `#1C411E` text for filters.
- Unselected: white fill, border, muted text.
- Status chips: **Pending** (warning), **Confirmed** (info), **In progress** (yellow), **Completed** (success), **Cancelled** (error).

### 5.5 Navigation

**Bottom tab bar (mobile)**: 5 tabs, height 72 plus safe area, white with a floating shadow.

| Tab | Icon |
|---|---|
| Home | house |
| Services | sparkles |
| Bookings | calendar |
| Messages | chat |
| Profile | user |

Active tab: green icon and label, with a small yellow dot or pill behind the icon.

**Top app bar:** 56 high, with a back arrow on the left, a centred title and an optional action on the right.

### 5.6 Feedback

- **Toast:** top, 12px radius, auto-dismiss in 3s.
- **Bottom sheet:** for filters, date and time, and payment method.
- **Skeleton loaders** instead of spinners for lists (helps perceived speed on slower networks).

---

## 6. Screen Specifications

Each screen is designed at **390 × 844, portrait**.

### 6.1 Get Started (Onboarding)

**Purpose:** Introduce Gabfix and push to Sign Up or Login.

**Layout (top to bottom)**

1. **Hero area (about 58% of height):** green gradient background. A large clean-home illustration or photo (Kampala-style home, cleaner in uniform), masked into a rounded bottom curve (radius 40). Logo badge at the top left (40px).
2. **Page indicator:** 3 dots (active is a yellow pill, 24 × 6).
3. **Headline (Display, white or dark depending on surface):** "A spotless home, booked in minutes."
4. **Sub-copy (Body L, muted):** "Trusted, vetted cleaners across Kampala. Pay with Mobile Money."
5. **Primary CTA:** "Get started" (full width, yellow on green).
6. **Secondary:** "I already have an account. **Log in**".

**Variations:** 3 swipeable slides: *Book easily*, *Verified cleaners*, *Pay with MTN / Airtel Money*.

### 6.2 Login

**Purpose:** Fast, clear sign-in. (Adapted from the "Login Page UI Design" reference.)

**Layout**

1. **Top area (about 28%):** green header with the logo badge centred (64px) and a curved bottom edge. The app name "Gabfix" sits below it in white.
2. **Form card:** overlaps the header by 40px, white, radius 28 at the top, 24px padding.
   - H1: "Welcome back"
   - Caption: "Log in to manage your bookings"
   - **Phone number or Email** input
   - **Password** input with a show/hide eye
   - Row: "Remember me" checkbox | "Forgot password?" (text link)
   - **Primary button:** "Log in"
   - Divider: "or continue with"
   - Social buttons (outlined): **Google**, **Apple** (iOS only), and **WhatsApp** (optional)
3. **Footer:** "New to Gabfix? **Create account**"

**Behaviour:** OTP login option ("Log in with a code via SMS") is highly recommended for Uganda.

### 6.3 Sign Up

Same shell as Login. Fields: Full name, Phone (+256), Email (optional), Password, **Area / neighbourhood** (dropdown of Kampala divisions), consent checkbox (Terms and Privacy). Button: "Create account".

### 6.4 OTP Verification

- Back arrow, H1 "Verify your number", caption with the masked number (`+256 7•• ••• 482`).
- 6 boxes (48 × 56, radius 12), auto-advance, auto-read SMS where permitted.
- "Resend code in 0:30" timer. Primary button "Verify".

### 6.5 Forgot / Reset Password

Header, email or phone field, "Send reset link or code" button, then a confirmation state using a green check illustration.

### 6.6 Home Dashboard (Customer)

**Purpose:** Overview and quick booking.

**Layout (scrollable)**

1. **Header (green, rounded bottom 28):** greeting "Hello, Aisha 👋", location pill "📍 Ntinda, Kampala", notification bell with badge, avatar.
2. **Search bar** (white, overlapping the header): "What needs cleaning today?"
3. **Promo banner:** yellow gradient card ("First clean 15% off"), with a CTA chip.
4. **Quick services (horizontal grid, 4 × 2):** House cleaning, Deep clean, Office, Laundry, Sofa and carpet, Windows, Post-construction, Fumigation.
5. **Upcoming booking card:** status chip, date and time, cleaner, "Track" and "Reschedule".
6. **Popular services (horizontal carousel):** service cards with price, rating and duration.
7. **Top-rated cleaners:** avatar, rating, jobs completed, "Verified" badge.
8. **Bottom tab bar.**

### 6.7 Service Booking (Multi-step Flow)

> **Updated in v1.1:** the full order flow (job details, add-ons, schedule, location, review and pay, Mobile Money authorisation) is specified in **Section 15**. The summary below is kept for context only.

A **4-step flow** with a stepper at the top (green progress bar over a grey track).

| Step | Content |
|---|---|
| **1. Service** | Service type, size or rooms (stepper controls: bedrooms, bathrooms), add-ons (checkbox cards, +UGX) |
| **2. Date and time** | Horizontal date strip, time-slot chips (8:00, 10:00, 12:00, 14:00…), recurring option (once, weekly, monthly) |
| **3. Location** | Map pin plus address field, area and landmark note ("near Shell, Ntinda"), access instructions |
| **4. Review and pay** | Summary card, promo code field, **payment method list**, total |

**Sticky footer** on every step: price summary on the left (`UGX 85,000`) and a primary button on the right ("Continue", then "Confirm booking").

**Payment:** MTN Mobile Money, Airtel Money, Visa card and **Cash** (cash only after the service, paid to the cleaner). Customers can **pay in full now, pay a deposit now (balance after the service), or pay after the service** (see Part 2, Section 3).

**Confirmation screen:** large green check animation, booking ID (for example `GBX-20481`), "View booking" and "Back to home".

### 6.8 Services Catalogue

Search plus filter chips (All, Home, Office, Specialised). Two-column grid of service cards. A filter bottom sheet covers price, rating and availability.

### 6.9 Service Detail

> **Updated in v1.1:** superseded by the full Service Landing Page spec in **Section 14.5**.

Image header (240), title, rating, "What's included" checklist, "What we need from you", pricing table (by size), FAQs accordion and a sticky "Book now" bar.

### 6.10 My Bookings

Tabs: **Upcoming | Completed | Cancelled**. List of booking cards. Empty state: friendly illustration and "Book your first clean".

### 6.11 Booking Details and Live Tracking

Status timeline (Confirmed, Cleaner on the way, In progress, Completed), a map with the cleaner's ETA, cleaner card with **Call** and **Chat** buttons, an invoice summary, and a "Need help?" link.

### 6.12 Cleaner Profile

Cover photo, avatar, name, verified badge (gold style), rating, jobs done, languages (English, Luganda, Swahili), skills chips, reviews list and a "Book this cleaner" CTA.

### 6.13 Payments and Wallet

Balance card (green gradient), saved payment methods, transaction list (UGX with +/− colouring), receipts download.

### 6.14 Messages / Support

Chat list, then a chat thread (green sent bubbles with white text, white received bubbles). Quick-reply chips and a "WhatsApp us" shortcut.

### 6.15 Notifications

Grouped by Today / Earlier, with icon, title, time and an unread dot (yellow).

### 6.16 Profile and Settings

Avatar header, saved addresses, payment methods, language, notifications, help centre, refer-and-earn card (yellow), log out.

### 6.17 Rate and Review (post-service)

Large 5-star selector (gold), tag chips ("On time", "Thorough", "Friendly"), comment box, optional photo, "Tip your cleaner" with Mobile Money amounts.

### 6.18 Admin / Operations Dashboard (Web, 1440 × 900)

Extends the same system for the business side.

- **Left sidebar (240px, Night Green `#1C411E`):** logo, nav (Overview, Bookings, Customers, Cleaners, Services, Payments, Reports, Settings). Active item has a yellow left bar and a tinted background.
- **Top bar:** search, date range, notifications, admin avatar.
- **KPI row (4 cards):** Revenue (UGX), Bookings today, Active cleaners, Average rating.
- **Main:** revenue line chart (green line, yellow highlight point), a bookings-by-area bar chart (Kampala divisions) and a live bookings table with status chips.
- **Right rail:** unassigned jobs with a "Assign cleaner" action.

---

## 7. Interaction and Motion

| Interaction | Spec |
|---|---|
| Screen transition | Slide 250ms, ease-out |
| Button press | Scale 0.98, 100ms |
| Bottom sheet | Spring up, 300ms, with a dimmed scrim at 40% |
| Success check | Draw-on animation, 600ms |
| Skeleton shimmer | 1.2s loop |
| Reduced motion | Respect the system setting, fade only |

---

## 8. Uganda-Specific Considerations

1. **Mobile Money first.** MTN MoMo and Airtel Money are shown above the card option.
2. **Low data and low-end devices.** Compress images (WebP), use skeletons, and keep key flows usable offline-first (draft bookings are saved).
3. **Addresses.** Landmark-based directions are common, so provide a free-text "Landmark / directions" field plus the map pin. Support sharing a live location.
4. **Phone-centred identity.** Phone-number sign-in with SMS OTP, WhatsApp support link.
5. **Currency and format.** `UGX 1,250,000`. Dates as `Tue, 17 Nov 2026`. 12-hour times with am and pm. Time zone EAT (UTC+3).
6. **Language.** English by default, with the structure ready for Luganda and Swahili strings (allow roughly 30% text expansion in buttons and chips).
7. **Trust signals.** Verified IDs, background-checked cleaners, insurance mention, visible customer support contact.
8. **Photography.** Use authentic local imagery (Ugandan homes, offices, diverse cleaners). Avoid stock imagery that does not reflect the market.

---

## 9. Accessibility Checklist

- [ ] Contrast meets WCAG AA (Section 2.5).
- [ ] Touch targets are at least 48 × 48.
- [ ] Never rely on colour alone (status chips include text and an icon).
- [ ] Dynamic type: layouts survive 130% text size.
- [ ] Every icon-only button has an accessible label.
- [ ] Form errors are announced and tied to the field.
- [ ] Focus order is logical on web and desktop.

---

## 10. Dark Mode (Optional, Phase 2)

| Token | Light | Dark |
|---|---|---|
| Background | `#F6F8F6` | `#0F1A12` |
| Surface (cards) | `#FFFFFF` | `#17261B` |
| Primary | `#118E45` | `#2FBF71` |
| Accent | `#F7EB15` | `#F7EB15` |
| Text | `#16221A` | `#EAF2EC` |

The yellow stays the same. It is the strongest brand cue and reads well on dark green.

---

## 11. Marketplace Study: ServiceMarket (Dubai)

Studied: the Dubai home page, the Home Cleaning service page and the first step of its online booking flow (`/book-online/job-details`). ServiceMarket is a web-first marketplace with a companion app, so the findings below are translated into **mobile-native patterns** for Gabfix.

### 11.1 What ServiceMarket Does

| Area | Observed pattern | Why it works |
|---|---|---|
| **Location gate** | A city selector (Dubai, Abu Dhabi, Sharjah) sits in the hero and in the footer. | Prices and availability depend on location. |
| **Hero** | One reassuring line ("Sit back, we'll take it from here"), a one-line value statement ("25+ services from trusted companies"), a **new-customer promo stamp** and a trust strip. | Gives a clear promise and an immediate reason to act. |
| **Trust strip** | Customer count, review count, rating (4.8 / 5), trusted professionals, live support. | Reduces anxiety before a first booking. |
| **Discovery** | "Most popular services" first, then **category rows** (Moving, Cleaning, Maintenance, AC, Pest control and more), each a horizontal carousel. | Shows a wide catalogue without a deep menu. |
| **Service landing page** | Hero with a **Book now** button, a short intro, related services, verified reviews, an FAQ accordion, "How it works" (3 steps), blog, app download banner. | One page answers every pre-booking question. |
| **Order flow** | 4 steps: **(1) job details → (2) date and time → (3) location and contact → (4) confirm.** Add-ons appear when the customer taps **Next** on step 1. | Short, linear and never asks for the address before the price is clear. |
| **Job details inputs** | Cleaners (1–4), hours (2–8, with **4 marked "Popular"**), frequency (Once / Weekly with 10% off / Multiple times a week with 15% off), materials (Yes or No, plus a per-hour charge), special instructions. | Every choice changes the price visibly, and the default is the common case. |
| **Summary panel** | Persistent: cleaners, hours, materials, date and time, discount (**Apply promo**), **Total to pay**. | The customer always sees the running total. |
| **Pay later** | Payment is taken **after** the service (card or cash). | Lowers the barrier to the first booking. |
| **Policies** | Free change or cancel up to 24 hours before. Recurring plans keep the **same cleaner**. Add-ons add 30 minutes each. Changing add-ons goes through support. | Clear rules shown *before* commitment. |
| **After booking** | Email and reminders, "track and manage in the app", **rebook the same cleaner in one tap**. | Builds repeat business. |
| **Reviews** | Initials avatar, first name plus initial, star row, short comment, date. | Quick to scan, feels real. |
| **Support** | Contact centre open 7 days, with WhatsApp, chat and phone entry points. | Support is always one tap away. |

### 11.2 What Gabfix Adopts, Adapts and Avoids

| | Decision |
|---|---|
| ✅ **Adopt** | The 4-stage order stepper, the persistent summary, "Popular" defaults, frequency discounts, the same-cleaner promise, the pay-after-service option, the FAQ accordion, the trust strip, rebooking in one tap. |
| 🔄 **Adapt** | City selector becomes **area selector** (Kampala divisions plus Wakiso and Entebbe). Card and Apple Pay become **MTN MoMo, Airtel Money, Visa and Cash (after service)**. The side summary becomes a **collapsible bottom summary bar**. Carousels become **vertically stacked category sections** with horizontal rows. The "20% off first booking" banner becomes an in-app welcome offer. |
| 🚫 **Avoid** | Too many categories at launch (Gabfix is a cleaning company: keep the catalogue to cleaning and closely related services). Requiring support to change add-ons (let the customer do it in-app). Long text blocks (use accordions). |

### 11.3 Catalogue Scope for Gabfix (Phase 1)

```
Home cleaning        : Regular clean · Deep clean · Move-in / Move-out · Post-construction
Upholstery & fabric  : Sofa · Carpet · Mattress · Curtain
Specialised          : Window cleaning · Water tank cleaning · Fumigation / pest control
Commercial           : Office cleaning · Shop / restaurant · Schools & clinics (quote)
Laundry              : Wash, dry and fold · Ironing
Recurring plans      : Weekly · Several times a week · Monthly
```

Phase 2 can add handyman, gardening and car wash, as the logo's wrench-and-screwdriver mark suggests.

---

## 12. React Native + Expo Implementation Guidelines

The app is built with **Expo (React Native) for Android and iOS**. Every rule in this document must be implementable with the stack below.

### 12.1 Recommended Stack

| Concern | Choice |
|---|---|
| Framework | Expo SDK (current stable), TypeScript, **Expo Router** (file-based navigation) |
| Navigation | Bottom tabs plus a native stack. Modals and sheets presented from the stack. |
| Styling | `StyleSheet` with a typed `theme.ts` (Section 12.3). NativeWind is acceptable if the team prefers utility classes, but tokens must stay identical. |
| Fonts | `@expo-google-fonts/poppins` and `@expo-google-fonts/inter`, loaded with `expo-font` and the splash screen held until ready |
| Lists | `FlashList` for long lists (bookings, cleaners, reviews) |
| Bottom sheets | `@gorhom/bottom-sheet` (needs Reanimated and Gesture Handler) |
| Animation | `react-native-reanimated` |
| Forms | `react-hook-form` plus `zod` validation |
| Server state | TanStack Query (caching, retry, offline-friendly) |
| Local state | `zustand` for the **booking draft** (persisted so a half-finished order survives a restart) |
| Images | `expo-image` (caching, blurhash placeholders) |
| Maps and location | `react-native-maps` plus `expo-location` |
| Push | `expo-notifications` |
| Secure storage | `expo-secure-store` for tokens |
| Haptics | `expo-haptics` on selection, success and error |
| Localisation | `expo-localization` plus `i18n-js`, with locale `en-UG`, structure ready for Luganda and Swahili |
| Payments | Mobile Money through a regional payment aggregator (for example Pesapal or Flutterwave; confirm with Gabfix finance), plus Visa card (hosted page, tokens only), plus Cash collected by the cleaner after the service |

### 12.2 Units, Frames and Platform Rules

- **All numbers in this guide are density-independent points (dp)**, which is what React Native uses. The 390 × 844 design frame is a reference and screens must flex between **360 and 430 dp wide**.
- **Never hard-code widths.** Use `flex`, percentages and `maxWidth`. Hard-code only heights of fixed controls (buttons 52, inputs 52, tab bar 64 plus inset).
- Use `react-native-safe-area-context` for the status bar, notch and home-indicator insets on every screen.
- **Touch target:** at least 48 × 48 dp (`hitSlop` for small icons).

| Topic | iOS | Android |
|---|---|---|
| Shadows | `shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius` | `elevation` (map the card shadow to 3, floating to 8) |
| Back navigation | Swipe from the left edge | System back button or gesture: **every screen must handle it**, and the booking flow must ask before discarding a draft |
| Keyboard | `KeyboardAvoidingView` with `behavior="padding"` | `softwareKeyboardLayoutMode: "resize"` in `app.json`, plus a scroll-into-view on focus |
| Date and time | Inline spinner in a bottom sheet | Use the custom date strip and slot chips (Section 14.6) on **both** platforms so the UI is identical |
| Status bar | Light content over green headers | Same, and set the navigation bar colour to match the surface |
| Fonts | Poppins and Inter bundled (do not rely on SF) | Same (do not rely on Roboto) |
| Haptics | Light impact on chip select, success notification on confirm | Same through `expo-haptics` |

### 12.3 Theme Tokens (TypeScript starter)

```ts
// theme.ts
export const colors = {
  green500: '#118E45', green700: '#1A5E2F', green900: '#1C411E',
  green50: '#E8F6EE', green100: '#C5E8D3',
  yellow500: '#F7EB15', yellow600: '#E7BE1F', yellow200: '#F5EE5E', yellow50: '#FFFCE0',
  bg: '#F6F8F6', surface: '#FFFFFF', border: '#DDE5DF',
  text: '#16221A', textMuted: '#5F6F65',
  success: '#118E45', warning: '#E7A500', error: '#D32F2F', info: '#1976D2',
};
export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 6: 24, 8: 32, 10: 40, 12: 48 };
export const radius = { input: 12, button: 14, card: 20, sheet: 28, pill: 999 };
export const font = {
  heading: 'Poppins_700Bold', headingSemi: 'Poppins_600SemiBold',
  body: 'Inter_400Regular', bodyMedium: 'Inter_500Medium', bodySemi: 'Inter_600SemiBold',
};
```

### 12.4 Suggested Folder Structure

```
app/
  (auth)/        get-started, login, sign-up, otp, forgot-password
  (tabs)/        index (Home), services, bookings, messages, profile
  service/[slug] service landing page
  book/[slug]/   details, add-ons, schedule, location, review, confirmed
  booking/[id]   details, tracking, reschedule, cancel, receipt
  cleaner/[id]   profile
  help/          index, faq, contact, policies
components/
  ui/            Button, Input, Chip, Card, Sheet, Toast, Skeleton
  booking/       CounterStepper, HourChips, FrequencyCard, AddOnCard,
                 DateStrip, SlotChips, AddressCard, SummaryBar, PriceRow
  home/          TrustStrip, PromoBanner, CategoryRow, ServiceCard
theme.ts
store/booking.ts  (zustand draft, persisted)
```

---

## 13. Information Architecture and Navigation

### 13.1 Navigation Map

```
Get Started ──► Sign Up / Login ──► OTP ──► Area selector (first run only)
                                              │
                                              ▼
 ┌──────────────────────── Bottom Tabs ────────────────────────┐
 │ Home │ Services │ Bookings │ Messages │ Profile               │
 └──────────────────────────────────────────────────────────────┘
   │        │           │          │          │
   │        │           │          │          ├─ Saved addresses · Payment methods
   │        │           │          │          ├─ Refer and earn · Offers
   │        │           │          │          ├─ Help centre · Policies · Language
   │        │           │          │          └─ Log out
   │        │           │          └─ Chat with support / cleaner
   │        │           ├─ Booking details ─► Track · Reschedule · Cancel · Receipt · Rate
   │        │           └─ Recurring plans ─► Pause · Skip · Resume
   │        └─ Category ─► Service landing ─► Order flow (stack, no tab bar)
   └─ Search · Promo banner · Popular · Rebook · Notifications
```

**Rules**

- The **tab bar is hidden** inside the order flow, tracking and chat threads (full-screen focus).
- Order flow is a **modal stack** with a close (✕) button at top right and a back arrow at top left.
- Deep links: `gabfix://service/{slug}`, `gabfix://booking/{id}`, `gabfix://offers/{code}`. Push notifications must open the right booking.

### 13.2 Complete Page Inventory

| # | Page | Section | Status |
|---|---|---|---|
| 1 | Get Started (3 slides) | 6.1 | Existing |
| 2 | Login, Sign Up, OTP, Reset password | 6.2–6.5 | Existing |
| 3 | Area selector | 14.1 | **New** |
| 4 | Home dashboard | 6.6 (updated in 14.2) | Updated |
| 5 | Search and results | 14.3 | **New** |
| 6 | Services (category browse) | 14.4 | **New** |
| 7 | Service landing page | 14.5 | **New** (replaces 6.9) |
| 8 | **Order: Job details** | 15.2 | **New** |
| 9 | **Order: Add-ons** | 15.3 | **New** |
| 10 | **Order: Schedule** | 15.4 | **New** |
| 11 | **Order: Location and contact** | 15.5 | **New** |
| 12 | **Order: Review and pay** | 15.6 | **New** |
| 13 | **Order: Mobile Money waiting** | 15.7 | **New** |
| 14 | Booking confirmed | 15.8 | Updated |
| 15 | My bookings, Booking details, Tracking | 6.10, 6.11 | Existing |
| 16 | Reschedule, Cancel, Late-fee warning | 16.1–16.3 | **New** |
| 17 | Recurring plan management | 16.4 | **New** |
| 18 | Rebook and "same cleaner" | 16.5 | **New** |
| 19 | Receipt / invoice | 16.6 | **New** |
| 20 | Offers and promo codes, Refer and earn | 17.1 | **New** |
| 21 | Reviews list | 17.2 | **New** |
| 22 | Help centre, FAQ, Contact support | 17.3 | **New** |
| 23 | Policies (Terms, Privacy, Payment and refund) | 17.4 | **New** |
| 24 | Saved addresses | 17.5 | **New** |
| 25 | Quote request (office and specialised) | 17.6 | **New** |
| 26 | Empty, error, offline and permission states | 18 | **New** |
| 27 | Cleaner profile, Payments, Messages, Notifications, Profile, Rate and review, Admin dashboard | 6.12–6.18 | Existing |

---

## 14. Discovery Pages (Home, Browse, Service Landing)

### 14.1 Area Selector (first run, and from the Home location pill)

- Full-screen sheet with a search field and a **"Use my current location"** row (asks for permission with a plain-language reason).
- List of areas grouped by division: *Kampala Central, Nakawa, Makindye, Kawempe, Rubaga*, then *Wakiso* and *Entebbe*.
- Unserved areas show "Coming soon" with a **Notify me** link.
- Chosen area is saved in the profile and shown in the Home header pill (`📍 Ntinda`).

### 14.2 Home (update to 6.6)

Add these blocks, in this order, to the existing Home layout:

1. Header with greeting, area pill, bell, avatar.
2. Search bar.
3. **Welcome offer banner** (new users only): yellow gradient, "Your first clean: 20% off", button "Book now".
4. **Trust strip** (see 14.2.1).
5. **Most popular services**: 2 × 2 grid of large cards.
6. **Category rows:** Home cleaning, Upholstery and fabric, Specialised, Commercial, Laundry. Each row has a header (H2) and "See all", then a horizontal card list (card width 160, gap 12, left padding 16, peeking next card by about 24 dp).
7. **Rebook** card (returning customers): last service, "Book again" and "Same cleaner".
8. **Upcoming booking** card.
9. **How it works** (3 steps, compact).
10. **Verified reviews** horizontal list.

**14.2.1 Trust strip:** a horizontal scroll of 4–5 small pills, each with an icon and short text (for example "4.8 rating", "Vetted cleaners", "Pay with MoMo", "Support 7 days"). Only show numbers Gabfix can prove: pull real values from the backend, never invent counts.

### 14.3 Search and Results

- Search field is auto-focused. Below it: **Recent searches** and **Popular** chips.
- Results are grouped: **Services**, then **Cleaners** (optional).
- No results: friendly illustration, "We couldn't find that", button **"Request a custom service"** (opens the quote request, 17.6).

### 14.4 Services (Browse) Tab

- Sticky search bar and a horizontal **category chip bar** (All, Home, Fabric, Specialised, Commercial, Laundry).
- Vertical sections per category. Each service tile is 2 columns: icon or photo, name, **"From UGX …"**, optional "Popular" tag (yellow pill).
- The chip bar scrolls the list to the section (and highlights the active chip as the user scrolls).

### 14.5 Service Landing Page (replaces 6.9)

Single scrolling page. Section order follows the marketplace study, trimmed for mobile.

| # | Block | Spec |
|---|---|---|
| 1 | **Hero** (height 260) | Photo with a green overlay gradient. Back and share icons. Title H1, one-line promise, rating chip, **"From UGX …/hr"**. |
| 2 | **Offer stamp** | Round yellow badge overlapping the hero's bottom right (for example "First clean 20% off"). Echoes the circular logo. |
| 3 | **Trust strip** | As 14.2.1. |
| 4 | **What's included** | Checklist (green tick icons) in two groups: *Included* and *Not included*. |
| 5 | **Pricing** | Table of hours and the per-hour rate (cheaper per hour for longer bookings), with notes on materials and VAT. |
| 6 | **Add-ons** | Horizontal cards (Balcony, Ironing and folding, Fridge, Wardrobe, Cupboards). Each states "+30 min" and "+UGX". |
| 7 | **How it works** | 3 numbered steps with icons: Tell us what you need, We find the right cleaner, Sit back and relax. |
| 8 | **Verified reviews** | Rating summary (big number, star row, count), then 3 review cards and "Read all reviews". |
| 9 | **FAQ** | Accordion (one open at a time). Chevron rotates 180°, 200 ms. |
| 10 | **Related services** | Horizontal row. |
| 11 | **Sticky bottom bar** | "From UGX X/hr" on the left, **Book now** on the right. Appears after the user scrolls past the hero. |

---

## 15. Order Specification Pages (Booking Flow)

> **Image reference note:** the order-specification images you mentioned were not attached to your message (only text arrived). The pages below are derived from the ServiceMarket booking flow, adapted to the Gabfix layout. Please re-upload the images and I will reconcile each field and layout in a revision pass.

> This section **supersedes the step table in 6.7**.

### 15.1 Flow Overview

```
Service landing ─► [1] DETAILS ─► [1b] ADD-ONS ─► [2] SCHEDULE ─► [3] LOCATION ─► [4] REVIEW & PAY ─► CONFIRMED
                      │                                                                │
                      └──────────── persistent SUMMARY BAR (total updates live) ───────┘
```

**Global rules for every order page**

- **Top bar:** back arrow (left), service name (centre), ✕ close (right). Closing asks: "Save as draft?" with *Save draft* and *Discard*.
- **Stepper** under the top bar: 4 labelled stages (**Details · Schedule · Location · Confirm**). Active stage is green with a yellow dot, completed stages show a green check, upcoming stages are grey. Add-ons live inside stage 1.
- **Sticky bottom bar** (height 72 plus inset): collapsed **Summary bar** showing `Total UGX 85,000` with a chevron on the left and the **Next** button on the right. Tap the left area to expand the **Summary sheet** (15.9).
- **Defaults:** preselect the most common option, and mark it with a yellow **Popular** tag.
- **Validation:** the Next button is disabled until the step is valid. Show inline errors, not alerts.
- **Draft persistence:** every change is saved to the zustand store (persisted), and the user can resume from Home ("Continue your booking").
- **Price transparency:** any control that changes price shows its effect right next to it (for example "+UGX 3,000/hr").

### 15.2 Page 1: Job Details

**Purpose:** capture the size of the job. Fields adapt per service (see 15.10), shown here for **Home cleaning**.

```
┌────────────────────────────────────────┐
│ ←        Home cleaning              ✕  │  top bar
│  ● Details ─ ○ Schedule ─ ○ Location ─ ○ Confirm  │
├────────────────────────────────────────┤
│ How many cleaners do you need?         │  H3
│  ( 1 )  ( 2 )  ( 3 )  ( 4 )            │  number chips
│                                        │
│ How many hours should they stay?       │
│  (2) (3) (4•Popular) (5) (6) (7) (8)   │  scrollable chips
│  ⓘ Longer bookings cost less per hour  │
│                                        │
│ How often do you need cleaning?        │
│ ┌────────────────────────────────────┐ │
│ │ ◉ Once                             │ │  selectable cards
│ │   One-time cleaning session        │ │
│ └────────────────────────────────────┘ │
│ ┌────────────────────────────────────┐ │
│ │ ○ Once a week          10% off     │ │
│ │   ✓ Same cleaner every time        │ │
│ │   ✓ Reschedule easily in the app   │ │
│ └────────────────────────────────────┘ │
│ ┌────────────────────────────────────┐ │
│ │ ○ Several times a week 15% off     │ │
│ └────────────────────────────────────┘ │
│                                        │
│ Do you need cleaning materials?        │
│  [ No ]  [ Yes, +UGX 3,000/hr ]        │  segmented control
│  Includes vacuum, broom, mop, bucket,  │
│  cloths and cleaning liquids           │
│                                        │
│ Special instructions (optional)        │
│ ┌────────────────────────────────────┐ │
│ │ e.g. Gate code, pets, areas to     │ │  multiline, 120 high
│ │ focus on…                          │ │
│ └────────────────────────────────────┘ │
├────────────────────────────────────────┤
│ ▲ Total UGX 85,000        [  Next  ]   │  sticky summary bar
└────────────────────────────────────────┘
```

| Control | Component | Spec |
|---|---|---|
| Cleaners | `ChipSelector` (single select) | 4 chips, 56 × 48, 12 radius. Selected is green fill with white text. |
| Hours | `ChipSelector` (horizontal scroll) | 2 to 8. **4 carries a "Popular" tag** (yellow pill, 10 / 600 text, above the chip). |
| Frequency | `SelectableCard` list | 20 radius, 16 padding, radio at top left. Selected card gets a 2 dp green border, `green-50` fill. A discount tag (yellow pill) sits top right. Benefits are listed with green ticks. |
| Materials | `SegmentedControl` | 2 options, 48 high. The "Yes" label shows the surcharge. |
| Instructions | `TextArea` | Optional, 300 character counter, `returnKeyType="done"`. |

**Behaviour**

- Changing any control recalculates the total instantly (animated number roll, 200 ms).
- Selecting "Once a week" shows a small success banner: "You'll get the same cleaner each time."

### 15.3 Page 1b: Add-ons

Reached by tapping **Next** on Job Details. Header: "Want a little extra done?"

```
┌────────────────────────────────────────┐
│ ←        Add extras                 ✕  │
│  ● Details ─ ○ Schedule ─ ○ Location ─ ○ Confirm  │
├────────────────────────────────────────┤
│ Each extra adds 30 minutes             │
│ ┌────────────────────────────────────┐ │
│ │ [icon]  Balcony cleaning      [ ☐ ]│ │
│ │ Wipe surfaces, wash and mop floor  │ │
│ │ +30 min · +UGX 5,000               │ │
│ │ ⓘ What's included                  │ │
│ └────────────────────────────────────┘ │
│ ┌────────────────────────────────────┐ │
│ │ [icon]  Ironing and folding   [ ☑ ]│ │  selected
│ │ Up to 10 items. Bring your own iron│ │
│ └────────────────────────────────────┘ │
│  … Fridge · Wardrobe · Cupboards       │
├────────────────────────────────────────┤
│ ▲ Total UGX 90,000 (4.5 h)  [  Next  ] │
└────────────────────────────────────────┘
```

- **AddOnCard:** 20 radius, 56 dp icon tile (`green-50` background, green icon), title H3, one-line description, price and time line in `text-muted`, checkbox on the right. Selected state: 2 dp green border plus `green-50` fill.
- "What's included" opens a bottom sheet with the inclusions and exclusions.
- The summary shows **duration** as well as price (`4.5 h`), because each extra adds time.
- Skipping is allowed: **Next** is always enabled on this page.
- Unlike the marketplace studied, customers can **add or remove extras later from Booking details** (until 24 hours before).

### 15.4 Page 2: Schedule

```
┌────────────────────────────────────────┐
│ ←        When should we come?       ✕  │
│  ✓ Details ─ ● Schedule ─ ○ Location ─ ○ Confirm  │
├────────────────────────────────────────┤
│ November 2026                  ‹   ›   │
│ ┌──┐┌──┐┌──┐┌──┐┌──┐┌──┐┌──┐          │
│ │Wed││Thu││Fri││Sat││Sun││Mon││Tue│     │  date strip (scrolls)
│ │18 ││19 ││20 ││21 ││22 ││23 ││24 │     │
│ └──┘└──┘└──┘└──┘└──┘└──┘└──┘          │
│  📅 Pick another date                  │  opens month sheet
│                                        │
│ Start time                             │
│  (8:00 am) (9:00 am) (10:00 am)        │  slot chips, 3 per row
│  (11:00 am) (12:00 pm) (1:00 pm) …     │
│  Unavailable slots are greyed out      │
│                                        │
│ ⓘ Free to change or cancel up to       │
│   24 hours before your booking         │  info banner (info colour)
├────────────────────────────────────────┤
│ ▲ Total UGX 90,000        [  Next  ]   │
└────────────────────────────────────────┘
```

- **Date strip:** each tile 56 × 72, radius 16. Selected tile is green with white text and a yellow dot under the date. Disabled dates are 40% opacity. Today is outlined.
- **Slot chips:** 3 columns, height 44, `bg-green-50` when available, **grey with strikethrough** when full. Show **"Few left"** microcopy where capacity is low.
- Time is displayed in 12-hour format, **EAT**.
- For recurring bookings, add a **Repeat summary** card: "Every Thursday at 10:00 am · starts 19 Nov", with an optional end date.
- Same-day booking: if the earliest slot is less than 3 hours away, show a "Same-day request" note (subject to cleaner availability).

### 15.5 Page 3: Location and Contact

```
┌────────────────────────────────────────┐
│ ←        Where is the job?          ✕  │
│  ✓ Details ─ ✓ Schedule ─ ● Location ─ ○ Confirm  │
├────────────────────────────────────────┤
│ Saved addresses                        │
│ ┌────────────────────────────────────┐ │
│ │ ◉ Home · Ntinda, Kampala           │ │
│ │   Plot 12, Ntinda Rd               │ │
│ └────────────────────────────────────┘ │
│  ＋ Add new address                    │
│                                        │
│ (map preview 160 high, draggable pin)  │
│                                        │
│ Property type  (Apartment)(House)(Office)│
│ Area *      [ Ntinda            ▾ ]    │
│ Street / building / house no. *        │
│ Landmark or directions                 │
│  [ Near Shell petrol station, blue gate]│
│ Access instructions (optional)         │
│                                        │
│ Contact details                        │
│ Name *        [ Aisha Nakato ]         │
│ Phone *  [ +256 ▾ ] [ 7•• ••• ••• ]    │
│ ☐ Someone else will be home            │
├────────────────────────────────────────┤
│ ▲ Total UGX 90,000        [  Next  ]   │
└────────────────────────────────────────┘
```

- Pre-fill from the profile. Saved addresses are `SelectableCard` rows with a radio.
- **Add new address** opens a full sheet (`17.5`). The pin can be dragged and the address fields update (reverse geocoding where available, otherwise manual).
- **Landmark / directions is prominent**, not hidden, because many addresses in Kampala are described by landmarks.
- Phone uses the `+256` chip, and validates 9 digits.
- Ask for **location permission only here**, with a pre-prompt explanation ("We use your location to place the pin and find nearby cleaners").
- Show an **out-of-area** error if the pin is outside served areas, with a "Notify me" action.

### 15.6 Page 4: Review and Pay

```
┌────────────────────────────────────────┐
│ ←        Review and confirm         ✕  │
│  ✓ Details ─ ✓ Schedule ─ ✓ Location ─ ● Confirm  │
├────────────────────────────────────────┤
│ ┌────────────────────────────────────┐ │
│ │ Home cleaning              Edit    │ │  summary card
│ │ 2 cleaners · 4 h · Materials: No   │ │
│ │ Add-ons: Ironing and folding       │ │
│ │ Thu 19 Nov 2026 · 10:00 am         │ │
│ │ Home · Ntinda, Kampala             │ │
│ └────────────────────────────────────┘ │
│                                        │
│ Promo code        [ Enter code ][Apply]│
│                                        │
│ Price details                          │
│  Cleaning (2 × 4 h × UGX 10,000)  80,000│
│  Add-ons                            5,000│
│  Frequency discount (10%)          −8,500│
│  Promo (WELCOME20)                 −7,650│
│  VAT (18%)                         xx,xxx│
│  ─────────────────────────────────────  │
│  Total                       UGX 68,xxx │  Price, 20 / 700
│                                        │
│ When would you like to pay?            │
│ ○ Pay in full now        UGX 68,xxx    │
│ ◉ Pay a deposit now      UGX 20,400    │
│   (30%) (50%) (Custom)                 │
│   Now 20,400 · After service 47,600    │
│ ○ Pay after service      UGX 0 today   │
│                                        │
│ Pay now with                           │
│ ◉ MTN Mobile Money                     │
│ ○ Airtel Money                         │
│ ○ Visa card                            │
│                                        │
│ Pay the rest after the service with    │
│ ◉ Same as above                        │
│ ○ Cash (pay your cleaner on the day)   │
│  ⓘ You'll pay UGX 20,400 now and       │
│    UGX 47,600 after the service        │
│                                        │
│ ☑ I agree to the Terms and the         │
│   cancellation policy                  │
├────────────────────────────────────────┤
│ Total UGX 68,xxx      [ Confirm booking ]│
└────────────────────────────────────────┘
```

- **Edit** links jump to the relevant step and return here, keeping all values.
- **Promo:** valid code shows a green success chip and the discount line. Invalid shows an inline error.
- **Cash** is offered only for the payment due **after the service** (never for a full payment or deposit due at booking). Only the cleaner can confirm cash receipt. See Part 2, Section 3.1.
- **Payment methods** use logo tiles (MTN, Airtel and Visa logos appear in their brand colours inside tiles, never recoloured).
- Mobile Money number defaults to the contact phone and can be changed.
- The button label is **"Pay UGX X and confirm"** for *Pay in full now* and *Pay a deposit now*, and **Confirm booking** for *Pay after service*. Full interaction rules are in Part 2, P12.
- Tapping the button shows a loading state, then moves to 15.7 (payment authorisation, when a full payment or deposit is due today) or straight to 15.8 (pay after service). The balance is requested after the service is completed.
- All price figures are shown **in UGX with thousands separators**, rounded to whole shillings.

### 15.7 Payment Authorisation Screen (Mobile Money and Visa, whenever a payment is due)

- Centre illustration: phone with a pulsing green ring.
- Text: "Approve the payment on your phone", with the masked number and the amount.
- Countdown timer (2:00) and a **Resend prompt** button after 30 s.
- States: *Waiting*, *Approved* (green check, auto-advance), *Declined or timed out* (red banner with **Try again** and **Choose another method**).
- Never leave the user on a blank screen: if the app is backgrounded, a push notification confirms the result.

### 15.8 Booking Confirmed (update to 6.7)

- Large animated green check (600 ms draw-on) inside a yellow ring.
- H1 "You're booked!", booking ID `GBX-20481`, summary card.
- **What happens next** timeline: *We match you with a cleaner → You get a reminder → Your cleaner arrives*.
- Actions: **View booking** (primary), **Add to calendar** (secondary), **Back to home** (text).
- Fire a success haptic and request notification permission here, if not yet granted, with a clear reason.

### 15.9 Summary Sheet (expandable from the bottom bar)

- Bottom sheet that covers 60% of the screen, opened by tapping the total in the sticky bar.
- Contents: service, cleaners, hours, materials, add-ons, date and time, location, promo, **price breakdown**, total. Rows with missing data show "—".
- Rows are **tappable** and navigate back to the right step.

### 15.10 Field Variants by Service Type

The order flow shell, stepper, summary and pages 2–4 stay the same. Only **Page 1** changes.

| Service | Page 1 fields |
|---|---|
| **Home cleaning** | Cleaners, hours, frequency, materials, instructions (15.2) |
| **Deep cleaning** | Property type, bedrooms, bathrooms, size band, condition (light, normal, heavy), instructions |
| **Move-in / Move-out** | Property type, bedrooms, appliances to clean, instructions |
| **Sofa / Carpet / Mattress / Curtain** | **Counter steppers** per item (3-seater sofa, 2-seater, rug size, bed size), fabric type, stain notes, photo upload |
| **Window cleaning** | Number of windows or floors, interior or exterior, access (ladder needed) |
| **Water tank** | Tank capacity (litres), tank type, location (roof, underground) |
| **Laundry** | Pickup and delivery, approximate weight bands, service type (wash and fold, iron, dry clean), pickup window |
| **Office / Commercial** | **Quote request** (17.6) instead of a fixed price |
| **Fumigation** | Pest type chips, property size, severity |

All variants reuse `CounterStepper`, `ChipSelector`, `SelectableCard`, `SegmentedControl` and `TextArea` so no new patterns are introduced.

### 15.11 Order Component Specs

| Component | Spec |
|---|---|
| `CounterStepper` | Label left, `−` count `+` right. Buttons 44 × 44 circle, green outline. Count 18 / 600, min and max enforced (disable the button at the limit). Long-press repeats. |
| `ChipSelector` | Height 48, radius 12, 1.5 border. Selected: green fill, white text, haptic light. |
| `SelectableCard` | Radius 20, padding 16, radio or checkbox top left. Selected: 2 dp green border plus `green-50` fill. |
| `SegmentedControl` | Height 48, radius 14, track `#E3E8E4`, active thumb white with a green label (animated slide, 180 ms). |
| `AddOnCard` | See 15.3. |
| `DateStrip` | See 15.4. |
| `SlotChips` | See 15.4. |
| `SummaryBar` | Height 72 plus inset. Left: total (Price style) with a chevron. Right: primary button (min width 140). Top edge shadow. Number change animates. |
| `PriceRow` | Label left (Body), amount right (Body, tabular figures). Discounts in `success` colour with a minus sign. |
| `StepperHeader` | 4 stages, 28 dp circles joined by 2 dp lines. Labels 12 / 500. Completed: green with check. Active: green with a yellow ring. |

### 15.12 Price Calculation Rules

```
base      = rate(hours) × hours × cleaners
materials = materialsRate × hours × cleaners      (if selected)
addOns    = Σ addOnPrice        ; extra time = 30 min per add-on
subtotal  = base + materials + addOns
discount  = frequencyDiscount% × (base + materials)   ; then promo
vat       = 18% × (subtotal − discounts)               ; confirm treatment with finance
total     = subtotal − discounts + vat
```

**Example rate card (placeholder values, to be confirmed by Gabfix before design lock)**

| Booking length | Rate per cleaner per hour |
|---|---|
| 2 hours | UGX 12,000 |
| 3 hours | UGX 11,000 |
| 4 to 8 hours | UGX 10,000 |
| Materials | + UGX 3,000 per hour |

Rule of thumb carried from the study: **longer bookings cost less per hour**, and recurring plans carry a visible percentage discount.

---

## 16. Booking Management Pages

### 16.1 Reschedule

- Entry: Booking details → **Reschedule**. Opens a bottom sheet with the same `DateStrip` and `SlotChips`.
- Banner: free changes up to 24 hours before. Inside 24 hours, show the **late-change fee** in a warning banner before confirming.
- Confirm button: "Confirm new time". Success toast and the booking card updates.

### 16.2 Cancel Flow

1. Sheet title "Cancel this booking?" with the booking summary.
2. **Reason chips** (single select): *Change of plans, Found another service, Booked by mistake, Price, Other*.
3. **Policy panel:** green "Free cancellation" if more than 24 hours before, otherwise an amber "A late cancellation fee of UGX … applies".
4. Buttons: **Keep booking** (primary, green) and **Cancel booking** (destructive text button).
5. Result screen with confirmation, refund information if relevant, and a **Book again** link.

### 16.3 Late-Fee Warning Pattern

Amber banner (`#FFF4D6` fill, `#8A6D00` text, warning icon) shown on any change or cancel action within 24 hours. The user must tick "I understand" before the destructive button enables.

### 16.4 Recurring Plans

- **My bookings → Plans** tab lists plans: frequency, day and time, cleaner, next visit, discount.
- Plan detail actions: **Skip next visit**, **Pause**, **Change day or time**, **Change cleaner request**, **End plan**.
- Rule: *same cleaner* for all recurring visits. If the cleaner is unavailable, show "We'll notify you and arrange the best match".

### 16.5 Rebook and Same Cleaner

- Completed booking cards show **Book again** (copies all details into a new draft, opens straight on the Schedule step) and **Book same cleaner**.
- If the cleaner has no availability, offer the next available slots or similar cleaners.

### 16.6 Receipt / Invoice

- Header with logo badge, booking ID, date.
- Itemised price list identical to 15.6, payment method, status chip (**Paid**, **Pending**).
- Actions: **Share** (PDF or image), **Download**, **Report a problem**.

---

## 17. Supporting Pages

### 17.1 Offers, Promo Codes and Refer and Earn

- Offers list as cards: banner, title, code (with a **Copy** chip), expiry, "Use now".
- Refer and earn: a yellow gradient hero, "Give UGX X, get UGX X", the user's code, **Share via WhatsApp / SMS** buttons, and a progress list of referrals.

### 17.2 Reviews List

- Summary header: big average rating, star row, total count, distribution bars (5 to 1).
- Filter chips: All, 5 stars, With comments, Most recent.
- **Review card:** initials avatar (green-100 background, green-900 text), name as "First name plus initial", stars (gold), comment (max 4 lines then **Read more**), date, and a **Verified booking** tag. Cleaner reply is shown indented.

### 17.3 Help Centre, FAQ and Contact Support

- Search field and **top questions**.
- FAQ grouped by topic (Booking, Pricing, Add-ons, Payments, Cancellation, Safety), as accordions.
- **Contact options** card: **Call**, **WhatsApp**, **Chat**, **Email**, with support hours (shown as "Open 7 days"). Floating "Need help?" button on booking details and order pages.

### 17.4 Policies

Terms, Privacy, and **Payment and refund policy** open in an in-app web view with a clean header and a **"Summary in plain words"** card at the top.

### 17.5 Saved Addresses

- List of address cards with a label (Home, Work, Other), a default marker, and **Edit** and **Delete** (swipe on iOS, long-press menu on Android, always also available via a ⋯ menu).
- Add and edit form identical to 15.5's address fields plus a map.

### 17.6 Quote Request (Office and Specialised)

- Short form: service, property type, **size (sq m or number of rooms)**, frequency, preferred start date, contact, optional photos.
- Submit shows "We'll reply within X hours" and creates a pending item in **Bookings → Requests**.
- Admin replies with a fixed quote, which the customer accepts, then continues at Schedule.

---

## 18. States, Edge Cases and Feedback

| State | Treatment |
|---|---|
| **Loading** | Skeleton screens that mirror the final layout (shimmer 1.2 s). Never a blank screen. |
| **Empty bookings** | Illustration, "No bookings yet", **Book your first clean**. |
| **Offline** | Slim banner "You're offline", read-only access to cached bookings, order drafts keep saving, submit disabled with an explanation. |
| **Slow network** | Retry with backoff, show "Still trying…" after 8 s. |
| **No slots available** | "No times left on this day", automatically suggest the next available day. |
| **Out of area** | See 15.5. |
| **Payment failed** | Red banner, keep the booking in **Pending payment**, offer **Try again** or **Change method**. |
| **Permission denied (location, notifications)** | Explain the benefit and offer **Open settings**, and keep the feature usable manually. |
| **Session expired** | Return to Login, preserve the booking draft. |
| **App update required** | Full-screen blocking message with **Update** button. |
| **Success** | Toast plus haptic. For significant events (booking confirmed) use the full-screen pattern. |

---

## 19. Notifications and Messaging Timeline

| Moment | Channel | Message intent |
|---|---|---|
| Booking placed | Push, SMS, email | "Booking received. We're matching you with a cleaner." |
| Cleaner matched | Push, SMS | Name, photo, rating, **Same cleaner for recurring bookings** |
| 24 hours before | Push, SMS | Reminder with **Reschedule** link (inside free-change window) |
| 2 hours before | Push | "Your cleaner arrives at 10:00 am." |
| Cleaner on the way | Push | Live ETA, opens tracking |
| Job completed | Push | "All done. Please rate your clean." |
| Deposit received | Push, receipt link | Amount in UGX and method |
| **Balance due** (service completed) | Push, SMS, in-app card | "Pay UGX X to finish" with a **Pay balance** action (or "Pay UGX X in cash to your cleaner" for cash); reminders after 2 h and 24 h |
| Cash received | Push, receipt link | "Your cleaner confirmed UGX X in cash." with **Report a problem** |
| Balance paid | Push, receipt link | Amount in UGX and method |
| Recurring plan upcoming | Push | "Next visit Thursday. Skip or change?" |

Rules: respect quiet hours (no promotional pushes between 9 pm and 7 am EAT), and let users toggle each category in **Profile → Notifications**.

---

## 20. Deliverables and Next Steps

**This document (Part 1, v1.1)** now covers brand, colour, type, layout system, components, core screens, the marketplace study, Expo and React Native rules, the navigation map, discovery pages, the full order-specification flow, booking management and supporting pages.

**Open items**

1. **Re-upload the order-specification images** so every field and layout can be reconciled (Section 15).
2. ~~Pricing~~ **Decided:** dummy values (15.12) are used for now, VAT 18%. Replace with real values before launch.
3. ~~Payment aggregator and flows~~ **Decided:** MTN Mobile Money, Airtel Money, Visa card and Cash (after service only); payment at booking and after the service, with deposits (Part 2, Section 3). Still to confirm: the aggregator itself.
4. **Confirm the Phase 1 catalogue** (Section 11.3).
5. **Build specs:** the page-by-page implementation details (style values, layout trees, behaviours, data, payment model) are in **`Gabfix_App_Ui_2.md`**.

**Suggested Part 2 (`Gabfix_App_Ui_2.md`)**

1. Component state library (default, pressed, disabled, error) in RN code.
2. Screen-by-screen frame maps for all 27 inventory items.
3. Illustration and iconography brief.
4. Design tokens as JSON plus the `theme.ts` file.
5. Cleaner-side (partner) app and admin dashboard flows.

**Design tokens (CSS reference for the web admin)**

```css
:root {
  --gabfix-green-500: #118E45;
  --gabfix-green-700: #1A5E2F;
  --gabfix-green-900: #1C411E;
  --gabfix-yellow-500: #F7EB15;
  --gabfix-yellow-600: #E7BE1F;
  --gabfix-yellow-200: #F5EE5E;
  --gabfix-bg: #F6F8F6;
  --gabfix-text: #16221A;
  --gabfix-border: #DDE5DF;
  --radius-btn: 14px;
  --radius-card: 20px;
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px;
  --space-6: 24px; --space-8: 32px;
}
```
