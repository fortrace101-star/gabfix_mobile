# Implementation Phase 2 - Stage 2: Gabfix Home Solutions

Stage 2 of the Phase 2 guide. It **builds on** `Implementation Phase 2 - Stage 1.md` (called **Stage 1** below) and does not repeat it. Where Stage 1 already says what to do, this document points to the section (for example "S1 11.2") and only adds what Stage 1 does not contain.

Written on 2026-11-20 against `gabfix_mobile-main` (Expo SDK 58.0.26, Expo Router 58.0.32, React Native 0.88.1, React 19.3.0). I could not run `tsc`, lint or tests (no `node_modules`, no network), so every code block here is **unverified by a compiler**. Every claim about the code was checked by reading the files and is cited by file.

> **Status line for this stage.** Write phase 1 is recorded (Section 1). Stage 2 is now writing phases 2 to 5: the corrections to Stage 1 (Section 3), the final job-scope contract (Section 4), the code Stage 1 only described (Section 5), and the single build order, open-question defaults and hand-off summary (Sections 6 to 9).

**What Stage 2 delivers**

| Part | Section | Why Stage 1 needed it |
|---|---|---|
| Write phase 1 recap | 1 | Records what changed between the first draft and Stage 1 so it is not re-done |
| Defaults for the open questions | 2 | Q17 to Q29 are unanswered; work must not wait |
| Corrections to Stage 1 | 3 | Checked against the code: missing files, a missing button variant, a conflicting build order |
| Final job-scope contract (P8b) | 4 | Stage 1 left 3.2 to 3.4 (fixed fields) and 14.4 (schema) side by side |
| Working code for the stubs | 5 | Stage 1 shows `/* ... */` bodies for filters, assignment, drafts and the form engine |
| One build order | 6 | Stage 1 Section 6 has two competing orders and a step that is replaced by another |
| Progress-document patch | 7 | Final wording, with the corrected counts |
| Definition of done and device matrix | 8 | One list for all ten workstreams |
| **Hand-off summary** | **9** | So Stage 3 never repeats an instruction |

**Design rule (unchanged from Stage 1):** the reference screenshots are layout ideas only. Everything visual stays Gabfix: tokens from `src/theme/tokens.ts`, Poppins and Inter, the existing UI kit, Lucide icons. No new hex values, radii or spacing in any screen.

---

## 1. Write phase 1 recap (what Stage 1 changed)

The pre-statement for this stage: *"the repo survey is done; write phase 1 fixes the support call number (`0703195401`) everywhere it appears and records your answers to the six questions."* Comparing `Implementation_Phase_2.md` (first draft, 2,232 lines) with Stage 1 (3,261 lines), that phase is exactly the following. Nothing here is redone in Stage 2.

### 1.1 The six answers and where Stage 1 recorded them

| # | Your answer | Recorded in Stage 1 as |
|---|---|---|
| 1 | Call number is `0703195401` | **D18**; finding **F5** closed; Section 2.1, 2.3, 2.4, 2.5 (`callNumber: '0703195401'`), 2.10 and 2.11 rewritten; Open question **Q1** answered; Open item **36** closed |
| 2 | Progress score dip is fine | **D17** |
| 3 | Name the work "Phase 9" | **D17** |
| 4 | Quiet hours come with the backend (Supabase, Expo tools, Firebase) | **D15** (backend timing) and **D16** (quiet hours) |
| 5 | Wrong-password status code comes with the backend | **D16** |
| 6 | "Go ahead" on the SDK checks | **D19** (check each API in the step that uses it) |

### 1.2 Other edits in the same pass

- `callNumber` is now a valid 10-digit number, so the Call row is **visible** on `/help`, `/help/contact` and P15c, and the validation rules stay so a future typo hides the row instead of shipping a broken `tel:` link (S1 2.11).
- The "Service area" row was removed from the Profile layout sketch (S1 4.1).
- Stage 1 then added Workstreams **E to J** (Sections 11 to 16) for your 23 change items. Those are specified in full; Stage 2 corrects and completes them.

### 1.3 Decisions that are now fixed (do not reopen)

| Decision | Source |
|---|---|
| Backend (Supabase, Expo tools, Firebase) starts **after** the front end; until then everything runs on local storage in mock mode | S1 D15 |
| Quiet hours and the 400/403 wrong-password rule are enforced when the backend is switched on | S1 D16 |
| Support: `gabfixuganda@gmail.com`, `0703195401`, WhatsApp `0752777774`, all through `src/config/support.ts` | S1 D18 |
| The work is called **Phase 9** in `Gabfix_UI_Progress.md` | S1 D17 |

---

## 2. Defaults for the open questions (Q17 to Q29)

You did not answer these, and you asked to proceed. Each default below is adopted **now** so no task is blocked. Every default is reversible; the cost of reversing is in the last column. When you answer, change one row, not the whole guide.

| Q | Question (short) | Default adopted | Cost to reverse |
|---|---|---|---|
| Q17 | Dashboard stats image | **Still not received** (six images arrived: Help ticket, Notifications, Security, Devices, two photo sheets). Build three tiles: Upcoming, Completed, Total spent (S1 13.3) | Tile labels and values live in one array in `home.tsx`; S |
| Q18 | Which services are hourly or quote | Basic, Deep, Carpet, Sofa sets, Dining chairs: **hourly**. Post-construction, Pavers cleaning, Roof tile, Terrazzo, Fumigation, Electrical, Plumbing, Handyman, Tiling, Painting, Renovation, Pavers laying, Landscaping: **quote** | One field per service in `config/services.ts`; S |
| Q19 | Landscaping and grass cutting: one or two | **One** | Split one entry; S |
| Q20 | Category names and grouping | The seven categories in S1 14.2 | Data only; S |
| Q21 | Remove the hero rating chip on the service page | **Yes** | One element; S |
| Q22 | Unreachable location policy | Support contacts the customer, **full refund**, no call-out fee | Copy and admin reason only; S |
| Q23 | Refer "Reward earned" opens a list | **Yes** | One route param; S |
| Q24 | Bookings active tab colour | **`green900`** (the deepest green, as the tab bar). The code today uses `green700` (`segmented-control.tsx`, `labelOn`) | One token; S |
| Q25 | Ticket reply promise | "Within one business day", business hours from support config | Copy; S |
| Q26 | Keep Office and Move-in/out as hidden services | **Yes**, `active: false` (S1 H5) | Data; S |
| Q27 | Who creates categories later | **Admin only** | Admin permissions; backend stage |
| Q28 | Keep the 6-minute assignment in release | **Remove at backend switch-on**; the whole thing is behind `config/mock.ts` | Flip `enabled`; S |
| Q29 | Custom date range in filters | **Presets only** for v1 | New date picker; M |

**Still blocked on you (not defaultable):** the dashboard stats image (Q17) is the only item where a design reference is missing. The default tiles are a placeholder that matches your wording ("stats ... at a glance"); please resend the image and the three tiles will be matched to it.

---
