import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import type { AuthSession } from '@/lib/api/auth';

/**
 * Session persistence. Tokens live in the platform keychain/keystore on iOS and Android.
 * SecureStore has no web implementation, so the web build uses localStorage.
 */
const SESSION_KEY = 'gabfix.session.v1';

const isWeb = Platform.OS === 'web';

const readWeb = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
};

export async function loadSession(): Promise<AuthSession | null> {
  try {
    const raw = isWeb ? readWeb() : await SecureStore.getItemAsync(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.accessToken || !parsed?.user?.id) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function saveSession(session: AuthSession | null): Promise<void> {
  try {
    if (isWeb) {
      if (typeof window === 'undefined') return;
      if (session) window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      else window.localStorage.removeItem(SESSION_KEY);
      return;
    }
    if (session) await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
    else await SecureStore.deleteItemAsync(SESSION_KEY);
  } catch {
    // A failed write must not block sign-in; the session stays valid for this run.
  }
}
