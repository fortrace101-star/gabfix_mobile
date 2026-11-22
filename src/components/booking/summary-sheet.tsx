import { StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { addOns } from '@/config/add-ons';
import { frequencyLabels } from '@/config/pricing';
import { addOnPrice, price, type PriceableDraft } from '@/lib/pricing';
import { colors, font, space, text } from '@/theme';
import { ugx } from '@/utils/format';

type Props = {
  visible: boolean;
  onClose: () => void;
  serviceName?: string;
  draft: PriceableDraft | null;
  scheduleLabel?: string;
  locationLabel?: string;
};

const frequencyLabel = (frequency: PriceableDraft['details']['frequency']): string =>
  frequency === 'once' ? 'One time' : frequencyLabels[frequency];

/** Order-flow price breakdown (S1 11.5 shared bottom sheet). */
export function SummarySheet({
  visible,
  onClose,
  serviceName,
  draft,
  scheduleLabel,
  locationLabel,
}: Props) {
  const quote = draft ? price(draft) : null;
  const chosenAddOns = draft ? addOns.filter((item) => draft.addOns.includes(item.id)) : [];

  return (
    <BottomSheet
      visible={visible}
      onDismiss={onClose}
      title="Price breakdown"
      subtitle={serviceName ?? 'Your booking'}
      maxHeightRatio={0.8}
      contentContainerStyle={styles.content}>
      {quote && draft ? (
        <>
          <View style={styles.context}>
            <Text style={styles.contextText} maxFontSizeMultiplier={1.3}>
              {frequencyLabel(draft.details.frequency)} · {draft.details.hours} h ·{' '}
              {draft.details.cleaners} cleaner{draft.details.cleaners === 1 ? '' : 's'}
            </Text>
            {scheduleLabel ? (
              <Text style={styles.contextText} maxFontSizeMultiplier={1.3}>
                {scheduleLabel}
              </Text>
            ) : null}
            {locationLabel ? (
              <Text style={styles.contextText} maxFontSizeMultiplier={1.3} numberOfLines={1}>
                {locationLabel}
              </Text>
            ) : null}
          </View>

          <View style={styles.rows}>
            <Row
              label={`${draft.details.hours} h × ${draft.details.cleaners} cleaner${
                draft.details.cleaners === 1 ? '' : 's'
              }`}
              value={ugx(quote.base)}
            />
            {quote.materials > 0 ? <Row label="Materials" value={ugx(quote.materials)} /> : null}
            {chosenAddOns.map((item) => (
              <Row key={item.id} label={item.name} value={ugx(addOnPrice(item.id))} />
            ))}
            {quote.frequencyDiscount > 0 ? (
              <Row
                label={`${frequencyLabel(draft.details.frequency)} discount`}
                value={`−${ugx(quote.frequencyDiscount)}`}
                tone="credit"
              />
            ) : null}
            {quote.promoDiscount > 0 ? (
              <Row
                label={`Promo ${draft.promoCode?.toUpperCase() ?? ''}`.trim()}
                value={`−${ugx(quote.promoDiscount)}`}
                tone="credit"
              />
            ) : null}
            <Row label="VAT (18%)" value={ugx(quote.vat)} />
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel} maxFontSizeMultiplier={1.3}>
              Total
            </Text>
            <Text style={styles.totalValue} maxFontSizeMultiplier={1.2}>
              {ugx(quote.total)}
            </Text>
          </View>

          <Text style={styles.note} maxFontSizeMultiplier={1.3}>
            Cleaning time: {quote.minutes / 60} h. Final price is confirmed when you book.
          </Text>
        </>
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyText} maxFontSizeMultiplier={1.3}>
            Your price appears once you choose a service.
          </Text>
        </View>
      )}
    </BottomSheet>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: 'credit' }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel} maxFontSizeMultiplier={1.3} numberOfLines={2}>
        {label}
      </Text>
      <Text
        style={[styles.rowValue, tone === 'credit' && styles.credit]}
        maxFontSizeMultiplier={1.2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space[4], paddingTop: space[3], paddingBottom: space[4], gap: space[4] },
  context: { gap: 4 },
  contextText: { ...text.caption, color: colors.textMuted },
  rows: { gap: space[2] },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: space[3] },
  rowLabel: { ...text.body, flex: 1, color: colors.textMuted },
  rowValue: {
    ...text.body,
    fontFamily: font.bodySemi,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  credit: { color: colors.green700 },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: space[3],
  },
  totalLabel: { ...text.h3 },
  totalValue: {
    fontFamily: font.poppinsBold,
    fontSize: 22,
    lineHeight: 28,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  note: { ...text.caption, color: colors.textMuted },
  empty: { paddingVertical: space[6], alignItems: 'center' },
  emptyText: { ...text.body, color: colors.textMuted, textAlign: 'center' },
});
