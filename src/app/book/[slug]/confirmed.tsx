import { router, useLocalSearchParams } from 'expo-router';
import { CalendarDays, Check, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ScopeSummary } from '@/components/booking/scope-summary';
import { slotLabel } from '@/components/booking/slot-chips';
import { UploadStatus } from '@/components/booking/upload-status';
import { Button } from '@/components/ui/button';
import { cleanerById } from '@/config/cleaners';
import { serviceBySlug } from '@/config/services';
import { supportsNativeDriver } from '@/lib/animation';
import { prepareBookingUploads, retryBookingUploads, startBookingUploads } from '@/lib/media-upload';
import { finalizeDraftMedia } from '@/lib/media';
import { requestPushPermission, shouldShowPushPrePrompt, snoozePushPrePrompt } from '@/lib/push';
import { price } from '@/lib/pricing';
import { getBookingDraft, resetDraft } from '@/store/booking';
import { addBooking } from '@/store/bookings';
import { retryFailedUploads, useMediaUploads } from '@/store/media-uploads';
import { addNotification } from '@/store/notifications';
import { colors, font, radius, space, text } from '@/theme';
import { successHaptic } from '@/utils/haptics';
import { ugx } from '@/utils/format';

const parseISODate = (iso: string): Date => {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/** P14 Booking Confirmed. Finalizes draft media, saves the local record and starts uploads. */
export default function ConfirmedScreen() {
  const params = useLocalSearchParams<{
    slug?: string;
    bookingId?: string;
    paid?: string;
    total?: string;
  }>();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const bookingId = typeof params.bookingId === 'string' ? params.bookingId : 'GBX-00000';
  const [snapshot] = useState(() => getBookingDraft());
  const [tick] = useState(() => new Animated.Value(0));
  const [pushPrompt, setPushPrompt] = useState(false);
  const savedRef = useRef(false);
  const uploads = useMediaUploads(bookingId);

  useEffect(() => {
    void shouldShowPushPrePrompt().then((show) => {
      if (show) setPushPrompt(true);
    });
  }, []);

  const enableUpdates = async () => {
    await requestPushPermission();
    setPushPrompt(false);
  };

  const dismissUpdates = async () => {
    setPushPrompt(false);
    await snoozePushPrePrompt();
  };

  const service = serviceBySlug(slug || snapshot?.serviceSlug || '');
  const total = snapshot ? price(snapshot).total : Number(params.total) || 0;
  const paid = Number(params.paid) || 0;
  const balance = Math.max(total - paid, 0);
  const schedule = snapshot?.schedule;
  const location = snapshot?.location;
  const preferredCleaner = cleanerById(snapshot?.preferredCleanerId);

  useEffect(() => {
    if (savedRef.current) return;
    savedRef.current = true;

    void (async () => {
      const draftMedia = snapshot?.media?.items ?? [];
      const finalizedMedia = await finalizeDraftMedia(bookingId, draftMedia);

      addBooking({
        id: bookingId,
        serviceSlug: service?.slug ?? snapshot?.serviceSlug ?? slug ?? 'service',
        serviceName: service?.name ?? 'Cleaning service',
        status: 'upcoming',
        createdAtISO: new Date().toISOString(),
        dateISO: schedule?.dateISO,
        startTime: schedule?.startTime,
        area: location?.area,
        street: location?.street,
        propertyType: location?.propertyType,
        cleaners: snapshot?.details.cleaners ?? 1,
        hours: snapshot?.details.hours ?? 2,
        total,
        paid,
        balance,
        paymentPlan: snapshot?.payment?.plan,
        paymentMethod: snapshot?.payment?.method,
        phone: snapshot?.payment?.payerPhone,
        contactName: location?.contactName,
        cleanerId: preferredCleaner?.id,
        cleanerName: preferredCleaner?.name,
        scope: snapshot?.scope,
        media: finalizedMedia.length > 0 ? finalizedMedia : undefined,
        rebook: snapshot
          ? {
              details: snapshot.details,
              addOns: snapshot.addOns,
              scope: snapshot.scope,
              location: snapshot.location,
              payment: snapshot.payment,
              promoCode: snapshot.promoCode,
            }
          : undefined,
      });

      addNotification({
        id: `booking-confirmed-${bookingId}`,
        kind: 'booking',
        title: 'Booking confirmed',
        body: `${service?.name ?? 'Your clean'} is booked. Tap to view the details.`,
        createdAtISO: new Date().toISOString(),
        href: `/booking/${bookingId}`,
      });

      if (finalizedMedia.length > 0) {
        prepareBookingUploads(bookingId, finalizedMedia);
        void startBookingUploads(bookingId, finalizedMedia);
      }

      resetDraft();
      successHaptic();
      Animated.spring(tick, { toValue: 1, useNativeDriver: supportsNativeDriver }).start();
    })();
  }, [balance, bookingId, location?.area, location?.contactName, location?.propertyType, location?.street, paid, preferredCleaner?.id, preferredCleaner?.name, schedule?.dateISO, schedule?.startTime, service?.name, service?.slug, slug, snapshot, snapshot?.details.cleaners, snapshot?.details.hours, snapshot?.payment?.method, snapshot?.payment?.payerPhone, snapshot?.payment?.plan, snapshot?.serviceSlug, tick, total]);

  const when = schedule
    ? `${parseISODate(schedule.dateISO).toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      })} · ${slotLabel(schedule.startTime)}`
    : 'Time to confirm';
  const where = location
    ? [location.area, location.street].filter(Boolean).join(' · ')
    : 'Address to confirm';

  const goHome = () => router.replace('/home');

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle} maxFontSizeMultiplier={1.3}>
            Booking confirmed
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close confirmation"
            hitSlop={8}
            onPress={goHome}
            style={styles.close}>
            <X size={22} color={colors.text} strokeWidth={2} />
          </Pressable>
        </View>

        <View style={styles.successRing}>
          <Animated.View style={{ transform: [{ scale: tick }] }}>
            <View style={styles.successCircle}>
              <Check size={52} color={colors.surface} strokeWidth={3} />
            </View>
          </Animated.View>
        </View>

        <Text style={styles.title} maxFontSizeMultiplier={1.3}>
          You&apos;re booked!
        </Text>
        <Text style={styles.bookingId} maxFontSizeMultiplier={1.2}>
          Booking {bookingId}
        </Text>

        <View style={styles.card}>
          <Text style={styles.service} maxFontSizeMultiplier={1.3}>
            {service?.name ?? 'Cleaning service'}
          </Text>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel} maxFontSizeMultiplier={1.3}>
              When
            </Text>
            <Text style={styles.rowValue} maxFontSizeMultiplier={1.3}>
              {when}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel} maxFontSizeMultiplier={1.3}>
              Where
            </Text>
            <Text style={styles.rowValue} maxFontSizeMultiplier={1.3}>
              {where}
            </Text>
          </View>
          {snapshot ? (
            <View style={styles.row}>
              <Text style={styles.rowLabel} maxFontSizeMultiplier={1.3}>
                Cleaners and length
              </Text>
              <Text style={styles.rowValue} maxFontSizeMultiplier={1.3}>
                {snapshot.details.cleaners} cleaner
                {snapshot.details.cleaners === 1 ? '' : 's'} · {snapshot.details.hours} h
              </Text>
            </View>
          ) : null}
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel} maxFontSizeMultiplier={1.3}>
              Paid today
            </Text>
            <Text style={styles.rowValue} maxFontSizeMultiplier={1.3}>
              {ugx(paid)}
            </Text>
          </View>
          {balance > 0 ? (
            <View style={styles.row}>
              <Text style={styles.rowLabel} maxFontSizeMultiplier={1.3}>
                Balance after service
              </Text>
              <Text style={styles.rowValue} maxFontSizeMultiplier={1.3}>
                {ugx(balance)}
              </Text>
            </View>
          ) : null}
        </View>

        {snapshot?.scope ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.3}>
              Job details
            </Text>
            <ScopeSummary scope={snapshot.scope} media={snapshot.media?.items ?? []} compact />
            {uploads.length > 0 ? (
              <UploadStatus
                items={uploads}
                onRetry={() => {
                  retryFailedUploads(bookingId);
                  void retryBookingUploads(bookingId, snapshot.media?.items ?? []);
                }}
              />
            ) : null}
          </View>
        ) : null}

        <View style={styles.nextCard}>
          <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.3}>
            What happens next
          </Text>
          {[
            'We match you with a cleaner',
            'You get a reminder 24 hours before',
            'Your cleaner arrives',
          ].map((step, index, steps) => (
            <View key={step} style={styles.timelineRow}>
              <View style={styles.timelineMark}>
                <View style={styles.timelineDot}>
                  <Text style={styles.timelineNumber} maxFontSizeMultiplier={1.2}>
                    {index + 1}
                  </Text>
                </View>
                {index < steps.length - 1 ? <View style={styles.timelineLine} /> : null}
              </View>
              <Text style={styles.timelineText} maxFontSizeMultiplier={1.3}>
                {step}
              </Text>
            </View>
          ))}
        </View>

        {pushPrompt ? (
          <View style={styles.promptCard}>
            <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.3}>
              Get a message when your cleaner is on the way
            </Text>
            <Text style={styles.promptBody} maxFontSizeMultiplier={1.3}>
              Turn on notifications and we&apos;ll tell you when they&apos;re on the way.
            </Text>
            <View style={styles.promptActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => void dismissUpdates()}
                style={styles.promptSecondary}>
                <Text style={styles.promptSecondaryText} maxFontSizeMultiplier={1.2}>Not now</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => void enableUpdates()}
                style={styles.promptPrimary}>
                <Text style={styles.promptPrimaryText} maxFontSizeMultiplier={1.2}>Turn on</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <View style={styles.actions}>
          <Button label="View booking" onPress={() => router.push(`/booking/${bookingId}` as never)} />
          <Button
            label="Add to calendar"
            variant="secondary"
            icon={CalendarDays}
            onPress={() =>
              Alert.alert(
                'Calendar',
                'Calendar reminders need the calendar integration (P14 follow-up), which is not installed yet.',
              )
            }
          />
          <Button label="Back to home" variant="ghost" onPress={goHome} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: {
    padding: space[4],
    paddingBottom: space[10],
    gap: space[4],
    alignItems: 'stretch',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  headerTitle: { ...text.bodyM, fontFamily: font.bodySemi },
  close: { minWidth: 48, minHeight: 48, alignItems: 'flex-end', justifyContent: 'center' },
  successRing: {
    alignSelf: 'center',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 6,
    borderColor: colors.yellow500,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space[4],
  },
  successCircle: {
    width: 94,
    height: 94,
    borderRadius: 47,
    backgroundColor: colors.green500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...text.h1, textAlign: 'center' },
  bookingId: { ...text.caption, textAlign: 'center', color: colors.textMuted },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: space[4],
    gap: space[3],
  },
  service: { ...text.h3 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  row: { flexDirection: 'row', gap: space[3], justifyContent: 'space-between' },
  rowLabel: { ...text.caption, flexShrink: 0 },
  rowValue: { ...text.bodyM, fontFamily: font.bodySemi, fontSize: 14, flex: 1, textAlign: 'right' },
  nextCard: {
    backgroundColor: colors.green50,
    borderRadius: radius.card,
    padding: space[4],
    gap: space[3],
  },
  sectionTitle: { ...text.h3 },
  timelineRow: { flexDirection: 'row', gap: space[3], minHeight: 46 },
  timelineMark: { alignItems: 'center', width: 24 },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.green500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineNumber: { ...text.caption, color: colors.surface, fontFamily: font.bodySemi },
  timelineLine: { width: 2, flex: 1, backgroundColor: colors.green100, marginVertical: 2 },
  timelineText: { ...text.bodyM, flex: 1, paddingTop: 1 },
  actions: { gap: space[2] },
  promptCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: space[4],
    gap: space[2],
  },
  promptBody: { ...text.body, color: colors.textMuted },
  promptActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: space[2], marginTop: space[1] },
  promptSecondary: { minHeight: 44, paddingHorizontal: space[3], justifyContent: 'center' },
  promptSecondaryText: { ...text.button, color: colors.textMuted },
  promptPrimary: {
    minHeight: 44,
    paddingHorizontal: space[4],
    borderRadius: radius.pill,
    backgroundColor: colors.green500,
    justifyContent: 'center',
  },
  promptPrimaryText: { ...text.button, color: colors.surface },
});
