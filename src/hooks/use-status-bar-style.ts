import { useFocusEffect } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { useCallback } from 'react';

/**
 * Set the status bar contrast for the focused screen. Stack screens stay mounted, so this has to
 * run on focus rather than relying on a mounted `<StatusBar>`.
 */
export function useStatusBarStyle(style: 'light' | 'dark') {
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle(style);
    }, [style]),
  );
}
