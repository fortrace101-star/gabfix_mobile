import * as Crypto from 'expo-crypto';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEY = 'gabfix.device-id.v1';
let cached: string | null = null;

export async function getDeviceId(): Promise<string> {
  if (cached) return cached;
  try {
    const existing = Platform.OS === 'web'
      ? (typeof window !== 'undefined' ? window.localStorage.getItem(KEY) : null)
      : await SecureStore.getItemAsync(KEY);
    if (existing) {
      cached = existing;
      return existing;
    }
  } catch {
    // Fall through to create a new id.
  }

  const created = typeof Crypto.randomUUID === 'function'
    ? Crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  cached = created;
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') window.localStorage.setItem(KEY, created);
    } else {
      await SecureStore.setItemAsync(KEY, created);
    }
  } catch {
    // Best-effort: keep the in-memory id for this run.
  }
  return created;
}

export type DeviceInfo = {
  deviceId: string;
  name: string;
  platform: 'android' | 'ios' | 'web';
  osVersion?: string;
  appVersion: string;
};

export async function getDeviceInfo(): Promise<DeviceInfo> {
  return {
    deviceId: await getDeviceId(),
    name: Device.modelName ?? Device.deviceName ?? 'This phone',
    platform: (Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'web'),
    osVersion: Device.osVersion ?? undefined,
    appVersion: Constants.expoConfig?.version ?? '1.0.0',
  };
}

export async function clearDeviceId(): Promise<void> {
  cached = null;
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') window.localStorage.removeItem(KEY);
    } else {
      await SecureStore.deleteItemAsync(KEY);
    }
  } catch {
    // Best-effort.
  }
}
