import { useSyncExternalStore } from 'react';

type OnboardingState = {
  userName: string | null;
};

let state: OnboardingState = { userName: null };
const listeners = new Set<() => void>();

const getState = () => state;

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const emit = () => listeners.forEach((listener) => listener());

export const setUserName = (userName: string | null) => {
  state = { ...state, userName };
  emit();
};

export function useOnboardingUserName(): string | null {
  return useSyncExternalStore(subscribe, getState, getState).userName;
}
