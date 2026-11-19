import { router } from 'expo-router';
import { CalendarDays, ChevronRight, MapPin, Repeat } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  type GestureResponderEvent,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SegmentedControl } from '@/components/booking/segmented-control';
import { slotLabel } from '@/components/booking/slot-chips';
import { Button } from '@/components/ui/button';
import { buildRebookDraft } from '@/lib/rebook';
import { startRebookDraft } from '@/store/booking';
import { type BookingStatus, type SavedBooking, useBookings, useBookingsHydrated } from '@/store/bookings';
import { colors, font, radius, shadow, space, text } from '@/theme';
import { ugx } from '@/utils/format';

const TABS = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
] as const;

const statusLabel: Record<BookingStatus, string> = {
  upcoming: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const statusTone: Record<BookingStatus, { bg: string; fg: string }> = {
  upcoming: { bg: '#E8F5EC', fg: colors.green700 },
  completed: { bg: '#EEF2FF', fg: '#3730A3' },
  cancelled: { bg: '#FEE2E2', fg: colors.error },
};

const parseISODate = (iso: string): Date => {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const whenLabel = (booking: SavedBooking): string => {
  if (!booking.dateISO) return 'Time to confirm';
  const date = parseISODate(booking.dateISO).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  return booking.startTime ? `${date} · ${slotLabel(booking.startTime)}` : date;
};

const whereLabel = (booking: SavedBooking): string =>
  [booking.area, booking.street].filter(Boolean).join(' · ') || 'Address to confirm';

function StatusChip({ status }: { status: BookingStatus }) {
  const tone = statusTone[status];
  return (
    <View style={[styles.chip, { backgroundColor: tone.bg }]}>
      <Text style={[styles.chipText, { color: tone.fg }]} maxFontSizeMultiplier={1.2}>
        {statusLabel[status]}
      </Text>
    </View>
  );
}

function BookingCard({ booking }: { booking: SavedBooking }) {
  const open = () => router.push(`/booking/${booking.id}` as never);
  const bookAgain = (event: GestureResponderEvent) => {
    event.stopPropagation();
    startRebookDraft(buildRebookDraft(booking));
    router.push({ pathname: '/book/[slug]/schedule', params: { slug: booking.serviceSlug } });
  };
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open booking ${booking.id}`}
      onPress={open}
      style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardTitleWrap}>
          <Text style={styles.cardTitle} maxFontSizeMultiplier={1.3} numberOfLines={1}>
            {booking.serviceName}
          </Text>
          <Text style={styles.cardId} maxFontSizeMultiplier={1.2}>
            {booking.id}
          </Text>
        </View>
        <StatusChip status={booking.status} />
      </View>

      <View style={styles.metaRow}>
        <CalendarDays size={16} color={colors.textMuted} strokeWidth={2} />
        <Text style={styles.metaText} maxFontSizeMultiplier={1.2} numberOfLines={1}>
          {whenLabel(booking)}
        </Text>
      </View>
      <View style={styles.metaRow}>
        <MapPin size={16} color={colors.textMuted} strokeWidth={2} />
        <Text style={styles.metaText} maxFontSizeMultiplier={1.2} numberOfLines={1}>
          {whereLabel(booking)}
        </Text>
      </View>

      <View style={styles.cardFooter}>
        <View>
          <Text style={styles.amountLabel} maxFontSizeMultiplier={1.2}>
            {booking.balance > 0 ? 'Balance due' : 'Total paid'}
          </Text>
          <Text style={styles.amountValue} maxFontSizeMultiplier={1.3}>
            {ugx(booking.balance > 0 ? booking.balance : booking.total)}
          </Text>
        </View>
        <View style={styles.cardActions}>
          {booking.status !== 'upcoming' ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Book ${booking.serviceName} again`}
              hitSlop={8}
              onPress={bookAgain}
              style={styles.rebookButton}>
              <Repeat size={16} color={colors.green700} strokeWidth={2} />
              <Text style={styles.rebookText} maxFontSizeMultiplier={1.2}>
                Book again
              </Text>
            </Pressable>
          ) : null}
          <View style={styles.detailsLink}>
            <Text style={styles.detailsText} maxFontSizeMultiplier={1.2}>
              Details
            </Text>
            <ChevronRight size={18} color={colors.green700} strokeWidth={2} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function EmptyState({ tab }: { tab: BookingStatus }) {
  if (tab === 'upcoming') {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle} maxFontSizeMultiplier={1.3}>
          No upcoming bookings
        </Text>
        <Text style={styles.emptyBody} maxFontSizeMultiplier={1.3}>
          When you book a service, it will appear here so you can track and manage it.
        </Text>
        <Button label="Browse services" onPress={() => router.push('/(tabs)/services')} />
      </View>
    );
  }
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle} maxFontSizeMultiplier={1.3}>
        {tab === 'completed' ? 'No completed bookings yet' : 'No cancelled bookings'}
      </Text>
      <Text style={styles.emptyBody} maxFontSizeMultiplier={1.3}>
        {tab === 'completed'
          ? 'Bookings you finish will show up here.'
          : 'Bookings you cancel will show up here.'}
      </Text>
    </View>
  );
}

/** P15a Bookings list: Upcoming / Completed / Cancelled (local records). */
export default function BookingsScreen() {
  const bookings = useBookings();
  const hydrated = useBookingsHydrated();
  const [tab, setTab] = useState<BookingStatus>('upcoming');

  const filtered = useMemo(
    () => bookings.filter((booking) => booking.status === tab),
    [bookings, tab],
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title} maxFontSizeMultiplier={1.3}>
          Bookings
        </Text>
      </View>
      <View style={styles.tabsWrap}>
        <SegmentedControl options={TABS} value={tab} onChange={setTab} />
      </View>
      <FlatList
        data={hydrated ? filtered : []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <BookingCard booking={item} />}
        contentContainerStyle={[styles.listContent, filtered.length === 0 && styles.listEmpty]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={hydrated ? <EmptyState tab={tab} /> : undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: space[4], paddingTop: space[2], paddingBottom: space[3] },
  title: { ...text.h2, color: colors.text },
  tabsWrap: { paddingHorizontal: space[4], marginBottom: space[3] },
  listContent: { paddingHorizontal: space[4], paddingBottom: 140, gap: space[3] },
  listEmpty: { flexGrow: 1, justifyContent: 'center' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: space[4],
    gap: space[2],
    ...shadow.card,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: space[2] },
  cardTitleWrap: { flex: 1, gap: 2 },
  cardTitle: { ...text.h3, color: colors.text },
  cardId: { ...text.caption, color: colors.textMuted },
  chip: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 6 },
  chipText: { fontSize: 12, fontFamily: font.bodySemi },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { ...text.bodyM, color: colors.textMuted, flex: 1 },
  cardFooter: {
    marginTop: space[1],
    paddingTop: space[2],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amountLabel: { ...text.caption, color: colors.textMuted },
  amountValue: { ...text.h3, color: colors.text },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  rebookButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rebookText: { ...text.caption, color: colors.green700, fontFamily: font.bodySemi },
  detailsLink: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  detailsText: { ...text.bodyM, color: colors.green700, fontFamily: font.bodySemi },
  empty: { alignItems: 'center', paddingHorizontal: space[6], gap: space[2] },
  emptyTitle: { ...text.h3, color: colors.text, textAlign: 'center' },
  emptyBody: { ...text.bodyM, color: colors.textMuted, textAlign: 'center', marginBottom: space[2] },
});
