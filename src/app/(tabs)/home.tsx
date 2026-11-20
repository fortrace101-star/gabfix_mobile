import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Building2,
  MapPin,
  Navigation,
  Repeat,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Timer,
} from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Blob } from '@/components/auth/blob';
import { slotLabel } from '@/components/booking/slot-chips';
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
  useBookingsHydrated,
} from '@/store/bookings';
import { useNotificationsHydrated, useUnreadNotificationCount } from '@/store/notifications';
import { useOnboardingArea, useOnboardingUserName } from '@/store/onboarding';
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

/** P4 Home tab shell. Discovery data is still local; `GET /home` replaces it in Phase 3. */
export default function HomeTab() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  useStatusBarStyle('light');

  const area = useOnboardingArea();
  const userName = useOnboardingUserName();
  const user = useAuthUser();
  const draft = useBookingDraft();
  const notificationsReady = useNotificationsHydrated();
  const unreadNotifications = useUnreadNotificationCount();
  const { services, refresh: refreshServices } = useServices(area?.id);
  const bookings = useBookings();
  const bookingsReady = useBookingsHydrated();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    refreshServices();
    try {
      await hydrateBookings();
    } finally {
      setRefreshing(false);
    }
  }, [refreshServices]);

  const isNewCustomer = bookingsReady && bookings.length === 0;
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
  const welcomeOffer = offers[0];

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
                <ChevronRight size={16} color={colors.green500} strokeWidth={2} />
              </View>
            </Pressable>
          ) : null}

          {isNewCustomer && welcomeOffer ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${welcomeOffer.title}. Open offers`}
              onPress={() => router.push('/offers')}
              style={styles.offer}>
              <LinearGradient
                colors={[colors.yellow500, colors.yellow600]}
                end={{ x: 1, y: 1 }}
                start={{ x: 0, y: 0 }}
                style={styles.offerInner}>
                <View style={styles.offerCircle} />
                <Text style={styles.offerTitle} maxFontSizeMultiplier={1.3}>
                  {welcomeOffer.title}
                </Text>
                <Text style={styles.offerCaption} maxFontSizeMultiplier={1.3}>
                  {welcomeOffer.caption} · Code {welcomeOffer.code}
                </Text>
              </LinearGradient>
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
            {services.map((service, index) => (
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
                      <View style={styles.categoryIcon}>
                        {category.id === 'property' ? (
                          <Building2 size={24} color={colors.green500} strokeWidth={2} />
                        ) : (
                          <Sparkles size={24} color={colors.green500} strokeWidth={2} />
                        )}
                      </View>
                      <Text
                        style={styles.categoryName}
                        maxFontSizeMultiplier={1.3}
                        numberOfLines={2}>
                        {service.name}
                      </Text>
                      <Text style={styles.categoryPrice} maxFontSizeMultiplier={1.3}>
                        From {ugx(fromHourly)}/hr
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            );
          })}

          {lastRebookable ? (
            <View style={styles.rebookCard}>
              <View style={styles.rebookAvatar}>
                <Repeat size={20} color={colors.green700} strokeWidth={2} />
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
  offer: { borderRadius: radius.card, overflow: 'hidden' },
  offerInner: {
    minHeight: 104,
    borderRadius: radius.card,
    padding: space[4],
    gap: space[1],
    justifyContent: 'center',
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
  offerTitle: {
    fontFamily: font.poppinsSemi,
    fontSize: 17,
    lineHeight: 23,
    color: colors.green900,
    maxWidth: '78%',
  },
  offerCaption: {
    ...text.caption,
    color: colors.green900,
    maxWidth: '78%',
  },
  categoryHeading: { flex: 1, gap: 2 },
  categoryScroll: { marginHorizontal: -space[4] },
  categoryRow: { paddingHorizontal: space[4], gap: space[3] },
  categoryCard: {
    width: 160,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    padding: space[3],
    gap: space[2],
    ...shadow.card,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.tile,
    backgroundColor: colors.green50,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: space[4],
    ...shadow.card,
  },
  rebookAvatar: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.green50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rebookBody: { flex: 1, gap: 2 },
  rebookAction: {
    minHeight: 40,
    paddingHorizontal: space[3],
    borderRadius: radius.pill,
    backgroundColor: colors.green500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rebookActionText: {
    fontFamily: font.bodySemi,
    fontSize: 12,
    lineHeight: 16,
    color: colors.surface,
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
