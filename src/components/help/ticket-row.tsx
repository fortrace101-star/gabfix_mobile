import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StatusChip, type StatusChipTone } from '@/components/ui/status-chip';
import { ticketCategories } from '@/config/help';
import type { Ticket, TicketStatus } from '@/store/tickets';
import { colors, font, space, text } from '@/theme';

const statusLabels: Record<TicketStatus, { label: string; tone: StatusChipTone }> = {
  open: { label: 'Open', tone: 'warning' },
  in_progress: { label: 'In progress', tone: 'info' },
  resolved: { label: 'Resolved', tone: 'success' },
};

export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const minutes = Math.round((Date.now() - then) / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

type Props = { ticket: Ticket; onPress: () => void };

/** One row in Recent tickets / View all (S1 16.3). */
export function TicketRow({ ticket, onPress }: Props) {
  const category = ticketCategories.find((item) => item.value === ticket.category);
  const Icon = category?.icon;
  const status = statusLabels[ticket.status];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${ticket.subject}, ${ticket.id}, ${status.label}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.icon}>
        {Icon ? <Icon size={20} color={colors.green700} strokeWidth={2} /> : null}
      </View>
      <View style={styles.body}>
        <Text style={styles.subject} maxFontSizeMultiplier={1.3} numberOfLines={1}>
          {ticket.subject}
        </Text>
        <Text style={styles.meta} maxFontSizeMultiplier={1.2}>
          {ticket.id} · {relativeTime(ticket.createdAtISO)}
        </Text>
      </View>
      <StatusChip label={status.label} tone={status.tone} />
      <ChevronRight size={18} color={colors.textMuted} strokeWidth={2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    paddingVertical: space[3],
  },
  pressed: { opacity: 0.65 },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.green50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 2 },
  subject: { ...text.bodyM, fontFamily: font.bodySemi, color: colors.text },
  meta: { ...text.caption },
});
