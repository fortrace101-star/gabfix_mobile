import { useEffect, useState, useSyncExternalStore } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, font, radius, space, text } from '@/theme';

export type ToastTone = 'default' | 'success' | 'error';

type ToastItem = { id: number; message: string; tone: ToastTone };

let current: ToastItem | null = null;
let nextId = 0;
let timer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** Show a short message above the bottom edge; replaces any toast already showing. */
export function showToast(message: string, tone: ToastTone = 'default', durationMs = 2_600) {
  if (timer) clearTimeout(timer);
  nextId += 1;
  current = { id: nextId, message, tone };
  emit();
  AccessibilityInfo.announceForAccessibility(message);
  timer = setTimeout(() => {
    current = null;
    timer = null;
    emit();
  }, durationMs);
}

export function hideToast() {
  if (timer) clearTimeout(timer);
  timer = null;
  current = null;
  emit();
}

/** Mount once in the root layout, after the navigator. */
export function ToastHost() {
  const item = useSyncExternalStore(subscribe, () => current, () => current);
  const insets = useSafeAreaInsets();
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(progress, {
      toValue: item ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [item, progress]);

  if (!item) return null;

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={[
        styles.toast,
        toneStyles[item.tone],
        {
          bottom: insets.bottom + space[8],
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }),
            },
          ],
        },
      ]}>
      <Text style={styles.text} maxFontSizeMultiplier={1.4} numberOfLines={3}>
        {item.message}
      </Text>
    </Animated.View>
  );
}

const toneStyles = StyleSheet.create({
  default: { backgroundColor: colors.green900 },
  success: { backgroundColor: colors.green700 },
  error: { backgroundColor: colors.error },
});

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: space[4],
    right: space[4],
    borderRadius: radius.button,
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  text: {
    ...text.bodyM,
    fontFamily: font.bodySemi,
    color: colors.surface,
  },
});
