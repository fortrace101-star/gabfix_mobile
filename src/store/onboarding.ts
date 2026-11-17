import { useSyncExternalStore } from 'react';

import type { Area } from '@/config/areas';

type OnboardingState = {
  area: Area | null;
};

let state: OnboardingState = { area: null };
const listeners = new Set<() => void>();

const getState = () => state;

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const emit = () => listeners.forEach((listener) => listener());

export const setArea = (area: Area | null) => {
  state = { ...state, area };
  emit();
};

/**
 * The chosen area survives navigation between the modal selector, sign-up and Home.
 * Persisting it to SecureStore/AsyncStorage arrives with the API client in Phase 1.
 */
export function useOnboardingArea(): Area | null {
  return useSyncExternalStore(subscribe, getState, getState).area;
}
