import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'gabfix.search.recent.v1';
const limit = 8;

const clean = (items: unknown): string[] =>
  Array.isArray(items)
    ? items.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];

/** Last eight searches, newest first (Part 2, P5). */
export async function loadRecentSearches(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return clean(raw ? JSON.parse(raw) : []).slice(0, limit);
  } catch {
    return [];
  }
}

export async function addRecentSearch(term: string): Promise<string[]> {
  const value = term.trim();
  const existing = await loadRecentSearches();
  if (!value) return existing;

  const next = [value, ...existing.filter((item) => item.toLowerCase() !== value.toLowerCase())].slice(
    0,
    limit,
  );

  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // A storage failure only loses the suggestion list; the search itself still works.
  }

  return next;
}

export async function clearRecentSearches(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to recover: the caller clears its own state.
  }
}
