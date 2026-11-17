import * as Haptics from 'expo-haptics';

/** Haptics are a nice-to-have; a failed haptic must never break an interaction (web, low-end devices). */
const run = (action: () => Promise<void>) => {
  action().catch(() => undefined);
};

export const selectionHaptic = () => run(() => Haptics.selectionAsync());
export const pressHaptic = () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
export const successHaptic = () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
export const errorHaptic = () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
