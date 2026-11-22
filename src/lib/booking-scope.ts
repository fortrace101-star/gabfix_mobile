import { formSchemaById, schemaFor } from '@/config/form-schemas';
import { pricing } from '@/config/pricing';
import { serviceCategoryById } from '@/config/service-categories';
import { serviceBySlug } from '@/config/services';
import type { BookingMediaItem } from '@/lib/pricing';
import {
  buildSnapshot,
  defaultSchema,
  suggestedMinutes,
  validateAnswers,
  type BookingScope,
  type FormSchema,
  type FormValue,
  type ScopeSnapshotRow,
} from '@/lib/form-schema';

/** P8b scope helpers: schema resolution, defaults, completeness and the time suggestion. */

/** Service → its own `formSchemaId` → its category's → the global default (Section 14.4). */
export function schemaForService(slug: string): FormSchema {
  const service = serviceBySlug(slug);
  const category = service ? serviceCategoryById(service.categoryId) : undefined;
  return schemaFor(service?.formSchemaId, category?.formSchemaId);
}

export const schemaForScope = (scope?: BookingScope): FormSchema =>
  (scope ? formSchemaById(scope.schemaId) : undefined) ?? defaultSchema;

/** Field defaults become the draft's starting answers. */
export const defaultAnswers = (schema: FormSchema): Record<string, FormValue> =>
  Object.fromEntries(
    schema.sections
      .flatMap((section) => section.fields)
      .filter((field) => field.default !== undefined)
      .map((field) => [field.id, field.default as FormValue]),
  );

export const emptyScope = (slug: string): BookingScope => {
  const schema = schemaForService(slug);
  return {
    schemaId: schema.id,
    schemaVersion: schema.version,
    answers: defaultAnswers(schema),
  };
};

export const isScopeComplete = (scope: BookingScope | undefined, media: BookingMediaItem[] = []): boolean => {
  if (!scope) return false;
  const schema = schemaForScope(scope);
  if (schema.mediaRequired && media.length === 0) return false;
  if (Object.keys(validateAnswers(schema, scope.answers, media.length)).length > 0) return false;

  // A required media slot needs a file in that slot, not just any photo in the draft.
  return schema.sections
    .flatMap((section) => section.fields)
    .filter((field) => field.type === 'media-slot' && field.required)
    .every((field) => media.some((item) => item.slotId === field.id));
};

const legacySizeBands: Record<string, string> = {
  small: '1-2',
  medium: '3-4',
  large: '5-plus',
  studio: 'studio',
  one_two_bed: '1-2',
  three_four_bed: '3-4',
  five_plus_bed: '5-plus',
};

type LegacyScope = Partial<{
  sizeBand: string;
  bedrooms: number;
  bathrooms: number;
  livingAreas: number;
  condition: string;
  focusAreas: string[];
  workstations: string;
}>;

/**
 * Drafts saved before Workstream H stored the old fixed scope. Map those values onto the
 * seed schema's fields and keep everything else; nothing is wiped.
 */
export function migrateScope(saved: unknown, slug: string): BookingScope {
  const current = saved as (BookingScope & LegacyScope) | undefined;
  const schema = schemaForService(slug);
  if (current && typeof current.schemaId === 'string' && current.answers) {
    return {
      ...current,
      answers: current.answers,
      schemaVersion: current.schemaVersion ?? schema.version,
    };
  }

  const ids = new Set(schema.sections.flatMap((section) => section.fields.map((field) => field.id)));
  const answers: Record<string, FormValue> = defaultAnswers(schema);
  const put = (id: string, value: FormValue | undefined) => {
    if (value === undefined || value === null || !ids.has(id)) return;
    answers[id] = value;
  };

  put('size', current?.sizeBand ? legacySizeBands[current.sizeBand] : undefined);
  put('bedrooms', current?.bedrooms);
  put('bathrooms', current?.bathrooms);
  put('condition', current?.condition);
  put('focus', Array.isArray(current?.focusAreas) ? current.focusAreas : undefined);

  return {
    schemaId: schema.id,
    schemaVersion: schema.version,
    answers,
    notes: current?.notes,
    snapshot: current?.snapshot,
  };
}

/** Writes the human-readable snapshot rows into the scope before the booking is saved. */
export function snapshotScope(scope: BookingScope): BookingScope {
  const schema = schemaForScope(scope);
  return {
    ...scope,
    schemaId: schema.id,
    schemaVersion: schema.version,
    snapshot: buildSnapshot(schema, scope.answers),
  };
}

/** Snapshot rows for old bookings that only kept the scope. */
export function scopeRows(scope?: BookingScope): ScopeSnapshotRow[] {
  if (!scope) return [];
  return scope.snapshot ?? buildSnapshot(schemaForScope(scope), scope.answers ?? {});
}

export type JobSuggestion = { totalMinutes: number; cleaners: number; hours: number };

/** Suggested time from the schema's time effects, clamped to the pricing minimums. */
export function suggestJob(slug: string, scope: BookingScope): JobSuggestion | undefined {
  const schema = schemaForScope(scope);
  const totalMinutes = suggestedMinutes(schema, scope.answers);
  if (totalMinutes === undefined || totalMinutes <= 0) return undefined;
  const cleaners = totalMinutes <= 300 ? 1 : totalMinutes <= 600 ? 2 : totalMinutes <= 900 ? 3 : 4;
  const rawHours = Math.ceil(totalMinutes / cleaners / 60);
  const hours = Math.min(pricing.maximumHours, Math.max(pricing.minimumHours, rawHours));
  void slug;
  return { totalMinutes, cleaners, hours };
}

/** Customer-facing “about 5 h with 1 cleaner” phrase for the suggestion banner. */
export const suggestionCopy = (suggestion: JobSuggestion): string => {
  const cleaner = suggestion.cleaners === 1 ? 'cleaner' : 'cleaners';
  return `about ${suggestion.hours} h with ${suggestion.cleaners} ${cleaner}`;
};
