import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Share2,
  Sparkles,
  X,
} from 'lucide-react-native';
import { useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SummaryBar } from '@/components/booking/summary-bar';
import { ServiceHeroArt } from '@/components/service/service-hero-art';
import { ServicePhoto } from '@/components/service/service-photo';
import { ErrorState } from '@/components/ui/error-state';
import { RetryHint } from '@/components/ui/retry-hint';
import { Skeleton } from '@/components/ui/skeleton';
import { addOns } from '@/config/add-ons';
import { hourlyRate, pricing } from '@/config/pricing';
import { fromHourly, serviceBySlug } from '@/config/services';
import { useServiceContent } from '@/hooks/use-service-content';
import { supportsNativeDriver } from '@/lib/animation';
import { colors, font, radius, shadow, space, text } from '@/theme';
import { ugx } from '@/utils/format';

const priceRows = [
  { label: '2 hours', rate: hourlyRate(2) },
  { label: '3 hours', rate: hourlyRate(3) },
  { label: '4 to 7 hours', rate: hourlyRate(4) },
  { label: '8 hours', rate: hourlyRate(8) },
];

function ServiceLandingSkeleton({ onBack, top }: { onBack: () => void; top: number }) {
  return (
    <View style={styles.screen}>
      <View style={[styles.skeletonHero, { paddingTop: top + space[2] }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          onPress={onBack}
          style={styles.skeletonBack}>
          <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
        </Pressable>
        <Skeleton style={[styles.skeletonLine, styles.skeletonEyebrow]} />
        <Skeleton style={[styles.skeletonLine, styles.skeletonTitle]} />
        <Skeleton style={[styles.skeletonLine, styles.skeletonCaption]} />
      </View>
      <View style={styles.skeletonBody}>
        <Skeleton style={styles.skeletonCard} />
        <Skeleton style={styles.skeletonCard} />
        <Skeleton style={[styles.skeletonLine, styles.skeletonHeading]} />
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} style={[styles.skeletonLine, styles.skeletonRow]} />
        ))}
        <RetryHint />
      </View>
    </View>
  );
}

/** P7 Service landing. Editorial copy comes from `GET /services/{slug}` with a local fallback. */
export default function ServiceLandingScreen() {
  const params = useLocalSearchParams<{ slug?: string }>();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const insets = useSafeAreaInsets();
  const service = serviceBySlug(slug);
  const { content, loading, error, refresh } = useServiceContent(slug);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [scrollY] = useState(() => new Animated.Value(0));
  const heroShift = scrollY.interpolate({
    inputRange: [0, 360],
    outputRange: [0, 110],
    extrapolate: 'clamp',
  });
  // The compact bar fades in once the hero title has scrolled away.
  const headerOpacity = scrollY.interpolate({
    inputRange: [120, 220],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const headerShift = scrollY.interpolate({
    inputRange: [120, 220],
    outputRange: [-8, 0],
    extrapolate: 'clamp',
  });

  const isQuote = service?.pricingMode === 'quote';

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

  if (loading) return <ServiceLandingSkeleton onBack={goBack} top={insets.top} />;

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
        <ErrorState
          title="We couldn't load this service"
          body={error ?? 'The service may have been removed. Try again or browse the catalogue.'}
          onRetry={refresh}
          onContactSupport={() => router.push('/help/contact' as Href)}
        />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: 96 + insets.bottom }]}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: supportsNativeDriver,
        })}>
        <Animated.View style={{ transform: [{ translateY: heroShift }] }}>
          <LinearGradient
            colors={[colors.green700, colors.green500]}
            style={[styles.hero, { paddingTop: insets.top + space[2] }]}>
          <ServiceHeroArt />
          <ServicePhoto
            slug={slug}
            uri={content.heroImage}
            
            cardUri={content.cardImage}
            style={styles.heroImage}
            transition={200}
            priority="high"
          />
          <LinearGradient
            colors={['rgba(22,34,26,0.05)', 'rgba(20,60,29,0.72)']}
            style={styles.heroScrim}
            pointerEvents="none"
          />
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
          </View>
          </LinearGradient>
        </Animated.View>

        <View style={styles.sheet}>
          <Text style={styles.intro} maxFontSizeMultiplier={1.3}>
            {content.intro}
          </Text>

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
            {isQuote ? (
              <View style={styles.card}>
                <Text style={styles.priceNote} maxFontSizeMultiplier={1.3}>
                  Send photos and job details and we quote the work. You approve the price before
                  anything starts.
                </Text>
              </View>
            ) : (
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
            )}
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

        </View>
      </Animated.ScrollView>

      <Animated.View
        pointerEvents="box-none"
        style={[
          styles.fadeHeader,
          {
            paddingTop: insets.top,
            opacity: headerOpacity,
            transform: [{ translateY: headerShift }],
          },
        ]}>
        <View style={styles.fadeBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={6}
            onPress={goBack}
            style={styles.fadeButton}>
            <ArrowLeft size={22} color={colors.text} strokeWidth={2} />
          </Pressable>
          <Text style={styles.fadeTitle} maxFontSizeMultiplier={1.2} numberOfLines={1}>
            {service?.name ?? content.slug}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Share this service"
            hitSlop={6}
            onPress={share}
            style={styles.fadeButton}>
            <Share2 size={20} color={colors.text} strokeWidth={2} />
          </Pressable>
        </View>
      </Animated.View>

      <SummaryBar
        caption={isQuote ? 'Quoted after your photos' : 'From, per hour'}
        total={fromHourly}
        valueLabel={isQuote ? 'Custom quote' : undefined}
        actionLabel={isQuote ? 'Get a quote' : 'Book now'}
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
  heroImage: { ...StyleSheet.absoluteFill },
  heroScrim: { ...StyleSheet.absoluteFill },
  heroBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fadeHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  fadeBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    paddingHorizontal: space[2],
  },
  fadeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fadeTitle: { ...text.h3, flex: 1, fontSize: 16 },
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
  sheet: {
    marginTop: -20,
    paddingTop: space[6],
    paddingHorizontal: space[4],
    gap: space[6],
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    overflow: 'visible',
    zIndex: 1,
  },
  intro: { ...text.bodyL, color: colors.textMuted, marginTop: space[2] },
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
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[3],
    minHeight: 48,
  },
  faqQuestion: { ...text.bodyM, fontFamily: font.bodySemi, flex: 1 },
  faqAnswer: { ...text.caption, lineHeight: 20, paddingBottom: space[2] },
  emptyBack: { position: 'absolute', left: space[4], zIndex: 1, width: 44, height: 44 },
  skeletonHero: {
    minHeight: 210,
    paddingHorizontal: space[4],
    gap: space[3],
    backgroundColor: colors.green50,
    borderBottomLeftRadius: radius.hero,
    borderBottomRightRadius: radius.hero,
  },
  skeletonBack: { width: 44, height: 44 },
  skeletonLine: { borderRadius: radius.input },
  skeletonEyebrow: { width: 110, height: 14 },
  skeletonTitle: { width: '72%', height: 30, marginTop: space[4] },
  skeletonCaption: { width: '88%', height: 18 },
  skeletonBody: { padding: space[4], gap: space[3] },
  skeletonCard: { height: 120, borderRadius: radius.card },
  skeletonHeading: { width: '45%', height: 22, marginTop: space[2] },
  skeletonRow: { height: 18 },
});
