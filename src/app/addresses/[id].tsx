import { router, useLocalSearchParams, type Href } from 'expo-router';
import { Check, MapPin } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { KeyboardScreen } from '@/components/ui/keyboard-screen';
import { TopBar } from '@/components/ui/top-bar';
import type { BookingLocation } from '@/lib/pricing';
import {
  addAddress,
  updateAddress,
  useAddresses,
  useAddressesHydrated,
  type AddressLabel,
} from '@/store/addresses';
import { colors, font, radius, space, text } from '@/theme';

const LABELS: AddressLabel[] = ['Home', 'Work', 'Other'];

const PROPERTY_TYPES: { value: BookingLocation['propertyType']; label: string }[] = [
  { value: 'house', label: 'House' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'office', label: 'Office' },
];

/**
 * P24 add/edit address. No map picker or Places lookup: the launch build keeps the
 * coordinates an address already had and otherwise asks the customer for the area.
 */
export default function AddressFormScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const addresses = useAddresses();
  const hydrated = useAddressesHydrated();
  const existing = useMemo(
    () => addresses.find((address) => address.id === id),
    [addresses, id],
  );

  const [label, setLabel] = useState<AddressLabel>(existing?.label ?? 'Home');
  const [street, setStreet] = useState(existing?.street ?? '');
  const [landmark, setLandmark] = useState(existing?.landmark ?? '');
  const [access, setAccess] = useState(existing?.access ?? '');
  const [locality, setLocality] = useState(existing?.area ?? '');
  const [propertyType, setPropertyType] = useState<BookingLocation['propertyType']>(
    existing?.propertyType ?? 'house',
  );
  const [makeDefault, setMakeDefault] = useState(existing?.isDefault ?? false);
  const [streetError, setStreetError] = useState('');
  const [saving, setSaving] = useState(false);

  const save = () => {
    const nextStreet = street.trim();
    if (nextStreet.length < 3) {
      setStreetError('Add the street, plot or building name.');
      return;
    }
    setSaving(true);
    const payload = {
      label,
      street: nextStreet,
      landmark: landmark.trim() || undefined,
      access: access.trim() || undefined,
      area: locality.trim(),
      propertyType,
      lat: existing?.lat,
      lng: existing?.lng,
      isDefault: makeDefault,
    };
    if (isNew) {
      addAddress(payload);
    } else if (existing) {
      updateAddress(existing.id, payload);
    }
    router.back();
  };

  if (!isNew && (!hydrated || !existing)) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <TopBar title="Address" onBack={() => router.back()} />
        <View style={styles.missing}>
          <Text style={styles.missingTitle} maxFontSizeMultiplier={1.3}>
            {hydrated ? 'This address is no longer saved' : 'Loading your addresses…'}
          </Text>
          {hydrated ? (
            <Button
              label="Back to saved addresses"
              onPress={() => router.replace('/addresses' as Href)}
            />
          ) : null}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <TopBar title={isNew ? 'Add address' : 'Edit address'} onBack={() => router.back()} />
      <KeyboardScreen style={styles.flex} contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.3}>
            Label
          </Text>
          <View style={styles.chipRow}>
            {LABELS.map((option) => {
              const selected = label === option;
              return (
                <Pressable
                  key={option}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={option}
                  onPress={() => setLabel(option)}
                  style={[styles.chip, selected && styles.chipSelected]}>
                  <Text
                    style={[styles.chipText, selected && styles.chipTextSelected]}
                    maxFontSizeMultiplier={1.2}>
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Input
          label="Street, plot or building"
          placeholder="e.g. Plot 14, Ntinda Road"
          value={street}
          onChangeText={(value) => {
            setStreet(value);
            if (streetError) setStreetError('');
          }}
          error={streetError}
          autoCapitalize="words"
          returnKeyType="next"
        />

        <Input
          label="Landmark (optional)"
          placeholder="e.g. Near Shell petrol station, blue gate"
          value={landmark}
          onChangeText={setLandmark}
          autoCapitalize="sentences"
        />

        <Input
          label="Access notes (optional)"
          placeholder="e.g. Call on arrival, gate code 1234"
          value={access}
          onChangeText={setAccess}
          multiline
          numberOfLines={3}
          inputStyle={styles.multiline}
          autoCapitalize="sentences"
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.3}>
            Neighbourhood (optional)
          </Text>
          <Input
            value={locality}
            onChangeText={setLocality}
            placeholder="e.g. Kireka"
            maxLength={60}
            autoCapitalize="words"
            accessibilityLabel="Neighbourhood, optional"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.3}>
            Property type
          </Text>
          <View style={styles.chipRow}>
            {PROPERTY_TYPES.map((option) => {
              const selected = propertyType === option.value;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={option.label}
                  onPress={() => setPropertyType(option.value)}
                  style={[styles.chip, selected && styles.chipSelected]}>
                  <Text
                    style={[styles.chipText, selected && styles.chipTextSelected]}
                    maxFontSizeMultiplier={1.2}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {!existing?.isDefault ? (
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: makeDefault }}
            accessibilityLabel="Use as my default address"
            onPress={() => setMakeDefault((value) => !value)}
            style={styles.defaultRow}>
            <View style={[styles.checkbox, makeDefault && styles.checkboxChecked]}>
              {makeDefault ? <Check size={16} color={colors.surface} strokeWidth={3} /> : null}
            </View>
            <View style={styles.defaultTextWrap}>
              <Text style={styles.defaultTitle} maxFontSizeMultiplier={1.3}>
                Use as my default address
              </Text>
              <Text style={styles.defaultBody} maxFontSizeMultiplier={1.3}>
                Picked first whenever you book.
              </Text>
            </View>
          </Pressable>
        ) : null}

        {existing && !existing.landmark ? (
          <View style={styles.pinNote}>
            <MapPin size={16} color={colors.textMuted} strokeWidth={2} />
            <Text style={styles.pinNoteText} maxFontSizeMultiplier={1.3}>
              No map pin saved. Your area and landmark are enough for the team to find you.
            </Text>
          </View>
        ) : null}

        <Button label={isNew ? 'Save address' : 'Save changes'} loading={saving} onPress={save} />
      </KeyboardScreen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  content: { padding: space[4], gap: space[5], paddingBottom: 120 },
  section: { gap: space[3] },
  sectionTitle: { ...text.bodyM, color: colors.text, fontFamily: font.bodySemi },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  chip: {
    minHeight: 48,
    paddingHorizontal: space[5],
    borderRadius: radius.input,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: { backgroundColor: colors.green500, borderColor: colors.green500 },
  chipText: { ...text.bodyM, color: colors.text },
  chipTextSelected: { color: colors.surface, fontFamily: font.bodySemi },
  multiline: { height: 96, paddingTop: space[3], textAlignVertical: 'top' },
  areaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: space[4],
  },
  areaRowError: { borderColor: colors.error },
  areaTextWrap: { flex: 1, gap: 2 },
  areaLabel: { ...text.caption },
  areaValue: { ...text.bodyL, color: colors.text, fontFamily: font.bodyMedium },
  error: { ...text.caption, color: colors.error },
  defaultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: space[4],
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: colors.green500, borderColor: colors.green500 },
  defaultTextWrap: { flex: 1, gap: 2 },
  defaultTitle: { ...text.bodyM, color: colors.text },
  defaultBody: { ...text.caption },
  pinNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[2],
    backgroundColor: colors.green50,
    borderRadius: radius.tile,
    padding: space[3],
  },
  pinNoteText: { ...text.caption, flex: 1 },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space[6], gap: space[4] },
  missingTitle: { ...text.h3, color: colors.text, textAlign: 'center' },
});
