import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

import {
  emptyDraft,
  type BookingDetails,
  type BookingDraft,
  type BookingMedia,
  type BookingMediaItem,
  type BookingScope,
} from '@/lib/pricing';

/**
 * Order-flow draft (Gabfix_App_Ui_2.md, Section 6.0). Each P8–P12 screen reads and writes
 * this store, so a draft survives navigation, app restarts and a cancelled payment.
 */
const STORAGE_KEY = 'gabfix.booking.draft.v1';

type BookingState = {
  draft: BookingDraft | null;
  hydrated: boolean;
};

let state: BookingState = { draft: null, hydrated: false };
const listeners = new Set<() => void>();

const getState = () => state;

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const persist = (draft: BookingDraft | null) => {
  const write = draft ? AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(draft)) : AsyncStorage.removeItem(STORAGE_KEY);
  // Fire-and-forget: a failed write must not block the form. The draft stays in memory.
  void write.catch(() => undefined);
};

/** Drafts saved before P8b used different scope values; map them onto the Stage 1 model. */
const legacySizeBands: Record<string, BookingScope['sizeBand']> = {
  studio: 'small',
  one_two_bed: 'medium',
  three_four_bed: 'large',
  five_plus_bed: 'large',
};

const normaliseScope = (base: BookingScope, saved?: BookingScope): BookingScope => {
  const merged = { ...base, ...(saved ?? {}) } as BookingScope & { condition?: string };
  if ((merged.condition as string | undefined) === 'moderate') merged.condition = 'typical';
  const legacyBand = merged.sizeBand ? legacySizeBands[merged.sizeBand] : undefined;
  if (legacyBand) merged.sizeBand = legacyBand;
  if (merged.sizeBand === undefined) delete merged.sizeBand;
  merged.focusAreas = Array.isArray(merged.focusAreas) ? merged.focusAreas : [];
  return merged;
};

const withScopeDefaults = (draft: BookingDraft): BookingDraft => {
  const base = emptyDraft(draft.serviceSlug);
  return {
    ...base,
    ...draft,
    details: { ...base.details, ...draft.details },
    addOns: Array.isArray(draft.addOns) ? draft.addOns : [],
    scope: normaliseScope(base.scope as BookingScope, draft.scope),
    media: { items: draft.media?.items ?? [], uploaded: draft.media?.uploaded ?? false },
  };
};

const setDraft = (draft: BookingDraft | null) => {
  state = { ...state, draft: draft ? withScopeDefaults(draft) : null };
  listeners.forEach((listener) => listener());
  persist(state.draft);
};

/** Called once at boot from the root layout, before the first screen renders. */
export async function hydrateBookingDraft(): Promise<void> {
  let draft: BookingDraft | null = null;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as BookingDraft) : null;
    if (parsed?.serviceSlug && parsed.details) draft = withScopeDefaults(parsed);
  } catch {
    draft = null;
  }
  state = { draft, hydrated: true };
  listeners.forEach((listener) => listener());
}

export const getBookingDraft = () => state.draft;

/** Start or replace the draft when a service card is tapped. */
export function startDraft(serviceSlug: string): void {
  setDraft(emptyDraft(serviceSlug));
}

/** P18: replace the draft with one prefilled from an earlier booking. */
export function startRebookDraft(draft: BookingDraft): void {
  setDraft(draft);
}

export function patchDraft(changes: Partial<Omit<BookingDraft, 'serviceSlug'>>): void {
  if (!state.draft) return;
  setDraft({ ...state.draft, ...changes });
}

export function patchDetails(changes: Partial<BookingDetails>): void {
  if (!state.draft) return;
  setDraft({ ...state.draft, details: { ...state.draft.details, ...changes } });
}

export function patchScope(changes: Partial<BookingScope>): void {
  if (!state.draft) return;
  setDraft({ ...state.draft, scope: { ...(state.draft.scope as BookingScope), ...changes } });
}

export function setMedia(media: BookingMedia): void {
  if (!state.draft) return;
  setDraft({ ...state.draft, media });
}

/** P8b: append picked photos/videos and clear the “uploaded” marker. */
export function addMedia(items: BookingMediaItem[]): void {
  if (!state.draft || items.length === 0) return;
  const existing = state.draft.media?.items ?? [];
  setMedia({ items: [...existing, ...items], uploaded: false });
}

export function removeMedia(id: string): void {
  if (!state.draft) return;
  const items = state.draft.media?.items ?? [];
  setMedia({ items: items.filter((item) => item.id !== id), uploaded: false });
}

export function toggleAddOn(id: string): void {
  if (!state.draft) return;
  const selected = state.draft.addOns.includes(id);
  setDraft({
    ...state.draft,
    addOns: selected ? state.draft.addOns.filter((addOn) => addOn !== id) : [...state.draft.addOns, id],
  });
}

export function setPromoCode(promoCode: string | undefined): void {
  if (!state.draft) return;
  const code = promoCode?.trim() ? promoCode.trim().toUpperCase() : undefined;
  setDraft({ ...state.draft, promoCode: code });
}

export function resetDraft(): void {
  setDraft(null);
}

export function useBookingDraft(): BookingDraft | null {
  return useSyncExternalStore(subscribe, getState, getState).draft;
}

export function useBookingDraftHydrated(): boolean {
  return useSyncExternalStore(subscribe, getState, getState).hydrated;
}
