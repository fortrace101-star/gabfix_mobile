# Implementation Phase 2 - Dashboard addendum (Home tab "at a glance")

You asked for the Balance due card **and** more at-a-glance suggestions. S1 13.5 listed the ideas as "not yet in scope". This addendum **promotes the worthwhile ones into scope**, specifies them, and fixes the block order. It amends **S1 Section 13** and the **S3 Section 5, step 17** work; everything else in S1 13 (hero clean-up, Balance due card, Most popular, file removals) stands unchanged. Written 2026-11-21; nothing was compiled or run.

**Decisions recorded:** SMS provider (S4 Q30) and mobile money gateway (S4 Q31) are **deferred by you**; no document needs them until the backend stage. The stats image (Q17) is still not received; the stat tiles stay on the S1 13.3 defaults.

**Design rule (unchanged):** Gabfix tokens, Poppins and Inter, existing UI kit, Lucide icons, no new hex values.

---

## 1. What I checked in the repo

| Fact | Where | Consequence |
|---|---|---|
| `BookingStatus` is only `'upcoming' \| 'completed' \| 'cancelled'` | `src/store/bookings.ts` line 8 | There is no stored "in progress" status. The Active job card must derive "in progress" from the **tracking phase**, not from a new status |
| Tracking exists: route `src/app/booking/[id]/track.tsx`, `TrackingPhase` 0 to 3, `phaseForStatus`, `use-live-tracking.ts` | `src/lib/tracking.ts` | The Active job card links to this route; no new tracking code |
| Plans exist: `src/lib/plans.ts`, `src/store/plans.ts` (`skipNextVisit`, `pausePlan`, `endPlan`), screen `booking/plans.tsx` | | Recurring card reads existing plan data |
| Help screens live in `src/app/help/`; Refer in `src/app/refer.tsx` | | Ticket and Referral cards link to these |

---

## 2. Final list: what is in and out

| Idea | Decision | Why |
|---|---|---|
| Balance due card | **In** (S1 13.3) | Your request |
| Stat tiles (Upcoming, Completed, Total spent) | **In** (S1 13.3) | Your request; image pending |
| Rate your clean | **In** (S1 12.4, 13.1) | Needed for the rating feature |
| Next clean, with assigned person's photo | **In** (S1 12.3, 13.1) | Ties to item 11 |
| **Quick actions row** | **In (new)** | Fastest shortcut for repeat customers |
| **Active job tracker** | **In (new)** | Highest value while a visit is happening |
| **Next visit (recurring plan)** | **In (new)**, folds into Next clean | Plans already exist |
| **Support ticket status** | **In (new)** | Shows the answer to a ticket without opening Help |
| **Invite and earn banner** | **In (new, small)**, lowest priority | Refer is already built; one line |
| Wallet credit | **Out** | No credit concept yet; revisit if refunds become wallet credit (Q22 refunds go to the original method) |
| Seasonal tips | **Out for now** | Needs admin-driven content (backend stage) |
| Cleaner rating or loyalty points | **Out** | No such feature in scope |

---

## 3. Final block order (replaces S1 13.1)

```
Hero (green only): greeting, avatar, bell, location chip, search
Continue your booking      PINNED: always shown when a draft exists (item 3)
Quick actions              always (4 buttons)
Action stack               up to 3 cards, by priority (Section 4):
                             1 Active job
                             2 Balance due
                             3 Rate your clean
                             4 Next clean / Next visit
                             5 Support ticket
Your activity              stat tiles (3, always shown)
Offers                     existing carousel
Most popular               card row (S1 13.4)
Book again                 only with a past booking
Invite and earn            small banner, always last
```

**Stacking rule.** The pinned draft card never counts toward the limit and is never hidden. Of the numbered cards, show **at most three**, in priority order; the rest appear as earlier ones clear. This keeps a customer with a draft, a balance, a rating prompt and a ticket from facing a wall of cards. Balance due is priority 2, not 1, only because an active visit is time-critical; if you prefer money first, swap the two (one constant).

**Spacing:** `space[4]` between blocks, `space[3]` under the search bar; no empty wrappers when a card is hidden (a hidden card renders `null`, never an empty `View`).

---

## 4. Specification of each block

### 4.1 Quick actions row

| Element | Content |
|---|---|
| Layout | One row of four equal buttons, each a circular icon (tinted surface, `radius` token) with a label under it in `text.caption` |
| Buttons | **Book** (opens the Services tab), **Track** (see below), **Pay** (Payments and wallet), **Support** (`/help`) |
| Track | Opens `/booking/{id}/track` for the nearest `upcoming` booking whose date is today; with none, opens the Bookings tab on Upcoming. The button is dimmed (not hidden) when there is no upcoming booking, with the label unchanged |
| Pay | Opens `/profile/payments`; if a balance is due, passes `focus: 'balance-due'` (S1 13.3) |
| Accessibility | Each button has `accessibilityRole="button"` and a label such as "Book a service"; touch target at least the existing minimum used by the kit |
| Component | `QuickActionButton` in `src/components/home/`, props `{ icon, label, onPress, disabled? }`; buttons reuse existing icons from Lucide |

### 4.2 Active job card

| Element | Content |
|---|---|
| Visible when | An `upcoming` booking is **today** and its tracking phase (from `resolveTracking` or `phaseForStatus`, `src/lib/tracking.ts`) is 1 to 3 (confirm the phase meanings in that file before coding). The booking status stays `upcoming`; "in progress" is derived, never stored |
| Content | Avatar (S1 12.3) of the assigned person, line "Rose is on the way" (or "Rose has arrived" / "Work in progress" by phase), the estimated time when the source is `live`, and a **Track** button |
| Action | `router.push('/booking/{id}/track')` |
| Fallback | With `source: 'estimated'` show the phase text only, no minutes, so the card never states a precise time it does not have |
| Without an assigned person | Text "Your cleaner will be assigned shortly" and no avatar |

### 4.3 Next clean / Next visit (one card)

| Case | Content |
|---|---|
| A single upcoming booking | Service name, date and time, assigned person's photo or initials (S1 12.3), **View** button to `booking/{id}` |
| A recurring plan | Same, plus a small chip "Repeats weekly" (from `src/lib/plans.ts`), and the date comes from the plan's next visit, skipping dates removed by `skipNextVisit` or while `pausePlan` is active |
| Both | Show the **earliest** date only; never two cards |
| Hidden | When there are no upcoming bookings (the Active job card has priority if it applies to the same booking, so the same booking never appears twice) |

### 4.4 Support ticket status card

| Element | Content |
|---|---|
| Visible when | The customer has a ticket in status Open or In progress, or one Resolved in the last 3 days and unseen |
| Content | Category icon, subject (one line), ticket code, status chip, "Updated 2h ago" |
| Action | Opens the ticket detail (S1 16.3) |
| Data | The tickets store from S1 Section 16; until it exists the card never renders (it is the last item built, S3 step 19) |

### 4.5 Invite and earn banner

| Element | Content |
|---|---|
| Content | One line "Invite a friend and earn UGX 10,000" and a chevron; amount from the same constant as `refer.tsx` (never typed twice) |
| Action | `router.push('/refer')` |
| Style | Flat surface row, not a card with a photo; always the last block so it never competes with action cards |

### 4.6 Stat tiles (S1 13.3, restated for the one change)

Keep three tiles and the 0, 0, UGX 0 empty state. Because the image is pending, store the tile definitions in **one array** at the top of `home.tsx` (`label`, `icon`, `value(bookings)`, `onPress`), so matching your image later is an edit to the array only.

---

## 5. Data and code

| Item | Change |
|---|---|
| `src/lib/home-feed.ts` (new) | Pure function `buildActionStack({ bookings, draft, due, tickets, tracking, plans, now }): ActionCard[]` returning the ordered list (max 3) with `{ kind, bookingId?, props }`. All rules in Sections 3 and 4 live here, so the screen only maps the list to components |
| `ActionCard` type | `'active-job' \| 'balance-due' \| 'rate' \| 'next' \| 'ticket'` with the priority constant `ACTION_PRIORITY` (editable in one place) |
| `src/lib/wallet.ts` | `dueSummary` as in S1 13.3 (already specified); no other change |
| Components (new) | `src/components/home/QuickActionButton.tsx`, `ActiveJobCard.tsx`, `NextVisitCard.tsx`, `TicketStatusCard.tsx`, `InviteBanner.tsx`; the Balance due and Rate cards are already specified in S1 12.4 and 13.3 |
| `src/app/(tabs)/index.tsx` (the Home screen; `home.tsx` in the guides, confirm the actual file name) | Replace the section list with the Section 3 order, driven by `buildActionStack` |
| Settings | None; no new package, permission or `app.json` change |

---

## 6. Tests (`home-feed.test.ts`)

| Case | Expectation |
|---|---|
| Draft present | Draft always in the output, outside the three-card cap |
| Four eligible cards | Only the top three by `ACTION_PRIORITY` are returned |
| Active job and Next clean for the same booking | Only Active job appears |
| Recurring plan with a skipped date | Next visit shows the following date |
| No bookings, no draft, no ticket | Empty stack; Quick actions, stat tiles (0, 0, UGX 0), Offers and Most popular still render |
| Balance due total zero | No Balance due card |
| Tracking phase 0 | No Active job card |
| Ticket resolved 5 days ago | No ticket card |

---

## 7. Acceptance criteria

- [ ] The Home screen shows blocks in the Section 3 order and nothing else from the removed sections (S1 13.0)
- [ ] The draft card is visible whenever a draft exists, regardless of other cards
- [ ] No more than three action cards appear at once, and a hidden card leaves no gap
- [ ] Quick actions open the right screen; Track is dimmed (not removed) with no upcoming booking
- [ ] The Active job card never shows minutes when the tracking source is `estimated`
- [ ] The same booking never appears in two cards
- [ ] The Balance due card and the header total on Payments and wallet always show the same number (`dueSummary`)
- [ ] Stat tiles are defined in one array and show 0, 0, UGX 0 for a new customer
- [ ] Every new element uses existing tokens; no new hex, radius or spacing value
- [ ] `npx tsc --noEmit` and `npx expo lint` pass; `home-feed.test.ts` passes

---

## 8. Open questions (defaults adopted)

| Q | Question | Default |
|---|---|---|
| Q40 | Balance due above or below Active job | **Below** (Active job first); one constant |
| Q41 | Maximum action cards | **3** plus the pinned draft |
| Q42 | Should the Invite banner appear for new customers with no booking | **Yes**; it is the only content a new customer sees besides Offers and Most popular |
| Q43 | Keep the Invite banner after the customer has invited five friends | **Yes**; remove only if you ask |

---

## 9. Hand-off summary

- **Amends:** S1 13.1 (block order), S1 13.5 (ideas now decided), S3 step 17 (add the files in Section 5 above).
- **Unchanged and still valid:** S1 13.0, 13.2 to 13.4, 13.6 and 13.7 (hero, tiles, Balance due, Most popular, checklists); S3 build order otherwise.
- **Depends on:** tickets store (S1 16.3) for the ticket card; assignment photos (S1 12.3) for the avatar; no backend.
- **Still open for you:** the stats image (Q17). SMS provider and mobile money gateway are deferred by you and block nothing until the backend stage.
- **Index:** add this file to `Implementation Phase 2 - Index.md` under item 5 of the 23 change items.
