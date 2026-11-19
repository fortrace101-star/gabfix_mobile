import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'gabfix.profile-settings.v1';

export type NotificationPreferences = {
  bookingUpdates: boolean;
  reminders: boolean;
  offers: boolean;
};

export type ProfileSettings = {
  avatarUri?: string;
  language: 'en';
  notifications: NotificationPreferences;
  biometric: boolean;
  hydrated: boolean;
};

const defaults = (): ProfileSettings => ({
  language: 'en',
  notifications: {
    bookingUpdates: true,
    reminders: true,
    offers: false,
  },
  biometric: false,
  hydrated: false,
});

let state: ProfileSettings = defaults();
const listeners = new Set<() => void>();

const getState = () => state;

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const persist = (next: ProfileSettings) => {
  const stored = {
    avatarUri: next.avatarUri,
    language: next.language,
    notifications: next.notifications,
    biometric: next.biometric,
  };
  void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stored)).catch(() => undefined);
};

const setSettings = (next: ProfileSettings) => {
  state = { ...next, hydrated: true };
  listeners.forEach((listener) => listener());
  persist(state);
};

/** Called once at boot from the root layout. */
export async function hydrateProfileSettings(): Promise<void> {
  let next = defaults();
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = raw
      ? (JSON.parse(raw) as Partial<Omit<ProfileSettings, 'hydrated'>> | null)
      : null;
    if (parsed) {
      const notifications = parsed.notifications;
      next = {
        ...next,
        avatarUri: typeof parsed.avatarUri === 'string' ? parsed.avatarUri : undefined,
        biometric: parsed.biometric === true,
        notifications: {
          bookingUpdates: notifications?.bookingUpdates !== false,
          reminders: notifications?.reminders !== false,
          offers: notifications?.offers === true,
        },
      };
    }
  } catch {
    next = defaults();
  }
  state = { ...next, hydrated: true };
  listeners.forEach((listener) => listener());
}

export function setAvatarUri(avatarUri?: string): void {
  setSettings({ ...state, avatarUri });
}

export function setNotificationPreference(
  key: keyof NotificationPreferences,
  enabled: boolean,
): void {
  setSettings({
    ...state,
    notifications: { ...state.notifications, [key]: enabled },
  });
}

export function setBiometricEnabled(enabled: boolean): void {
  setSettings({ ...state, biometric: enabled });
}

/** Delete-account path; the caller also clears the rest of the local app data. */
export async function clearProfileSettings(): Promise<void> {
  state = { ...defaults(), hydrated: true };
  listeners.forEach((listener) => listener());
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // Local cleanup is best-effort; the session is cleared separately.
  }
}

export function useProfileSettings(): ProfileSettings {
  return useSyncExternalStore(subscribe, getState, getState);
}

export function useProfileSettingsHydrated(): boolean {
  return useSyncExternalStore(subscribe, getState, getState).hydrated;
}
