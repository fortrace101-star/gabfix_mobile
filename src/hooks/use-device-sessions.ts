import { useCallback } from 'react';

import {
  refreshDeviceSessions,
  signOutDevice,
  signOutOtherDevices,
  useDeviceSessionsState,
} from '@/store/device-sessions';

export function useDeviceSessions() {
  const state = useDeviceSessionsState();
  const current = state.sessions.find((session) => session.current);
  const others = state.sessions.filter((session) => !session.current);

  const refresh = useCallback((force = false) => {
    void refreshDeviceSessions(force);
  }, []);

  return {
    sessions: state.sessions,
    current,
    others,
    status: state.status,
    refresh,
    signOutDevice: async (id: string) => signOutDevice(id),
    signOutOthers: async () => signOutOtherDevices(),
  };
}
