import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

type Props = {
  children: ReactNode;
  /** Pinned below the scroll area, for a sticky action bar. */
  footer?: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  /** Gap kept between the focused field and the keyboard (S1 12.2). */
  bottomOffset?: number;
};

/**
 * Replaces the per-screen `KeyboardAvoidingView` + `ScrollView` pairs (S1 12.2).
 * The focused field is scrolled clear of the keyboard with a 24 dp gap, taps stay
 * live while the keyboard is open and dragging dismisses it.
 */
export function KeyboardScreen({
  children,
  footer,
  contentContainerStyle,
  style,
  bottomOffset = 24,
}: Props) {
  return (
    <View style={[styles.root, style]}>
      <KeyboardAwareScrollView
        bottomOffset={bottomOffset}
        contentContainerStyle={contentContainerStyle}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.body}>
        {children}
      </KeyboardAwareScrollView>
      {footer}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { flex: 1 },
});
