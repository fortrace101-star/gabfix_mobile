import { Check, Globe2 } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { timezones, timezoneLabel } from '@/config/timezones';
import { colors, font, radius, space, text } from '@/theme';

type Props = {
  visible: boolean;
  value: string;
  onSelect: (id: string) => void;
  onClose: () => void;
};

export function TimezoneSheet({ visible, value, onSelect, onClose }: Props) {
  return (
    <BottomSheet
      visible={visible}
      onDismiss={onClose}
      title="Timezone"
      maxHeightRatio={0.75}
      contentContainerStyle={styles.list}
      footer={
        <Text style={styles.note} maxFontSizeMultiplier={1.3}>
          Current: {timezoneLabel(value)}
        </Text>
      }>
      {timezones.map((zone) => {
        const selected = zone.id === value;
        return (
          <Pressable
            key={zone.id}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => {
              onSelect(zone.id);
              onClose();
            }}
            style={[styles.row, selected && styles.rowOn]}>
            <Globe2
              size={18}
              color={selected ? colors.green700 : colors.textMuted}
              strokeWidth={2}
            />
            <View style={styles.rowBody}>
              <Text style={styles.rowLabel} maxFontSizeMultiplier={1.3}>
                {zone.city}, {zone.country}
              </Text>
              <Text style={styles.rowSub} maxFontSizeMultiplier={1.2}>
                {zone.id}
              </Text>
            </View>
            {selected ? <Check size={18} color={colors.green700} strokeWidth={2.4} /> : null}
          </Pressable>
        );
      })}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  list: { gap: space[2], paddingHorizontal: space[4], paddingVertical: space[2] },
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    paddingHorizontal: space[3],
    borderRadius: radius.input,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  rowOn: { borderColor: colors.green500, backgroundColor: colors.green50 },
  rowBody: { flex: 1 },
  rowLabel: { ...text.bodyM, fontFamily: font.bodySemi },
  rowSub: { ...text.caption, color: colors.textMuted },
  note: { ...text.caption, color: colors.textMuted },
});
