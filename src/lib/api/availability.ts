import { apiRequest } from '@/lib/api/client';
import { hasApiBaseUrl } from '@/lib/config';

export type Slot = {
  /** 24-hour start time, for example `"09:00"`. */
  time: string;
  available: boolean;
  /** Seats left; drives the "Few left" hint. */
  remaining?: number;
};

type AvailabilityResponse = { slots?: Slot[] };

export type AvailabilityQuery = {
  serviceSlug: string;
  areaId?: string;
  dateISO: string;
};

const firstHour = 7;
const lastHour = 16;

/**
 * Local slot grid used until the backend is reachable: hourly 07:00–16:00 with a
 * date-dependent mix of free, low and fully booked slots.
 */
export const localSlots = (dateISO: string): Slot[] => {
  const seed = Array.from(dateISO).reduce((sum, char) => sum + char.charCodeAt(0), 0);

  return Array.from({ length: lastHour - firstHour + 1 }, (_, index) => {
    const hour = firstHour + index;
    const remaining = (seed + hour * 7) % 6;
    return {
      time: `${String(hour).padStart(2, '0')}:00`,
      available: remaining > 0,
      remaining,
    };
  });
};

/** `GET /availability?service=&areaId=&date=` (Part 2, P10) with a local fallback. */
export async function getAvailability({
  serviceSlug,
  areaId,
  dateISO,
}: AvailabilityQuery): Promise<readonly Slot[]> {
  if (!hasApiBaseUrl) return localSlots(dateISO);

  const params = new URLSearchParams({ service: serviceSlug, date: dateISO });
  if (areaId) params.set('areaId', areaId);

  const data = await apiRequest<AvailabilityResponse>(`/availability?${params.toString()}`);
  return Array.isArray(data?.slots) ? data.slots : localSlots(dateISO);
}
