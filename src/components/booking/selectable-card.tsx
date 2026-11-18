import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, font, radius, selectable, space, text } from '@/theme';
import { selectionHaptic } from '@/utils/haptics';

type Props = {
  title: string;
  subtitle?: string;
  benefit?: string;
  discount?: string;
  selected: boolean;
  onPress: () => void;
};

/** Radio card with an optional discount tag and benefit line (Gabfix_App_Ui_2.md, 6.0). */
export function SelectableCard({
  title,
  subtitle,
  benefit,
  discount,
  selected,
  onPress,
}: Props) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={[title, discount, subtitle].filter(Boolean).join(', ')}
      accessibilityState={{ selected }}
      onPress={() => {
        if (selected) return;
        selectionHaptic();
        onPress();
      }}
      style={[selectable.card, selected && selectable.selected]}>
      <View style={[styles.radio, selected && styles.radioOn]}>
        {selected ? <View style={styles.dot} /> : null}
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} maxFontSizeMultiplier={1.3}>
            {title}
          </Text>
          {discount ? (
            <View style={styles.discount}>
              <Text style={styles.discountText}>{discount}</Text>
            </View>
          ) : null}
        </View>
        {subtitle ? (
          <Text style={styles.subtitle} maxFontSizeMultiplier={1.3}>
            {subtitle}
          </Text>
        ) : null}
        {benefit ? (
          <View style={styles.benefit}>
            <Check size={16} color={colors.success} strokeWidth={2.5} />
            <Text style={styles.benefitText} maxFontSizeMultiplier={1.3}>
              {benefit}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  radio: {
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  radioOn: { borderColor: colors.green500 },
  dot: { width: 10, height: 10, borderRadius: radius.pill, backgroundColor: colors.green500 },
  body: { flex: 1, gap: space[1] },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[2],
  },
  title: { ...text.bodyM, fontFamily: font.bodySemi, fontSize: 15, flexShrink: 1 },
  subtitle: { ...text.caption },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  benefitText: { ...text.caption, color: colors.green700, flexShrink: 1 },
  discount: {
    height: 24,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: colors.yellow500,
    justifyContent: 'center',
  },
  discountText: { fontFamily: font.bodySemi, fontSize: 12, lineHeight: 16, color: colors.green900 },
});
