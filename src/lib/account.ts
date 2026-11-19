import AsyncStorage from '@react-native-async-storage/async-storage';

import { endSession } from '@/store/session';

/**
 * Delete-account cleanup for the local demo. Removes every Gabfix cache key on
 * this device, then clears the SecureStore/localStorage session. Server-side
 * account deletion still needs the profile API.
 */
export async function deleteLocalAccount(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const gabfixKeys = keys.filter((key) => key.startsWith('gabfix.'));
    if (gabfixKeys.length > 0) await AsyncStorage.multiRemove(gabfixKeys);
  } catch {
    // The session still needs to be cleared even if cache cleanup fails.
  }
  await endSession();
}
