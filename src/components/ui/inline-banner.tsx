import { AlertTriangle, CheckCircle2, Info, X, type LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, font, radius, space, text } from '@/theme';

export type BannerVariant = 'success' | 'warning' | 'error' | 'info';

type Props = {
  variant?: BannerVariant;
  message: string;
  title?: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  /** Less padding for inline use inside a card. */
  compact?: boolean;
};

const defaults: Record<BannerVariant, { bg: string; fg: string; icon: LucideIcon }> = {
  success: { bg: colors.successBg, fg: colors.green700, icon: CheckCircle2 },
  warning: { bg: colors.warningBg, fg: colors.warning, icon: AlertTriangle },
  error: { bg: colors.errorBg, fg: colors.error, icon: AlertTriangle },
  info: { bg: colors.infoBg, fg: colors.info, icon: Info },
};

/** Toast-style inline message used by P8b, P28 and the upload status rows. */
export function InlineBanner({
  variant = 'info',
  message,
  title,
  icon,
  actionLabel,
  onAction,
  onDismiss,
  compact = false,
}: Props) {
  const theme = defaults[variant];
  const Icon = icon ?? theme.icon;

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.root, { backgroundColor: theme.bg }, compact && styles.compact]}>
      <Icon size={18} color={theme.fg} strokeWidth={2} />
      <View style={styles.body}>
        {title ? (
          <Text style={styles.title} maxFontSizeMultiplier={1.3}>
            {title}
          </Text>
        ) : null}
        <Text style={styles.message} maxFontSizeMultiplier={1.3}>
          {message}
        </Text>
        {actionLabel && onAction ? (
          <Pressable
            accessibilityRole="button"
            onPress={onAction}
            hitSlop={8}
            style={styles.action}>
            <Text style={[styles.actionText, { color: theme.fg }]} maxFontSizeMultiplier={1.2}>
              {actionLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {onDismiss ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss message"
          hitSlop={8}
          onPress={onDismiss}>
          <X size={16} color={colors.textMuted} strokeWidth={2} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[2],
    padding: space[3],
    borderRadius: radius.input,
  },
  compact: { padding: space[2] },
  body: { flex: 1, gap: 3 },
  title: { ...text.bodyM, fontFamily: font.bodySemi, color: colors.text },
  message: { ...text.caption, color: colors.text, lineHeight: 18 },
  action: { alignSelf: 'flex-start', minHeight: 32, justifyContent: 'center' },
  actionText: { ...text.caption, fontFamily: font.bodySemi },
});
