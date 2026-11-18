import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import type { Slot } from '@/lib/api/availability';
import { colors, space, text } from '@/theme';
import { selectionHaptic } from '@/utils/haptics';

type Props = {
  slots: readonly Slot[];
  value: string | null;
  onSelect: (time: string) => void;
};

export const slotLabel = (time: string): string => {
  const [hours, minutes] = time.split(':').map(Number);
  const suffix = hours >= 12 ? 'pm' : 'am';
  const hour = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour}:${String(minutes).padStart(2, '0')} ${suffix}`;
};

/** Three chips per row, 44 high, full slots struck through (Part 2, P10). */
export function SlotChips({ slots, value, onSelect }: Props) {
  const { width } = useWindowDimensions();
  const chipWidth = Math.floor((width - space[4] * 2 - space[2] * 2) / 3);

  return (
    <View style={styles.grid}>
      {slots.map((slot) => {
        const selected = slot.time === value;
        const low = slot.available && (slot.remaining ?? 0) <= 2;

        return (
          <Pressable
            key={slot.time}
            accessibilityRole="radio"
            accessibilityLabel={
              slot.available ? slotLabel(slot.time) : `${slotLabel(slot.time)}, fully booked`
            }
            accessibilityState={{ selected, disabled: !slot.available }}
            // RN Web does not map accessibilityState to the DOM, so radios also need aria-checked.
            aria-checked={selected}
            disabled={!slot.available}
            onPress={() => {
              if (selected) return;
              selectionHaptic();
              onSelect(slot.time);
            }}
            style={[
              styles.chip,
              { width: chipWidth },
              !slot.available && styles.chipOff,
              selected && styles.chipOn,
            ]}>
            <Text
              maxFontSizeMultiplier={1.3}
              numberOfLines={1}
              style={[
                styles.label,
                !slot.available && styles.labelOff,
                selected && styles.labelOn,
              ]}>
              {slotLabel(slot.time)}
            </Text>
            {low ? (
              <Text style={styles.low} maxFontSizeMultiplier={1.2} numberOfLines={1}>
                Few left
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  chip: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.green100,
    backgroundColor: colors.green50,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space[1],
    paddingVertical: 5,
    gap: 1,
  },
  chipOff: { backgroundColor: colors.disabledBg, borderColor: colors.disabledBg },
  chipOn: { backgroundColor: colors.green500, borderColor: colors.green500 },
  label: { ...text.bodyM, fontSize: 13, color: colors.green700 },
  labelOff: { color: colors.disabledText, textDecorationLine: 'line-through' },
  labelOn: { color: colors.surface },
  low: { ...text.caption, fontSize: 10, lineHeight: 13, color: colors.warning },
});
