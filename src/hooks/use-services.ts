import { useCallback, useEffect, useState } from 'react';

import { services as localServices, type Service } from '@/config/services';
import { getServices } from '@/lib/api/discovery';
import { hasApiBaseUrl } from '@/lib/config';

export type ServicesState = {
  services: readonly Service[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
};

type Result = {
  /** Request this result belongs to, so a stale response can never replace a newer one. */
  key: string;
  services: readonly Service[];
  error: string | null;
};

const messageFrom = (cause: unknown) =>
  cause instanceof Error ? cause.message : 'We could not load the services.';

/**
 * Loads the discovery catalogue for the chosen area. With no API base URL configured the
 * bundled catalogue is already in place, so the screens never render an empty list.
 */
export function useServices(areaId?: string): ServicesState {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const key = `${areaId ?? ''}:${attempt}`;

  useEffect(() => {
    if (!hasApiBaseUrl) return;

    let cancelled = false;
    getServices(areaId)
      .then((services) => {
        if (!cancelled) setResult({ key, services, error: null });
      })
      .catch((cause: unknown) => {
        if (!cancelled) setResult({ key, services: localServices, error: messageFrom(cause) });
      });

    return () => {
      cancelled = true;
    };
  }, [areaId, key]);

  const refresh = useCallback(() => setAttempt((value) => value + 1), []);
  const current = result?.key === key ? result : null;

  return {
    services: current?.services ?? localServices,
    loading: hasApiBaseUrl && current === null,
    error: current?.error ?? null,
    refresh,
  };
}
