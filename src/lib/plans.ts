import { pricing } from '@/config/pricing';
import type { SavedBooking } from '@/store/bookings';
import type { PlanOverride } from '@/store/plans';

const FREQUENCY_LABELS = {
  weekly: 'Every week',
  severalPerWeek: 'Twice a week',
  monthly: 'Every month',
} as const;

export type RecurringFrequency = keyof typeof FREQUENCY_LABELS;

export type RecurringPlan = {
  bookingId: string;
  serviceName: string;
  serviceSlug: string;
  frequency: RecurringFrequency;
  /** First booked date, used as the recurrence anchor. */
  dateISO?: string;
  startTime?: string;
  cleaners: number;
  hours: number;
  total: number;
  cleanerName?: string;
  /** Percent saved by the recurring frequency. */
  discountPercent: number;
};

export const isRecurringFrequency = (value?: string): value is RecurringFrequency =>
  value === 'weekly' || value === 'severalPerWeek' || value === 'monthly';

export const frequencyLabel = (frequency: RecurringFrequency): string =>
  FREQUENCY_LABELS[frequency];

const pad = (value: number) => String(value).padStart(2, '0');

export const toISODate = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const parseISODate = (iso: string): Date => {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const addDaysISO = (iso: string, days: number): string => {
  const date = parseISODate(iso);
  date.setDate(date.getDate() + days);
  return toISODate(date);
};

const addMonthsISO = (iso: string, months: number): string => {
  const date = parseISODate(iso);
  const day = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + months);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(day, lastDay));
  return toISODate(date);
};

export const weekdayLong = (iso: string): string =>
  parseISODate(iso).toLocaleDateString('en-GB', { weekday: 'long' });

export const shortDate = (iso: string): string =>
  parseISODate(iso).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

const stepPlan = (iso: string, frequency: RecurringFrequency): string => {
  if (frequency === 'monthly') return addMonthsISO(iso, 1);
  // “Twice a week” has no chosen weekdays in this demo, so visits recur every three days.
  return addDaysISO(iso, frequency === 'severalPerWeek' ? 3 : 7);
};

/**
 * P17 next visit. Walks the recurrence from the booked date until it clears today, any pause
 * window and the dates the customer skipped. Returns undefined when the booking has no date.
 */
export function nextVisitISO(
  plan: RecurringPlan,
  override: PlanOverride,
  todayISO = toISODate(new Date()),
): string | undefined {
  if (!plan.dateISO) return undefined;
  let candidate = plan.dateISO;
  let guard = 0;

  while (candidate < todayISO && guard < 500) {
    candidate = stepPlan(candidate, plan.frequency);
    guard += 1;
  }

  if (override.pausedUntil) {
    while (candidate < override.pausedUntil && guard < 800) {
      candidate = stepPlan(candidate, plan.frequency);
      guard += 1;
    }
  }

  while (override.skippedDates.includes(candidate) && guard < 800) {
    candidate = stepPlan(candidate, plan.frequency);
    guard += 1;
  }

  return candidate;
}

export const recurringPlans = (
  bookings: readonly SavedBooking[],
  overrides: Record<string, PlanOverride>,
): RecurringPlan[] =>
  bookings
    .filter((booking) => booking.status !== 'cancelled')
    .filter((booking) => !overrides[booking.id]?.endedAtISO)
    .flatMap((booking) => {
      const frequency = booking.rebook?.details.frequency;
      if (!isRecurringFrequency(frequency)) return [];
      return [
        {
          bookingId: booking.id,
          serviceName: booking.serviceName,
          serviceSlug: booking.serviceSlug,
          frequency,
          dateISO: booking.dateISO,
          startTime: booking.startTime,
          cleaners: booking.cleaners,
          hours: booking.hours,
          total: booking.total,
          cleanerName: booking.cleanerName,
          discountPercent: Math.round(
            (pricing.frequencyDiscounts[frequency] ?? 0) * 100,
          ),
        },
      ];
    });
