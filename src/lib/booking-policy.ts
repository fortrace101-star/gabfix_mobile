import { minimumDeposit } from '@/config/payments';
import type { SavedBooking } from '@/store/bookings';

/** Free changes and cancellations need at least this much notice. */
export const FREE_CHANGE_HOURS = 24;

const parseISODate = (iso: string): Date => {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/** Start of the appointment, or null when the booking has no schedule yet. */
export function bookingStart(booking: SavedBooking): Date | null {
  if (!booking.dateISO) return null;
  const date = parseISODate(booking.dateISO);
  if (booking.startTime) {
    const [hours, minutes] = booking.startTime.split(':').map(Number);
    date.setHours(hours, minutes, 0, 0);
  } else {
    date.setHours(0, 0, 0, 0);
  }
  return date;
}

/** Hours from now until the appointment (negative when it has already started). */
export function hoursUntilStart(booking: SavedBooking): number | null {
  const start = bookingStart(booking);
  if (!start) return null;
  return (start.getTime() - Date.now()) / (60 * 60 * 1000);
}

/** True when the customer is still outside the 24-hour window. */
export function isFreeChangeWindow(booking: SavedBooking): boolean {
  const hours = hoursUntilStart(booking);
  return hours === null ? true : hours > FREE_CHANGE_HOURS;
}

/**
 * Dummy late-fee rule (Part 2, 3.1): the fee equals the deposit amount, capped
 * at what has actually been paid. Cash bookings with nothing paid owe it on
 * their account instead.
 */
export function lateFeeFor(booking: SavedBooking): number {
  if (booking.paid <= 0) return minimumDeposit(booking.total);
  return Math.min(booking.paid, minimumDeposit(booking.total));
}

export type CancellationOutcome = {
  withinWindow: boolean;
  lateFee: number;
  refund: number;
  /** True when the fee is charged to the account instead of deducted. */
  chargedToAccount: boolean;
};

export function cancellationOutcome(booking: SavedBooking): CancellationOutcome {
  if (isFreeChangeWindow(booking)) {
    return { withinWindow: false, lateFee: 0, refund: booking.paid, chargedToAccount: false };
  }

  const chargedToAccount = booking.paid <= 0;
  const lateFee = chargedToAccount ? minimumDeposit(booking.total) : lateFeeFor(booking);
  return {
    withinWindow: true,
    lateFee,
    refund: chargedToAccount ? 0 : Math.max(booking.paid - lateFee, 0),
    chargedToAccount,
  };
}

export const paymentMethodLabel = (method?: string): string =>
  method === 'mtn_momo'
    ? 'MTN Mobile Money'
    : method === 'airtel_money'
      ? 'Airtel Money'
      : method === 'visa_card'
        ? 'Visa card'
        : method === 'cash'
          ? 'cash'
          : 'the original payment method';
