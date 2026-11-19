import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors, space, text } from '@/theme';

type Props = {
  delayMs?: number;
};

/**
 * P26 retry hint: mount while loading; it appears below the spinner after eight seconds.
 * The parent unmounts it as soon as the load settles, which resets the timer.
 */
export function RetryHint({ delayMs = 8000 }: Props) {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs]);

  if (!slow) return null;

  return (
    <View style={styles.root} accessibilityLiveRegion="polite">
      <ActivityIndicator size="small" color={colors.textMuted} />
      <Text style={styles.label} maxFontSizeMultiplier={1.2}>
        Still trying…
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
    paddingVertical: space[3],
  },
  label: { ...text.caption },
});
