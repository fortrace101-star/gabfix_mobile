import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

/**
 * P17 recurring-plan state. Plans themselves come from saved bookings whose frequency is not
 * `once`; this store only keeps the customer's changes (skipped visits, pause window, ended plan)
 * so the booking record keeps its own history.
 */
const STORAGE_KEY = 'gabfix.plans.v1';

export type PlanOverride = {
  /** Dates the customer skipped. */
  skippedDates: string[];
  /** First date the plan may resume after a pause (YYYY-MM-DD). */
  pausedUntil?: string;
  /** Set when the customer ended the plan; it is hidden from the plans list. */
  endedAtISO?: string;
};

type PlansState = {
  overrides: Record<string, PlanOverride>;
  hydrated: boolean;
};

const emptyOverride = (): PlanOverride => ({ skippedDates: [] });

let state: PlansState = { overrides: {}, hydrated: false };
const listeners = new Set<() => void>();

const getState = () => state;

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const persist = (overrides: Record<string, PlanOverride>) => {
  void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(overrides)).catch(() => undefined);
};

const setOverrides = (overrides: Record<string, PlanOverride>) => {
  state = { ...state, overrides };
  listeners.forEach((listener) => listener());
  persist(overrides);
};

/** Called once at boot from the root layout. */
export async function hydratePlans(): Promise<void> {
  let overrides: Record<string, PlanOverride> = {};
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      overrides = parsed as Record<string, PlanOverride>;
    }
  } catch {
    overrides = {};
  }
  state = { overrides, hydrated: true };
  listeners.forEach((listener) => listener());
}

const writeOverride = (bookingId: string, patch: Partial<PlanOverride>) => {
  const current = state.overrides[bookingId] ?? emptyOverride();
  setOverrides({ ...state.overrides, [bookingId]: { ...current, ...patch } });
};

export function getPlanOverride(bookingId: string): PlanOverride {
  return state.overrides[bookingId] ?? emptyOverride();
}

/** P17 “Skip next visit”. */
export function skipNextVisit(bookingId: string, dateISO: string): void {
  const current = getPlanOverride(bookingId);
  if (current.skippedDates.includes(dateISO)) return;
  writeOverride(bookingId, { skippedDates: [...current.skippedDates, dateISO] });
}

/** P17 “Pause” — the plan resumes on the chosen date. */
export function pausePlan(bookingId: string, resumeISO: string): void {
  writeOverride(bookingId, { pausedUntil: resumeISO });
}

export function resumePlan(bookingId: string): void {
  writeOverride(bookingId, { pausedUntil: undefined });
}

/** P17 “End plan” — hidden from the list without touching the booking record. */
export function endPlan(bookingId: string): void {
  writeOverride(bookingId, { endedAtISO: new Date().toISOString() });
}

export function usePlanOverrides(): Record<string, PlanOverride> {
  return useSyncExternalStore(subscribe, getState, getState).overrides;
}

export function usePlansHydrated(): boolean {
  return useSyncExternalStore(subscribe, getState, getState).hydrated;
}
