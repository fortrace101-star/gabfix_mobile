import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

export type PushPermission = 'granted' | 'undetermined' | 'denied' | 'unsupported';

export async function getPushPermission(): Promise<PushPermission> {
  if (Platform.OS === 'web') return 'unsupported';
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted || (current as { ios?: { status?: number } }).ios?.status === 3) {
      return 'granted';
    }
    return current.canAskAgain ? 'undetermined' : 'denied';
  } catch {
    return 'undetermined';
  }
}

export async function ensureAndroidChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync('critical', {
      name: 'Booking, payment and security',
      importance: AndroidImportance.HIGH,
    });
    await Notifications.setNotificationChannelAsync('routine', {
      name: 'Reminders',
      importance: AndroidImportance.DEFAULT,
    });
    await Notifications.setNotificationChannelAsync('promotions', {
      name: 'News and offers',
      importance: AndroidImportance.LOW,
    });
  } catch {
    // Best-effort.
  }
}

export async function requestPushPermission(): Promise<PushPermission> {
  if (Platform.OS === 'web') return 'unsupported';
  try {
    await ensureAndroidChannels();
    const next = await Notifications.requestPermissionsAsync();
    if (next.granted) return 'granted';
    return next.canAskAgain ? 'undetermined' : 'denied';
  } catch {
    return 'denied';
  }
}

/** P14 pre-prompt snooze: “Not now” stops the card for 30 days (S1 4.2.4). */
const PRE_PROMPT_SNOOZE_KEY = 'gabfix.pushPromptSnoozeUntil';
const PRE_PROMPT_SNOOZE_DAYS = 30;

/** True only while the OS permission can still be asked and the card is not snoozed. */
export async function shouldShowPushPrePrompt(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  if ((await getPushPermission()) !== 'undetermined') return false;
  try {
    const raw = await AsyncStorage.getItem(PRE_PROMPT_SNOOZE_KEY);
    if (!raw) return true;
    const until = Number(raw);
    return !Number.isFinite(until) || until <= Date.now();
  } catch {
    return true;
  }
}

export async function snoozePushPrePrompt(): Promise<void> {
  const until = Date.now() + PRE_PROMPT_SNOOZE_DAYS * 24 * 60 * 60 * 1000;
  try {
    await AsyncStorage.setItem(PRE_PROMPT_SNOOZE_KEY, String(until));
  } catch {
    // Best-effort: the card simply shows again on the next booking.
  }
}

export async function registerPushToken(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  const projectId =
    (Constants.expoConfig?.extra?.eas as { projectId?: string } | undefined)?.projectId ??
    (Constants.easConfig as { projectId?: string } | undefined)?.projectId;
  if (!projectId) return null;
  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    return data;
  } catch {
    return null;
  }
}
