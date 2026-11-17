import { ChevronDown, MapPin, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LogoBadge } from '@/components/brand/logo-badge';
import { Button } from '@/components/ui/button';
import { useStatusBarStyle } from '@/hooks/use-status-bar-style';
import { colors, font, radius, shadow, size, space, text } from '@/theme';
import { useOnboardingArea } from '@/store/onboarding';

/**
 * Placeholder destination for the Phase 2 exit criteria: register, verify, choose an area and land
 * on Home. The full P4 dashboard is Phase 3 and is tracked in Gabfix_UI_Progress.md.
 */
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  useStatusBarStyle('light');
  const area = useOnboardingArea();

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={[colors.green500, colors.green700]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={[
          styles.hero,
          { paddingTop: insets.top + space[3], paddingBottom: space[10] },
        ]}>
        <View style={styles.heroRow}>
          <LogoBadge size={40} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={area ? `Area: ${area.name}. Change area` : 'Choose your area'}
            onPress={() => router.push('/area-select')}
            style={styles.areaPill}>
            <MapPin size={16} color={colors.surface} strokeWidth={2} />
            <Text style={styles.areaText}>{area ? area.name : 'Choose area'}</Text>
            <ChevronDown size={14} color={colors.surface} strokeWidth={2} />
          </Pressable>
        </View>
        <Text style={styles.greeting}>Hello 👋</Text>
        <Text style={styles.title}>You&apos;re all set.</Text>
        <Text style={styles.subtitle}>
          {area ? `Cleaners in ${area.name}, ${area.division} are ready when you are.` : 'Choose your area to see cleaners near you.'}
        </Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + space[6] }]}
        showsVerticalScrollIndicator={false}>
        <View style={[styles.card, styles.overlap]}>
          <View style={styles.iconTile}>
            <Sparkles size={24} color={colors.green500} strokeWidth={2} />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>The Home dashboard is next</Text>
            <Text style={styles.cardBody}>
              Phase 3 adds search, service categories, offers and your upcoming bookings. The
              onboarding and auth flow you just completed is the Phase 2 milestone.
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            label="Browse cleaning services"
            onPress={() =>
              Alert.alert('Coming in Phase 3', 'The services catalogue and booking flow are the next phase.')
            }
          />
          <Button
            label="Change my area"
            variant="secondary"
            onPress={() => router.push('/area-select')}
          />
        </View>

        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>Phase 2 complete</Text>
          <Text style={styles.progressBody}>
            Get Started · Login · Sign Up · OTP · Reset Password · Area Selector
          </Text>
          <Text style={styles.progressMeta}>Tracked in Gabfix_UI_Progress.md</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Log out"
          onPress={() => router.replace('/login')}
          style={styles.logout}>
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  hero: {
    paddingHorizontal: space[5],
    borderBottomLeftRadius: radius.sheet,
    borderBottomRightRadius: radius.sheet,
    gap: space[2],
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space[5],
  },
  areaPill: {
    height: 36,
    paddingHorizontal: space[3],
    borderRadius: radius.pill,
    backgroundColor: colors.whiteOverlay,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1],
  },
  areaText: { ...text.bodyM, fontFamily: font.bodySemi, color: colors.surface },
  greeting: { ...text.body, color: colors.whiteTextMuted },
  title: { ...text.display, color: colors.surface },
  subtitle: { ...text.body, color: colors.whiteTextMuted },
  content: { paddingHorizontal: space[4], gap: space[4] },
  overlap: { marginTop: -space[6], gap: space[3] },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: space[4],
    flexDirection: 'row',
    gap: space[3],
    ...shadow.card,
  },
  iconTile: {
    width: 48,
    height: 48,
    borderRadius: radius.tile,
    backgroundColor: colors.green50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { flex: 1, gap: space[1] },
  cardTitle: { ...text.h3 },
  cardBody: { ...text.body, color: colors.textMuted },
  actions: { gap: space[3] },
  progressCard: {
    borderRadius: radius.card,
    padding: space[4],
    backgroundColor: colors.yellow50,
    gap: space[1],
  },
  progressTitle: { ...text.h3, color: colors.yellow800 },
  progressBody: { ...text.body, color: colors.green900 },
  progressMeta: { ...text.caption, color: colors.yellow800 },
  logout: {
    minHeight: size.touch,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: { ...text.bodyM, fontFamily: font.bodySemi, color: colors.green500 },
});
