import { router } from 'expo-router';
import { CalendarDays, MoreHorizontal, Repeat, UserRound, Users } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RescheduleSheet } from '@/components/booking/reschedule-sheet';
import { slotLabel } from '@/components/booking/slot-chips';
import { PlanSheet } from '@/components/booking/plan-sheet';
import { TopBar } from '@/components/ui/top-bar';
import { Button } from '@/components/ui/button';
import {
  frequencyLabel,
  nextVisitISO,
  parseISODate,
  type RecurringPlan,
  recurringPlans,
  shortDate,
  weekdayLong,
} from '@/lib/plans';
import { useBookings, useBookingsHydrated } from '@/store/bookings';
import { getPlanOverride, usePlanOverrides, usePlansHydrated } from '@/store/plans';
import { colors, font, radius, shadow, space, text } from '@/theme';
import { ugx } from '@/utils/format';

const planCadence = (plan: RecurringPlan): string => {
  if (plan.frequency === 'weekly' && plan.dateISO) return `Every ${weekdayLong(plan.dateISO)}`;
  if (plan.frequency === 'monthly' && plan.dateISO) {
    return `Monthly on the ${parseISODate(plan.dateISO).getDate()}`;
  }
  return frequencyLabel(plan.frequency);
};

const initialsOf = (name?: string): string =>
  name
    ?.split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') ?? '';

function PlanCard({
  plan,
  nextVisit,
  pausedUntil,
  onManage,
}: {
  plan: RecurringPlan;
  nextVisit?: string;
  pausedUntil?: string;
  onManage: () => void;
}) {
  const initials = initialsOf(plan.cleanerName);
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.pill}>
          <Repeat size={14} color={colors.green700} strokeWidth={2} />
          <Text style={styles.pillText} maxFontSizeMultiplier={1.2}>
            {planCadence(plan)}
          </Text>
        </View>
        {plan.discountPercent > 0 ? (
          <View style={styles.discount}>
            <Text style={styles.discountText} maxFontSizeMultiplier={1.2}>
              Save {plan.discountPercent}%
            </Text>
          </View>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Manage ${plan.serviceName} plan`}
          hitSlop={8}
          onPress={onManage}
          style={styles.more}>
          <MoreHorizontal size={22} color={colors.textMuted} strokeWidth={2} />
        </Pressable>
      </View>

      <Text style={styles.cardTitle} maxFontSizeMultiplier={1.3}>
        {plan.serviceName}
      </Text>
      <Text style={styles.cardSubtitle} maxFontSizeMultiplier={1.3}>
        {plan.startTime ? slotLabel(plan.startTime) : 'Time to confirm'} · {plan.hours} h ·{' '}
        {plan.cleaners} cleaner{plan.cleaners === 1 ? '' : 's'}
      </Text>

      <View style={styles.nextRow}>
        <CalendarDays size={16} color={colors.green700} strokeWidth={2} />
        <Text style={styles.nextText} maxFontSizeMultiplier={1.3}>
          {pausedUntil
            ? `Paused until ${shortDate(pausedUntil)}`
            : nextVisit
              ? `Next visit ${shortDate(nextVisit)}`
              : 'No next visit — choose a day or time'}
        </Text>
      </View>

      <View style={styles.cleanerRow}>
        <View style={styles.avatar}>
          {initials ? (
            <Text style={styles.avatarText} maxFontSizeMultiplier={1.2}>
              {initials}
            </Text>
          ) : (
            <Users size={16} color={colors.green700} strokeWidth={2} />
          )}
        </View>
        <View style={styles.cleanerCopy}>
          <Text style={styles.cleanerName} maxFontSizeMultiplier={1.3} numberOfLines={1}>
            {plan.cleanerName ?? 'Cleaner to be assigned'}
          </Text>
          <Text style={styles.cleanerNote} maxFontSizeMultiplier={1.2}>
            Same cleaner for every visit
          </Text>
        </View>
        <Text style={styles.total} maxFontSizeMultiplier={1.3}>
          {ugx(plan.total)}
        </Text>
      </View>
    </View>
  );
}

/** P17 Recurring plans, derived from bookings with a recurring frequency. */
export default function PlansScreen() {
  const bookings = useBookings();
  const bookingsHydrated = useBookingsHydrated();
  const overrides = usePlanOverrides();
  const plansHydrated = usePlansHydrated();
  // Keep the selected plan while its sheet is open: ending it removes it from the derived list.
  const [managingPlan, setManagingPlan] = useState<RecurringPlan | null>(null);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);

  const plans = useMemo(() => recurringPlans(bookings, overrides), [bookings, overrides]);
  const sorted = useMemo(
    () =>
      [...plans].sort((a, b) => {
        const left = nextVisitISO(a, getPlanOverride(a.bookingId)) ?? '9999-12-31';
        const right = nextVisitISO(b, getPlanOverride(b.bookingId)) ?? '9999-12-31';
        return left.localeCompare(right);
      }),
    [plans],
  );

  const managing = managingPlan;
  const managingOverride = managing ? getPlanOverride(managing.bookingId) : { skippedDates: [] };
  const managingNext = managing
    ? nextVisitISO(managing, managingOverride)
    : undefined;
  const rescheduleBooking = rescheduleId ? bookings.find((item) => item.id === rescheduleId) : undefined;

  const ready = bookingsHydrated && plansHydrated;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <TopBar title="Recurring plans" onBack={() => router.back()} />
      <FlatList
        data={ready ? sorted : []}
        keyExtractor={(item) => item.bookingId}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          ready && sorted.length === 0 && styles.contentEmpty,
        ]}
        ListHeaderComponent={
          ready && sorted.length > 0 ? (
            <View style={styles.ruleBanner}>
              <View style={styles.ruleIcon}>
                <UserRound size={18} color={colors.green700} strokeWidth={2} />
              </View>
              <View style={styles.ruleCopy}>
                <Text style={styles.ruleTitle} maxFontSizeMultiplier={1.3}>
                  Same cleaner for every visit
                </Text>
                <Text style={styles.ruleBody} maxFontSizeMultiplier={1.3}>
                  {sorted.some((plan) => plan.cleanerName)
                    ? 'We keep your preferred cleaner on every visit. Changes are subject to availability.'
                    : "We'll arrange the best match and let you know before the first visit."}
                </Text>
              </View>
            </View>
          ) : undefined
        }
        renderItem={({ item }) => {
          const override = getPlanOverride(item.bookingId);
          return (
            <PlanCard
              plan={item}
              nextVisit={nextVisitISO(item, override)}
              pausedUntil={override.pausedUntil}
              onManage={() => setManagingPlan(item)}
            />
          );
        }}
        ListEmptyComponent={
          ready ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Repeat size={28} color={colors.green700} strokeWidth={2} />
              </View>
              <Text style={styles.emptyTitle} maxFontSizeMultiplier={1.3}>
                No recurring plans yet
              </Text>
              <Text style={styles.emptyBody} maxFontSizeMultiplier={1.3}>
                Book a weekly or monthly clean and it will appear here, with the same cleaner and
                your recurring discount.
              </Text>
              <Button label="Browse services" onPress={() => router.push('/(tabs)/services')} />
            </View>
          ) : undefined
        }
      />

      <PlanSheet
        plan={managing}
        override={managingOverride}
        nextVisit={managingNext}
        visible={Boolean(managing)}
        onClose={() => setManagingPlan(null)}
        onChangeDayTime={() => {
          if (managing) setRescheduleId(managing.bookingId);
        }}
      />

      <RescheduleSheet
        booking={rescheduleBooking ?? null}
        visible={Boolean(rescheduleBooking)}
        onClose={() => setRescheduleId(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space[4], paddingBottom: 120, gap: space[3] },
  contentEmpty: { flexGrow: 1, justifyContent: 'center' },
  ruleBanner: {
    flexDirection: 'row',
    gap: space[3],
    backgroundColor: colors.green50,
    borderRadius: radius.card,
    padding: space[4],
    marginBottom: space[1],
  },
  ruleIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.tile,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleCopy: { flex: 1, gap: 2 },
  ruleTitle: { ...text.bodyM, fontFamily: font.bodySemi, color: colors.green900 },
  ruleBody: { ...text.caption, color: colors.green700 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: space[4],
    gap: space[2],
    ...shadow.card,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.green50,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pillText: { ...text.caption, color: colors.green700, fontFamily: font.bodySemi },
  discount: {
    backgroundColor: colors.yellow50,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  discountText: { ...text.caption, fontSize: 11, color: colors.yellow800, fontFamily: font.bodySemi },
  more: { marginLeft: 'auto', width: 40, height: 40, alignItems: 'flex-end', justifyContent: 'center' },
  cardTitle: { ...text.h3, color: colors.text },
  cardSubtitle: { ...text.caption, color: colors.textMuted },
  nextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.bg,
    borderRadius: radius.input,
    paddingHorizontal: space[3],
    paddingVertical: 10,
  },
  nextText: { ...text.bodyM, color: colors.green900, flex: 1 },
  cleanerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    paddingTop: space[2],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.green50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...text.caption, color: colors.green900, fontFamily: font.bodySemi },
  cleanerCopy: { flex: 1, gap: 1 },
  cleanerName: { ...text.bodyM, color: colors.text, fontFamily: font.bodySemi },
  cleanerNote: { ...text.caption, color: colors.textMuted },
  total: { ...text.bodyM, color: colors.text, fontFamily: font.bodySemi },
  empty: { alignItems: 'center', paddingHorizontal: space[6], gap: space[2] },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.green50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space[1],
  },
  emptyTitle: { ...text.h3, color: colors.text, textAlign: 'center' },
  emptyBody: { ...text.bodyM, color: colors.textMuted, textAlign: 'center', marginBottom: space[2] },
});
