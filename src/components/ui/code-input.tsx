import { useRef, useState, type ComponentRef } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type NativeSyntheticEvent,
} from 'react-native';

import { colors, font, radius, space } from '@/theme';

type Props = {
  code: string;
  onChange: (code: string) => void;
  length?: number;
  error?: boolean;
  onComplete?: (code: string) => void;
  autoFocus?: boolean;
};

/** Six 56-high code boxes with auto-advance, backspace-back and paste support (Part 2, P2c). */
export function CodeInput({ code, onChange, length = 6, error = false, onComplete, autoFocus }: Props) {
  const inputs = useRef<(ComponentRef<typeof TextInput> | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const digits = code.split('').slice(0, length);

  const commit = (next: string) => {
    onChange(next);
    if (next.length === length) onComplete?.(next);
  };

  const handleChange = (text: string, index: number) => {
    const clean = text.replace(/\D/g, '');
    if (!clean) {
      const next = code.split('');
      next[index] = '';
      commit(next.join('').slice(0, length));
      return;
    }

    if (clean.length > 1) {
      const next = code.padEnd(length, ' ').split('');
      clean.split('').forEach((digit, offset) => {
        if (index + offset < length) next[index + offset] = digit;
      });
      const joined = next.join('').replace(/ /g, '');
      commit(joined);
      inputs.current[Math.min(index + clean.length, length - 1)]?.focus();
      return;
    }

    const next = code.padEnd(length, ' ').split('');
    next[index] = clean;
    commit(next.join('').replace(/ /g, ''));
    if (index < length - 1) inputs.current[index + 1]?.focus();
  };

  const handleKeyPress = (
    event: NativeSyntheticEvent<{ key: string }>,
    index: number,
  ) => {
    if (event.nativeEvent.key !== 'Backspace') return;
    if (digits[index]) return;
    if (index === 0) return;
    const next = code.padEnd(length, ' ').split('');
    next[index - 1] = ' ';
    commit(next.join('').replace(/ /g, ''));
    inputs.current[index - 1]?.focus();
  };

  return (
    <View style={styles.row}>
      {Array.from({ length }).map((_, index) => {
        const filled = Boolean(digits[index]);
        return (
          <TextInput
            key={index}
            ref={(instance) => {
              inputs.current[index] = instance;
            }}
            value={digits[index] ?? ''}
            onChangeText={(value) => handleChange(value, index)}
            onKeyPress={(event) => handleKeyPress(event, index)}
            onFocus={() => setFocusedIndex(index)}
            onBlur={() => setFocusedIndex((current) => (current === index ? null : current))}
            keyboardType="number-pad"
            inputMode="numeric"
            maxLength={length}
            autoFocus={autoFocus && index === 0}
            textContentType={index === 0 ? 'oneTimeCode' : 'none'}
            autoComplete={index === 0 ? 'sms-otp' : 'off'}
            selectTextOnFocus
            accessibilityLabel={`Digit ${index + 1} of ${length}`}
            maxFontSizeMultiplier={1.3}
            placeholderTextColor={colors.placeholder}
            style={[
              styles.box,
              focusedIndex === index && styles.boxFocused,
              filled && styles.boxFilled,
              error && styles.boxError,
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: space[2] },
  box: {
    flex: 1,
    maxWidth: 52,
    height: 56,
    borderRadius: radius.input,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    textAlign: 'center',
    fontFamily: font.headingSemi,
    fontSize: 22,
    color: colors.text,
    padding: 0,
  },
  boxFocused: { borderColor: colors.green500 },
  boxFilled: { backgroundColor: colors.green50, borderColor: colors.green100 },
  boxError: { borderColor: colors.error },
});
