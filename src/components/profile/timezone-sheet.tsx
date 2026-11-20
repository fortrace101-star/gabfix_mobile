import { Check, Globe2, X } from 'lucide-react-native';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { timezones, timezoneLabel } from '@/config/timezones';
import { colors, font, radius, space, text } from '@/theme';

type Props = {
  visible: boolean;
  value: string;
  onSelect: (id: string) => void;
  onClose: () => void;
};

export function TimezoneSheet({ visible, value, onSelect, onClose }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={StyleSheet.absoluteFill} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, space[4]) }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title} maxFontSizeMultiplier={1.3}>Timezone</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" hitSlop={8} onPress={onClose} style={styles.close}>
              <X size={22} color={colors.text} strokeWidth={2} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.list}>
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
                  <Globe2 size={18} color={selected ? colors.green700 : colors.textMuted} strokeWidth={2} />
                  <View style={styles.rowBody}>
                    <Text style={styles.rowLabel} maxFontSizeMultiplier={1.3}>
                      {zone.city}, {zone.country}
                    </Text>
                    <Text style={styles.rowSub} maxFontSizeMultiplier={1.2}>{zone.id}</Text>
                  </View>
                  {selected ? <Check size={18} color={colors.green700} strokeWidth={2.4} /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
          <Text style={styles.note} maxFontSizeMultiplier={1.3}>
            Current: {timezoneLabel(value)}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end' },
  sheet: { maxHeight: '75%', backgroundColor: colors.surface, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, paddingHorizontal: space[4], paddingTop: space[2] },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: space[3] },
  header: { flexDirection: 'row', alignItems: 'center' },
  title: { ...text.h3, flex: 1 },
  close: { width: 48, height: 48, alignItems: 'flex-end', justifyContent: 'center' },
  list: { gap: space[2], paddingVertical: space[2] },
  row: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: space[3], paddingHorizontal: space[3], borderRadius: radius.input, borderWidth: 1.5, borderColor: colors.border },
  rowOn: { borderColor: colors.green500, backgroundColor: colors.green50 },
  rowBody: { flex: 1 },
  rowLabel: { ...text.bodyM, fontFamily: font.bodySemi },
  rowSub: { ...text.caption, color: colors.textMuted },
  note: { ...text.caption, color: colors.textMuted, paddingTop: space[2] },
});
