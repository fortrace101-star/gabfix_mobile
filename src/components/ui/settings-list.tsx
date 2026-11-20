import { ChevronRight, Lock, type LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { base, colors, font, radius, space, text } from '@/theme';

/** Grouped settings list extracted from Profile so Security, Notifications and Devices match. */

export function SettingsGroup({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <View style={styles.group}>
      {title ? (
        <Text style={styles.groupTitle} maxFontSizeMultiplier={1.2}>
          {title}
        </Text>
      ) : null}
      <View style={styles.groupCard}>{children}</View>
    </View>
  );
}

export type SettingsRowProps = {
  icon?: LucideIcon;
  label: string;
  value?: string;
  caption?: string;
  onPress?: () => void;
  destructive?: boolean;
  last?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  /** Static value with a lock, for rows that cannot be switched off. */
  lockedLabel?: string;
  accessibilityHint?: string;
  disabled?: boolean;
};

export function SettingsRow({
  icon: Icon,
  label,
  value,
  caption,
  onPress,
  destructive = false,
  last = false,
  switchValue,
  onSwitchChange,
  lockedLabel,
  accessibilityHint,
  disabled = false,
}: SettingsRowProps) {
  const body = (
    <>
      {Icon ? (
        <View style={[styles.iconTile, destructive && styles.iconTileDestructive]}>
          <Icon size={20} color={destructive ? colors.error : colors.green500} strokeWidth={2} />
        </View>
      ) : null}
      <View style={styles.rowBody}>
        <Text
          style={[styles.rowLabel, destructive && styles.rowLabelDestructive, disabled && styles.rowDisabled]}
          maxFontSizeMultiplier={1.3}>
          {label}
        </Text>
        {caption ? (
          <Text style={styles.rowCaption} maxFontSizeMultiplier={1.2}>
            {caption}
          </Text>
        ) : null}
        {value ? (
          <Text style={styles.rowValue} maxFontSizeMultiplier={1.2} numberOfLines={2}>
            {value}
          </Text>
        ) : null}
      </View>
      {lockedLabel ? (
        <View style={styles.locked}>
          <Lock size={14} color={colors.textMuted} strokeWidth={2} />
          <Text style={styles.lockedText} maxFontSizeMultiplier={1.2}>
            {lockedLabel}
          </Text>
        </View>
      ) : onSwitchChange && typeof switchValue === 'boolean' ? (
        <Switch
          accessibilityLabel={label}
          accessibilityHint={accessibilityHint}
          value={switchValue}
          onValueChange={onSwitchChange}
          disabled={disabled}
          trackColor={{ false: colors.border, true: colors.green500 }}
          thumbColor={colors.surface}
          ios_backgroundColor={colors.border}
        />
      ) : onPress ? (
        <ChevronRight size={18} color={colors.textMuted} strokeWidth={2} />
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={value ? `${label}. ${value}` : label}
        accessibilityHint={accessibilityHint}
        disabled={disabled}
        onPress={onPress}
        style={[styles.row, !last && styles.rowDivider, disabled && styles.rowPressedDisabled]}>
        {body}
      </Pressable>
    );
  }

  return (
    <View
      accessible
      accessibilityLabel={[label, lockedLabel ?? value ?? caption].filter(Boolean).join('. ')}
      style={[styles.row, !last && styles.rowDivider]}>
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: space[2] },
  groupTitle: {
    ...text.caption,
    fontFamily: font.bodySemi,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.textMuted,
    marginLeft: space[1],
  },
  groupCard: { ...base.card, padding: 0, overflow: 'hidden' },
  row: {
    minHeight: 56,
    paddingHorizontal: space[4],
    paddingVertical: space[2] + 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
  },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  rowPressedDisabled: { opacity: 0.6 },
  iconTile: {
    width: 36,
    height: 36,
    borderRadius: radius.input,
    backgroundColor: colors.green50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconTileDestructive: { backgroundColor: colors.errorBg },
  rowBody: { flex: 1, gap: 1 },
  rowLabel: { ...text.bodyM, fontFamily: font.bodySemi, color: colors.text },
  rowLabelDestructive: { color: colors.error },
  rowDisabled: { color: colors.disabledText },
  rowCaption: { ...text.caption, color: colors.textMuted, lineHeight: 17 },
  rowValue: { ...text.caption },
  locked: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  lockedText: { ...text.caption, color: colors.textMuted },
});
