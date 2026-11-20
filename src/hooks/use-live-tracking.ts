import { useEffect, useMemo, useState } from 'react';

import { fetchTracking, TRACKING_POLL_INTERVAL_MS, trackingWsUrl } from '@/lib/api/tracking';
import { hasApiBaseUrl } from '@/lib/config';
import {
  isTrackingComplete,
  resolveTracking,
  type LiveTrackingPayload,
  type ResolvedTracking,
} from '@/lib/tracking';
import type { SavedBooking } from '@/store/bookings';

type LiveTrackingConnection = 'idle' | 'connecting' | 'live' | 'polling' | 'unavailable';

export type UseLiveTrackingResult = ResolvedTracking & {
  connection: LiveTrackingConnection;
};

const parseMessage = (data: unknown): LiveTrackingPayload | null => {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data) as LiveTrackingPayload;
    } catch {
      return null;
    }
  }
  if (data && typeof data === 'object') return data as LiveTrackingPayload;
  return null;
};

const isTrackingDisabled = (booking: SavedBooking | undefined): boolean =>
  !booking || booking.status === 'cancelled' || booking.status === 'completed';

/**
 * Live tracking contract for P15c.
 *
 * Connects to `/ws/bookings/{id}` when an API base URL is configured and falls
 * back to polling `GET /bookings/{id}/tracking` every 10 seconds if the socket
 * is unavailable or closes before the booking reaches a terminal state. Without
 * an API the hook stays in estimated mode and never attempts network access.
 */
export function useLiveTracking(
  booking: SavedBooking | undefined,
  now: Date,
): UseLiveTrackingResult {
  const bookingId = booking?.id;
  const disabled = isTrackingDisabled(booking);
  const [raw, setRaw] = useState<{ forId: string; payload: LiveTrackingPayload | null } | null>(null);
  const [connectionState, setConnectionState] = useState<{ forId: string; value: LiveTrackingConnection } | null>(
    null,
  );

  const payload = raw && raw.forId === bookingId ? raw.payload : null;
  const baseConnection: LiveTrackingConnection =
    !bookingId || disabled || !hasApiBaseUrl ? 'unavailable' : 'connecting';
  const connection =
    connectionState && connectionState.forId === bookingId
      ? connectionState.value
      : baseConnection;

  useEffect(() => {
    if (!bookingId || disabled || !hasApiBaseUrl) {
      return;
    }

    let active = true;
    let socket: WebSocket | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let stopped = false;

    const setConn = (value: LiveTrackingConnection) => {
      if (active) setConnectionState({ forId: bookingId, value });
    };

    const stop = (next: LiveTrackingConnection) => {
      stopped = true;
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
      if (socket) {
        try {
          socket.close();
        } catch {
          // ignore
        }
        socket = null;
      }
      setConn(next);
    };

    const handlePayload = (next: LiveTrackingPayload | null) => {
      if (!active || !next) return;
      setRaw({ forId: bookingId, payload: next });
      if (isTrackingComplete(next)) {
        stop('unavailable');
      }
    };

    const poll = async () => {
      try {
        const next = await fetchTracking(bookingId);
        handlePayload(next);
      } catch {
        // Keep the last known live state (or estimate) and retry on the next tick.
      }
    };

    const startPolling = () => {
      if (stopped || pollTimer) return;
      setConn('polling');
      void poll();
      pollTimer = setInterval(() => {
        void poll();
      }, TRACKING_POLL_INTERVAL_MS);
    };

    const wsUrl = trackingWsUrl(bookingId);
    if (!wsUrl || typeof WebSocket === 'undefined') {
      startPolling();
      return () => {
        active = false;
        stop('unavailable');
      };
    }

    try {
      socket = new WebSocket(wsUrl);
    } catch {
      startPolling();
      return () => {
        active = false;
        stop('unavailable');
      };
    }

    socket.onopen = () => {
      if (!active || stopped) return;
      setConn('live');
    };

    socket.onmessage = (event: { data?: unknown }) => {
      handlePayload(parseMessage(event.data));
    };

    socket.onerror = () => {
      if (stopped) return;
      try {
        socket?.close();
      } catch {
        // ignore
      }
    };

    socket.onclose = () => {
      socket = null;
      if (stopped || !active) return;
      startPolling();
    };

    return () => {
      active = false;
      stop('unavailable');
    };
  }, [bookingId, disabled]);

  return useMemo(() => {
    if (!booking) {
      const empty = resolveTracking(
        {
          id: '',
          serviceSlug: '',
          serviceName: '',
          status: 'cancelled',
          createdAtISO: '',
          cleaners: 0,
          hours: 0,
          total: 0,
          paid: 0,
          balance: 0,
        },
        now,
        null,
      );
      return { ...empty, connection: 'unavailable' as const };
    }
    const resolved = resolveTracking(booking, now, payload);
    return { ...resolved, connection };
  }, [booking, now, payload, connection]);
}
