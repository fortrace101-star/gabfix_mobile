import { useCallback, useEffect, useState } from 'react';

import { getAvailability, localSlots, type Slot } from '@/lib/api/availability';
import { hasApiBaseUrl } from '@/lib/config';

export type AvailabilityState = {
  slots: readonly Slot[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
};

type Result = {
  key: string;
  slots: readonly Slot[];
  error: string | null;
};

const messageFrom = (cause: unknown) =>
  cause instanceof Error ? cause.message : 'We could not load the available times.';

/** Loads the slot grid for one service, area and date. */
export function useAvailability(
  serviceSlug: string,
  dateISO: string | null,
  areaId?: string,
  cleanerId?: string,
): AvailabilityState {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const key = `${serviceSlug}:${areaId ?? ''}:${cleanerId ?? ''}:${dateISO ?? ''}:${attempt}`;

  useEffect(() => {
    if (!hasApiBaseUrl || !dateISO) return;

    let cancelled = false;
    getAvailability({ serviceSlug, areaId, dateISO, cleanerId })
      .then((slots) => {
        if (!cancelled) setResult({ key, slots, error: null });
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setResult({ key, slots: localSlots(dateISO ?? ''), error: messageFrom(cause) });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [areaId, cleanerId, dateISO, key, serviceSlug]);

  const refresh = useCallback(() => setAttempt((value) => value + 1), []);
  const current = result?.key === key ? result : null;

  return {
    slots: current?.slots ?? (dateISO ? localSlots(dateISO) : []),
    loading: hasApiBaseUrl && dateISO !== null && current === null,
    error: current?.error ?? null,
    refresh,
  };
}
