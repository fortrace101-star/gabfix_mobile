import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { colors, font, shadow, space, text } from '@/theme';
import { ugx } from '@/utils/format';

type Props = {
  caption: string;
  total: number;
  actionLabel: string;
  onPress: () => void;
};

/** Sticky summary bar (Gabfix_App_Ui_2.md, 2.2): caption plus live total on the left, CTA right. */
export function SummaryBar({ caption, total, actionLabel, onPress }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, space[3]) }]}>
      <View style={styles.info}>
        <Text style={styles.caption} maxFontSizeMultiplier={1.3} numberOfLines={1}>
          {caption}
        </Text>
        <Text style={styles.total} maxFontSizeMultiplier={1.2} numberOfLines={1}>
          {ugx(total)}
        </Text>
      </View>
      <Button label={actionLabel} onPress={onPress} style={styles.action} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[3],
    paddingTop: space[3],
    paddingHorizontal: space[4],
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    ...shadow.floating,
  },
  info: { flex: 1, gap: 2 },
  caption: { ...text.caption },
  total: {
    fontFamily: font.poppinsBold,
    fontSize: 20,
    lineHeight: 26,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  action: { height: 48, paddingHorizontal: space[5] },
});
