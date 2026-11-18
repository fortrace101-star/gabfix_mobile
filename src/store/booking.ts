import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

import { emptyDraft, type BookingDetails, type BookingDraft } from '@/lib/pricing';

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

const setDraft = (draft: BookingDraft | null) => {
  state = { ...state, draft };
  listeners.forEach((listener) => listener());
  persist(draft);
};

/** Called once at boot from the root layout, before the first screen renders. */
export async function hydrateBookingDraft(): Promise<void> {
  let draft: BookingDraft | null = null;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as BookingDraft) : null;
    if (parsed?.serviceSlug && parsed.details) draft = parsed;
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

export function patchDraft(changes: Partial<Omit<BookingDraft, 'serviceSlug'>>): void {
  if (!state.draft) return;
  setDraft({ ...state.draft, ...changes });
}

export function patchDetails(changes: Partial<BookingDetails>): void {
  if (!state.draft) return;
  setDraft({ ...state.draft, details: { ...state.draft.details, ...changes } });
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
