import { router, useLocalSearchParams, type Href } from 'expo-router';
import { ArrowLeft, CalendarDays, CircleHelp, Clock3, FileText, MapPin, Navigation, Phone, Star, Users, Wallet, XCircle } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { CancelSheet } from '@/components/booking/cancel-sheet';
import { RescheduleSheet } from '@/components/booking/reschedule-sheet';
import { ScopeSummary } from '@/components/booking/scope-summary';
import { slotLabel } from '@/components/booking/slot-chips';
import { UploadStatus } from '@/components/booking/upload-status';
import { Button } from '@/components/ui/button';
import { paymentMethodLabel } from '@/lib/booking-policy';
import { retryBookingUploads } from '@/lib/media-upload';
import { buildRebookDraft } from '@/lib/rebook';
import { startRebookDraft } from '@/store/booking';
import { type BookingStatus, getBookingById, useBookings } from '@/store/bookings';
import { retryFailedUploads, useMediaUploads } from '@/store/media-uploads';
import { useReviews } from '@/store/reviews';
import { colors, font, radius, shadow, space, text } from '@/theme';
import { hoursLabel, ugx } from '@/utils/format';

const statusMeta: Record<BookingStatus, { label: string; bg: string; fg: string; note: string }> = {
  upcoming: {
    label: 'Confirmed',
    bg: '#E8F5EC',
    fg: colors.green700,
    note: 'Your booking is confirmed. We will assign a cleaner and keep you updated.',
  },
  completed: {
    label: 'Completed',
    bg: '#EEF2FF',
    fg: '#3730A3',
    note: 'This booking has been completed.',
  },
  cancelled: {
    label: 'Cancelled',
    bg: '#FEE2E2',
    fg: colors.error,
    note: 'This booking was cancelled.',
  },
};

const parseISODate = (iso: string): Date => {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
};

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Icon size={18} color={colors.green700} strokeWidth={2} />
      </View>
      <View style={styles.infoCopy}>
        <Text style={styles.infoLabel} maxFontSizeMultiplier={1.2}>
          {label}
        </Text>
        <Text style={styles.infoValue} maxFontSizeMultiplier={1.3}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, strong && styles.summaryLabelStrong]} maxFontSizeMultiplier={1.2}>
        {label}
      </Text>
      <Text style={[styles.summaryValue, strong && styles.summaryValueStrong]} maxFontSizeMultiplier={1.3}>
        {value}
      </Text>
    </View>
  );
}

const soon = (title: string, message: string) => () => Alert.alert(title, message);

/** P15b Booking detail (local snapshot saved on this device). */
export default function BookingDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const insets = useSafeAreaInsets();
  const id = typeof params.id === 'string' ? params.id : '';
  // Subscribe so the screen updates if store hydrates after mount.
  useBookings();
  const reviews = useReviews();
  const booking = id ? getBookingById(id) : undefined;
  const review = reviews.find((item) => item.bookingId === booking?.id);
  const uploads = useMediaUploads(booking?.id);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  if (!booking) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={8}
            onPress={() => router.back()}
            style={styles.back}>
            <ArrowLeft size={22} color={colors.text} strokeWidth={2} />
          </Pressable>
          <Text style={styles.headerTitle} maxFontSizeMultiplier={1.3}>
            Booking
          </Text>
          <View style={styles.back} />
        </View>
        <View style={styles.notFound}>
          <Text style={styles.notFoundTitle} maxFontSizeMultiplier={1.3}>
            Booking not found
          </Text>
          <Text style={styles.notFoundBody} maxFontSizeMultiplier={1.3}>
            This booking may not be saved on this device yet.
          </Text>
          <Button label="Back to bookings" variant="secondary" onPress={() => router.replace('/(tabs)/bookings')} />
        </View>
      </SafeAreaView>
    );
  }

  const meta = statusMeta[booking.status];
  const when = booking.dateISO
    ? `${parseISODate(booking.dateISO).toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })}${booking.startTime ? ` · ${slotLabel(booking.startTime)}` : ''}`
    : 'Time to confirm';
  const where = [booking.area, booking.street].filter(Boolean).join(', ') || 'Address to confirm';
  const propertyLabel =
    booking.propertyType === 'apartment'
      ? 'Apartment'
      : booking.propertyType === 'office'
        ? 'Office'
        : booking.propertyType === 'house'
          ? 'House'
          : booking.propertyType;
  const planLabel =
    booking.paymentPlan === 'full_now'
      ? 'Pay in full'
      : booking.paymentPlan === 'deposit'
        ? '30% deposit'
        : booking.paymentPlan === 'after_service'
          ? 'Pay after service'
          : booking.paymentPlan ?? '—';
  const methodLabel =
    booking.paymentMethod === 'mtn_momo'
      ? 'MTN MoMo'
      : booking.paymentMethod === 'airtel_money'
        ? 'Airtel Money'
        : booking.paymentMethod === 'visa_card'
          ? 'Visa card'
          : booking.paymentMethod === 'cash'
            ? 'Cash'
            : booking.paymentMethod ?? '—';

  const bookAgain = (sameCleaner = false) => {
    startRebookDraft(buildRebookDraft(booking, { sameCleaner }));
    router.push({ pathname: '/book/[slug]/schedule', params: { slug: booking.serviceSlug } });
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          onPress={() => router.back()}
          style={styles.back}>
          <ArrowLeft size={22} color={colors.text} strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle} maxFontSizeMultiplier={1.3} numberOfLines={1}>
          {booking.id}
        </Text>
        <View style={styles.back} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={[styles.banner, { backgroundColor: meta.bg }]}>
          <Text style={[styles.bannerTitle, { color: meta.fg }]} maxFontSizeMultiplier={1.3}>
            {meta.label}
          </Text>
          <Text style={styles.bannerNote} maxFontSizeMultiplier={1.3}>
            {meta.note}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle} maxFontSizeMultiplier={1.3}>
            {booking.serviceName}
          </Text>
          <InfoRow icon={CalendarDays} label="When" value={when} />
          {booking.rescheduledAtISO ? (
            <InfoRow
              icon={Clock3}
              label="Rescheduled"
              value={new Date(booking.rescheduledAtISO).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            />
          ) : null}
          <InfoRow icon={MapPin} label="Where" value={where} />
          <InfoRow
            icon={Users}
            label="Service details"
            value={`${booking.cleaners} cleaner${booking.cleaners === 1 ? '' : 's'} · ${hoursLabel(booking.hours)}`}
          />
          {propertyLabel ? (
            <InfoRow icon={Clock3} label="Property" value={propertyLabel} />
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle} maxFontSizeMultiplier={1.3}>
            Cleaner
          </Text>
          {booking.cleanerName ? (
            <>
              <Text style={styles.bodyMuted} maxFontSizeMultiplier={1.3}>
                Assigned to your preferred cleaner.
              </Text>
              <InfoRow icon={Users} label="Cleaner" value={booking.cleanerName} />
            </>
          ) : (
            <Text style={styles.bodyMuted} maxFontSizeMultiplier={1.3}>
              A cleaner will be assigned before your appointment. You’ll be notified once assigned.
            </Text>
          )}
        </View>

        {booking.scope || (booking.media?.length ?? 0) > 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle} maxFontSizeMultiplier={1.3}>
              Job scope
            </Text>
            <ScopeSummary scope={booking.scope} media={booking.media ?? []} compact />
            {uploads.length > 0 ? (
              <UploadStatus
                items={uploads}
                onRetry={() => {
                  const failed = retryFailedUploads(booking.id);
                  if (failed.length > 0) void retryBookingUploads(booking.id, booking.media ?? []);
                }}
              />
            ) : null}
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle} maxFontSizeMultiplier={1.3}>
            Payment summary
          </Text>
          <SummaryRow label="Plan" value={planLabel} />
          <SummaryRow label="Method" value={methodLabel} />
          <SummaryRow label="Total" value={ugx(booking.total)} />
          <SummaryRow label="Paid" value={ugx(booking.paid)} />
          <SummaryRow label={booking.balance > 0 ? 'Balance due' : 'Balance'} value={ugx(booking.balance)} strong />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View receipt"
            hitSlop={8}
            onPress={() => router.push(`/booking/${booking.id}/receipt` as never)}
            style={styles.receiptLink}>
            <FileText size={16} color={colors.green700} strokeWidth={2} />
            <Text style={styles.receiptText} maxFontSizeMultiplier={1.2}>
              View receipt
            </Text>
          </Pressable>
        </View>

        {booking.status === 'completed' ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle} maxFontSizeMultiplier={1.3}>
              {review ? 'Your review' : 'How was your clean?'}
            </Text>
            {review ? (
              <>
                <View style={styles.reviewStars}>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <Star
                      key={value}
                      size={20}
                      color={value <= review.stars ? colors.yellow600 : colors.border}
                      fill={value <= review.stars ? colors.yellow600 : 'transparent'}
                      strokeWidth={1.8}
                    />
                  ))}
                </View>
                {review.comment ? (
                  <Text style={styles.bodyMuted} maxFontSizeMultiplier={1.3}>
                    “{review.comment}”
                  </Text>
                ) : null}
              </>
            ) : (
              <>
                <Text style={styles.bodyMuted} maxFontSizeMultiplier={1.3}>
                  Rate {booking.cleanerName ?? 'your cleaner'} and add a tip in a few taps.
                </Text>
                <Button
                  label="Rate your clean"
                  icon={Star}
                  onPress={() => router.push(`/booking/${booking.id}/rate` as never)}
                />
              </>
            )}
          </View>
        ) : null}

        {booking.status === 'cancelled' ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle} maxFontSizeMultiplier={1.3}>
              Cancellation
            </Text>
            {booking.cancelReason ? (
              <SummaryRow label="Reason" value={booking.cancelReason} />
            ) : null}
            {booking.lateFee ? (
              <SummaryRow label="Late fee" value={ugx(booking.lateFee)} />
            ) : null}
            {booking.refundAmount ? (
              <SummaryRow
                label="Refund"
                value={`${ugx(booking.refundAmount)} to ${paymentMethodLabel(booking.paymentMethod)}`}
              />
            ) : (
              <SummaryRow label="Refund" value="Nothing to refund" />
            )}
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle} maxFontSizeMultiplier={1.3}>
            Manage booking
          </Text>
          <Text style={styles.bodyMuted} maxFontSizeMultiplier={1.3}>
            Reschedule and cancel here. Extras changes and balance payment will connect once their
            backend is available.
          </Text>
          <View style={styles.actions}>
            {booking.balance > 0 && booking.status === 'upcoming' ? (
              <Button
                label="Pay balance"
                icon={Wallet}
                onPress={soon(
                  'Pay balance',
                  'Balance payment is not available in this demo build yet. It will be enabled when payment authorisation is connected.',
                )}
              />
            ) : null}
            {booking.status === 'upcoming' ? (
              <Button
                label="Track booking"
                variant="secondary"
                icon={Navigation}
                onPress={() => router.push(`/booking/${booking.id}/track` as never)}
              />
            ) : null}
            {booking.status === 'upcoming' ? (
              <>
                <Button
                  label="Reschedule"
                  variant="secondary"
                  icon={CalendarDays}
                  onPress={() => setRescheduleOpen(true)}
                />
                <Button
                  label="Cancel booking"
                  variant="ghost"
                  icon={XCircle}
                  onPress={() => setCancelOpen(true)}
                />
              </>
            ) : null}
            {booking.status !== 'upcoming' ? (
              <>
                <Button label="Book again" variant="secondary" onPress={() => bookAgain()} />
                {booking.cleanerId ? (
                  <Button
                    label={`Book again with ${booking.cleanerName ?? 'the same cleaner'}`}
                    variant="secondary"
                    onPress={() => bookAgain(true)}
                  />
                ) : null}
              </>
            ) : null}
            <Button
              label="Contact support"
              variant="secondary"
              icon={Phone}
              onPress={() =>
                router.push({ pathname: '/help/contact', params: { bookingId: booking.id } } as Href)
              }
            />
          </View>
        </View>

        <View style={styles.footerNote}>
          <Text style={styles.footerText} maxFontSizeMultiplier={1.2}>
            This is a local booking record saved on this device for demo purposes.
          </Text>
        </View>
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Need help? Open help centre"
        onPress={() =>
          router.push({ pathname: '/help/contact', params: { bookingId: booking.id } } as Href)
        }
        style={[styles.needHelp, { bottom: insets.bottom + space[4] }]}>
        <CircleHelp size={20} color={colors.yellow500} strokeWidth={2} />
        <Text style={styles.needHelpText} maxFontSizeMultiplier={1.2}>
          Need help?
        </Text>
      </Pressable>

      <RescheduleSheet
        booking={booking}
        visible={rescheduleOpen}
        onClose={() => setRescheduleOpen(false)}
      />
      <CancelSheet
        booking={booking}
        visible={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onBookAgain={() => {
          setCancelOpen(false);
          bookAgain();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space[4],
    paddingVertical: space[2],
  },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...text.h3, color: colors.text, flex: 1, textAlign: 'center' },
  content: { paddingHorizontal: space[4], paddingBottom: 120, gap: space[3] },
  banner: { borderRadius: radius.card, padding: space[4], gap: 4 },
  bannerTitle: { ...text.h3 },
  bannerNote: { ...text.bodyM, color: colors.textMuted },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: space[4],
    gap: space[2],
    ...shadow.card,
  },
  cardTitle: { ...text.h3, color: colors.text, marginBottom: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 4 },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCopy: { flex: 1, gap: 2 },
  infoLabel: { ...text.caption, color: colors.textMuted },
  infoValue: { ...text.bodyM, color: colors.text },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  summaryLabel: { ...text.bodyM, color: colors.textMuted },
  summaryLabelStrong: { color: colors.text, fontFamily: font.bodySemi },
  summaryValue: { ...text.bodyM, color: colors.text },
  summaryValueStrong: { fontFamily: font.bodySemi },
  receiptLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: space[1],
    paddingTop: space[2],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  receiptText: { ...text.bodyM, color: colors.green700, fontFamily: font.bodySemi },
  bodyMuted: { ...text.bodyM, color: colors.textMuted },
  reviewStars: { flexDirection: 'row', gap: 4, paddingVertical: 2 },
  actions: { gap: space[2], marginTop: space[1] },
  footerNote: { alignItems: 'center', paddingHorizontal: space[3] },
  footerText: { ...text.caption, color: colors.textMuted, textAlign: 'center' },
  needHelp: {
    position: 'absolute',
    right: space[4],
    height: 48,
    borderRadius: radius.pill,
    paddingHorizontal: space[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.green900,
    zIndex: 10,
    ...shadow.floating,
  },
  needHelpText: {
    ...text.bodyM,
    fontFamily: font.bodySemi,
    color: colors.surface,
  },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space[6], gap: space[2] },
  notFoundTitle: { ...text.h3, color: colors.text, textAlign: 'center' },
  notFoundBody: { ...text.bodyM, color: colors.textMuted, textAlign: 'center', marginBottom: space[2] },
});
