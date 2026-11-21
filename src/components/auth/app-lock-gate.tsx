import * as LocalAuthentication from 'expo-local-authentication';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { colors, space, text } from '@/theme';
import { useSessionStatus } from '@/store/session';
import { useSecurity } from '@/store/security';

/** Lightweight biometric lock overlay (P29b). Native only; no-op on web. */
export function AppLockGate() {
  const status = useSessionStatus();
  const hasToken = status === 'authenticated';
  const security = useSecurity();
  const [locked, setLocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const prompted = useRef(false);
  const appState = useRef(AppState.currentState);

  const shouldGuard = Platform.OS !== 'web' && hasToken && security.hydrated && security.biometric;

  useEffect(() => {
    if (shouldGuard) return;
    prompted.current = false;
    const id = setTimeout(() => setLocked(false), 0);
    return () => clearTimeout(id);
  }, [shouldGuard]);

  useEffect(() => {
    if (!shouldGuard) return;
    const sub = AppState.addEventListener('change', (next) => {
      const prev = appState.current;
      appState.current = next;
      if ((prev === 'background' || prev === 'inactive') && next === 'active') {
        setLocked(true);
        prompted.current = false;
      }
    });
    return () => sub.remove();
  }, [shouldGuard]);

  const unlock = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Gabfix',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });
      if (result.success) setLocked(false);
    } catch {
      // Keep locked; user can retry.
    } finally {
      setBusy(false);
    }
  }, [busy]);

  useEffect(() => {
    if (!locked || !shouldGuard || prompted.current || busy) return;
    prompted.current = true;
    void unlock();
  }, [locked, shouldGuard, busy, unlock]);

  if (!locked || !shouldGuard) return null;

  return (
    <View style={styles.overlay} accessibilityViewIsModal>
      <View style={styles.card}>
        <Text style={styles.title} maxFontSizeMultiplier={1.3}>Gabfix is locked</Text>
        <Text style={styles.body} maxFontSizeMultiplier={1.3}>
          Use your fingerprint, Face ID, or device passcode to continue.
        </Text>
        <Button label={busy ? 'Checking…' : 'Unlock'} onPress={() => void unlock()} disabled={busy} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.96)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: space[4],
    zIndex: 999,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: space[5],
    gap: space[3],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  title: { ...text.h3, color: colors.text },
  body: { ...text.body, color: colors.textMuted },
});
