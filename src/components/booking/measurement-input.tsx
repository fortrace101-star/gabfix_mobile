import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ChipSelector } from '@/components/booking/chip-selector';
import { Input } from '@/components/ui/input';
import { space } from '@/theme';

export const MEASUREMENT_UNITS = ['m²', 'm', 'ft'] as const;
export type MeasurementUnit = (typeof MEASUREMENT_UNITS)[number];

export type Measurement = { value: number; unit: string };

type Props = {
  label: string;
  helper?: string;
  error?: string;
  value: Measurement | null;
  unit?: string;
  onChange: (value: Measurement | null) => void;
};

const toText = (value: Measurement | null): string =>
  value ? String(value.value) : '';

/**
 * Number plus a unit choice, stored as `{ value, unit }` (Section 14.4). The text is kept
 * locally so a first digit is not rejected before the number is complete.
 */
export function MeasurementInput({ label, helper, error, value, unit, onChange }: Props) {
  const [text, setText] = useState(toText(value));
  const [chosenUnit, setChosenUnit] = useState(value?.unit ?? unit ?? MEASUREMENT_UNITS[0]);

  useEffect(() => {
    const next = toText(value);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setText(next);
    if (value?.unit) setChosenUnit(value.unit);
  }, [value]);

  const handleText = (next: string) => {
    setText(next);
    const numeric = Number(next);
    onChange(next.trim() === '' || !Number.isFinite(numeric) ? null : { value: numeric, unit: chosenUnit });
  };

  const handleUnit = (next: string) => {
    setChosenUnit(next);
    const numeric = Number(text);
    if (text.trim() !== '' && Number.isFinite(numeric)) onChange({ value: numeric, unit: next });
  };

  return (
    <View style={styles.wrap}>
      <Input
        label={label}
        helper={helper}
        error={error}
        value={text}
        onChangeText={handleText}
        keyboardType="decimal-pad"
        placeholder="0"
        accessibilityLabel={label}
        containerStyle={styles.field}
      />
      <ChipSelector
        options={MEASUREMENT_UNITS.map((option) => ({ value: option, label: option }))}
        value={chosenUnit}
        onChange={handleUnit}
        itemStyle={styles.unit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space[1] },
  field: { flex: 1 },
  unit: { minWidth: 0 },
});
