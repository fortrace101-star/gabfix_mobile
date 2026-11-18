import { useSyncExternalStore } from 'react';

import { refreshSession as requestRefresh, type AuthSession, type AuthUser } from '@/lib/api/auth';
import { setAuthBridge } from '@/lib/api/session-bridge';
import { loadSession, saveSession } from '@/lib/session-storage';
import { setUserName } from '@/store/onboarding';

export type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

type SessionState = {
  status: SessionStatus;
  session: AuthSession | null;
};

let state: SessionState = { status: 'loading', session: null };
const listeners = new Set<() => void>();

const getState = () => state;

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const emit = (next: SessionState) => {
  state = next;
  listeners.forEach((listener) => listener());
};

const firstNameOf = (user: AuthUser) => user.name?.trim().split(/\s+/)[0] || null;

/** Read the persisted session once at boot (called from the root layout). */
export async function restoreSession(): Promise<void> {
  const session = await loadSession();
  if (session) {
    const firstName = firstNameOf(session.user);
    if (firstName) setUserName(firstName);
    emit({ status: 'authenticated', session });
    return;
  }
  emit({ status: 'unauthenticated', session: null });
}

/** Called after login or OTP verification. Persists the tokens and updates the greeting. */
export async function startSession(session: AuthSession): Promise<void> {
  const firstName = firstNameOf(session.user);
  if (firstName) setUserName(firstName);
  emit({ status: 'authenticated', session });
  await saveSession(session);
}

export async function endSession(): Promise<void> {
  emit({ status: 'unauthenticated', session: null });
  setUserName(null);
  await saveSession(null);
}

let refreshInFlight: Promise<boolean> | null = null;

/** Refresh once per expiry window even when several requests fail at the same time. */
async function refreshActiveSession(): Promise<boolean> {
  const current = state.session;
  if (!current?.refreshToken) return false;

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const tokens = await requestRefresh(current.refreshToken);
        const next: AuthSession = {
          ...current,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken ?? current.refreshToken,
        };
        emit({ status: 'authenticated', session: next });
        await saveSession(next);
        return true;
      } catch {
        await endSession();
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();
  }

  return refreshInFlight;
}

setAuthBridge({
  getAccessToken: () => state.session?.accessToken ?? null,
  refreshSession: refreshActiveSession,
  onUnauthorized: () => {
    void endSession();
  },
});

/** Imperative snapshot for redirect guards and tests. */
export const getSessionState = (): SessionState => state;

export function useSessionStatus(): SessionStatus {
  return useSyncExternalStore(subscribe, getState, getState).status;
}

export function useSession(): AuthSession | null {
  return useSyncExternalStore(subscribe, getState, getState).session;
}

export function useAuthUser(): AuthUser | null {
  return useSyncExternalStore(subscribe, getState, getState).session?.user ?? null;
}
