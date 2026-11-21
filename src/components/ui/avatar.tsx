import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { colors, font } from '@/theme';

type Props = {
  uri?: string | null;
  /** Used for the accessible label and the initials fallback. */
  name?: string;
  size?: number;
};

const initialsOf = (name?: string): string => {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'GF';
  return words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
};

/** Round avatar with a green initials fallback when no photo is set. */
export function Avatar({ uri, name, size = 40 }: Props) {
  const initials = initialsOf(name);
  const label = name ? `${name}'s photo` : 'Profile photo';

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={label}
      style={[styles.base, { width: size, height: size, borderRadius: size / 2 }]}>
      {uri ? (
        <Image source={{ uri }} style={styles.image} contentFit="cover" />
      ) : (
        <Text
          maxFontSizeMultiplier={1.2}
          style={[styles.initials, { fontSize: Math.max(12, Math.round(size * 0.36)) }]}>
          {initials}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.green50,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  initials: {
    fontFamily: font.bodySemi,
    color: colors.green700,
    letterSpacing: 0.5,
  },
});
