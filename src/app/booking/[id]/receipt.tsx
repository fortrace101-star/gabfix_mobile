import { router, useLocalSearchParams, type Href } from 'expo-router';
import { Download, Flag, Share2 } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LogoBadge } from '@/components/brand/logo-badge';
import { TopBar } from '@/components/ui/top-bar';
import { receiptModel, type BookingStatusLabel } from '@/lib/receipt';
import { shareReceiptPdf } from '@/lib/receipt-export';
import { getBookingById, useBookings } from '@/store/bookings';
import { colors, font, radius, shadow, space, text } from '@/theme';
import { ugx } from '@/utils/format';

const statusMeta: Record<BookingStatusLabel, { bg: string; fg: string }> = {
  Confirmed: { bg: '#E8F5EC', fg: colors.green700 },
  Completed: { bg: '#EEF2FF', fg: '#3730A3' },
  Cancelled: { bg: '#FEE2E2', fg: colors.error },
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

/** P19 Receipt / invoice for one saved booking, with a share sheet and PDF export. */
export default function ReceiptScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  // Subscribe so the receipt follows a booking that is rescheduled or cancelled.
  useBookings();
  const booking = id ? getBookingById(id) : undefined;
  const [downloading, setDownloading] = useState(false);

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

  const receipt = receiptModel(booking);
  const status = statusMeta[receipt.status];

  const share = () => {
    void Share.share({
      message: [
        `Gabfix receipt ${receipt.id}`,
        `${booking.serviceName} · ${receipt.serviceDate}`,
        booking.area ? `At ${booking.area}` : null,
        `Total ${ugx(receipt.total)}`,
        `Paid ${ugx(receipt.paid)}`,
        receipt.balance > 0 ? `Outstanding ${ugx(receipt.balance)}` : 'Paid in full',
      ]
        .filter(Boolean)
        .join('\n'),
    }).catch(() => undefined);
  };

  const download = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      await shareReceiptPdf(booking);
    } catch (error) {
      Alert.alert(
        'Could not create the PDF',
        error instanceof Error ? error.message : 'Try again in a moment.',
      );
    } finally {
      setDownloading(false);
    }
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
                {receipt.status}
              </Text>
            </View>
          </View>

          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel} maxFontSizeMultiplier={1.2}>
                Receipt
              </Text>
              <Text style={styles.metaValue} maxFontSizeMultiplier={1.3}>
                {receipt.id}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel} maxFontSizeMultiplier={1.2}>
                Issued
              </Text>
              <Text style={styles.metaValue} maxFontSizeMultiplier={1.3}>
                {receipt.issued}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel} maxFontSizeMultiplier={1.2}>
                Service date
              </Text>
              <Text style={styles.metaValue} maxFontSizeMultiplier={1.3}>
                {receipt.serviceDate}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel} maxFontSizeMultiplier={1.2}>
                Address
              </Text>
              <Text style={styles.metaValue} maxFontSizeMultiplier={1.3}>
                {receipt.address}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.3}>
            Charges
          </Text>
          {receipt.lines.map((line) => (
            <LineItem key={line.label} label={line.label} value={line.value} />
          ))}
          <View style={styles.divider} />
          <LineItem label="Total" value={ugx(receipt.total)} strong />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.3}>
            Payments
          </Text>
          {receipt.paid > 0 ? (
            <View style={styles.payment}>
              <View style={styles.paymentCopy}>
                <Text style={styles.paymentKind} maxFontSizeMultiplier={1.3}>
                  {receipt.paymentKind}
                </Text>
                <Text style={styles.paymentMeta} maxFontSizeMultiplier={1.3}>
                  {receipt.method} · {receipt.issued}
                </Text>
                <Text style={styles.paymentMeta} maxFontSizeMultiplier={1.2}>
                  Reference {receipt.id}
                </Text>
              </View>
              <Text style={styles.paymentAmount} maxFontSizeMultiplier={1.3}>
                {ugx(receipt.paid)}
              </Text>
            </View>
          ) : (
            <Text style={styles.bodyMuted} maxFontSizeMultiplier={1.3}>
              No payment has been collected for this booking yet.
            </Text>
          )}

          {receipt.tip ? <LineItem label="Digital tip" value={ugx(receipt.tip)} /> : null}
          {receipt.lateFee ? (
            <LineItem label="Late cancellation fee" value={ugx(receipt.lateFee)} />
          ) : null}
          {receipt.refundAmount ? (
            <LineItem label="Refunded" value={`−${ugx(receipt.refundAmount)}`} negative />
          ) : null}

          <View style={styles.divider} />
          <LineItem label="Total paid" value={ugx(receipt.paid)} strong />
          <LineItem
            label={receipt.balance > 0 ? 'Outstanding' : 'Outstanding balance'}
            value={ugx(receipt.balance)}
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
            accessibilityLabel="Download receipt as PDF"
            accessibilityState={{ busy: downloading }}
            disabled={downloading}
            onPress={() => void download()}
            style={[styles.action, downloading && styles.actionBusy]}>
            <Download size={18} color={colors.green700} strokeWidth={2} />
            <Text style={styles.actionText} maxFontSizeMultiplier={1.3}>
              {downloading ? 'Preparing PDF…' : 'Download PDF'}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Report a problem with this receipt"
            onPress={() => router.push('/help/contact' as Href)}
            style={styles.action}>
            <Flag size={18} color={colors.green700} strokeWidth={2} />
            <Text style={styles.actionText} maxFontSizeMultiplier={1.3}>
              Report a problem
            </Text>
          </Pressable>
        </View>

        <Text style={styles.footer} maxFontSizeMultiplier={1.2}>
          The PDF is generated on this device from the booking record saved here. Share it or
          save it to your files.
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
  actionBusy: { opacity: 0.6 },
  actionText: { ...text.bodyM, color: colors.text },
  footer: { ...text.caption, color: colors.textMuted, textAlign: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space[6], gap: space[2] },
  emptyTitle: { ...text.h3, color: colors.text },
  emptyBody: { ...text.bodyM, color: colors.textMuted, textAlign: 'center' },
});
