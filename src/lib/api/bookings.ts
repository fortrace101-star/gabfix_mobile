import { price, type BookingDraft, type PriceBreakdown } from '@/lib/pricing';
import { hasApiBaseUrl } from '@/lib/config';

import { apiRequest } from './client';

export type BookingResult = {
  bookingId: string;
  priceBreakdown: PriceBreakdown;
};

const localBookingId = (): string => {
  const serial = String(Date.now()).slice(-5);
  return `GBX-${serial}`;
};

/**
 * `POST /bookings` with a local fallback until the endpoint is available. The
 * request mirrors the draft so the backend can price the booking again and
 * return its own breakdown (P12 submit sequence, step 2).
 */
export async function createBooking(draft: BookingDraft, total: number): Promise<BookingResult> {
  if (!hasApiBaseUrl) {
    return { bookingId: localBookingId(), priceBreakdown: price(draft) };
  }

  return apiRequest<BookingResult>('/bookings', {
    method: 'POST',
    idempotencyKey: `booking-${Date.now()}-${draft.serviceSlug}`,
    body: {
      serviceSlug: draft.serviceSlug,
      details: draft.details,
      addOns: draft.addOns,
      schedule: draft.schedule,
      location: draft.location,
      payment: draft.payment,
      promoCode: draft.promoCode,
      clientTotal: total,
    },
  });
}
