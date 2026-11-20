import { pricing } from '@/config/pricing';
import { scopeFor } from '@/config/service-scope';
import { bandForArea, sizeBandById, type PropertySizeBand } from '@/config/size-bands';
import type { BookingCondition, BookingScope, BookingWorkstations } from '@/lib/pricing';

/** P8b scope helpers: copy, validation and the time suggestion from Section 3.4. */

export const conditionOptions: { value: BookingCondition; label: string; description: string }[] = [
  { value: 'light', label: 'Light', description: 'Regular upkeep' },
  { value: 'typical', label: 'Typical', description: 'Some build-up' },
  { value: 'heavy', label: 'Heavy', description: 'Needs extra attention' },
];

export const workstationOptions: { value: BookingWorkstations; label: string }[] = [
  { value: '1-5', label: '1–5' },
  { value: '6-15', label: '6–15' },
  { value: '16-40', label: '16–40' },
  { value: '40+', label: '40+' },
];

/** “I know the exact size” writes both the area and the band it falls into. */
export const applyExactArea = (areaSqm: number): Pick<BookingScope, 'areaSqm' | 'sizeBand'> => ({
  areaSqm,
  sizeBand: bandForArea(areaSqm),
});

export const selectSizeBand = (band: PropertySizeBand): Pick<BookingScope, 'sizeBand'> => ({
  sizeBand: band,
});

export type JobSuggestion = { totalMinutes: number; cleaners: number; hours: number };

export function suggestJob(slug: string, scope: BookingScope): JobSuggestion {
  const { estimate } = scopeFor(slug);
  let minutes = estimate.baseMinutes;
  minutes += scope.bedrooms * (estimate.perBedroom ?? 0);
  minutes += scope.bathrooms * (estimate.perBathroom ?? 0);
  minutes += scope.livingAreas * (estimate.perLivingArea ?? 0);
  minutes += (scope.meetingRooms ?? 0) * (estimate.perMeetingRoom ?? 0);
  minutes += (scope.toilets ?? 0) * (estimate.perToilet ?? 0);
  if (scope.workstations && estimate.perWorkstationBand) {
    minutes += estimate.perWorkstationBand[scope.workstations] ?? 0;
  }
  if (scope.condition && estimate.conditionMultiplier) {
    minutes *= estimate.conditionMultiplier[scope.condition];
  }
  const totalMinutes = Math.round(minutes);
  const cleaners = totalMinutes <= 300 ? 1 : totalMinutes <= 600 ? 2 : totalMinutes <= 900 ? 3 : 4;
  const rawHours = Math.ceil(totalMinutes / cleaners / 60);
  const hours = Math.min(pricing.maximumHours, Math.max(pricing.minimumHours, rawHours));
  return { totalMinutes, cleaners, hours };
}

export function isScopeComplete(slug: string, scope: BookingScope | undefined): boolean {
  const config = scopeFor(slug);
  if (!scope) return false;
  if (config.sizeRequired && !scope.sizeBand) return false;
  return config.fields.every((field) => {
    if (!field.required) return true;
    if (field.type === 'condition') return scope.condition !== undefined;
    if (field.type === 'workstations') return scope.workstations !== undefined;
    return true;
  });
}

/** One line of facts for P12, e.g. “Medium · 3 bedrooms · 2 bathrooms”. */
export const scopeSummary = (scope?: BookingScope): string => {
  if (!scope) return 'Scope not set';
  const band = scope.sizeBand ? (sizeBandById(scope.sizeBand)?.label ?? 'Size not set') : 'Size not set';
  const rooms = [
    `${scope.bedrooms} bed`,
    `${scope.bathrooms} bath`,
    `${scope.livingAreas} living`,
  ].join(' · ');
  return `${band} · ${rooms}`;
};

/** Customer-facing “about 5 h with 1 cleaner” phrase for the suggestion banner. */
export const suggestionCopy = (suggestion: JobSuggestion): string => {
  const cleaner = suggestion.cleaners === 1 ? 'cleaner' : 'cleaners';
  return `about ${suggestion.hours} h with ${suggestion.cleaners} ${cleaner}`;
};
