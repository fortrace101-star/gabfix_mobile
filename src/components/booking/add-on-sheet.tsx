import { Check, X } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import type { AddOnDefinition } from '@/config/add-ons';
import { colors, font, space, text } from '@/theme';

type Props = {
  definition: AddOnDefinition | null;
  onClose: () => void;
};

/** Half-height sheet listing what an add-on covers (S1 11.5 shared bottom sheet). */
export function AddOnSheet({ definition, onClose }: Props) {
  return (
    <BottomSheet
      visible={definition !== null}
      onDismiss={onClose}
      title={definition?.name ?? 'Add-on'}
      subtitle="What's included"
      maxHeightRatio={0.7}
      contentContainerStyle={styles.content}>
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
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space[4], paddingTop: space[3], paddingBottom: space[4], gap: space[2] },
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
  groupTitle: { ...text.bodyM, marginTop: space[2] },
});
