import { Check, X } from 'lucide-react-native';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { AddOnDefinition } from '@/config/add-ons';
import { colors, font, radius, space, text } from '@/theme';

type Props = {
  definition: AddOnDefinition | null;
  onClose: () => void;
};

/**
 * Half-height sheet listing what an add-on covers (Part 2, P9). Uses the platform Modal
 * because `@gorhom/bottom-sheet` is not part of this build's dependencies.
 */
export function AddOnSheet({ definition, onClose }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={definition !== null}>
      <View style={styles.backdrop}>
        <Pressable
          accessibilityLabel="Close what's included"
          accessibilityRole="button"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, space[4]) }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title} maxFontSizeMultiplier={1.3}>
                {definition?.name ?? 'Add-on'}
              </Text>
              <Text style={styles.subtitle} maxFontSizeMultiplier={1.3}>
                What&apos;s included
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Close"
              accessibilityRole="button"
              hitSlop={8}
              onPress={onClose}
              style={styles.close}>
              <X size={22} color={colors.text} strokeWidth={2} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {definition?.included.map((item) => (
              <View key={item} style={styles.row}>
                <Check size={18} color={colors.success} strokeWidth={2.5} />
                <Text style={styles.rowText} maxFontSizeMultiplier={1.3}>
                  {item}
                </Text>
              </View>
            ))}

            <Text style={styles.groupTitle} maxFontSizeMultiplier={1.3}>
              Not included
            </Text>
            {definition?.notIncluded.map((item) => (
              <View key={item} style={styles.row}>
                <X size={18} color={colors.disabledText} strokeWidth={2.5} />
                <Text style={[styles.rowText, styles.muted]} maxFontSizeMultiplier={1.3}>
                  {item}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.scrim,
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '70%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: space[4],
    paddingTop: space[2],
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: space[3],
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: space[3] },
  headerText: { flex: 1, gap: 2 },
  title: { ...text.h2 },
  subtitle: { ...text.caption },
  close: {
    width: 48,
    height: 48,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  content: { paddingTop: space[3], paddingBottom: space[4], gap: space[2] },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: space[3] },
  rowText: {
    ...text.body,
    flex: 1,
    fontFamily: font.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  muted: { color: colors.textMuted },
  groupTitle: { ...text.bodyM, fontFamily: font.bodySemi, marginTop: space[3] },
});
