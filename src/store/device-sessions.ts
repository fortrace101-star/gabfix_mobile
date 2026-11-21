import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

import { hasApiBaseUrl } from '@/lib/config';
import { getDeviceInfo } from '@/lib/device';

const STORAGE_KEY = 'gabfix.device-sessions.v1';

export type DeviceSession = {
  id: string;
  deviceId: string;
  name: string;
  platform: 'android' | 'ios' | 'web';
  osVersion?: string;
  appVersion?: string;
  approxLocation?: string;
  signedInAtISO: string;
  lastUsedAtISO: string;
  current: boolean;
};

type Status = 'idle' | 'loading' | 'ready' | 'error';
type State = { sessions: DeviceSession[]; status: Status; loadedAt?: number };

let state: State = { sessions: [], status: 'idle' };
const listeners = new Set<() => void>();

const getState = () => state;
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const setState = (next: State) => {
  state = next;
  listeners.forEach((listener) => listener());
};

const sampleOther = (): DeviceSession => {
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
  return {
    id: 'sample-session',
    deviceId: 'sample-device',
    name: 'Sample device',
    platform: 'ios',
    appVersion: '1.0.0',
    approxLocation: 'Kampala, Uganda (approx.)',
    signedInAtISO: twoDaysAgo,
    lastUsedAtISO: twoDaysAgo,
    current: false,
  };
};

const buildCurrent = async (): Promise<DeviceSession> => {
  const info = await getDeviceInfo();
  const now = new Date().toISOString();
  return {
    id: `session-${info.deviceId}`,
    deviceId: info.deviceId,
    name: info.name,
    platform: info.platform,
    osVersion: info.osVersion,
    appVersion: info.appVersion,
    approxLocation: 'Kampala, Uganda (approx.)',
    signedInAtISO: now,
    lastUsedAtISO: now,
    current: true,
  };
};

export async function refreshDeviceSessions(force = false): Promise<void> {
  if (!force && state.status === 'loading') return;
  if (!force && state.status === 'ready' && state.loadedAt && Date.now() - state.loadedAt < 60_000) {
    return;
  }
  setState({ ...state, status: state.sessions.length ? 'ready' : 'loading' });
  try {
    const current = await buildCurrent();
    let sessions: DeviceSession[] = [current];
    if (!hasApiBaseUrl) {
      const showSample = process.env.EXPO_PUBLIC_MOCK_SESSIONS === '2';
      if (showSample) sessions = [current, sampleOther()];
      // Keep any previously signed-out sample state in memory only for this run.
    } else {
      // API-backed sessions will replace this; mock/local path for now.
      sessions = [current];
    }
    // Preserve current session timing from storage if we had it.
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as { signedInAtISO?: string } | null) : null;
      if (parsed?.signedInAtISO) {
        sessions = sessions.map((s) => (s.current ? { ...s, signedInAtISO: parsed.signedInAtISO! } : s));
      } else {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ signedInAtISO: current.signedInAtISO }));
      }
    } catch {
      // ignore
    }
    setState({ sessions, status: 'ready', loadedAt: Date.now() });
  } catch {
    setState({ ...state, status: 'error' });
  }
}

export async function signOutDevice(id: string): Promise<boolean> {
  const target = state.sessions.find((s) => s.id === id);
  if (!target || target.current) return false;
  setState({ ...state, sessions: state.sessions.filter((s) => s.id !== id) });
  // Mock/local: nothing to call. API would DELETE /me/sessions/{id} here.
  return true;
}

export async function signOutOtherDevices(): Promise<number> {
  const others = state.sessions.filter((s) => !s.current);
  if (others.length === 0) return 0;
  setState({ ...state, sessions: state.sessions.filter((s) => s.current) });
  // Mock/local: nothing to call. API would POST /me/sessions/revoke-others here.
  return others.length;
}

export function useDeviceSessionsState(): State {
  return useSyncExternalStore(subscribe, getState, getState);
}
