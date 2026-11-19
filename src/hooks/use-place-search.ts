import { useEffect, useState } from 'react';

import { searchLocationFixtures, type FixturePlace } from '@/config/location-fixtures';

const MIN_CHARS = 2;
const DEBOUNCE_MS = 250;

type Result = {
  query: string;
  places: FixturePlace[];
};

/**
 * Debounced address search over the bundled Kampala places. Mirrors the Google
 * Places flow in `Location_Fixtures.md` so a network provider can replace the
 * fixture search without changing the picker.
 */
export function usePlaceSearch(query: string) {
  const trimmed = query.trim();
  const [debounced, setDebounced] = useState('');
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(trimmed), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [trimmed]);

  useEffect(() => {
    if (debounced.length < MIN_CHARS) return;
    let cancelled = false;
    // Local search is synchronous; the promise keeps the hook's shape ready for
    // the Google Places request and its cancellation.
    Promise.resolve(searchLocationFixtures(debounced)).then((places) => {
      if (!cancelled) setResult({ query: debounced, places });
    });
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  const current = result?.query === debounced ? result : null;

  return {
    results: debounced.length >= MIN_CHARS ? (current?.places ?? []) : [],
    loading: debounced.length >= MIN_CHARS && current === null,
    error: null,
    showResults: trimmed.length >= MIN_CHARS,
  };
}
