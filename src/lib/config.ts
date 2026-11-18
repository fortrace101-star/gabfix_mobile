/**
 * Runtime configuration. Set EXPO_PUBLIC_API_BASE_URL in your environment or EAS
 * build profile to connect the auth screens to a real backend.
 */
export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL ?? '').replace(/\/+$/, '');

export const hasApiBaseUrl = API_BASE_URL.length > 0;
