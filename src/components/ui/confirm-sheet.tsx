import { ShieldAlert, X, type LucideIcon } from 'lucide-react-native';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, space, text } from '@/theme';

import { Button } from './button';

type Props = {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** Optional third action, e.g. "Discard". Stacks by default; see `compact`. */
  extraLabel?: string;
  onExtra?: () => void;
  /** Tighter sheet with the extra and cancel actions side by side under the confirm button. */
  compact?: boolean;
  destructive?: boolean;
  busy?: boolean;
  icon?: LucideIcon;
  onConfirm: () => void;
  onClose: () => void;
};

/** Shared confirmation drawer (delete account, sign out device, turn off 2FA). */
export function ConfirmSheet({
  visible,
  title,
  body,
  confirmLabel,
  cancelLabel = 'Cancel',
  extraLabel,
  onExtra,
  compact = false,
  destructive = true,
  busy = false,
  icon: Icon = ShieldAlert,
  onConfirm,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={cancelLabel}
          onPress={busy ? undefined : onClose}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            styles.sheet,
            compact && styles.sheetCompact,
            { paddingBottom: Math.max(insets.bottom, space[6]) },
          ]}
        >
          <View style={styles.handle} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            hitSlop={8}
            onPress={onClose}
            style={styles.close}>
            <X size={22} color={colors.text} strokeWidth={2} />
          </Pressable>
          <View style={[styles.icon, destructive && styles.iconDanger, compact && styles.iconCompact]}>
            <Icon size={26} color={destructive ? colors.error : colors.green500} strokeWidth={2} />
          </View>
          <Text style={styles.title} maxFontSizeMultiplier={1.3}>
            {title}
          </Text>
          <Text style={styles.body} maxFontSizeMultiplier={1.3}>
            {body}
          </Text>
          <Button
            label={confirmLabel}
            variant={destructive ? 'destructive' : 'primary'}
            loading={busy}
            onPress={onConfirm}
          />
          {compact ? (
            <View style={styles.actionsRow}>
              <Button
                label={cancelLabel}
                variant="ghost"
                disabled={busy}
                onPress={onClose}
                style={styles.rowButton}
              />
              {extraLabel && onExtra ? (
                <Button
                  label={extraLabel}
                  variant="dangerGhost"
                  disabled={busy}
                  onPress={onExtra}
                  style={styles.rowButton}
                />
              ) : null}
            </View>
          ) : (
            <>
              {extraLabel && onExtra ? (
                <Button label={extraLabel} variant="dangerGhost" disabled={busy} onPress={onExtra} />
              ) : null}
              <Button label={cancelLabel} variant="ghost" disabled={busy} onPress={onClose} />
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: space[4],
    paddingTop: space[2],
    gap: space[3],
  },
  sheetCompact: { paddingTop: space[1], gap: space[2] },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: space[2],
  },
  close: { position: 'absolute', right: space[4], top: space[3], zIndex: 1 },
  icon: {
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.green50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconDanger: { backgroundColor: colors.errorBg },
  iconCompact: { width: 44, height: 44 },
  actionsRow: { flexDirection: 'row', gap: space[3] },
  rowButton: { flex: 1 },
  title: { ...text.h2, textAlign: 'center' },
  body: { ...text.bodyM, color: colors.textMuted, textAlign: 'center' },
});
