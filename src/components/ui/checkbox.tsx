import { Check } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { auth, colors, font, size, space, text } from '@/theme';
import { selectionHaptic } from '@/utils/haptics';

export type CheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  error?: string;
  disabled?: boolean;
  accessibilityLabel?: string;
  /** White-on-colour variant for auth screens. */
  tone?: 'default' | 'onColor';
  /** Tight row on one line, for the Login options row. */
  compact?: boolean;
};

/** 22 × 22 box with a 48 dp touch target (Part 2, 2.3). */
export function Checkbox({
  checked,
  onChange,
  label,
  error,
  disabled = false,
  accessibilityLabel,
  tone = 'default',
  compact = false,
}: CheckboxProps) {
  const onColor = tone === 'onColor';

  return (
    <View style={compact && styles.wrapCompact}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked, disabled }}
        accessibilityLabel={accessibilityLabel}
        disabled={disabled}
        hitSlop={compact ? { top: 14, bottom: 14, left: 8, right: 8 } : 8}
        onPress={() => {
          selectionHaptic();
          onChange(!checked);
        }}
        style={[styles.row, compact && styles.rowCompact, disabled && styles.disabled]}>
        <View
          style={[
            styles.box,
            compact && styles.boxCompact,
            onColor && styles.boxOnColor,
            checked && styles.boxChecked,
            onColor && checked && styles.boxCheckedOnColor,
            error ? (onColor ? styles.boxErrorOnColor : styles.boxError) : null,
          ]}>
          {checked ? (
            <Check
              size={compact ? 12 : 16}
              color={onColor ? auth.btnText : colors.surface}
              strokeWidth={3}
            />
          ) : null}
        </View>
        <View style={[styles.labelWrap, compact && styles.labelWrapCompact]}>
          {typeof label === 'string' ? (
            <Text
              style={[
                styles.label,
                compact && styles.labelCompact,
                onColor && styles.labelOnColor,
              ]}>
              {label}
            </Text>
          ) : (
            label
          )}
        </View>
      </Pressable>
      {error ? (
        <Text
          style={[
            styles.error,
            compact && styles.errorCompact,
            onColor && styles.errorOnColor,
          ]}
          accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapCompact: { minHeight: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[3],
    minHeight: size.touch,
    paddingVertical: space[2],
  },
  rowCompact: {
    alignItems: 'center',
    gap: 8,
    minHeight: 0,
    paddingVertical: 0,
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
  boxCompact: { width: 18, height: 18, borderRadius: 5, marginTop: 0 },
  boxOnColor: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255,255,255,0.85)',
  },
  boxChecked: { backgroundColor: colors.green500, borderColor: colors.green500 },
  boxCheckedOnColor: { backgroundColor: auth.btnBg, borderColor: auth.btnBg },
  boxError: { borderColor: colors.error },
  boxErrorOnColor: { borderColor: auth.error },
  labelWrap: { flex: 1 },
  // The base row uses flex: 1, which leaves flex-basis: 0; the compact label must hug its text.
  labelWrapCompact: { flexGrow: 0, flexShrink: 0, flexBasis: 'auto' },
  label: { ...text.body, color: colors.textMuted },
  labelCompact: {
    fontFamily: font.poppins,
    fontSize: 12,
    lineHeight: 18,
    color: auth.text,
  },
  labelOnColor: { color: auth.text },
  error: { ...text.caption, color: colors.error, marginLeft: 34 },
  errorCompact: { marginLeft: 26 },
  errorOnColor: { color: auth.error },
});
