import * as Crypto from 'expo-crypto';

/** Stable unique id for media items, device identity and local records. */
export const newId = (): string => {
  try {
    return Crypto.randomUUID();
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
};
