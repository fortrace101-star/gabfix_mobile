import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'gabfix.reviews.v1';

export type SavedReview = {
  id: string;
  bookingId: string;
  cleanerId?: string;
  cleanerName: string;
  stars: number;
  tags: string[];
  comment: string;
  /** Local photo URIs/data URLs; uploads wait on the reviews API. */
  photos: string[];
  createdAtISO: string;
};

type ReviewsState = {
  reviews: SavedReview[];
  hydrated: boolean;
};

let state: ReviewsState = { reviews: [], hydrated: false };
const listeners = new Set<() => void>();

const getState = () => state;

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const persist = (reviews: SavedReview[]) => {
  void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(reviews)).catch(() => undefined);
};

const setReviews = (reviews: SavedReview[]) => {
  state = { reviews, hydrated: true };
  listeners.forEach((listener) => listener());
  persist(reviews);
};

const isReview = (value: unknown): value is SavedReview => {
  const item = value as SavedReview | null;
  return Boolean(
    item &&
      item.id &&
      item.bookingId &&
      item.cleanerName &&
      Number.isInteger(item.stars) &&
      item.stars >= 1 &&
      item.stars <= 5 &&
      typeof item.comment === 'string' &&
      Array.isArray(item.tags) &&
      Array.isArray(item.photos) &&
      item.createdAtISO,
  );
};

/** Called once at boot from the root layout. */
export async function hydrateReviews(): Promise<void> {
  let reviews: SavedReview[] = [];
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    if (Array.isArray(parsed)) reviews = parsed.filter(isReview);
  } catch {
    reviews = [];
  }
  state = { reviews, hydrated: true };
  listeners.forEach((listener) => listener());
}

/** One review per booking; a repeat submit returns the first saved entry. */
export function addReview(review: Omit<SavedReview, 'id' | 'createdAtISO'>): SavedReview {
  const existing = state.reviews.find((item) => item.bookingId === review.bookingId);
  if (existing) return existing;

  const saved: SavedReview = {
    ...review,
    id: `RV-${Date.now()}`,
    createdAtISO: new Date().toISOString(),
  };
  setReviews([saved, ...state.reviews]);
  return saved;
}

export function getReviewForBooking(bookingId: string): SavedReview | undefined {
  return state.reviews.find((item) => item.bookingId === bookingId);
}

export function useReviews(): SavedReview[] {
  return useSyncExternalStore(subscribe, getState, getState).reviews;
}

export function useReviewsHydrated(): boolean {
  return useSyncExternalStore(subscribe, getState, getState).hydrated;
}
