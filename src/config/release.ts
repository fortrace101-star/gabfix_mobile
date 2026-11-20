import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * P26 force update. The minimum supported version and the store links come from the
 * release config (Open item 25); until the backend advertises them, they can be set in
 * the build environment. Expo's runtime version is not used here because the gate must
 * work in plain EAS builds as well as OTA updates.
 */
const fallbackVersion = '1.0.0';

export const MIN_SUPPORTED_VERSION =
  process.env.EXPO_PUBLIC_MIN_SUPPORTED_VERSION?.trim() || fallbackVersion;

export const IOS_STORE_URL =
  process.env.EXPO_PUBLIC_IOS_STORE_URL?.trim() ||
  'https://apps.apple.com/app/id0000000000';

export const ANDROID_STORE_URL =
  process.env.EXPO_PUBLIC_ANDROID_STORE_URL?.trim() ||
  'https://play.google.com/store/apps/details?id=com.manuelprhyme.gabfixclientmobile';

export const storeUrl = (): string =>
  Platform.OS === 'ios' ? IOS_STORE_URL : ANDROID_STORE_URL;

const parts = (version: string): number[] =>
  version
    .split(/[.+-]/)
    .slice(0, 3)
    .map((part) => {
      const value = Number.parseInt(part, 10);
      return Number.isFinite(value) ? value : 0;
    });

/** True when `current` is older than `minimum`, comparing major.minor.patch. */
export function isVersionBelow(current: string, minimum: string): boolean {
  const left = parts(current);
  const right = parts(minimum);
  for (let index = 0; index < 3; index += 1) {
    const a = left[index] ?? 0;
    const b = right[index] ?? 0;
    if (a !== b) return a < b;
  }
  return false;
}

export const currentAppVersion = (): string => Constants.expoConfig?.version ?? '0.0.0';

/** P26: whether this build must be replaced before the app can be used. */
export const isUpdateRequired = (): boolean =>
  isVersionBelow(currentAppVersion(), MIN_SUPPORTED_VERSION);
