import * as FileSystem from 'expo-file-system/legacy';

import type { UploadTarget } from '@/lib/api/bookings';
import { apiRequest } from '@/lib/api/client';
import { hasApiBaseUrl } from '@/lib/config';
import type { BookingMediaItem } from '@/lib/pricing';
import { enqueueUploads, updateUpload } from '@/store/media-uploads';

/**
 * Upload queue (3.11). With no backend configured, files are moved by
 * `finalizeDraftMedia` and marked uploaded so P14/P15b show the finished state.
 * Set EXPO_PUBLIC_MOCK_UPLOAD_FAIL=2 in development to fail the second item.
 */

const RETRY_DELAYS = [2000, 8000, 30000];
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function prepareBookingUploads(bookingId: string, items: BookingMediaItem[]) {
  enqueueUploads(
    items.map((item) => ({
      bookingId,
      clientId: item.id,
      mediaId: item.id,
      uri: item.uri,
      kind: item.kind,
      mimeType: item.mimeType,
      bytes: item.sizeBytes,
      state: 'queued' as const,
      progress: 0,
      attempts: 0,
      updatedAtISO: new Date().toISOString(),
    })),
  );
}

async function uploadOne(
  bookingId: string,
  clientId: string,
  uri: string,
  target?: UploadTarget,
): Promise<boolean> {
  if (!hasApiBaseUrl || !target) {
    await sleep(120);
    updateUpload(bookingId, clientId, { state: 'uploaded', progress: 1, mediaId: clientId });
    return true;
  }

  for (let attempt = 0; attempt < RETRY_DELAYS.length + 1; attempt += 1) {
    updateUpload(bookingId, clientId, {
      state: 'uploading',
      attempts: attempt + 1,
      error: undefined,
    });
    try {
      const task = FileSystem.createUploadTask(
        target.uploadUrl,
        uri,
        {
          httpMethod: 'PUT',
          uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
          headers: target.headers,
        },
        ({ totalBytesSent, totalBytesExpectedToSend }) => {
          if (totalBytesExpectedToSend > 0) {
            updateUpload(bookingId, clientId, {
              progress: Math.min(1, totalBytesSent / totalBytesExpectedToSend),
            });
          }
        },
      );
      const result = await task.uploadAsync();
      if (result && result.status >= 200 && result.status < 300) {
        await apiRequest(`/bookings/${bookingId}/media/${target.mediaId}/complete`, {
          method: 'POST',
        }).catch(() => undefined);
        updateUpload(bookingId, clientId, {
          state: 'uploaded',
          progress: 1,
          mediaId: target.mediaId,
        });
        return true;
      }
      if (result && [401, 403, 410].includes(result.status)) {
        updateUpload(bookingId, clientId, { state: 'failed', error: 'The upload link expired.' });
        return false;
      }
    } catch {
      // Fall through to the back-off below.
    }
    if (attempt < RETRY_DELAYS.length) await sleep(RETRY_DELAYS[attempt]);
  }

  updateUpload(bookingId, clientId, {
    state: 'failed',
    error: 'We could not upload this item. Check your connection and try again.',
  });
  return false;
}

/** Starts the queue for one booking. Never blocks navigation; callers do not await it. */
export async function startBookingUploads(
  bookingId: string,
  items: BookingMediaItem[],
  targets?: UploadTarget[],
): Promise<void> {
  const mockFailIndex = Number(process.env.EXPO_PUBLIC_MOCK_UPLOAD_FAIL ?? 0);
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    if (mockFailIndex === index + 1 && !hasApiBaseUrl) {
      updateUpload(bookingId, item.id, {
        state: 'failed',
        attempts: 3,
        error: 'We could not upload this item. Check your connection and try again.',
      });
      continue;
    }
    const target = targets?.find((candidate) => candidate.clientId === item.id);
    await uploadOne(bookingId, item.id, item.uri, target);
  }
}

/** Retry button on P14/P15b: only re-uploads items currently marked failed. */
export async function retryBookingUploads(bookingId: string, items: BookingMediaItem[]): Promise<void> {
  const { getUploadState } = await import('@/store/media-uploads');
  const failedIds = new Set(
    getUploadState()
      .items.filter((item) => item.bookingId === bookingId && item.state === 'failed')
      .map((item) => item.clientId),
  );
  const toRetry = items.filter((item) => failedIds.has(item.id));
  if (toRetry.length === 0) return;
  await startBookingUploads(bookingId, toRetry);
}
