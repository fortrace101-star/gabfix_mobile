import {
  ChevronRight,
  Clock3,
  Mail,
  MessageCircle,
  MessagesSquare,
  Phone,
  type LucideIcon,
} from 'lucide-react-native';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { support } from '@/config/help';
import { base, colors, font, radius, space, text } from '@/theme';

type ContactRow = {
  key: string;
  label: string;
  caption: string;
  icon: LucideIcon;
  href?: string;
  soon?: boolean;
};

const rows: readonly ContactRow[] = [
  {
    key: 'call',
    label: 'Call',
    caption: support.phoneDisplay,
    icon: Phone,
    href: support.phoneHref,
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    caption: 'Message the support team',
    icon: MessageCircle,
    href: support.whatsappUrl,
  },
  {
    key: 'chat',
    label: 'Chat',
    caption: 'In-app chat is coming soon',
    icon: MessagesSquare,
    soon: true,
  },
  {
    key: 'email',
    label: 'Email',
    caption: support.email,
    icon: Mail,
    href: support.emailHref,
  },
];

const openLink = async (url: string) => {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Could not open', 'Please try another contact option or try again.');
  }
};

/** P22 contact card, shared by the help centre and contact screens. */
export function ContactOptions({ heading = 'Contact us' }: { heading?: string }) {
  return (
    <View style={[base.card, styles.card]}>
      <View style={styles.headingRow}>
        <Text style={styles.heading} maxFontSizeMultiplier={1.3}>
          {heading}
        </Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText} maxFontSizeMultiplier={1.2}>
            7 DAYS
          </Text>
        </View>
      </View>

      <View style={styles.rows}>
        {rows.map((row, index) => {
          const Icon = row.icon;
          const onPress = () => {
            if (row.href) {
              void openLink(row.href);
              return;
            }
            Alert.alert(
              'In-app chat is coming soon',
              'For now, call, WhatsApp or email the support team and we will help you there.',
            );
          };

          return (
            <Pressable
              key={row.key}
              accessibilityRole={row.href ? 'link' : 'button'}
              accessibilityLabel={`${row.label}: ${row.caption}`}
              onPress={onPress}
              style={({ pressed }) => [
                styles.row,
                index > 0 && styles.divider,
                pressed && styles.pressed,
              ]}>
              <View style={styles.iconTile}>
                <Icon size={20} color={colors.green700} strokeWidth={2} />
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.rowLabel} maxFontSizeMultiplier={1.3}>
                  {row.label}
                </Text>
                <Text style={styles.rowCaption} maxFontSizeMultiplier={1.3} numberOfLines={1}>
                  {row.caption}
                </Text>
              </View>
              {row.soon ? (
                <View style={styles.soonBadge}>
                  <Text style={styles.soonText} maxFontSizeMultiplier={1.2}>
                    SOON
                  </Text>
                </View>
              ) : (
                <ChevronRight size={18} color={colors.textMuted} strokeWidth={2} />
              )}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.hours}>
        <Clock3 size={14} color={colors.green700} strokeWidth={2} />
        <Text style={styles.hoursText} maxFontSizeMultiplier={1.2}>
          {support.hours}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 0, overflow: 'hidden' },
  headingRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[2],
    paddingHorizontal: space[4],
  },
  heading: { ...text.h3 },
  badge: {
    height: 24,
    borderRadius: radius.pill,
    paddingHorizontal: space[2],
    backgroundColor: colors.green50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: font.bodySemi,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.8,
    color: colors.green700,
  },
  rows: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    paddingHorizontal: space[4],
    paddingVertical: space[2],
  },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  pressed: { backgroundColor: colors.green50 },
  iconTile: {
    width: 36,
    height: 36,
    borderRadius: radius.tile,
    backgroundColor: colors.green50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1, gap: 1 },
  rowLabel: { ...text.bodyM, fontFamily: font.bodySemi },
  rowCaption: { ...text.caption },
  soonBadge: {
    height: 22,
    borderRadius: radius.pill,
    paddingHorizontal: space[2],
    backgroundColor: colors.yellow50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soonText: {
    fontFamily: font.bodySemi,
    fontSize: 9,
    lineHeight: 13,
    letterSpacing: 0.7,
    color: colors.yellow800,
  },
  hours: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingHorizontal: space[4],
    backgroundColor: colors.bg,
  },
  hoursText: {
    ...text.caption,
    color: colors.green700,
    fontFamily: font.bodySemi,
  },
});
