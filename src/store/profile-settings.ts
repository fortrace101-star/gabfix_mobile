import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

import { deviceTimezone } from '@/config/timezones';

const STORAGE_KEY = 'gabfix.profile-settings.v2';
const LEGACY_KEY = 'gabfix.profile-settings.v1';

export type QuietHours = { enabled: boolean; start: string; end: string };

export type NotificationPreferences = {
  inApp: boolean;
  push: boolean;
  reminders: boolean;
  offers: boolean;
  quietHours: QuietHours;
  timezone: string;
};

export type ProfileSettings = {
  avatarUri?: string;
  language: 'en';
  notifications: NotificationPreferences;
  hydrated: boolean;
};

type V1 = {
  avatarUri?: string;
  notifications?: { bookingUpdates?: boolean; reminders?: boolean; offers?: boolean };
  biometric?: boolean;
};

const defaultTimezone = () => deviceTimezone() ?? 'Africa/Kampala';

const defaultNotifications = (): NotificationPreferences => ({
  inApp: true,
  push: true,
  reminders: true,
  offers: false,
  quietHours: { enabled: false, start: '22:00', end: '07:00' },
  timezone: defaultTimezone(),
});

const defaults = (): ProfileSettings => ({
  language: 'en',
  notifications: defaultNotifications(),
  hydrated: false,
});

let state: ProfileSettings = defaults();
const listeners = new Set<() => void>();

const getState = () => state;

export const getProfileSettings = () => state;

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const persist = (next: ProfileSettings) => {
  const stored = {
    avatarUri: next.avatarUri,
    language: next.language,
    notifications: next.notifications,
  };
  void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stored)).catch(() => undefined);
};

const setSettings = (next: ProfileSettings) => {
  state = { ...next, hydrated: true };
  listeners.forEach((listener) => listener());
  persist(state);
};

export function migrateV1(v1: V1): {
  settings: Pick<ProfileSettings, 'avatarUri' | 'notifications'>;
  biometric: boolean;
} {
  const old = v1.notifications ?? {};
  const bookingUpdates = old.bookingUpdates !== false;
  const reminders = old.reminders !== false;
  return {
    settings: {
      avatarUri: typeof v1.avatarUri === 'string' ? v1.avatarUri : undefined,
      notifications: {
        inApp: true,
        push: bookingUpdates || reminders,
        reminders,
        offers: old.offers === true,
        quietHours: { enabled: false, start: '22:00', end: '07:00' },
        timezone: defaultTimezone(),
      },
    },
    biometric: v1.biometric === true,
  };
}

const normaliseNotifications = (value: unknown): NotificationPreferences => {
  const defaultsN = defaultNotifications();
  const n = value as Partial<NotificationPreferences> | null;
  if (!n || typeof n !== 'object') return defaultsN;
  const q = n.quietHours as Partial<QuietHours> | undefined;
  return {
    inApp: n.inApp !== false,
    push: n.push !== false,
    reminders: n.reminders !== false,
    offers: n.offers === true,
    quietHours: {
      enabled: q?.enabled === true,
      start: typeof q?.start === 'string' && /^\d\d:\d\d$/.test(q.start) ? q.start : defaultsN.quietHours.start,
      end: typeof q?.end === 'string' && /^\d\d:\d\d$/.test(q.end) ? q.end : defaultsN.quietHours.end,
    },
    timezone: typeof n.timezone === 'string' && n.timezone ? n.timezone : defaultsN.timezone,
  };
};

/** Called once at boot from the root layout. */
export async function hydrateProfileSettings(): Promise<void> {
  let next = defaults();
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Omit<ProfileSettings, 'hydrated'>> | null;
      if (parsed) {
        next = {
          ...next,
          avatarUri: typeof parsed.avatarUri === 'string' ? parsed.avatarUri : undefined,
          notifications: normaliseNotifications(parsed.notifications),
        };
      }
    } else {
      const legacyRaw = await AsyncStorage.getItem(LEGACY_KEY);
      if (legacyRaw) {
        const legacy = JSON.parse(legacyRaw) as V1 | null;
        if (legacy) {
          const migrated = migrateV1(legacy);
          next = {
            ...next,
            avatarUri: migrated.settings.avatarUri,
            notifications: migrated.settings.notifications,
          };
          // v2 will be persisted below; keep legacy until v2 is written by persist().
          await AsyncStorage.removeItem(LEGACY_KEY).catch(() => undefined);
        }
      }
    }
  } catch {
    next = defaults();
  }
  state = { ...next, hydrated: true };
  listeners.forEach((listener) => listener());
  persist(state);
}

export function setAvatarUri(avatarUri?: string): void {
  setSettings({ ...state, avatarUri });
}

export function saveNotificationPreferences(notifications: NotificationPreferences): void {
  setSettings({ ...state, notifications });
}

/** Delete-account path; the caller also clears the rest of the local app data. */
export async function clearProfileSettings(): Promise<void> {
  state = { ...defaults(), hydrated: true };
  listeners.forEach((listener) => listener());
  try {
    await AsyncStorage.multiRemove([STORAGE_KEY, LEGACY_KEY]);
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
