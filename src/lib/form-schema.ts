/**
 * Dynamic job-details form engine (Workstream H, Section 14.4).
 *
 * Pure TypeScript with no React Native imports, so the admin web app can validate the
 * same schemas before saving them. The renderer maps the closed set of field types to
 * shared controls; nothing here knows about a service slug.
 */

export type FormValue =
  | string
  | number
  | boolean
  | string[]
  | { value: number; unit: string }
  | null;

export type FieldOption = {
  /** Stable slug, never reused. */
  id: string;
  label: string;
  hint?: string;
  /** Time effect when this option is chosen. */
  minutes?: number;
  /** Forces "we will confirm the price". */
  flagsQuote?: boolean;
};

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'counter'
  | 'select'
  | 'multiselect'
  | 'boolean'
  | 'measurement'
  | 'media-slot';

export const FIELD_TYPES: readonly FieldType[] = [
  'text',
  'textarea',
  'number',
  'counter',
  'select',
  'multiselect',
  'boolean',
  'measurement',
  'media-slot',
];

export type ShowIf = {
  fieldId: string;
  op: 'eq' | 'neq' | 'in' | 'gt' | 'lt' | 'truthy';
  value?: FormValue;
};

export type FormField = {
  /** Stable slug, unique inside the schema. */
  id: string;
  type: FieldType;
  label: string;
  helper?: string;
  placeholder?: string;
  required: boolean;
  default?: FormValue;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  options?: FieldOption[];
  minutesPerUnit?: number;
  showIf?: ShowIf;
  maxMedia?: number;
};

export type FormSection = { id: string; title: string; fields: FormField[] };

export type FormSchema = {
  id: string;
  /** Incremented on every admin save. */
  version: number;
  heading: string;
  sections: FormSection[];
  mediaRequired: boolean;
  mediaHint: string;
};

export type ScopeSnapshotRow = {
  fieldId: string;
  label: string;
  type: FieldType;
  value: FormValue;
  display: string;
};

export type BookingScope = {
  schemaId: string;
  schemaVersion: number;
  /** Keyed by field id. */
  answers: Record<string, FormValue>;
  notes?: string;
  snapshot?: ScopeSnapshotRow[];
};

const MAX_SECTIONS = 5;
const MAX_FIELDS_PER_SECTION = 12;
const MAX_FIELDS = 40;

export const fieldsOf = (schema: FormSchema): FormField[] =>
  schema.sections.flatMap((section) => section.fields);

export const findField = (schema: FormSchema, fieldId: string): FormField | undefined =>
  fieldsOf(schema).find((field) => field.id === fieldId);

const isEmpty = (value: FormValue | undefined): boolean =>
  value === undefined ||
  value === null ||
  value === '' ||
  (typeof value === 'number' && Number.isNaN(value)) ||
  (Array.isArray(value) && value.length === 0);

const asNumber = (value: FormValue): number | undefined => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const optionIds = (field: FormField): string[] => (field.options ?? []).map((option) => option.id);

const selectedIds = (value: FormValue): string[] => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value) return [value];
  return [];
};

/** Resolves the first matching schema id: service → category → default. */
export const resolveSchema = (
  schemas: readonly FormSchema[],
  ids: (string | undefined)[],
  fallback: FormSchema,
): FormSchema => {
  for (const id of ids) {
    if (!id) continue;
    const match = schemas.find((schema) => schema.id === id);
    if (match) return match;
  }
  return fallback;
};

/**
 * Structural validation, used by the admin before saving and by the app on load.
 * Returns an empty array when the schema is valid.
 */
export function validateSchema(schema: FormSchema): string[] {
  const errors: string[] = [];
  const allFields = fieldsOf(schema);

  if (!schema.id.trim()) errors.push('Schema id is required.');
  if (!Number.isInteger(schema.version) || schema.version < 1) {
    errors.push('Schema version must be a positive integer.');
  }
  if (schema.sections.length < 1 || schema.sections.length > MAX_SECTIONS) {
    errors.push(`A schema needs 1 to ${MAX_SECTIONS} sections.`);
  }
  if (allFields.length > MAX_FIELDS) {
    errors.push(`A schema can hold at most ${MAX_FIELDS} fields.`);
  }

  const sectionIds = new Set<string>();
  for (const section of schema.sections) {
    if (sectionIds.has(section.id)) errors.push(`Duplicate section id "${section.id}".`);
    sectionIds.add(section.id);

    if (section.fields.length < 1 || section.fields.length > MAX_FIELDS_PER_SECTION) {
      errors.push(`Section "${section.id}" needs 1 to ${MAX_FIELDS_PER_SECTION} fields.`);
    }
  }

  const seen = new Set<string>();
  allFields.forEach((field, index) => {
    if (seen.has(field.id)) errors.push(`Duplicate field id "${field.id}".`);
    seen.add(field.id);

    if (!FIELD_TYPES.includes(field.type)) {
      errors.push(`Field "${field.id}" has an unknown type "${field.type}".`);
    }
    if (!field.label.trim()) errors.push(`Field "${field.id}" needs a label.`);
    if (field.label.length > 60) errors.push(`Field "${field.id}" label is over 60 characters.`);
    if (field.helper && field.helper.length > 140) {
      errors.push(`Field "${field.id}" helper is over 140 characters.`);
    }
    if (field.min !== undefined && field.max !== undefined && field.min > field.max) {
      errors.push(`Field "${field.id}" minimum is greater than its maximum.`);
    }

    if (field.type === 'select' || field.type === 'multiselect') {
      const options = field.options ?? [];
      if (options.length < 2 || options.length > 20) {
        errors.push(`Field "${field.id}" needs 2 to 20 options.`);
      }
      const ids = new Set<string>();
      for (const option of options) {
        if (ids.has(option.id)) {
          errors.push(`Field "${field.id}" has duplicate option "${option.id}".`);
        }
        ids.add(option.id);
      }
    }

    if (field.showIf) {
      const target = allFields.findIndex((candidate) => candidate.id === field.showIf?.fieldId);
      if (target === -1) {
        errors.push(`Field "${field.id}" depends on an unknown field "${field.showIf.fieldId}".`);
      } else if (target >= index) {
        errors.push(`Field "${field.id}" depends on a field that comes after it.`);
      }
    }
  });

  return errors;
}

const conditionHolds = (cond: ShowIf, answers: Record<string, FormValue>): boolean => {
  const value = answers[cond.fieldId];

  switch (cond.op) {
    case 'truthy':
      return !isEmpty(value);
    case 'eq':
      return JSON.stringify(value ?? null) === JSON.stringify(cond.value ?? null);
    case 'neq':
      return JSON.stringify(value ?? null) !== JSON.stringify(cond.value ?? null);
    case 'in': {
      const allowed = Array.isArray(cond.value) ? cond.value : [cond.value];
      return selectedIds(value).some((id) => allowed.includes(id as string));
    }
    case 'gt': {
      const left = asNumber(value);
      const right = asNumber(cond.value ?? null);
      return left !== undefined && right !== undefined && left > right;
    }
    case 'lt': {
      const left = asNumber(value);
      const right = asNumber(cond.value ?? null);
      return left !== undefined && right !== undefined && left < right;
    }
    default:
      return false;
  }
};

/** Fields whose `showIf` passes, flattened in schema order. */
export function visibleFields(
  schema: FormSchema,
  answers: Record<string, FormValue>,
): FormField[] {
  return fieldsOf(schema).filter((field) => !field.showIf || conditionHolds(field.showIf, answers));
}

/** Answers for hidden fields are dropped so a stale value can never be submitted. */
export function visibleAnswers(
  schema: FormSchema,
  answers: Record<string, FormValue>,
): Record<string, FormValue> {
  const visible = visibleFields(schema, answers);
  return Object.fromEntries(
    visible
      .filter((field) => field.id in answers)
      .map((field) => [field.id, answers[field.id]]),
  );
}

/** Required, min/max and option membership for the fields that are currently visible. */
export function validateAnswers(
  schema: FormSchema,
  answers: Record<string, FormValue>,
  mediaCount = 0,
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const field of visibleFields(schema, answers)) {
    const value = answers[field.id];

    if (field.type === 'media-slot') {
      if (field.required && mediaCount === 0) errors[field.id] = 'Add at least one photo or video.';
      continue;
    }

    if (isEmpty(value)) {
      if (field.required) errors[field.id] = `${field.label} is required.`;
      continue;
    }

    if (field.type === 'number' || field.type === 'counter' || field.type === 'measurement') {
      const numeric =
        field.type === 'measurement' && value && typeof value === 'object' && !Array.isArray(value)
          ? value.value
          : asNumber(value);
      if (numeric === undefined) {
        errors[field.id] = `${field.label} needs a number.`;
      } else if (field.min !== undefined && numeric < field.min) {
        errors[field.id] = `${field.label} must be at least ${field.min}.`;
      } else if (field.max !== undefined && numeric > field.max) {
        errors[field.id] = `${field.label} must be at most ${field.max}.`;
      }
    }

    if (field.type === 'select') {
      const id = selectedIds(value)[0];
      if (id && !optionIds(field).includes(id)) {
        errors[field.id] = 'Choose one of the listed options.';
      }
    }

    if (field.type === 'multiselect') {
      const unknown = selectedIds(value).filter((id) => !optionIds(field).includes(id));
      if (unknown.length > 0) errors[field.id] = 'One of the chosen options is no longer available.';
    }
  }

  return errors;
}

/** Sum of time effects, or undefined when no visible field has one. */
export function suggestedMinutes(
  schema: FormSchema,
  answers: Record<string, FormValue>,
): number | undefined {
  let total = 0;
  let hasEffect = false;

  for (const field of visibleFields(schema, answers)) {
    const value = answers[field.id];
    if (field.minutesPerUnit !== undefined) {
      const numeric =
        field.type === 'measurement' && value && typeof value === 'object' && !Array.isArray(value)
          ? value.value
          : asNumber(value);
      if (numeric !== undefined && numeric > 0) {
        total += field.minutesPerUnit * numeric;
        hasEffect = true;
      }
    }
    if (field.type === 'select' || field.type === 'multiselect') {
      const chosen = selectedIds(value);
      for (const option of field.options ?? []) {
        if (option.minutes && chosen.includes(option.id)) {
          total += option.minutes;
          hasEffect = true;
        }
      }
    }
  }

  return hasEffect ? Math.round(total) : undefined;
}

/** True when a chosen option means the price has to be confirmed. */
export function requiresQuote(
  schema: FormSchema,
  answers: Record<string, FormValue>,
): boolean {
  return visibleFields(schema, answers).some((field) => {
    const chosen = selectedIds(answers[field.id]);
    return (field.options ?? []).some(
      (option) => option.flagsQuote && chosen.includes(option.id),
    );
  });
}

const optionLabel = (field: FormField, id: string): string =>
  field.options?.find((option) => option.id === id)?.label ?? id;

const displayValue = (field: FormField, value: FormValue): string => {
  if (isEmpty(value)) return '';

  switch (field.type) {
    case 'select':
      return optionLabel(field, selectedIds(value)[0]);
    case 'multiselect':
      return selectedIds(value)
        .map((id) => optionLabel(field, id))
        .join(', ');
    case 'boolean':
      return value === true ? 'Yes' : 'No';
    case 'measurement': {
      const measured = value as { value: number; unit: string };
      return `${measured.value} ${measured.unit}`;
    }
    case 'number':
    case 'counter': {
      const numeric = asNumber(value);
      return `${numeric ?? value}${field.unit ? ` ${field.unit}` : ''}`;
    }
    case 'media-slot': {
      const count = Array.isArray(value) ? value.length : 1;
      return count === 1 ? '1 file' : `${count} files`;
    }
    default:
      return String(value);
  }
};

/** Snapshot rows written when the booking is saved, for receipts and booking details. */
export function buildSnapshot(
  schema: FormSchema,
  answers: Record<string, FormValue>,
): ScopeSnapshotRow[] {
  return visibleFields(schema, answers)
    .filter((field) => field.type !== 'media-slot' && !isEmpty(answers[field.id]))
    .map((field) => ({
      fieldId: field.id,
      label: field.label,
      type: field.type,
      value: answers[field.id],
      display: displayValue(field, answers[field.id]),
    }));
}

/**
 * Draft safety when a schema changes: keep every answer whose field id and type still
 * match, drop the rest. Never wipes the draft.
 */
export function mergeAnswers(
  previous: FormSchema,
  previousAnswers: Record<string, FormValue>,
  next: FormSchema,
): Record<string, FormValue> {
  const previousTypes = new Map(fieldsOf(previous).map((field) => [field.id, field.type]));
  const nextFields = fieldsOf(next);
  const nextById = new Map(nextFields.map((field) => [field.id, field]));

  return Object.fromEntries(
    Object.entries(previousAnswers).filter(([id]) => {
      const nextField = nextById.get(id);
      return nextField !== undefined && previousTypes.get(id) === nextField.type;
    }),
  );
}

/** The global fallback schema, used when a service and its category set none. */
export const defaultSchema: FormSchema = {
  id: 'default',
  version: 1,
  heading: 'Tell us about the job',
  sections: [
    {
      id: 'details',
      title: 'Job details',
      fields: [
        {
          id: 'describe',
          type: 'textarea',
          label: 'Describe the job',
          helper: 'What needs doing, and anything we should bring?',
          placeholder: 'For example: the kitchen sink leaks under the cabinet.',
          required: true,
        },
        {
          id: 'size',
          type: 'select',
          label: 'Rough size',
          required: true,
          options: [
            { id: 'small', label: 'Small' },
            { id: 'medium', label: 'Medium' },
            { id: 'large', label: 'Large' },
            { id: 'unsure', label: 'Not sure' },
          ],
        },
        {
          id: 'urgency',
          type: 'select',
          label: 'How urgent?',
          required: false,
          options: [
            { id: 'flexible', label: 'Flexible' },
            { id: 'this-week', label: 'This week' },
            { id: 'urgent', label: 'Urgent', flagsQuote: true },
          ],
        },
        { id: 'evidence', type: 'media-slot', label: 'Photos', required: false, maxMedia: 5 },
      ],
    },
  ],
  mediaRequired: false,
  mediaHint: 'Photos help us quote accurately.',
};
