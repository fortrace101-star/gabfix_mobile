import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, space, text } from '@/theme';

import { Button } from './button';

type Props = {
  icon: LucideIcon;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
  actionLoading?: boolean;
};

/** P26 empty state: 160-high illustration, H3 title, 280-wide caption and one action. */
export function EmptyState({ icon: Icon, title, body, actionLabel, onAction, actionLoading }: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.illustration}>
        <View style={styles.illustrationInner}>
          <Icon size={56} color={colors.green500} strokeWidth={1.6} />
        </View>
      </View>
      <Text style={styles.title} maxFontSizeMultiplier={1.3}>
        {title}
      </Text>
      <Text style={styles.body} maxFontSizeMultiplier={1.3}>
        {body}
      </Text>
      {actionLabel && onAction ? (
        <Button
          label={actionLabel}
          onPress={onAction}
          loading={actionLoading}
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    paddingVertical: space[12],
    paddingHorizontal: space[6],
    gap: space[2],
  },
  illustration: {
    width: 160,
    height: 160,
    borderRadius: radius.pill,
    backgroundColor: colors.green50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space[1],
  },
  illustrationInner: {
    width: 96,
    height: 96,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...text.h3, textAlign: 'center' },
  body: { ...text.bodyM, color: colors.textMuted, textAlign: 'center', maxWidth: 280 },
  action: { marginTop: space[3], minWidth: 200 },
});
