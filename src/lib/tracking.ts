import type { SavedBooking } from '@/store/bookings';

export type TrackingPhase = 0 | 1 | 2 | 3;
export type TrackingSource = 'estimated' | 'live';

export type GeoPoint = {
  lat: number;
  lng: number;
};

export type TrackingState = {
  phase: TrackingPhase;
  /** Route progress from the cleaner's start point to the destination (0 to 1). */
  progress: number;
  /** Large text in the tracking sheet. */
  eta: string;
  /** Supporting sentence below the ETA. */
  detail: string;
  /** Whether the cleaner is currently en route (enough to show a live affordance). */
  live: boolean;
};

export type LiveCleaner = {
  id?: string;
  name?: string;
  initials?: string;
  phone?: string;
  lat?: number;
  lng?: number;
};

export type LiveTrackingPayload = {
  /** Booking status from the backend. */
  status?: 'confirmed' | 'on_the_way' | 'in_progress' | 'completed' | 'cancelled';
  /** Progress along the route to the destination (0 to 1). */
  routeProgress?: number;
  /** Estimated minutes until arrival; null/undefined when not applicable. */
  etaMinutes?: number | null;
  /** Human-readable ETA, preferred over etaMinutes when present. */
  etaText?: string;
  /** Supporting sentence for the sheet. */
  detail?: string;
  /** Cleaner location and contact details. */
  cleaner?: LiveCleaner;
  /** Destination coordinates/label for a native map, when available. */
  destination?: GeoPoint & { label?: string };
  /** ISO timestamp for the update (informational). */
  updatedAt?: string;
};

export type ResolvedTracking = {
  state: TrackingState;
  source: TrackingSource;
  cleanerName?: string;
  cleanerInitials?: string;
  cleanerPhone?: string;
  cleanerLocation?: GeoPoint;
  destination?: GeoPoint & { label?: string };
  updatedAt?: string;
};

const parseStart = (booking: SavedBooking): Date | undefined => {
  if (!booking.dateISO || !booking.startTime) return undefined;
  const [year, month, day] = booking.dateISO.split('-').map(Number);
  const [hour, minute] = booking.startTime.split(':').map(Number);
  if ([year, month, day, hour, minute].some((part) => Number.isNaN(part))) return undefined;
  return new Date(year, month - 1, day, hour, minute, 0, 0);
};

const timeLabel = (date: Date): string =>
  date.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' });

const dayLabel = (date: Date): string =>
  date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const toFiniteNumber = (value: unknown): number | undefined => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
  return value;
};

const initialsFor = (name: string): string =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

export function phaseForStatus(status: LiveTrackingPayload['status']): TrackingPhase | undefined {
  switch (status) {
    case 'confirmed':
      return 0;
    case 'on_the_way':
      return 1;
    case 'in_progress':
      return 2;
    case 'completed':
      return 3;
    case 'cancelled':
      return 0;
    default:
      return undefined;
  }
}

const etaFromMinutes = (minutes: number): string => {
  const rounded = Math.max(0, Math.round(minutes));
  if (rounded <= 1) return 'Arriving now';
  return `Arriving in ${rounded} min`;
};

const isTerminalPhase = (phase: TrackingPhase): boolean => phase === 3;

/**
 * P15c: estimate the tracking state from the saved booking.
 *
 * Used as the offline/default view and as the baseline for live updates.
 * When the live tracking contract is available, `applyLiveTracking()` merges a
 * `/ws/bookings/{id}` or `GET /bookings/{id}/tracking` payload over this state.
 */
export function trackingStateFor(booking: SavedBooking, now = new Date()): TrackingState {
  if (booking.status === 'cancelled') {
    return {
      phase: 0,
      progress: 0,
      eta: 'Tracking unavailable',
      detail: 'This booking was cancelled.',
      live: false,
    };
  }

  if (booking.status === 'completed') {
    return {
      phase: 3,
      progress: 1,
      eta: 'Clean completed',
      detail: 'This clean has finished. You can rate your cleaner from the booking details.',
      live: false,
    };
  }

  const start = parseStart(booking);
  if (!start) {
    return {
      phase: 0,
      progress: 0,
      eta: 'Time to confirm',
      detail: 'Tracking starts once your appointment time is confirmed.',
      live: false,
    };
  }

  const end = new Date(start.getTime() + Math.max(0.5, booking.hours) * 60 * 60 * 1000);
  const minutesUntilStart = (start.getTime() - now.getTime()) / 60000;

  if (now >= end) {
    return {
      phase: 3,
      progress: 1,
      eta: 'Clean completed',
      detail: 'This clean has finished. You can rate your cleaner from the booking details.',
      live: false,
    };
  }

  if (now >= start) {
    return {
      phase: 2,
      progress: 1,
      eta: 'Cleaning in progress',
      detail: `Started at ${timeLabel(start)}. Your cleaner is working through the checklist.`,
      live: false,
    };
  }

  if (minutesUntilStart > 90) {
    return {
      phase: 0,
      progress: 0,
      eta: `Scheduled for ${dayLabel(start)} · ${timeLabel(start)}`,
      detail: 'Tracking opens 90 minutes before your clean.',
      live: false,
    };
  }

  const minutes = Math.max(1, Math.ceil(minutesUntilStart));
  return {
    phase: 1,
    progress: clamp(1 - minutesUntilStart / 90, 0.18, 0.96),
    eta: minutes <= 1 ? 'Arriving now' : `Arriving in ${minutes} min`,
    detail: 'Your cleaner is on the way. This ETA is estimated from your booking time.',
    live: true,
  };
}

/**
 * Merge a live tracking payload over the estimated state. Returns `source:
 * 'live'` only when the payload contributes real tracking data.
 */
export function applyLiveTracking(
  base: TrackingState,
  payload: LiveTrackingPayload | null | undefined,
): { state: TrackingState; source: TrackingSource } {
  if (!payload) return { state: base, source: 'estimated' };

  const statusPhase = phaseForStatus(payload.status);
  const routeProgress = toFiniteNumber(payload.routeProgress);
  const etaMinutes = toFiniteNumber(payload.etaMinutes);
  const etaText = typeof payload.etaText === 'string' && payload.etaText.trim() ? payload.etaText.trim() : undefined;
  const detail = typeof payload.detail === 'string' && payload.detail.trim() ? payload.detail.trim() : undefined;

  const hasSignal =
    statusPhase !== undefined ||
    routeProgress !== undefined ||
    etaMinutes !== undefined ||
    etaText !== undefined ||
    detail !== undefined ||
    payload.status === 'cancelled';

  if (!hasSignal) return { state: base, source: 'estimated' };

  const phase = payload.status === 'cancelled' ? 0 : statusPhase ?? base.phase;
  const progress =
    phase === 3 ? 1 : routeProgress !== undefined ? clamp(routeProgress, 0, 1) : base.progress;

  let eta = etaText ?? base.eta;
  if (!etaText && etaMinutes !== undefined) {
    eta = etaFromMinutes(etaMinutes);
  } else if (!etaText && phase === 3) {
    eta = 'Clean completed';
  } else if (!etaText && payload.status === 'cancelled') {
    eta = 'Tracking unavailable';
  }

  const nextDetail = payload.status === 'cancelled' ? 'This booking was cancelled.' : detail ?? base.detail;
  const live = !isTerminalPhase(phase) && payload.status !== 'cancelled' && phase === 1;

  return {
    source: 'live',
    state: {
      phase,
      progress,
      eta,
      detail: nextDetail,
      live,
    },
  };
}

const toGeoPoint = (value: unknown): GeoPoint | undefined => {
  if (!value || typeof value !== 'object') return undefined;
  const record = value as { lat?: unknown; lng?: unknown };
  const lat = toFiniteNumber(record.lat);
  const lng = toFiniteNumber(record.lng);
  if (lat === undefined || lng === undefined) return undefined;
  return { lat, lng };
};

const toDestination = (value: unknown): (GeoPoint & { label?: string }) | undefined => {
  const point = toGeoPoint(value);
  if (!point) return undefined;
  const record = value as { label?: unknown };
  const label = typeof record.label === 'string' && record.label.trim() ? record.label.trim() : undefined;
  return { ...point, label };
};

/** Normalise a live payload into a resolved tracking view for the screen. */
export function resolveTracking(
  booking: SavedBooking,
  now: Date,
  payload?: LiveTrackingPayload | null,
): ResolvedTracking {
  const base = trackingStateFor(booking, now);
  const { state, source } = applyLiveTracking(base, payload);
  const cleaner = payload?.cleaner;
  const cleanerLocation = toGeoPoint(cleaner);
  const cleanerName = typeof cleaner?.name === 'string' && cleaner.name.trim() ? cleaner.name.trim() : undefined;
  const cleanerInitials =
    (typeof cleaner?.initials === 'string' && cleaner.initials.trim()
      ? cleaner.initials.trim()
      : cleanerName
        ? initialsFor(cleanerName)
        : undefined) || undefined;
  const cleanerPhone =
    typeof cleaner?.phone === 'string' && cleaner.phone.trim() ? cleaner.phone.trim() : undefined;
  const destination = toDestination(payload?.destination);
  const updatedAt = typeof payload?.updatedAt === 'string' ? payload.updatedAt : undefined;

  return {
    state,
    source,
    cleanerName,
    cleanerInitials,
    cleanerPhone,
    cleanerLocation,
    destination,
    updatedAt,
  };
}

export function isTrackingComplete(payload: LiveTrackingPayload | null | undefined): boolean {
  if (!payload) return false;
  return payload.status === 'completed' || payload.status === 'cancelled';
}
