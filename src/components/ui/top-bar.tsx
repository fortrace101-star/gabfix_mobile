import { ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, size, space, text } from '@/theme';

type Props = {
  title?: string;
  onBack?: () => void;
  right?: ReactNode;
  /** Use white icons on green headers. */
  onGreen?: boolean;
};

/** 56 high app bar with a back arrow, centred title and optional action (Part 1, 5.5). */
export function TopBar({ title, onBack, right, onGreen = false }: Props) {
  const tint = onGreen ? colors.surface : colors.text;

  return (
    <View style={styles.bar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={8}
        onPress={() => {
          if (onBack) return onBack();
          if (router.canGoBack()) return router.back();
          router.replace('/');
        }}
        style={styles.side}>
        <ArrowLeft size={size.icon} color={tint} strokeWidth={2} />
      </Pressable>
      <View style={styles.titleWrap} pointerEvents="none">
        {title ? (
          <Text numberOfLines={1} style={[styles.title, { color: tint }]}>
            {title}
          </Text>
        ) : null}
      </View>
      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: size.header,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space[2],
  },
  side: {
    minWidth: size.touch,
    minHeight: size.touch,
    alignItems: 'center',
    justifyContent: 'center',
  },
  right: { alignItems: 'flex-end' },
  titleWrap: { flex: 1, alignItems: 'center', paddingHorizontal: space[2] },
  title: { ...text.h3, fontSize: 16 },
});
