# Page_refactor.md — Gabfix Home Solutions

Refactor spec to bring every existing page into line with the three LifeLine mockups (Splash, Welcome, Loading, Login, Sign Up, Welcome Back, Reset Password), plus the app rename to **Gabfix Home Solutions**.

Scope: layout, hierarchy, spacing, shapes, copy and loading behaviour. Business logic (validation, mocked API timers, area store, OTP rules) is **not** changed unless stated.

---

## 0. Decisions and assumptions (read first)

| # | Decision | Why | How to reverse |
|---|----------|-----|----------------|
| A1 | **Layout follows the mockups exactly. Colours are role-mapped to the Gabfix brand** (green replaces the mockup blue, yellow replaces the coral). | The Gabfix badge is green + yellow. Placed on the mockup's blue it clashes, and the user-facing brand would no longer match the logo. | Section 2.2 has a one-block "Palette B" that swaps in the literal mockup blue/coral. Only `tokens.ts` changes. |
| A2 | The mockup's **doctor / couple illustrations are not reusable** (healthcare, third-party). Slots are reserved with identical size and position; interim art uses existing brand assets. | Layout stays pixel-faithful; real art can drop in later. | Add `assets/images/welcome-cleaner.png` and `welcome-back.png` (specs in 5.2 and 5.5). |
| A3 | The current 3-slide carousel at `/` becomes a **single Welcome screen**. | The mockup shows one screen with one "Let's Go" button, no dots, no Skip. | Carousel code can stay in git history. |
| A4 | Features the mockups do not show (phone login, SMS-code login, area picker, terms checkbox, password strength) are **kept** but restyled in the same glass/pill language. | Removing them breaks Phase 2 exit criteria. | — |
| A5 | **Apple sign-in button is removed** from Login. | Not in the mockup; was a non-functional alert on iOS only. | Re-add as a second `SocialButton`. |
| A5b | **"Remember me" stays** on Login, on one row with `Forgot Password?` (5.3.1). | Requested revision; not in the mockup, which only shows the link. | Delete the left item of the options row. |
| A6 | Obvious mockup copy errors are corrected (see 7). | "Recive", "Have Any Account?", "Login" on a sign-up button, "Meditalk" template leftover. | Literal strings are listed in 7. |
| A7 | Colour/size values read from screenshots are **approximations** (±2 px / ±3 % colour). | Only raster mockups were supplied. | Eyedrop the source file if available and edit the tokens in 2.2. |

---

## 1. Rename: "Gabfix" → "Gabfix Home Solutions"

Display name changes everywhere a user can see it. Technical identifiers do **not** change, because changing them breaks the EAS project link and deep links.

| File | Change |
|------|--------|
| `app.json` → `expo.name` | `"Gabfix"` → `"Gabfix Home Solutions"` |
| `app.json` → `expo.slug` | **Keep** `gabfix-client-mobile` (tied to `extra.eas.projectId`) |
| `app.json` → `android.package`, `scheme` | **Keep** |
| `app.json` → location permission string | `"Gabfix Home Solutions uses your location to place the cleaning pin and find nearby cleaners."` |
| `src/components/brand/logo-badge.tsx` | `accessibilityLabel="Gabfix Home Solutions logo"` |
| `src/app/login.tsx`, `sign-up.tsx` | Footer copy and wordmark (rebuilt in section 5) |
| `src/app/home.tsx` | Remove the "Phase 2 complete / Tracked in Gabfix_UI_Progress.md" card from the user-facing screen (dev note leaking into UI) |
| `package.json` `name` | Keep `gabfix-client-mobile` |
| Docs (`README.md`, `Gabfix_*.md`) | Optional find/replace of the product name only |

Wordmark rule used by every screen:

```
Gabfix            ← white
Home Solutions    ← accent (yellow in Palette A, coral in Palette B)
```

Inline (top-left brand mark): `Gabfix` white + `Home Solutions` accent on one line, same weight, matching the mockup's two-tone "Life**Line**".

---

## 2. Design system changes

### 2.1 Fonts

The mockups use **Poppins** for every string (titles, fields, buttons, links). Today auth screens use Inter for body and fields.

`src/app/_layout.tsx`: add `Poppins_400Regular` and `Poppins_500Medium` to `useFonts` (package `@expo-google-fonts/poppins` is already installed).

`tokens.ts`:

```ts
export const font = {
  heading: 'Poppins_700Bold',
  headingSemi: 'Poppins_600SemiBold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
  // NEW – auth surfaces
  poppins: 'Poppins_400Regular',
  poppinsMedium: 'Poppins_500Medium',
  poppinsSemi: 'Poppins_600SemiBold',
  poppinsBold: 'Poppins_700Bold',
} as const;
```

Inter stays for the future in-app dashboard (Phase 3); auth/onboarding use Poppins only.

### 2.2 Auth tokens (new) — add to `tokens.ts`

**Palette A (default, Gabfix brand):**

```ts
export const auth = {
  bgTop: colors.green500,          // #118E45
  bgBottom: colors.green700,       // #1A5E2F  (very subtle vertical gradient)
  accent: colors.yellow500,        // blobs, links, selected radio, "Home Solutions"
  onAccentText: colors.green900,
  glass: 'rgba(255,255,255,0.20)',        // field fill
  glassBorder: 'rgba(255,255,255,0.00)',  // mockup has NO border
  placeholder: 'rgba(255,255,255,0.80)',  // mockup ~70 %; raised for contrast
  fieldIcon: 'rgba(255,255,255,0.80)',
  text: '#FFFFFF',
  textSoft: 'rgba(255,255,255,0.88)',
  btnBg: '#FFFFFF',
  btnText: colors.green700,        // text on white pills
  line: 'rgba(255,255,255,0.35)',  // divider
  dim: 0.45,                       // content opacity while loading
  error: '#FFD6D6',                // readable on green; see 2.5
} as const;
```

**Palette B (literal mockup, one-block swap):**

```ts
export const auth = {
  bgTop: '#2A67D6', bgBottom: '#1F58C4',
  accent: '#FF7062',
  onAccentText: '#FFFFFF',
  glass: 'rgba(255,255,255,0.22)', glassBorder: 'rgba(255,255,255,0)',
  placeholder: 'rgba(255,255,255,0.75)', fieldIcon: 'rgba(255,255,255,0.80)',
  text: '#FFFFFF', textSoft: 'rgba(255,255,255,0.90)',
  btnBg: '#FFFFFF', btnText: '#2A67D6',
  line: 'rgba(255,255,255,0.35)', dim: 0.45, error: '#FFE0DC',
} as const;
```

Shape/size tokens (same for both palettes):

```ts
export const authSize = {
  pageX: 24,           // horizontal page padding
  field: 48,           // field & button height (mockup ≈ 48 on a 390-wide frame)
  gap: 12,             // between fields
  radius: 999,         // EVERYTHING interactive is a full pill
  brandTop: 12,        // below safe-area top
  logoMark: 28,
} as const;
```

### 2.3 Typography on auth surfaces

| Role | Spec |
|------|------|
| Greeting line 1 ("Hey,") | Poppins Bold, 28 / 34, white |
| Greeting line 2 ("Let's Sign In!") | Poppins SemiBold, 22 / 28, white (mockup shows it a touch softer — use `textSoft`) |
| Screen title ("Reset Password", "Welcome Back!") | Poppins SemiBold 24 / 30 |
| Supporting copy | Poppins Regular 12–13 / 18, white at 88 % |
| Field placeholder & value | Poppins Regular 14, placeholder `auth.placeholder`, value white |
| Button label | Poppins Medium 14, `auth.btnText` |
| Links ("Forgot Password?", "Signup") | Poppins Regular 12; accent links Poppins SemiBold 12 |
| Divider label | Poppins Regular 11 |

Allow `maxFontSizeMultiplier={1.3}` as already done.

### 2.4 New shared components (`src/components/auth/`)

```
src/components/auth/
  auth-screen.tsx      // background + blob + brand mark + safe-area + scroll + keyboard
  blob.tsx             // SVG organic shapes (variants)
  brand-mark.tsx       // badge + two-tone name (inline) 
  glass-input.tsx      // pill input, trailing icon, optional prefix chip
  pill-button.tsx      // white pill + trailing arrow
  social-button.tsx    // white pill, Google multicolour G
  or-divider.tsx       // line — label — line
  radio-pill.tsx       // Email / Phone radio
  loading-overlay.tsx  // dim + centred pulsing logo + "Loading.."
  google-glyph.tsx     // 4-colour G (react-native-svg)
```

The existing `Button`, `Input`, `Checkbox`, `CodeInput`, `TopBar` stay for the in-app (white-background) screens. The auth screens stop importing them.

### 2.5 Error and helper text on a coloured background

The old inputs show red text on white. On the coloured page use: icon + text in `auth.error`, 12 px, directly under the pill, 6 px gap, left-aligned with the pill's inner text (16 px indent). Never colour-only (keep the existing `CircleAlert` icon and `accessibilityLiveRegion="polite"`).

---

## 3. Shared building blocks

### 3.1 `Blob` (react-native-svg)

Organic coral/yellow shapes that **bleed off the screen edge**. Positioned absolutely, `pointerEvents="none"`, rendered **behind** content. Paths are authored in a fixed `viewBox` and scaled by width.

```tsx
// src/components/auth/blob.tsx
import Svg, { Path } from 'react-native-svg';
import { auth } from '@/theme';

export type BlobVariant =
  | 'topRight'        // Login, Reset Password
  | 'topRightLarge'   // Welcome Back
  | 'topCenterLeft'   // Sign Up
  | 'bottomLeft'      // Welcome Back
  | 'bottomRight';    // Welcome Back

const SHAPES: Record<BlobVariant, { viewBox: string; d: string; wRatio: number; style: object }> = {
  topRight: {
    viewBox: '0 0 160 130', wRatio: 0.46,
    d: 'M38 0H160V78C152 104 124 122 102 98C88 82 80 72 62 62C34 47 14 22 38 0Z',
    style: { top: 0, right: 0 },
  },
  topRightLarge: {
    viewBox: '0 0 200 170', wRatio: 0.52,
    d: 'M60 0H200V96C190 132 150 158 120 126C104 108 92 98 70 88C34 70 20 28 60 0Z',
    style: { top: 0, right: 0 },
  },
  topCenterLeft: {
    viewBox: '0 0 150 120', wRatio: 0.40,
    d: 'M0 0H138C152 30 128 52 108 72C92 88 96 112 64 112C34 112 0 92 0 56V0Z',
    style: { top: 0, left: '12%' },
  },
  bottomLeft: {
    viewBox: '0 0 190 150', wRatio: 0.50,
    d: 'M0 40C40 30 62 52 92 60C128 70 178 70 190 112V150H0V40Z',
    style: { bottom: 0, left: 0 },
  },
  bottomRight: {
    viewBox: '0 0 180 130', wRatio: 0.46,
    d: 'M180 20V130H40C20 128 18 96 52 82C84 70 100 50 128 34C150 22 166 14 180 20Z',
    style: { bottom: 0, right: 0 },
  },
};
```

> The `d` strings are close approximations of the mockup silhouettes (a rounded lobe with one concave bite on the inner edge). After first render, overlay the mockup at 50 % opacity and nudge control points. Expected tolerance: lobe width ±3 %, depth ±4 px.

### 3.2 `AuthScreen`

Responsibilities:
- `LinearGradient` `[auth.bgTop, auth.bgBottom]`, top → bottom, full bleed.
- Optional `blob` prop (variant).
- Optional brand mark top-left at `insets.top + authSize.brandTop`, `left: 24`.
- `KeyboardAvoidingView` + `ScrollView` (`keyboardShouldPersistTaps="handled"`, `bounces={false}`).
- Optional `footer` pinned to the bottom (`paddingBottom: insets.bottom + 16`) that stays at the bottom on tall screens and scrolls under the form on short screens (use `flexGrow: 1` + `justifyContent: 'space-between'`).
- Status bar: `light` on every auth screen.
- Optional `loading` prop → renders `LoadingOverlay` and dims children (see 3.5).

Vertical rhythm for login-style pages (390 × 844 reference frame):

```
0 ─ status bar / safe area
+12  brand mark row (28 px badge)                          y ≈ 60
+~100 gap
     "Hey,"            (34 line)                           y ≈ 190
     "Let's Sign In!"  (28 line)
+28  gap
     Email field       (48)
+12  Password field    (48)
+12  OPTIONS ROW (36): ☑ Remember me (left)  ·····  Forgot Password? (right)
        — one row, both items vertically centred on the same horizontal axis
+20  Login →           (48, white pill)
+12  Use SMS code      (text link, centred, 32 high)
+16  ── Or Login With ──  (divider, 16)
+16  Login With Google  (48, white pill)
     … flexible space …
     Don't have an account? Sign up    (centred, bottom, 16 px above safe area)
```

**Spacing rules (apply to every auth page):**
- Build the form column with a single `gap`, not ad-hoc margins. **No negative margins** (the old login used `marginTop: -space[2]` on the options row, which is what caused the cramped/uneven spacing).
- Field → field: 12. Last field → options row: 12. Options row → primary button: 20. Primary button → next element: 12–16 as listed above.
- Every row's height is fixed (48 for pills, 36 for the options row, 32 for text links) so spacing does not shift when error text appears; error text is rendered inside its own reserved 18 px slot under the field (`minHeight: 18`) or pushes the column down as a whole, never overlaps the next element.

### 3.3 `GlassInput`

```
height 48, borderRadius 999, paddingHorizontal 20
backgroundColor auth.glass, NO border, NO shadow
text: Poppins 14 white, placeholder auth.placeholder
trailing icon slot (20 px, auth.fieldIcon, 20 px from right edge):
   Email / identifier → Mail      Password → EyeOff / Eye (tappable, 48 dp target)
leading prefix chip (phone only): "+256", 28 px high pill, rgba(255,255,255,0.22), margin-right 8
focus: backgroundColor rgba(255,255,255,0.30) + 1.5 px white border (keeps focus visible)
error: 1.5 px border auth.error + message line (2.5)
```

Floating labels from the old `Input` are **removed** on auth screens: the mockup uses placeholder-as-label. Keep `accessibilityLabel` so screen readers still announce the field name.

### 3.4 `PillButton` / `SocialButton`

```
height 48, radius 999, backgroundColor auth.btnBg, centred row, gap 8
label Poppins Medium 14, auth.btnText
PillButton trailing icon: ArrowRight 16, 1.8 stroke  (matches "Login →", "Continue →")
SocialButton leading: GoogleGlyph 18 px
disabled: opacity 0.5 (keep white pill – do NOT turn grey, grey is off-palette here)
pressed: scale 0.98 / 100 ms (reuse the existing Button's timing)
```

### 3.5 `LoadingOverlay` — the "app loading" look

This is the loading state from the mockup (Image 1, right). It is the **single** loading treatment for the whole app.

Visual spec:
- The current screen **stays visible underneath, dimmed**: all content (title, fields, buttons, links) at `opacity: auth.dim` (0.45). Background, blob and brand mark do not dim.
- **No card, no scrim box, no spinner ring.** Centred on the screen (slightly above geometric centre, at ≈ 38 % of the height — it sits between the Password field and "Forgot Password?" in the mockup).
- Logo: the Gabfix badge, 56 px, **as is** (no recolouring), with a gentle heartbeat pulse: scale 1 → 1.12 → 1, 900 ms, ease-in-out, looped. (LifeLine pulses its heart-ECG icon; the Gabfix equivalent is the badge.)
- Under the logo, 8 px gap: the text **`Loading..`** (two dots — matches the mockup), Poppins SemiBold 14, white, centred.
- Touches are blocked while visible (`pointerEvents="auto"` on a transparent full-screen `View`).
- `accessibilityRole="progressbar"`, `accessibilityLabel="Loading"`, `accessibilityLiveRegion="polite"`.
- Reduced motion: no pulse (static logo).

```tsx
// src/components/auth/loading-overlay.tsx
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { LogoBadge } from '@/components/brand/logo-badge';
import { auth, font } from '@/theme';

export function LoadingOverlay({ visible }: { visible: boolean }) {
  const pulse = useRef(new Animated.Value(1)).current;
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!visible || reduced) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 450, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 450, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [visible, reduced, pulse]);

  if (!visible) return null;
  return (
    <View
      style={StyleSheet.absoluteFill}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
      accessibilityLiveRegion="polite">
      <View style={styles.center}>
        <Animated.View style={{ transform: [{ scale: pulse }] }}>
          <LogoBadge size={56} />
        </Animated.View>
        <Text style={styles.label}>Loading..</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { position: 'absolute', top: '38%', left: 0, right: 0, alignItems: 'center', gap: 8 },
  label: { fontFamily: font.poppinsSemi, fontSize: 14, color: auth.text },
});
```

Usage pattern (every auth screen):

```tsx
<AuthScreen loading={loading} ...>
  {/* content gets opacity 0.45 and pointerEvents="none" automatically while loading */}
</AuthScreen>
```

**Where it replaces the old spinner-in-button:** Login submit, Sign Up submit, OTP verify, Save new password. `Button`'s internal `loading` prop stays for in-app (non-auth) screens.

---

## 4. Navigation and route changes

Target flow (matches mockup order):

```
Native splash (logo on brand colour)
   → /          Splash (animated logo + wordmark, ~1.6 s)
   → /welcome   Welcome  ("Let's Go →")
   → /login     Login  ⇄  /sign-up  ⇄  /forgot-password
   → /otp  (sign-up verification, or SMS-code login)
   → /area-select (first run)
   → /welcome-back   (after successful LOGIN)
   → /home
```

| Route file | Action |
|-----------|--------|
| `src/app/index.tsx` | **Rewrite** as Splash (section 5.1). Currently the carousel. |
| `src/app/welcome.tsx` | **New**. Welcome screen (5.2). Takes over the carousel's job, minus the carousel. |
| `src/app/welcome-back.tsx` | **New**. Post-login success screen (5.5). |
| `src/app/_layout.tsx` | Register `welcome` (`animation: 'fade'`) and `welcome-back` (`animation: 'fade'`); `index` stays `fade`; set `contentStyle.backgroundColor` to `auth.bgTop` for auth routes so there is no white flash between transitions; add Poppins weights (2.1). |
| `src/app/login.tsx` | `router.replace('/home')` → `router.replace('/welcome-back')` on success. |
| `src/store/onboarding.ts` | Add `userName: string \| null` + `setUserName()` so Welcome Back can say "Hey **Aisha**". Sign Up stores the first name; Login uses a mock value until the API returns it. |

`app.json` native splash (so the logo is the very first frame, then hands over seamlessly to the JS Splash):

```json
[
  "expo-splash-screen",
  {
    "backgroundColor": "#118E45",
    "image": "./assets/images/gabfix-logo.png",
    "imageWidth": 168,
    "resizeMode": "contain"
  }
]
```

> Before editing, confirm the plugin option names against the Expo SDK 58 docs (`https://docs.expo.dev/versions/v58.0.0/sdk/splash-screen/`). `AGENTS.md` in this repo warns Expo options change between SDKs. If `backgroundColor` changes (Palette B → `#2A67D6`), change it here too.

---

## 5. Screen-by-screen changes

### 5.1 Splash — `src/app/index.tsx` (mockup: LifeLine splash)

**Mockup:** full-bleed brand colour; logo mark and two-tone wordmark centred together, slightly above the vertical centre; nothing else on screen. No spinner, no tagline, no status UI.

**Current:** onboarding carousel on a green gradient.

**Target:**

| Element | Spec |
|---------|------|
| Background | `auth.bgTop` flat (identical to native splash colour so the hand-off is invisible) |
| Logo | `gabfix-logo.png` **as is**, 120 px, centred; no extra ring, glow or recolour |
| Wordmark | Under the logo, 16 px gap, centred, 2 lines: `Gabfix` (white, Poppins Bold 34 / 38) over `Home Solutions` (accent, Poppins Bold 22 / 28). Mockup uses one line "Life**Line**"; the longer Gabfix name needs two lines to keep the same visual weight. |
| Position | Block centre at ≈ 46 % of screen height (mockup sits just above centre) |
| Motion | Fade-in + 0.92 → 1.0 scale over 500 ms; hold; then navigate. Skip animation if reduced motion. |
| Timing | Total ≈ 1.6 s. Navigate with `router.replace('/welcome')`. Do not block longer than fonts require. |
| Status bar | light |

```tsx
export default function Splash() {
  useStatusBarStyle('light');
  useEffect(() => {
    const t = setTimeout(() => router.replace('/welcome'), 1600);
    return () => clearTimeout(t);
  }, []);
  return (
    <View style={styles.root}>
      <FadeScaleIn>
        <LogoBadge size={120} />
        <Text style={styles.name}>Gabfix</Text>
        <Text style={styles.sub}>Home Solutions</Text>
      </FadeScaleIn>
    </View>
  );
}
```

Remove from this file: `slides`, `FlatList`, `ActiveDot`, `SlideArt`, autoplay timers, `Skip`, dots, the "I already have an account" footer.

### 5.2 Welcome — `src/app/welcome.tsx` (mockup: "Welcome To Lifeline", Image 1 left)

**Mockup anatomy (top → bottom):**
1. Top ≈ 28 % of the screen is the brand colour with a large light elliptical "hill" rising from the lower edge of that band, so the page reads as **light-grey upper-middle area + brand-colour base**.
2. Left-aligned heading inside the light area: `Welcome` / `To Lifeline` — two lines, Poppins SemiBold ≈ 18–20, first line near-black, **"Lifeline" in the accent colour**.
3. Under it, 3 lines of small grey lorem-style body text (Poppins 8–9 in the thumbnail, ≈ 12 px real), left-aligned, ~60 % screen width.
4. Centre-bottom: full-height character illustration standing on the brand-colour base, holding a floating heart; thin ECG line trailing at the right.
5. Bottom-right: small accent-coloured pill **"Let's Go →"**, ≈ 96 × 36, label white 12 px.

**Gabfix target:**

| Element | Spec |
|---------|------|
| Background | `auth.bgTop` |
| Light hill | SVG ellipse `#F3F4F2` (neutral light grey from the mockup), width 150 % of screen, height 62 %, centred horizontally, top = –8 %; its lower arc crosses at ≈ 56 % of screen height |
| Heading | `Welcome` / `To ` + **`Gabfix Home Solutions`** in the accent colour. At 20 px this wraps to three lines — acceptable; if too tall, use `Welcome` / `To Gabfix` / `Home Solutions`. Left padding 28, top ≈ 20 % of height. Colour `#16221A` (existing `colors.text`). |
| Body | `Trusted, vetted cleaners across Kampala. Book a time that works for you.` Poppins 12 / 18, `colors.textMuted`, max-width 62 % |
| Illustration | Bottom-centre, height ≈ 46 % of screen, anchored to the bottom edge. **Needs art** (A2). Brief for the illustrator: a friendly cleaner in a Gabfix-green uniform, holding a spray bottle or a small house icon with a yellow badge, same flat style as the LifeLine character. File: `assets/images/welcome-cleaner.png`, 1200 × 1400 transparent. **Interim:** render `LogoBadge size={168}` inside a soft white circle at the same anchor. |
| Decorative | Optional thin line (the ECG line in the mockup) → replace with a short dashed house-roof line in `rgba(255,255,255,0.35)`; omit if no time |
| CTA | `Let's Go →`, bottom-right, 28 px from right, `insets.bottom + 28` from bottom; pill 108 × 40, `auth.accent` fill, label `auth.onAccentText` Poppins Medium 13; arrow 14 px. Navigates to `/login`. |
| Removed | Skip, pager dots, auto-advance, footer "I already have an account" |

### 5.3 Login — `src/app/login.tsx` (mockup: "Hey, Let's Sign In!", Image 3 left; loading state Image 1 right)

**Current:** green header with large centred badge + wordmark, white rounded sheet with labelled fields, Remember-me checkbox, two stacked buttons, outlined social buttons.

**Target (everything on the coloured page, no white sheet):**

| Order | Element | Spec |
|-------|---------|------|
| – | Background | `AuthScreen` gradient + `Blob variant="topRight"` |
| 1 | Brand mark | Top-left: badge 28 px + two-tone `Gabfix Home Solutions` 13 px. Replaces the `TopBar` back arrow and the big centred badge. |
| 2 | Greeting | `Hey,` (28 Bold) / `Let's Sign In!` (22 SemiBold), left-aligned, left padding 24, ≈ 100 px under the brand mark |
| 3 | Field 1 | Placeholder **`Email or Phone`**, trailing `Mail` icon. Keep the existing phone/email detection; when phone-like show the `+256` prefix chip |
| 4 | Field 2 | Placeholder **`Password`**, trailing `EyeOff`/`Eye` toggle |
| 5 | **Options row** | **One row, 12 px under Field 2, fixed height 36, `flexDirection: 'row'`, `justifyContent: 'space-between'`, `alignItems: 'center'`.** Left: `☑ Remember me`. Right: `Forgot Password?`. Both sit on the same horizontal centre line (see 5.3.1) |
| 6 | Primary | White pill `Login →` (20 px under the options row) |
| 6b | SMS link | `Use SMS code` text link, centred, 12 px under Login, white 12 px underline, height 32 |
| 7 | Divider | `──── Or Login With ────`, hairline `auth.line`, label 11 px, 16 px above and below |
| 8 | Google | White pill, 4-colour G + `Login With Google` |
| 9 | Footer | Bottom-pinned, centred: `Don't have an account? ` + **`Sign up`** (accent, SemiBold) → `/sign-up` |

#### 5.3.1 Options row: Remember me + Forgot Password?

Why it looked wrong before: the shared `Checkbox` has `minHeight: 48`, `paddingVertical: 8` and `alignItems: 'flex-start'` with a 1 px offset on the box, so its text and the link never shared a centre line, and a negative margin pulled the row into the field above.

```tsx
<View style={styles.optionsRow}>
  <Checkbox tone="onColor" checked={remember} onChange={setRemember} label="Remember me" compact />
  <Pressable accessibilityRole="link" accessibilityLabel="Forgot password"
             hitSlop={{ top: 12, bottom: 12, left: 12, right: 0 }}
             onPress={() => router.push('/forgot-password')}>
    <Text style={styles.forgot}>Forgot Password?</Text>
  </Pressable>
</View>

optionsRow: { height: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
forgot:     { fontFamily: font.poppins, fontSize: 12, lineHeight: 18, color: auth.text },
```

`Checkbox` `compact` + `tone="onColor"` variant:
- Row: `flexDirection: 'row'`, **`alignItems: 'center'`**, `minHeight: 0`, `paddingVertical: 0`, `gap: 8` (the 48 dp touch target comes from `hitSlop`, not from padding).
- Box: 18 × 18, radius 5, 1.5 px `rgba(255,255,255,0.85)` border, transparent fill; **no `marginTop` offset**. Checked: white fill, tick in `auth.btnText`, 12 px.
- Label: Poppins Regular 12 / 18, white. Same font size and line height as `Forgot Password?`, so both baselines match.
- Both left edge of the checkbox and right edge of the link align with the pills' **inner** text inset (4 px inside the 24 px page padding), so the row lines up with the fields above and the button below.

Default for `remember` stays `true`.

#### 5.3.2 Implementation instructions for the agent (Login spacing + options row)

Do these in order. They are the authoritative steps for the Login spacing and the Remember me / Forgot Password? row.

**Step 1: `src/components/ui/checkbox.tsx`. Add `tone` and `compact` props.**

```tsx
export type CheckboxProps = {
  // ...existing props
  tone?: 'default' | 'onColor';
  compact?: boolean;
};
```

Behaviour when `compact` is true:
- `row`: `flexDirection: 'row'`, `alignItems: 'center'` (replaces `flex-start`), `minHeight: 0`, `paddingVertical: 0`, `gap: 8`.
- `box`: 18 × 18, `borderRadius: 5`, **remove `marginTop: 1`**.
- `labelWrap`: **remove `flex: 1`** (use `flexShrink: 1`) so the label hugs its text and does not stretch across the row.
- Touch target: `hitSlop={{ top: 14, bottom: 14, left: 8, right: 8 }}` (keeps ≥ 48 dp without padding).
- Label: `fontFamily: font.poppins`, `fontSize: 12`, `lineHeight: 18`.

Behaviour when `tone="onColor"`:
- Unchecked box: transparent fill, 1.5 px border `rgba(255,255,255,0.85)`.
- Checked box: `backgroundColor: '#FFFFFF'`, border `#FFFFFF`, tick colour `auth.btnText`, tick size 12.
- Label colour `auth.text` (white).
- Error text (if any) uses `auth.error`.

Default (`tone` omitted, `compact` omitted) must render exactly as today, because Sign Up terms and in-app screens still use it.

**Step 2: `src/app/login.tsx`. Replace the form column spacing.**

1. Wrap the two fields, the options row and the Login button in one container: `{ gap: 12 }` between fields and options row. Do not use per-element margins.
2. **Delete `marginTop: -space[2]`** from `optionsRow`. No negative margins anywhere on this page.
3. Options row exactly:

```tsx
<View style={styles.optionsRow}>
  <Checkbox tone="onColor" compact checked={remember} onChange={setRemember} label="Remember me" />
  <Pressable
    accessibilityRole="link"
    accessibilityLabel="Forgot password"
    hitSlop={{ top: 12, bottom: 12, left: 12, right: 0 }}
    onPress={() => router.push('/forgot-password')}>
    <Text style={styles.forgot}>Forgot Password?</Text>
  </Pressable>
</View>

optionsRow: { height: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
forgot:     { fontFamily: font.poppins, fontSize: 12, lineHeight: 18, color: auth.text },
```

4. Vertical spacing (px), top to bottom:

| From | To | Gap |
|------|----|-----|
| Email or Phone field | Password field | 12 |
| Password field | Options row | 12 |
| Options row | Login → button | 20 |
| Login → button | Use SMS code link | 12 |
| Use SMS code link | Or Login With divider | 16 |
| Divider | Login With Google | 16 |

5. Error text must not shift the layout below it. Either give each field a reserved `minHeight: 18` error slot, or let the whole column grow. It must never overlap the options row.
6. Both items in the options row share one centre line, with equal text size (12) and line height (18).

**Step 3: verify.** At 390 × 844: Remember me and Forgot Password? render on one row, left and right, and their text centres differ by ≤ 1 px. The gaps in the table above are exact. Triggering a validation error on either field does not overlap or compress the options row. Default Checkbox usage elsewhere is unchanged. `npx tsc --noEmit` and `npx expo lint` pass.

**Removed from this page:** `TopBar`, big badge and "Gabfix" wordmark, "Welcome back / Log in to manage your bookings" title block, white sheet (`styles.card`), Apple button, the negative-margin options row, `shake` wrapper (keep the shake but apply it to the fields group). **"Remember me" is kept** and now shares one row with `Forgot Password?` (5.3.1).

**Kept but relocated (A4):** SMS-code login becomes a small centred text link, `Use SMS code`, directly under the Login button (same `loginWithCode` handler). It no longer shares the options row, which belongs to Remember me / Forgot Password?. If a pure mockup match is preferred, delete the link and expose SMS login from the Forgot Password flow instead.

**Loading behaviour:** `logIn()` sets `loading` → `AuthScreen loading` renders the dimmed content + `LoadingOverlay` exactly as in the loading mockup (fields, `Forgot Password?`, buttons and footer dimmed to 45 %; pulsing logo with `Loading..` in the middle). Keep the 700 ms mock timer, then `router.replace('/welcome-back')`.

### 5.4 Sign Up — `src/app/sign-up.tsx` (mockup: "Hey, Let's Sign Up!", Image 2 left)

**Mockup:** coral blob at top, left-of-centre; title `Hey, / Let's Sign Up!`; four glass pills (Full Name, Email, Password with eye, Retype Password); white `Login →` button (mockup copy error → `Sign Up →`); divider `Or Login With`; Google button; footer `Have Any Account? Login`.

**Target:**

| Order | Element | Spec |
|-------|---------|------|
| – | Background | `AuthScreen` + `Blob variant="topCenterLeft"` |
| 1 | Brand mark | Top-left, same as Login |
| 2 | Greeting | `Hey,` / `Let's Sign Up!` |
| 3 | `Full Name` | glass pill, trailing `User` icon |
| 4 | `Phone number` | glass pill with `+256` chip, 9-digit rule unchanged, helper text under: `We'll send a 6-digit code to verify this number` (12 px, `textSoft`) |
| 5 | `Email (optional)` | glass pill, trailing `Mail` |
| 6 | `Password` | glass pill + eye toggle. Strength meter stays: 4 × 4 px segments under the field, empty = `rgba(255,255,255,0.30)`, filled = white → accent as strength rises (replace the red/orange/yellow/green ramp; it clashes on green) |
| 7 | `Retype Password` | **new field**, glass pill + eye toggle (mockup shows it with no icon; an eye is added for usability). Error: `Passwords do not match`. Add `confirm` to `Errors` and `validate()` |
| 8 | `Area / neighbourhood` | glass pill with leading `MapPin`, value or `Select your area`, trailing `ChevronRight`. Same navigation to `/area-select` |
| 9 | Terms | Checkbox restyled: 22 px rounded box, white border 1.5 px, checked = white fill with `auth.btnText` tick; label white 12 px, links accent SemiBold |
| 10 | Primary | White pill **`Sign Up →`** |
| 11 | Divider + Google | Same as Login. Label: `Or Sign Up With` and `Sign Up With Google` (mockup reuses the Login wording; matching the page's purpose is clearer) |
| 12 | Footer | `Already have an account? ` + **`Login`** (accent) |

The form is longer than a screen: the page scrolls, the footer follows the last element on short devices and pins to the bottom on tall ones.

**Removed:** `TopBar`, centred 56 px badge, white sheet, "Create your account" title block.

**Loading:** submit shows `LoadingOverlay`; then `router.push('/otp')` unchanged.

### 5.5 Welcome Back — `src/app/welcome-back.tsx` (**new**; mockup: centre phone in Image 2)

**Mockup anatomy:** coral blob top-right (large lobe), coral blobs bottom-left and bottom-right framing the buttons; centred illustration of two people waving inside a lighter circular disc, with small floating UI chips (heart, thumbs-up, message bar) and tiny dots/dashes; `Welcome Back!` centred bold ≈ 22; sub-line centred two lines with the **user's first name in coral**; two stacked white pill buttons.

| Element | Spec |
|---------|------|
| Background | `AuthScreen` gradient, `Blob topRightLarge` + `Blob bottomLeft` + `Blob bottomRight` (bottom blobs sit **behind** the buttons; buttons stay white and readable) |
| Illustration | Centred, top ≈ 20 % of height; disc 190 px diameter, `rgba(255,255,255,0.14)`; art 220 × 220 on top. **Needs art** (A2): `assets/images/welcome-back.png`. **Interim:** `LogoBadge size={120}` in the disc, plus 3 small white pill chips around it (`Star`, `ThumbsUp`, `Check` icons in `auth.btnBg` circles) to keep the "floating chips" composition |
| Title | `Welcome Back!` Poppins SemiBold 24 centred, 28 px under the disc |
| Sub-line | `Hey ` + **`{firstName}`** (accent) + `, you're logged in to Gabfix Home Solutions.` Poppins 13 / 19, centred, max-width 80 % |
| Button 1 | White pill `Go To Home` → `router.replace('/home')` |
| Button 2 | White pill `Dashboard` → `router.replace('/home')` until the Phase 3 dashboard exists, then route there. 12 px gap between buttons |
| Auto-advance | None (mockup is user-driven) |

### 5.6 Reset Password — `src/app/forgot-password.tsx` (mockup: Image 2 right)

**Mockup:** coral blob top-right (hangs down ≈ 22 %), brand mark top-left, title `Reset Password` (bold ≈ 22) left-aligned, two-line helper, a row of two radios **`Email`** / **`Phone`** (Phone selected: white ring with coral dot), one glass pill (`Phone Number`), white `Continue →`.

**Step 1 (identifier) — target:**

| Order | Element | Spec |
|-------|---------|------|
| – | Background | `AuthScreen` + `Blob topRight` + brand mark (replaces `TopBar` — add a 44 dp back chevron **left of** the brand mark only on steps 2–3, which need Back) |
| 1 | Title | `Reset Password` |
| 2 | Helper | `Enter your Email/Phone number below to receive your OTP number.` (mockup typo "Recive" corrected) |
| 3 | Radios | `RadioPill` row, 24 px gap: `○ Email` `◉ Phone`. Default **Phone** (matches mockup, and Uganda is phone-first). Radio: 18 px ring white 1.5 px; selected = 9 px accent dot. Label Poppins 12 white. |
| 4 | Field | Glass pill. Phone → placeholder `Phone Number` with `+256` chip, `number-pad`. Email → placeholder `Email`, trailing `Mail`, `email-address`. Switching radio clears the field and error. |
| 5 | CTA | White pill `Continue →` (replaces "Send code"). Same `sendCode()` logic, now validating by the selected mode (`isValidUGPhone` / `isValidEmail`) instead of `isPhoneOrEmail`. |

**Steps 2–4 — same language, no mockup exists, so extend consistently:**

| Step | Treatment |
|------|-----------|
| 2 Enter the code | Title `Enter the code`; six **glass square pills** (48 × 56, radius 16, glass fill; filled = white fill + `auth.btnText` digit; focused = 1.5 px white border; error = 1.5 px `auth.error`). `Resend code in 0:30` in `textSoft`, `Resend code` as accent link. White pill `Verify →` |
| 3 New password | Two glass pills with eye toggles (`New Password`, `Confirm Password`); white pill `Save Password →` ; `LoadingOverlay` while saving |
| 4 Success | Same layout as Welcome Back: centred 120 px disc with a white check (replaces green circle + yellow ring), title `Password Updated`, body copy as today, white pill `Back To Login →`. Blobs: `topRight` + `bottomLeft` |

Step transitions keep the existing fade.

### 5.7 Verify (OTP) — `src/app/otp.tsx` (no mockup; follow Reset Password step 2)

Same as Reset step 2: `AuthScreen` + `Blob topRight` + brand mark + back chevron; title `Verify Your Number`; subtitle with the masked number in white SemiBold; `CodeInput` restyled to the glass squares above; `Resend` row; white pill `Verify →`; `LoadingOverlay` during the 700 ms mock verification. Replace the blue `infoBg` hint box with plain `textSoft` 12 px text (the pale blue box looks wrong on a coloured page).

`CodeInput` change: add a `variant?: 'default' | 'glass'` prop rather than forking the component.

### 5.8 Area select — `src/app/area-select.tsx` (modal; no mockup)

Keep it a modal sheet but retheme so it does not feel like a different app:

- Sheet background `auth.bgTop` gradient with `Blob topRight` (smaller, `wRatio 0.34`).
- Search field → `GlassInput` with `Search` trailing icon.
- "Use my current location" row → glass pill row, `LocateFixed` leading icon.
- Section headers: `textSoft` 12 px uppercase, letter-spacing 0.6.
- Area rows: glass pills (radius 999, height 52); selected = white fill, `auth.btnText` text, trailing `Check`; "Coming soon" rows at 55 % opacity with an accent `Coming soon` tag.
- Bottom CTA → white `PillButton` `Continue with {area} →`.

### 5.9 Home — `src/app/home.tsx` (placeholder; align header only)

- Hero: keep the rounded-bottom hero but use `auth` gradient and `Blob topRight` (partial, `wRatio 0.34`); badge 32 px + two-tone name left; area pill unchanged (glass fill).
- Greeting copy: `Hello 👋` → `Hello, {firstName}`.
- Remove the dev-facing "Phase 2 complete" card and the "Home dashboard is next" explainer from the user UI (move to `Gabfix_UI_Progress.md`).
- Buttons: white pill / outlined pill variants consistent with 3.4.
- Log out → `router.replace('/login')` unchanged.

---

## 6. Per-file change list (checklist)

**New**
- [ ] `src/components/auth/{auth-screen,blob,brand-mark,glass-input,pill-button,social-button,or-divider,radio-pill,loading-overlay,google-glyph}.tsx`
- [ ] `src/app/welcome.tsx`
- [ ] `src/app/welcome-back.tsx`
- [ ] `assets/images/welcome-cleaner.png`, `assets/images/welcome-back.png` (art — interim fallbacks exist)

**Modified**
- [ ] `app.json` — name, location string, splash plugin
- [ ] `src/theme/tokens.ts` — `auth`, `authSize`, Poppins font keys
- [ ] `src/app/_layout.tsx` — Poppins 400/500, new screens, `contentStyle` colour
- [ ] `src/app/index.tsx` — carousel → Splash
- [ ] `src/app/login.tsx`, `sign-up.tsx`, `forgot-password.tsx`, `otp.tsx` — rebuilt on `AuthScreen`
- [ ] `src/app/area-select.tsx`, `home.tsx` — retheme (5.8, 5.9)
- [ ] `src/components/ui/code-input.tsx` — `variant="glass"`
- [ ] `src/components/ui/checkbox.tsx` — `tone="onColor"` and `compact` props (centre-aligned row, 18 px box, no padding; see 5.3.1)
- [ ] `src/components/brand/logo-badge.tsx` — a11y label
- [ ] `src/store/onboarding.ts` — `userName`

**Untouched logic:** `utils/validation.ts`, `utils/format.ts`, `config/*`, mocked timers, haptics.

---

## 7. Copy sheet

| Where | Mockup text | Used in app | Note |
|-------|-------------|-------------|------|
| Splash | LifeLine | Gabfix / Home Solutions | |
| Welcome | Welcome To Lifeline | Welcome To **Gabfix Home Solutions** | accent on the name |
| Welcome CTA | Let's Go → | Let's Go → | |
| Login title | Hey, Let's Sign In! | same | |
| Login fields | Email / Password | Email or Phone / Password | phone login retained |
| Login link | Forgot Password? | same | |
| Login CTA | Login → | same | |
| Divider | Or Login With | same | |
| Google | Login With Google | same | |
| Login footer | Have Any Account? Signup | Don't have an account? **Sign up** | mockup wording is ungrammatical |
| Loading | Loading.. | Loading.. | kept literally (two dots) |
| Sign-up title | Hey, Let's Sign Up! | same | |
| Sign-up CTA | Login → | **Sign Up →** | mockup copy-paste error |
| Sign-up divider | Or Login With | Or Sign Up With | |
| Sign-up footer | Have Any Account? Login | Already have an account? **Login** | |
| Welcome Back | Hey Ferdous, Once Again You Login Successfully Into Meditalk App. | Hey **{firstName}**, you're logged in to Gabfix Home Solutions. | "Meditalk" is a leftover from another template |
| Welcome Back buttons | Go To Home / Dashboard | same | Dashboard → Home until Phase 3 |
| Reset title | Reset Password | same | |
| Reset helper | …to Recive Your OTP Number | …to receive your OTP number. | typo |
| Reset radios | Email / Phone | same | Phone default |
| Reset CTA | Continue → | same | |

---

## 8. Acceptance criteria

1. Cold start shows the logo **as is**, centred, on a flat brand colour — first from the native splash, then the JS splash with no visible jump — then goes to Welcome.
2. Every auth screen is a full-bleed coloured page with one organic blob bleeding off an edge; there are **no white sheets** on Login, Sign Up, Reset, OTP.
3. All fields and buttons are full pills, 48 px high; fields are translucent white with no border; buttons are solid white with a trailing arrow where the mockup has one.
4. Login at 390 × 844 fits without scrolling; the footer link is pinned at the bottom. `Remember me` and `Forgot Password?` share one row and their text centres are on the same horizontal line (≤ 1 px difference); spacing between fields, options row and button matches 3.2.
5. Submitting Login / Sign Up / OTP / New Password shows the dimmed page with the pulsing logo and `Loading..` centred; touches are blocked; content returns to full opacity afterwards.
6. Successful login lands on Welcome Back before Home.
7. The app displays as **Gabfix Home Solutions** on the home screen, in permission prompts and in any in-app wordmark; slug/package/scheme unchanged.
8. VoiceOver/TalkBack: every field announces its name (placeholders are not the only label), errors are announced, the loading overlay announces "Loading".
9. Contrast: white text on the brand gradient ≥ 4.5:1 for 14 px, placeholders ≥ 3:1 (tokens in 2.2 are set for this; re-check if the palette is changed).
10. `npx expo lint` and `npx tsc --noEmit` pass.

## 9. Suggested order of work

1. Tokens, fonts, `app.json` rename and splash plugin (30 min).
2. `AuthScreen`, `Blob`, `GlassInput`, `PillButton`, `LoadingOverlay` (half a day; verify against the mockup overlay).
3. Splash → Welcome → Login (the flow shown in the first and third mockups).
4. Sign Up, Reset Password, OTP.
5. Welcome Back, then Area select and Home retheme.
6. Illustrations when ready; swap the interim art.

## 10. Open questions

1. **Palette:** keep the Gabfix green/yellow (A1, default) or use the literal mockup blue/coral (Palette B)?
2. **Illustrations:** will you supply Gabfix-specific art for Welcome and Welcome Back, or should I design interim vector art?
3. **SMS-code login:** keep the small centred `Use SMS code` link under Login, or move it into the Reset/OTP flow?
