import { price, type BookingDraft, type PriceBreakdown } from '@/lib/pricing';
import { hasApiBaseUrl } from '@/lib/config';

import { apiRequest } from './client';

export type UploadTarget = {
  /** BookingMedia.id from the draft. */
  clientId: string;
  /** Server id used when the upload completes. */
  mediaId: string;
  /** Pre-signed one-file URL; the URL itself is the credential. */
  uploadUrl: string;
  headers?: Record<string, string>;
  expiresAtISO: string;
};

export type BookingResult = {
  bookingId: string;
  priceBreakdown: PriceBreakdown;
  /** Present when the backend accepted media metadata and issued targets. */
  uploads?: UploadTarget[];
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
      scope: draft.scope,
      media: (draft.media?.items ?? []).map(({ id, kind, mimeType, sizeBytes, width, height, durationSec }) => ({
        clientId: id,
        kind,
        mimeType,
        bytes: sizeBytes,
        width,
        height,
        durationMs: durationSec ? durationSec * 1000 : undefined,
      })),
      clientTotal: total,
    },
  });
}
