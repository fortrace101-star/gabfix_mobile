import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

type Props = {
  children: ReactNode;
  /** Pinned below the scrolling area, for the sheet's primary action. */
  footer?: ReactNode;
  scrollable?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
};

/**
 * Scroll body for content inside a `Modal` (S1 12.2). A modal is its own window, so it
 * needs its own keyboard wrapper rather than the screen-level `KeyboardScreen`.
 * The safe-area bottom inset stays on the sheet itself and is added once.
 */
export function KeyboardSheetBody({
  children,
  footer,
  scrollable = true,
  contentContainerStyle,
  style,
}: Props) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.root, style]}>
      {scrollable ? (
        <ScrollView
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          contentContainerStyle={contentContainerStyle}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.body}>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.body, contentContainerStyle]}>{children}</View>
      )}
      {footer}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flexShrink: 1 },
  body: { flexShrink: 1 },
});
