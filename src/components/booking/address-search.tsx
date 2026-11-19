import { Check, MapPin, Search } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import type { FixturePlace } from '@/config/location-fixtures';
import { usePlaceSearch } from '@/hooks/use-place-search';
import { colors, font, radius, space, text } from '@/theme';
import { selectionHaptic } from '@/utils/haptics';

import { Input } from '../ui/input';

type Props = {
  onPick: (place: FixturePlace) => void;
  onUseTypedAddress: (address: string) => void;
  onUseCurrentLocation: () => void;
  locating: boolean;
};

/**
 * P11 address finder: local suggestions, a manual-entry row and current
 * location. The suggestion shape follows Location_Fixtures.md so Google Places
 * can replace the bundled table without rewriting this screen.
 */
export function AddressSearch({
  onPick,
  onUseTypedAddress,
  onUseCurrentLocation,
  locating,
}: Props) {
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<string | null>(null);
  const { results, loading, error, showResults } = usePlaceSearch(query);

  const handlePick = (place: FixturePlace) => {
    selectionHaptic();
    setPicked(place.name);
    setQuery('');
    onPick(place);
  };

  const handleTyped = (address: string) => {
    setPicked(address);
    setQuery('');
    onUseTypedAddress(address);
  };

  return (
    <View style={styles.group}>
      <Text style={styles.label} maxFontSizeMultiplier={1.3}>
        Find your address
      </Text>
      <Input
        value={query}
        onChangeText={(value) => {
          setQuery(value);
          if (picked) setPicked(null);
        }}
        leftIcon={Search}
        placeholder="Search a street, estate or landmark"
        accessibilityLabel="Search for your address"
        helper={
          picked
            ? `Using ${picked}. Change the street or landmark below if needed.`
            : 'Start typing, or use your current location.'
        }
        autoCorrect={false}
        autoCapitalize="words"
        returnKeyType="search"
      />

      {showResults ? (
        <View style={styles.results}>
          {loading ? (
            <View style={styles.status}>
              <ActivityIndicator size="small" color={colors.green500} />
              <Text style={styles.statusText} maxFontSizeMultiplier={1.3}>
                Looking for places…
              </Text>
            </View>
          ) : null}

          {error ? (
            <Text style={styles.errorText} maxFontSizeMultiplier={1.3}>
              {error}
            </Text>
          ) : null}

          {!loading && results.length === 0 ? (
            <Text style={styles.statusText} maxFontSizeMultiplier={1.3}>
              No saved place matches. Use the address as entered, or the fields below.
            </Text>
          ) : null}

          {results.map((place) => (
            <Pressable
              key={place.id}
              accessibilityRole="button"
              accessibilityLabel={`Use ${place.name}, ${place.address}`}
              hitSlop={4}
              onPress={() => handlePick(place)}
              style={({ pressed }) => [styles.result, pressed && styles.resultPressed]}>
              <View style={styles.resultIcon}>
                <MapPin size={18} color={colors.green700} strokeWidth={2} />
              </View>
              <View style={styles.resultBody}>
                <Text style={styles.resultName} maxFontSizeMultiplier={1.3}>
                  {place.name}
                </Text>
                <Text style={styles.resultAddress} maxFontSizeMultiplier={1.3} numberOfLines={1}>
                  {place.address}
                </Text>
              </View>
              <Text style={styles.resultArea} maxFontSizeMultiplier={1.2}>
                {place.area}
              </Text>
            </Pressable>
          ))}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Use ${query.trim()} as the address`}
            hitSlop={4}
            onPress={() => handleTyped(query.trim())}
            style={({ pressed }) => [styles.manual, pressed && styles.resultPressed]}>
            <Text style={styles.manualText} maxFontSizeMultiplier={1.3} numberOfLines={2}>
              Use “{query.trim()}” as entered
            </Text>
          </Pressable>
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Use my current location"
        accessibilityState={{ disabled: locating, busy: locating }}
        disabled={locating}
        onPress={() => {
          setPicked(null);
          onUseCurrentLocation();
        }}
        style={({ pressed }) => [
          styles.current,
          pressed && styles.resultPressed,
          locating && styles.currentOff,
        ]}>
        <MapPin size={18} color={colors.green700} strokeWidth={2} />
        <Text style={styles.currentText} maxFontSizeMultiplier={1.3}>
          {locating ? 'Finding your location…' : 'Use my current location'}
        </Text>
        {locating ? <ActivityIndicator size="small" color={colors.green500} /> : null}
      </Pressable>

      {picked ? (
        <View style={styles.pickedRow}>
          <Check size={14} color={colors.success} strokeWidth={2.5} />
          <Text style={styles.pickedText} maxFontSizeMultiplier={1.3}>
            Filled from {picked}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: space[3] },
  label: { ...text.h3 },
  results: {
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    padding: space[3],
  },
  statusText: { ...text.caption, paddingHorizontal: space[3], paddingVertical: space[2] },
  errorText: { ...text.caption, color: colors.error, padding: space[3] },
  result: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    minHeight: 56,
    paddingHorizontal: space[3],
    paddingVertical: space[2],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  resultPressed: { backgroundColor: colors.green50 },
  resultIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.green50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultBody: { flex: 1, gap: 2 },
  resultName: { ...text.bodyM, fontFamily: font.bodySemi },
  resultAddress: { ...text.caption },
  resultArea: { ...text.caption, color: colors.green700, fontFamily: font.bodySemi },
  manual: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: space[3],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  manualText: { ...text.bodyM, color: colors.green700 },
  current: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    minHeight: 48,
    paddingHorizontal: space[3],
    borderRadius: radius.input,
    borderWidth: 1.5,
    borderColor: colors.green500,
    backgroundColor: colors.surface,
  },
  currentOff: { opacity: 0.6 },
  currentText: { ...text.bodyM, fontFamily: font.bodySemi, color: colors.green700, flex: 1 },
  pickedRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pickedText: { ...text.caption, color: colors.success, flexShrink: 1 },
});
