import type { ReactNode } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Chat layout for S1 12.2. The message list flexes and the composer is the last child,
 * so the bar follows the keyboard on both platforms while the list shrinks and the last
 * message stays visible. The bar keeps its own safe-area bottom padding.
 */
export function StickyComposer({ children, style }: Props) {
  return (
    <KeyboardAvoidingView behavior="padding" style={[styles.root, style]}>
      {children}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
