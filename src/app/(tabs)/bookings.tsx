import { router } from 'expo-router';
import { CalendarDays } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { useStatusBarStyle } from '@/hooks/use-status-bar-style';
import { colors, font, radius, space, text } from '@/theme';

/** P15 shell. Bookings arrive once `POST /bookings` is wired to a backend. */
export default function BookingsTab() {
  const insets = useSafeAreaInsets();
  useStatusBarStyle('dark');

  return (
    <View style={[styles.screen, { paddingTop: insets.top + space[4] }]}>
      <Text style={styles.title} maxFontSizeMultiplier={1.3}>
        Bookings
      </Text>
      <View style={styles.empty}>
        <View style={styles.iconTile}>
          <CalendarDays size={32} color={colors.green500} strokeWidth={2} />
        </View>
        <Text style={styles.emptyTitle} maxFontSizeMultiplier={1.3}>
          No bookings yet
        </Text>
        <Text style={styles.emptyCopy} maxFontSizeMultiplier={1.3}>
          Your upcoming and past cleans will appear here.
        </Text>
        <Button label="Browse services" onPress={() => router.push('/services')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: space[4] },
  title: { ...text.h1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space[3] },
  iconTile: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: colors.green50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { ...text.h2 },
  emptyCopy: {
    fontFamily: font.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 260,
  },
});
