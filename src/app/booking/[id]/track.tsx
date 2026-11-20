import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, MapPin, MessageCircle, Phone, ShieldCheck } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { TrackingMap } from '@/components/booking/tracking-map';
import { EmptyState } from '@/components/ui/empty-state';
import { TopBar } from '@/components/ui/top-bar';
import { cleaners, type Cleaner } from '@/config/cleaners';
import { useLiveTracking } from '@/hooks/use-live-tracking';
import type { TrackingPhase } from '@/lib/tracking';
import { getBookingById, useBookings } from '@/store/bookings';
import { colors, font, radius, shadow, space, text } from '@/theme';

const STEPS = ['Confirmed', 'On the way', 'In progress', 'Completed'] as const;

const initialsFor = (name: string): string =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

function Timeline({ phase }: { phase: TrackingPhase }) {
  return (
    <View style={styles.timeline} accessibilityLabel={`Booking progress: ${STEPS[phase]}`}>
      <View style={styles.timelineLine} />
      {STEPS.map((step, index) => {
        const complete = index < phase;
        const active = index === phase;
        return (
          <View key={step} style={styles.timelineStep}>
            <View
              style={[
                styles.timelineDot,
                complete && styles.timelineDotComplete,
                active && styles.timelineDotActive,
              ]}>
              {complete ? <View style={styles.timelineDotInner} /> : null}
            </View>
            <Text
              style={[
                styles.timelineLabel,
                (complete || active) && styles.timelineLabelActive,
              ]}
              maxFontSizeMultiplier={1.1}
              numberOfLines={2}>
              {step}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function CleanerRow({
  cleaner,
  name,
  initials,
  phone,
  onChat,
}: {
  cleaner?: Cleaner;
  name?: string;
  initials?: string;
  phone?: string;
  onChat: () => void;
}) {
  const assigned = Boolean(cleaner || name);
  const displayName = cleaner?.name ?? name ?? 'Matching your cleaner';
  const displayInitials = cleaner?.initials ?? initials ?? 'GF';

  const call = async () => {
    if (!phone) {
      Alert.alert(
        'Call cleaner',
        'Calling will be available when cleaner contact details are connected to this build.',
      );
      return;
    }
    const url = `tel:${phone}`;
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert('Call cleaner', 'Calling is not available on this device.');
      return;
    }
    await Linking.openURL(url);
  };

  return (
    <View style={styles.cleanerRow}>
      <View style={styles.cleanerAvatar}>
        <Text style={styles.cleanerInitials} maxFontSizeMultiplier={1.1}>
          {displayInitials}
        </Text>
      </View>
      <View style={styles.cleanerCopy}>
        <Text style={styles.cleanerName} maxFontSizeMultiplier={1.2} numberOfLines={1}>
          {displayName}
        </Text>
        {cleaner ? (
          <View style={styles.cleanerMeta}>
            <Text style={styles.cleanerRating} maxFontSizeMultiplier={1.1}>
              {cleaner.rating.toFixed(1)} ★
            </Text>
            <ShieldCheck size={13} color={colors.yellow600} strokeWidth={2.2} />
            <Text style={styles.cleanerVerified} maxFontSizeMultiplier={1.1}>
              Verified
            </Text>
          </View>
        ) : (
          <Text style={styles.cleanerMuted} maxFontSizeMultiplier={1.1} numberOfLines={1}>
            {assigned ? 'Your assigned cleaner' : 'We’ll confirm your cleaner before the visit.'}
          </Text>
        )}
      </View>
      {assigned ? (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={phone ? 'Call cleaner' : 'Call cleaner (unavailable)'}
            hitSlop={6}
            onPress={call}
            style={[styles.contactButton, !phone && styles.contactButtonMuted]}>
            <Phone size={18} color={phone ? colors.green700 : colors.textMuted} strokeWidth={2} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Chat about this booking"
            hitSlop={6}
            onPress={onChat}
            style={styles.contactButton}>
            <MessageCircle size={18} color={colors.green700} strokeWidth={2} />
          </Pressable>
        </>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Contact support about this booking"
          hitSlop={6}
          onPress={onChat}
          style={styles.supportButton}>
          <MessageCircle size={18} color={colors.green700} strokeWidth={2} />
        </Pressable>
      )}
    </View>
  );
}

/**
 * P15c Live Tracking. Uses the live tracking contract (`/ws/bookings/{id}` with
 * 10 s polling fallback) when the API is configured; otherwise shows a
 * schematic map and time-derived estimated state.
 */
export default function LiveTrackingScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const insets = useSafeAreaInsets();
  const id = typeof params.id === 'string' ? params.id : '';
  useBookings();
  const booking = id ? getBookingById(id) : undefined;
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const tracking = useLiveTracking(booking, now);
  const isLiveData = tracking.source === 'live';
  const statusLabel = isLiveData
    ? 'Live tracking'
    : tracking.state.live || tracking.connection === 'polling' || tracking.connection === 'connecting'
      ? 'Tracking preview'
      : 'Tracking preview';
  const footnote = isLiveData
    ? 'Live cleaner location and ETA are provided by the tracking service. Updates may take a few seconds.'
    : 'ETA and position are estimated from your booking. Live cleaner location and updates will appear here once the tracking service is connected.';

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    if (booking) router.replace(`/booking/${booking.id}` as never);
    else router.replace('/(tabs)/bookings' as never);
  };

  const openSupport = () => {
    router.push({ pathname: '/chat/[threadId]', params: { threadId: 'support' } } as never);
  };

  if (!booking || (booking.status === 'cancelled' && tracking.state.eta === 'Tracking unavailable')) {
    return (
      <SafeAreaView style={styles.fallbackScreen} edges={['top']}>
        <TopBar title="Live tracking" onBack={goBack} />
        <EmptyState
          icon={MapPin}
          title={booking ? 'Tracking unavailable' : 'Booking not found'}
          body={
            booking
              ? 'This booking was cancelled, so there is no active route to follow.'
              : 'Open one of your bookings to see its tracking details.'
          }
          actionLabel="Back to bookings"
          onAction={() => router.replace('/(tabs)/bookings' as never)}
        />
      </SafeAreaView>
    );
  }

  const cleaner = cleaners.find((item) => item.id === booking.cleanerId);
  const cleanerName = tracking.cleanerName ?? cleaner?.name ?? booking.cleanerName;
  const cleanerInitials =
    tracking.cleanerInitials ?? cleaner?.initials ?? (booking.cleanerName ? initialsFor(booking.cleanerName) : undefined);
  const address = [booking.street, booking.area].filter(Boolean).join(', ');

  return (
    <View style={styles.screen}>
      <TrackingMap
        progress={tracking.state.progress}
        cleanerName={cleanerName}
        initials={cleanerInitials}
        area={booking.area}
        live={tracking.state.live || isLiveData}
        cleanerLocation={tracking.cleanerLocation}
        destinationLocation={tracking.destination}
      />

      <View style={[styles.topBar, { top: insets.top + space[2] }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          onPress={goBack}
          style={styles.backButton}>
          <ArrowLeft size={21} color={colors.text} strokeWidth={2} />
        </Pressable>
        <View style={styles.livePill}>
          <View style={[styles.liveDot, (tracking.state.live || isLiveData) && styles.liveDotActive]} />
          <Text style={styles.liveText} maxFontSizeMultiplier={1.1}>
            {statusLabel}
          </Text>
        </View>
        <View style={styles.backButtonSpacer} />
      </View>

      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, space[4]) }]}>
        <View style={styles.handle} />
        <View style={styles.sheetHead}>
          <View style={styles.etaWrap}>
            <Text style={styles.eta} maxFontSizeMultiplier={1.2}>
              {tracking.state.eta}
            </Text>
            <Text style={styles.detail} maxFontSizeMultiplier={1.2}>
              {tracking.state.detail}
            </Text>
          </View>
          {!isLiveData ? (
            <View style={styles.estimateChip}>
              <Text style={styles.estimateText} maxFontSizeMultiplier={1.1}>
                Estimated
              </Text>
            </View>
          ) : (
            <View style={styles.liveChip}>
              <Text style={styles.liveChipText} maxFontSizeMultiplier={1.1}>
                Live
              </Text>
            </View>
          )}
        </View>

        <Timeline phase={tracking.state.phase} />

        <CleanerRow
          cleaner={cleaner}
          name={cleanerName}
          initials={cleanerInitials}
          phone={tracking.cleanerPhone}
          onChat={openSupport}
        />

        {address ? (
          <View style={styles.addressRow}>
            <MapPin size={15} color={colors.textMuted} strokeWidth={2} />
            <Text style={styles.address} maxFontSizeMultiplier={1.1} numberOfLines={1}>
              {address}
            </Text>
          </View>
        ) : null}

        <Text style={styles.footnote} maxFontSizeMultiplier={1.1}>
          {footnote}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  fallbackScreen: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    position: 'absolute',
    left: space[4],
    right: space[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  backButtonSpacer: { width: 44, height: 44 },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 32,
    paddingHorizontal: space[3],
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    ...shadow.card,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.disabledText,
  },
  liveDotActive: { backgroundColor: colors.green500 },
  liveText: {
    ...text.caption,
    color: colors.text,
    fontFamily: font.bodySemi,
    fontSize: 12,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: space[4],
    paddingTop: space[2],
    gap: space[3],
    ...shadow.floating,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    marginBottom: 2,
  },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: space[2],
  },
  etaWrap: { flex: 1, gap: 4 },
  eta: {
    ...text.h1,
    fontSize: 24,
    lineHeight: 30,
    color: colors.text,
  },
  detail: {
    ...text.bodyM,
    color: colors.textMuted,
  },
  estimateChip: {
    borderRadius: radius.pill,
    backgroundColor: colors.yellow50,
    borderWidth: 1,
    borderColor: colors.yellow200,
    paddingHorizontal: space[2],
    paddingVertical: 5,
  },
  estimateText: {
    ...text.caption,
    fontSize: 10,
    lineHeight: 12,
    color: colors.yellow800,
    fontFamily: font.bodySemi,
  },
  liveChip: {
    borderRadius: radius.pill,
    backgroundColor: colors.green50,
    borderWidth: 1,
    borderColor: colors.green100,
    paddingHorizontal: space[2],
    paddingVertical: 5,
  },
  liveChipText: {
    ...text.caption,
    fontSize: 10,
    lineHeight: 12,
    color: colors.green700,
    fontFamily: font.bodySemi,
  },
  timeline: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: space[1],
  },
  timelineLine: {
    position: 'absolute',
    top: 8,
    left: 16,
    right: 16,
    height: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
  },
  timelineStep: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotComplete: {
    borderColor: colors.green500,
    backgroundColor: colors.green500,
  },
  timelineDotActive: {
    borderWidth: 3,
    borderColor: colors.yellow500,
    backgroundColor: colors.surface,
  },
  timelineDotInner: {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  timelineLabel: {
    ...text.caption,
    fontSize: 10,
    lineHeight: 13,
    textAlign: 'center',
    color: colors.textMuted,
  },
  timelineLabelActive: {
    color: colors.green700,
    fontFamily: font.bodySemi,
  },
  cleanerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    paddingTop: space[3],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  cleanerAvatar: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.green100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cleanerInitials: {
    fontFamily: font.poppinsSemi,
    fontSize: 14,
    color: colors.green900,
  },
  cleanerCopy: { flex: 1, gap: 3 },
  cleanerName: {
    ...text.h3,
    fontSize: 16,
    lineHeight: 21,
    color: colors.text,
  },
  cleanerMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cleanerRating: {
    ...text.caption,
    color: colors.text,
    fontFamily: font.bodySemi,
  },
  cleanerVerified: {
    ...text.caption,
    color: colors.yellow800,
    fontFamily: font.bodySemi,
  },
  cleanerMuted: {
    ...text.caption,
    color: colors.textMuted,
  },
  contactButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.green100,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactButtonMuted: {
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  supportButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.green50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  address: {
    ...text.caption,
    flex: 1,
    color: colors.textMuted,
  },
  footnote: {
    ...text.caption,
    fontSize: 10,
    lineHeight: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
