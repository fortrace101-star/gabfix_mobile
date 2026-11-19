import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WifiOff } from 'lucide-react-native';
import { useNetworkState } from 'expo-network';
import { useReducedMotion } from 'react-native-reanimated';

import { supportsNativeDriver } from '@/lib/animation';
import { colors, duration, font, z } from '@/theme';

/** P26 offline banner driven by the device network state. */
export function OfflineBanner() {
  const insets = useSafeAreaInsets();
  const network = useNetworkState();
  const reducedMotion = useReducedMotion();
  const isOffline = network.isConnected === false || network.isInternetReachable === false;
  const [progress] = useState(() => new Animated.Value(isOffline ? 1 : 0));

  useEffect(() => {
    if (reducedMotion) {
      progress.setValue(isOffline ? 1 : 0);
      return;
    }
    Animated.timing(progress, {
      toValue: isOffline ? 1 : 0,
      duration: duration.base,
      useNativeDriver: supportsNativeDriver,
    }).start();
  }, [isOffline, progress, reducedMotion]);

  if (!isOffline) return null;

  return (
    <Animated.View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      pointerEvents="none"
      style={[
        styles.banner,
        {
          top: insets.top,
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [-32, 0],
              }),
            },
          ],
        },
      ]}>
      <WifiOff size={16} color={colors.yellow500} strokeWidth={2.2} />
      <Text style={styles.label} maxFontSizeMultiplier={1.2}>
        You&apos;re offline
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 32,
    backgroundColor: colors.green900,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    zIndex: z.toast,
  },
  label: {
    color: colors.surface,
    fontFamily: font.bodySemi,
    fontSize: 12,
    lineHeight: 16,
  },
});
