import { router, useLocalSearchParams } from 'expo-router';
import { Download, Flag, Share2 } from 'lucide-react-native';
import { Alert, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LogoBadge } from '@/components/brand/logo-badge';
import { TopBar } from '@/components/ui/top-bar';
import { paymentMethodLabel } from '@/lib/booking-policy';
import { price } from '@/lib/pricing';
import { type BookingStatus, getBookingById, useBookings } from '@/store/bookings';
import { colors, font, radius, shadow, space, text } from '@/theme';
import { ugx } from '@/utils/format';

const parseISODate = (iso: string): Date => {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const dateLabel = (iso?: string): string =>
  iso
    ? parseISODate(iso).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Date to confirm';

const issuedLabel = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const statusMeta: Record<BookingStatus, { label: string; bg: string; fg: string }> = {
  upcoming: { label: 'Confirmed', bg: '#E8F5EC', fg: colors.green700 },
  completed: { label: 'Completed', bg: '#EEF2FF', fg: '#3730A3' },
  cancelled: { label: 'Cancelled', bg: '#FEE2E2', fg: colors.error },
};

const paymentKind = (plan?: string): string => {
  if (plan === 'full_now') return 'Full payment';
  if (plan === 'deposit') return 'Deposit';
  if (plan === 'after_service') return 'Payment after service';
  return 'Payment';
};

function LineItem({
  label,
  value,
  strong,
  negative,
}: {
  label: string;
  value: string;
  strong?: boolean;
  negative?: boolean;
}) {
  return (
    <View style={styles.line}>
      <Text
        style={[styles.lineLabel, strong && styles.lineLabelStrong]}
        maxFontSizeMultiplier={1.3}>
        {label}
      </Text>
      <Text
        style={[styles.lineValue, strong && styles.lineValueStrong, negative && styles.negative]}
        maxFontSizeMultiplier={1.3}>
        {value}
      </Text>
    </View>
  );
}

/** P19 Receipt / invoice for one saved booking. */
export default function ReceiptScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  // Subscribe so the receipt follows a booking that is rescheduled or cancelled.
  useBookings();
  const booking = id ? getBookingById(id) : undefined;

  if (!booking) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <TopBar title="Receipt" onBack={() => router.back()} />
        <View style={styles.empty}>
          <Text style={styles.emptyTitle} maxFontSizeMultiplier={1.3}>
            Receipt not found
          </Text>
          <Text style={styles.emptyBody} maxFontSizeMultiplier={1.3}>
            This booking is not saved on this device.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const source = booking.rebook;
  const quote = source ? price(source) : null;
  const status = statusMeta[booking.status];
  const method = paymentMethodLabel(booking.paymentMethod);
  const total = quote?.total ?? booking.total;
  const rows = quote
    ? [
        {
          label: `${booking.serviceName} (${booking.hours} h × ${booking.cleaners} cleaner${booking.cleaners === 1 ? '' : 's'})`,
          value: ugx(quote.base),
        },
        ...(quote.materials > 0 ? [{ label: 'Materials', value: ugx(quote.materials) }] : []),
        ...(quote.addOns > 0 ? [{ label: 'Extras', value: ugx(quote.addOns) }] : []),
        ...(quote.frequencyDiscount > 0
          ? [{ label: 'Frequency discount', value: `−${ugx(quote.frequencyDiscount)}` }]
          : []),
        ...(quote.promoDiscount > 0
          ? [
              {
                label: `Promo${source?.promoCode ? ` (${source.promoCode})` : ''}`,
                value: `−${ugx(quote.promoDiscount)}`,
              },
            ]
          : []),
        { label: 'VAT (18%)', value: ugx(quote.vat) },
      ]
    : [{ label: booking.serviceName, value: ugx(booking.total) }];

  const share = () => {
    void Share.share({
      message: [
        `Gabfix receipt ${booking.id}`,
        `${booking.serviceName} · ${dateLabel(booking.dateISO)}`,
        booking.area ? `At ${booking.area}` : null,
        `Total ${ugx(total)}`,
        `Paid ${ugx(booking.paid)}`,
        booking.balance > 0 ? `Outstanding ${ugx(booking.balance)}` : 'Paid in full',
      ]
        .filter(Boolean)
        .join('\n'),
    }).catch(() => undefined);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <TopBar title="Receipt" onBack={() => router.back()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.brandRow}>
            <LogoBadge size={40} />
            <View style={styles.brandCopy}>
              <Text style={styles.brand} maxFontSizeMultiplier={1.3}>
                Gabfix
              </Text>
              <Text style={styles.brandCaption} maxFontSizeMultiplier={1.2}>
                Home cleaning receipt
              </Text>
            </View>
            <View style={[styles.status, { backgroundColor: status.bg }]}>
              <Text style={[styles.statusText, { color: status.fg }]} maxFontSizeMultiplier={1.2}>
                {status.label}
              </Text>
            </View>
          </View>

          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel} maxFontSizeMultiplier={1.2}>
                Receipt
              </Text>
              <Text style={styles.metaValue} maxFontSizeMultiplier={1.3}>
                {booking.id}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel} maxFontSizeMultiplier={1.2}>
                Issued
              </Text>
              <Text style={styles.metaValue} maxFontSizeMultiplier={1.3}>
                {issuedLabel(booking.createdAtISO)}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel} maxFontSizeMultiplier={1.2}>
                Service date
              </Text>
              <Text style={styles.metaValue} maxFontSizeMultiplier={1.3}>
                {dateLabel(booking.dateISO)}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel} maxFontSizeMultiplier={1.2}>
                Address
              </Text>
              <Text style={styles.metaValue} maxFontSizeMultiplier={1.3}>
                {[booking.area, booking.street].filter(Boolean).join(', ') || 'To confirm'}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.3}>
            Charges
          </Text>
          {rows.map((row) => (
            <LineItem key={row.label} label={row.label} value={row.value} />
          ))}
          <View style={styles.divider} />
          <LineItem label="Total" value={ugx(total)} strong />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.3}>
            Payments
          </Text>
          {booking.paid > 0 ? (
            <View style={styles.payment}>
              <View style={styles.paymentCopy}>
                <Text style={styles.paymentKind} maxFontSizeMultiplier={1.3}>
                  {paymentKind(booking.paymentPlan)}
                </Text>
                <Text style={styles.paymentMeta} maxFontSizeMultiplier={1.3}>
                  {method} · {issuedLabel(booking.createdAtISO)}
                </Text>
                <Text style={styles.paymentMeta} maxFontSizeMultiplier={1.2}>
                  Reference {booking.id}
                </Text>
              </View>
              <Text style={styles.paymentAmount} maxFontSizeMultiplier={1.3}>
                {ugx(booking.paid)}
              </Text>
            </View>
          ) : (
            <Text style={styles.bodyMuted} maxFontSizeMultiplier={1.3}>
              No payment has been collected for this booking yet.
            </Text>
          )}

          {booking.lateFee ? (
            <LineItem label="Late cancellation fee" value={ugx(booking.lateFee)} />
          ) : null}
          {booking.refundAmount ? (
            <LineItem label="Refunded" value={`−${ugx(booking.refundAmount)}`} negative />
          ) : null}

          <View style={styles.divider} />
          <LineItem label="Total paid" value={ugx(booking.paid)} strong />
          <LineItem
            label={booking.balance > 0 ? 'Outstanding' : 'Outstanding balance'}
            value={ugx(booking.balance)}
            strong
          />
        </View>

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Share receipt"
            onPress={share}
            style={styles.action}>
            <Share2 size={18} color={colors.green700} strokeWidth={2} />
            <Text style={styles.actionText} maxFontSizeMultiplier={1.3}>
              Share receipt
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Download receipt"
            onPress={() =>
              Alert.alert(
                'Download',
                'PDF export needs expo-print and expo-sharing, which are not installed in this build yet.',
              )
            }
            style={styles.action}>
            <Download size={18} color={colors.green700} strokeWidth={2} />
            <Text style={styles.actionText} maxFontSizeMultiplier={1.3}>
              Download PDF
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Report a problem with this receipt"
            onPress={() =>
              Alert.alert('Report a problem', 'Support contact is not connected in this demo build yet.')
            }
            style={styles.action}>
            <Flag size={18} color={colors.green700} strokeWidth={2} />
            <Text style={styles.actionText} maxFontSizeMultiplier={1.3}>
              Report a problem
            </Text>
          </Pressable>
        </View>

        <Text style={styles.footer} maxFontSizeMultiplier={1.2}>
          This receipt reflects the booking record saved on this device for demo purposes.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space[4], paddingBottom: space[8], gap: space[3] },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: space[4],
    gap: space[2],
    ...shadow.card,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  brandCopy: { flex: 1, gap: 2 },
  brand: { ...text.h3, color: colors.text },
  brandCaption: { ...text.caption, color: colors.textMuted },
  status: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 6 },
  statusText: { fontSize: 12, fontFamily: font.bodySemi },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space[3], marginTop: space[2] },
  metaItem: { width: '47%', gap: 2 },
  metaLabel: { ...text.caption, color: colors.textMuted },
  metaValue: { ...text.bodyM, color: colors.text },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: space[2] },
  sectionTitle: { ...text.h3, color: colors.text, marginBottom: 2 },
  line: { flexDirection: 'row', justifyContent: 'space-between', gap: space[3], paddingVertical: 4 },
  lineLabel: { ...text.bodyM, color: colors.textMuted, flex: 1 },
  lineLabelStrong: { color: colors.text, fontFamily: font.bodySemi },
  lineValue: { ...text.bodyM, color: colors.text },
  lineValueStrong: { fontFamily: font.bodySemi },
  negative: { color: colors.green700 },
  payment: { flexDirection: 'row', alignItems: 'flex-start', gap: space[3], paddingVertical: space[1] },
  paymentCopy: { flex: 1, gap: 2 },
  paymentKind: { ...text.bodyM, color: colors.text, fontFamily: font.bodySemi },
  paymentMeta: { ...text.caption, color: colors.textMuted },
  paymentAmount: { ...text.h3, color: colors.text },
  bodyMuted: { ...text.bodyM, color: colors.textMuted },
  actions: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    paddingHorizontal: space[4],
    ...shadow.card,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    minHeight: 48,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  actionText: { ...text.bodyM, color: colors.text },
  footer: { ...text.caption, color: colors.textMuted, textAlign: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space[6], gap: space[2] },
  emptyTitle: { ...text.h3, color: colors.text },
  emptyBody: { ...text.bodyM, color: colors.textMuted, textAlign: 'center' },
});
