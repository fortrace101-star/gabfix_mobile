import { StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native';

import { colors, radius, shadow, space } from '@/theme';

export type CardTone = 'default' | 'muted' | 'success' | 'warning';

type Props = ViewProps & {
  /** Adds the standard 16 dp inner padding. Turn off for cards that clip a list. */
  padded?: boolean;
  tone?: CardTone;
  style?: ViewStyle | ViewStyle[];
};

/** Base surface card: white, 16 radius, hairline border and the shared shadow. */
export function Card({ padded = true, tone = 'default', style, children, ...rest }: Props) {
  return (
    <View {...rest} style={[styles.base, padded && styles.padded, tones[tone], style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadow.card,
  },
  padded: { padding: space[4] },
});

const tones: Record<CardTone, ViewStyle> = {
  default: {},
  muted: { backgroundColor: colors.disabledBg },
  success: { backgroundColor: colors.green50, borderColor: colors.green100 },
  warning: { backgroundColor: colors.warningBg, borderColor: colors.warning },
};
