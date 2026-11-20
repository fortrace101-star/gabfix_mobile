import { API_BASE_URL, hasApiBaseUrl } from '@/lib/config';
import { apiRequest } from '@/lib/api/client';
import type { LiveTrackingPayload } from '@/lib/tracking';

/** Polling endpoint for P15c when the WebSocket is unavailable. */
export const TRACKING_POLL_INTERVAL_MS = 10_000;

const toWsBase = (baseUrl: string): string => {
  if (baseUrl.startsWith('https://')) return `wss://${baseUrl.slice('https://'.length)}`;
  if (baseUrl.startsWith('http://')) return `ws://${baseUrl.slice('http://'.length)}`;
  return baseUrl;
};

/** Build the WebSocket URL for a booking's live tracking feed. */
export function trackingWsUrl(bookingId: string): string | null {
  if (!hasApiBaseUrl) return null;
  return `${toWsBase(API_BASE_URL)}/ws/bookings/${encodeURIComponent(bookingId)}`;
}

/** Fetch the current tracking state as a polling fallback. */
export async function fetchTracking(bookingId: string): Promise<LiveTrackingPayload | null> {
  if (!hasApiBaseUrl) return null;
  return apiRequest<LiveTrackingPayload>(`/bookings/${encodeURIComponent(bookingId)}/tracking`, {
    method: 'GET',
  });
}
