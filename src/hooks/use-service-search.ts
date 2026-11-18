import { useEffect, useState } from 'react';

import { searchServices } from '@/lib/api/discovery';
import type { Service } from '@/config/services';

export type ServiceSearchState = {
  /** Matches for the debounced query; empty while the user is still typing the first term. */
  services: readonly Service[];
  loading: boolean;
  error: string | null;
};

type Result = {
  key: string;
  services: readonly Service[];
  error: string | null;
};

const messageFrom = (cause: unknown) =>
  cause instanceof Error ? cause.message : 'Search is unavailable right now.';

/** Debounced `GET /search` (Part 2, P5) with a 300 ms wait after the last keystroke. */
export function useServiceSearch(query: string, areaId?: string): ServiceSearchState {
  const trimmed = query.trim();
  const [debounced, setDebounced] = useState('');
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(trimmed), 300);
    return () => clearTimeout(timer);
  }, [trimmed]);

  const key = `${debounced}:${areaId ?? ''}`;

  useEffect(() => {
    if (!debounced) return;

    let cancelled = false;
    searchServices(debounced, areaId)
      .then((services) => {
        if (!cancelled) setResult({ key, services, error: null });
      })
      .catch((cause: unknown) => {
        if (!cancelled) setResult({ key, services: [], error: messageFrom(cause) });
      });

    return () => {
      cancelled = true;
    };
  }, [areaId, debounced, key]);

  const current = result?.key === key ? result : null;

  return {
    services: debounced ? (current?.services ?? []) : [],
    loading: debounced.length > 0 && current === null,
    error: current?.error ?? null,
  };
}
