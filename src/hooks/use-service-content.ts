import { useCallback, useEffect, useState } from 'react';

import {
  serviceContentBySlug,
  type ServiceContent,
} from '@/config/service-content';
import { getServiceContent } from '@/lib/api/service-content';
import { hasApiBaseUrl } from '@/lib/config';

export type ServiceContentState = {
  content: ServiceContent | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
};

type Result = {
  key: string;
  content: ServiceContent | null;
  error: string | null;
};

const messageFrom = (cause: unknown) =>
  cause instanceof Error ? cause.message : 'We could not load this service.';

/**
 * Loads one service landing payload. The bundled copy in `src/config/service-content.ts`
 * is shown while no API base URL is set, so P7 works without a backend.
 */
export function useServiceContent(slug: string): ServiceContentState {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const key = `${slug}:${attempt}`;
  const local = serviceContentBySlug(slug) ?? null;

  useEffect(() => {
    if (!hasApiBaseUrl || !slug) return;

    let cancelled = false;
    getServiceContent(slug)
      .then((content) => {
        if (!cancelled) setResult({ key, content, error: null });
      })
      .catch((cause: unknown) => {
        if (!cancelled) setResult({ key, content: local, error: messageFrom(cause) });
      });

    return () => {
      cancelled = true;
    };
  }, [key, local, slug]);

  const refresh = useCallback(() => setAttempt((value) => value + 1), []);
  const current = result?.key === key ? result : null;

  return {
    content: current?.content ?? local,
    loading: hasApiBaseUrl && current === null,
    error: current?.error ?? null,
    refresh,
  };
}
