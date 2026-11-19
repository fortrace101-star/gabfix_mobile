import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { colors } from '@/theme';

const AnimatedView = Animated.createAnimatedComponent(View);

type Props = {
  style?: StyleProp<ViewStyle>;
};

/** P26 skeleton block: the final element's size with a 1.2 s opacity pulse. */
export function Skeleton({ style }: Props) {
  const reducedMotion = useReducedMotion();
  const [opacity] = useState(() => new Animated.Value(0.5));

  useEffect(() => {
    if (reducedMotion) {
      opacity.setValue(0.7);
      return;
    }

    const loop = Animated.loop(
      Animated.timing(opacity, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, reducedMotion]);

  return (
    <AnimatedView
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.base, style, { opacity }]}
    />
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: colors.disabledBg },
});
