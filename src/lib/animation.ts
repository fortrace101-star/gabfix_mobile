import { Platform } from 'react-native';

/**
 * React Native Web has no native animated module. Keep the native driver on
 * iOS/Android and fall back to the JS driver on web without emitting a warning.
 */
export const supportsNativeDriver = Platform.OS !== 'web';
