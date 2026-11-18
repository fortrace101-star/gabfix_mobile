import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, font, radius, space, text } from '@/theme';
import { selectionHaptic } from '@/utils/haptics';

type Props = {
  days: readonly Date[];
  /** Selected calendar day as `YYYY-MM-DD`. */
  selectedISO: string | null;
  onSelect: (dateISO: string) => void;
};

const pad = (value: number) => String(value).padStart(2, '0');

export const toISODate = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const weekday = (date: Date) => date.toLocaleDateString('en-GB', { weekday: 'short' });
const dayNumber = (date: Date) => String(date.getDate());

/** Horizontal 30-day strip, 56 × 72 tiles with an 8 gap (Part 2, P10). */
export function DateStrip({ days, selectedISO, onSelect }: Props) {
  return (
    <FlatList
      horizontal
      data={days}
      keyExtractor={(date) => toISODate(date)}
      showsHorizontalScrollIndicator={false}
      snapToInterval={56 + space[2]}
      decelerationRate="fast"
      contentContainerStyle={styles.content}
      renderItem={({ item }) => {
        const iso = toISODate(item);
        const selected = iso === selectedISO;
        const today = iso === toISODate(new Date());

        return (
          <Pressable
            accessibilityRole="radio"
            accessibilityLabel={item.toDateString()}
            accessibilityState={{ selected }}
            // RN Web does not map accessibilityState to the DOM, so radios also need aria-checked.
            aria-checked={selected}
            onPress={() => {
              if (selected) return;
              selectionHaptic();
              onSelect(iso);
            }}
            style={[styles.tile, today && styles.tileToday, selected && styles.tileOn]}>
            <Text
              maxFontSizeMultiplier={1.2}
              style={[styles.dow, selected && styles.textOn]}>
              {weekday(item)}
            </Text>
            <Text
              maxFontSizeMultiplier={1.2}
              style={[styles.dom, selected && styles.textOn]}>
              {dayNumber(item)}
            </Text>
            {selected ? <View style={styles.dot} /> : null}
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space[4], gap: space[2] },
  tile: {
    width: 56,
    height: 72,
    borderRadius: radius.tile,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tileToday: { borderColor: colors.green500 },
  tileOn: { backgroundColor: colors.green500, borderColor: colors.green500 },
  dow: { ...text.caption },
  dom: {
    fontFamily: font.headingSemi,
    fontSize: 20,
    lineHeight: 26,
    color: colors.text,
  },
  textOn: { color: colors.surface },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.yellow500,
    marginTop: 2,
  },
});
