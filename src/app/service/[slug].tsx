import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import {
  ArrowLeft,
  CalendarCheck,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SummaryBar } from '@/components/booking/summary-bar';
import { ReviewCard } from '@/components/reviews/review-card';
import { Stars } from '@/components/reviews/stars';
import { addOns } from '@/config/add-ons';
import { reviewsForService } from '@/config/reviews';
import { relatedServices } from '@/config/service-content';
import { hourlyRate, pricing } from '@/config/pricing';
import { fromHourly, serviceBySlug } from '@/config/services';
import { useServiceContent } from '@/hooks/use-service-content';
import { useOnboardingArea } from '@/store/onboarding';
import { colors, font, radius, shadow, space, text } from '@/theme';
import { ugx } from '@/utils/format';

const stampRotation = '-8deg';

const priceRows = [
  { label: '2 hours', rate: hourlyRate(2) },
  { label: '3 hours', rate: hourlyRate(3) },
  { label: '4 to 7 hours', rate: hourlyRate(4) },
  { label: '8 hours', rate: hourlyRate(8) },
];

const steps = [
  { icon: CalendarCheck, title: 'Pick a time', caption: 'Choose a date, start time and how often.' },
  { icon: ShieldCheck, title: 'We match a cleaner', caption: 'A vetted cleaner confirms before the visit.' },
  { icon: Sparkles, title: 'Your clean happens', caption: 'Pay after the service, or in full at checkout.' },
];

function TrustItem({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <View style={styles.trustItem}>
      <View style={styles.trustIcon}>
        <Icon size={18} color={colors.green700} strokeWidth={2} />
      </View>
      <Text style={styles.trustText} maxFontSizeMultiplier={1.3}>
        {label}
      </Text>
    </View>
  );
}

/** P7 Service landing. Editorial copy comes from `GET /services/{slug}` with a local fallback. */
export default function ServiceLandingScreen() {
  const params = useLocalSearchParams<{ slug?: string }>();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const insets = useSafeAreaInsets();
  const area = useOnboardingArea();
  const service = serviceBySlug(slug);
  const { content, error, refresh } = useServiceContent(slug, area?.id);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/services');
  };

  const share = async () => {
    try {
      await Share.share({
        message: `Book ${service?.name ?? 'a cleaning'} on Gabfix: gabfix://service/${slug}`,
      });
    } catch {
      // The user dismissed the share sheet.
    }
  };

  const book = () => {
    router.push({ pathname: '/book/[slug]/details', params: { slug } });
  };

  if (!content) {
    return (
      <View style={styles.screen}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          onPress={goBack}
          style={[styles.emptyBack, { top: insets.top + space[2] }]}>
          <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
        </Pressable>
        <View style={styles.empty}>
          <Text style={styles.emptyTitle} maxFontSizeMultiplier={1.3}>
            We couldn&apos;t load this service
          </Text>
          <Text style={styles.emptyCaption} maxFontSizeMultiplier={1.3}>
            {error ?? 'The service may have been removed. Try again or browse the catalogue.'}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retry loading the service"
            hitSlop={8}
            onPress={refresh}>
            <Text style={styles.retry} maxFontSizeMultiplier={1.3}>
              Retry
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <LinearGradient
          colors={[colors.green700, colors.green500]}
          style={[styles.hero, { paddingTop: insets.top + space[2] }]}>
          <View style={styles.heroBar}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={8}
              onPress={goBack}
              style={styles.heroButton}>
              <ArrowLeft size={22} color={colors.green700} strokeWidth={2} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Share this service"
              hitSlop={8}
              onPress={share}
              style={styles.heroButton}>
              <Share2 size={20} color={colors.green700} strokeWidth={2} />
            </Pressable>
          </View>

          <View style={styles.heroBody}>
            <View style={styles.heroIcon}>
              <Sparkles size={30} color={colors.surface} strokeWidth={2} />
            </View>
            <Text style={styles.heroTitle} maxFontSizeMultiplier={1.2}>
              {service?.name ?? content.slug}
            </Text>
            <View style={styles.ratingChip}>
              <Star size={14} color={colors.yellow500} fill={colors.yellow500} strokeWidth={1.5} />
              <Text style={styles.ratingText} maxFontSizeMultiplier={1.2}>
                {content.rating} · {content.reviewCount} reviews
              </Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.sheet}>
          <View style={styles.stamp} pointerEvents="none">
            <Text style={styles.stampTop}>20% off</Text>
            <Text style={styles.stampBottom}>first clean</Text>
          </View>

          <Text style={styles.intro} maxFontSizeMultiplier={1.3}>
            {content.intro}
          </Text>

          <View style={styles.trust}>
            <TrustItem icon={ShieldCheck} label="Vetted cleaners" />
            <TrustItem icon={Wallet} label="Upfront pricing" />
            <TrustItem icon={Clock} label="Free changes 24 h" />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.3}>
              What&apos;s included
            </Text>
            <View style={styles.card}>
              <View style={styles.checkGrid}>
                {content.includes.map((item) => (
                  <View key={item} style={styles.checkItem}>
                    <Check size={18} color={colors.success} strokeWidth={2.5} />
                    <Text style={styles.checkText} maxFontSizeMultiplier={1.3}>
                      {item}
                    </Text>
                  </View>
                ))}
              </View>
              <View style={styles.divider} />
              <Text style={styles.subheading} maxFontSizeMultiplier={1.2}>
                Not included
              </Text>
              <View style={styles.checkGrid}>
                {content.excludes.map((item) => (
                  <View key={item} style={styles.checkItem}>
                    <X size={18} color={colors.textMuted} strokeWidth={2} />
                    <Text style={[styles.checkText, styles.excludedText]} maxFontSizeMultiplier={1.3}>
                      {item}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.3}>
              Pricing
            </Text>
            <View style={styles.card}>
              <View style={styles.priceHeader}>
                <Text style={styles.priceHeaderText} maxFontSizeMultiplier={1.2}>
                  Booking length
                </Text>
                <Text style={styles.priceHeaderText} maxFontSizeMultiplier={1.2}>
                  Per cleaner
                </Text>
              </View>
              {priceRows.map((row, index) => (
                <View
                  key={row.label}
                  style={[styles.priceRow, index % 2 === 1 && styles.priceRowZebra]}>
                  <Text style={styles.priceLabel} maxFontSizeMultiplier={1.3}>
                    {row.label}
                  </Text>
                  <Text style={styles.priceValue} maxFontSizeMultiplier={1.2}>
                    {ugx(row.rate)}/hr
                  </Text>
                </View>
              ))}
              <Text style={styles.priceNote} maxFontSizeMultiplier={1.3}>
                Materials add {ugx(pricing.materialsPerHour)} per cleaner per hour. VAT is included at
                checkout.
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.3}>
              Popular extras
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.addOns}>
              {addOns.map((addOn) => {
                const Icon = addOn.icon;
                return (
                  <View key={addOn.id} style={styles.addOnCard}>
                    <View style={styles.addOnIcon}>
                      <Icon size={20} color={colors.green500} strokeWidth={2} />
                    </View>
                    <Text style={styles.addOnTitle} maxFontSizeMultiplier={1.3}>
                      {addOn.name}
                    </Text>
                    <Text style={styles.addOnMeta} maxFontSizeMultiplier={1.2}>
                      +{pricing.addOnMinutes} min · +{ugx(pricing.addOns[addOn.id].price)}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.3}>
              How it works
            </Text>
            <View style={styles.timeline}>
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <View key={step.title} style={styles.timelineRow}>
                    <View style={styles.timelineMark}>
                      <View style={styles.timelineCircle}>
                        <Icon size={16} color={colors.surface} strokeWidth={2} />
                      </View>
                      {index < steps.length - 1 ? <View style={styles.timelineLine} /> : null}
                    </View>
                    <View style={styles.timelineBody}>
                      <Text style={styles.timelineTitle} maxFontSizeMultiplier={1.3}>
                        {step.title}
                      </Text>
                      <Text style={styles.timelineCaption} maxFontSizeMultiplier={1.3}>
                        {step.caption}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.reviewSectionHeader}>
              <View style={styles.reviewSummary}>
                <Text style={styles.ratingBig} maxFontSizeMultiplier={1.2}>
                  {content.rating}
                </Text>
                <View style={styles.reviewSummaryBody}>
                  <Stars value={content.rating} />
                  <Text style={styles.reviewCount} maxFontSizeMultiplier={1.3}>
                    {content.reviewCount} verified reviews
                  </Text>
                </View>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Read all reviews"
                hitSlop={8}
                onPress={() => router.push(`/service/${slug}/reviews` as Href)}
                style={styles.readAll}>
                <Text style={styles.readAllText} maxFontSizeMultiplier={1.2}>
                  Read all reviews
                </Text>
                <ChevronRight size={14} color={colors.green700} strokeWidth={2} />
              </Pressable>
            </View>
            {reviewsForService(slug)
              .slice(0, 3)
              .map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.3}>
              Questions
            </Text>
            <View style={styles.card}>
              {content.faqs.map((faq, index) => {
                const open = openFaq === index;
                return (
                  <View key={faq.question}>
                    {index > 0 ? <View style={styles.divider} /> : null}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={faq.question}
                      accessibilityState={{ expanded: open }}
                      onPress={() => setOpenFaq(open ? null : index)}
                      style={styles.faqHeader}>
                      <Text style={styles.faqQuestion} maxFontSizeMultiplier={1.3}>
                        {faq.question}
                      </Text>
                      {open ? (
                        <ChevronUp size={20} color={colors.textMuted} strokeWidth={2} />
                      ) : (
                        <ChevronDown size={20} color={colors.textMuted} strokeWidth={2} />
                      )}
                    </Pressable>
                    {open ? (
                      <Text style={styles.faqAnswer} maxFontSizeMultiplier={1.3}>
                        {faq.answer}
                      </Text>
                    ) : null}
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.3}>
              Related services
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.addOns}>
              {relatedServices(slug).map((related) => (
                <Pressable
                  key={related.slug}
                  accessibilityRole="button"
                  accessibilityLabel={`${related.name}. From ${ugx(fromHourly)} per hour`}
                  onPress={() =>
                    router.push({ pathname: '/service/[slug]', params: { slug: related.slug } })
                  }
                  style={({ pressed }) => [styles.relatedCard, pressed && styles.relatedPressed]}>
                  <Text style={styles.relatedName} maxFontSizeMultiplier={1.3}>
                    {related.name}
                  </Text>
                  <Text style={styles.relatedPrice} maxFontSizeMultiplier={1.2}>
                    From {ugx(fromHourly)}/hr
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </ScrollView>

      <SummaryBar
        caption="From, per hour"
        total={fromHourly}
        actionLabel="Book now"
        onPress={book}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: space[6] },
  hero: {
    minHeight: 250,
    paddingHorizontal: space[4],
    paddingBottom: space[6],
  },
  heroBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBody: { flex: 1, justifyContent: 'flex-end', gap: space[2], marginTop: space[8] },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.tile,
    backgroundColor: colors.whiteOverlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontFamily: font.heading,
    fontSize: 30,
    lineHeight: 36,
    color: colors.surface,
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    height: 28,
    paddingHorizontal: space[3],
    borderRadius: radius.pill,
    backgroundColor: 'rgba(22,34,26,0.35)',
  },
  ratingText: { ...text.caption, color: colors.surface, fontFamily: font.bodySemi },
  sheet: {
    marginTop: -20,
    paddingTop: space[6],
    paddingHorizontal: space[4],
    gap: space[6],
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
  },
  stamp: {
    position: 'absolute',
    top: -38,
    right: space[4],
    width: 76,
    height: 76,
    borderRadius: radius.pill,
    borderWidth: 3,
    borderColor: colors.surface,
    backgroundColor: colors.yellow500,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: stampRotation }],
    ...shadow.card,
  },
  stampTop: { fontFamily: font.heading, fontSize: 14, color: colors.green900 },
  stampBottom: { fontFamily: font.bodySemi, fontSize: 9, color: colors.green900 },
  intro: { ...text.bodyL, color: colors.textMuted, marginTop: space[2] },
  trust: {
    flexDirection: 'row',
    gap: space[2],
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: space[3],
    ...shadow.card,
  },
  trustItem: { flex: 1, alignItems: 'center', gap: 6 },
  trustIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.green50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustText: { ...text.caption, fontSize: 11, textAlign: 'center' },
  section: { gap: space[3] },
  sectionTitle: { ...text.h2 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: space[4],
    gap: space[3],
    ...shadow.card,
  },
  checkGrid: { gap: space[3] },
  checkItem: { flexDirection: 'row', alignItems: 'flex-start', gap: space[2] },
  checkText: { ...text.body, flex: 1, lineHeight: 21 },
  excludedText: { color: colors.textMuted },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  subheading: { ...text.caption, fontFamily: font.bodySemi, color: colors.textMuted },
  priceHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  priceHeaderText: { ...text.caption, fontFamily: font.bodySemi, color: colors.textMuted },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 32,
    paddingHorizontal: space[2],
    marginHorizontal: -space[2],
    borderRadius: 8,
  },
  priceRowZebra: { backgroundColor: colors.green50 },
  priceLabel: { ...text.body },
  priceValue: { ...text.bodyM, fontFamily: font.bodySemi, fontVariant: ['tabular-nums'] },
  priceNote: { ...text.caption },
  addOns: { gap: space[3], paddingRight: space[4] },
  addOnCard: {
    width: 200,
    gap: space[2],
    padding: space[3],
    borderRadius: radius.tile,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  addOnIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.green50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addOnTitle: { ...text.bodyM, fontFamily: font.bodySemi },
  addOnMeta: { ...text.caption },
  timeline: { gap: 0 },
  timelineRow: { flexDirection: 'row', gap: space[3] },
  timelineMark: { alignItems: 'center', width: 32 },
  timelineCircle: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.green500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineLine: { flex: 1, width: 2, backgroundColor: colors.green100, minHeight: space[5] },
  timelineBody: { flex: 1, gap: 2, paddingBottom: space[4] },
  timelineTitle: { ...text.bodyM, fontFamily: font.bodySemi },
  timelineCaption: { ...text.caption },
  reviewSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[2],
  },
  reviewSummary: { flexDirection: 'row', alignItems: 'center', gap: space[3], flex: 1 },
  readAll: { flexDirection: 'row', alignItems: 'center', gap: 1 },
  readAllText: {
    ...text.caption,
    color: colors.green700,
    fontFamily: font.bodySemi,
  },
  ratingBig: {
    fontFamily: font.poppinsBold,
    fontSize: 40,
    lineHeight: 46,
    color: colors.text,
  },
  reviewSummaryBody: { gap: 2 },
  reviewCount: { ...text.caption },
  stars: { flexDirection: 'row', gap: 2 },
  reviewCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: space[4],
    gap: space[2],
    ...shadow.card,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.green100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: font.poppinsSemi, fontSize: 14, color: colors.green900 },
  reviewWho: { flex: 1, gap: 2 },
  reviewName: { ...text.bodyM, fontFamily: font.bodySemi },
  reviewDate: { ...text.caption },
  reviewComment: { ...text.body, color: colors.textMuted, lineHeight: 21 },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[3],
    minHeight: 48,
  },
  faqQuestion: { ...text.bodyM, fontFamily: font.bodySemi, flex: 1 },
  faqAnswer: { ...text.caption, lineHeight: 20, paddingBottom: space[2] },
  relatedCard: {
    width: 200,
    gap: space[2],
    padding: space[4],
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    ...shadow.card,
  },
  relatedPressed: { backgroundColor: colors.green50 },
  relatedName: { ...text.bodyM, fontFamily: font.bodySemi },
  relatedPrice: { ...text.caption, color: colors.green700 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space[3], padding: space[6] },
  emptyTitle: { ...text.h3, textAlign: 'center' },
  emptyCaption: { ...text.caption, textAlign: 'center' },
  retry: { ...text.bodyM, fontFamily: font.bodySemi, color: colors.green700 },
  emptyBack: { position: 'absolute', left: space[4], zIndex: 1, width: 44, height: 44 },
});
