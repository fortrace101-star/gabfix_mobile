import { router, useLocalSearchParams, type Href } from 'expo-router';
import { CheckCircle2, LifeBuoy } from 'lucide-react-native';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { relativeTime } from '@/components/help/ticket-row';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusChip, type StatusChipTone } from '@/components/ui/status-chip';
import { TopBar } from '@/components/ui/top-bar';
import { ticketCategoryLabel } from '@/config/help';
import { dateLong, time12 } from '@/utils/format';
import { markTicketResolved, useTicket, type TicketStatus } from '@/store/tickets';
import { base, colors, font, radius, space, text } from '@/theme';

const statusMeta: Record<TicketStatus, { label: string; tone: StatusChipTone }> = {
  open: { label: 'Open', tone: 'warning' },
  in_progress: { label: 'In progress', tone: 'info' },
  resolved: { label: 'Resolved', tone: 'success' },
};

/** P22b one ticket: header, original message, screenshots, thread (S1 16.3). */
export default function TicketDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === 'string' ? params.id : undefined;
  const ticket = useTicket(id);

  if (!ticket) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <TopBar title="Ticket" />
        <EmptyState
          icon={LifeBuoy}
          title="Ticket not found"
          body="This ticket is no longer on this device."
          actionLabel="Back to Help centre"
          onAction={() => router.replace('/help' as Href)}
        />
      </SafeAreaView>
    );
  }

  const status = statusMeta[ticket.status];
  const created = new Date(ticket.createdAtISO);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <TopBar title={ticket.id} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.code} maxFontSizeMultiplier={1.2}>
              {ticket.id}
            </Text>
            <StatusChip label={status.label} tone={status.tone} />
          </View>
          <Text style={styles.subject} maxFontSizeMultiplier={1.3}>
            {ticket.subject}
          </Text>
          <Text style={styles.meta} maxFontSizeMultiplier={1.2}>
            {ticketCategoryLabel(ticket.category)}
            {ticket.bookingId ? ` · ${ticket.bookingId}` : ''}
          </Text>
          <Text style={styles.meta} maxFontSizeMultiplier={1.2}>
            Sent {dateLong(created)} at {time12(created)}
          </Text>
        </View>

        <View style={[base.card, styles.thread]}>
          {ticket.thread.map((entry, index) => (
            <View key={`${entry.atISO}-${index}`} style={styles.message}>
              <View style={styles.messageHeader}>
                <Text style={styles.author} maxFontSizeMultiplier={1.2}>
                  {entry.from === 'support' ? 'Gabfix support' : 'You'}
                </Text>
                <Text style={styles.meta} maxFontSizeMultiplier={1.2}>
                  {relativeTime(entry.atISO)}
                </Text>
              </View>
              <Text style={styles.bodyText} maxFontSizeMultiplier={1.3}>
                {entry.text}
              </Text>
            </View>
          ))}
        </View>

        {ticket.screenshots.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.2}>
              Screenshots
            </Text>
            <View style={styles.thumbs}>
              {ticket.screenshots.map((shot) => (
                <Image key={shot.id} source={{ uri: shot.uri }} style={styles.thumb} />
              ))}
            </View>
          </View>
        ) : null}

        {ticket.status !== 'resolved' ? (
          <Button
            label="Mark as resolved"
            variant="secondary"
            icon={CheckCircle2}
            onPress={() => markTicketResolved(ticket.id)}
          />
        ) : null}

        <Text style={styles.note} maxFontSizeMultiplier={1.3}>
          Replies from the support team will appear here once the support service is connected. We
          also email you at the address on your account.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space[4], paddingBottom: space[10], gap: space[4] },
  header: { gap: space[2] },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[2],
  },
  code: { ...text.caption, fontFamily: font.bodySemi, color: colors.green700 },
  subject: { ...text.h2 },
  meta: { ...text.caption },
  thread: { gap: space[4] },
  message: { gap: space[1] },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[2],
  },
  author: { ...text.caption, fontFamily: font.bodySemi, color: colors.text },
  bodyText: { ...text.body, lineHeight: 21 },
  section: { gap: space[2] },
  sectionTitle: { ...text.caption, fontFamily: font.bodySemi, color: colors.textMuted },
  thumbs: { flexDirection: 'row', gap: space[2] },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: radius.button,
    backgroundColor: colors.disabledBg,
  },
  note: { ...text.caption, lineHeight: 18 },
});
