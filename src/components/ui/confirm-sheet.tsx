import { ShieldAlert, type LucideIcon } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, space, text } from '@/theme';

import { BottomSheet } from './bottom-sheet';
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
  /** Cancel button action when it differs from dismissing the sheet. */
  onCancel?: () => void;
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
  onCancel,
  onClose,
}: Props) {
  return (
    <BottomSheet
      visible={visible}
      onDismiss={onClose}
      dismissible={!busy}
      contentContainerStyle={[styles.content, compact && styles.contentCompact]}>
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
            onPress={onCancel ?? onClose}
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
          <Button label={cancelLabel} variant="ghost" disabled={busy} onPress={onCancel ?? onClose} />
        </>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space[4], paddingTop: space[3], gap: space[3] },
  contentCompact: { paddingTop: space[1], gap: space[2], paddingBottom: space[5] },
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
