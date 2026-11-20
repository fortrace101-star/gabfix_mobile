import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
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

type ContactContext = { bookingId?: string };

type ContactRow = {
  key: string;
  label: string;
  caption: string;
  icon: LucideIcon;
  href?: string;
  route?: string;
  copyValue?: string;
  copyLabel?: string;
};

const copyText = async (value: string, label: string) => {
  try {
    await Clipboard.setStringAsync(value);
    Alert.alert('Copied', `${label} copied.`);
  } catch {
    Alert.alert('Could not copy', 'Please try again.');
  }
};

const openLink = async (url: string, copyValue?: string, copyLabel?: string) => {
  try {
    await Linking.openURL(url);
  } catch {
    if (copyValue && copyLabel) {
      Alert.alert(`Couldn't open this`, `Copy ${copyLabel} instead?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: `Copy ${copyLabel}`, onPress: () => void copyText(copyValue, copyLabel) },
      ]);
      return;
    }
    Alert.alert('Could not open', 'Please try another contact option or try again.');
  }
};

const buildRows = (context?: ContactContext): ContactRow[] => {
  const bookingId = context?.bookingId?.trim();
  const whatsappMessage = bookingId
    ? `Hello Gabfix, I need help with booking ${bookingId}.`
    : 'Hello Gabfix, I need help with my account.';
  const emailSubject = bookingId ? `Help with booking ${bookingId}` : 'Gabfix support';

  const rows: ContactRow[] = [];

  if (support.phone) {
    rows.push({
      key: 'call',
      label: 'Call',
      caption: support.phone.display,
      icon: Phone,
      href: support.phone.href,
      copyValue: support.phone.display,
      copyLabel: 'the number',
    });
  }

  if (support.whatsapp) {
    rows.push({
      key: 'whatsapp',
      label: 'WhatsApp',
      caption: 'Chat with us on WhatsApp',
      icon: MessageCircle,
      href: support.whatsapp.url(whatsappMessage),
      copyValue: support.whatsapp.display,
      copyLabel: 'the number',
    });
  }

  rows.push({
    key: 'chat',
    label: 'Chat',
    caption: 'Message the support team',
    icon: MessagesSquare,
    route: '/chat/support',
  });

  rows.push({
    key: 'email',
    label: 'Email',
    caption: support.email,
    icon: Mail,
    href: support.mailto(emailSubject),
    copyValue: support.email,
    copyLabel: 'our email',
  });

  return rows;
};

/** P22 contact card, shared by the help centre and contact screens. */
export function ContactOptions({
  heading = 'Contact us',
  context,
}: {
  heading?: string;
  context?: ContactContext;
}) {
  const rows = buildRows(context);

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
            if (row.route) {
              router.push(row.route as never);
              return;
            }
            if (row.href) void openLink(row.href, row.copyValue, row.copyLabel);
          };
          const onLongPress =
            row.copyValue && row.copyLabel
              ? () => void copyText(row.copyValue!, row.copyLabel!)
              : undefined;

          return (
            <Pressable
              key={row.key}
              accessibilityRole={row.href ? 'link' : 'button'}
              accessibilityLabel={`${row.label}: ${row.caption}`}
              accessibilityHint={row.copyValue ? 'Long press to copy' : undefined}
              onPress={onPress}
              onLongPress={onLongPress}
              delayLongPress={350}
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
              <ChevronRight size={18} color={colors.textMuted} strokeWidth={2} />
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
