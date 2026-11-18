import { ArrowRight } from 'lucide-react-native';
import { useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { auth, authSize, duration, font } from '@/theme';
import { pressHaptic } from '@/utils/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  showArrow?: boolean;
  variant?: 'solid' | 'outline';
  style?: StyleProp<ViewStyle>;
};

/** 48-high white pill. Disabled keeps the white pill at 50 % instead of turning grey. */
export function PillButton({
  label,
  showArrow = true,
  variant = 'solid',
  style,
  disabled,
  onPress,
  onPressIn,
  onPressOut,
  accessibilityLabel,
  ...rest
}: Props) {
  const reducedMotion = useReducedMotion();
  const [scale] = useState(() => new Animated.Value(1));
  const outline = variant === 'outline';

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
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
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
        if (disabled) return;
        pressHaptic();
        onPress?.(event);
      }}
      style={[
        styles.button,
        outline && styles.outline,
        disabled && styles.disabled,
        style,
        { transform: [{ scale }] },
      ]}>
      <Text
        maxFontSizeMultiplier={1.3}
        style={[styles.label, outline && styles.labelOutline]}>
        {label}
      </Text>
      {showArrow ? (
        <ArrowRight
          size={16}
          color={outline ? auth.text : auth.btnText}
          strokeWidth={1.8}
        />
      ) : null}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: authSize.field,
    borderRadius: authSize.radius,
    backgroundColor: auth.btnBg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: auth.text,
  },
  disabled: { opacity: 0.5 },
  label: {
    fontFamily: font.poppinsMedium,
    fontSize: 14,
    lineHeight: 20,
    color: auth.btnText,
  },
  labelOutline: { color: auth.text },
});
