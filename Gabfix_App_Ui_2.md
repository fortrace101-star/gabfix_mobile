# Gabfix App UI: Implementation Specs (Part 2)

**Companion to:** `Gabfix_App_Ui_1.md` (design guide v1.1)
**Stack:** React Native + Expo (TypeScript, Expo Router), iOS and Android
**Purpose:** page-by-page build specs with layout rules, style values, behaviours, data and states precise enough to replicate each screen.
**Version:** 2.0

---

## 0. Decisions Locked In

| Item | Decision |
|---|---|
| Pricing | **Dummy values** from Part 1, Section 15.12 are used everywhere (replace when Gabfix supplies real ones). Keep them in one config file (`config/pricing.ts`) so a change never touches UI code. |
| VAT | 18%, applied after discounts |
| Payment methods | **MTN Mobile Money, Airtel Money, Visa card and Cash.** Cash can only be collected **after the service** (to the cleaner); it cannot be used for a payment due at booking (full or deposit). |
| Payment timing | **Customers can pay at both stages**: at booking (online) and after the service. They may also pay a **deposit** at booking and the **balance** after the service. |
| Deposit rule (dummy) | Minimum **30%** of the total or **UGX 20,000**, whichever is greater. Presets: 30%, 50%. Custom amount allowed up to the full total. |

---

## 1. Conventions

### 1.1 Units and Mapping

- Everything is in **dp** (React Native density-independent points). There is no `px`, `rem` or `%` font size.
- CSS to React Native mapping used in this document:

| CSS idea | React Native equivalent |
|---|---|
| `display:flex; flex-direction:column` | Default (`flexDirection:'column'`). Every `View` is already flex. |
| `box-shadow` | iOS `shadow*` props, Android `elevation` (see `shadow` in 2.3) |
| `gap` | `gap` (RN 0.71+, supported in Expo SDK 48+) |
| `overflow:hidden` | `overflow:'hidden'` (needed for rounded images) |
| `position:sticky` | Render the bar outside the `ScrollView` as a sibling (absolute bottom) |
| `position:absolute; inset:0` | `StyleSheet.absoluteFill` |
| `linear-gradient` | `expo-linear-gradient` (`LinearGradient`) |
| `backdrop-filter` | `expo-blur` (`BlurView`), iOS only. On Android use a solid colour. |
| `border: 1.5px solid` | `borderWidth:1.5, borderColor` (use `StyleSheet.hairlineWidth` for hairlines) |
| `z-index` | `zIndex` (and `elevation` on Android for stacking above siblings) |
| Media queries | `useWindowDimensions()` with the breakpoints in 1.2 |

Web admin dashboard (Section 20) uses **real CSS**.

### 1.2 Frame and Breakpoints

- Design frame **390 × 844 dp**. Screens must work from **360 to 430 dp wide** and from **640 to 932 dp tall**.
- `compact` = width < 360, `regular` = 360 to 429, `large` = 430 and above (also tablets, where content is centred with `maxWidth: 560`).
- **Never hard-code a width** except fixed controls (listed in 2.2). Use `flex`, `flexBasis`, `maxWidth`, and `aspectRatio` for images.
- Safe areas: wrap every screen with `useSafeAreaInsets()` and apply `paddingTop: insets.top`, `paddingBottom: insets.bottom` explicitly where a bar touches an edge.

### 1.3 Extra Packages Needed (beyond Part 1, Section 12.1)

`expo-linear-gradient`, `expo-blur`, `react-native-svg`, `expo-haptics`, `expo-image-picker` (photo upload), `expo-calendar` (add to calendar), `expo-sharing` and `expo-print` (receipts), `expo-clipboard` (copy code), `expo-linking` (deep links, WhatsApp and call links), `expo-web-browser` (policies, card 3-D Secure), `expo-network` or `@react-native-community/netinfo` (offline banner).

---

## 2. Global Foundations (code)

### 2.1 Tokens (`theme.ts`, final)

```ts
import { Platform, TextStyle, ViewStyle } from 'react-native';

export const colors = {
  green50:'#E8F6EE', green100:'#C5E8D3', green300:'#5BBF86',
  green500:'#118E45', green700:'#1A5E2F', green900:'#1C411E',
  yellow50:'#FFFCE0', yellow200:'#F5EE5E', yellow500:'#F7EB15',
  yellow600:'#E7BE1F', yellow800:'#8A6D00',
  bg:'#F6F8F6', surface:'#FFFFFF', border:'#DDE5DF',
  disabledBg:'#E3E8E4', disabledText:'#9AA79F',
  text:'#16221A', textMuted:'#5F6F65', placeholder:'#9AA79F',
  success:'#118E45', successBg:'#E8F6EE',
  warning:'#E7A500', warningBg:'#FFF4D6',
  error:'#D32F2F',   errorBg:'#FDECEC',
  info:'#1976D2',    infoBg:'#E8F1FB',
  scrim:'rgba(22,34,26,0.40)', focusRing:'rgba(17,142,69,0.18)',
  mtn:'#FFCC00', airtel:'#E40000', visa:'#1A1F71',   // brand tiles only
};

export const space = { 0:0, 1:4, 2:8, 3:12, 4:16, 5:20, 6:24, 8:32, 10:40, 12:48, 16:64 };
export const radius = { input:12, button:14, card:20, sheet:28, hero:28, pill:999, tile:16 };
export const size = {
  button:52, buttonSm:40, input:52, header:56, tabBar:64, summaryBar:72,
  touch:48, icon:24, iconSm:20, avatarSm:32, avatarMd:48, avatarLg:80, logo:64,
};
export const duration = { press:100, fast:180, base:250, slow:300, check:600, shimmer:1200 };
export const z = { base:0, sticky:10, header:20, sheet:30, toast:40, modal:50 };

export const font = {
  heading:'Poppins_700Bold', headingSemi:'Poppins_600SemiBold',
  body:'Inter_400Regular', bodyMedium:'Inter_500Medium', bodySemi:'Inter_600SemiBold',
};

export const text: Record<string, TextStyle> = {
  display:{ fontFamily:font.heading,     fontSize:32, lineHeight:40, color:colors.text },
  h1:     { fontFamily:font.heading,     fontSize:26, lineHeight:34, color:colors.text },
  h2:     { fontFamily:font.headingSemi, fontSize:20, lineHeight:28, color:colors.text },
  h3:     { fontFamily:font.headingSemi, fontSize:17, lineHeight:24, color:colors.text },
  bodyL:  { fontFamily:font.body,        fontSize:16, lineHeight:24, color:colors.text },
  body:   { fontFamily:font.body,        fontSize:14, lineHeight:20, color:colors.text },
  bodyM:  { fontFamily:font.bodyMedium,  fontSize:14, lineHeight:20, color:colors.text },
  caption:{ fontFamily:font.bodyMedium,  fontSize:12, lineHeight:16, color:colors.textMuted },
  button: { fontFamily:font.bodySemi,    fontSize:16, lineHeight:20 },
  price:  { fontFamily:font.heading,     fontSize:20, lineHeight:24, color:colors.text,
            fontVariant:['tabular-nums'] },
};

const sh = (color:string,y:number,op:number,r:number,el:number): ViewStyle =>
  Platform.select({
    ios:{ shadowColor:color, shadowOffset:{width:0,height:y}, shadowOpacity:op, shadowRadius:r },
    android:{ elevation:el, shadowColor:color },
  }) as ViewStyle;

export const shadow = {
  card:     sh('#1A5E2F',  4, 0.08, 16, 3),
  floating: sh('#1C411E', -4, 0.12, 24, 8),   // negative y: casts upward (bars, sheets)
  header:   sh('#1C411E',  6, 0.15, 20, 6),
};
```

Formatting helpers (`utils/format.ts`):

```ts
export const ugx = (n:number) => 'UGX ' + Math.round(n).toLocaleString('en-UG');
export const phoneUG = (d:string) => '+256 ' + d.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
export const dateLong = (d:Date) =>
  d.toLocaleDateString('en-GB',{weekday:'short',day:'2-digit',month:'short',year:'numeric',timeZone:'Africa/Kampala'});
export const time12 = (d:Date) =>
  d.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',hour12:true,timeZone:'Africa/Kampala'}).toLowerCase();
```

### 2.2 Shared Component Styles

All screens reuse these. Page specs only reference them by name.

```ts
// components/ui/styles.ts
export const base = StyleSheet.create({
  screen:  { flex:1, backgroundColor:colors.bg },
  content: { paddingHorizontal:16, paddingBottom:24, gap:24 },        // scroll content
  row:     { flexDirection:'row', alignItems:'center' },
  between: { flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  card:    { backgroundColor:colors.surface, borderRadius:radius.card, padding:16, ...shadow.card },
  divider: { height:StyleSheet.hairlineWidth, backgroundColor:colors.border },
});

// Buttons: height 52, radius 14. Pressed = opacity .88 and scale .98 (Reanimated, 100 ms).
export const btn = StyleSheet.create({
  base:       { height:52, borderRadius:14, paddingHorizontal:20, flexDirection:'row',
                alignItems:'center', justifyContent:'center', gap:8 },
  primary:    { backgroundColor:colors.green500 },           // label white
  onGreen:    { backgroundColor:colors.yellow500 },          // label green900
  secondary:  { backgroundColor:colors.surface, borderWidth:1.5, borderColor:colors.green500 },
  destructive:{ backgroundColor:colors.error },
  ghost:      { backgroundColor:'transparent' },             // label green500
  disabled:   { backgroundColor:colors.disabledBg },         // label disabledText
  small:      { height:40, paddingHorizontal:16, borderRadius:12 },
});

// Inputs: wrapper (ring) > field. Ring shows only on focus.
export const input = StyleSheet.create({
  ring:       { padding:3, borderRadius:15, borderWidth:0, borderColor:'transparent' },
  ringFocus:  { borderWidth:3, borderColor:colors.focusRing, padding:0 },
  field:      { height:52, borderRadius:12, borderWidth:1.5, borderColor:colors.border,
                backgroundColor:colors.surface, paddingHorizontal:14, flexDirection:'row',
                alignItems:'center', gap:8 },
  fieldFocus: { borderColor:colors.green500 },
  fieldError: { borderColor:colors.error },
  text:       { flex:1, fontFamily:font.body, fontSize:16, color:colors.text, padding:0 },
  label:      { ...text.bodyM, marginBottom:6 },
  helper:     { ...text.caption, marginTop:6 },
  error:      { ...text.caption, marginTop:6, color:colors.error },
  multiline:  { height:120, alignItems:'flex-start', paddingTop:12 },
});

export const chip = StyleSheet.create({
  base:     { height:48, minWidth:56, paddingHorizontal:16, borderRadius:12, borderWidth:1.5,
              borderColor:colors.border, backgroundColor:colors.surface,
              alignItems:'center', justifyContent:'center' },
  selected: { backgroundColor:colors.green500, borderColor:colors.green500 },   // label white
  disabled: { opacity:0.4 },
  pill:     { height:32, borderRadius:999, paddingHorizontal:12 },              // filters / tags
});

export const selectable = StyleSheet.create({
  card:     { borderRadius:20, padding:16, borderWidth:1.5, borderColor:colors.border,
              backgroundColor:colors.surface, flexDirection:'row', gap:12 },
  selected: { borderWidth:2, borderColor:colors.green500, backgroundColor:colors.green50 },
});
```

**Status chip colours** (`height 24, radius 999, paddingHorizontal 10, label caption 600`):

| Status | Background | Text | Icon |
|---|---|---|---|
| Pending | `warningBg` | `yellow800` | clock |
| Confirmed | `infoBg` | `info` | check-circle |
| In progress | `yellow200` | `green900` | play |
| Completed | `successBg` | `success` | check |
| Cancelled | `errorBg` | `error` | x |
| Balance due | `warningBg` | `yellow800` | wallet |
| Paid | `successBg` | `success` | check |

**Green hero header** (used by Home, Login, Services):

```ts
hero: { backgroundColor:colors.green500, paddingHorizontal:16, paddingBottom:56,
        borderBottomLeftRadius:28, borderBottomRightRadius:28 /* paddingTop = insets.top + 12 */ },
overlapCard: { marginTop:-40, marginHorizontal:16, zIndex:z.sticky, elevation:6 }
```
Use `LinearGradient colors={[green500, green700]} start={{x:0.2,y:0}} end={{x:0.8,y:1}}` as the hero background when a gradient is specified.

**Bottom tab bar** (custom `tabBar` for Expo Router `Tabs`):

```ts
tabBar: { height:64 /* + insets.bottom */, backgroundColor:colors.surface, flexDirection:'row',
          borderTopLeftRadius:20, borderTopRightRadius:20, ...shadow.floating, paddingTop:8 },
tabItem:{ flex:1, alignItems:'center', gap:2 },
tabPill:{ width:56, height:32, borderRadius:16, alignItems:'center', justifyContent:'center' },
tabPillActive:{ backgroundColor:colors.yellow200 },   // icon green700 filled; label green700 600
// inactive: icon + label textMuted. Label 11/14, Inter 500. Badge: 16 dp circle, yellow500, text green900 10/700.
```

**Sticky summary bar** (order flow):

```ts
summaryBar: { position:'absolute', left:0, right:0, bottom:0, minHeight:72 /* + insets.bottom */,
              backgroundColor:colors.surface, paddingHorizontal:16, paddingTop:12,
              flexDirection:'row', alignItems:'center', gap:12,
              borderTopLeftRadius:20, borderTopRightRadius:20, ...shadow.floating, zIndex:z.sticky },
// left: Pressable flex:1 (label caption "Total", price below, chevron-up icon 20). right: Button minWidth 140.
// ScrollView above it needs contentContainerStyle paddingBottom: 72 + insets.bottom + 24.
```

**Bottom sheet** (`@gorhom/bottom-sheet`):

```tsx
<BottomSheetModal
  snapPoints={['50%','90%']} enableDynamicSizing={false}
  backgroundStyle={{ backgroundColor:colors.surface, borderTopLeftRadius:28, borderTopRightRadius:28 }}
  handleIndicatorStyle={{ width:40, height:4, backgroundColor:colors.border }}
  backdropComponent={(p)=><BottomSheetBackdrop {...p} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.4} />}
  keyboardBehavior="interactive" android_keyboardInputMode="adjustResize" />
```

**Toast:** absolute top `insets.top + 8`, left/right 16, `borderRadius 12`, `padding 12/16`, background `green900` (success), `error`, or `info`; white text body 14/600, icon 20. Slide down 250 ms, auto-dismiss 3 s, swipe up to dismiss.

**Skeleton:** `View` with `backgroundColor:'#E3E8E4'`, same dimensions as the final element, opacity animated 0.5 to 1 with `withRepeat(withTiming(1,{duration:1200}),-1,true)`.

### 2.3 Accessibility and Touch Rules (apply to every page)

- Every `Pressable` gets `accessibilityRole`, `accessibilityLabel`, and `hitSlop` so the touch area is at least 48 × 48.
- Inputs: `accessibilityLabel` equals the visible label; errors are announced via `accessibilityLiveRegion="polite"` (Android) and `accessibilityHint` (iOS).
- Text uses `allowFontScaling` with `maxFontSizeMultiplier={1.3}`; layouts must not clip at 130%.
- Respect reduced motion: `useReducedMotion()` from Reanimated disables slides and scales (fade only).
- Haptics: `selectionAsync()` for chips, steppers and tabs; `impactAsync(Light)` for button presses on primary actions; `notificationAsync(Success | Error)` for confirmed or failed outcomes.

---

## 3. Payment Model (applies to the order flow, bookings and wallet)

### 3.1 Payment Plans at Booking

| Plan | At booking | After the service |
|---|---|---|
| **Pay in full now** | 100% of total | Nothing |
| **Pay a deposit now** | Deposit D (30% minimum, or UGX 20,000, whichever is greater) | Balance = Total − D |
| **Pay after service** | Nothing (a method is saved, no charge) | 100% of total |

Rules:

1. The customer chooses a **plan**, then a **method** for each payment that falls due:
   - **Pay now** (full or deposit): **MTN Mobile Money**, **Airtel Money** or **Visa card**. Cash is not offered, because nothing can be collected before the visit.
   - **Pay after service** (the whole amount or the balance): **MTN Mobile Money**, **Airtel Money**, **Visa card** or **Cash**.
2. The method used after the service can differ from the one used at booking (for example, deposit by MoMo, balance in cash). Default: the same method as the deposit, unless the customer picks Cash.
3. Deposit chips: **30%**, **50%** and **Custom** (numeric field). Validation: `max(0.30 × total, 20,000) ≤ D ≤ total − 1,000`. If D would equal the total, offer "Pay in full" instead.
4. When the service is marked **Completed**, any outstanding balance becomes **Balance due** (a push, an in-app card on Home and on Booking details, and a banner).
5. **Cancellation:** more than 24 hours before = full refund of any deposit to the original method. Within 24 hours = late fee equal to the **deposit amount** (dummy rule), deducted, remainder refunded. Pay-after-service bookings incur the late fee as a charge to the saved digital method (requires consent at booking: "I agree to the cancellation policy"). **Cash bookings have no method to charge**, so the late fee is added to the customer's **account balance** and must be settled with MTN, Airtel or Visa before their next booking.
6. **Reschedule** keeps the deposit.
7. **Changes that raise the price** (adding extras) create an **Additional amount due**, collectable immediately or after service, per the booking's plan.
8. **Cash rules:**
   - The customer sees "Pay UGX X in cash to your cleaner on the day" with the exact amount (no change is promised; the app suggests having the right amount).
   - **Only the cleaner can confirm cash receipt**, in the partner app (amount received, timestamp). The customer cannot mark a booking as paid. On confirmation the payment becomes **Paid**, the customer receives a push and the receipt shows "Cash".
   - If the amount confirmed differs from the amount due, the booking stays **Balance due** for the difference; the customer can **Report a problem** (opens support with the booking attached).
   - A cash balance can be switched to an online payment at any time from **Booking details** ("Pay online instead").
   - If the cleaner has not confirmed cash receipt within 24 hours of completion, an alert is raised to operations (see the admin **Cash collections** module).

### 3.2 Payment State Machine

```
              ┌─────────────── pay in full ───────────────┐
              │                                           ▼
 unpaid ──► deposit_pending ──► deposit_paid ──► (service completed) ──► balance_due ──► balance_pending ──► paid
   │               │                  │                                       │                │
   │               └─► failed ◄───────┘                                       └────────────────┴──► failed ─► balance_due
   └─ (pay after service) ───────────────────────────────────► (completed) ──► balance_due
 paid / deposit_paid ──► refunded | partially_refunded   (on cancellation)

 Cash branch (balance or full amount paid after service):
 (completed) ──► balance_due [method=cash] ──► cleaner confirms receipt ──► paid
                       │                                  └─► (amount differs) ──► balance_due (remaining) + dispute flag
                       └─► customer taps "Pay online instead" ──► balance_pending ──► paid
```

### 3.3 Method Flows

| Method | Flow | UI after tap on Confirm or Pay |
|---|---|---|
| **MTN MoMo / Airtel Money** | Backend creates a payment intent with the aggregator. The aggregator sends a **push prompt (STK) to the customer's phone**. Customer approves with their PIN. A webhook updates the intent. App polls `GET /payments/{id}` every 3 s for up to 120 s, or listens for the push. | Page **P13 (Payment Authorisation)** |
| **Cash** | **No payment intent is created at booking.** After completion the booking shows "Pay UGX X in cash". The cleaner confirms receipt in the partner app (`POST /payments/{bookingId}/cash-confirmation {amount, cleanerId}`). Backend records a `cash` payment, status `paid` (or partial). | None at booking. After the service: **Cash due card** (see P15b), then a push when confirmed |
| **Visa card** | Aggregator **hosted card page** opened in `expo-web-browser` (`openAuthSessionAsync`), with 3-D Secure. Return via deep link `gabfix://payment/return?id=…`. **Card numbers never touch the app or the Gabfix servers.** Offer **Save card** (token only, last 4 digits and brand shown). | Browser sheet, then the same P13 screen in the "Verifying" state |

### 3.4 Payment Method Tiles

```ts
methodTile: { ...selectable.card, alignItems:'center', minHeight:64 },
methodLogo: { width:40, height:40, borderRadius:10, backgroundColor:'#FFFFFF',
              borderWidth:StyleSheet.hairlineWidth, borderColor:colors.border,
              alignItems:'center', justifyContent:'center' },   // logo image 28 × 28, never recoloured
// MTN logo on yellow #FFCC00 tile, Airtel logo on white, Visa wordmark on white.
// Cash tile: banknote icon 24 (green700) on a green50 logo tile. Name "Cash", sub-line "Pay your cleaner on the day".
// Cash tile is rendered ONLY in the "after the service" selector (never for a payment due now).
// Text: name (bodyM), sub-line (caption): "•••• 4242" or masked phone "+256 77• ••• 482".
```

### 3.5 Data Models (TypeScript)

```ts
export type PaymentPlan   = 'full_now' | 'deposit' | 'after_service';
export type PaymentMethod = 'mtn_momo' | 'airtel_money' | 'visa_card' | 'cash';
export type PaymentStatus =
  | 'unpaid' | 'deposit_pending' | 'deposit_paid' | 'balance_due' | 'balance_pending'
  | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
export type BookingStatus =
  | 'draft' | 'submitted' | 'matched' | 'confirmed' | 'on_the_way'
  | 'in_progress' | 'completed' | 'cancelled';

export interface BookingDraft {
  serviceSlug: string;
  details: { cleaners:number; hours:number; frequency:'once'|'weekly'|'multi';
             materials:boolean; instructions?:string; variant?:Record<string,unknown> };
  addOns: string[];                        // add-on ids
  schedule?: { dateISO:string; startTime:string; repeatUntil?:string };
  location?: { addressId?:string; area:string; street:string; landmark?:string;
               lat?:number; lng?:number; propertyType:'apartment'|'house'|'office';
               access?:string; contactName:string; contactPhone:string };
  promoCode?: string;
  payment?: { plan:PaymentPlan;
              method?:PaymentMethod;          // pay-now method: mtn_momo | airtel_money | visa_card (undefined for after_service)
              balanceMethod:PaymentMethod;    // after-service method: any of the four, incl. 'cash'
              payerPhone?:string; depositAmount?:number; savedCardId?:string };
}

export interface PriceBreakdown {
  base:number; materials:number; addOns:number; frequencyDiscount:number;
  promoDiscount:number; vat:number; total:number; minutes:number;
  deposit?:number; balance?:number;
}
```

### 3.6 Pricing Function

```ts
export function price(d: BookingDraft, cfg: PricingConfig): PriceBreakdown {
  const { cleaners, hours, frequency, materials } = d.details;
  const rate = hours <= 2 ? cfg.rate2 : hours === 3 ? cfg.rate3 : cfg.rate4plus;   // 12000 / 11000 / 10000
  const base = rate * hours * cleaners;
  const mat  = materials ? cfg.materialsPerHour * hours * cleaners : 0;            // 3000
  const add  = d.addOns.reduce((s,id)=>s + cfg.addOns[id].price, 0);
  const freq = frequency==='weekly' ? 0.10 : frequency==='multi' ? 0.15 : 0;
  const fDisc= Math.round((base+mat) * freq);
  const subtotal = base + mat + add - fDisc;
  const promo = applyPromo(d.promoCode, subtotal);
  const vat   = Math.round((subtotal - promo) * cfg.vat);                           // 0.18
  const total = subtotal - promo + vat;
  const minutes = hours*60 + d.addOns.length*30;
  return { base, materials:mat, addOns:add, frequencyDiscount:fDisc, promoDiscount:promo, vat, total, minutes };
}
```
Always compute on the **server** as the source of truth. The client function is for live preview and must match.

---
## 4. Page Specifications: Onboarding and Auth

**Template for every page:** Route · Layout (top to bottom, with style values) · Features and behaviour · States · Data and API.

### P1. Get Started

**Route:** `app/(auth)/get-started.tsx` (shown once, on first launch; flag in `SecureStore: onboarded`)

**Layout**

| # | Element | Style |
|---|---|---|
| Root | `View` | `flex:1; backgroundColor:green500` (gradient `green500 → green700`) |
| 1 | Slide pager (`FlatList horizontal pagingEnabled`) | `height: windowHeight × 0.58`; each slide `width: windowWidth` |
| 1a | Illustration (`expo-image`, `contentFit:'cover'`) | `StyleSheet.absoluteFill` inside the hero; hero `borderBottomLeftRadius:40; borderBottomRightRadius:40; overflow:'hidden'` |
| 1b | Logo badge | `position:absolute; top: insets.top + 12; left:24; width:40; height:40` |
| 1c | Skip (text button) | `position:absolute; top: insets.top + 16; right:24`; label white, body 14/600 |
| 2 | Dots row | `flexDirection:'row'; justifyContent:'center'; gap:6; marginTop:24`. Dot: `height:6; width:6; borderRadius:3; backgroundColor:'rgba(255,255,255,0.4)'`. Active: `width:24; backgroundColor:yellow500` (animate width 180 ms) |
| 3 | Text block | `paddingHorizontal:24; marginTop:16; gap:8` |
| 3a | Headline | `text.display` with `color:'#FFFFFF'`; max 2 lines |
| 3b | Sub-copy | `text.bodyL` with `color:'rgba(255,255,255,0.85)'` |
| 4 | Footer | `position:absolute; bottom: insets.bottom + 16; left:24; right:24; gap:12` |
| 4a | Primary (yellow-on-green) | "Get started" → `/(auth)/sign-up` |
| 4b | Ghost | "I already have an account. **Log in**" (white text, bold "Log in", yellow underline) |

**Slides (3):** (1) "A spotless home, booked in minutes." (2) "Verified cleaners you can trust." (3) "Pay with MTN, Airtel, Visa or cash. Deposit if you like."

**Behaviour:** swipe or auto-advance every 4 s (pause on touch); last slide changes primary label to "Get started". Skip jumps to sign-up. Haptic selection on page change.
**States:** images use blurhash placeholders; if images fail, show the gradient only.
**Data:** none (static content). Prefetch slide images in the splash phase.

---

### P2a. Login

**Route:** `app/(auth)/login.tsx`

| # | Element | Style |
|---|---|---|
| Root | `KeyboardAvoidingView behavior={ios?'padding':undefined}` containing `ScrollView keyboardShouldPersistTaps="handled"` | `backgroundColor:green500` |
| 1 | Header zone | `height: 230` (includes `insets.top`); logo `64 × 64` centred; wordmark "Gabfix" `Poppins 600 22` white, `marginTop:8` |
| 2 | Form card | `marginTop:-40; backgroundColor:surface; borderTopLeftRadius:28; borderTopRightRadius:28; padding:24; paddingBottom: insets.bottom + 24; flexGrow:1; gap:16` |
| 2a | Title block | H1 "Welcome back"; caption below "Log in to manage your bookings" |
| 2b | Identifier input | label "Phone number or email"; if the text is all digits, prefix chip `+256` appears (animated 150 ms) |
| 2c | Password input | `secureTextEntry`; trailing eye icon 24 (hitSlop 12); `textContentType="password"`; `autoComplete="current-password"` |
| 2d | Row | `between`: Checkbox "Remember me" (22 × 22, radius 6) / Text button "Forgot password?" (green500, 14/600) |
| 2e | Primary button | "Log in", full width |
| 2f | OTP alternative | Secondary button "Log in with a code via SMS" |
| 2g | Divider with label | two `base.divider` flex:1 lines and caption "or continue with" (gap 12) |
| 2h | Social row | `flexDirection:'row'; gap:12`; each button `flex:1; height:52` secondary style with logo 20 and label; Google always, **Apple only on iOS** (`Platform.OS==='ios'`) |
| 3 | Footer | centred text: "New to Gabfix? **Create account**" (link green500 600) |

**Behaviour:** validate on submit (not on every keystroke), then on blur after the first submit. Failed login: shake the card (translateX ±8, 3 cycles, 240 ms), show `error` helper text "Check your details and try again", Error haptic. 5 failures: show a 30-second cooldown message. Biometric (Face ID / fingerprint) prompt offered after the first successful login, stored with `expo-local-authentication` and refresh token in `SecureStore`.
**States:** button shows spinner and keeps width while loading; inputs disabled; offline shows an info toast.
**Data:** `POST /auth/login {identifier, password}` returns `{accessToken, refreshToken, user}`. `POST /auth/otp/request {phone}`.

---

### P2b. Sign Up

**Route:** `app/(auth)/sign-up.tsx`. Same shell as P2a (header zone 200).

**Fields (order):** Full name · Phone (`+256` chip plus 9 digits, `keyboardType="number-pad"`, `maxLength:9`) · Email (optional) · Password (min 8, strength bar) · **Area** (opens P3 as a sheet) · Checkbox "I agree to the **Terms** and **Privacy Policy**" (links open P23).

**Password strength bar:** `height:4; borderRadius:2; flexDirection:'row'; gap:4` with 4 segments; filled segments colour by level: error, warning, yellow600, success.
**Validation (zod):** `phone: /^7\d{8}$/` (also accept `0` prefix and strip it), `password.min(8)`, `terms: literal(true)`.
**Submit:** `POST /auth/register`, then navigate to **P2c** with `{phone}`.

---

### P2c. OTP Verification

**Route:** `app/(auth)/otp.tsx`

| Element | Style |
|---|---|
| Top bar | back arrow, no title |
| Title | H1 "Verify your number" |
| Sub | body muted: "We sent a 6-digit code to `+256 7•• ••• 482`" (masked) |
| Code boxes | 6 `TextInput`s in a row: `flexDirection:'row'; justifyContent:'space-between'; gap:8`; box `flex:1; maxWidth:52; height:56; borderRadius:12; borderWidth:1.5; textAlign:'center'; fontFamily:Poppins 600; fontSize:22`. Focused: `borderColor:green500`. Filled: `backgroundColor:green50`. Error: `borderColor:error` |
| Resend | caption: "Resend code in 0:30" (disabled, muted) then text button "Resend code" |
| Primary | "Verify" (disabled until 6 digits) |

**Behaviour:** auto-advance and backspace-to-previous; paste of 6 digits fills all; iOS `textContentType="oneTimeCode"`, Android `autoComplete="sms-otp"` for SMS autofill. Auto-submit on the 6th digit. Wrong code: shake plus error text "That code isn't right". Attempts limited to 5. Success: Success haptic, go to P3 (first run) or Home.
**Data:** `POST /auth/otp/verify {phone, code}`; timer 30 s; code valid 10 min.

---

### P2d. Forgot / Reset Password

**Route:** `app/(auth)/forgot-password.tsx`. Steps in one screen with animated cross-fade (200 ms).
1. Input phone or email → "Send code" → 2. OTP boxes → 3. New password plus confirm (match check) → 4. Success state: 120 × 120 green check (SVG circle `r=56` stroke `green500` draws on 600 ms, tick draws 300 ms) and "Back to log in".

---

## 5. Page Specifications: Discovery

### P3. Area Selector

**Route:** `app/area-select.tsx` (modal, full screen on first run; `BottomSheetModal` at `90%` from the Home pill)

| # | Element | Style |
|---|---|---|
| 1 | Header | title H2 "Where do you need cleaning?"; close ✕ if not first run |
| 2 | Search input | standard input with a leading search icon; `marginHorizontal:16` |
| 3 | "Use my current location" row | `height:56; flexDirection:'row'; alignItems:'center'; gap:12; paddingHorizontal:16`; icon tile `40 × 40; radius:12; backgroundColor:green50`, crosshair icon green500 |
| 4 | `SectionList` | Section header `paddingVertical:8; paddingHorizontal:16; backgroundColor:bg; text caption 600 uppercase letterSpacing 0.5`. Row `height:52; paddingHorizontal:16; between`; selected row shows a green check (24) and `backgroundColor:green50` |
| 5 | Footer button | "Continue" (primary), disabled until an area is chosen |

**Sections:** Kampala Central, Nakawa, Makindye, Kawempe, Rubaga, Wakiso, Entebbe. Unserved items: opacity 0.6, trailing pill "Coming soon" (`yellow50`, text `yellow800`) and tapping opens the **Notify me** toast flow.
**Behaviour:** Location permission asked via `Location.requestForegroundPermissionsAsync()` after a pre-prompt explanation; reverse-geocode to the nearest served area, else show "We don't serve this area yet".
**Data:** `GET /areas`, `PUT /me {areaId}`; cache in TanStack Query for 24 h.

---

### P4. Home

**Route:** `app/(tabs)/index.tsx`

**Structure:** one `ScrollView` (`stickyHeaderIndices` not used; the hero scrolls away), with `RefreshControl` (tint `green500`).

| # | Block | Style / layout |
|---|---|---|
| 1 | Hero (`hero` style) | `paddingTop: insets.top + 12; paddingBottom: 64` |
| 1a | Top row | `between`. Left: greeting caption (white 80%, "Hello,") over name (Poppins 600 20, white). Right: bell (40 × 40 circle, `rgba(255,255,255,0.16)`, badge top-right 8 dp yellow dot) and avatar 40 |
| 1b | Area pill | `marginTop:12; alignSelf:'flex-start'; height:32; paddingHorizontal:12; borderRadius:16; backgroundColor:'rgba(255,255,255,0.16)'`; pin icon plus area name white 13/600 plus chevron-down. Opens P3 |
| 2 | Search bar (overlap) | `overlapCard` style; `height:52; borderRadius:16; backgroundColor:surface; paddingHorizontal:16; ...shadow.card`; search icon 20 muted; placeholder "What needs cleaning today?". It is a **button**: tap navigates to P5 (no keyboard here) |
| 3 | Continue draft card (if a draft exists) | `base.card` with a left accent `borderLeftWidth:4; borderLeftColor:yellow500`; "Continue your booking" and service name; "Resume" |
| 4 | Welcome offer banner (new users) | `LinearGradient yellow500 → yellow600`, `borderRadius:20; padding:16; flexDirection:'row'; overflow:'hidden'`; left text (H3 `green900`, caption), right decorative circle `120 × 120`, `position:absolute; right:-24; bottom:-24; backgroundColor:'rgba(255,255,255,0.35)'`; CTA chip green900 with yellow text |
| 5 | Trust strip | horizontal `ScrollView`, `gap:8`, `paddingHorizontal:16`; pill `height:36; paddingHorizontal:12; borderRadius:18; backgroundColor:surface; borderWidth:1; borderColor:border`, icon 18 green500 plus 13/600 text |
| 6 | "Most popular" | H2 plus "See all"; 2 × 2 grid using `flexWrap:'wrap'; gap:12`; each card `width: (windowWidth - 32 - 12) / 2; aspectRatio:1.05; borderRadius:20; overflow:'hidden'`, photo fills, gradient scrim bottom `transparent → rgba(28,65,30,0.85)`, title white 15/700, "From UGX …" caption white |
| 7 | Category rows (×5) | Header row (H2 plus "See all"), then horizontal `FlatList`, `contentContainerStyle:{paddingHorizontal:16, gap:12}`, `snapToInterval: 172`, card `width:160` (see Service card below) |
| 8 | Rebook card | `base.card`; avatar 48, cleaner name, last service and date; buttons row: "Book again" (small primary), "Same cleaner" (small secondary) |
| 9 | Upcoming booking card | See `BookingCard` in P15 |
| 10 | How it works | 3 columns `flex:1`, icon tile 48 (green50, green500 icon), title 13/600 centred, 2-line caption |
| 11 | Reviews carousel | cards `width: windowWidth × 0.78`, see `ReviewCard` in P21 |
| End | Spacer | `height: 64 + insets.bottom` (tab bar) |

**Service card (`ServiceCard`, width 160):**

```ts
card:  { width:160, backgroundColor:colors.surface, borderRadius:20, ...shadow.card, overflow:'hidden' },
image: { width:'100%', height:100 },                  // expo-image, blurhash
body:  { padding:12, gap:4 },
title: { ...text.bodyM, fontFamily:font.bodySemi },   // numberOfLines={2}, minHeight:40
price: { ...text.caption, color:colors.green700 },    // "From UGX 10,000/hr"
tag:   { position:'absolute', top:8, left:8, height:22, paddingHorizontal:8, borderRadius:11,
         backgroundColor:colors.yellow500 }           // "Popular", text green900 11/700
```

**Behaviour:** pull to refresh refetches `home`; skeletons while loading (banner 120, 4 grid cards, 3 row cards); tapping any service card navigates to `/service/[slug]`. Bell opens P27d.
**Data:** `GET /home?areaId=` returns `{ offer?, popular[], categories[], rebook?, upcoming?, reviews[], trust }`. Trust numbers come from `trust` (real counts only).

---

### P5. Search and Results

**Route:** `app/search.tsx`

- **Top:** back arrow plus autofocused input (`height:48; borderRadius:24`, clear ✕ button when text exists). Debounce 300 ms.
- **Before typing:** "Recent searches" (list, `Clear` text button) and "Popular" chips (`chip.pill`, wrap, gap 8).
- **Results:** `SectionList` with sections "Services" and "Cleaners". Service row: image 56 × 56 radius 12, name bodyM, caption "From UGX …", chevron. Highlight the matched substring with `fontFamily:bodySemi; color:green700`.
- **No results:** centred illustration 160, "We couldn't find that", Primary "Request a custom service" → P25.
- **Data:** `GET /search?q=&areaId=`; recent searches in MMKV or AsyncStorage (max 8).

---

### P6. Services (Browse)

**Route:** `app/(tabs)/services.tsx`

| # | Element | Style |
|---|---|---|
| 1 | Header | white, `paddingTop: insets.top + 8`; title H1; search button (as P4 #2 but flat with border) |
| 2 | Category chip bar (sticky) | horizontal `ScrollView`, `paddingHorizontal:16; gap:8; height:56; backgroundColor:bg; zIndex:sticky`. Chip `chip.pill` height 36. Active: green500 fill |
| 3 | Sections | For each category: H2 title and 2-column grid (`flexWrap`, `gap:12`, tile `(windowWidth - 44) / 2`) |
| Tile | `ServiceTile` | `borderRadius:20; backgroundColor:surface; ...shadow.card; padding:12; gap:8`; icon illustration 56 (green outline, yellow fill), title 15/600, caption price, optional "Popular" tag |

**Behaviour:** tapping a chip animates scroll to that section (`scrollTo`, 300 ms); scroll position updates the active chip using each section's `onLayout` Y offsets. Use `FlashList` with section headers if the catalogue exceeds about 40 items.

---

### P7. Service Landing Page

**Route:** `app/service/[slug].tsx`

Container: `ScrollView` with `onScroll` (16 ms throttle) driving a shared value `scrollY` for the header and the sticky bar.

| # | Block | Spec |
|---|---|---|
| 1 | Hero | `height:260 + insets.top`; `expo-image` cover; `LinearGradient` scrim `rgba(28,65,30,0.15) → rgba(28,65,30,0.75)` absoluteFill; back and share buttons `40 × 40` circles `rgba(255,255,255,0.9)` at `top: insets.top + 8`. Title H1 white and rating chip over the bottom-left (`left:16; bottom:24`). Parallax: `translateY = scrollY × 0.5` clamped, image scale 1 → 1.15 on overscroll |
| 2 | Offer stamp | `position:absolute; right:16; bottom:-28; width:76; height:76; borderRadius:38; backgroundColor:yellow500; borderWidth:3; borderColor:surface; alignItems:'center'; justifyContent:'center'; ...shadow.card`. Text: "20% off" 14/800 `green900`, "first clean" 9/600. Rotated `-8deg` |
| 3 | Body sheet | `marginTop:-20; backgroundColor:bg; borderTopLeftRadius:28; borderTopRightRadius:28; paddingTop:24; gap:24` |
| 4 | Short intro | body L muted, max 3 lines with "Read more" |
| 5 | Trust strip | as P4 #5 |
| 6 | "What's included" | `base.card`; two columns of checklist rows (`gap:10`): tick icon 20 `success` and text 14. "Not included" sub-heading with x icon (muted) |
| 7 | Pricing table | `base.card`; header row (caption 600 muted), rows: label left, value right (tabular). Zebra `backgroundColor:green50` on odd rows. Notes caption below: materials, VAT |
| 8 | Add-ons row | horizontal list, card `width:220; padding:12; borderRadius:16; borderWidth:1; borderColor:border`. Icon 40, title 14/600, "+30 min · +UGX 5,000" caption |
| 9 | How it works | vertical timeline: circles 32 `green500` (number white 14/700), connecting line `width:2; backgroundColor:green100`, content gap 16 |
| 10 | Reviews summary + 3 cards | Summary row: big number Poppins 700 40, star row 20, count caption; "Read all reviews" → P21 |
| 11 | FAQ accordion | Item: `padding:16; between`; title 15/600; chevron rotates `0 → 180°` 200 ms; content animates height with `LayoutAnimation` or Reanimated `Layout`; only one open at a time; divider hairline between items |
| 12 | Related services | horizontal `ServiceCard` row |
| End | Spacer | `height: 72 + insets.bottom + 16` |
| Bar | Sticky Book bar | `summaryBar` style, but left shows "From" caption plus `UGX 10,000/hr` (price style) and right the **Book now** button. Appears (`translateY 80 → 0`, 250 ms) when `scrollY > 220` |

**Behaviour:** Book now → `/book/[slug]/details` (creates the draft with the service slug, applies the active promo). Share uses `Share.share` with the deep link. Header title fades in on scroll (opacity `scrollY` 180 to 240).
**Data:** `GET /services/{slug}?areaId=` returns `{ content, pricing, addOns[], faq[], reviewSummary, related[] }`.

---
## 6. Page Specifications: Order Flow

### 6.0 Shared Shell (all order pages P8 to P12)

**Routes:** `app/book/[slug]/{details,add-ons,schedule,location,review}.tsx` inside a `Stack` with `presentation:'modal'` on iOS and `animation:'slide_from_right'` on Android. Tab bar hidden.

**State:** one persisted zustand store `useBooking` (`BookingDraft` from 3.5) plus a derived `price` selector. Each page reads and writes the store only; there is no prop drilling.

```ts
export const useBooking = create<BookingState>()(persist((set, get) => ({
  draft: null as BookingDraft | null,
  start:  (slug) => set({ draft: { serviceSlug: slug, details:{cleaners:1,hours:4,frequency:'once',materials:false}, addOns:[] } }),
  patch:  (p)    => set({ draft: { ...get().draft!, ...p } }),
  reset:  ()     => set({ draft: null }),
}), { name:'booking-draft', storage: createJSONStorage(() => AsyncStorage) }));
```

**Top bar:** `height:56`, white. Back arrow left (hitSlop 12), title centred (H3, one line), ✕ right. ✕ opens an `Alert`-style sheet: "Save as draft?" with **Save draft** (primary) and **Discard** (destructive text). Android hardware back triggers the same prompt on page 1, and navigates back on later pages.

**Stepper header (`StepperHeader`):** `height:64; paddingHorizontal:16; flexDirection:'row'; alignItems:'flex-start'; backgroundColor:surface`.

```ts
stage:   { flex:1, alignItems:'center', gap:4 },
circle:  { width:28, height:28, borderRadius:14, alignItems:'center', justifyContent:'center',
           backgroundColor:colors.border },                       // upcoming
circleActive: { backgroundColor:colors.green500, borderWidth:3, borderColor:colors.yellow500 },
circleDone:   { backgroundColor:colors.green500 },                // check icon white 16
connector:{ position:'absolute', top:13, left:'50%', right:'-50%', height:2, backgroundColor:colors.border },
connectorDone: { backgroundColor:colors.green500 },
label:   { ...text.caption, fontSize:12 }, // active: color green700, fontFamily bodySemi
```
Labels: Details · Schedule · Location · Confirm. (Add-ons belong to "Details".) Tapping a **completed** stage navigates back to it; tapping future stages does nothing.

**Scroll area:** `ScrollView` with `keyboardShouldPersistTaps="handled"`, `contentContainerStyle={{ padding:16, paddingBottom: 72 + insets.bottom + 24, gap:24 }}`.

**Summary bar (`SummaryBar`):** see 2.2. The total uses `text.price` and animates between values (Reanimated `withTiming` on a shared value, formatted on the JS thread every frame via `useDerivedValue` plus `ReText`, or a simple 200 ms count-up). Chevron-up opens the Summary Sheet (below).

**Summary Sheet (`SummarySheet`, `BottomSheetModal` snap `60%` and `90%`):**
- Header "Your booking" H2 with close.
- Rows: each `Pressable` `minHeight:48; between`, label caption muted, value body right-aligned (numberOfLines 2). Tapping a row routes to the page that edits it. Missing values show "—" in `textMuted`.
- Rows: Service · Cleaners · Hours · Materials · Add-ons · Date and time · Location · then the **price breakdown** (`PriceRow`s) and **Total** (`price` text, top border `hairline`).
- If the plan has a deposit: extra lines **Pay now** and **Pay after service**.

**Components (reused):**

```tsx
// ChipSelector: single-select chips
<Pressable accessibilityRole="radio" accessibilityState={{selected}}
  style={[chip.base, selected && chip.selected, disabled && chip.disabled]}
  onPress={()=>{ Haptics.selectionAsync(); onChange(value); }}>
  <Text style={[text.bodyM, {fontFamily:font.bodySemi}, selected && {color:'#fff'}]}>{label}</Text>
  {tag && <View style={popularTag}><Text style={popularText}>{tag}</Text></View>}
</Pressable>
// popularTag: position:'absolute', top:-9, alignSelf:'center', height:18, paddingHorizontal:8,
//             borderRadius:9, backgroundColor:colors.yellow500   (text green900 10/700)

// CounterStepper
//  wrapper: between, minHeight:56
//  button: width:44, height:44, borderRadius:22, borderWidth:1.5, borderColor:green500, center
//  value:  minWidth:40, textAlign:'center', Poppins 600 18
//  disabled at min/max: borderColor border, icon disabledText. Long-press repeats every 120 ms after 400 ms.

// SelectableCard (radio left): selectable.card, selected -> selectable.selected
//  radio: 22 × 22 circle, borderWidth 2 (border or green500); inner dot 10 × 10 green500
//  discount tag: position:absolute, top:12, right:12, height:24, paddingHorizontal:10, radius 12, yellow500 bg, green900 text 12/700

// SegmentedControl: track height:48, borderRadius:14, backgroundColor:disabledBg, padding:4, row
//  thumb: absolute, height:40, borderRadius:11, white, shadow.card; translateX animates 180 ms
//  labels: flex:1, center; active green700 600; inactive textMuted 500
```

---

### P8. Order: Job Details

**Route:** `/book/[slug]/details`

**Layout:** exactly the wireframe in Part 1, Section 15.2. Spacing between question groups `gap:24`; question label (`text.h3`) to control `gap:12`.

| Control | Spec |
|---|---|
| Cleaners | `ChipSelector` values 1 to 4, row `flexDirection:'row'; gap:8`, each chip `flex:1` |
| Hours | horizontal `ScrollView`, `contentContainerStyle:{gap:8, paddingTop:10}` (room for the Popular tag), chips 2 to 8, **4** has tag "Popular"; helper caption below: "Longer bookings cost less per hour" with info icon |
| Frequency | 3 `SelectableCard`s, `gap:12`. Card content: title (bodyM 600), sub-line, benefit rows (green tick 16 plus caption). Discount tags: "10% off", "15% off" |
| Materials | `SegmentedControl` options "No" and "Yes, +UGX 3,000/hr". Caption below lists what is included |
| Instructions | multiline input (height 120), counter caption right-aligned "0/300", `maxLength:300` |

**Behaviour:**
- Defaults: cleaners 1, hours 4 (Popular), frequency once, materials No.
- Total recalculates on every change; frequency discount line appears in the summary sheet immediately.
- Selecting weekly or multi shows an inline success banner (`successBg`, 12 radius, 12 padding): "You'll get the same cleaner each time."
- **Next** is always enabled (all fields have defaults) and goes to P9.
- Services with different fields (Part 1, 15.10) swap the control group from a **config object** (`serviceForms[slug]`), not from separate screens: `{ id, type:'counter'|'chips'|'cards'|'segmented'|'text'|'photo', label, options, min, max, priceEffect }`.

**Data:** `GET /services/{slug}/form` supplies the control config, prices and rates, cached 1 h.

---

### P9. Order: Add-ons

**Route:** `/book/[slug]/add-ons`. Intro caption "Each extra adds 30 minutes."

**`AddOnCard`:**
```ts
card:{ ...selectable.card, alignItems:'flex-start' },
icon:{ width:56, height:56, borderRadius:16, backgroundColor:colors.green50, center },   // icon 28 green500
body:{ flex:1, gap:4 },
meta:{ ...text.caption, color:colors.green700 },          // "+30 min · +UGX 5,000"
checkbox:{ width:24, height:24, borderRadius:7, borderWidth:2, borderColor:colors.border },
checkboxOn:{ backgroundColor:colors.green500, borderColor:colors.green500 }, // check icon white 16
link:{ ...text.caption, color:colors.green500, fontFamily:font.bodySemi }     // "What's included"
```
**Behaviour:** tapping anywhere on the card toggles (checkbox is visual). "What's included" opens a bottom sheet (snap 50%) with two lists: Included and Not included. The summary bar subtitle shows duration (`4.5 h`). **Next** is always enabled. Add-on prices come from `cfg.addOns`.
**Edge:** if the total duration would exceed 8 hours, show a warning banner ("Long bookings may need two cleaners") and offer "Add a cleaner" (sets `cleaners+1`).

---

### P10. Order: Schedule

**Route:** `/book/[slug]/schedule`

**Month header:** `between`; text H3 "November 2026"; chevron buttons 40 × 40.

**`DateStrip`:** horizontal `FlatList`, 30 days from today (or the earliest bookable day), `snapToInterval: 64` (tile 56 + gap 8), `contentContainerStyle:{paddingHorizontal:16, gap:8}`.
```ts
dateTile:      { width:56, height:72, borderRadius:16, borderWidth:1.5, borderColor:colors.border,
                 backgroundColor:colors.surface, alignItems:'center', justifyContent:'center', gap:2 },
dateTileOn:    { backgroundColor:colors.green500, borderColor:colors.green500 },   // text white
dateTileToday: { borderColor:colors.green500 },
dateTileOff:   { opacity:0.4 },
dow:           { ...text.caption },                                  // "Thu"
dom:           { fontFamily:font.heading, fontSize:20 },             // "19"
dot:           { width:6, height:6, borderRadius:3, backgroundColor:colors.yellow500, marginTop:2 }, // selected only
```
"Pick another date" opens a bottom sheet with a month calendar (`react-native-calendars`, theme: `selectedDayBackgroundColor:green500`, `todayTextColor:green500`), identical on both platforms.

**`SlotChips`:** `flexDirection:'row'; flexWrap:'wrap'; gap:8`; chip `width: (windowWidth - 32 - 16) / 3; height:44; borderRadius:12`. Available: `backgroundColor:green50; borderWidth:1.5; borderColor:green100`, label bodyM. Selected: green500 fill, white label. Full: `backgroundColor:disabledBg`, label `disabledText` with `textDecorationLine:'line-through'`. Low availability: tiny caption "Few left" in `warning` colour under the label (height grows to 52 for the row).

**Behaviour:**
- Slots load when the date changes (`GET /availability?service=&areaId=&date=`); skeleton chips while loading.
- Start times 7:00 am to 4:00 pm, hourly (dummy; driven by the API). Times display in EAT, 12-hour.
- Same-day: if the first slot is less than 3 hours away, it is hidden. Info note "Same-day requests depend on cleaner availability."
- If `frequency !== 'once'`: show a **Repeat summary card** (`infoBg`, radius 16, padding 12) "Every Thursday at 10:00 am, starting 19 Nov". Optional "End date" (date sheet).
- Info banner always visible: "Free to change or cancel up to 24 hours before" (info colour, clock icon).
- **Next** is disabled until a date and a slot are chosen.

---

### P11. Order: Location and Contact

**Route:** `/book/[slug]/location`

| # | Block | Spec |
|---|---|---|
| 1 | Saved addresses | `SelectableCard` list; card: label chip (Home, Work, Other, `chip.pill`), area and street, `numberOfLines:2`. Last row: "＋ Add new address" (dashed border `borderStyle:'dashed'`, `borderWidth:1.5`, `borderColor:green500`, green500 label) opens the **Address Sheet** (P24) |
| 2 | Map preview | `height:160; borderRadius:20; overflow:'hidden'`; `MapView` with `scrollEnabled={false}`, centre pin 40 dp (custom marker, green500 with yellow dot), tap to expand full-screen map with a draggable pin and **Confirm location** button |
| 3 | Property type | `ChipSelector` row: Apartment, House, Office |
| 4 | Area | Input opening P3 sheet (read-only field with chevron) |
| 5 | Street, building, house no. | Input (required) |
| 6 | Landmark or directions | Input, multiline 80, helper "e.g. Near Shell petrol station, blue gate" (prominent, not collapsed) |
| 7 | Access instructions | Input, optional |
| 8 | Contact section | H3 "Contact details"; Name (required), Phone (`+256` chip, 9 digits, required); Checkbox "Someone else will be home" reveals extra name and phone fields (animated height 200 ms) |

**Behaviour:** pre-fill from the profile and the default address. Location permission is requested **only on this page** after a pre-prompt sheet ("We use your location to place the pin and match nearby cleaners": **Allow** / **Not now**). Pin drag reverse-geocodes to area and street (`Location.reverseGeocodeAsync`), fields stay editable. If the pin or chosen area is outside the served areas, show an `errorBg` banner "We don't serve this area yet" with **Notify me**, and disable **Next**.
**Validation (zod):** `area`, `street.min(3)`, `contactName.min(2)`, `contactPhone: /^7\d{8}$/`.
**Keyboard:** `KeyboardAvoidingView` plus auto-scroll to the focused field via `scrollToFocusedInput`; `returnKeyType="next"` chain, last field "done".

---

### P12. Order: Review and Pay

**Route:** `/book/[slug]/review`. This is the page that implements the **payment model (Section 3)**.

| # | Block | Spec |
|---|---|---|
| 1 | Summary card | `base.card`; header row (service title H3, **Edit** text button); rows of caption/value; each **Edit** deep-links to the relevant page with `returnTo=review` |
| 2 | Promo | Row: input (flex:1) plus **Apply** (small secondary, 40 high). Applied state: input replaced by a `successBg` chip "WELCOME20 · −UGX 7,650" with ✕ remove. Invalid: `error` helper text |
| 3 | Price details | `base.card`; `PriceRow`s: Cleaning (2 × 4 h × UGX 10,000), Materials, Add-ons, Frequency discount (−), Promo (−), VAT (18%), divider, **Total** (`text.price`). `PriceRow`: `between; minHeight:28`; amount tabular; discounts `color:success` |
| 4 | **Payment plan** | H3 "When would you like to pay?" Three `SelectableCard`s: **Pay in full now** (sub: "UGX 68,xxx today"), **Pay a deposit now** (sub: "Pay part now, the rest after the service"), **Pay after service** (sub: "Nothing today"). Default: **Pay a deposit now** |
| 4a | Deposit controls (visible when plan = deposit) | Row of `chip.pill` options **30%**, **50%**, **Custom**; Custom reveals a numeric input with `UGX` prefix. Below, a **split bar**: `height:10; borderRadius:5; backgroundColor:green100; flexDirection:'row'`, filled part `backgroundColor:green500; width = D/total`. Two labelled rows: **Pay now** (UGX D) and **Pay after service** (UGX total − D). Validation messages: "Minimum deposit is UGX 20,000 or 30%" |
| 5 | **Pay now with** (plan = full or deposit) | H3 "Pay now with". Three tiles (3.4): **MTN Mobile Money**, **Airtel Money**, **Visa card**. Selected tile gets the selectable-selected style plus a green check. Hidden when plan = after service |
| 5b | **Pay after the service with** (plan = deposit or after service) | H3 "Pay the rest after the service with" (or "Pay after the service with" when the plan is after service). Four tiles: **MTN Mobile Money**, **Airtel Money**, **Visa card**, **Cash**. Default for a deposit plan: same as "Pay now with". Hidden when plan = full now |
| 5a | Method detail | MoMo or Airtel: phone input prefilled (`+256`, 9 digits) with helper "You'll get a prompt on this number". Visa: saved cards list plus "＋ Use a new card" (opens the hosted page at pay time), and checkbox "Save this card". **Cash**: no extra fields, helper "Please have UGX X ready for your cleaner. Your cleaner confirms receipt in their app." |
| 6 | Info banner | `infoBg`: plan-specific text. Examples: "You'll pay UGX 20,400 now and UGX 47,600 in cash after the service." / "You won't be charged until the service is done." / "You'll pay UGX 68,xxx in cash to your cleaner." |
| 7 | Consent | Checkbox: "I agree to the **Terms** and the **cancellation policy**". Required (also covers the late-fee charge) |
| Bar | Sticky bar | Left: caption "Pay now" and the amount due today (`UGX 0` for pay after service). Right: **Confirm booking** |

**Button label and action by plan:**
- Full now or Deposit: label **"Pay UGX X and confirm"** (the amount shown is due today).
- After service (any method, including Cash): label **"Confirm booking"**.
- Cash is never offered in the "Pay now with" group. If the customer picks plan **Pay after service** and **Cash**, no digital payment method is saved, and the consent line also states that unpaid late fees may be added to their account.

**Submit sequence:**
1. Validate consent, method detail and (if relevant) deposit range.
2. `POST /bookings` with the draft returns `{ bookingId, priceBreakdown }`. If the server total differs from the client total by more than UGX 1, show a "Price updated" sheet with the new breakdown before continuing.
3. If amount due today is 0 (pay after service, with any method including Cash) → go to **P14**.
4. Else `POST /payments {bookingId, kind:'deposit'|'full', method, phone?}` → go to **P13** with `paymentId`.

**States:** button loading spinner; double-tap guard (ignore taps while pending, with an idempotency key `Idempotency-Key: bookingDraftId`); network failure keeps the draft and shows a retry toast.

---

### P13. Payment Authorisation (Mobile Money and Card)

**Route:** `app/payment/[id].tsx` (modal, gesture back disabled while waiting). **Not used for Cash** (there is nothing to authorise in the app).

| State | Layout |
|---|---|
| **Waiting (MoMo / Airtel)** | Centre column, `gap:16; paddingHorizontal:24`. Illustration: phone icon 96 inside a ring, ring pulsing (`scale 1 → 1.25`, `opacity 0.5 → 0`, 1.4 s loop, `green500`). H2 "Approve the payment on your phone". Body: "We sent a prompt to **+256 77• ••• 482** for **UGX 20,400**." Countdown caption "2:00" (monospace via `tabular-nums`). Steps card (3 lines): "1. Check your phone for the prompt · 2. Enter your PIN · 3. Wait here for confirmation". After 30 s: secondary button "Resend prompt" (limit 2). Text button "Use another method" |
| **Verifying (Visa)** | Same layout, ring replaced by a shield icon, text "Confirming your card payment…" |
| **Approved** | Green check draws on (600 ms) inside a yellow ring, Success haptic, auto-advance to P14 after 1.2 s |
| **Declined or timed out** | `errorBg` panel with icon, reason text from the API, buttons **Try again** (primary), **Choose another method** (secondary) |

**Technical:**
- Poll `GET /payments/{id}` every 3 s with `refetchInterval`, stop at `status ∈ {paid, failed}` or at 120 s.
- If the app goes to the background and the push arrives, deep link to this screen with the result.
- Visa: `WebBrowser.openAuthSessionAsync(hostedUrl, 'gabfix://payment/return')`; handle `dismiss` and `cancel` as "Payment cancelled".
- Prevent screen sleep with `expo-keep-awake` while waiting.

---

### P14. Booking Confirmed

**Route:** `app/book/[slug]/confirmed.tsx?bookingId=`; `reset()` the draft on mount.

| # | Element | Style |
|---|---|---|
| 1 | Check animation | `width:120; height:120`, outer ring `yellow500` 6 dp, inner circle `green500`; SVG tick `strokeDasharray` animates 600 ms; Success haptic |
| 2 | Title | H1 "You're booked!" centred; booking ID caption `GBX-20481` with copy icon |
| 3 | Summary card | `base.card`: service, date and time, location, cleaners and hours, **Paid today** and **Balance after service** lines (when relevant) |
| 4 | What happens next | Vertical timeline of 3 steps (circle 24, line 2): "We match you with a cleaner" · "You get a reminder 24 hours before" · "Your cleaner arrives" |
| 5 | Actions | Primary "View booking" → P15 detail; secondary "Add to calendar" (`expo-calendar`, creates an event with a 1 h reminder); ghost "Back to home" |

**Behaviour:** ask for notification permission here (pre-prompt), schedule local reminders (24 h and 2 h before) as a fallback if push is unavailable.

---

## 7. Page Specifications: Booking Management

### P15a. My Bookings

**Route:** `app/(tabs)/bookings.tsx`

- Header H1 "Bookings". Tabs (custom segmented, 3 items): **Upcoming · Completed · Cancelled**, plus a fourth **Plans** (P17) when the user has recurring bookings. Tabs `height:44; borderBottomWidth:2` active green500; indicator animates (180 ms).
- `FlashList` (`estimatedItemSize:168`), `contentContainerStyle:{padding:16, gap:12}`, pull to refresh.
- **`BookingCard`:** `base.card; gap:12`. Row 1: `StatusChip` left, booking ID caption right. Row 2: service title H3. Row 3: calendar icon 16 plus date/time, pin icon 16 plus area (caption, muted). Row 4: avatar 32 plus cleaner name. Payment row: **Balance due UGX 47,600** pill (warning) with **Pay now** small button (digital methods) or, for Cash, a **"Pay UGX 47,600 in cash"** pill (warning, banknote icon) without a button, or a "Paid" chip. Action row: **Track** (primary small, when confirmed to in progress), **Reschedule** (secondary small), **Book again** (completed).
- Empty state per tab: illustration plus CTA.

### P15b. Booking Details

**Route:** `app/booking/[id].tsx`

Sections: (1) status banner (colour by status, `borderRadius:20; padding:16`); (2) **Balance due card** when `paymentStatus==='balance_due'` (`warningBg`; amount). For MTN, Airtel or Visa: **Pay balance** (primary). For **Cash**: a **Cash due card** (same container, banknote icon 28 in a `yellow200` circle 48): title "Pay UGX 47,600 in cash to your cleaner", caption "Your cleaner confirms receipt in their app", secondary button **Pay online instead** (opens a method sheet with MTN, Airtel, Visa, then P13) and a ghost link **Report a problem**. When the cleaner confirms, the card turns into a `successBg` "Cash received" card (UGX amount, time) ; (3) service summary (as P14 card); (4) cleaner card (avatar 48, name, rating, "Verified" gold badge, **Call** and **Chat** icon buttons 44 × 44); (5) **Edit extras** row (adds or removes add-ons until 24 h before; price changes create an additional amount); (6) payment summary (plan, method, paid, outstanding, receipt link); (7) action list: Reschedule, Cancel, Get help.
**Pay balance (digital):** reuses P13 with `kind:'balance'`. **Cash:** no payment screen; status updates through push and polling `GET /bookings/{id}` every 15 s while the card is on screen.

### P15c. Live Tracking

**Route:** `app/booking/[id]/track.tsx`

- Full-bleed `MapView` (`StyleSheet.absoluteFill`), cleaner marker (circle 44, green500 border, avatar), destination marker, polyline (`strokeColor:green500; strokeWidth:4`).
- Bottom card (`position:absolute; bottom:0; borderTopRadius:28; padding:16 + insets.bottom; ...shadow.floating`): ETA H2 "Arriving in 12 min", progress timeline (4 dots: Confirmed, On the way, In progress, Completed; completed dots green, active yellow ring), cleaner row with Call and Chat.
- Data: WebSocket `/ws/bookings/{id}` for location and status; fall back to polling every 10 s. Map camera `fitToCoordinates` with padding `{top:80,right:40,bottom:320,left:40}`.

---

### P16. Reschedule, Cancel and Late-Fee Warning

**Reschedule sheet (`BottomSheetModal`, 90%):** title, `DateStrip`, `SlotChips` (as P10), policy banner (green "Free change" or amber late-fee banner). Button "Confirm new time" (`PATCH /bookings/{id}/schedule`). Deposit stays.

**Cancel flow:** sheet (75%): booking mini-summary, **reason chips** (`chip.pill`, single select: Change of plans, Found another service, Booked by mistake, Price, Other; "Other" reveals a text input). **Policy panel:** more than 24 h before → `successBg` "Free cancellation. Your deposit of UGX X will be refunded to MTN Mobile Money (3 to 5 working days)". Within 24 h → **late-fee warning** (below). Cash bookings within 24 hours: the panel says "A late fee of UGX X will be added to your account and must be paid before your next booking." Buttons: **Keep booking** (primary) above **Cancel booking** (destructive ghost text). After success: full screen with check, refund line, "Book again".

**Late-fee warning (`LateFeeBanner`):** `backgroundColor:warningBg; borderRadius:16; padding:12; flexDirection:'row'; gap:10`; icon `alert-triangle` 20 `yellow800`; text caption `yellow800`: "This is within 24 hours. A late fee of UGX X applies." Checkbox "I understand" must be ticked to enable the destructive button.

### P17. Recurring Plans

**Route:** `app/booking/plans.tsx` (also the **Plans** tab)
- `PlanCard`: frequency pill, service, "Every Thursday · 10:00 am", cleaner avatar, next visit date, discount tag, overflow ⋯.
- Actions (sheet): **Skip next visit** (`POST /plans/{id}/skip`), **Pause** (choose resume date), **Change day or time**, **Request a different cleaner**, **End plan** (destructive, confirm).
- Rule copy: "Same cleaner for every visit". If unavailable: info banner "We'll arrange the best match and let you know."

### P18. Rebook and Same Cleaner

On completed cards and on Home: **Book again** → creates a draft copying `details`, `addOns`, `location`, `payment.method` then opens **P10 Schedule** with the stepper at stage 2 and earlier stages marked done. **Book same cleaner** adds `preferredCleanerId`; availability call filters by that cleaner and shows "Not available? We'll suggest similar cleaners" when no slot is returned.

### P19. Receipt / Invoice

**Route:** `app/booking/[id]/receipt.tsx`
- Layout: white card, `padding:20; borderRadius:20`; header (logo 40, "Gabfix", booking ID, date); status chip; itemised price rows (same as P12); payments list (each payment: kind (Deposit / Balance / Full), method (including **Cash**, shown as "Cash, received by <cleaner first name>"), amount, date, reference); **Total paid** and **Outstanding**.
- Actions: **Share** (`expo-print` renders HTML to PDF, `expo-sharing` shares), **Download**, **Report a problem**.
- Generate PDF from an HTML template with the same tokens (fonts embedded as base64).

---
## 8. Page Specifications: Supporting Pages

### P20. Offers, Promo Codes and Refer and Earn

**Route:** `app/profile/promos.tsx`, `app/refer.tsx`

- **Offer card:** `borderRadius:20; overflow:'hidden'; height:140; flexDirection:'row'`. Left (`flex:1; padding:16; backgroundColor:yellow50`): title H3, caption expiry, code chip (`borderStyle:'dashed'; borderWidth:1.5; borderColor:yellow600; paddingHorizontal:10; height:28; radius:8`) with copy icon (`Clipboard.setStringAsync`, toast "Code copied"). Right: image `width:120`. Button "Use now" applies the code to a new draft.
- **Refer and earn:** hero `LinearGradient yellow500 → yellow600`, big code in a white pill (`Poppins 700 24`, letterSpacing 2), buttons **Share on WhatsApp** (`Linking.openURL('whatsapp://send?text=…')`, fallback `Share.share`) and **Share via SMS**. Progress list: invited, joined, first booking done, reward earned (UGX, dummy values).

### P21. Reviews List

**Route:** `app/service/[slug]/reviews.tsx`, and a reviews section for cleaners.

- **Summary header:** big average (Poppins 700 44), star row (20, `yellow600`), count; 5 distribution bars: label 12, bar `height:8; borderRadius:4; backgroundColor:green100`, fill `green500`, count caption.
- **Filter chips:** All, 5 stars, With comments, Most recent.
- **`ReviewCard`:** `base.card; gap:8`. Header: initials avatar (`width:40; height:40; borderRadius:20; backgroundColor:green100`, initials `green900` Poppins 600 14), name "Nuray L." (bodyM 600), date caption right. Star row 16. Comment body, `numberOfLines:4` with **Read more**. Footer: tag "Verified booking" (`chip.pill`, `green50`, check icon). Cleaner reply: indented block `marginLeft:16; paddingLeft:12; borderLeftWidth:2; borderLeftColor:green100`.
- `FlashList`, cursor pagination (`GET /reviews?cursor=`).

### P22. Help Centre, FAQ and Contact

**Route:** `app/help/index.tsx`, `faq.tsx`, `contact.tsx`

- Search input (filters FAQ client-side), "Top questions" (5 accordions), topic grid (2 columns, tile `height:96`, icon 28, label): Booking, Pricing, Add-ons, Payments, Cancellation, Safety.
- **Contact card:** four rows (`height:56`) with icon tiles: **Call** (`Linking.openURL('tel:…')`), **WhatsApp** (`https://wa.me/<number>`), **Chat** (in-app, P27c), **Email** (`mailto:`). Support hours caption.
- Floating "Need help?" button on Booking details: `position:absolute; right:16; bottom: insets.bottom + 16; height:48; paddingHorizontal:16; borderRadius:24; backgroundColor:green900`, white label and yellow icon.

### P23. Policies

**Route:** `app/policies/[doc].tsx` (`terms`, `privacy`, `payments-refunds`). Top "Summary in plain words" card (`green50`, 5 bullet lines), then `react-native-webview` with the full text (`originWhitelist={['*']}`, injected CSS using the app fonts and `max-width:100%`). Show a progress bar (`height:2; backgroundColor:green500`) while loading.

### P24. Saved Addresses and Address Sheet

**Route:** `app/addresses.tsx`; sheet used by P11.
- List card: label chip, area and street, default marker (yellow dot plus "Default"), ⋯ menu (Edit, Set as default, Delete). iOS swipe-to-delete via `ReanimatedSwipeable`, Android long-press menu; the ⋯ menu always exists.
- **Address form:** label chips (Home, Work, Other), map (height 200) with draggable pin, then the P11 fields (area, street, landmark, access). **Save address** primary.
- Deleting the default prompts to choose a new default.

### P25. Quote Request (Office and Specialised)

**Route:** `app/quote/[slug].tsx`
- Form: service (read-only), property type, **size** (chips: Small, Medium, Large or numeric sq m), frequency (chips), preferred start date (date sheet), contact (prefilled), up to **5 photos** (`expo-image-picker`; grid of 72 × 72 thumbnails, radius 12, ✕ remove).
- Submit → `POST /quotes` (multipart). Success screen: "We'll reply within 24 hours" (dummy). Appears in **Bookings → Requests**.
- Quote reply (push plus card): amount, validity, **Accept** → opens P10 with the quoted price locked (`draft.lockedPrice`).

---

## 9. Page Specifications: Account and Engagement

### P27a. Cleaner Profile

**Route:** `app/cleaner/[id].tsx`. Cover image 180, avatar 80 overlapping (`marginTop:-40; borderWidth:4; borderColor:surface`), name H1, **Verified** gold badge (`LinearGradient yellow500 → yellow600`, shield-check icon, text green900 12/700), stats row (3 columns: rating, jobs done, years), languages chips (English, Luganda, Swahili), skills chips, reviews (P21 compact), sticky **Book this cleaner** bar (`preferredCleanerId`).

### P27b. Payments and Wallet

**Route:** `app/(tabs)/profile/payments.tsx`
- **Balance-due card** (only if any): `warningBg`, total outstanding, list of bookings with **Pay** per row.
- **Methods:** saved cards (brand, last 4, expiry; **Remove**), saved Mobile Money numbers (MTN, Airtel; masked). "＋ Add method". Cash is not a saved method; a caption notes "Cash is paid to your cleaner after the service."
- **Account balance card** (only if a cash late fee is owed): `errorBg`, amount, **Pay now** (MTN, Airtel, Visa only). New bookings are blocked until it is cleared.
- **Transactions list:** row `height:64`; icon tile (deposit, balance, refund), title (Deposit · Home cleaning), caption date and method, amount right (refunds green with `+`, payments default). Filters: All, Deposits, Balances, Cash, Refunds. Cash rows use the banknote icon and show "Cash · confirmed by cleaner".
- Tap a row opens P19 for that booking.

### P27c. Messages and Support Chat

**Route:** `app/(tabs)/messages.tsx`, `app/chat/[threadId].tsx`
- List: avatar 48, name, last message (1 line), time, unread badge (yellow500 circle 20).
- Thread: `FlashList inverted`; bubbles `maxWidth:'78%'; padding:12; borderRadius:18`; sent: `backgroundColor:green500`, white text, `borderBottomRightRadius:4`, aligned right; received: white with border, `borderBottomLeftRadius:4`. Time caption below groups. Composer: `minHeight:56 + insets.bottom; flexDirection:'row'; alignItems:'flex-end'; gap:8; padding:8`; input `flex:1; maxHeight:120; borderRadius:22; backgroundColor:bg; paddingHorizontal:16`; send button `44 × 44` circle green500 (disabled when empty). Quick-reply chips above the composer (support threads).
- Realtime via WebSocket, optimistic send with "Sending…" then "Sent" tick; image attach optional.

### P27d. Notifications

**Route:** `app/notifications.tsx`. `SectionList` with sections "Today" and "Earlier". Row `padding:16; flexDirection:'row'; gap:12`; icon tile 40 (`green50`), title bodyM 600, body caption, time right; unread: left dot 8 `yellow500` and `backgroundColor:yellow50`. Swipe to mark read. Tapping deep links to the booking. "Mark all as read" header action.

### P27e. Profile and Settings

**Route:** `app/(tabs)/profile/index.tsx`
- Header: avatar 80 (tap to change via image picker), name H2, phone caption, **Edit profile**.
- Refer-and-earn card (yellow gradient).
- Grouped list (`base.card` per group; row `height:56; between; paddingHorizontal:16`, leading icon tile 36, trailing chevron): **Account** (Personal details, Saved addresses, Payment methods), **Preferences** (Language, Notifications toggles with `Switch trackColor={{true:green500}}`, Biometric login), **Support** (Help centre, Contact us, Rate the app), **Legal** (Terms, Privacy, Payment and refund policy), **Log out** (destructive text).
- Delete account in a confirm sheet (data-protection requirement).
- Version caption at the bottom (`Constants.expoConfig.version`).

### P27f. Rate and Review

**Route:** `app/booking/[id]/rate.tsx` (also opened from the completion push).
- Cleaner avatar and name; **5-star selector**: stars 44 × 44, gap 8, `yellow600` when filled, scale pop 1 → 1.2 → 1 (180 ms) with selection haptic.
- Tag chips (multi-select, `chip.pill`): On time, Thorough, Friendly, Great value, Respectful.
- Comment (multiline 120), optional photo (up to 3).
- **Tip your cleaner:** chips UGX 2,000 · 5,000 · 10,000 · Custom, sent through the same payment flow (P13, `kind:'tip'`).
- **Pay balance** prompt appears first if a **digital** balance is outstanding ("Pay UGX 47,600 to finish"). If the balance is **Cash**, show an info line "Please pay your cleaner UGX 47,600 in cash" and let the review continue.
- **Tips** are digital only (MTN, Airtel, Visa); the tip chips are hidden if the user has no digital method to use, with the option "Tip in cash directly to your cleaner" as plain text.
- Submit → `POST /reviews`, thank-you toast, return to Home.

---

## 10. Page Specification: States and Edge Cases (P26)

| State | Component and style |
|---|---|
| Skeleton | Same layout, `backgroundColor:#E3E8E4`, opacity pulse 0.5 to 1 over 1.2 s |
| Empty | `EmptyState`: illustration 160, H3 title, caption 280 max width centred, primary button; `paddingVertical:48` |
| Error (screen) | `ErrorState`: icon 56 in `errorBg` circle 96, title, "Try again" button, "Contact support" ghost |
| Offline banner | `position:absolute; top: insets.top; left:0; right:0; height:32; backgroundColor:green900; flexDirection:'row'; center; gap:6`; wifi-off icon yellow500; white 12/600 "You're offline". Slides down 250 ms |
| Retry banner | after 8 s of loading: "Still trying…" caption under the spinner |
| Permission denied | Card with benefit text, **Open settings** (`Linking.openSettings()`), and the manual alternative (e.g., type the address) |
| Session expired | Modal "Please log in again", redirect to P2a, draft preserved |
| Force update | Full screen: logo, "Update required", button to store URL (`itms-apps://` or `market://`) |
| Payment failed | `errorBg` banner inside P13, booking stays `Pending payment` for 30 minutes then auto-cancels with a push |
| No slots | In P10: illustration, "No times left on this day", button "See next available day" |

`NetInfo.addEventListener` drives the offline banner. TanStack Query `networkMode:'offlineFirst'`, `retry:2`, `retryDelay: attempt => Math.min(1000 × 2^attempt, 8000)`, `staleTime` 60 s for lists.

---

## 11. Technical Reference

### 11.1 Animation Specs (Reanimated)

| Animation | Spec |
|---|---|
| Screen transition | Native stack default (iOS slide, Android `slide_from_right`), 250 ms |
| Press feedback | `withTiming(0.98, {duration:100})` scale and opacity 0.88 |
| Chip select | background colour `interpolateColor` 150 ms, haptic selection |
| Bottom sheet | spring `damping:20, stiffness:200` (library default is acceptable) |
| Segmented thumb | `withTiming(x, {duration:180, easing:Easing.out(Easing.cubic)})` |
| Accordion | `withTiming` height 200 ms, chevron rotate 200 ms |
| Check draw | SVG `strokeDashoffset` `withTiming(0, {duration:600})` |
| Price change | count-up 200 ms |
| Skeleton shimmer | loop 1.2 s |
| Reduced motion | when `useReducedMotion()` is true, durations to 0 and only opacity fades |

### 11.2 REST Endpoints (reference)

| Purpose | Endpoint |
|---|---|
| Auth | `POST /auth/register`, `/auth/login`, `/auth/otp/request`, `/auth/otp/verify`, `/auth/refresh` |
| Profile | `GET/PUT /me`, `GET /areas` |
| Catalogue | `GET /home`, `/services`, `/services/{slug}`, `/services/{slug}/form`, `/search` |
| Availability | `GET /availability?service&areaId&date` |
| Booking | `POST /bookings`, `GET /bookings?status=`, `GET /bookings/{id}`, `PATCH /bookings/{id}/schedule`, `PATCH /bookings/{id}/add-ons`, `POST /bookings/{id}/cancel` |
| Payments | `POST /payments`, `GET /payments/{id}`, `POST /payments/{id}/resend`, `GET /me/payment-methods`, `DELETE /me/payment-methods/{id}`, webhook `POST /webhooks/aggregator` (server only) |
| Plans | `GET /plans`, `POST /plans/{id}/skip|pause|resume|end` |
| Promos | `POST /promos/validate`, `GET /offers` |
| Reviews | `GET /reviews`, `POST /reviews` |
| Support | `GET /faq`, `GET /threads`, WebSocket `/ws` |
| Quotes | `POST /quotes`, `POST /quotes/{id}/accept` |

Headers: `Authorization: Bearer`, `Accept-Language`, `Idempotency-Key` on `POST /bookings` and `POST /payments`. Times are ISO-8601 in UTC, displayed in `Africa/Kampala`.

### 11.3 Push Notification Payloads

```json
{ "to": "ExponentPushToken[...]",
  "title": "Your cleaner is on the way",
  "body": "Arriving in about 12 minutes",
  "data": { "type":"booking.on_the_way", "bookingId":"GBX-20481", "url":"gabfix://booking/GBX-20481/track" },
  "channelId": "bookings", "sound": "default" }
```
Android channels: `bookings` (high), `payments` (high), `promotions` (default, off by default after 9 pm to 7 am EAT).

### 11.4 `app.json` Essentials

```json
{ "expo": {
  "name": "Gabfix", "slug": "gabfix", "scheme": "gabfix", "orientation": "portrait",
  "userInterfaceStyle": "light",
  "ios": { "bundleIdentifier": "com.gabfix.app", "supportsTablet": false,
    "infoPlist": {
      "NSLocationWhenInUseUsageDescription": "Gabfix uses your location to place the pin and match nearby cleaners.",
      "NSCameraUsageDescription": "Take a photo to attach to your request.",
      "NSPhotoLibraryUsageDescription": "Choose photos to attach to your request.",
      "NSFaceIDUsageDescription": "Use Face ID to log in quickly." } },
  "android": { "package": "com.gabfix.app", "softwareKeyboardLayoutMode": "resize",
    "permissions": ["ACCESS_FINE_LOCATION","POST_NOTIFICATIONS","CAMERA"] },
  "plugins": ["expo-router","expo-font","expo-notifications","expo-location","expo-secure-store"]
}}
```

### 11.5 Performance Targets (low-end Android, Kampala networks)

- Cold start under 3 s on a mid-range Android; first meaningful Home content under 2 s on 3G (skeletons immediately).
- Images: WebP, served at 2× the displayed size, `expo-image` `cachePolicy:'memory-disk'`.
- JS bundle: Hermes enabled; lazy-load maps and calendar screens.
- Lists: `FlashList` with `estimatedItemSize`; avoid inline functions in `renderItem`.
- Budget 60 fps on scroll; use `useNativeDriver` or Reanimated worklets for all animation.

---

## 12. Web Admin Dashboard (real CSS) (P27g)

**Viewport:** 1440 × 900 desktop, responsive to 1024. Stack: React or Next.js (not React Native), CSS variables from Part 1.

```css
:root{
  --green-500:#118E45; --green-700:#1A5E2F; --green-900:#1C411E;
  --green-50:#E8F6EE;  --green-100:#C5E8D3;
  --yellow-500:#F7EB15; --yellow-200:#F5EE5E; --yellow-50:#FFFCE0;
  --bg:#F6F8F6; --surface:#fff; --border:#DDE5DF; --text:#16221A; --muted:#5F6F65;
  --r-card:20px; --r-btn:14px; --shadow-card:0 4px 16px rgba(26,94,47,.08);
  font-family:'Inter',system-ui,sans-serif;
}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font-size:14px;line-height:20px}

.app{display:grid;grid-template-columns:240px 1fr;min-height:100vh}
.sidebar{background:var(--green-900);color:#fff;padding:24px 16px;position:sticky;top:0;height:100vh;
         display:flex;flex-direction:column;gap:8px}
.nav a{display:flex;align-items:center;gap:12px;height:44px;padding:0 12px;border-radius:12px;
       color:rgba(255,255,255,.8);text-decoration:none;position:relative}
.nav a.active{background:rgba(255,255,255,.08);color:#fff}
.nav a.active::before{content:"";position:absolute;left:-16px;top:8px;bottom:8px;width:4px;
                      border-radius:0 4px 4px 0;background:var(--yellow-500)}

.main{display:grid;grid-template-rows:64px 1fr;min-width:0}
.topbar{display:flex;align-items:center;justify-content:space-between;padding:0 32px;
        background:var(--surface);border-bottom:1px solid var(--border)}
.content{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:24px;padding:24px 32px}
.kpis{grid-column:1/-1;display:grid;grid-template-columns:repeat(4,1fr);gap:24px}
.card{background:var(--surface);border-radius:var(--r-card);padding:20px;box-shadow:var(--shadow-card)}
.kpi .value{font:700 28px/36px 'Poppins',sans-serif}
.trend.up{color:var(--green-500);background:var(--green-50)} .trend.down{color:#D32F2F;background:#FDECEC}
.trend{display:inline-flex;height:24px;padding:0 8px;border-radius:12px;font-weight:600;font-size:12px;align-items:center}

.table{width:100%;border-collapse:collapse}
.table th{ text-align:left;font-size:12px;color:var(--muted);font-weight:600;padding:12px 16px;
           border-bottom:1px solid var(--border);text-transform:uppercase;letter-spacing:.5px}
.table td{padding:14px 16px;border-bottom:1px solid var(--border)}
.table tr:hover td{background:var(--green-50)}
.chip{display:inline-flex;align-items:center;height:24px;padding:0 10px;border-radius:12px;font-size:12px;font-weight:600}
.btn{height:44px;padding:0 18px;border-radius:var(--r-btn);border:0;font-weight:600;cursor:pointer}
.btn.primary{background:var(--green-500);color:#fff} .btn.primary:hover{background:var(--green-700)}
.btn:focus-visible{outline:3px solid rgba(17,142,69,.35);outline-offset:2px}

@media (max-width:1200px){ .content{grid-template-columns:1fr} .kpis{grid-template-columns:repeat(2,1fr)} }
@media (max-width:1024px){ .app{grid-template-columns:72px 1fr} .nav a span{display:none} }
```

**Modules:** Overview (KPI row: Revenue UGX, Bookings today, Active cleaners, Average rating; revenue line chart with green line and a yellow highlight point; bookings by area bars), Bookings table (filters, status chips, assign cleaner), **Payments** (deposits received, balances outstanding, refunds, failed payments with retry and reconcile actions), **Cash collections** (per cleaner: cash confirmed by date, amount due, **remitted to Gabfix** status with a "Mark remitted" action, unconfirmed cash older than 24 h flagged, disputes), Customers, Cleaners (verification, availability), Services and Pricing (rate card editor bound to `config/pricing`), Promos, Reports (CSV export), Settings. **Right rail:** unassigned jobs and **balances overdue** and **unconfirmed cash** with a "Send reminder" action.

---

## 13. Acceptance Checklist per Page

- [ ] Matches spacing and radius tokens (no magic numbers outside `theme.ts`).
- [ ] Works at 360, 390 and 430 dp widths, light status bar on green headers.
- [ ] iOS and Android: shadows (shadow vs elevation), keyboard handling, back behaviour verified.
- [ ] All touch targets at least 48 × 48 dp; labels and roles set; 130% font scale does not clip.
- [ ] Loading, empty, error and offline states implemented.
- [ ] Prices in UGX from the server breakdown; deposit and balance shown correctly.
- [ ] Cash is never offered for a payment due at booking, and only the cleaner can confirm cash receipt.
- [ ] Haptics and animation follow 2.3 and 11.1; reduced motion respected.
- [ ] Deep links and push payloads open the right screen.
- [ ] No card data stored or logged; tokens only; PII excluded from analytics.

---

## 14. Open Items and Next Steps

1. **Order-specification images:** still not received. When uploaded, reconcile P8 to P12 against them (field labels, order, extra fields).
2. **Dummy values** in Part 1, 15.12, and Section 0 here must be replaced before launch.
3. Confirm the **aggregator** (MoMo STK, Visa hosted page, webhook format), deposit limits and refund timelines.
4. Confirm the **cash operations**: how cleaners remit cash to Gabfix, and whether a cash booking above a set amount should require a deposit (not applied yet).
4. Next: `Gabfix_App_Ui_3.md` with **component code library** (all `components/ui` in TSX), **partner (cleaner) app** screens, and icon and illustration briefs.
