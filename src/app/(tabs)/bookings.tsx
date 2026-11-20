import { router } from 'expo-router';
import {
  CalendarDays,
  CalendarX2,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  MapPin,
  Navigation,
  Repeat,
} from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import {
  type GestureResponderEvent,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { QuoteRequestCard } from '@/components/booking/quote-request-card';
import { SegmentedControl } from '@/components/booking/segmented-control';
import { slotLabel } from '@/components/booking/slot-chips';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { buildRebookDraft } from '@/lib/rebook';
import { startRebookDraft } from '@/store/booking';
import {
  type BookingStatus,
  type SavedBooking,
  hydrateBookings,
  useBookings,
  useBookingsHydrated,
} from '@/store/bookings';
import { hydrateQuotes, useQuoteRequests, useQuotesHydrated } from '@/store/quotes';
import { colors, font, radius, shadow, space, text } from '@/theme';
import { ugx } from '@/utils/format';

const TABS = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'requests', label: 'Requests' },
] as const;

type BookingsTab = (typeof TABS)[number]['value'];

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
  const track = (event: GestureResponderEvent) => {
    event.stopPropagation();
    router.push(`/booking/${booking.id}/track` as never);
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
          {booking.status === 'upcoming' ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Track booking ${booking.id}`}
              hitSlop={8}
              onPress={track}
              style={styles.trackButton}>
              <Navigation size={14} color={colors.surface} strokeWidth={2.2} />
              <Text style={styles.trackText} maxFontSizeMultiplier={1.2}>
                Track
              </Text>
            </Pressable>
          ) : null}
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

function RequestsEmpty() {
  return (
    <EmptyState
      icon={ClipboardList}
      title="No quote requests yet"
      body="Tell us about office, school or specialised work and we'll send a fixed price before you book."
      actionLabel="Request a quote"
      onAction={() =>
        router.push({ pathname: '/quote/[slug]', params: { slug: 'custom' } } as never)
      }
    />
  );
}

function BookingsEmpty({ tab }: { tab: BookingStatus }) {
  if (tab === 'upcoming') {
    return (
      <EmptyState
        icon={CalendarDays}
        title="No upcoming bookings"
        body="When you book a service, it will appear here so you can track and manage it."
        actionLabel="Browse services"
        onAction={() => router.push('/(tabs)/services')}
      />
    );
  }

  return (
    <EmptyState
      icon={tab === 'completed' ? CheckCircle2 : CalendarX2}
      title={tab === 'completed' ? 'No completed bookings yet' : 'No cancelled bookings'}
      body={
        tab === 'completed'
          ? 'Bookings you finish will show up here.'
          : 'Bookings you cancel will show up here.'
      }
    />
  );
}

function BookingsSkeleton() {
  return (
    <View style={styles.skeletonList} accessibilityLabel="Loading bookings">
      {Array.from({ length: 3 }, (_, index) => (
        <View key={index} style={styles.skeletonCard}>
          <View style={styles.skeletonTop}>
            <Skeleton style={styles.skeletonTitle} />
            <Skeleton style={styles.skeletonChip} />
          </View>
          <Skeleton style={styles.skeletonMeta} />
          <Skeleton style={styles.skeletonMetaShort} />
          <Skeleton style={styles.skeletonFooter} />
        </View>
      ))}
    </View>
  );
}

/** P15a Bookings list: Upcoming / Completed / Cancelled (local records). */
export default function BookingsScreen() {
  const bookings = useBookings();
  const hydrated = useBookingsHydrated();
  const requests = useQuoteRequests();
  const requestsHydrated = useQuotesHydrated();
  const [tab, setTab] = useState<BookingsTab>('upcoming');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([hydrateBookings(), hydrateQuotes()]);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const refreshControl = (
    <RefreshControl
      colors={[colors.green500]}
      onRefresh={onRefresh}
      refreshing={refreshing}
      tintColor={colors.green500}
    />
  );

  const filtered = useMemo(
    () =>
      tab === 'requests'
        ? []
        : bookings.filter((booking) => booking.status === tab),
    [bookings, tab],
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title} maxFontSizeMultiplier={1.3}>
          Bookings
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open recurring plans"
          hitSlop={8}
          onPress={() => router.push('/booking/plans')}
          style={styles.plansLink}>
          <Repeat size={16} color={colors.green700} strokeWidth={2} />
          <Text style={styles.plansLinkText} maxFontSizeMultiplier={1.2}>
            Plans
          </Text>
        </Pressable>
      </View>
      <View style={styles.tabsWrap}>
        <SegmentedControl options={TABS} value={tab} onChange={setTab} />
      </View>
      {tab === 'requests' ? (
        <FlatList
          data={requestsHydrated ? requests : []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <QuoteRequestCard request={item} />}
          contentContainerStyle={[
            styles.listContent,
            requests.length === 0 && styles.listEmpty,
          ]}
          refreshControl={refreshControl}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={requestsHydrated ? <RequestsEmpty /> : <BookingsSkeleton />}
        />
      ) : (
        <FlatList
          data={hydrated ? filtered : []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <BookingCard booking={item} />}
          contentContainerStyle={[styles.listContent, filtered.length === 0 && styles.listEmpty]}
          refreshControl={refreshControl}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={hydrated ? <BookingsEmpty tab={tab} /> : <BookingsSkeleton />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: space[4],
    paddingTop: space[2],
    paddingBottom: space[3],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { ...text.h2, color: colors.text },
  plansLink: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 40 },
  plansLinkText: { ...text.bodyM, color: colors.green700, fontFamily: font.bodySemi },
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
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.green500,
    paddingHorizontal: 10,
  },
  trackText: {
    ...text.caption,
    fontSize: 12,
    color: colors.surface,
    fontFamily: font.bodySemi,
  },
  rebookButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rebookText: { ...text.caption, color: colors.green700, fontFamily: font.bodySemi },
  detailsLink: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  detailsText: { ...text.bodyM, color: colors.green700, fontFamily: font.bodySemi },
  skeletonList: { gap: space[3] },
  skeletonCard: { backgroundColor: colors.surface, borderRadius: radius.card, padding: space[4], gap: space[3] },
  skeletonTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  skeletonTitle: { width: '46%', height: 20, borderRadius: radius.input },
  skeletonChip: { width: 72, height: 24, borderRadius: radius.pill },
  skeletonMeta: { width: '76%', height: 16, borderRadius: radius.input },
  skeletonMetaShort: { width: '58%', height: 16, borderRadius: radius.input },
  skeletonFooter: { width: '100%', height: 48, borderRadius: radius.input, marginTop: space[1] },
});
