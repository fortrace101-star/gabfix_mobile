import { router, type Href } from 'expo-router';
import { LifeBuoy } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TicketRow } from '@/components/help/ticket-row';
import { EmptyState } from '@/components/ui/empty-state';
import { TopBar } from '@/components/ui/top-bar';
import { useTickets } from '@/store/tickets';
import { base, colors, space, text } from '@/theme';

/** P22a every support ticket on this device (S1 16.3). */
export default function TicketsScreen() {
  const tickets = useTickets();

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <TopBar title="Support tickets" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {tickets.length === 0 ? (
          <EmptyState
            icon={LifeBuoy}
            title="No support tickets yet"
            body="When you submit a request from the Help centre, it appears here with its replies."
            actionLabel="Go to Help centre"
            onAction={() => router.push('/help' as Href)}
          />
        ) : (
          <>
            <Text style={styles.count} maxFontSizeMultiplier={1.2}>
              {tickets.length} {tickets.length === 1 ? 'ticket' : 'tickets'}
            </Text>
            <View style={[base.card, styles.list]}>
              {tickets.map((ticket, index) => (
                <View key={ticket.id}>
                  {index > 0 ? <View style={styles.divider} /> : null}
                  <TicketRow
                    ticket={ticket}
                    onPress={() =>
                      router.push({
                        pathname: '/help/tickets/[id]',
                        params: { id: ticket.id },
                      } as Href)
                    }
                  />
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space[4], paddingBottom: space[10], gap: space[3] },
  count: { ...text.caption },
  list: { paddingVertical: space[1], paddingHorizontal: space[3] },
  divider: { height: 1, backgroundColor: colors.border },
});
