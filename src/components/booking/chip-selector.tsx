import type { StyleProp, ViewStyle } from 'react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { chip, colors, font, radius, text } from '@/theme';
import { selectionHaptic } from '@/utils/haptics';

export type ChipOption<T extends string | number> = {
  value: T;
  label: string;
  tag?: string;
  disabled?: boolean;
};

type Props<T extends string | number> = {
  options: readonly ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  itemStyle?: StyleProp<ViewStyle>;
};

/** Single-select chip group with an optional "Popular" tag (Gabfix_App_Ui_2.md, 6.0). */
export function ChipSelector<T extends string | number>({
  options,
  value,
  onChange,
  itemStyle,
}: Props<T>) {
  return (
    <View style={styles.row}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <View key={String(option.value)} style={itemStyle}>
            <Pressable
              accessibilityRole="radio"
              accessibilityLabel={option.label}
              accessibilityState={{ selected, disabled: option.disabled }}
              disabled={option.disabled}
              onPress={() => {
                if (selected) return;
                selectionHaptic();
                onChange(option.value);
              }}
              style={[
                chip.base,
                selected && chip.selected,
                option.disabled && chip.disabled,
                styles.chip,
              ]}>
              <Text
                maxFontSizeMultiplier={1.3}
                style={[styles.label, selected && styles.labelOn]}>
                {option.label}
              </Text>
            </Pressable>
            {option.tag ? (
              <View pointerEvents="none" style={styles.tagWrap}>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{option.tag}</Text>
                </View>
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, paddingTop: 10 },
  chip: { minWidth: 56 },
  label: { ...text.bodyM, fontFamily: font.bodySemi },
  labelOn: { color: colors.surface },
  tagWrap: { position: 'absolute', top: -10, left: 0, right: 0, alignItems: 'center' },
  tag: {
    height: 18,
    paddingHorizontal: radius.input / 2,
    borderRadius: 9,
    backgroundColor: colors.yellow500,
    justifyContent: 'center',
  },
  tagText: { fontFamily: font.bodySemi, fontSize: 10, lineHeight: 13, color: colors.green900 },
});
