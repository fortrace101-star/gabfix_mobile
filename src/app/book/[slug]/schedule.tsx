import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, ChevronRight, Clock, Info, Repeat, Users, X } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { DateStrip, toISODate } from '@/components/booking/date-strip';
import { SlotChips, slotLabel } from '@/components/booking/slot-chips';
import { StepperHeader } from '@/components/booking/stepper-header';
import { SummaryBar } from '@/components/booking/summary-bar';
import { TopBar } from '@/components/ui/top-bar';
import { serviceBySlug } from '@/config/services';
import { useAvailability } from '@/hooks/use-availability';
import { price, type BookingFrequency } from '@/lib/pricing';
import {
  getBookingDraft,
  patchDraft,
  resetDraft,
  startDraft,
  useBookingDraft,
} from '@/store/booking';
import { useOnboardingArea } from '@/store/onboarding';
import { colors, font, radius, space, text } from '@/theme';

const daysAhead = 30;
const leadHours = 3;

const parseISODate = (iso: string): Date => {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const buildDays = (): Date[] => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  return Array.from({ length: daysAhead }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
};

const sameDay = (iso: string, date: Date): boolean => iso === toISODate(date);

/** Today when a slot can still start three hours out, otherwise tomorrow. */
const defaultDateISO = (): string => {
  const now = new Date();
  const earliest = now.getHours() * 60 + now.getMinutes() + leadHours * 60;
  const date = new Date(now);
  if (earliest > 16 * 60) date.setDate(date.getDate() + 1);
  return toISODate(date);
};

const monthLabel = (date: Date): string =>
  date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

const repeatSummary = (
  frequency: BookingFrequency,
  dateISO: string,
  startTime: string,
): string | null => {
  if (frequency === 'once') return null;

  const date = parseISODate(dateISO);
  const start = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const time = slotLabel(startTime);
  const weekday = date.toLocaleDateString('en-GB', { weekday: 'long' });

  switch (frequency) {
    case 'weekly':
      return `Every ${weekday} at ${time} · starting ${start}`;
    case 'severalPerWeek':
      return `2–3 visits a week at ${time} · starting ${start}`;
    case 'monthly':
      return `Monthly on day ${date.getDate()} at ${time} · starting ${start}`;
    default:
      return `Repeats at ${time} · starting ${start}`;
  }
};

/**
 * P10 Schedule. Date strip plus slot grid for the draft service; slots come from
 * `GET /availability` with a local grid until the backend is configured.
 */
export default function ScheduleScreen() {
  const params = useLocalSearchParams<{ slug?: string }>();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const draft = useBookingDraft();
  const area = useOnboardingArea();
  const service = serviceBySlug(slug);
  const active = draft && draft.serviceSlug === slug ? draft : null;

  const [days] = useState(buildDays);
  const [selectedISO, setSelectedISO] = useState(
    () => getBookingDraft()?.schedule?.dateISO ?? defaultDateISO(),
  );
  const [selectedTime, setSelectedTime] = useState<string | null>(
    () => getBookingDraft()?.schedule?.startTime ?? null,
  );

  const { slots, loading, error, refresh } = useAvailability(
    slug,
    selectedISO,
    area?.id,
    active?.preferredCleanerId,
  );

  useEffect(() => {
    if (!slug) return;
    const current = getBookingDraft();
    if (!current || current.serviceSlug !== slug) startDraft(slug);
  }, [slug]);

  const leave = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  }, []);

  const confirmClose = useCallback(() => {
    Alert.alert('Save as draft?', 'Your choices are kept so you can finish booking later.', [
      { text: 'Keep editing', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          resetDraft();
          leave();
        },
      },
      { text: 'Save draft', onPress: leave },
    ]);
  }, [leave]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      confirmClose();
      return true;
    });
    return () => subscription.remove();
  }, [confirmClose]);

  if (!active) return <View style={styles.screen} />;

  const today = new Date();
  const isToday = sameDay(selectedISO, today);
  const selectedDate = parseISODate(selectedISO);
  const index = days.findIndex((day) => toISODate(day) === selectedISO);
  const earliestToday = today.getTime() + leadHours * 60 * 60 * 1000;

  const visibleSlots = slots.filter((slot) => {
    if (!isToday) return true;
    const [hour, minute] = slot.time.split(':').map(Number);
    const start = new Date(selectedDate);
    start.setHours(hour, minute, 0, 0);
    return start.getTime() >= earliestToday;
  });

  const quote = price(active);
  const summary = selectedTime
    ? repeatSummary(active.details.frequency, selectedISO, selectedTime)
    : null;
  const caption = selectedTime
    ? `${selectedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · ${slotLabel(selectedTime)}`
    : 'Pick a date and time';

  const onSelectDate = (iso: string) => {
    setSelectedISO(iso);
    setSelectedTime(null);
    patchDraft({ schedule: undefined });
  };

  const onSelectTime = (time: string) => {
    setSelectedTime(time);
    patchDraft({ schedule: { dateISO: selectedISO, startTime: time } });
  };

  const shiftWeek = (direction: -1 | 1) => {
    const target = days[index + direction * 7];
    if (!target) return;
    onSelectDate(toISODate(target));
  };

  const onNext = () => {
    router.push({ pathname: '/book/[slug]/location', params: { slug } });
  };

  return (
    <View style={styles.screen}>
      <TopBar
        title={service?.name ?? 'Schedule'}
        onBack={leave}
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close and save options"
            hitSlop={8}
            onPress={confirmClose}
            style={styles.close}>
            <X size={22} color={colors.text} strokeWidth={2} />
          </Pressable>
        }
      />
      <StepperHeader current={1} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.intro}>
          <Text style={styles.title} maxFontSizeMultiplier={1.3}>
            Pick a date and time
          </Text>
          <Text style={styles.subtitle} maxFontSizeMultiplier={1.3}>
            Availability updates as you choose.
          </Text>
        </View>

        {active.rebookedFrom ? (
          <View style={styles.rebook}>
            <Repeat size={18} color={colors.green700} strokeWidth={2} />
            <Text style={styles.rebookText} maxFontSizeMultiplier={1.3}>
              Details, extras and address copied from booking {active.rebookedFrom}. Choose a new
              time to continue.
            </Text>
          </View>
        ) : null}

        <View style={styles.monthRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Previous week"
            accessibilityState={{ disabled: index < 7 }}
            disabled={index < 7}
            onPress={() => shiftWeek(-1)}
            style={[styles.monthButton, index < 7 && styles.monthButtonOff]}>
            <ChevronLeft size={20} color={index < 7 ? colors.disabledText : colors.text} />
          </Pressable>
          <Text style={styles.month} maxFontSizeMultiplier={1.2}>
            {monthLabel(selectedDate)}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next week"
            accessibilityState={{ disabled: index < 0 || index + 7 >= days.length }}
            disabled={index < 0 || index + 7 >= days.length}
            onPress={() => shiftWeek(1)}
            style={[
              styles.monthButton,
              (index < 0 || index + 7 >= days.length) && styles.monthButtonOff,
            ]}>
            <ChevronRight
              size={20}
              color={index < 0 || index + 7 >= days.length ? colors.disabledText : colors.text}
            />
          </Pressable>
        </View>

        <DateStrip days={days} selectedISO={selectedISO} onSelect={onSelectDate} />

        <View style={styles.slots}>
          <Text style={styles.label} maxFontSizeMultiplier={1.3}>
            Start time
          </Text>

          {active.preferredCleanerId ? (
            <View style={styles.note}>
              <Users size={16} color={colors.textMuted} strokeWidth={2} />
              <Text style={styles.noteText} maxFontSizeMultiplier={1.3}>
                Showing times for your preferred cleaner. Not available? We&apos;ll suggest similar
                cleaners.
              </Text>
            </View>
          ) : null}

          {isToday ? (
            <View style={styles.note}>
              <Info size={16} color={colors.textMuted} strokeWidth={2} />
              <Text style={styles.noteText} maxFontSizeMultiplier={1.3}>
                Same-day requests start at least {leadHours} hours from now.
              </Text>
            </View>
          ) : null}

          {error ? (
            <View style={styles.error}>
              <Text style={styles.errorText} maxFontSizeMultiplier={1.3}>
                {error}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Retry loading times"
                hitSlop={8}
                onPress={refresh}>
                <Text style={styles.errorLink} maxFontSizeMultiplier={1.3}>
                  Retry
                </Text>
              </Pressable>
            </View>
          ) : null}

          {loading ? (
            <View style={styles.skeletonGrid} accessibilityLabel="Checking availability">
              {Array.from({ length: 6 }, (_, index) => (
                <View key={index} style={styles.skeletonChip} />
              ))}
            </View>
          ) : visibleSlots.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText} maxFontSizeMultiplier={1.3}>
                {active.preferredCleanerId
                  ? "Your preferred cleaner has no times on this day. Try another date and we'll suggest similar cleaners."
                  : 'No times left for this day. Try another date.'}
              </Text>
            </View>
          ) : (
            <SlotChips slots={visibleSlots} value={selectedTime} onSelect={onSelectTime} />
          )}
        </View>

        {summary ? (
          <View style={styles.repeat}>
            <Repeat size={18} color={colors.green700} strokeWidth={2} />
            <View style={styles.repeatBody}>
              <Text style={styles.repeatTitle} maxFontSizeMultiplier={1.3}>
                {summary}
              </Text>
              <Text style={styles.repeatCaption} maxFontSizeMultiplier={1.3}>
                You can skip or reschedule any visit.
              </Text>
            </View>
          </View>
        ) : null}

        <View style={styles.banner}>
          <Clock size={18} color={colors.green700} strokeWidth={2} />
          <Text style={styles.bannerText} maxFontSizeMultiplier={1.3}>
            Free to change or cancel up to 24 hours before.
          </Text>
        </View>
      </ScrollView>

      <SummaryBar
        caption={caption}
        total={quote.total}
        actionLabel="Next"
        onPress={onNext}
        disabled={!selectedTime}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  close: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  content: { paddingVertical: space[4], paddingBottom: space[8], gap: space[4] },
  intro: { paddingHorizontal: space[4], gap: space[1] },
  title: { ...text.h2 },
  subtitle: { ...text.caption },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space[4],
  },
  monthButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  monthButtonOff: { backgroundColor: colors.disabledBg },
  month: { ...text.h3 },
  slots: { paddingHorizontal: space[4], gap: space[3], marginTop: space[1] },
  label: { ...text.h3 },
  note: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  rebook: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[2],
    backgroundColor: colors.successBg,
    borderRadius: radius.input,
    padding: space[3],
    marginHorizontal: space[4],
  },
  rebookText: { ...text.bodyM, color: colors.green700, flex: 1 },
  noteText: { ...text.caption, flex: 1 },
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  skeletonChip: {
    width: '31%',
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.disabledBg,
  },
  empty: {
    borderRadius: radius.input,
    backgroundColor: colors.surface,
    padding: space[3],
  },
  emptyText: { ...text.caption },
  error: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[3],
    backgroundColor: colors.errorBg,
    borderRadius: radius.input,
    padding: space[3],
  },
  errorText: { ...text.caption, color: colors.error, flex: 1 },
  errorLink: { ...text.bodyM, fontFamily: font.bodySemi, color: colors.error, fontSize: 13 },
  repeat: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[2],
    backgroundColor: colors.successBg,
    borderRadius: radius.input,
    padding: space[3],
    marginHorizontal: space[4],
  },
  repeatBody: { flex: 1, gap: 2 },
  repeatTitle: { ...text.bodyM, color: colors.green700, fontFamily: font.bodySemi },
  repeatCaption: { ...text.caption, color: colors.green700 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    backgroundColor: colors.surface,
    borderRadius: radius.input,
    padding: space[3],
    marginHorizontal: space[4],
  },
  bannerText: { ...text.caption, flex: 1 },
});
