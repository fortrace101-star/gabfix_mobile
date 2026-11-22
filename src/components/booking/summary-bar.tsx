import { ChevronUp } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { colors, font, shadow, space, text } from '@/theme';
import { ugx } from '@/utils/format';

type Props = {
  caption: string;
  total: number;
  actionLabel: string;
  onPress: () => void;
  disabled?: boolean;
  /** Opens the shared price breakdown sheet (P8–P11). */
  onDetailsPress?: () => void;
  /** Replaces the money total, e.g. "Custom quote" for quote-only services. */
  valueLabel?: string;
};

/** Sticky summary bar (Gabfix_App_Ui_2.md, 2.2): caption plus live total on the left, CTA right. */
export function SummaryBar({
  caption,
  total,
  actionLabel,
  onPress,
  disabled = false,
  onDetailsPress,
  valueLabel,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, space[3]) }]}>
      <Pressable
        accessibilityLabel={onDetailsPress ? 'View price breakdown' : undefined}
        accessibilityRole={onDetailsPress ? 'button' : undefined}
        disabled={!onDetailsPress}
        onPress={onDetailsPress}
        style={styles.info}>
        <View style={styles.captionRow}>
          <Text style={styles.caption} maxFontSizeMultiplier={1.3} numberOfLines={1}>
            {caption}
          </Text>
          {onDetailsPress ? (
            <View style={styles.details}>
              <Text style={styles.detailsText} maxFontSizeMultiplier={1.2}>
                Details
              </Text>
              <ChevronUp size={14} color={colors.green700} strokeWidth={2} />
            </View>
          ) : null}
        </View>
        <Text style={styles.total} maxFontSizeMultiplier={1.2} numberOfLines={1}>
          {valueLabel ?? ugx(total)}
        </Text>
      </Pressable>
      <Button label={actionLabel} onPress={onPress} disabled={disabled} style={styles.action} />
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
  captionRow: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  details: { flexDirection: 'row', alignItems: 'center', gap: 1 },
  detailsText: {
    fontFamily: font.bodySemi,
    fontSize: 11,
    lineHeight: 15,
    color: colors.green700,
  },
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
