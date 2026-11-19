import { CircleAlert, Eye, EyeOff, type LucideIcon } from 'lucide-react-native';
import { forwardRef, useState, type ComponentRef } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { colors, font, input, radius, size, space } from '@/theme';

export type InputProps = Omit<TextInputProps, 'style'> & {
  label?: string;
  helper?: string;
  error?: string;
  /** Fixed prefix inside the field, for example +256 on phone fields. */
  prefix?: string;
  leftIcon?: LucideIcon;
  secure?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
};

/**
 * Height 52, radius 12, 1.5 border, focus ring (Part 1, 5.2 and Part 2, 2.2).
 * The label sits above the field and errors are announced, not colour-only.
 */
export const Input = forwardRef<ComponentRef<typeof TextInput>, InputProps>(function Input(
  {
    label,
    helper,
    error,
    prefix,
    leftIcon: LeftIcon,
    secure = false,
    containerStyle,
    inputStyle,
    onFocus,
    onBlur,
    editable = true,
    accessibilityLabel,
    ...rest
  },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const showError = Boolean(error);

  return (
    <View style={containerStyle}>
      {label ? <Text style={input.label}>{label}</Text> : null}
      <View style={[input.ring, focused && input.ringFocus]}>
        <View
          style={[
            input.field,
            focused && input.fieldFocus,
            showError && input.fieldError,
            !editable && input.fieldDisabled,
          ]}>
          {prefix ? (
            <View style={styles.prefix}>
              <Text style={styles.prefixText}>{prefix}</Text>
            </View>
          ) : null}
          {LeftIcon ? <LeftIcon size={size.iconSm} color={colors.textMuted} strokeWidth={2} /> : null}
          <TextInput
            {...rest}
            ref={ref}
            editable={editable}
            secureTextEntry={secure && !revealed}
            placeholderTextColor={colors.placeholder}
            maxFontSizeMultiplier={1.3}
            accessibilityLabel={accessibilityLabel ?? label}
            accessibilityHint={showError ? error : rest.accessibilityHint}
            onFocus={(event) => {
              setFocused(true);
              onFocus?.(event);
            }}
            onBlur={(event) => {
              setFocused(false);
              onBlur?.(event);
            }}
            style={[input.text, !editable && styles.textDisabled, inputStyle]}
          />
          {secure ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
              hitSlop={12}
              onPress={() => setRevealed((value) => !value)}
              style={styles.trailing}>
              {revealed ? (
                <EyeOff size={size.icon} color={colors.textMuted} strokeWidth={2} />
              ) : (
                <Eye size={size.icon} color={colors.textMuted} strokeWidth={2} />
              )}
            </Pressable>
          ) : null}
        </View>
      </View>
      {showError ? (
        <View style={styles.errorRow} accessibilityLiveRegion="polite">
          <CircleAlert size={14} color={colors.error} strokeWidth={2} />
          <Text style={input.error}>{error}</Text>
        </View>
      ) : helper ? (
        <Text style={input.helper}>{helper}</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  prefix: {
    height: 30,
    paddingHorizontal: space[2],
    borderRadius: radius.input,
    backgroundColor: colors.green50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prefixText: { fontFamily: font.bodySemi, fontSize: 14, color: colors.green700 },
  textDisabled: { color: colors.disabledText },
  trailing: {
    minWidth: size.touch,
    minHeight: size.touch,
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginRight: -space[3],
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1],
    marginTop: 6,
  },
});
