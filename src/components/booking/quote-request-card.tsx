import { CalendarDays, Clock3 } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { shortDate } from '@/lib/plans';
import {
  QUOTE_STATUS_LABELS,
  quoteFrequencyLabel,
  quotePropertyLabel,
  quoteSizeLabel,
} from '@/lib/quotes';
import type { QuoteRequest } from '@/store/quotes';
import { colors, font, radius, shadow, space, text } from '@/theme';

const pendingTone = { bg: colors.warningBg, fg: colors.yellow800 };

const statusTone = (request: QuoteRequest) => {
  if (request.status === 'pending') return pendingTone;
  if (request.status === 'declined') return { bg: colors.disabledBg, fg: colors.textMuted };
  return { bg: colors.successBg, fg: colors.success };
};

/** P25 request summary shown in Bookings → Requests. */
export function QuoteRequestCard({ request }: { request: QuoteRequest }) {
  const tone = statusTone(request);
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.titleWrap}>
          <Text style={styles.title} maxFontSizeMultiplier={1.3} numberOfLines={1}>
            {request.serviceName}
          </Text>
          <Text style={styles.id} maxFontSizeMultiplier={1.2}>
            {request.id}
          </Text>
        </View>
        <View style={[styles.chip, { backgroundColor: tone.bg }]}>
          <Text style={[styles.chipText, { color: tone.fg }]} maxFontSizeMultiplier={1.2}>
            {QUOTE_STATUS_LABELS[request.status]}
          </Text>
        </View>
      </View>

      <Text style={styles.details} maxFontSizeMultiplier={1.3} numberOfLines={2}>
        {quotePropertyLabel(request.propertyType)} · {quoteSizeLabel(request.size)} ·{' '}
        {request.areaName}
      </Text>

      <View style={styles.metaRow}>
        <CalendarDays size={16} color={colors.textMuted} strokeWidth={2} />
        <Text style={styles.metaText} maxFontSizeMultiplier={1.2}>
          Preferred start {shortDate(request.preferredDateISO)}
        </Text>
      </View>
      <View style={styles.metaRow}>
        <Clock3 size={16} color={colors.textMuted} strokeWidth={2} />
        <Text style={styles.metaText} maxFontSizeMultiplier={1.2}>
          {quoteFrequencyLabel(request.frequency)} · requested{' '}
          {new Date(request.createdAtISO).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
          })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: space[4],
    gap: space[2],
    ...shadow.card,
  },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: space[2] },
  titleWrap: { flex: 1, gap: 2 },
  title: { ...text.h3 },
  id: { ...text.caption },
  chip: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 6 },
  chipText: { fontSize: 12, fontFamily: font.bodySemi },
  details: { ...text.bodyM },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { ...text.caption, flex: 1 },
});
