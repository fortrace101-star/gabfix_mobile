import { Camera, CircleAlert, Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ChipSelector } from '@/components/booking/chip-selector';
import { MeasurementInput, type Measurement } from '@/components/booking/measurement-input';
import { SelectableCard } from '@/components/booking/selectable-card';
import { CounterStepper } from '@/components/ui/counter-stepper';
import { Input } from '@/components/ui/input';
import { FIELD_TYPES, visibleFields, type FormField, type FormSchema, type FormValue } from '@/lib/form-schema';
import { chip, colors, font, radius, space, text } from '@/theme';
import { selectionHaptic } from '@/utils/haptics';

type Props = {
  schema: FormSchema;
  answers: Record<string, FormValue>;
  onChange: (fieldId: string, value: FormValue) => void;
  errors?: Record<string, string>;
  /** `draft.media` items belonging to this slot, for the "Photo of the leak" row. */
  mediaCountBySlot?: Record<string, number>;
  onMediaPress?: (slotId: string, field: FormField) => void;
};

const numberValue = (value: FormValue | undefined): number =>
  typeof value === 'number' ? value : Number(value ?? 0) || 0;

const stringValue = (value: FormValue | undefined): string =>
  typeof value === 'string' ? value : value == null ? '' : String(value);

/**
 * Draws any schema from the closed field catalogue (Section 14.4). It never reads a
 * service slug; the schema alone decides what the customer sees. An unknown field type
 * from a newer schema is skipped and treated as optional.
 */
export function DynamicForm({
  schema,
  answers,
  onChange,
  errors = {},
  mediaCountBySlot = {},
  onMediaPress,
}: Props) {
  const visibleIds = new Set(visibleFields(schema, answers).map((field) => field.id));

  return (
    <View style={styles.wrap}>
      {schema.sections.map((section) => {
        const fields = section.fields.filter((field) => visibleIds.has(field.id));
        if (fields.length === 0) return null;
        return (
          <View key={section.id} style={styles.section}>
            <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.3}>
              {section.title}
            </Text>
            {fields.map((field) => (
              <FieldControl
                key={field.id}
                field={field}
                value={answers[field.id]}
                error={errors[field.id]}
                mediaCount={mediaCountBySlot[field.id] ?? 0}
                onChange={(value) => onChange(field.id, value)}
                onMediaPress={onMediaPress ? () => onMediaPress(field.id, field) : undefined}
              />
            ))}
          </View>
        );
      })}
    </View>
  );
}

type FieldProps = {
  field: FormField;
  value: FormValue | undefined;
  error?: string;
  mediaCount: number;
  onChange: (value: FormValue) => void;
  onMediaPress?: () => void;
};

function FieldControl({ field, value, error, mediaCount, onChange, onMediaPress }: FieldProps) {
  if (!FIELD_TYPES.includes(field.type)) return null;

  switch (field.type) {
    case 'text':
      return (
        <Input
          label={field.label}
          helper={field.helper}
          error={error}
          placeholder={field.placeholder}
          value={stringValue(value)}
          onChangeText={onChange}
          accessibilityLabel={field.label}
        />
      );

    case 'textarea':
      return (
        <Input
          label={field.label}
          helper={field.helper}
          error={error}
          placeholder={field.placeholder}
          value={stringValue(value)}
          onChangeText={onChange}
          multiline
          numberOfLines={4}
          inputStyle={styles.textarea}
          accessibilityLabel={field.label}
        />
      );

    case 'number':
      return (
        <Input
          label={field.unit ? `${field.label} (${field.unit})` : field.label}
          helper={field.helper}
          error={error}
          placeholder={field.placeholder}
          value={value == null ? '' : String(value)}
          onChangeText={(next) => {
            const numeric = Number(next);
            onChange(next.trim() === '' || !Number.isFinite(numeric) ? null : numeric);
          }}
          keyboardType="decimal-pad"
          accessibilityLabel={field.label}
        />
      );

    case 'counter':
      return (
        <CounterStepper
          label={field.label}
          hint={field.helper}
          value={numberValue(value)}
          onChange={onChange}
          min={field.min ?? 0}
          max={field.max ?? 20}
        />
      );

    case 'select': {
      const options = field.options ?? [];
      const selected = typeof value === 'string' ? value : '';
      return (
        <View style={styles.field}>
          <Text style={styles.label} maxFontSizeMultiplier={1.3}>
            {field.label}
            {field.required ? <Text style={styles.required}> *</Text> : null}
          </Text>
          {field.helper ? <Text style={styles.helper}>{field.helper}</Text> : null}
          {/* Radio cards up to 6 options; a chip picker beyond that keeps one screen usable. */}
          {options.length <= 6 ? (
            <View style={styles.cards}>
              {options.map((option) => (
                <SelectableCard
                  key={option.id}
                  title={option.label}
                  subtitle={option.hint}
                  selected={selected === option.id}
                  onPress={() => onChange(option.id)}
                />
              ))}
            </View>
          ) : (
            <ChipSelector
              options={options.map((option) => ({ value: option.id, label: option.label }))}
              value={selected}
              onChange={onChange}
            />
          )}
          <FieldError message={error} />
        </View>
      );
    }

    case 'multiselect': {
      const selected = Array.isArray(value) ? value : [];
      return (
        <View style={styles.field}>
          <Text style={styles.label} maxFontSizeMultiplier={1.3}>
            {field.label}
            {field.required ? <Text style={styles.required}> *</Text> : null}
          </Text>
          {field.helper ? <Text style={styles.helper}>{field.helper}</Text> : null}
          <View style={styles.chips}>
            {(field.options ?? []).map((option) => {
              const on = selected.includes(option.id);
              return (
                <Pressable
                  key={option.id}
                  accessibilityRole="checkbox"
                  accessibilityLabel={option.label}
                  accessibilityState={{ checked: on }}
                  onPress={() => {
                    selectionHaptic();
                    onChange(
                      on ? selected.filter((id) => id !== option.id) : [...selected, option.id],
                    );
                  }}
                  style={[chip.base, on && chip.selected, styles.chip]}>
                  <Text style={[styles.chipText, on && styles.chipTextOn]} maxFontSizeMultiplier={1.3}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <FieldError message={error} />
        </View>
      );
    }

    case 'boolean':
      return (
        <View style={styles.field}>
          <Text style={styles.label} maxFontSizeMultiplier={1.3}>
            {field.label}
            {field.required ? <Text style={styles.required}> *</Text> : null}
          </Text>
          {field.helper ? <Text style={styles.helper}>{field.helper}</Text> : null}
          <ChipSelector
            options={[
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' },
            ]}
            value={value === true ? 'yes' : value === false ? 'no' : ''}
            onChange={(next) => onChange(next === 'yes')}
          />
          <FieldError message={error} />
        </View>
      );

    case 'measurement':
      return (
        <MeasurementInput
          label={field.label}
          helper={field.helper}
          error={error}
          unit={field.unit}
          value={
            value && typeof value === 'object' && !Array.isArray(value)
              ? (value as Measurement)
              : null
          }
          onChange={(next) => onChange(next)}
        />
      );

    case 'media-slot': {
      const max = field.maxMedia ?? 5;
      return (
        <View style={styles.field}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${field.label}. ${mediaCount} of ${max} added`}
            onPress={() => {
              selectionHaptic();
              onMediaPress?.();
            }}
            style={[styles.media, error ? styles.mediaError : null]}>
            {mediaCount > 0 ? <Camera size={18} color={colors.green700} strokeWidth={2} /> : <Plus size={18} color={colors.green700} strokeWidth={2} />}
            <View style={styles.mediaText}>
              <Text style={styles.label} maxFontSizeMultiplier={1.3}>
                {field.label}
                {field.required ? <Text style={styles.required}> *</Text> : null}
              </Text>
              <Text style={styles.helper} maxFontSizeMultiplier={1.3}>
                {mediaCount > 0 ? `${mediaCount} of ${max} added` : field.helper ?? 'Add a photo or video'}
              </Text>
            </View>
          </Pressable>
          <FieldError message={error} />
        </View>
      );
    }

    default:
      return null;
  }
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <View style={styles.errorRow} accessibilityLiveRegion="polite">
      <CircleAlert size={14} color={colors.error} strokeWidth={2} />
      <Text style={styles.error} maxFontSizeMultiplier={1.3}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space[4] },
  section: { gap: space[4] },
  sectionTitle: {
    ...text.bodyM,
    fontFamily: font.bodySemi,
    color: colors.text,
    marginBottom: -space[1],
  },
  field: { gap: 6 },
  label: { ...text.bodyM, fontFamily: font.bodySemi, color: colors.text },
  required: { color: colors.error },
  helper: { ...text.caption, color: colors.textMuted },
  textarea: { minHeight: 96, textAlignVertical: 'top', paddingTop: space[3] },
  cards: { gap: space[2], marginTop: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 4 },
  chip: { minWidth: 64 },
  chipText: { ...text.bodyM, fontFamily: font.bodySemi, color: colors.green700 },
  chipTextOn: { color: colors.surface },
  media: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    minHeight: 56,
    paddingHorizontal: space[3],
    borderRadius: radius.input,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.green50,
  },
  mediaError: { borderColor: colors.error },
  mediaText: { flex: 1, gap: 2 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: space[1], marginTop: 4 },
  error: { ...text.caption, color: colors.error, flexShrink: 1 },
});
