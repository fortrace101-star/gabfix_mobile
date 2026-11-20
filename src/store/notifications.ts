import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

import { decideInApp } from '@/lib/notify-policy';
import { getProfileSettings } from '@/store/profile-settings';

const STORAGE_KEY = 'gabfix.notifications.v1';

export type NotificationKind = 'booking' | 'reminder' | 'payment' | 'system' | 'security' | 'promo';

export type AppNotification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  createdAtISO: string;
  read: boolean;
  /** In-app destination, for example `/booking/GBX-12345`. */
  href?: string;
};

type NotificationsState = {
  notifications: AppNotification[];
  hydrated: boolean;
};

const hoursAgo = (hours: number): string =>
  new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

const seedNotifications = (): AppNotification[] => [
  {
    id: 'welcome',
    kind: 'system',
    title: 'Welcome to Gabfix',
    body: 'Book a clean, follow every update and reach support from one place.',
    createdAtISO: hoursAgo(1),
    read: false,
  },
  {
    id: 'profile-tip',
    kind: 'system',
    title: 'Make checkout faster',
    body: 'Add your details and a saved payment method before your next booking.',
    createdAtISO: hoursAgo(26),
    read: true,
    href: '/(tabs)/profile',
  },
  {
    id: 'clean-checklist',
    kind: 'reminder',
    title: 'Your cleaning-day checklist',
    body: 'Clear surfaces, secure valuables and let your cleaner know how to get in.',
    createdAtISO: hoursAgo(72),
    read: true,
  },
];

let state: NotificationsState = {
  notifications: seedNotifications(),
  hydrated: false,
};

const listeners = new Set<() => void>();

const getState = () => state;

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const persist = (notifications: AppNotification[]) => {
  void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notifications)).catch(() => undefined);
};

const setNotifications = (notifications: AppNotification[]) => {
  state = { ...state, notifications };
  listeners.forEach((listener) => listener());
  persist(notifications);
};

const kinds: NotificationKind[] = ['booking', 'reminder', 'payment', 'system', 'security', 'promo'];

const isNotification = (value: unknown): value is AppNotification => {
  const item = value as AppNotification | null;
  return Boolean(
    item &&
      item.id &&
      item.title &&
      item.body &&
      item.createdAtISO &&
      kinds.includes(item.kind) &&
      typeof item.read === 'boolean',
  );
};

/** Called once at boot from the root layout. */
export async function hydrateNotifications(): Promise<void> {
  let notifications = seedNotifications();
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    if (Array.isArray(parsed)) {
      notifications = parsed.filter(isNotification);
    }
  } catch {
    notifications = seedNotifications();
  }
  state = { notifications, hydrated: true };
  listeners.forEach((listener) => listener());
}

/** Adds one notification, replacing an existing entry with the same id. */
export function addNotification(notification: Omit<AppNotification, 'read'> & { read?: boolean }): void {
  const next: AppNotification = { read: false, ...notification };
  if (decideInApp(next.kind, getProfileSettings().notifications) === 'skip') return;
  const exists = state.notifications.some((item) => item.id === next.id);
  const notifications = exists
    ? state.notifications.map((item) => (item.id === next.id ? next : item))
    : [next, ...state.notifications];
  setNotifications(notifications);
}

export function markNotificationRead(id: string): void {
  if (!state.notifications.some((item) => item.id === id && !item.read)) return;
  setNotifications(
    state.notifications.map((item) => (item.id === id ? { ...item, read: true } : item)),
  );
}

export function markAllNotificationsRead(): void {
  if (!state.notifications.some((item) => !item.read)) return;
  setNotifications(state.notifications.map((item) => ({ ...item, read: true })));
}

export function useNotifications(): AppNotification[] {
  return useSyncExternalStore(subscribe, getState, getState).notifications;
}

export function useNotificationsHydrated(): boolean {
  return useSyncExternalStore(subscribe, getState, getState).hydrated;
}

export function useUnreadNotificationCount(): number {
  return useSyncExternalStore(
    subscribe,
    () => getState().notifications.filter((item) => !item.read).length,
    () => getState().notifications.filter((item) => !item.read).length,
  );
}
