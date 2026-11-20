import { StyleSheet, Text, View } from 'react-native';

import { colors, font, radius, space, text } from '@/theme';

/** Small green stat block used by Security, Devices and future dashboards. */
export function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.tile} accessible accessibilityLabel={`${label}: ${value}`}>
      <Text style={styles.label} maxFontSizeMultiplier={1.2}>
        {label}
      </Text>
      <Text style={styles.value} maxFontSizeMultiplier={1.2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minHeight: 72,
    borderRadius: radius.input,
    backgroundColor: colors.green50,
    padding: space[3],
    gap: 2,
    justifyContent: 'center',
  },
  label: {
    ...text.caption,
    fontFamily: font.bodySemi,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.green700,
  },
  value: {
    fontFamily: font.poppinsSemi,
    fontSize: 24,
    lineHeight: 32,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
});
