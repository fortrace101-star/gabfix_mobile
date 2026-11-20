# Implementation Phase 2 - Stage 3: Gabfix Home Solutions

Stage 3 of the Phase 2 guide. It **builds on** `Implementation Phase 2 - Stage 1.md` (**S1**, the full guide, Sections 0 to 16) and `Implementation Phase 2 - Stage 2.md` (**S2**) and does not repeat them. Where S1 or S2 already say what to do, this document points to the section (for example "S1 11.2") and adds only what they do not contain.

Written on 2026-11-20 against `gabfix_mobile-main` (Expo SDK 58.0.26, Expo Router 58.0.32, React Native 0.88.1, React 19.3.0). No `node_modules` and no network in the build sandbox, so **every code block here is unverified by a compiler** (`tsc`, lint and tests were not run). Claims about the code were checked by reading the files; claims about Expo were checked against the v58 documentation pages and are marked **verified** or **not re-read**.

> **Status line.** Write phase 1 is recorded in S2 (support call number `0703195401`, your six answers, defaults for Q17 to Q29). **The uploaded S2 stops after its Section 2**, although its own status line lists Sections 3 to 9. Stage 3 therefore carries **write phases 2 to 5**: verification (Section 1), corrections to S1 (Section 2), the final job-scope contract (Section 3), working code for the parts S1 only described (Section 4), one build order (Section 5), the progress-document patch (Section 6), the definition of done (Section 7) and the hand-off summary (Section 8). If you later complete S2's Sections 3 to 9 elsewhere, Stage 3 wins on any conflict because it was written after checking S1 against the code.

| Section | Part | Why it is needed |
|---|---|---|
| 1 | Verification log | What was checked in this pass, and what was not |
| 2 | Corrections to S1 | Eleven places where S1 conflicts with the code, the docs or itself |
| 3 | Final job-scope contract (P8b) | S1 3.2 to 3.16 (fixed fields) and S1 14.4 (schema) describe two different designs |
| 4 | Working code | S1 shows empty bodies for the transaction query, draft exit, assignment and form engine |
| 5 | One build order | S1 Section 6 holds two competing orders |
| 6 | Progress-document patch | Only what changes from S1 Section 8 |
| 7 | Definition of done and device matrix | One list for all ten workstreams |
| 8 | **Hand-off summary** | So Stage 4 never repeats an instruction |

**Design rule (unchanged):** reference screenshots are layout ideas only. Everything visual stays Gabfix: `src/theme/tokens.ts`, Poppins and Inter, the existing UI kit, Lucide icons. No new hex value, radius or spacing in any screen.

---

## 1. Verification log

### 1.1 Checked against the repository

| Check | Result |
|---|---|
| Every `colors.*`, `radius.*`, `shadow.*`, `text.*`, `font.*`, `space[n]`, `duration.*` token S1 uses | **All exist** (including `colors.errorBg`, `colors.scrim`, `colors.warningBg`, `radius.sheet`) |
| Store functions S1 calls on existing code: `payBookingBalance(id, method)`, `settleLateFees(ids, method)`, `updateBooking`, `cancelBooking`, `addNotification`, `useBookingDraft`, `patchDraft`, `resetDraft`, `startDraft`, `getBookingDraft`, `addReview`, `useServices`, `fromHourly`, `totalBalanceDue` | **All exist** |
| Names S1 introduces and marks new: `dueSummary`, `completeBooking`, `saveDraftNow`, `draftIsDirty`, `processDueAssignments`, `queryTransactions` | **Absent today**, correctly marked new |
| `NotificationKind` today | `'booking' \| 'reminder' \| 'payment' \| 'system'` (S1 adds `security`, `promo`; assignment and rating notices fit `booking`) |
| Draft persistence | `store/booking.ts` writes to AsyncStorage inside `setDraft`, so **every `patchDraft` is already persisted**. `resetDraft()` is `setDraft(null)`, which is why a screen that reads the draft goes blank (S1 12.1 cause confirmed) |
| `ButtonVariant` today | `primary \| onGreen \| secondary \| ghost \| destructive`; S1's `dangerGhost` is correctly marked new |
| Support details | The code still shows placeholders (`src/config/help.ts` holds `+256 700 000 000` and `support@gabfix.com`); `src/config/support.ts` does not exist yet. Write phase 1 changed the **documents**; step 1 of Section 5 changes the code |

### 1.2 Checked against the Expo SDK 58 documentation (2026-11-20)

| Item | Finding | Status |
|---|---|---|
| `expo-image-manipulator` (`~58.0.2`) | `ImageManipulator.manipulate(source)` returns a context (`resize`, `renderAsync`, then `saveAsync`); `manipulateAsync` is deprecated; included in Expo Go | **verified**: S1 3.8 sketch is right |
| `expo-file-system` (`~58.0.13`) | New `File`, `Directory`, `Paths` (`copy`, `move`, `File.downloadFileAsync`); legacy API still shipped at `expo-file-system/legacy`; included in Expo Go | **verified** |
| `expo-video` (`~58.0.1`) | `useVideoPlayer` and `VideoView`; thumbnails come from `generateThumbnailsAsync` in `expo-video`; `expo-video-thumbnails` is **deprecated**; included in Expo Go | **verified**: do not install `expo-video-thumbnails` |
| `expo-crypto` (`~58.0.8`) | Included in Expo Go. The retrieved v58 excerpt shows digest and AES APIs; `randomUUID` is documented on the SDK 54 page and nothing contradicts it | **partly verified**: confirm `randomUUID` on the v58 page when installing |
| `react-native-keyboard-controller` (`1.22.4`) | Listed in the SDK 58 third-party libraries and **marked included in Expo Go**; provides `KeyboardAwareScrollView` (with `bottomOffset`), `KeyboardToolbar`, sticky and avoiding views | **verified** (contradicts S1, see C1) |
| Expo Router `dismissTo` | Present on the router in SDK 58 (`push, navigate, replace, back, dismiss, dismissTo, dismissAll, canGoBack, canDismiss, setParams, prefetch`). `dismissTo` pops back to a screen already in the stack, and pushes if it is not there. `navigate` is an alias of `push` since Router v4. The SDK 58 migration page also **prefers `useRouter()` over the module-level `router`** | **verified** |
| Not re-read | `expo-device`; legacy `FileSystem.createUploadTask` (S1 3.11); `StorageAccessFramework.createFileAsync` with base64 content (S1 11.1); the `expo-notifications` time-interval trigger shape for the local assignment notice (not shown in S1; Section 4.3 marks it "confirm") | **still "confirm"** in the step that uses each |

---

## 2. Corrections to S1

Each row says where S1 is wrong, the evidence, and the fix. S1 stays the source for everything not listed here.

| # | S1 location | Problem | Evidence | Fix (wins over S1) |
|---|---|---|---|---|
| C1 | S1 5 (package table), 6 step 16, 10.1 risk row, 12.2 | Says `react-native-keyboard-controller` needs a **development build** and that SDK 58 support is unconfirmed | SDK 58 docs list it, recommend `1.22.4`, and mark it **included in Expo Go** | Install with `npx expo install react-native-keyboard-controller`; it runs in Expo Go. Remove the "confirm support" gate and the dev-build dependency from step 16. **Keep** the Android device pass and the `Modal` check, because those depend on the device, not on Expo Go |
| C2 | S1 12.1 (Save draft and Discard) | Uses `router.replace('/(tabs)/home')` and `router.replace('/(tabs)/services')`. From inside the booking stack, `replace` swaps the top screen for a **second copy of the tab navigator**, leaving `tabs, tabs` in history | Router docs: `replace` replaces the current route; `dismissTo` returns to a route already in the stack | Use `router.dismissTo(...)` for Save draft, Discard **and** the draft guard (Section 4.2). `dismissTo` pops back to the tab navigator already in the stack and, on a cold start where it is not in history, pushes it, so one call covers both cases |
| C3 | S1 6 (order of work) | Two competing orders: step 4 (`service-scope.ts`) is replaced by step 18; the "Recommended order" sentence and the lane paragraph both still mention steps 4 to 7; step 17 says "before step 5" but is listed after it | Read the table | Section 5 of this document replaces S1 Section 6 entirely |
| C4 | S1 6 steps 3 and 16 | Step 3 builds `ConfirmSheet`, but S1 4.5 defines `ConfirmSheet` as a wrapper over `BottomSheet`, which step 16 builds later | S1 4.5 and 11.5 | Build `BottomSheet` in the shared-components step **before** `ConfirmSheet` (Section 5, step 3) |
| C5 | S1 3.2 (`BookingMedia`) vs 14.4 rule 3 | 14.4 says media-slot files are saved "with a `slotId`", but `BookingMedia` has no such field | grep `slotId`: one hit, in 14.4 | Add `slotId?: string` to `BookingMedia` (Section 3.2) |
| C6 | S1 3.2 to 3.6, 3.14 to 3.16 vs 14.4 | Two designs for P8b: fixed typed fields (`BookingScope` with `bedrooms`, `scope.ts`, `service-scope.ts`) and a schema engine (`form-schema.ts`, `dynamic-form.tsx`) | D3 says schema; the checklists still list `service-scope.ts` and `scope.ts` | Section 3 states the one final contract and a keep, replace, delete table |
| C7 | S1 D17 and any "59%" | The accepted dip is quoted as "about 59%", which was the figure for 47 pages. With S1's 49 active pages the figure is **56.4%** (S1 8.5 already computes it) | S1 line 46 vs 2201 | Say "about 56%" everywhere; the **decision** (accept the dip, call it Phase 9) is unchanged |
| C8 | S1 D19 and the "confirm" notes in 3.7.3, 3.8, 4.4.2, 5 | Image manipulator, file system, video and crypto are listed as unchecked | Section 1.2 above | Treat them as verified except the three "not re-read" items; do not re-check the rest |
| C9 | S1 12.3 step 4 | Says to schedule a local notification but no helper exists: `push.ts` in S1 4.2.4 has permission and token functions only, and the trigger shape is not shown anywhere in S1 | S1 4.2.4 listing | Section 4.3 adds `scheduleLocal()` and `cancelLocal()` to `push.ts`; the trigger object stays marked "confirm" until read on the v58 page |
| C10 | S1 14.4 vs S1 3.4 | `suggestedMinutes(schema, answers)` (14.4) and `suggestHours(...)` (3.4) both turn answers into a suggested duration | Read both | One function: `suggestedMinutes` in `form-schema.ts`; `scope.ts` keeps only `hoursFromMinutes(minutes, cleaners)` (Section 3.5) |
| C11 | Module-level `router` everywhere | SDK 58 docs recommend `useRouter()` inside components | Router migration page | New code in this phase uses `const router = useRouter()`; do **not** rewrite existing screens just for this |

**Not wrong, only noting:** S1 creates ten new pages (P8b, P28, P29, P29a, P29b, P29c, P30, P22a, P22b, P26a), removes P3, and reaches **49 active pages with 39 built**. I re-added them: 40 existing, minus P3, plus 10 is 49. Correct.

---

## 3. Final job-scope contract (P8b)

S1 describes P8b twice: first with fixed typed fields (3.2 to 3.6), later with an admin-defined **form schema** (14.4). Decision D3 already chose the schema. This section is the **single contract** to build; where S1 3.x disagrees, this section wins. S1 14.4 keeps the field-type table, the `FormField`/`FormSchema` types and the behaviour rules; they are not repeated here.

### 3.1 What survives from S1 Section 3

| S1 section | Fate | Note |
|---|---|---|
| 3.1 Placement and flow, D1, D2 (five-stage stepper) | **Keep** | P8b stays between Details and Add-ons |
| 3.2 Data model | **Replace `BookingScope`**; keep `BookingMedia`, `BookingDraft` wiring and the store functions | Final types in 3.2 below |
| 3.3 Per-service scope config (`service-scope.ts`) | **Delete the file.** Its values become the seed schemas in `src/config/form-schemas.ts` (S1 14.4) | `src/config/size-bands.ts` stays and feeds the seed `select` options, so the quote form and P8b agree |
| 3.4 `scope.ts` suggestion logic | **Replace** with `form-schema.ts`; `scope.ts` keeps one helper (3.5 below) | C10 |
| 3.5 Components | **Keep** `CounterRow`, `MediaSheet`, `ScopeSummary`, `UploadStatus`; **add** `DynamicForm` and `MeasurementInput` (S1 14.4) | `ScopeSummary` renders the snapshot, not live fields |
| 3.6 Screen layout | **Keep** the outer frame; the field area becomes `DynamicForm` | 3.4 below |
| 3.7 to 3.13 Media sheet, pipeline, permissions, upload, edge cases | **Keep unchanged** | Only the `slotId` field is new (C5) |
| 3.14 Copy | **Keep** the screen copy; field labels, helpers and hints now come from the schema | Section 3.4 |
| 3.15 Per-file checklist, 3.16 Acceptance | **Replace** with 3.6 and 3.7 below | |

### 3.2 Final types (`src/lib/pricing.ts` for booking types, `src/lib/form-schema.ts` for schema types)

```ts
// Booking side (pricing.ts)
export type BookingMedia = {
  id: string;
  kind: 'photo' | 'video';
  uri: string;                 // file:// under documentDirectory (D6), never base64
  mimeType: string;
  bytes: number;
  width?: number;
  height?: number;
  durationMs?: number;
  createdAtISO: string;
  slotId?: string;             // set when the file answers a `media-slot` field (C5)
};

export type BookingScope = {
  schemaId: string;
  schemaVersion: number;
  answers: Record<string, FormValue>;   // keyed by field id (FormValue from form-schema.ts)
  notes?: string;                       // the always-present "Anything else we should know?" box
  acceptedSuggestionMinutes?: number;   // set only when the customer pressed Apply
  snapshot?: ScopeSnapshotRow[];        // written once, when the booking is saved
  touched?: boolean;                    // true once the customer edits an answer or the notes; seeding defaults does not count (used by draftIsDirty, 4.2)
};

export type BookingDraft = {
  // ...existing fields (hours, cleaners, frequency, materials, add-ons, schedule, location, payment)...
  scope?: BookingScope;
  media?: BookingMedia[];               // slot files and free files share one list (max 10 in total)
};
```

Store functions in `store/booking.ts`: `patchAnswers(changes: Record<string, FormValue>)`, `setScopeNotes(text)`, `setScopeSchema(schemaId, version)`, `addMedia(items)`, `removeMedia(id)`. `resetDraft()` still deletes the draft's media files (S1 3.8). `SavedBooking` gains `scope?` (with `snapshot` filled) and `media?`. `rebook` copies `scope.answers` and `notes`, **not** `media` and **not** `snapshot` (a new booking builds its own).

### 3.3 Data flow, end to end

| Moment | What happens |
|---|---|
| Opening P8b | `resolveSchema(service)` picks the schema (first match wins: `service.formSchemaId`, then its category's, then `defaultSchema`). The result is validated with `validateSchema`; an invalid schema logs in development and falls back to `defaultSchema`. The schema is cached in AsyncStorage under `gabfix.form-schema.<id>` so the page opens offline |
| First visit | `setScopeSchema(schema.id, schema.version)`; answers start from each field's `default` |
| Returning with a newer schema version | Keep every answer whose field id and type still match; clear the rest; if any **new required** field is unanswered, show the inline banner "We updated this form. Please check the new questions." and scroll to the first (S1 14.4 rule 5) |
| Editing | `patchAnswers` on every change, so the draft is always saved (draft persistence is automatic, Section 1.1). Hidden fields (`showIf` false) have their answers removed in the same patch |
| **Next** | `validateAnswers` on the visible fields; on errors scroll to the first one and focus it. On success: hourly service goes to Add-ons (S1 D1); `pricing: 'quote'` or `requiresQuote(...)` goes to the quote screen with `scope`, `notes` and `media` attached (S1 14.4 rule 4) |
| P12 saves the booking | `buildSnapshot(schema, answers)` is written into `scope.snapshot`, then media moves to its booking folder (S1 3.8). From now on **no screen reads the live schema for this booking** |
| P12, P14, P15b, P19 receipt, cleaner job sheet, admin | Render `snapshot` rows ("Bedrooms: 3", "Photo of the leak" with its picture) and the media strip |
| Admin renames a field later | Past bookings still read correctly because they carry their own snapshot |

### 3.4 Screen composition (P8b `/book/[slug]/scope`)

```text
TopBar (back opens the Save as draft drawer, S1 12.1)       StepperHeader current=1 of 5
Heading from the schema (for example "About your home")
[ Suggestion banner ]      only when suggestedMinutes() is defined and the service is hourly
Section 1 title            fields rendered by type (S1 14.4 table)
Section 2 title            ...
Anything else we should know?   multi-line, optional, always last of the questions
Photos and video  (card)   "Add photos or video" opens the MediaSheet (S1 3.7); count and "Required" chip
SummaryBar                 Next   |   Request quote   (quote mode)
```

- The suggestion banner reads "About {h} h with {n} cleaners usually does it" with **Apply**. Apply writes `hours` and `cleaners` through the existing `patchDraft` and sets `acceptedSuggestionMinutes`. It **never changes the price directly** (D4); the price remains `price()`.
- Field copy: label up to 60 characters, helper up to 140 (S1 14.4 limits). Required fields show the existing required marker, not red text on an empty form; errors appear after blur or on **Next**.
- Keyboard: the screen uses `KeyboardScreen` (S1 12.2) so the focused field sits above the keyboard.
- Quote mode footer copy: "Request quote"; the heading gains the line "We will confirm the price before you pay."

### 3.5 What `scope.ts` keeps

```ts
// src/lib/scope.ts (pure TypeScript)
/** Turns suggested minutes into whole hours for a number of cleaners; never below 1 h or above the booking limits. */
export function hoursFromMinutes(minutes: number, cleaners: number, limits: { min: number; max: number }): number {
  const perCleaner = minutes / Math.max(cleaners, 1) / 60;
  const rounded = Math.ceil(perCleaner * 2) / 2;            // half-hour steps
  return Math.min(Math.max(rounded, limits.min), limits.max);
}
```

Everything else S1 3.4 listed moves to `form-schema.ts` (Section 4.4). The dummy time values (Q6) now live in the seed schemas as `minutesPerUnit` and option `minutes`.

### 3.6 Final per-file checklist (Workstream B, replaces S1 3.15)

**New:** `src/lib/form-schema.ts`, `src/lib/scope.ts`, `src/config/form-schemas.ts`, `src/config/size-bands.ts`, `src/components/booking/dynamic-form.tsx`, `measurement-input.tsx`, `counter-row.tsx`, `media-sheet.tsx`, `scope-summary.tsx`, `upload-status.tsx`, `src/app/book/[slug]/scope.tsx`, `src/lib/media.ts`, `src/config/media.ts`, `src/store/media-uploads.ts`, `src/lib/__tests__/form-schema.test.ts`, `scope.test.ts`

**Modified:** `src/lib/pricing.ts` (types), `src/store/booking.ts` (answers, notes, media), `src/store/bookings.ts` (`scope`, `media`), `src/components/booking/stepper-header.tsx` (five stages), `src/app/book/[slug]/details.tsx` (`onNext` goes to `scope`), `add-ons.tsx` (`current=1`), `schedule.tsx`, `location.tsx`, `review.tsx` (`current` 2, 3, 4 and the scope card), `confirmed.tsx`, `booking/[id].tsx` (snapshot and media), `app.json` (S1 3.9), `src/app/_layout.tsx` (route)

**Deleted from S1's list:** `src/config/service-scope.ts`.

### 3.7 Acceptance criteria (Workstream B, replaces S1 3.16)

1. A service with **no** schema shows `defaultSchema` and books end to end.
2. Pointing a service at another schema id in config changes P8b with no other code change.
3. Hidden fields are not validated and are absent from the draft and the snapshot.
4. An unknown field type is skipped without a crash; a required unknown field is treated as optional (S1 14.4 rule 1).
5. After a booking is saved, renaming a label in the schema does not change that booking's details, receipt or admin row.
6. Photos and video follow S1 3.16 items on limits, permissions and upload (unchanged), plus: a `media-slot` file shows under its slot label on P15b.
7. Quote services and `requiresQuote` answers end in the quote screen with scope, notes and media attached.
8. `form-schema.test.ts` and `scope.test.ts` pass; `npx tsc --noEmit` and `npx expo lint` are clean.

---

## 4. Working code for the parts S1 only described

All blocks are TypeScript sketches written against the code as read; none was compiled. Each states its target file, its imports and the existing functions it relies on. Where S1 already gives the full spec (limits, copy, UI), only the missing logic is here.

### 4.1 Transaction query (`src/lib/wallet.ts`, S1 11.4)

Needs: `serviceName` added to `WalletTransaction` and filled in `walletTransactions()` (each row already knows its `booking`). `method` holds the stored method id (`mtn_momo`, `airtel_money`, `visa_card`, `cash`) or `undefined`.

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

const METHOD_LABEL: Record<string, string> = {
  mtn_momo: 'MTN Mobile Money mtn momo',
  airtel_money: 'Airtel Money airtel',
  visa_card: 'Visa card',
  cash: 'Cash',
};

const DAY = 86_400_000;

const haystack = (tx: WalletTransaction): string => {
  const date = new Date(tx.atISO);
  const month = date.toLocaleDateString('en-GB', { month: 'long' });
  const monthShort = date.toLocaleDateString('en-GB', { month: 'short' });
  return [
    tx.title, tx.serviceName ?? '', tx.bookingId, METHOD_LABEL[tx.method ?? ''] ?? tx.method ?? '',
    month, monthShort, String(date.getFullYear()), tx.kind,
  ].join(' ').toLowerCase();
};

const inPeriod = (tx: WalletTransaction, period: TransactionQuery['period'], now: Date): boolean => {
  if (period === 'all') return true;
  const at = new Date(tx.atISO).getTime();
  if (period === 'month') {
    const d = new Date(tx.atISO);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  return at >= now.getTime() - days * DAY && at <= now.getTime() + DAY;
};

export const queryTransactions = (
  all: WalletTransaction[],
  q: TransactionQuery,
  now: Date = new Date(),
): WalletTransaction[] => {
  const tokens = q.text.toLowerCase().split(/\s+/).map((t) => t.replace(/[,]/g, '')).filter(Boolean);

  const result = filterTransactions(all, q.kind)
    .filter((tx) => q.method === 'all' || tx.method === q.method)
    .filter((tx) => inPeriod(tx, q.period, now))
    .filter((tx) => q.direction === 'all' || tx.direction === q.direction)
    .filter((tx) => {
      if (tokens.length === 0) return true;
      const text = haystack(tx);
      const amount = String(Math.round(tx.amount));
      // every word must match somewhere; digit-only words also match the amount ("45000" finds UGX 45,000)
      return tokens.every((t) => text.includes(t) || (/^\d+$/.test(t) && amount.includes(t)));
    });

  const byDate = (a: WalletTransaction, b: WalletTransaction) => a.atISO.localeCompare(b.atISO);
  return result.sort((a, b) => {
    if (q.sort === 'oldest') return byDate(a, b) || a.id.localeCompare(b.id);
    if (q.sort === 'amount') return b.amount - a.amount || byDate(b, a) || a.id.localeCompare(b.id);
    return byDate(b, a) || a.id.localeCompare(b.id);          // newest, stable on equal times
  });
};

export const activeFilterCount = (q: TransactionQuery): number =>
  (q.method !== 'all' ? 1 : 0) + (q.period !== 'all' ? 1 : 0) +
  (q.direction !== 'all' ? 1 : 0) + (q.sort !== 'newest' ? 1 : 0);   // `kind` chips and text are visible, so not counted
```

Screen use (`profile/payments.tsx`): `const [q, setQ] = useState(defaultTransactionQuery)`; debounce only the `text` field (200 ms) into `q.text`; `const rows = useMemo(() => queryTransactions(transactions, q), [transactions, q])`; render the first 20 rows with a **Show more** row (adds 20); empty state when `rows.length === 0 && transactions.length > 0` with **Clear filters** calling `setQ(defaultTransactionQuery)`.

**Tests (`wallet.test.ts`, pass a fixed `now = new Date('2026-11-20T12:00:00Z')`):** `45000` and `45,000` both find a UGX 45,000 row (a UGX 450,000 row also matches, because digit words match as substrings; this is the documented behaviour, change it to equality if you prefer); `mtn` finds MTN rows only; month words (`november`) match by date; `7d` includes a row from 6 days ago and excludes 8 days ago; `month` excludes last month; `direction: 'in'` returns refunds only; `amount` sort breaks ties by newest; `activeFilterCount` is 0 for the default and 4 when all four are set; an empty result array is returned (not `undefined`).

### 4.2 Draft exit, dirty check and guard (`src/lib/use-draft-exit.ts`, `store/booking.ts`, S1 12.1)

**Store additions (`store/booking.ts`):**

```ts
import { emptyDraft, type BookingDraft } from '@/lib/pricing';

/** True only when the customer changed something. Opening a screen must not count. */
export function draftIsDirty(draft: BookingDraft | null): boolean {
  if (!draft) return false;
  const blank = emptyDraft(draft.serviceSlug);
  const strip = (d: BookingDraft) => JSON.stringify({ ...d, scope: undefined, media: undefined, lastStep: undefined });
  return (
    strip(draft) !== strip(blank) ||
    Boolean(draft.scope?.touched) ||            // set by patchAnswers and setScopeNotes only, not by seeding defaults
    (draft.media?.length ?? 0) > 0
  );
}

/** Awaits the write so Home never reads a stale draft after Save draft. */
export async function saveDraftNow(): Promise<void> {
  if (!state.draft) return;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state.draft)).catch(() => undefined);
}
```

`BookingDraft` gains `lastStep?: string` (the route name, written by each screen in a `useEffect`) and `BookingScope` gains `touched?: boolean`.

**Hook:**

```ts
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { BackHandler, InteractionManager } from 'react-native';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import {
  draftIsDirty, getBookingDraft, resetDraft, saveDraftNow, startDraft,
  useBookingDraft, useBookingDraftHydrated,
} from '@/store/booking';

let exiting = false;        // module flag: the guard must not react while an exit is in progress

export function useDraftExit(): { requestExit: () => void; sheet: ReactNode } {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const leave = useCallback(async (to: 'home' | 'services') => {
    exiting = true;
    setOpen(false);
    if (to === 'home') await saveDraftNow();
    router.dismissTo(to === 'home' ? '/(tabs)/home' : '/(tabs)/services');
    if (to === 'services') {
      // Reset after the transition so the leaving screen never renders without its draft.
      InteractionManager.runAfterInteractions(() => { setTimeout(resetDraft, 350); });
    }
    setTimeout(() => { exiting = false; }, 800);
  }, [router]);

  const requestExit = useCallback(() => {
    if (!draftIsDirty(getBookingDraft())) {     // nothing to save: leave quietly, keep no draft
      void leave('services');
      return;
    }
    setOpen(true);
  }, [leave]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { requestExit(); return true; });
    return () => sub.remove();
  }, [requestExit]);

  const sheet = (
    <BottomSheet visible={open} onClose={() => setOpen(false)} title="Save as draft?"
      body="Your choices are kept so you can finish booking later.">
      <Button label="Save draft" onPress={() => void leave('home')} />
      <Button label="Discard" variant="dangerGhost" onPress={() => void leave('services')} />
      <Button label="Keep editing" variant="ghost" onPress={() => setOpen(false)} />
    </BottomSheet>
  );
  return { requestExit, sheet };
}

/** Replaces `if (!active) return <View/>`: no draft for this service means go to Services, never a blank page. */
export function useDraftGuard(slug: string, opts: { startIfMissing?: boolean } = {}): boolean {
  const router = useRouter();
  const hydrated = useBookingDraftHydrated();
  const draft = useBookingDraft();
  const ready = draft?.serviceSlug === slug;
  useEffect(() => {
    if (!hydrated || ready || exiting) return;
    if (opts.startIfMissing) startDraft(slug);
    else router.dismissTo('/(tabs)/services');
  }, [hydrated, ready, slug, opts.startIfMissing, router]);
  return ready;
}
```

Use: Details calls `useDraftGuard(slug, { startIfMissing: true })` (it is the entry); every later step calls `useDraftGuard(slug)`; a screen renders its skeleton (not an empty `View`) while `ready` is false. `confirmed.tsx` keeps `resetDraft()` on mount and **does not** call the guard. Home: `useFocusEffect` scrolls to the top; a one-time toast "Draft saved" is shown when `leave('home')` ran (a module flag read once by Home).

**Assumption to confirm when building `BottomSheet`:** this sketch gives it `visible`, `onClose`, `title`, `body` and `children`. If S1 11.5's final props differ, adapt the three lines of JSX; the logic does not change. Also confirm that **Discard** needs a destructive look: `dangerGhost` is new (S1 16.2), and the draft sheet can reuse it.

**Tests (`use-draft-exit` is UI, so test the pure parts):** `draftIsDirty` is false for `emptyDraft`, false after only a schema is seeded, true after changing hours, true when `scope.touched`, true with one media item.

### 4.3 Cleaner assignment simulation (`src/lib/assignment.ts`, S1 12.3)

Additions this needs elsewhere: `getBookings()` exported from `store/bookings.ts` (today only `getBookingById` and the hook exist); `SavedBooking.assignAtISO`, `assignedAtISO`, `localNoticeId`; `Cleaner.photoUri`, `Cleaner.kind`; and `scheduleLocal` and `cancelLocal` in `src/lib/push.ts`. S1 4.2.4's `push.ts` has permission and token helpers only, so the two scheduling helpers are **new** (C9).

```ts
// src/lib/push.ts (additions)
export async function scheduleLocal(opts: {
  id: string; title: string; body: string; data?: Record<string, unknown>; seconds: number;
}): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  if ((await getPushPermission()) !== 'granted') return null;
  return Notifications.scheduleNotificationAsync({
    identifier: opts.id,
    content: { title: opts.title, body: opts.body, data: opts.data },
    // CONFIRM against the v58 notifications page: the trigger object and its `type` constant.
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: opts.seconds },
  });
}

export async function cancelLocal(id: string): Promise<void> {
  if (Platform.OS !== 'web') await Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined);
}
```

```ts
// src/lib/assignment.ts
import { cleaners as roster, type Cleaner } from '@/config/cleaners';
import { mock } from '@/config/mock';
import { addNotification } from '@/store/notifications';
import { getBookings, updateBooking, type SavedBooking } from '@/store/bookings';

/** Preferred cleaner if the customer chose one; else the best-rated eligible roster member. Deterministic. */
export function pickAssignee(booking: SavedBooking, list: readonly Cleaner[] = roster): Cleaner | undefined {
  if (booking.cleanerId) {
    const preferred = list.find((c) => c.id === booking.cleanerId);
    if (preferred) return preferred;
  }
  return [...list]
    .filter((c) => c.serviceSlugs.includes(booking.serviceSlug))
    .sort((a, b) => b.rating - a.rating || a.id.localeCompare(b.id))[0];
}

const when = (b: SavedBooking) =>
  b.dateISO
    ? new Date(b.dateISO).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
    : 'your booking';

/** Idempotent: safe to call on boot, on foreground and on a timer. Returns how many bookings were assigned. */
export function processDueAssignments(now: Date = new Date()): number {
  if (!mock.assignment.enabled) return 0;
  let assigned = 0;
  for (const booking of getBookings()) {
    if (booking.status !== 'upcoming' || booking.assignedAtISO || !booking.assignAtISO) continue;
    if (new Date(booking.assignAtISO).getTime() > now.getTime()) continue;
    const who = pickAssignee(booking);
    if (!who) continue;                                        // no eligible roster member: try again next run
    updateBooking(booking.id, {
      cleanerId: who.id, cleanerName: who.name, assignedAtISO: now.toISOString(),
    });
    addNotification({
      id: `assign-${booking.id}`,                              // same id replaces, so never twice
      kind: 'booking',
      title: who.kind === 'technician' ? 'Your technician is assigned' : 'Your cleaner is assigned',
      body: `${who.name} will handle your ${booking.serviceName} on ${when(booking)}.`,
      createdAtISO: now.toISOString(),
      href: `/booking/${booking.id}`,
    });
    assigned += 1;
  }
  return assigned;
}

/** Next due time among unassigned bookings, so the runner can set one timer. */
export function nextAssignmentDelay(now: Date = new Date()): number | null {
  const due = getBookings()
    .filter((b) => b.status === 'upcoming' && !b.assignedAtISO && b.assignAtISO)
    .map((b) => new Date(b.assignAtISO as string).getTime() - now.getTime());
  return due.length ? Math.max(Math.min(...due), 0) : null;
}
```

**Runner (`src/hooks/use-assignment-runner.ts`, mounted once in `_layout.tsx` after hydration):** call `processDueAssignments()` once; subscribe to `AppState` and call it on every change to `active`; after each run `setTimeout(run, nextAssignmentDelay() ?? never)` (clear on unmount).

**At booking creation (`addBooking` caller on P12):** set `assignAtISO = new Date(Date.now() + mock.assignment.delayMs).toISOString()`; then, if the Notifications setting allows push, `localNoticeId = await scheduleLocal({ id: 'assign-' + id, title: 'Your cleaner is assigned', body: '...', data: { href: '/booking/' + id }, seconds: mock.assignment.delayMs / 1000 })`. The local notice text is generic ("Open Gabfix to see who is coming") because the assignee is only chosen when the app next runs; the in-app row carries the name. Cancelling or rescheduling a booking calls `cancelLocal(booking.localNoticeId)` and clears `assignAtISO`. Turning push off in P28 cancels every pending `assign-*` notice.

**Tests (`assignment.test.ts`, `getBookings` mocked):** nothing happens before `assignAtISO`; one assignment after it; a second call assigns nothing and adds no second notification; a cancelled booking is skipped; the preferred cleaner wins over a better-rated one; no eligible cleaner leaves the booking unassigned; `nextAssignmentDelay` is `null` with no pending bookings.

---

### 4.4 Form engine core (`src/lib/form-schema.ts`, S1 14.4)

Paste the types `FormValue`, `FieldOption`, `FormField`, `FormSection`, `FormSchema`, `ScopeSnapshotRow` from S1 14.4 at the top of the file. No React Native imports (the admin web app imports this file).

```ts
export const schemaLimits = {
  maxSections: 5, maxFieldsPerSection: 12, maxFields: 40,
  label: 60, helper: 140, optionsMin: 2, optionsMax: 20, textMax: 120, textareaMax: 500, mediaSlotMax: 5,
} as const;

const ID = /^[a-z][a-z0-9_-]{0,39}$/;
const flatFields = (s: FormSchema): FormField[] => s.sections.flatMap((x) => x.fields);

/** Returns a list of problems; an empty list means the schema is valid. */
export function validateSchema(schema: FormSchema): string[] {
  const out: string[] = [];
  const L = schemaLimits;
  if (!ID.test(schema.id)) out.push('schema id is not a valid slug');
  if (!Number.isInteger(schema.version) || schema.version < 1) out.push('version must be a whole number from 1');
  if (schema.sections.length < 1 || schema.sections.length > L.maxSections) out.push('1 to 5 sections');
  const fields = flatFields(schema);
  if (fields.length < 1 || fields.length > L.maxFields) out.push('1 to 40 fields in total');
  const seen = new Set<string>();
  schema.sections.forEach((sec) => {
    if (sec.fields.length < 1 || sec.fields.length > L.maxFieldsPerSection) out.push(`section "${sec.title}": 1 to 12 fields`);
  });
  fields.forEach((f, i) => {
    const at = `field "${f.id}"`;
    if (!ID.test(f.id)) out.push(`${at}: id is not a valid slug`);
    if (seen.has(f.id)) out.push(`${at}: duplicate id`);
    if (!f.label.trim() || f.label.length > L.label) out.push(`${at}: label must be 1 to ${L.label} characters`);
    if (f.helper && f.helper.length > L.helper) out.push(`${at}: helper over ${L.helper} characters`);
    const choice = f.type === 'select' || f.type === 'multiselect';
    if (choice) {
      const n = f.options?.length ?? 0;
      if (n < L.optionsMin || n > L.optionsMax) out.push(`${at}: 2 to 20 options`);
      const ids = new Set<string>();
      (f.options ?? []).forEach((o) => {
        if (!ID.test(o.id) || ids.has(o.id)) out.push(`${at}: option "${o.id}" is invalid or repeated`);
        ids.add(o.id);
        if (!o.label.trim()) out.push(`${at}: option "${o.id}" has no label`);
      });
    } else if (f.options?.length) out.push(`${at}: only select and multiselect take options`);
    if (['number', 'counter', 'measurement'].includes(f.type) && f.min != null && f.max != null && f.min > f.max) {
      out.push(`${at}: min is above max`);
    }
    if (f.type === 'counter' && ((f.min ?? 0) < 0 || (f.step ?? 1) < 1)) out.push(`${at}: counter needs min of 0 or more and step of 1 or more`);
    if (f.type === 'media-slot' && (f.maxMedia ?? 1) > L.mediaSlotMax) out.push(`${at}: maxMedia is above ${L.mediaSlotMax}`);
    if (f.showIf) {
      const target = fields.slice(0, i).find((x) => x.id === f.showIf!.fieldId);   // earlier fields only: no cycles possible
      if (!target) out.push(`${at}: showIf must point at an earlier field`);
      if (f.showIf.op !== 'truthy' && f.showIf.value === undefined) out.push(`${at}: showIf needs a value`);
    }
    seen.add(f.id);
  });
  return out;
}

const isEmpty = (v: FormValue | undefined): boolean =>
  v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);

const asNumber = (v: FormValue | undefined): number | undefined =>
  typeof v === 'number' ? v : typeof v === 'object' && v && !Array.isArray(v) ? v.value : undefined;

function passes(c: NonNullable<FormField['showIf']>, a: Record<string, FormValue>): boolean {
  const v = a[c.fieldId];
  switch (c.op) {
    case 'eq': return v === c.value;
    case 'neq': return v !== c.value;
    case 'in': return Array.isArray(c.value) ? c.value.includes(v as string) : false;
    case 'gt': return typeof v === 'number' && typeof c.value === 'number' && v > c.value;
    case 'lt': return typeof v === 'number' && typeof c.value === 'number' && v < c.value;
    case 'truthy': return !isEmpty(v) && v !== false && v !== 0;
    default: return true;                                // unknown operator from a newer admin: show the field
  }
}

/** A field is visible when its own condition passes AND the field it depends on is itself visible. */
export function visibleFields(schema: FormSchema, answers: Record<string, FormValue>): FormField[] {
  const shown = new Set<string>();
  const out: FormField[] = [];
  for (const f of flatFields(schema)) {
    const ok = !f.showIf || (shown.has(f.showIf.fieldId) && passes(f.showIf, answers));
    if (ok) { shown.add(f.id); out.push(f); }
  }
  return out;
}

/** Drops answers of hidden or removed fields. */
export function pruneAnswers(schema: FormSchema, answers: Record<string, FormValue>): Record<string, FormValue> {
  const keep = new Set(visibleFields(schema, answers).map((f) => f.id));
  return Object.fromEntries(Object.entries(answers).filter(([id]) => keep.has(id)));
}

const KNOWN = new Set(['text', 'textarea', 'number', 'counter', 'select', 'multiselect', 'boolean', 'measurement', 'media-slot']);

export function validateAnswers(schema: FormSchema, answers: Record<string, FormValue>): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const f of visibleFields(schema, answers)) {
    if (!KNOWN.has(f.type)) continue;                    // unknown type: treated as optional (S1 14.4 rule 1)
    const v = answers[f.id];
    const missing = f.type === 'boolean' ? typeof v !== 'boolean' : isEmpty(v);
    if (missing) { if (f.required) errors[f.id] = 'This is required.'; continue; }
    const n = asNumber(v);
    if (['number', 'counter', 'measurement'].includes(f.type)) {
      if (n === undefined || Number.isNaN(n)) errors[f.id] = 'Enter a number.';
      else if (f.min != null && n < f.min) errors[f.id] = `Enter ${f.min} or more.`;
      else if (f.max != null && n > f.max) errors[f.id] = `Enter ${f.max} or less.`;
      else if (f.type === 'counter' && !Number.isInteger(n)) errors[f.id] = 'Enter a whole number.';
    }
    if (f.type === 'text' && String(v).length > schemaLimits.textMax) errors[f.id] = `Keep it under ${schemaLimits.textMax} characters.`;
    if (f.type === 'textarea' && String(v).length > schemaLimits.textareaMax) errors[f.id] = `Keep it under ${schemaLimits.textareaMax} characters.`;
    if (f.type === 'select' && !f.options?.some((o) => o.id === v)) errors[f.id] = 'Choose one of the options.';
    if (f.type === 'multiselect' && !(Array.isArray(v) && v.every((x) => f.options?.some((o) => o.id === x)))) errors[f.id] = 'Choose from the options.';
  }
  return errors;
}

/** Minutes the answers suggest, or undefined when no visible field has a time effect. */
export function suggestedMinutes(schema: FormSchema, answers: Record<string, FormValue>): number | undefined {
  let total = 0;
  let any = false;
  for (const f of visibleFields(schema, answers)) {
    const v = answers[f.id];
    if (f.minutesPerUnit != null) { any = true; total += f.minutesPerUnit * (asNumber(v) ?? 0); }
    const picked = f.type === 'select' ? [v] : f.type === 'multiselect' && Array.isArray(v) ? v : [];
    for (const o of f.options ?? []) {
      if (o.minutes != null) any = true;
      if (o.minutes != null && picked.includes(o.id)) total += o.minutes;
    }
  }
  return any ? Math.ceil(total / 15) * 15 : undefined;
}

export function requiresQuote(schema: FormSchema, answers: Record<string, FormValue>): boolean {
  return visibleFields(schema, answers).some((f) => {
    const v = answers[f.id];
    const picked = f.type === 'select' ? [v] : f.type === 'multiselect' && Array.isArray(v) ? v : [];
    return (f.options ?? []).some((o) => o.flagsQuote && picked.includes(o.id));
  });
}

const display = (f: FormField, v: FormValue): string => {
  if (f.type === 'select') return f.options?.find((o) => o.id === v)?.label ?? String(v);
  if (f.type === 'multiselect' && Array.isArray(v)) return v.map((id) => f.options?.find((o) => o.id === id)?.label ?? id).join(', ');
  if (f.type === 'boolean') return v ? 'Yes' : 'No';
  if (f.type === 'measurement' && v && typeof v === 'object' && !Array.isArray(v)) return `${v.value} ${v.unit}`;
  if (f.type === 'media-slot' && Array.isArray(v)) return `${v.length} ${v.length === 1 ? 'file' : 'files'}`;
  if ((f.type === 'number' || f.type === 'counter') && f.unit) return `${v} ${f.unit}`;
  return String(v);
};

export function buildSnapshot(schema: FormSchema, answers: Record<string, FormValue>): ScopeSnapshotRow[] {
  return visibleFields(schema, answers)
    .filter((f) => !isEmpty(answers[f.id]) && KNOWN.has(f.type))
    .map((f) => ({ fieldId: f.id, label: f.label, type: f.type, value: answers[f.id], display: display(f, answers[f.id]) }));
}

export const defaultSchema: FormSchema = {
  id: 'default', version: 1, heading: 'About the job', mediaRequired: false,
  mediaHint: 'Photos or a short video help us plan the visit.',
  sections: [{
    id: 'basics', title: 'The job',
    fields: [
      { id: 'describe', type: 'textarea', label: 'Describe the job', required: true },
      { id: 'size', type: 'select', label: 'Rough size', required: true, options: [
        { id: 'small', label: 'Small' }, { id: 'medium', label: 'Medium' }, { id: 'large', label: 'Large' }, { id: 'unsure', label: 'Not sure' },
      ] },
      { id: 'urgency', type: 'select', label: 'How urgent?', required: false, options: [
        { id: 'flexible', label: 'Flexible' }, { id: 'week', label: 'This week' }, { id: 'urgent', label: 'Urgent' },
      ] },
    ],
  }],
};

/** First match wins: the service's schema, then its category's, then the global default. */
export function resolveSchema(
  service: { formSchemaId?: string; categoryId: string },
  categoryOf: (id: string) => { formSchemaId?: string; parentId: string | null } | undefined,
  byId: (id: string) => FormSchema | undefined,
): FormSchema {
  const candidates: (string | undefined)[] = [service.formSchemaId];
  for (let id: string | null = service.categoryId, guard = 0; id && guard < 3; guard += 1) {
    const cat = categoryOf(id);
    candidates.push(cat?.formSchemaId);
    id = cat?.parentId ?? null;
  }
  for (const c of candidates) {
    const s = c ? byId(c) : undefined;
    if (s && validateSchema(s).length === 0) return s;
  }
  return defaultSchema;
}
```

**Tests (`form-schema.test.ts`):** `defaultSchema` is valid; duplicate id, 41 fields, one option, `showIf` pointing forward, `min > max`, and a counter with `min: -1` each produce a problem; hiding a parent hides its child (cascade); `pruneAnswers` drops hidden answers; `validateAnswers` covers required text, counter bounds, unknown option, hidden required field skipped, unknown field type skipped; `suggestedMinutes` returns `undefined` with no time effects and rounds up to 15 otherwise; `requiresQuote` is true only for a visible flagged option; `buildSnapshot` skips empty and hidden fields and formats each type; `resolveSchema` prefers the service, then the category, then its parent, then the default, and falls back to the default when a candidate schema is invalid.

---

## 5. One build order (replaces S1 Section 6)

Sizes: S under a day, M one to three days, L three to five days, for one developer; estimates, not commitments. This order resolves C1, C3 and C4. **A development build is still required** for the camera and microphone permission strings, remote push on Android, and Face ID on iOS (S1 4.12); it is **no longer** required for the keyboard library (C1). Start the build in step 2 and let it run.

| Step | Work | Size | Depends on | Notes |
|---|---|---|---|---|
| 0 | Housekeeping that is documentation or route registration only (S1 7.1, 7.2) | S | none | Zero risk; clean baseline |
| 1 | **Write phase 1 in code:** `src/config/support.ts` with `0703195401`, `ContactOptions`, `/help/contact` hand-offs, admin import, `support.test.ts` (S1 Section 2) | S to M | 0 | All three channels live |
| 2 | Install packages (S1 5 plus `react-native-keyboard-controller`; **not** `expo-video-thumbnails`), edit `app.json` once, `npx expo-doctor`, **start the dev builds** | S | 0 | One commit, one build per platform |
| 3 | **Shared UI foundation, in this order:** `BottomSheet`, then `ConfirmSheet` on top of it, `InlineBanner`, `StatTile`, `Avatar`, `FilterChip`, `settings-list` extraction (Profile must look identical), `PermissionCard` icon prop, `newId()`, `KeyboardProvider` and `KeyboardScreen`, the `dangerGhost` Button variant | M | 0, 2 | Everything later imports these; fixes C4 |
| 4 | **Remove Service Areas** (S1 15.3 steps 1 to 8) | M | 0 | Before steps 6, 15 and 17, which all touch the location step or Home |
| 5 | **Catalogue and form engine data layer:** category tree, 18 services, `form-schema.ts`, seed schemas, `resolveSchema`, tests (S1 14.2, 14.4; Section 4.4) | M to L | 3 | Replaces the old "B data layer" step |
| 6 | **Workstream B core:** types (Section 3.2), stores, five-stage stepper, `DynamicForm`, P8b **without media**, scope card on P12 | L | 4, 5 | Ship quote-mode branch here |
| 7 | **B media:** pipeline, `MediaSheet`, permissions, draft file lifecycle, `media-slot` rows | L | 2, 6 | Camera needs the dev build |
| 8 | **B upload:** queue, `UploadStatus`, P14 and P15b, mock failure flag | M | 7 | Backend contract can lag |
| 9 | **C data layer:** profile-settings v2 and migration, notification policy, quiet hours, security store, device id, sessions store and hook, auth `device` field, tests | M | 3 | Migrate before any screen reads the new shape |
| 10 | **C P28** Notification preferences, `push.ts` (add `scheduleLocal`, `cancelLocal`, Section 4.3), channels, handler, inbox gear | M | 2, 9 | Real permission behaviour needs the dev build |
| 11 | **C P30** Devices and sessions, then **P29** Security and **P29a, P29c** | M | 9 | P29 reads the hook from P30 |
| 12 | **C P29b** Two-factor, sign-in branch, recovery codes | M | 11 | |
| 13 | **C unlock:** `biometrics.ts`, app lock, `runExternalFlow` around every picker | M | 2, 7 | Touches existing avatar, quote, chat and review pickers |
| 14 | **Workstream E:** `momo.ts` and picker, review changes, Pay balance flow, `queryTransactions` (Section 4.1), receipt download | L | 3 | Mock processing page; no money moves |
| 15 | **Workstream F, drafts and keyboard:** `useDraftExit`, `useDraftGuard`, `draftIsDirty`, `saveDraftNow` (Section 4.2); convert the listed screens to `KeyboardScreen` | M | 3, 4 | Android device pass for the keyboard rule |
| 16 | **Workstream F, assignment, completion, rating:** `assignment.ts` and runner (Section 4.3), `completeBooking`, two-part rating | M | 10, 14 | Uses `scheduleLocal` from step 10 |
| 17 | **Workstream G:** Home clean-up, stat tiles, Balance due card, Most popular row | M | 4, 14, 16 | Balance due reads `dueSummary` from step 14 |
| 18 | **Workstream H UI:** Services tab twin cards, service page clean-up | L | 5, 6 | Quote-mode services reuse the quote screens |
| 19 | **Workstream J:** ticket centre and Help Center, FAQ chips, red Cancel booking, Bookings label, Refer lists | M | 3, 7 | Ticket screenshots reuse the media pipeline |
| 20 | Progress-document patch (Section 6), tests green, scripted 390 x 844 browser pass | S | 0 to 19 | |
| 21 | Device matrix (Section 7), then flip statuses | M | 2, 20 | Nothing is Done before this |

**Backend stage** (Supabase, Expo tools, Firebase) starts after step 21 (D15). Quiet hours and the 400/403 wrong-password rule are implemented there (D16).

**Lanes for two developers:** lane 1 = 1, 4, 5, 6, 7, 8, 18, 19; lane 2 = 9 to 17. Step 3 is the shared start; step 2 runs in the background for both.

---

## 6. Progress-document patch (delta from S1 Section 8)

Apply S1 Section 8 as written, then change only this:

1. **Score wording (C7).** Everywhere S1 or the log says "about 59%", write **about 56%**. Arithmetic, unchanged from S1 8.5: 39 of 49 active pages = 79.6% of the 45-point track = 35.8 points, plus 20.6 from the other tracks = **56.4%**. The decision to accept the dip stays (D17).
2. **Guidelines versions line:** `Implementation_Phase_2 Stage 1, Stage 2, Stage 3`.
3. **Decisions log (after S1's batch), Stage 3 additions:** one entry each for: keyboard library confirmed for Expo Go (C1); draft exits use `dismissTo` (C2); one build order (C3); `BottomSheet` before `ConfirmSheet` (C4); `slotId` on media (C5); P8b is schema-driven and `service-scope.ts` is deleted (C6); one suggestion function (C10).
4. **Deviations:** add "`dangerGhost` Button variant is new"; "image manipulator, file system, video, crypto, keyboard library verified on the v58 pages".
5. **QA table:** add rows only for checks actually run. Until the compiler runs, write "code-reviewed, not compiled" for every item in this phase.
6. **Open items:** no new item. The three unchecked APIs (Section 1.2) are noted inside the steps that use them (11.1, 3.11, 4.3).

---

## 7. Definition of done and device matrix (all ten workstreams)

A workstream is **Done** when all of these hold. Until then its status stays 🟨.

1. Every acceptance list passes: S1 2.11, 3.16 (as replaced by Section 3.7), 4.7, 11.7, 12.6, 13.7, 14.9, 15.5, 16.7.
2. `npx tsc --noEmit`, `npx expo lint`, `npm test` and `npx expo-doctor` are clean.
3. No hard-coded colour, radius or spacing; tokens, the shared UI kit and Lucide icons only.
4. The scripted 390 x 844 browser pass covers what runs on web; results are in the QA table.
5. The device matrix below is run on real hardware and recorded.
6. The progress-document patch (Section 6 and S1 8) is merged with the code.

**Test files that must exist:** `support`, `form-schema`, `scope`, `wallet`, `momo`, `assignment`, `draft` (the pure parts of Section 4.2), `quiet-hours`, `notify-policy`, `profile-settings` (migration), `account` (deletion scope), plus the four existing suites.

| Check | iPhone (home indicator) | Android, 3-button navigation | Android, gesture navigation | Web 390 x 844 |
|---|---|---|---|---|
| Every sheet touches the bottom edge (S1 11.5) | yes | **yes (your Galaxy reference phone uses this)** | yes | n/a |
| Keyboard keeps the active field in view, including chat and sheets | yes | yes | yes | n/a |
| Camera, microphone, library, 25 MB and 30 s limits | yes | yes | yes | library only |
| Download PDF saves a named file | Save to Files | folder picker, then Downloads | same | print view |
| Local push at 6 minutes, in-app row once | yes | yes | yes | in-app only |
| Save draft goes to Home card; Discard goes to Services, no blank frame | yes | yes | yes | yes |
| Face ID or fingerprint lock; picker does not trigger it | yes | yes | yes | n/a |
| Selected tab and FAQ chip alignment at 100% and 130% text | yes | yes | yes | yes |

---

## 8. Hand-off summary (so Stage 4 never repeats an instruction)

### 8.1 Settled; do not restate in later documents

| Topic | Final position | Where it lives |
|---|---|---|
| Support details | Email `gabfixuganda@gmail.com`, call `0703195401`, WhatsApp `0752777774`, all via `src/config/support.ts`; validation hides a malformed number | S1 Section 2, D18 |
| Phase name and score | **Phase 9**; 49 active pages, 39 built; score about **56%** | S1 8, Section 6 above |
| Backend timing | Supabase, Expo tools and Firebase **after** the front end; local storage in mock mode until then; quiet hours and wrong-password 400/403 arrive with it | S1 D15, D16 |
| P8b | Between Details and Add-ons; **schema-driven**; `service-scope.ts` deleted | Section 3, S1 14.4 |
| Media | Files, never base64; upload after booking save; limits 10 items, 2 videos, 30 s, 25 MB | S1 3.7 to 3.13 |
| Profile | Security and Devices and sessions under Account; Notifications under Preferences | S1 Section 4 |
| Service areas | Removed; locality is an optional label | S1 Section 15 |
| Navigation after draft actions | `dismissTo`, Save draft to Home, Discard to Services | Section 4.2 |
| Keyboard | `react-native-keyboard-controller`, runs in Expo Go | Section 2 (C1), S1 12.2 |
| Defaults for Q17 to Q29 | As adopted in S2 Section 2 | S2 |
| Build order | Section 5 above | Section 5 |

### 8.2 Where to look (index)

| You need | Open |
|---|---|
| A screen's layout, copy or acceptance list | S1 Sections 2 to 4 and 11 to 16 |
| Code that S1 only described (query, draft exit, assignment, form engine) | Section 4 above |
| Why a detail of S1 changed | Section 2 above (C1 to C11) |
| Checked Expo facts and what is still unchecked | Section 1.2 above |
| Which of S1's open questions have a default | S2 Section 2 |

### 8.3 Still open (needs you, not defaultable)

1. **The dashboard stats image** (Q17). Only the default tiles exist (Upcoming, Completed, Total spent). Send the image and the tile array in `home.tsx` is matched to it.
2. Three API signatures are **not re-read** and are checked in the step that uses them: the legacy `FileSystem.createUploadTask` (S1 3.11), `StorageAccessFramework.createFileAsync` with base64 content (S1 11.1) and the `expo-notifications` time-interval trigger (Section 4.3).
3. Nothing was compiled. The first task after applying these documents is `npx tsc --noEmit` on a clean install.

### 8.4 Proposed Stage 4 (backend plug-in contract; no repeated instructions)

A single document for the next stage, covering only what the front end now expects of the backend: Supabase tables and row-level security for bookings, scope snapshots, media, tickets, referrals, reviews, notification preferences and sessions; storage buckets and pre-signed uploads; the edge functions for quiet-hours push, assignment and the wrong-password response; Firebase push credentials; and a **mock-flag inventory** (each `config/mock.ts` switch, the module it disables, and the call that replaces it). It references this guide by section number and does not restate screens.

### 8.5 Context to drop from the working window

Safe to drop now that its content lives in S1: the first-draft guide (`Implementation_Phase_2.md`, 2,232 lines, superseded by S1), the pasted six-question summary, and the six reference screenshots (already translated into S1 3.7 for the media sheets, 4.2 notifications, 4.3 security, 4.4 devices and 16.3 the ticket form). Keep only S1, S2, Stage 3 and the repository snapshot (needed to re-verify any claim about the code).
