import { router, type Href } from 'expo-router';
import {
  Bell,
  BellOff,
  CalendarCheck2,
  Check,
  Sparkles,
  WalletCards,
  type LucideIcon,
} from 'lucide-react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { TopBar } from '@/components/ui/top-bar';
import {
  markAllNotificationsRead,
  markNotificationRead,
  useNotifications,
  useNotificationsHydrated,
  useUnreadNotificationCount,
  type AppNotification,
  type NotificationKind,
} from '@/store/notifications';
import { colors, font, radius, shadow, space, text } from '@/theme';
import { selectionHaptic } from '@/utils/haptics';

const iconFor: Record<NotificationKind, LucideIcon> = {
  booking: CalendarCheck2,
  reminder: Sparkles,
  payment: WalletCards,
  system: Bell,
};

const isSameDay = (left: Date, right: Date): boolean =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

const timeLabel = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  if (isSameDay(date, now)) {
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(date, yesterday)) return 'Yesterday';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

function NotificationRow({ notification }: { notification: AppNotification }) {
  const Icon = iconFor[notification.kind];

  const open = () => {
    if (!notification.read) markNotificationRead(notification.id);
    if (notification.href) router.push(notification.href as Href);
  };

  const row = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${notification.title}. ${notification.body}. ${timeLabel(
        notification.createdAtISO,
      )}${notification.read ? '' : '. Unread'}`}
      onPress={open}
      style={[styles.row, !notification.read && styles.rowUnread]}>
      {!notification.read ? <View style={styles.unreadDot} /> : null}
      <View style={styles.iconTile}>
        <Icon size={20} color={colors.green500} strokeWidth={2} />
      </View>
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text style={styles.title} maxFontSizeMultiplier={1.3} numberOfLines={1}>
            {notification.title}
          </Text>
          <Text style={styles.time} maxFontSizeMultiplier={1.2}>
            {timeLabel(notification.createdAtISO)}
          </Text>
        </View>
        <Text style={styles.body} maxFontSizeMultiplier={1.3} numberOfLines={2}>
          {notification.body}
        </Text>
      </View>
    </Pressable>
  );

  if (notification.read) return row;

  return (
    <ReanimatedSwipeable
      friction={2}
      overshootRight={false}
      renderRightActions={() => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Mark ${notification.title} as read`}
          onPress={() => {
            selectionHaptic();
            markNotificationRead(notification.id);
          }}
          style={styles.swipeAction}>
          <Check size={20} color={colors.surface} strokeWidth={2.4} />
          <Text style={styles.swipeLabel} maxFontSizeMultiplier={1.2}>
            Read
          </Text>
        </Pressable>
      )}
      rightThreshold={40}>
      {row}
    </ReanimatedSwipeable>
  );
}

/** P27d Notifications. Local records until push/deep-link delivery is connected. */
export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const notifications = useNotifications();
  const hydrated = useNotificationsHydrated();
  const unread = useUnreadNotificationCount();

  const today: AppNotification[] = [];
  const earlier: AppNotification[] = [];
  const now = new Date();
  notifications.forEach((notification) => {
    const date = new Date(notification.createdAtISO);
    (isSameDay(date, now) ? today : earlier).push(notification);
  });

  const sections: { title: string; data: AppNotification[] }[] = [];
  if (today.length > 0) sections.push({ title: 'Today', data: today });
  if (earlier.length > 0) sections.push({ title: 'Earlier', data: earlier });

  return (
    <View style={styles.screen}>
      <TopBar
        title="Notifications"
        right={
          unread > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Mark all notifications as read"
              hitSlop={8}
              onPress={() => {
                selectionHaptic();
                markAllNotificationsRead();
              }}
              style={styles.markAll}>
              <Text style={styles.markAllText} maxFontSizeMultiplier={1.2}>
                Mark all read
              </Text>
            </Pressable>
          ) : null
        }
      />

      {!hydrated ? (
        <View style={styles.skeletonWrap}>
          {[0, 1, 2].map((item) => (
            <Skeleton key={item} style={styles.skeletonRow} />
          ))}
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + space[8] },
            sections.length === 0 && styles.emptyContent,
          ]}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.3}>
              {section.title}
            </Text>
          )}
          renderItem={({ item, index, section }) => (
            <View style={[styles.item, index === section.data.length - 1 && styles.itemLast]}>
              <NotificationRow notification={item} />
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              icon={BellOff}
              title="You're all caught up"
              body="Booking updates, reminders and payment receipts will appear here."
              actionLabel="Back to Home"
              onAction={() => router.replace('/(tabs)/home')}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: space[4], paddingTop: space[2] },
  emptyContent: { flexGrow: 1, justifyContent: 'center' },
  skeletonWrap: { padding: space[4], gap: space[3] },
  skeletonRow: { height: 82, borderRadius: radius.card },
  sectionTitle: {
    ...text.h3,
    fontSize: 15,
    marginTop: space[4],
    marginBottom: space[2],
  },
  item: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    overflow: 'hidden',
  },
  itemLast: {
    borderBottomLeftRadius: radius.card,
    borderBottomRightRadius: radius.card,
    marginBottom: space[2],
    ...shadow.card,
  },
  row: {
    minHeight: 82,
    padding: space[4],
    paddingLeft: space[5] + 4,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[3],
    backgroundColor: colors.surface,
  },
  rowUnread: { backgroundColor: colors.yellow50 },
  unreadDot: {
    position: 'absolute',
    left: space[3],
    top: space[4] + 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.yellow500,
  },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: radius.input,
    backgroundColor: colors.green50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1, gap: 3 },
  rowTop: { flexDirection: 'row', alignItems: 'baseline', gap: space[2] },
  title: { ...text.bodyM, fontFamily: font.bodySemi, flex: 1 },
  time: { ...text.caption, fontSize: 11, flexShrink: 0 },
  body: { ...text.caption, color: colors.textMuted, lineHeight: 18 },
  swipeAction: {
    width: 88,
    backgroundColor: colors.green500,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  swipeLabel: { ...text.caption, color: colors.surface, fontFamily: font.bodySemi },
  markAll: {
    minHeight: 44,
    paddingHorizontal: space[2],
    justifyContent: 'center',
  },
  markAllText: {
    ...text.caption,
    color: colors.green700,
    fontFamily: font.bodySemi,
  },
});
