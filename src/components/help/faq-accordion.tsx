import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { FaqItem } from '@/config/help';
import { colors, font, space, text } from '@/theme';

type Props = {
  faq: FaqItem;
  last?: boolean;
};

/** One accessible FAQ row used by the help index and the grouped FAQ screen. */
export function FaqAccordion({ faq, last = false }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={[styles.row, !last && styles.divider]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={faq.question}
        accessibilityState={{ expanded }}
        aria-expanded={expanded}
        onPress={() => setExpanded((value) => !value)}
        style={({ pressed }) => [styles.questionRow, pressed && styles.pressed]}>
        <Text style={styles.question} maxFontSizeMultiplier={1.3}>
          {faq.question}
        </Text>
        {expanded ? (
          <ChevronUp size={18} color={colors.green700} strokeWidth={2} />
        ) : (
          <ChevronDown size={18} color={colors.textMuted} strokeWidth={2} />
        )}
      </Pressable>
      {expanded ? (
        <Text style={styles.answer} maxFontSizeMultiplier={1.3}>
          {faq.answer}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: space[4] },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  questionRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    paddingVertical: space[3],
  },
  pressed: { opacity: 0.65 },
  question: {
    ...text.bodyM,
    flex: 1,
    color: colors.text,
    fontFamily: font.bodySemi,
  },
  answer: {
    ...text.body,
    color: colors.textMuted,
    paddingBottom: space[4],
    lineHeight: 21,
  },
});
