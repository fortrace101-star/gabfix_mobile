import { StyleSheet, Text, View } from 'react-native';

import { colors, font, radius } from '@/theme';

export type StatusChipTone = 'success' | 'info' | 'warning' | 'error' | 'neutral';

type Props = {
  label: string;
  tone: StatusChipTone;
};

/** Small pill for a record's state (booking status, upload state, payment result). */
export function StatusChip({ label, tone }: Props) {
  const { bg, fg } = tones[tone];
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <Text style={[styles.chipText, { color: fg }]} maxFontSizeMultiplier={1.2}>
        {label}
      </Text>
    </View>
  );
}

const tones: Record<StatusChipTone, { bg: string; fg: string }> = {
  success: { bg: colors.successBg, fg: colors.green700 },
  info: { bg: colors.infoBg, fg: colors.info },
  warning: { bg: colors.warningBg, fg: colors.warning },
  error: { bg: colors.errorBg, fg: colors.error },
  neutral: { bg: colors.disabledBg, fg: colors.textMuted },
};

const styles = StyleSheet.create({
  chip: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 6 },
  chipText: { fontSize: 12, fontFamily: font.bodySemi },
});
