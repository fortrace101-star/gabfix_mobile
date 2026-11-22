import { X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, space, text } from '@/theme';

import { KeyboardSheetBody } from './keyboard-sheet-body';

type Props = {
  visible: boolean;
  onDismiss: () => void;
  title?: string;
  subtitle?: string;
  /** Replaces the default title row. The drag handle is always drawn. */
  header?: ReactNode;
  /** Pinned below the scrolling body. */
  footer?: ReactNode;
  children: ReactNode;
  /** Backdrop, close button and Android back dismiss the sheet. Turn off while busy. */
  dismissible?: boolean;
  scrollable?: boolean;
  showClose?: boolean;
  /** The body scrolls once the sheet is taller than this share of the window. */
  maxHeightRatio?: number;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
};

/**
 * The one bottom-pinned drawer shell (S1 11.5): flush to the bottom edge, only the top
 * corners rounded, the safe-area inset added once inside the sheet, a scrolling body and
 * pinned header/footer. Keyboard handling lives in `KeyboardSheetBody`.
 */
export function BottomSheet({
  visible,
  onDismiss,
  title,
  subtitle,
  header,
  footer,
  children,
  dismissible = true,
  scrollable = true,
  showClose = true,
  maxHeightRatio = 0.85,
  contentContainerStyle,
  style,
}: Props) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const maxHeight = Math.min(
    Math.round(height * maxHeightRatio),
    height - insets.top - space[4],
  );
  const dismiss = () => {
    if (dismissible) onDismiss();
  };
  const hasHeader = Boolean(header ?? title);

  return (
    <Modal
      animationType="slide"
      navigationBarTranslucent
      onRequestClose={dismiss}
      statusBarTranslucent
      transparent
      visible={visible}>
      <View style={styles.backdrop}>
        <Pressable
          accessibilityLabel="Close"
          accessibilityRole="button"
          disabled={!dismissible}
          onPress={dismiss}
          style={StyleSheet.absoluteFill}
        />
        <View
          accessibilityViewIsModal
          style={[
            styles.sheet,
            { maxHeight, paddingBottom: insets.bottom + space[4] },
            style,
          ]}>
          <View accessibilityElementsHidden style={styles.handle} />

          {header ?? (hasHeader ? (
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text
                  accessibilityRole="header"
                  maxFontSizeMultiplier={1.3}
                  numberOfLines={2}
                  style={styles.title}>
                  {title}
                </Text>
                {subtitle ? (
                  <Text maxFontSizeMultiplier={1.2} style={styles.subtitle}>
                    {subtitle}
                  </Text>
                ) : null}
              </View>
              {showClose ? (
                <Pressable
                  accessibilityLabel="Close"
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={dismiss}
                  style={styles.close}>
                  <X size={22} color={colors.text} strokeWidth={2} />
                </Pressable>
              ) : null}
            </View>
          ) : showClose ? (
            <Pressable
              accessibilityLabel="Close"
              accessibilityRole="button"
              hitSlop={8}
              onPress={dismiss}
              style={styles.closeFloating}>
              <X size={22} color={colors.text} strokeWidth={2} />
            </Pressable>
          ) : null)}

          <KeyboardSheetBody
            contentContainerStyle={contentContainerStyle}
            footer={footer ? <View style={styles.footer}>{footer}</View> : null}
            scrollable={scrollable}>
            {children}
          </KeyboardSheetBody>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end' },
  sheet: {
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    overflow: 'hidden',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginTop: space[2],
    marginBottom: space[2],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[3],
    paddingHorizontal: space[4],
    paddingBottom: space[1],
  },
  headerText: { flex: 1, gap: 2 },
  title: { ...text.h2 },
  subtitle: { ...text.caption },
  close: { width: 44, height: 44, alignItems: 'flex-end', justifyContent: 'center' },
  closeFloating: { position: 'absolute', right: space[3], top: space[2], zIndex: 1 },
  footer: { paddingHorizontal: space[4], paddingTop: space[3] },
});
