import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

import type { TicketScreenshot } from '@/store/tickets';

const isNative = Platform.OS !== 'web';
const TICKET_DIR = 'tickets';
const MAX_EDGE = 1600;
const QUALITY = 0.7;

/** JPEG, long edge at most 1600 px, EXIF stripped — same normalisation as the booking pipeline. */
async function normalizeTicketScreenshot(asset: ImagePicker.ImagePickerAsset): Promise<string> {
  const context = ImageManipulator.manipulate(asset.uri);
  const longEdge = Math.max(asset.width ?? 0, asset.height ?? 0);
  if (longEdge > MAX_EDGE) {
    context.resize(
      (asset.width ?? 0) >= (asset.height ?? 0)
        ? { width: MAX_EDGE, height: null }
        : { width: null, height: MAX_EDGE },
    );
  }
  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: QUALITY });
  return saved.uri;
}

const ensureDirectory = (): Directory => {
  const directory = new Directory(Paths.document, TICKET_DIR);
  if (!directory.exists) directory.create({ intermediates: true, idempotent: true });
  return directory;
};

/**
 * Picks up to `remaining` screenshots, resizes them to JPEG and copies them into
 * `document/tickets/` so the ticket keeps working files, never base64 (S1 16.3).
 */
export async function pickTicketScreenshots(
  remaining: number,
): Promise<{ shots: TicketScreenshot[]; permission: 'granted' | 'denied' | 'blocked' | 'unsupported' }> {
  if (remaining <= 0) return { shots: [], permission: 'granted' };
  if (!isNative) return { shots: [], permission: 'unsupported' };

  const current = await ImagePicker.getMediaLibraryPermissionsAsync();
  const permission = current.granted
    ? current
    : current.canAskAgain
      ? await ImagePicker.requestMediaLibraryPermissionsAsync()
      : current;
  if (!permission.granted) {
    return { shots: [], permission: permission.canAskAgain ? 'denied' : 'blocked' };
  }

  let result: ImagePicker.ImagePickerResult;
  try {
    result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      orderedSelection: true,
      quality: 1,
      exif: false,
    });
  } catch {
    return { shots: [], permission: 'denied' };
  }
  if (result.canceled) return { shots: [], permission: 'granted' };

  const directory = ensureDirectory();
  const shots: TicketScreenshot[] = [];

  for (const asset of result.assets.slice(0, remaining)) {
    const normalised = await normalizeTicketScreenshot(asset);
    const id = `shot-${Date.now()}-${shots.length}`;
    const destination = new File(directory, `${id}.jpg`);
    try {
      await new File(normalised).copy(destination);
      shots.push({ id, uri: destination.uri, bytes: destination.size ?? 0 });
    } catch {
      shots.push({ id, uri: normalised, bytes: 0 });
    }
  }

  return { shots, permission: 'granted' };
}

export function deleteTicketScreenshot(shot: TicketScreenshot): void {
  if (!isNative || !shot.uri.startsWith('file://')) return;
  try {
    const file = new File(shot.uri);
    if (file.exists) file.delete();
  } catch {
    // Best-effort cleanup.
  }
}
