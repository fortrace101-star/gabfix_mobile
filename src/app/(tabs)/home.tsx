import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import {
  Bell,
  ChevronDown,
  ChevronRight,
  MapPin,
  Navigation,
  Repeat,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Timer,
} from 'lucide-react-native';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  RefreshControl,
  ScrollView,
  type ScrollViewInstance,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Blob } from '@/components/auth/blob';
import { slotLabel } from '@/components/booking/slot-chips';
import { ServicePhoto } from '@/components/service/service-photo';
import { Stars } from '@/components/reviews/stars';
import { useServices } from '@/hooks/use-services';
import { useStatusBarStyle } from '@/hooks/use-status-bar-style';
import { buildRebookDraft } from '@/lib/rebook';
import { price } from '@/lib/pricing';
import { cleaners } from '@/config/cleaners';
import { offers } from '@/config/offers';
import { reviewsForService } from '@/config/reviews';
import { fromHourly, serviceBySlug, serviceCategories } from '@/config/services';
import { startRebookDraft, useBookingDraft } from '@/store/booking';
import {
  type SavedBooking,
  hydrateBookings,
  useBookings,
} from '@/store/bookings';
import { useNotificationsHydrated, useUnreadNotificationCount } from '@/store/notifications';
import { useOnboardingUserName } from '@/store/onboarding';
import { useAddresses } from '@/store/addresses';
import { useAuthUser } from '@/store/session';
import { auth, base, colors, font, radius, shadow, space, text } from '@/theme';
import { ugx } from '@/utils/format';

const bookingStart = (booking: SavedBooking): number => {
  if (!booking.dateISO) return Number.MAX_SAFE_INTEGER;
  const [year, month, day] = booking.dateISO.split('-').map(Number);
  const [hour, minute] = (booking.startTime ?? '00:00').split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute).getTime();
};

const bookingWhen = (booking: SavedBooking): string => {
  if (!booking.dateISO) return 'Time to confirm';
  const date = new Date(bookingStart(booking)).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  return booking.startTime ? `${date} · ${slotLabel(booking.startTime)}` : date;
};

const bookingDay = (booking: SavedBooking): string => {
  if (!booking.dateISO) return 'Recent clean';
  return new Date(bookingStart(booking)).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
};

const trust = [
  { icon: ShieldCheck, label: 'Vetted cleaners' },
  { icon: Timer, label: 'Free cancellation' },
  { icon: Sparkles, label: 'Satisfaction promise' },
] as const;

/** How long each promo stays on screen before the carousel advances. */
const OFFER_INTERVAL_MS = 4_500;
/** Keep autoplay out of the way for a moment after the customer swipes. */
const OFFER_RESUME_DELAY_MS = 6_000;

/** P4 Home tab shell. Discovery data is still local; `GET /home` replaces it in Phase 3. */
export default function HomeTab() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  useStatusBarStyle('light');

  const addresses = useAddresses();
  const defaultAddress = addresses.find((address) => address.isDefault) ?? addresses[0];
  const addressLabel = defaultAddress
    ? [defaultAddress.area, defaultAddress.street].filter(Boolean).join(' · ')
    : '';
  const userName = useOnboardingUserName();
  const user = useAuthUser();
  const draft = useBookingDraft();
  const notificationsReady = useNotificationsHydrated();
  const unreadNotifications = useUnreadNotificationCount();
  const { services, refresh: refreshServices } = useServices();
  const bookings = useBookings();
  const [refreshing, setRefreshing] = useState(false);
  const [activeOffer, setActiveOffer] = useState(0);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    refreshServices();
    try {
      await hydrateBookings();
    } finally {
      setRefreshing(false);
    }
  }, [refreshServices]);

  const nextBooking = useMemo(() => {
    const upcoming = bookings.filter((booking) => booking.status === 'upcoming');
    return upcoming.sort((a, b) => bookingStart(a) - bookingStart(b))[0];
  }, [bookings]);
  const lastRebookable = useMemo(
    () =>
      bookings
        .filter((booking) => booking.status !== 'upcoming')
        .slice()
        .sort((a, b) => b.createdAtISO.localeCompare(a.createdAtISO))[0],
    [bookings],
  );
  const homeReviews = reviewsForService('home-clean').slice(0, 4);

  const displayName = userName?.trim() || user?.name?.trim() || 'there';
  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'G';

  const rebook = (booking: SavedBooking) => {
    startRebookDraft(buildRebookDraft(booking));
    router.push({
      pathname: '/book/[slug]/schedule',
      params: { slug: booking.serviceSlug },
    });
  };

  const draftService = serviceBySlug(draft?.serviceSlug);
  const draftTotal = draft ? price(draft).total : 0;
  const cardWidth = (width - space[4] * 2 - space[3]) / 2;
  const offerWidth = width - space[4] * 2;
  const offerStep = offerWidth + space[3];
  const offerCarousel = useRef<ScrollViewInstance>(null);
  const activeOfferRef = useRef(0);
  const offerPauseUntil = useRef(0);

  const goToOffer = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(offers.length - 1, index));
      activeOfferRef.current = clamped;
      setActiveOffer(clamped);
      offerCarousel.current?.scrollTo({ x: clamped * offerStep, animated: true });
    },
    [offerStep],
  );

  useFocusEffect(
    useCallback(() => {
      if (offers.length < 2) return undefined;
      const timer = setInterval(() => {
        if (Date.now() < offerPauseUntil.current) return;
        const next = (activeOfferRef.current + 1) % offers.length;
        goToOffer(next);
      }, OFFER_INTERVAL_MS);
      return () => clearInterval(timer);
    }, [goToOffer]),
  );

  const onOfferScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / offerStep);
    const clamped = Math.max(0, Math.min(offers.length - 1, next));
    activeOfferRef.current = clamped;
    if (clamped !== activeOffer) setActiveOffer(clamped);
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        refreshControl={
          <RefreshControl
            colors={[colors.green500]}
            onRefresh={onRefresh}
            refreshing={refreshing}
            tintColor={colors.green500}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}>
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
                accessibilityLabel={
                  unreadNotifications > 0
                    ? `Notifications, ${unreadNotifications} unread`
                    : 'Notifications'
                }
                hitSlop={8}
                onPress={() => router.push('/notifications')}
                style={styles.bell}>
                <Bell size={20} color={colors.surface} strokeWidth={2} />
                {notificationsReady && unreadNotifications > 0 ? (
                  <View style={styles.bellDot} />
                ) : null}
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
            accessibilityLabel={defaultAddress ? `Address: ${addressLabel}. Change address` : 'Set your address'}
            onPress={() => router.push('/addresses')}
            style={styles.areaPill}>
            <MapPin size={14} color={colors.surface} strokeWidth={2} />
            <Text style={styles.areaText} maxFontSizeMultiplier={1.3} numberOfLines={1}>
              {defaultAddress ? addressLabel : 'Set your address'}
            </Text>
            <ChevronDown size={14} color={colors.surface} strokeWidth={2} />
          </Pressable>
        </LinearGradient>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Search cleaning services"
          onPress={() => router.push('/search')}
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
                <ChevronRight size={14} color={colors.green700} strokeWidth={2} />
              </View>
            </Pressable>
          ) : null}

          {offers.length > 0 ? (
            <View style={styles.offerBlock}>
              <ScrollView
                ref={offerCarousel}
                horizontal
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                disableIntervalMomentum
                snapToAlignment="start"
                snapToInterval={offerStep}
                onScroll={onOfferScroll}
                onScrollBeginDrag={() => {
                  offerPauseUntil.current = Date.now() + OFFER_RESUME_DELAY_MS;
                }}
                scrollEventThrottle={16}
                style={styles.offerScroll}
                contentContainerStyle={styles.offerRow}>
                {offers.map((offer) => (
                  <Pressable
                    key={offer.code}
                    accessibilityRole="button"
                    accessibilityLabel={`${offer.title}. ${offer.discountLabel} off. Code ${offer.code}. Open offers`}
                    onPress={() => router.push('/offers')}
                    style={[styles.offer, { width: offerWidth }]}>
                    <LinearGradient
                      colors={[colors.yellow500, colors.yellow600]}
                      end={{ x: 1, y: 1 }}
                      start={{ x: 0, y: 0 }}
                      style={styles.offerInner}>
                      <View style={styles.offerCircle} />
                      <View style={styles.offerCopy}>
                        <Text
                          style={styles.offerTitle}
                          maxFontSizeMultiplier={1.3}
                          numberOfLines={2}>
                          {offer.title}
                        </Text>
                        <Text style={styles.offerCaption} maxFontSizeMultiplier={1.2}>
                          {offer.caption}
                        </Text>
                        <View style={styles.offerCode}>
                          <Text style={styles.offerCodeLabel} maxFontSizeMultiplier={1.2}>
                            CODE
                          </Text>
                          <Text style={styles.offerCodeText} maxFontSizeMultiplier={1.2}>
                            {offer.code}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.offerBadge}>
                        <Text style={styles.offerDiscount} maxFontSizeMultiplier={1.2}>
                          {offer.discountLabel}
                        </Text>
                        <Text style={styles.offerOff} maxFontSizeMultiplier={1.2}>
                          OFF
                        </Text>
                      </View>
                    </LinearGradient>
                  </Pressable>
                ))}
              </ScrollView>
              {offers.length > 1 ? (
                <View
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  style={styles.offerDots}>
                  {offers.map((offer, index) => (
                    <View
                      key={offer.code}
                      style={[styles.offerDot, index === activeOffer && styles.offerDotActive]}
                    />
                  ))}
                </View>
              ) : null}
            </View>
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

          <View style={styles.sectionBlock}>
            <View style={base.between}>
              <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.3}>
                Top cleaners
              </Text>
              <Text style={styles.sectionCaption} maxFontSizeMultiplier={1.2}>
                Vetted pros near you
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.cleanerScroll}
              contentContainerStyle={styles.cleanerRow}>
              {cleaners.map((cleaner) => (
                <Pressable
                  key={cleaner.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${cleaner.name}, rated ${cleaner.rating.toFixed(1)} from ${cleaner.jobsDone} jobs`}
                  onPress={() =>
                    router.push({ pathname: '/cleaner/[id]', params: { id: cleaner.id } })
                  }
                  style={({ pressed }) => [styles.cleanerCard, pressed && styles.cleanerPressed]}>
                  <View style={styles.cleanerAvatar}>
                    <Text style={styles.cleanerInitials} maxFontSizeMultiplier={1.2}>
                      {cleaner.initials}
                    </Text>
                  </View>
                  <View style={styles.ratingRow}>
                    <Star size={12} color={colors.yellow500} fill={colors.yellow500} strokeWidth={2} />
                    <Text style={styles.rating} maxFontSizeMultiplier={1.2}>
                      {cleaner.rating.toFixed(1)}
                    </Text>
                    <Text style={styles.jobs} maxFontSizeMultiplier={1.2} numberOfLines={1}>
                      · {cleaner.jobsDone} jobs
                    </Text>
                  </View>
                  <Text style={styles.cleanerName} maxFontSizeMultiplier={1.3} numberOfLines={1}>
                    {cleaner.name}
                  </Text>
                  <Text style={styles.cleanerSkill} maxFontSizeMultiplier={1.2} numberOfLines={1}>
                    {cleaner.skills[0]}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

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
            {services.map((service) => (
              <Pressable
                key={service.slug}
                accessibilityRole="button"
                accessibilityLabel={`${service.name}. From ${ugx(fromHourly)} per hour`}
                onPress={() =>
                  router.push({
                    pathname: '/service/[slug]',
                    params: { slug: service.slug },
                  })
                }
                style={[styles.serviceCard, { width: cardWidth }]}>
                <ServicePhoto
                  slug={service.slug}
                  cardUri={service.cardImage}
                  
                  style={styles.servicePhoto}
                />
                <LinearGradient
                  colors={['rgba(11,28,17,0.02)', 'rgba(11,28,17,0.32)', 'rgba(11,28,17,0.82)']}
                  locations={[0, 0.45, 1]}
                  style={styles.serviceScrim}
                  pointerEvents="none"
                />
                {service.tag ? (
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>{service.tag}</Text>
                  </View>
                ) : null}
                <Text style={styles.serviceName} maxFontSizeMultiplier={1.3} numberOfLines={2}>
                  {service.name}
                </Text>
                <Text style={styles.servicePrice} maxFontSizeMultiplier={1.3}>
                  From {ugx(fromHourly)}/hr
                </Text>
              </Pressable>
            ))}
          </View>

          {serviceCategories.map((category) => {
            const categoryServices = services.filter(
              (service) => service.category === category.id,
            );
            if (categoryServices.length === 0) return null;

            return (
              <View key={category.id} style={styles.sectionBlock}>
                <View style={base.between}>
                  <View style={styles.categoryHeading}>
                    <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.3}>
                      {category.label}
                    </Text>
                    <Text style={styles.sectionCaption} maxFontSizeMultiplier={1.2}>
                      {category.caption}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`See all ${category.label}`}
                    hitSlop={8}
                    onPress={() => router.push('/(tabs)/services')}>
                    <Text style={styles.seeAll} maxFontSizeMultiplier={1.3}>
                      See all
                    </Text>
                  </Pressable>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.categoryScroll}
                  contentContainerStyle={styles.categoryRow}>
                  {categoryServices.map((service) => (
                    <Pressable
                      key={service.slug}
                      accessibilityRole="button"
                      accessibilityLabel={`${service.name}. From ${ugx(fromHourly)} per hour`}
                      onPress={() =>
                        router.push({
                          pathname: '/service/[slug]',
                          params: { slug: service.slug },
                        })
                      }
                      style={({ pressed }) => [
                        styles.categoryCard,
                        pressed && styles.cleanerPressed,
                      ]}>
                      <ServicePhoto
                        slug={service.slug}
                        cardUri={service.cardImage}
                        
                        style={styles.categoryPhoto}
                      />
                      <View style={styles.categoryBody}>
                        <Text
                          style={styles.categoryName}
                          maxFontSizeMultiplier={1.3}
                          numberOfLines={2}>
                          {service.name}
                        </Text>
                        <Text style={styles.categoryPrice} maxFontSizeMultiplier={1.3}>
                          From {ugx(fromHourly)}/hr
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            );
          })}

          {lastRebookable ? (
            <View style={styles.rebookCard}>
              <View style={styles.rebookAvatar}>
                <Repeat size={20} color={colors.yellow800} strokeWidth={2} />
              </View>
              <View style={styles.rebookBody}>
                <Text style={styles.draftKicker} maxFontSizeMultiplier={1.3}>
                  Book again
                </Text>
                <Text style={styles.draftTitle} maxFontSizeMultiplier={1.3} numberOfLines={1}>
                  {lastRebookable.serviceName}
                </Text>
                <Text style={styles.draftMeta} maxFontSizeMultiplier={1.2} numberOfLines={1}>
                  {lastRebookable.cleanerName
                    ? `${lastRebookable.cleanerName} · `
                    : ''}
                  {bookingDay(lastRebookable)}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Book ${lastRebookable.serviceName} again`}
                onPress={() => rebook(lastRebookable)}
                style={styles.rebookAction}>
                <Text style={styles.rebookActionText} maxFontSizeMultiplier={1.2}>
                  Book again
                </Text>
              </Pressable>
            </View>
          ) : null}

          {nextBooking ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Next booking: ${nextBooking.serviceName}. View details`}
              onPress={() => router.push(`/booking/${nextBooking.id}` as never)}
              style={styles.upcomingCard}>
              <View style={styles.upcomingTop}>
                <View style={styles.rebookBody}>
                  <Text style={styles.draftKicker} maxFontSizeMultiplier={1.3}>
                    Next clean
                  </Text>
                  <Text style={styles.draftTitle} maxFontSizeMultiplier={1.3} numberOfLines={1}>
                    {nextBooking.serviceName}
                  </Text>
                  <Text style={styles.draftMeta} maxFontSizeMultiplier={1.2} numberOfLines={1}>
                    {bookingWhen(nextBooking)}
                    {nextBooking.area ? ` · ${nextBooking.area}` : ''}
                  </Text>
                </View>
                <View style={styles.confirmedPill}>
                  <Text style={styles.confirmedText} maxFontSizeMultiplier={1.2}>
                    Confirmed
                  </Text>
                </View>
              </View>
              <View style={styles.upcomingActions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Track booking ${nextBooking.id}`}
                  onPress={(event) => {
                    event.stopPropagation();
                    router.push(`/booking/${nextBooking.id}/track` as never);
                  }}
                  style={styles.trackButton}>
                  <Navigation size={14} color={colors.surface} strokeWidth={2.2} />
                  <Text style={styles.trackText} maxFontSizeMultiplier={1.2}>
                    Track
                  </Text>
                </Pressable>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsText} maxFontSizeMultiplier={1.2}>
                    View details
                  </Text>
                  <ChevronRight size={18} color={colors.green700} strokeWidth={2} />
                </View>
              </View>
            </Pressable>
          ) : null}

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
                <Text style={styles.stepCopy} maxFontSizeMultiplier={1.3} numberOfLines={3}>
                  {item.copy}
                </Text>
              </View>
            ))}
          </View>

          {homeReviews.length > 0 ? (
            <View style={styles.sectionBlock}>
              <View style={base.between}>
                <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.3}>
                  Loved by customers
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Read all home cleaning reviews"
                  hitSlop={8}
                  onPress={() =>
                    router.push({
                      pathname: '/service/[slug]/reviews',
                      params: { slug: 'home-clean' },
                    })
                  }>
                  <Text style={styles.seeAll} maxFontSizeMultiplier={1.3}>
                    All reviews
                  </Text>
                </Pressable>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.reviewScroll}
                contentContainerStyle={styles.reviewRow}>
                {homeReviews.map((review) => (
                  <View key={review.id} style={[styles.reviewCard, { width: width * 0.78 }]}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.reviewAvatar}>
                        <Text style={styles.reviewInitials} maxFontSizeMultiplier={1.2}>
                          {review.initials}
                        </Text>
                      </View>
                      <Text
                        style={styles.reviewName}
                        maxFontSizeMultiplier={1.3}
                        numberOfLines={1}>
                        {review.name}
                      </Text>
                      <Text style={styles.reviewDate} maxFontSizeMultiplier={1.2}>
                        {review.date}
                      </Text>
                    </View>
                    <Stars value={review.stars} size={14} />
                    <Text
                      style={styles.reviewComment}
                      maxFontSizeMultiplier={1.3}
                      numberOfLines={3}>
                      {review.comment || 'Rated the clean without a comment.'}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : null}
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
    backgroundColor: colors.warningBg,
    borderRadius: radius.card,
    padding: space[4],
    ...shadow.card,
  },
  draftBody: { flex: 1, gap: 2 },
  draftKicker: {
    ...text.caption,
    color: colors.yellow800,
    fontFamily: font.bodySemi,
  },
  draftTitle: { ...text.h3 },
  draftMeta: { ...text.caption },
  resume: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 36,
    paddingHorizontal: space[3],
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  resumeText: { ...text.caption, fontFamily: font.bodySemi, color: colors.green700 },
  offerBlock: { gap: space[2] },
  offerScroll: { marginHorizontal: -space[4] },
  offerRow: { paddingHorizontal: space[4], gap: space[3] },
  offer: { borderRadius: radius.card, overflow: 'hidden' },
  offerInner: {
    minHeight: 116,
    borderRadius: radius.card,
    padding: space[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    overflow: 'hidden',
  },
  offerCircle: {
    position: 'absolute',
    right: -24,
    top: -12,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  offerCopy: { flex: 1, gap: 3 },
  offerTitle: {
    fontFamily: font.poppinsSemi,
    fontSize: 17,
    lineHeight: 23,
    color: colors.green900,
  },
  offerCaption: {
    ...text.caption,
    color: colors.green900,
  },
  offerCode: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: space[1],
    height: 24,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(17,60,29,0.4)',
    backgroundColor: 'rgba(255,255,255,0.32)',
  },
  offerCodeLabel: {
    fontFamily: font.bodySemi,
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 0.8,
    color: colors.green900,
    opacity: 0.7,
  },
  offerCodeText: {
    fontFamily: font.bodySemi,
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0.5,
    color: colors.green900,
  },
  offerBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    flexShrink: 0,
    backgroundColor: colors.green700,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  offerDiscount: {
    fontFamily: font.poppinsBold,
    fontSize: 19,
    lineHeight: 23,
    color: colors.surface,
  },
  offerOff: {
    fontFamily: font.bodySemi,
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 1,
    color: colors.surface,
  },
  offerDots: { flexDirection: 'row', alignSelf: 'center', gap: 6, marginTop: 2 },
  offerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.green100 },
  offerDotActive: { width: 18, backgroundColor: colors.green500 },
  categoryHeading: { flex: 1, gap: 2 },
  categoryScroll: { marginHorizontal: -space[4] },
  categoryRow: { paddingHorizontal: space[4], gap: space[3] },
  categoryCard: {
    width: 160,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    ...shadow.card,
  },
  categoryPhoto: { width: '100%', height: 92, backgroundColor: colors.green50 },
  categoryBody: { padding: space[3], gap: space[1] },
  categoryName: {
    fontFamily: font.bodySemi,
    fontSize: 14,
    lineHeight: 19,
    color: colors.text,
  },
  categoryPrice: { ...text.caption, color: colors.green700 },
  rebookCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    backgroundColor: colors.warningBg,
    borderRadius: radius.card,
    padding: space[4],
    ...shadow.card,
  },
  rebookAvatar: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rebookBody: { flex: 1, gap: 2 },
  rebookAction: {
    minHeight: 40,
    paddingHorizontal: space[3],
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rebookActionText: {
    ...text.caption,
    fontFamily: font.bodySemi,
    color: colors.green700,
  },
  upcomingCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: space[4],
    gap: space[3],
    borderWidth: 1,
    borderColor: colors.green100,
    ...shadow.card,
  },
  upcomingTop: { flexDirection: 'row', alignItems: 'flex-start', gap: space[3] },
  confirmedPill: {
    height: 24,
    paddingHorizontal: space[2],
    borderRadius: radius.pill,
    backgroundColor: colors.green50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmedText: {
    fontFamily: font.bodySemi,
    fontSize: 11,
    lineHeight: 15,
    color: colors.green700,
  },
  upcomingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: space[2],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.green500,
    paddingHorizontal: space[3],
  },
  trackText: {
    fontFamily: font.bodySemi,
    fontSize: 12,
    lineHeight: 16,
    color: colors.surface,
  },
  detailsRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  detailsText: { ...text.bodyM, color: colors.green700, fontFamily: font.bodySemi },
  reviewScroll: { marginHorizontal: -space[4] },
  reviewRow: { paddingHorizontal: space[4], gap: space[3] },
  reviewCard: {
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    padding: space[4],
    gap: space[2],
    ...shadow.card,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  reviewAvatar: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.green100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewInitials: {
    fontFamily: font.poppinsSemi,
    fontSize: 12,
    lineHeight: 16,
    color: colors.green900,
  },
  reviewName: { ...text.bodyM, fontFamily: font.bodySemi, flex: 1 },
  reviewDate: { ...text.caption, fontSize: 11, lineHeight: 15 },
  reviewComment: { ...text.caption, lineHeight: 19 },
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
  sectionBlock: { gap: space[3] },
  sectionTitle: { ...text.h2 },
  sectionCaption: { ...text.caption },
  seeAll: { ...text.bodyM, fontFamily: font.bodySemi, color: colors.green500 },
  cleanerScroll: { marginHorizontal: -space[4] },
  cleanerRow: { paddingHorizontal: space[4], gap: space[3] },
  cleanerCard: {
    width: 150,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    padding: space[3],
    gap: space[1],
    ...shadow.card,
  },
  cleanerPressed: { opacity: 0.8 },
  cleanerAvatar: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.green100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space[1],
  },
  cleanerInitials: {
    fontFamily: font.poppinsSemi,
    fontSize: 15,
    lineHeight: 21,
    color: colors.green900,
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  rating: {
    fontFamily: font.bodySemi,
    fontSize: 12,
    lineHeight: 16,
    color: colors.text,
  },
  jobs: { ...text.caption, fontSize: 11, lineHeight: 15, flexShrink: 1 },
  cleanerName: { fontFamily: font.bodySemi, fontSize: 14, lineHeight: 19, color: colors.text },
  cleanerSkill: { ...text.caption, fontSize: 11, lineHeight: 15 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space[3] },
  serviceCard: {
    aspectRatio: 1.05,
    borderRadius: radius.card,
    backgroundColor: colors.green700,
    padding: space[3],
    gap: space[2],
    justifyContent: 'flex-end',
    overflow: 'hidden',
    ...shadow.card,
  },
  servicePhoto: { ...StyleSheet.absoluteFill },
  serviceScrim: { ...StyleSheet.absoluteFill },
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
  serviceName: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 20, color: colors.surface },
  servicePrice: { ...text.caption, color: colors.surface, opacity: 0.85 },
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
