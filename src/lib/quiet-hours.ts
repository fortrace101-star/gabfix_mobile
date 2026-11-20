const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return NaN;
  return h * 60 + m;
};

export function isValidTime(hhmm: string): boolean {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(hhmm);
}

/** Minutes since local midnight in the given IANA timezone. */
export function minutesInZone(now: Date, timeZone: string): number {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(now);
    const h = Number(parts.find((part) => part.type === 'hour')?.value ?? 0) % 24;
    const m = Number(parts.find((part) => part.type === 'minute')?.value ?? 0);
    return h * 60 + m;
  } catch {
    return now.getHours() * 60 + now.getMinutes();
  }
}

export type QuietHours = { enabled: boolean; start: string; end: string };

export function isInQuietHours(now: Date, q: QuietHours, timeZone: string): boolean {
  if (!q.enabled) return false;
  const start = toMinutes(q.start);
  const end = toMinutes(q.end);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start === end) return false;
  const t = minutesInZone(now, timeZone);
  return start < end ? t >= start && t < end : t >= start || t < end;
}

export function validateQuietHours(q: QuietHours): string | null {
  if (!isValidTime(q.start) || !isValidTime(q.end)) return 'Choose a valid start and end time.';
  if (q.start === q.end) return "Start and end can't be the same time.";
  return null;
}
