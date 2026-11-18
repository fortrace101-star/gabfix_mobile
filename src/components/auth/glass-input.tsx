import { CircleAlert, Eye, EyeOff, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { auth, authSize, font } from '@/theme';

type Props = {
  value: string;
  onChangeText?: (value: string) => void;
  placeholder: string;
  icon?: LucideIcon;
  leadingIcon?: LucideIcon;
  secure?: boolean;
  prefix?: string;
  error?: string;
  helper?: string;
  onPress?: () => void;
  keyboardType?: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  autoComplete?: TextInputProps['autoComplete'];
  textContentType?: TextInputProps['textContentType'];
  maxLength?: number;
  returnKeyType?: TextInputProps['returnKeyType'];
  onSubmitEditing?: () => void;
  autoFocus?: boolean;
  accessibilityLabel?: string;
};

/** 48-high translucent pill with placeholder-as-label and an optional trailing icon. */
export function GlassInput({
  value,
  onChangeText,
  placeholder,
  icon: Icon,
  leadingIcon: LeadingIcon,
  secure = false,
  prefix,
  error,
  helper,
  onPress,
  keyboardType,
  autoCapitalize,
  autoComplete,
  textContentType,
  maxLength,
  returnKeyType,
  onSubmitEditing,
  autoFocus,
  accessibilityLabel,
}: Props) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const fieldStyle = [
    styles.field,
    focused && !onPress && styles.fieldFocused,
    Boolean(error) && styles.fieldError,
  ];

  const content = (
    <>
      {prefix ? (
        <View style={styles.prefix}>
          <Text style={styles.prefixText} maxFontSizeMultiplier={1.3}>
            {prefix}
          </Text>
        </View>
      ) : null}
      {LeadingIcon ? (
        <LeadingIcon size={20} color={auth.fieldIcon} strokeWidth={2} />
      ) : null}
      {onPress ? (
        <Text
          numberOfLines={1}
          style={[styles.value, !value && styles.placeholder]}
          maxFontSizeMultiplier={1.3}>
          {value || placeholder}
        </Text>
      ) : (
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          placeholderTextColor={auth.placeholder}
          secureTextEntry={secure && !revealed}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          textContentType={textContentType}
          maxLength={maxLength}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          autoFocus={autoFocus}
          accessibilityLabel={accessibilityLabel ?? placeholder}
          maxFontSizeMultiplier={1.3}
          selectionColor={auth.accent}
          cursorColor={auth.accent}
          style={styles.value}
        />
      )}
      {secure ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
          hitSlop={12}
          onPress={() => setRevealed((current) => !current)}
          style={styles.trailingButton}>
          {revealed ? (
            <Eye size={20} color={auth.fieldIcon} strokeWidth={2} />
          ) : (
            <EyeOff size={20} color={auth.fieldIcon} strokeWidth={2} />
          )}
        </Pressable>
      ) : Icon ? (
        <Icon size={20} color={auth.fieldIcon} strokeWidth={2} />
      ) : null}
    </>
  );

  return (
    <View>
      {onPress ? (
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel ?? placeholder}
          style={fieldStyle}>
          {content}
        </Pressable>
      ) : (
        <View style={fieldStyle}>{content}</View>
      )}
      {error ? (
        <View style={styles.errorRow} accessibilityLiveRegion="polite">
          <CircleAlert size={12} color={auth.error} strokeWidth={2.2} />
          <Text style={styles.errorText} maxFontSizeMultiplier={1.3}>
            {error}
          </Text>
        </View>
      ) : helper ? (
        <Text style={styles.helper} maxFontSizeMultiplier={1.3}>
          {helper}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    height: authSize.field,
    borderRadius: authSize.radius,
    backgroundColor: auth.glass,
    borderWidth: 1.5,
    borderColor: auth.glassBorder,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fieldFocused: {
    backgroundColor: auth.glassStrong,
    borderColor: auth.text,
  },
  fieldError: { borderColor: auth.error },
  prefix: {
    height: 28,
    paddingHorizontal: 10,
    borderRadius: authSize.radius,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
  },
  prefixText: {
    fontFamily: font.poppinsMedium,
    fontSize: 12,
    color: auth.text,
  },
  value: {
    flex: 1,
    fontFamily: font.poppins,
    fontSize: 14,
    lineHeight: 20,
    color: auth.text,
    padding: 0,
  },
  placeholder: { color: auth.placeholder },
  trailingButton: {
    width: 36,
    height: 44,
    marginRight: -8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 18,
    marginTop: 6,
    paddingHorizontal: 20,
  },
  errorText: {
    flexShrink: 1,
    fontFamily: font.poppins,
    fontSize: 12,
    lineHeight: 18,
    color: auth.error,
  },
  helper: {
    marginTop: 6,
    paddingHorizontal: 20,
    fontFamily: font.poppins,
    fontSize: 12,
    lineHeight: 18,
    color: auth.textSoft,
  },
});

