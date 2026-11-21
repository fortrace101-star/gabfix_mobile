import {
  buildSnapshot,
  defaultSchema,
  mergeAnswers,
  requiresQuote,
  suggestedMinutes,
  validateAnswers,
  validateSchema,
  visibleAnswers,
  visibleFields,
  type FormSchema,
} from '@/lib/form-schema';
import { formSchemas, schemaFor } from '@/config/form-schemas';

const base = (): FormSchema => ({
  id: 'test',
  version: 1,
  heading: 'Test',
  mediaRequired: false,
  mediaHint: '',
  sections: [
    {
      id: 'one',
      title: 'One',
      fields: [
        {
          id: 'rooms',
          type: 'counter',
          label: 'Rooms',
          required: true,
          min: 1,
          max: 5,
          minutesPerUnit: 30,
        },
        {
          id: 'size',
          type: 'select',
          label: 'Size',
          required: true,
          options: [
            { id: 'small', label: 'Small' },
            { id: 'large', label: 'Large', minutes: 45, flagsQuote: true },
          ],
        },
        { id: 'describe', type: 'textarea', label: 'Describe', required: false },
      ],
    },
  ],
});

describe('validateSchema', () => {
  it('accepts the seed schemas and the default schema', () => {
    for (const schema of formSchemas) expect(validateSchema(schema)).toEqual([]);
  });

  it('rejects duplicate field ids', () => {
    const schema = base();
    schema.sections[0].fields[1].id = 'rooms';
    expect(validateSchema(schema).join(' ')).toMatch(/Duplicate field id/);
  });

  it('rejects a showIf that points forward', () => {
    const schema = base();
    schema.sections[0].fields[0].showIf = { fieldId: 'size', op: 'truthy' };
    expect(validateSchema(schema).join(' ')).toMatch(/comes after it/);
  });

  it('rejects more than 40 fields', () => {
    const schema = base();
    schema.sections = [
      {
        id: 'many',
        title: 'Many',
        fields: Array.from({ length: 41 }, (_, index) => ({
          id: `field-${index}`,
          type: 'text' as const,
          label: `Field ${index}`,
          required: false,
        })),
      },
    ];
    expect(validateSchema(schema).join(' ')).toMatch(/at most 40 fields/);
  });

  it('rejects a select with one option', () => {
    const schema = base();
    schema.sections[0].fields[1].options = [{ id: 'only', label: 'Only' }];
    expect(validateSchema(schema).join(' ')).toMatch(/2 to 20 options/);
  });
});

describe('visibleFields', () => {
  it('hides fields whose showIf fails and drops their answers', () => {
    const schema = base();
    schema.sections[0].fields[2].showIf = { fieldId: 'size', op: 'eq', value: 'large' };

    const answers = { rooms: 2, size: 'small', describe: 'stale' };
    expect(visibleFields(schema, answers).map((field) => field.id)).toEqual(['rooms', 'size']);
    expect(visibleAnswers(schema, answers)).toEqual({ rooms: 2, size: 'small' });
  });
});

describe('validateAnswers', () => {
  it('covers required, min, max and unknown options', () => {
    const schema = base();
    expect(validateAnswers(schema, {})).toEqual({
      rooms: 'Rooms is required.',
      size: 'Size is required.',
    });

    expect(validateAnswers(schema, { rooms: 0, size: 'small' }).rooms).toMatch(/at least 1/);
    expect(validateAnswers(schema, { rooms: 9, size: 'small' }).rooms).toMatch(/at most 5/);
    expect(validateAnswers(schema, { rooms: 2, size: 'giant' }).size).toMatch(/listed options/);
    expect(validateAnswers(schema, { rooms: 2, size: 'large' })).toEqual({});
  });

  it('blocks a required media slot when nothing is attached', () => {
    const schema = base();
    schema.sections[0].fields.push({
      id: 'photo',
      type: 'media-slot',
      label: 'Photo',
      required: true,
    });
    expect(validateAnswers(schema, { rooms: 2, size: 'small' }, 0)).toEqual({
      photo: 'Add at least one photo or video.',
    });
    expect(validateAnswers(schema, { rooms: 2, size: 'small' }, 1)).toEqual({});
  });
});

describe('suggestedMinutes', () => {
  it('returns undefined when no visible field has a time effect', () => {
    const schema = base();
    schema.sections[0].fields = [
      { id: 'note', type: 'text', label: 'Note', required: false },
    ];
    expect(suggestedMinutes(schema, { note: 'hello' })).toBeUndefined();
  });

  it('sums counter units and chosen option minutes', () => {
    expect(suggestedMinutes(base(), { rooms: 2, size: 'large' })).toBe(105);
    expect(suggestedMinutes(base(), { rooms: 2, size: 'small' })).toBe(60);
  });
});

describe('requiresQuote', () => {
  it('follows flagsQuote on a chosen option only', () => {
    expect(requiresQuote(base(), { size: 'large' })).toBe(true);
    expect(requiresQuote(base(), { size: 'small' })).toBe(false);
  });
});

describe('buildSnapshot', () => {
  it('renders display text for every type', () => {
    const schema: FormSchema = {
      ...base(),
      sections: [
        {
          id: 'all',
          title: 'All',
          fields: [
            { id: 'note', type: 'text', label: 'Note', required: false },
            { id: 'rooms', type: 'counter', label: 'Rooms', required: false, unit: 'rooms' },
            {
              id: 'area',
              type: 'measurement',
              label: 'Area',
              required: false,
            },
            {
              id: 'focus',
              type: 'multiselect',
              label: 'Focus',
              required: false,
              options: [
                { id: 'a', label: 'Alpha' },
                { id: 'b', label: 'Beta' },
              ],
            },
            { id: 'urgent', type: 'boolean', label: 'Urgent', required: false },
            {
              id: 'photo',
              type: 'media-slot',
              label: 'Photo',
              required: false,
            },
          ],
        },
      ],
    };

    const rows = buildSnapshot(schema, {
      note: 'Leaking tap',
      rooms: 3,
      area: { value: 12, unit: 'm²' },
      focus: ['a', 'b'],
      urgent: true,
      photo: ['1', '2'],
    });

    expect(rows.map((row) => row.display)).toEqual([
      'Leaking tap',
      '3 rooms',
      '12 m²',
      'Alpha, Beta',
      'Yes',
    ]);
  });

  it('does not throw on a field type this build does not know', () => {
    const schema = base();
    schema.sections[0].fields.push({
      id: 'future',
      type: 'signature' as never,
      label: 'Signature',
      required: false,
    });

    expect(() => buildSnapshot(schema, { 'future': 'signed' } as never)).not.toThrow();
  });
});

describe('draft safety', () => {
  it('keeps matching answers when the schema version changes', () => {
    const previous = base();
    const next = base();
    next.version = 2;
    next.sections[0].fields[1].type = 'text';

    expect(
      mergeAnswers(previous, { rooms: 2, size: 'small', describe: 'hi' }, next),
    ).toEqual({ rooms: 2, describe: 'hi' });
  });

  it('resolves a service schema before its category and falls back to default', () => {
    expect(schemaFor(undefined, 'cleaning').id).toBe('cleaning');
    expect(schemaFor('upholstery', 'cleaning').id).toBe('upholstery');
    expect(schemaFor(undefined, 'unknown').id).toBe(defaultSchema.id);
  });
});
