import type { NotificationPreferences } from '@/store/profile-settings';
import type { NotificationKind } from '@/store/notifications';
import { isInQuietHours } from './quiet-hours';

export type Importance = 'critical' | 'routine' | 'promo';

export const importanceOf: Record<NotificationKind, Importance> = {
  booking: 'critical',
  payment: 'critical',
  security: 'critical',
  reminder: 'routine',
  system: 'routine',
  promo: 'promo',
};

export type PushDecision = 'deliver' | 'defer' | 'drop';

export function decidePush(
  kind: NotificationKind,
  prefs: NotificationPreferences,
  now = new Date(),
): PushDecision {
  if (!prefs.push) return 'drop';
  if (kind === 'reminder' && !prefs.reminders) return 'drop';
  if (kind === 'promo' && !prefs.offers) return 'drop';
  if (importanceOf[kind] === 'critical') return 'deliver';
  return isInQuietHours(now, prefs.quietHours, prefs.timezone) ? 'defer' : 'deliver';
}

export const decideInApp = (
  kind: NotificationKind,
  prefs: NotificationPreferences,
): 'save' | 'skip' => {
  if (!prefs.inApp) return 'skip';
  if (kind === 'reminder' && !prefs.reminders) return 'skip';
  if (kind === 'promo' && !prefs.offers) return 'skip';
  return 'save';
};

export function notificationSummary(prefs: NotificationPreferences): string {
  const channels = prefs.push
    ? prefs.inApp
      ? 'Push and in-app on'
      : 'Push on'
    : prefs.inApp
      ? 'In-app only'
      : 'All off';
  return prefs.quietHours.enabled && prefs.push
    ? `${channels} · Quiet ${prefs.quietHours.start}–${prefs.quietHours.end}`
    : channels;
}
