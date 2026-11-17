import { Check, LocateFixed, Search, X } from 'lucide-react-native';
import * as Location from 'expo-location';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { allAreas, areaSections, type Area } from '@/config/areas';
import { Button } from '@/components/ui/button';
import { useStatusBarStyle } from '@/hooks/use-status-bar-style';
import { Input } from '@/components/ui/input';
import { colors, font, radius, size, space, text } from '@/theme';
import { useOnboardingArea, setArea } from '@/store/onboarding';
import { selectionHaptic } from '@/utils/haptics';

export default function AreaSelectScreen() {
  const insets = useSafeAreaInsets();
  useStatusBarStyle('dark');
  const params = useLocalSearchParams<{ next?: string; firstRun?: string }>();
  const storedArea = useOnboardingArea();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Area | null>(storedArea);
  const [locating, setLocating] = useState(false);

  const firstRun = params.firstRun === '1';
  const next = typeof params.next === 'string' ? params.next : undefined;

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    return areaSections
      .map((section) => ({
        title: section.title,
        data: section.data.filter(
          (item) =>
            !q ||
            item.name.toLowerCase().includes(q) ||
            item.division.toLowerCase().includes(q),
        ),
      }))
      .filter((section) => section.data.length > 0);
  }, [query]);

  const notifyMe = (area: Area) =>
    Alert.alert(
      `${area.name} is coming soon`,
      `We're not serving ${area.name} yet. Add your name and we'll text you as soon as cleaners are available.`,
      [
        { text: 'Notify me', onPress: () => selectionHaptic() },
        { text: 'Close', style: 'cancel' },
      ],
    );

  const choose = (area: Area) => {
    if (!area.served) {
      notifyMe(area);
      return;
    }
    selectionHaptic();
    setSelected(area);
  };

  const useCurrentLocation = async () => {
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert(
          'Location permission needed',
          'We use your location only to place your pin and find nearby cleaners. You can also pick your area below.',
        );
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const places = await Location.reverseGeocodeAsync(position.coords);
      const place = places[0];
      const haystack = [
        place?.city,
        place?.subregion,
        place?.district,
        place?.name,
        place?.street,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const match =
        allAreas.find((item) => item.served && haystack.includes(item.name.toLowerCase())) ??
        allAreas.find((item) => item.served && haystack.includes(item.division.toLowerCase()));

      if (match) {
        setSelected(match);
        selectionHaptic();
        Alert.alert('Area found', `We'll serve you in ${match.name}, ${match.division}.`);
      } else {
        Alert.alert(
          "We don't serve this area yet",
          'Pick your division below and use Notify me to hear when we expand.',
        );
      }
    } catch {
      Alert.alert(
        'Location unavailable',
        'Turn on location services, or pick your area from the list below.',
      );
    } finally {
      setLocating(false);
    }
  };

  const confirm = () => {
    if (!selected) return;
    setArea(selected);
    if (next) {
      if (router.canDismiss()) router.dismissAll();
      router.replace(next as Href);
      return;
    }
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          {firstRun ? <Text style={styles.eyebrow}>One last step</Text> : null}
          <Text accessibilityRole="header" style={styles.title}>
            Where do you need cleaning?
          </Text>
          <Text style={styles.subtitle}>Choose your area so we can show the right cleaners.</Text>
        </View>
        {!firstRun ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close area selector"
            hitSlop={8}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))}
            style={styles.close}>
            <X size={size.icon} color={colors.text} strokeWidth={2} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.search}>
        <Input
          value={query}
          onChangeText={setQuery}
          placeholder="Search an area or division"
          leftIcon={Search}
          autoCapitalize="none"
          returnKeyType="search"
          accessibilityLabel="Search an area or division"
        />
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Use my current location"
        onPress={useCurrentLocation}
        disabled={locating}
        style={({ pressed }) => [styles.locationRow, pressed && styles.pressed]}>
        <View style={styles.locationIcon}>
          <LocateFixed size={size.icon} color={colors.green500} strokeWidth={2} />
        </View>
        <View style={styles.locationText}>
          <Text style={styles.locationTitle}>Use my current location</Text>
          <Text style={styles.locationCaption}>
            {locating ? 'Finding your area…' : "We'll match you to the nearest served area"}
          </Text>
        </View>
        {locating ? <ActivityIndicator color={colors.green500} /> : null}
      </Pressable>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.list}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        renderItem={({ item }) => {
          const isSelected = selected?.id === item.id;
          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${item.name}, ${item.division}${item.served ? '' : ', coming soon'}`}
              onPress={() => choose(item)}
              style={[
                styles.row,
                isSelected && styles.rowSelected,
                !item.served && styles.rowUnserved,
              ]}>
              <Text style={[styles.rowText, isSelected && styles.rowTextSelected]}>
                {item.name}
              </Text>
              {!item.served ? (
                <View style={styles.soonPill}>
                  <Text style={styles.soonText}>Coming soon</Text>
                </View>
              ) : isSelected ? (
                <Check size={size.icon} color={colors.green500} strokeWidth={2.5} />
              ) : null}
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No areas match “{query.trim()}”</Text>
            <Text style={styles.emptyBody}>
              Try a division like Nakawa, or request a custom service and we&apos;ll check for you.
            </Text>
          </View>
        }
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + space[4] }]}>
        <Button
          label={selected ? `Continue with ${selected.name}` : 'Continue'}
          onPress={confirm}
          disabled={!selected}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[3],
    paddingHorizontal: space[4],
    paddingTop: space[4],
  },
  headerText: { flex: 1, gap: space[1] },
  eyebrow: { ...text.caption, color: colors.green700, fontFamily: font.bodySemi },
  title: { ...text.h2 },
  subtitle: { ...text.body, color: colors.textMuted },
  close: {
    width: size.touch,
    height: size.touch,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -space[2],
  },
  search: { paddingHorizontal: space[4], paddingTop: space[4] },
  locationRow: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    paddingHorizontal: space[4],
    marginTop: space[2],
  },
  pressed: { opacity: 0.7 },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.input,
    backgroundColor: colors.green50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationText: { flex: 1, gap: 2 },
  locationTitle: { ...text.bodyM, fontFamily: font.bodySemi, color: colors.green700 },
  locationCaption: { ...text.caption },
  list: { paddingBottom: space[4] },
  sectionHeader: {
    ...text.caption,
    fontFamily: font.bodySemi,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    backgroundColor: colors.bg,
    paddingVertical: space[2],
    paddingHorizontal: space[4],
    color: colors.textMuted,
  },
  row: {
    height: 52,
    paddingHorizontal: space[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[3],
  },
  rowSelected: { backgroundColor: colors.green50 },
  rowUnserved: { opacity: 0.6 },
  rowText: { ...text.bodyL, flex: 1 },
  rowTextSelected: { fontFamily: font.bodySemi, color: colors.green700 },
  soonPill: {
    height: 24,
    paddingHorizontal: space[2],
    borderRadius: radius.pill,
    backgroundColor: colors.yellow50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soonText: { ...text.caption, color: colors.yellow800, fontFamily: font.bodySemi },
  empty: { padding: space[6], gap: space[2], alignItems: 'center' },
  emptyTitle: { ...text.bodyM, fontFamily: font.bodySemi, textAlign: 'center' },
  emptyBody: { ...text.body, color: colors.textMuted, textAlign: 'center' },
  footer: {
    paddingHorizontal: space[4],
    paddingTop: space[3],
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
