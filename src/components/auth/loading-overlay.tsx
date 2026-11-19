import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { LogoBadge } from '@/components/brand/logo-badge';
import { supportsNativeDriver } from '@/lib/animation';
import { auth, font } from '@/theme';

type Props = {
  visible: boolean;
};

/** The one loading treatment used by every auth screen (Page_refactor, 3.5). */
export function LoadingOverlay({ visible }: Props) {
  const [pulse] = useState(() => new Animated.Value(1));
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!visible || reducedMotion) {
      pulse.setValue(1);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.12,
          duration: 450,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: supportsNativeDriver,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 450,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: supportsNativeDriver,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, reducedMotion, visible]);

  if (!visible) return null;

  return (
    <View
      style={StyleSheet.absoluteFill}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
      accessibilityLiveRegion="polite">
      <View style={styles.center}>
        <Animated.View style={{ transform: [{ scale: pulse }] }}>
          <LogoBadge size={56} />
        </Animated.View>
        <Text style={styles.label} maxFontSizeMultiplier={1.3}>
          Loading..
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    position: 'absolute',
    top: '38%',
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontFamily: font.poppinsSemi,
    fontSize: 14,
    lineHeight: 20,
    color: auth.text,
  },
});
