import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { LogoBadge } from '@/components/brand/logo-badge';
import { auth, font } from '@/theme';

type Props = {
  size?: number;
  textSize?: number;
  style?: StyleProp<ViewStyle>;
};

/** Badge + two-tone wordmark used top-left on auth screens and in the Home hero. */
export function BrandMark({ size = 28, textSize = 13, style }: Props) {
  return (
    <View
      style={[styles.row, style]}
      accessible
      accessibilityRole="text"
      accessibilityLabel="Gabfix Home Solutions">
      <LogoBadge size={size} />
      <Text
        maxFontSizeMultiplier={1.3}
        numberOfLines={1}
        style={[styles.name, { fontSize: textSize, lineHeight: textSize + 5 }]}>
        Gabfix <Text style={styles.accent}>Home Solutions</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  name: { fontFamily: font.poppinsSemi, color: auth.text, flexShrink: 1 },
  accent: { color: auth.accent },
});
