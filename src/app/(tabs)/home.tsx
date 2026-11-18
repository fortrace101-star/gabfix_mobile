import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Timer,
} from 'lucide-react-native';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Blob } from '@/components/auth/blob';
import { useStatusBarStyle } from '@/hooks/use-status-bar-style';
import { price } from '@/lib/pricing';
import { fromHourly, serviceBySlug, services } from '@/config/services';
import { useBookingDraft } from '@/store/booking';
import { useOnboardingArea, useOnboardingUserName } from '@/store/onboarding';
import { useAuthUser } from '@/store/session';
import { auth, base, colors, font, radius, shadow, space, text } from '@/theme';
import { ugx } from '@/utils/format';

const trust = [
  { icon: ShieldCheck, label: 'Vetted cleaners' },
  { icon: Timer, label: 'Free cancellation' },
  { icon: Sparkles, label: 'Satisfaction promise' },
] as const;

/** P4 Home tab shell. Discovery data is still local; `GET /home` replaces it in Phase 3. */
export default function HomeTab() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  useStatusBarStyle('light');

  const area = useOnboardingArea();
  const userName = useOnboardingUserName();
  const user = useAuthUser();
  const draft = useBookingDraft();

  const displayName = userName?.trim() || user?.name?.trim() || 'there';
  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'G';

  const draftService = serviceBySlug(draft?.serviceSlug);
  const draftTotal = draft ? price(draft).total : 0;
  const cardWidth = (width - space[4] * 2 - space[3]) / 2;

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <LinearGradient
          colors={[auth.bgTop, auth.bgBottom]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + space[3] }]}>
          <Blob variant="topRight" ratio={0.34} />
          <View style={base.between}>
            <View style={styles.nameBlock}>
              <Text style={styles.greeting} maxFontSizeMultiplier={1.3}>
                Hello,
              </Text>
              <Text style={styles.name} maxFontSizeMultiplier={1.3} numberOfLines={1}>
                {displayName}
              </Text>
            </View>
            <View style={styles.heroActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Notifications"
                hitSlop={8}
                onPress={() => Alert.alert('Notifications', 'Booking updates arrive here in Phase 3.')}
                style={styles.bell}>
                <Bell size={20} color={colors.surface} strokeWidth={2} />
                <View style={styles.bellDot} />
              </Pressable>
              <View style={styles.avatar} accessibilityLabel={`Signed in as ${displayName}`}>
                <Text style={styles.avatarText} maxFontSizeMultiplier={1.2}>
                  {initials}
                </Text>
              </View>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={area ? `Area: ${area.name}. Change area` : 'Choose your area'}
            onPress={() => router.push('/area-select')}
            style={styles.areaPill}>
            <MapPin size={14} color={colors.surface} strokeWidth={2} />
            <Text style={styles.areaText} maxFontSizeMultiplier={1.3} numberOfLines={1}>
              {area ? area.name : 'Choose area'}
            </Text>
            <ChevronDown size={14} color={colors.surface} strokeWidth={2} />
          </Pressable>
        </LinearGradient>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Search cleaning services"
          onPress={() => router.push('/services')}
          style={styles.search}>
          <Search size={20} color={colors.textMuted} strokeWidth={2} />
          <Text style={styles.searchText} maxFontSizeMultiplier={1.3}>
            What needs cleaning today?
          </Text>
        </Pressable>

        <View style={styles.body}>
          {draft ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Resume booking for ${draftService?.name ?? 'cleaning'}`}
              onPress={() =>
                router.push({ pathname: '/book/[slug]/details', params: { slug: draft.serviceSlug } })
              }
              style={styles.draftCard}>
              <View style={styles.draftBody}>
                <Text style={styles.draftKicker} maxFontSizeMultiplier={1.3}>
                  Continue your booking
                </Text>
                <Text style={styles.draftTitle} maxFontSizeMultiplier={1.3} numberOfLines={1}>
                  {draftService?.name ?? 'Cleaning service'}
                </Text>
                <Text style={styles.draftMeta} maxFontSizeMultiplier={1.3}>
                  {draft.details.cleaners} cleaner{draft.details.cleaners === 1 ? '' : 's'} ·{' '}
                  {draft.details.hours} h · {ugx(draftTotal)}
                </Text>
              </View>
              <View style={styles.resume}>
                <Text style={styles.resumeText} maxFontSizeMultiplier={1.3}>
                  Resume
                </Text>
                <ChevronRight size={16} color={colors.green500} strokeWidth={2} />
              </View>
            </Pressable>
          ) : null}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.trustScroll}
            contentContainerStyle={styles.trustRow}>
            {trust.map(({ icon: Icon, label }) => (
              <View key={label} style={styles.trustPill}>
                <Icon size={18} color={colors.green500} strokeWidth={2} />
                <Text style={styles.trustText} maxFontSizeMultiplier={1.3}>
                  {label}
                </Text>
              </View>
            ))}
          </ScrollView>

          <View style={base.between}>
            <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.3}>
              Most popular
            </Text>
            <Pressable accessibilityRole="button" onPress={() => router.push('/services')} hitSlop={8}>
              <Text style={styles.seeAll} maxFontSizeMultiplier={1.3}>
                See all
              </Text>
            </Pressable>
          </View>

          <View style={styles.grid}>
            {services.map((service, index) => (
              <Pressable
                key={service.slug}
                accessibilityRole="button"
                accessibilityLabel={`${service.name}. From ${ugx(fromHourly)} per hour`}
                onPress={() =>
                  router.push({
                    pathname: '/book/[slug]/details',
                    params: { slug: service.slug },
                  })
                }
                style={[styles.serviceCard, { width: cardWidth }]}>
                {service.tag ? (
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>{service.tag}</Text>
                  </View>
                ) : null}
                <View style={styles.serviceIcon}>
                  {index % 2 === 0 ? (
                    <Sparkles size={26} color={colors.green500} strokeWidth={2} />
                  ) : (
                    <CalendarDays size={26} color={colors.green500} strokeWidth={2} />
                  )}
                </View>
                <Text style={styles.serviceName} maxFontSizeMultiplier={1.3} numberOfLines={2}>
                  {service.name}
                </Text>
                <Text style={styles.servicePrice} maxFontSizeMultiplier={1.3}>
                  From {ugx(fromHourly)}/hr
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.3}>
            How it works
          </Text>
          <View style={[base.card, styles.howCard]}>
            {[
              { step: '1', title: 'Tell us what you need', copy: 'Pick a service and how long it takes' },
              { step: '2', title: 'Choose a time', copy: 'Same-day slots when cleaners are free' },
              { step: '3', title: 'We handle the rest', copy: 'A vetted cleaner arrives, you relax' },
            ].map((item) => (
              <View key={item.step} style={styles.howStep}>
                <View style={styles.stepCircle}>
                  <Text style={styles.stepNumber}>{item.step}</Text>
                </View>
                <Text style={styles.stepTitle} maxFontSizeMultiplier={1.3}>
                  {item.title}
                </Text>
                <Text style={styles.stepCopy} maxFontSizeMultiplier={1.3} numberOfLines={2}>
                  {item.copy}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: space[6] },
  hero: {
    paddingHorizontal: space[4],
    paddingBottom: space[10] + space[4],
    borderBottomLeftRadius: radius.sheet,
    borderBottomRightRadius: radius.sheet,
    overflow: 'hidden',
    gap: space[3],
  },
  nameBlock: { flex: 1, gap: 0 },
  greeting: { ...text.body, color: auth.textSoft },
  name: { fontFamily: font.poppinsSemi, fontSize: 20, lineHeight: 28, color: colors.surface },
  heroActions: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  bell: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.whiteOverlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.yellow500,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.yellow500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: font.poppinsSemi,
    fontSize: 14,
    lineHeight: 20,
    color: colors.green900,
  },
  areaPill: {
    alignSelf: 'flex-start',
    height: 32,
    paddingHorizontal: space[3],
    borderRadius: radius.pill,
    backgroundColor: colors.whiteOverlay,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1],
    maxWidth: '100%',
  },
  areaText: {
    fontFamily: font.bodySemi,
    fontSize: 13,
    lineHeight: 18,
    color: colors.surface,
    flexShrink: 1,
  },
  search: {
    marginTop: -space[6],
    marginHorizontal: space[4],
    height: 52,
    borderRadius: radius.tile,
    backgroundColor: colors.surface,
    paddingHorizontal: space[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    zIndex: 10,
    ...shadow.card,
  },
  searchText: { ...text.body, color: colors.textMuted },
  body: { paddingHorizontal: space[4], paddingTop: space[6], gap: space[5] },
  draftCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderLeftWidth: 4,
    borderLeftColor: colors.yellow500,
    padding: space[4],
    ...shadow.card,
  },
  draftBody: { flex: 1, gap: 2 },
  draftKicker: { ...text.caption, color: colors.textMuted },
  draftTitle: { ...text.h3 },
  draftMeta: { ...text.caption },
  resume: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  resumeText: { ...text.bodyM, fontFamily: font.bodySemi, color: colors.green500 },
  trustScroll: { marginHorizontal: -space[4] },
  trustRow: { paddingHorizontal: space[4], gap: space[2] },
  trustPill: {
    height: 36,
    paddingHorizontal: space[3],
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
  },
  trustText: { fontFamily: font.bodySemi, fontSize: 13, lineHeight: 18, color: colors.text },
  sectionTitle: { ...text.h2 },
  seeAll: { ...text.bodyM, fontFamily: font.bodySemi, color: colors.green500 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space[3] },
  serviceCard: {
    aspectRatio: 1.05,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    padding: space[3],
    gap: space[2],
    justifyContent: 'flex-end',
    overflow: 'hidden',
    ...shadow.card,
  },
  tag: {
    position: 'absolute',
    top: space[2],
    left: space[2],
    height: 22,
    paddingHorizontal: space[2],
    borderRadius: 11,
    backgroundColor: colors.yellow500,
    justifyContent: 'center',
    zIndex: 1,
  },
  tagText: {
    fontFamily: font.bodySemi,
    fontSize: 11,
    lineHeight: 14,
    color: colors.green900,
  },
  serviceIcon: {
    flex: 1,
    justifyContent: 'center',
  },
  serviceName: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 20, color: colors.text },
  servicePrice: { ...text.caption, color: colors.green700 },
  howCard: { flexDirection: 'row', gap: space[3] },
  howStep: { flex: 1, alignItems: 'center', gap: space[1] },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.green50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space[1],
  },
  stepNumber: {
    fontFamily: font.poppinsSemi,
    fontSize: 14,
    lineHeight: 20,
    color: colors.green500,
  },
  stepTitle: {
    ...text.caption,
    color: colors.text,
    fontFamily: font.bodySemi,
    textAlign: 'center',
  },
  stepCopy: { ...text.caption, fontSize: 11, lineHeight: 15, textAlign: 'center' },
});
