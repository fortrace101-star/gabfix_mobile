import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'gabfix.media-uploads.v1';

export type UploadState = 'queued' | 'uploading' | 'uploaded' | 'failed';

export type UploadItem = {
  bookingId: string;
  clientId: string;
  mediaId: string;
  uri: string;
  kind: 'image' | 'video';
  mimeType?: string;
  bytes?: number;
  state: UploadState;
  /** 0..1 */
  progress: number;
  attempts: number;
  error?: string;
  updatedAtISO: string;
};

type UploadsState = {
  items: UploadItem[];
  hydrated: boolean;
};

let state: UploadsState = { items: [], hydrated: false };
const listeners = new Set<() => void>();

const getState = () => state;

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const persist = (items: UploadItem[]) => {
  void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)).catch(() => undefined);
};

const setItems = (items: UploadItem[]) => {
  state = { ...state, items };
  listeners.forEach((listener) => listener());
  persist(items);
};

const isUpload = (value: unknown): value is UploadItem => {
  const item = value as UploadItem | null;
  return Boolean(
    item &&
      item.bookingId &&
      item.clientId &&
      item.uri &&
      (item.state === 'queued' ||
        item.state === 'uploading' ||
        item.state === 'uploaded' ||
        item.state === 'failed'),
  );
};

/** Called once at boot: an item left “uploading” resumes as queued (3.11). */
export async function hydrateMediaUploads(): Promise<void> {
  let items: UploadItem[] = [];
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    if (Array.isArray(parsed)) {
      items = parsed
        .filter(isUpload)
        .map((item) => (item.state === 'uploading' ? { ...item, state: 'queued' as const, progress: 0 } : item));
    }
  } catch {
    items = [];
  }
  state = { items, hydrated: true };
  listeners.forEach((listener) => listener());
}

export function enqueueUploads(items: UploadItem[]): void {
  if (items.length === 0) return;
  const existing = state.items.filter(
    (item) => !items.some((next) => next.bookingId === item.bookingId && next.clientId === item.clientId),
  );
  setItems([...items, ...existing]);
}

export function updateUpload(bookingId: string, clientId: string, patch: Partial<UploadItem>): void {
  const items = state.items.map((item) =>
    item.bookingId === bookingId && item.clientId === clientId
      ? { ...item, ...patch, updatedAtISO: new Date().toISOString() }
      : item,
  );
  setItems(items);
}

export function retryFailedUploads(bookingId: string): UploadItem[] {
  const retrying = state.items
    .filter((item) => item.bookingId === bookingId && item.state === 'failed')
    .map((item) => ({ ...item, state: 'queued' as const, attempts: 0, error: undefined, progress: 0 }));
  if (retrying.length === 0) return [];
  setItems(
    state.items.map((item) => {
      const match = retrying.find((next) => next.clientId === item.clientId && next.bookingId === item.bookingId);
      return match ?? item;
    }),
  );
  return retrying;
}

export function removeUploadsForBooking(bookingId: string): void {
  if (!state.items.some((item) => item.bookingId === bookingId)) return;
  setItems(state.items.filter((item) => item.bookingId !== bookingId));
}

const uploadsCache = new Map<string | undefined, { items: UploadItem[]; result: UploadItem[] }>();
const EMPTY_UPLOADS: UploadItem[] = [];

function selectUploads(bookingId?: string): UploadItem[] {
  const items = getState().items;
  if (!bookingId) return items;
  const cached = uploadsCache.get(bookingId);
  if (cached && cached.items === items) return cached.result;
  const filtered = items.filter((item) => item.bookingId === bookingId);
  const result = filtered.length === 0 ? EMPTY_UPLOADS : filtered;
  uploadsCache.set(bookingId, { items, result });
  return result;
}

export function useMediaUploads(bookingId?: string): UploadItem[] {
  return useSyncExternalStore(subscribe, () => selectUploads(bookingId), () => selectUploads(bookingId));
}

export function useMediaUploadsHydrated(): boolean {
  return useSyncExternalStore(subscribe, getState, getState).hydrated;
}
