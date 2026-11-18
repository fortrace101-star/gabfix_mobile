import {
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { GoogleGlyph } from '@/components/auth/google-glyph';
import { auth, authSize, font } from '@/theme';

type Props = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  style?: StyleProp<ViewStyle>;
};

/** White pill with the multicolour Google G. */
export function SocialButton({ label, onPress, style, ...rest }: Props) {
  return (
    <Pressable
      {...rest}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.button, style, pressed && styles.pressed]}>
      <GoogleGlyph size={18} />
      <Text style={styles.label} maxFontSizeMultiplier={1.3}>
        {label}
      </Text>
    </Pressable>
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
  pressed: { opacity: 0.9 },
  label: {
    fontFamily: font.poppinsMedium,
    fontSize: 14,
    lineHeight: 20,
    color: auth.btnText,
  },
});
