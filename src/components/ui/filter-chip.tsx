import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, font, radius, space } from '@/theme';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

/** Pill filter: green fill when selected, outline otherwise. */
export function FilterChip({ label, selected, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}>
      <Text
        style={[styles.chipText, selected && styles.chipTextSelected]}
        maxFontSizeMultiplier={1.2}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 36,
    paddingHorizontal: space[3],
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: { backgroundColor: colors.green500, borderColor: colors.green500 },
  chipText: { fontFamily: font.bodySemi, fontSize: 13, color: colors.text },
  chipTextSelected: { color: colors.surface },
});
