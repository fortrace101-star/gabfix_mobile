import { Check } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, size, space, text } from '@/theme';
import { selectionHaptic } from '@/utils/haptics';

export type CheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  error?: string;
  disabled?: boolean;
  accessibilityLabel?: string;
};

/** 22 × 22 box with a 48 dp touch target (Part 2, 2.3). */
export function Checkbox({
  checked,
  onChange,
  label,
  error,
  disabled = false,
  accessibilityLabel,
}: CheckboxProps) {
  return (
    <View>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked, disabled }}
        accessibilityLabel={accessibilityLabel}
        disabled={disabled}
        hitSlop={8}
        onPress={() => {
          selectionHaptic();
          onChange(!checked);
        }}
        style={[styles.row, disabled && styles.disabled]}>
        <View style={[styles.box, checked && styles.boxChecked, error ? styles.boxError : null]}>
          {checked ? <Check size={16} color={colors.surface} strokeWidth={3} /> : null}
        </View>
        <View style={styles.labelWrap}>{typeof label === 'string' ? <Text style={styles.label}>{label}</Text> : label}</View>
      </Pressable>
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[3],
    minHeight: size.touch,
    paddingVertical: space[2],
  },
  disabled: { opacity: 0.5 },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  boxChecked: { backgroundColor: colors.green500, borderColor: colors.green500 },
  boxError: { borderColor: colors.error },
  labelWrap: { flex: 1 },
  label: { ...text.body, color: colors.textMuted },
  error: { ...text.caption, color: colors.error, marginLeft: 34 },
});
