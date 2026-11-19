import type {
  BookingDraft,
  BookingLocation,
  BookingPayment,
  PaymentMethod,
} from '@/lib/pricing';
import type { SavedBooking } from '@/store/bookings';

const paymentMethods: readonly PaymentMethod[] = [
  'mtn_momo',
  'airtel_money',
  'visa_card',
  'cash',
];
const propertyTypes: readonly BookingLocation['propertyType'][] = [
  'apartment',
  'house',
  'office',
];

const isPaymentMethod = (value?: string): value is PaymentMethod =>
  Boolean(value && paymentMethods.includes(value as PaymentMethod));

const propertyType = (value?: string): BookingLocation['propertyType'] =>
  propertyTypes.includes(value as BookingLocation['propertyType'])
    ? (value as BookingLocation['propertyType'])
    : 'house';

const fallbackLocation = (booking: SavedBooking): BookingLocation | undefined => {
  if (!booking.area && !booking.street) return undefined;
  return {
    area: booking.area ?? '',
    street: booking.street ?? '',
    propertyType: propertyType(booking.propertyType),
    contactName: booking.contactName ?? '',
    contactPhone: booking.phone ?? '',
  };
};

const rebookPayment = (booking: SavedBooking): BookingPayment | undefined => {
  const source = booking.rebook?.payment;
  const method =
    source?.method ??
    (isPaymentMethod(booking.paymentMethod) && booking.paymentMethod !== 'cash'
      ? booking.paymentMethod
      : undefined);
  const balanceMethod =
    source?.balanceMethod ?? (isPaymentMethod(booking.paymentMethod) ? booking.paymentMethod : 'cash');

  if (!method && !source) return undefined;

  return {
    // A fresh deposit amount is recalculated on P12; only the payment preference carries over.
    plan: source?.plan === 'after_service' || !method ? 'after_service' : 'deposit',
    method,
    balanceMethod,
    payerPhone: source?.payerPhone ?? booking.phone,
    savedCardId: source?.savedCardId,
  };
};

/**
 * P18 Rebook. Copies the previous details, add-ons, address and payment preference
 * into a fresh draft; the customer only picks a new date and time on P10.
 */
export function buildRebookDraft(
  booking: SavedBooking,
  options: { sameCleaner?: boolean } = {},
): BookingDraft {
  const source = booking.rebook;

  return {
    serviceSlug: booking.serviceSlug,
    details: source?.details ?? {
      cleaners: booking.cleaners,
      hours: booking.hours,
      frequency: 'once',
      materials: false,
    },
    addOns: source?.addOns ?? [],
    location: source?.location ?? fallbackLocation(booking),
    payment: rebookPayment(booking),
    rebookedFrom: booking.id,
    preferredCleanerId: options.sameCleaner ? booking.cleanerId : undefined,
  };
}
