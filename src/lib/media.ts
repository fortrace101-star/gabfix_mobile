import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

import { jobMedia } from '@/config/media';
import { newId } from '@/lib/id';
import type { BookingMediaItem } from '@/lib/pricing';

/**
 * P8b media pipeline (Implementation_Phase_2 Stage 1, 3.8): pick, validate against the
 * item/video limits, re-encode photos to JPEG, then copy them into app documents so the
 * OS cannot clear them like the cache. Web keeps the picked blob URI and skips storage.
 */

export type MediaPickSource = 'camera' | 'video' | 'library';
export type MediaPermission = 'granted' | 'denied' | 'blocked' | 'unsupported';

export type MediaPickResult = {
  items: BookingMediaItem[];
  errors: string[];
  permission: MediaPermission;
  cancelled: boolean;
};

export type MediaPickOptions = {
  source: MediaPickSource;
  remaining: number;
  videosRemaining: number;
  existingAssetIds?: string[];
  onProgress?: (done: number, total: number) => void;
};

const isNative = Platform.OS !== 'web';

const draftDirectory = () => new Directory(Paths.document, jobMedia.draftDir);

const ensureDraftDirectory = (): Directory => {
  const directory = draftDirectory();
  if (!directory.exists) directory.create({ intermediates: true, idempotent: true });
  return directory;
};

const extensionFor = (mimeType?: string | null, kind: 'image' | 'video' = 'image'): string => {
  if (mimeType?.includes('quicktime')) return 'mov';
  if (mimeType?.includes('webm')) return 'webm';
  if (kind === 'video') return 'mp4';
  return 'jpg';
};

const megabytes = (bytes: number): number => Math.round((bytes / (1024 * 1024)) * 10) / 10;

async function ensurePermission(source: MediaPickSource): Promise<MediaPermission> {
  if (!isNative) return 'unsupported';
  const getter = source === 'library'
    ? ImagePicker.getMediaLibraryPermissionsAsync
    : ImagePicker.getCameraPermissionsAsync;
  const requester = source === 'library'
    ? ImagePicker.requestMediaLibraryPermissionsAsync
    : ImagePicker.requestCameraPermissionsAsync;

  try {
    const current = await getter();
    if (current.granted) return 'granted';
    if (!current.canAskAgain) return 'blocked';
    const next = await requester();
    if (next.granted) return 'granted';
    return next.canAskAgain ? 'denied' : 'blocked';
  } catch {
    return 'denied';
  }
}

/** JPEG, long edge at most 1600 px, quality 0.7. Also strips EXIF (including GPS). */
async function normalisePhoto(asset: ImagePicker.ImagePickerAsset): Promise<{ uri: string; width: number; height: number }> {
  const context = ImageManipulator.manipulate(asset.uri);
  const longEdge = Math.max(asset.width ?? 0, asset.height ?? 0);
  if (longEdge > jobMedia.imageMaxEdge) {
    context.resize(
      (asset.width ?? 0) >= (asset.height ?? 0)
        ? { width: jobMedia.imageMaxEdge, height: null }
        : { width: null, height: jobMedia.imageMaxEdge },
    );
  }
  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: jobMedia.imageQuality });
  return { uri: saved.uri, width: saved.width, height: saved.height };
}

async function storeInDraft(uri: string, id: string, ext: string): Promise<{ uri: string; bytes?: number }> {
  if (!isNative) return { uri };
  const directory = ensureDraftDirectory();
  const destination = new File(directory, `${id}.${ext}`);
  await new File(uri).copy(destination);
  return { uri: destination.uri, bytes: destination.size };
}

export async function pickJobMedia({
  source,
  remaining,
  videosRemaining,
  existingAssetIds = [],
  onProgress,
}: MediaPickOptions): Promise<MediaPickResult> {
  const empty: MediaPickResult = { items: [], errors: [], permission: 'granted', cancelled: false };
  if (remaining <= 0) return { ...empty, errors: [`You can add up to ${jobMedia.maxItems} photos and videos.`] };
  if (source === 'video' && videosRemaining <= 0) {
    return { ...empty, errors: [`Only ${jobMedia.maxVideos} videos are allowed.`] };
  }

  const permission = await ensurePermission(source);
  if (permission === 'denied' || permission === 'blocked') return { ...empty, permission };

  let result: ImagePicker.ImagePickerResult;
  try {
    if (source === 'camera') {
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        exif: false,
      });
    } else if (source === 'video') {
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['videos'],
        videoMaxDuration: jobMedia.videoMaxSeconds,
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsMultipleSelection: true,
        selectionLimit: Math.max(1, remaining),
        orderedSelection: true,
        quality: 1,
        exif: false,
      });
    }
  } catch {
    return { ...empty, permission, errors: ["We couldn't open your photos. Please try again."] };
  }

  if (result.canceled) return { ...empty, permission, cancelled: true };

  const assets = (result.assets ?? []).slice(0, remaining);
  const items: BookingMediaItem[] = [];
  const errors: string[] = [];
  let videoSlots = videosRemaining;

  for (let index = 0; index < assets.length; index += 1) {
    const asset = assets[index];
    const isVideo = asset.type === 'video';
    if (asset.assetId && existingAssetIds.includes(asset.assetId)) continue;
    if (isVideo && videoSlots <= 0) {
      errors.push(`Only ${jobMedia.maxVideos} videos are allowed. The extra video wasn't added.`);
      continue;
    }

    const durationMs = asset.duration ?? undefined;
    if (isVideo && durationMs) {
      const seconds = Math.round(durationMs / 1000);
      if (durationMs > jobMedia.videoMaxSeconds * 1000 + 1500) {
        errors.push(
          `That video is ${seconds} seconds. Please keep videos to ${jobMedia.videoMaxSeconds} seconds or less.`,
        );
        continue;
      }
    }

    if (isVideo && asset.fileSize && asset.fileSize > jobMedia.videoMaxBytes) {
      errors.push(
        `That video is ${megabytes(asset.fileSize)} MB. Videos can be up to 25 MB. A shorter clip is usually smaller.`,
      );
      continue;
    }

    const id = newId();
    onProgress?.(index + 1, assets.length);

    try {
      let uri = asset.uri;
      let width = asset.width ?? undefined;
      let height = asset.height ?? undefined;
      let mimeType = asset.mimeType ?? undefined;

      if (!isVideo && isNative) {
        const normalised = await normalisePhoto(asset);
        uri = normalised.uri;
        width = normalised.width;
        height = normalised.height;
        mimeType = 'image/jpeg';
      }

      const stored = await storeInDraft(uri, id, extensionFor(mimeType, isVideo ? 'video' : 'image'));
      if (isVideo && stored.bytes && stored.bytes > jobMedia.videoMaxBytes) {
        errors.push(
          `That video is ${megabytes(stored.bytes)} MB. Videos can be up to 25 MB. A shorter clip is usually smaller.`,
        );
        if (isNative) {
          const file = new File(stored.uri);
          if (file.exists) file.delete();
        }
        continue;
      }

      if (isVideo) videoSlots -= 1;
      items.push({
        id,
        uri: stored.uri,
        kind: isVideo ? 'video' : 'image',
        mimeType,
        fileName: asset.fileName ?? undefined,
        durationSec: durationMs ? Math.round(durationMs / 1000) : undefined,
        sizeBytes: stored.bytes ?? asset.fileSize ?? undefined,
        width,
        height,
        assetId: asset.assetId ?? undefined,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      errors.push(
        /space|ENOSPC/i.test(message)
          ? 'Your phone is out of storage space. Free some space and try again.'
          : "We couldn't read that file. Please try a different one.",
      );
    }
  }

  return { items, errors, permission, cancelled: false };
}

/** Removes one draft file. Best-effort: a missing file is not an error. */
export function deleteMediaFile(uri?: string): void {
  if (!uri || !isNative || !uri.startsWith('file://')) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // The tile is already gone from the draft; an orphan file is cleaned up at boot.
  }
}

/** Delete every file still in the draft folder (Discard / a different service starts). */
export function deleteDraftMedia(): void {
  if (!isNative) return;
  try {
    const directory = draftDirectory();
    if (directory.exists) directory.delete();
  } catch {
    // Nothing else depends on the cleanup succeeding.
  }
}

/** Boot-time cleanup: keep only files the hydrated draft still references. */
export function cleanupDraftMedia(referencedUris: string[]): void {
  if (!isNative) return;
  try {
    const directory = draftDirectory();
    if (!directory.exists) return;
    for (const entry of directory.list()) {
      if (entry instanceof File && !referencedUris.includes(entry.uri)) entry.delete();
    }
  } catch {
    // Ignore: cleanup is opportunistic.
  }
}

/**
 * P12 confirms: move draft files into `bookings/<bookingId>/` before the draft resets.
 * Local paths are returned so P14/P15b can show the files without a server.
 */
export async function finalizeDraftMedia(
  bookingId: string,
  items: BookingMediaItem[],
): Promise<BookingMediaItem[]> {
  if (!isNative || items.length === 0) return items;
  const target = new Directory(Paths.document, jobMedia.bookingsDir, bookingId);
  try {
    if (!target.exists) target.create({ intermediates: true, idempotent: true });
  } catch {
    return items;
  }

  const finalized: BookingMediaItem[] = [];
  for (const item of items) {
    if (!item.uri.startsWith('file://')) {
      finalized.push(item);
      continue;
    }
    try {
      const source = new File(item.uri);
      if (!source.exists) {
        finalized.push(item);
        continue;
      }
      const destination = new File(target, `${item.id}.${source.extension.replace('.', '') || 'jpg'}`);
      await source.move(destination);
      finalized.push({ ...item, uri: destination.uri });
    } catch {
      finalized.push(item);
    }
  }
  return finalized;
}

/** Local files kept for a booking are removed with the booking (delete account / cleanup). */
export function deleteBookingMedia(bookingId: string): void {
  if (!isNative) return;
  try {
    const directory = new Directory(Paths.document, jobMedia.bookingsDir, bookingId);
    if (directory.exists) directory.delete();
  } catch {
    // Best-effort.
  }
}

export const mediaCounts = (items: BookingMediaItem[] = []) => ({
  total: items.length,
  videos: items.filter((item) => item.kind === 'video').length,
  remaining: Math.max(0, jobMedia.maxItems - items.length),
  videosRemaining: Math.max(0, jobMedia.maxVideos - items.filter((item) => item.kind === 'video').length),
});
