import { Minus, Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, font, space, text } from '@/theme';
import { selectionHaptic } from '@/utils/haptics';

type Props = {
  label: string;
  hint?: string;
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
};

/** Row with −/value/+ controls; announces as an adjustable element to screen readers. */
export function CounterStepper({ label, hint, value, onChange, min = 0, max = 12 }: Props) {
  const dec = () => {
    selectionHaptic();
    onChange(Math.max(min, value - 1));
  };
  const inc = () => {
    selectionHaptic();
    onChange(Math.min(max, value + 1));
  };

  return (
    <View
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ now: value, min, max }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === 'increment') inc();
        if (event.nativeEvent.actionName === 'decrement') dec();
      }}
      style={styles.row}>
      <View style={styles.text}>
        <Text style={styles.label} maxFontSizeMultiplier={1.3}>
          {label}
        </Text>
        {hint ? (
          <Text style={styles.hint} maxFontSizeMultiplier={1.3}>
            {hint}
          </Text>
        ) : null}
      </View>
      <View style={styles.controls}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Fewer ${label.toLowerCase()}`}
          disabled={value <= min}
          onPress={dec}
          style={[styles.button, value <= min && styles.buttonOff]}>
          <Minus
            size={18}
            color={value <= min ? colors.disabledText : colors.green700}
            strokeWidth={2}
          />
        </Pressable>
        <Text style={styles.value} maxFontSizeMultiplier={1.2}>
          {value}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`More ${label.toLowerCase()}`}
          disabled={value >= max}
          onPress={inc}
          style={[styles.button, value >= max && styles.buttonOff]}>
          <Plus
            size={18}
            color={value >= max ? colors.disabledText : colors.green700}
            strokeWidth={2}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    gap: space[3],
  },
  text: { flex: 1 },
  label: { ...text.bodyM, color: colors.text },
  hint: { ...text.caption, color: colors.textMuted },
  controls: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.green50,
  },
  buttonOff: { backgroundColor: colors.disabledBg },
  value: {
    minWidth: 24,
    textAlign: 'center',
    ...text.bodyM,
    fontFamily: font.bodySemi,
    color: colors.text,
  },
});
