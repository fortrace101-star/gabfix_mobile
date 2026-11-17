import type { LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { btn, btnLabel, colors, duration, size } from '@/theme';
import { pressHaptic } from '@/utils/haptics';

export type ButtonVariant = 'primary' | 'onGreen' | 'secondary' | 'ghost' | 'destructive';

export type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
  small?: boolean;
  icon?: LucideIcon;
  style?: StyleProp<ViewStyle>;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const spinnerColor: Record<ButtonVariant, string> = {
  primary: colors.surface,
  onGreen: colors.green900,
  secondary: colors.green500,
  ghost: colors.green500,
  destructive: colors.surface,
};

const iconColor: Record<ButtonVariant, string> = {
  primary: colors.surface,
  onGreen: colors.green900,
  secondary: colors.green500,
  ghost: colors.green500,
  destructive: colors.surface,
};

/** Height 52, radius 14, 16/600 label. Pressed = scale 0.98 with a 100 ms timing (Part 2, 2.2). */
export function Button({
  label,
  variant = 'primary',
  loading = false,
  small = false,
  icon: Icon,
  style,
  disabled,
  onPress,
  onPressIn,
  onPressOut,
  accessibilityLabel,
  ...rest
}: ButtonProps) {
  const reducedMotion = useReducedMotion();
  const [scale] = useState(() => new Animated.Value(1));
  const isDisabled = disabled || loading;

  const animateTo = (value: number) => {
    if (reducedMotion) return;
    Animated.timing(scale, {
      toValue: value,
      duration: duration.press,
      useNativeDriver: true,
    }).start();
  };

  return (
    <AnimatedPressable
      {...rest}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      hitSlop={8}
      onPressIn={(event) => {
        animateTo(0.98);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        animateTo(1);
        onPressOut?.(event);
      }}
      onPress={(event) => {
        if (isDisabled) return;
        pressHaptic();
        onPress?.(event);
      }}
      style={[
        btn.base,
        small && btn.small,
        isDisabled && variant !== 'ghost' ? btn.disabled : btn[variant],
        style,
        { transform: [{ scale }] },
      ]}>
      {Icon ? (
        <Icon
          size={small ? size.iconSm : size.icon}
          color={isDisabled ? colors.disabledText : iconColor[variant]}
          strokeWidth={2}
        />
      ) : null}
      <Text
        maxFontSizeMultiplier={1.3}
        style={[btnLabel[variant], isDisabled && btnLabel.disabled, loading && styles.labelLoading]}>
        {label}
      </Text>
      {loading ? (
        <View style={styles.spinner}>
          <ActivityIndicator
            color={isDisabled ? colors.disabledText : spinnerColor[variant]}
            accessibilityLabel="Loading"
          />
        </View>
      ) : null}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  labelLoading: { opacity: 0 },
  spinner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
