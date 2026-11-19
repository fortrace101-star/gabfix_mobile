import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { CalendarCheck, ShieldCheck, Star, UserX } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ReviewCard } from '@/components/reviews/review-card';
import { Stars } from '@/components/reviews/stars';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { TopBar } from '@/components/ui/top-bar';
import { cleanerById, reviewsForCleaner, type Cleaner } from '@/config/cleaners';
import { serviceBySlug } from '@/config/services';
import { patchDraft, startDraft } from '@/store/booking';
import { colors, font, radius, shadow, size, space, text } from '@/theme';

function Stat({ value, label, star = false }: { value: string; label: string; star?: boolean }) {
  return (
    <View style={styles.stat}>
      <View style={styles.statValueRow}>
        {star ? <Star size={16} color={colors.yellow600} fill={colors.yellow500} strokeWidth={1.5} /> : null}
        <Text style={styles.statValue} maxFontSizeMultiplier={1.2}>
          {value}
        </Text>
      </View>
      <Text style={styles.statLabel} maxFontSizeMultiplier={1.2}>
        {label}
      </Text>
    </View>
  );
}

function Chips({ items }: { items: readonly string[] }) {
  return (
    <View style={styles.chips}>
      {items.map((item) => (
        <View key={item} style={styles.chip}>
          <Text style={styles.chipText} maxFontSizeMultiplier={1.3}>
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** P27a Cleaner profile. Local roster and sample reviews until the cleaners API exists. */
export default function CleanerProfileScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  const cleaner = cleanerById(id);
  const insets = useSafeAreaInsets();

  if (!cleaner) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <TopBar title="Cleaner profile" />
        <EmptyState
          icon={UserX}
          title="Cleaner not found"
          body="This profile may have moved. Browse our services and we’ll match you with a vetted cleaner."
          actionLabel="Browse services"
          onAction={() => router.replace('/services' as Href)}
        />
      </SafeAreaView>
    );
  }

  const service = serviceBySlug(cleaner.primaryServiceSlug);
  const reviews = reviewsForCleaner(cleaner);

  const bookCleaner = (selected: Cleaner) => {
    startDraft(selected.primaryServiceSlug);
    patchDraft({ preferredCleanerId: selected.id });
    router.push(`/book/${selected.primaryServiceSlug}/details` as Href);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <TopBar title="Cleaner profile" />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <LinearGradient
          colors={[colors.green700, colors.green500]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cover}>
          <Text style={styles.coverInitials} maxFontSizeMultiplier={1}>
            {cleaner.initials}
          </Text>
        </LinearGradient>

        <View style={styles.profile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText} maxFontSizeMultiplier={1.2}>
              {cleaner.initials}
            </Text>
          </View>

          <View style={styles.nameRow}>
            <Text style={styles.name} maxFontSizeMultiplier={1.3}>
              {cleaner.name}
            </Text>
            <LinearGradient
              colors={[colors.yellow500, colors.yellow600]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.verified}>
              <ShieldCheck size={14} color={colors.green900} strokeWidth={2.4} />
              <Text style={styles.verifiedText} maxFontSizeMultiplier={1.2}>
                Verified
              </Text>
            </LinearGradient>
          </View>

          <Text style={styles.role} maxFontSizeMultiplier={1.3}>
            {service?.name ?? 'Cleaning'} specialist · {cleaner.languages.join(' and ')}
          </Text>
        </View>

        <View style={[styles.stats, shadow.card]}>
          <Stat value={cleaner.rating.toFixed(1)} label="Rating" star />
          <View style={styles.statDivider} />
          <Stat value={cleaner.jobsDone.toLocaleString('en-GB')} label="Jobs done" />
          <View style={styles.statDivider} />
          <Stat value={String(cleaner.years)} label={cleaner.years === 1 ? 'Year' : 'Years'} />
        </View>

        <View style={styles.block}>
          <Text style={styles.blockTitle} maxFontSizeMultiplier={1.3}>
            Languages
          </Text>
          <Chips items={cleaner.languages} />
        </View>

        <View style={styles.block}>
          <Text style={styles.blockTitle} maxFontSizeMultiplier={1.3}>
            Skills
          </Text>
          <Chips items={cleaner.skills} />
        </View>

        <View style={styles.block}>
          <View style={styles.reviewHeader}>
            <View style={styles.reviewHeaderCopy}>
              <Text style={styles.blockTitle} maxFontSizeMultiplier={1.3}>
                Reviews
              </Text>
              <View style={styles.reviewSummary}>
                <Stars value={cleaner.rating} size={15} />
                <Text style={styles.reviewSummaryText} maxFontSizeMultiplier={1.3}>
                  {cleaner.rating.toFixed(1)} · {cleaner.jobsDone} jobs
                </Text>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Read all service reviews"
              hitSlop={8}
              onPress={() =>
                router.push(`/service/${cleaner.primaryServiceSlug}/reviews` as Href)
              }>
              <Text style={styles.readAll} maxFontSizeMultiplier={1.2}>
                Read all
              </Text>
            </Pressable>
          </View>

          <View style={styles.reviews}>
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} compact />
            ))}
          </View>

          <Text style={styles.sampleNote} maxFontSizeMultiplier={1.3}>
            A sample of verified reviews for {service?.name ?? 'this service'}.
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.sticky, { paddingBottom: insets.bottom + space[3] }]}>
        <View style={styles.stickyCopy}>
          <Text style={styles.stickyTitle} maxFontSizeMultiplier={1.2}>
            Preferred cleaner
          </Text>
          <Text style={styles.stickyCaption} maxFontSizeMultiplier={1.2}>
            No extra charge
          </Text>
        </View>
        <Button
          label="Book this cleaner"
          icon={CalendarCheck}
          onPress={() => bookCleaner(cleaner)}
          style={styles.stickyButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  content: { paddingBottom: space[6] },
  cover: {
    height: 180,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  coverInitials: {
    fontFamily: font.poppinsBold,
    fontSize: 132,
    lineHeight: 140,
    color: colors.surface,
    opacity: 0.16,
    marginRight: space[4],
    marginBottom: -space[4],
  },
  profile: { paddingHorizontal: space[4] },
  avatar: {
    width: size.avatarLg,
    height: size.avatarLg,
    marginTop: -40,
    borderRadius: radius.pill,
    borderWidth: 4,
    borderColor: colors.surface,
    backgroundColor: colors.green100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: font.poppinsBold, fontSize: 26, color: colors.green900 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: space[2],
    marginTop: space[2],
  },
  name: { ...text.h1, flexShrink: 1 },
  verified: {
    height: 26,
    borderRadius: radius.pill,
    paddingHorizontal: space[2],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontFamily: font.bodySemi,
    fontSize: 12,
    lineHeight: 16,
    color: colors.green900,
  },
  role: { ...text.body, color: colors.textMuted, marginTop: 2 },
  stats: {
    marginHorizontal: space[4],
    marginTop: space[4],
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    paddingVertical: space[3],
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statValueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statValue: {
    fontFamily: font.poppinsBold,
    fontSize: 20,
    lineHeight: 26,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  statLabel: { ...text.caption },
  statDivider: { width: StyleSheet.hairlineWidth, height: 32, backgroundColor: colors.border },
  block: { paddingHorizontal: space[4], paddingTop: space[5], gap: space[3] },
  blockTitle: { ...text.h3 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  chip: {
    height: 32,
    paddingHorizontal: space[3],
    borderRadius: radius.pill,
    backgroundColor: colors.green50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { ...text.caption, color: colors.green700, fontFamily: font.bodySemi },
  reviewHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  reviewHeaderCopy: { gap: 4, flex: 1 },
  reviewSummary: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  reviewSummaryText: { ...text.caption, color: colors.textMuted },
  readAll: { ...text.caption, color: colors.green700, fontFamily: font.bodySemi, paddingTop: 4 },
  reviews: { gap: space[3] },
  sampleNote: { ...text.caption, color: colors.textMuted },
  sticky: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    paddingHorizontal: space[4],
    paddingTop: space[3],
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    ...shadow.floating,
  },
  stickyCopy: { flex: 1, gap: 1 },
  stickyTitle: { ...text.bodyM, fontFamily: font.bodySemi },
  stickyCaption: { ...text.caption },
  stickyButton: { paddingHorizontal: space[4] },
});
