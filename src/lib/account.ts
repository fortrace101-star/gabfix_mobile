import AsyncStorage from '@react-native-async-storage/async-storage';

import { clearDeviceId } from '@/lib/device';
import { deleteAllBookingMedia, deleteDraftMedia } from '@/lib/media';
import { endSession } from '@/store/session';

/**
 * Delete-account cleanup for the local demo. Removes every Gabfix cache key on
 * this device, deletes the photos/videos kept for drafts and bookings, clears the
 * device identifier, then clears the session (keychain token included).
 * Server-side account deletion still needs the profile API.
 */
export async function deleteLocalAccount(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const gabfixKeys = keys.filter((key) => key.startsWith('gabfix.'));
    if (gabfixKeys.length > 0) await AsyncStorage.multiRemove(gabfixKeys);
  } catch {
    // The session still needs to be cleared even if cache cleanup fails.
  }
  deleteDraftMedia();
  deleteAllBookingMedia();
  try {
    await clearDeviceId();
  } catch {
    // Best-effort.
  }
  await endSession();
}
