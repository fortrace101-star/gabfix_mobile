import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

import type { BookingFrequency } from '@/lib/pricing';

/**
 * P25 quote requests. There is no quotes API yet, so requests are saved on the device and
 * shown in Bookings → Requests. Replace this store with `POST /quotes` when it lands.
 */
const STORAGE_KEY = 'gabfix.quotes.v1';

export type QuoteSize = 'small' | 'medium' | 'large';
export type QuotePropertyType = 'house' | 'apartment' | 'office' | 'shop' | 'institution';
export type QuoteStatus = 'pending' | 'quoted' | 'accepted' | 'declined';

export type QuoteRequestInput = {
  serviceSlug: string;
  serviceName: string;
  /** What the customer needs cleaned; required for a custom request. */
  details: string;
  propertyType: QuotePropertyType;
  size: QuoteSize;
  frequency: BookingFrequency;
  /** First date the customer would like the work to start (YYYY-MM-DD). */
  preferredDateISO: string;
  areaName: string;
  contactName: string;
  contactPhone: string;
  /** Up to five local photo attachments (data URIs) for the job. */
  photos?: string[];
};

export type QuoteRequest = QuoteRequestInput & {
  id: string;
  createdAtISO: string;
  status: QuoteStatus;
};

type QuotesState = {
  requests: QuoteRequest[];
  hydrated: boolean;
};

let state: QuotesState = { requests: [], hydrated: false };
const listeners = new Set<() => void>();

const getState = () => state;

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const persist = (requests: QuoteRequest[]) => {
  void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(requests)).catch(() => undefined);
};

const setRequests = (requests: QuoteRequest[]) => {
  state = { ...state, requests };
  listeners.forEach((listener) => listener());
  persist(requests);
};

/** Called once at boot from the root layout. */
export async function hydrateQuotes(): Promise<void> {
  let requests: QuoteRequest[] = [];
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    if (Array.isArray(parsed)) {
      requests = parsed.filter((item): item is QuoteRequest =>
        Boolean(item && typeof item === 'object' && (item as QuoteRequest).id),
      );
    }
  } catch {
    requests = [];
  }
  state = { requests, hydrated: true };
  listeners.forEach((listener) => listener());
}

export function addQuoteRequest(input: QuoteRequestInput): QuoteRequest {
  const request: QuoteRequest = {
    ...input,
    id: `QR-${String(Date.now()).slice(-6)}`,
    createdAtISO: new Date().toISOString(),
    status: 'pending',
  };
  setRequests([request, ...state.requests]);
  return request;
}

export function useQuoteRequests(): QuoteRequest[] {
  return useSyncExternalStore(subscribe, getState, getState).requests;
}

export function useQuotesHydrated(): boolean {
  return useSyncExternalStore(subscribe, getState, getState).hydrated;
}
