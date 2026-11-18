import { Check } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { colors, font, radius, space, text } from '@/theme';

const stages = ['Details', 'Schedule', 'Location', 'Confirm'] as const;

type Props = {
  /** Zero-based index of the active stage. */
  current: number;
};

/** Details · Schedule · Location · Confirm (Gabfix_App_Ui_2.md, 6.0). Add-ons belong to Details. */
export function StepperHeader({ current }: Props) {
  return (
    <View style={styles.header}>
      {stages.map((label, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <View key={label} style={styles.stage}>
            {index > 0 ? (
              <View style={[styles.connector, index <= current && styles.connectorDone]} />
            ) : null}
            <View
              style={[styles.circle, done && styles.circleDone, active && styles.circleActive]}>
              {done ? (
                <Check size={16} color={colors.surface} strokeWidth={2.5} />
              ) : (
                <Text
                  maxFontSizeMultiplier={1.2}
                  style={[styles.number, active && styles.numberActive]}>
                  {index + 1}
                </Text>
              )}
            </View>
            <Text
              maxFontSizeMultiplier={1.3}
              numberOfLines={1}
              style={[styles.label, active && styles.labelActive]}>
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 64,
    paddingHorizontal: space[4],
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
  },
  stage: { flex: 1, alignItems: 'center', gap: 4 },
  connector: {
    position: 'absolute',
    top: 13,
    left: '-50%',
    right: '50%',
    height: 2,
    backgroundColor: colors.border,
  },
  connectorDone: { backgroundColor: colors.green500 },
  circle: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.border,
  },
  circleActive: {
    backgroundColor: colors.green500,
    borderWidth: 3,
    borderColor: colors.yellow500,
  },
  circleDone: { backgroundColor: colors.green500 },
  number: { ...text.caption, fontFamily: font.bodySemi, color: colors.textMuted },
  numberActive: { color: colors.surface },
  label: { ...text.caption, fontSize: 12 },
  labelActive: { color: colors.green700, fontFamily: font.bodySemi },
});
