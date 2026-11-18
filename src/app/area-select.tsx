import { Check, LocateFixed, Search, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
import { Blob } from '@/components/auth/blob';
import { GlassInput } from '@/components/auth/glass-input';
import { PillButton } from '@/components/auth/pill-button';
import { useStatusBarStyle } from '@/hooks/use-status-bar-style';
import { auth, font, size, space } from '@/theme';
import { useOnboardingArea, setArea } from '@/store/onboarding';
import { selectionHaptic } from '@/utils/haptics';

export default function AreaSelectScreen() {
  const insets = useSafeAreaInsets();
  useStatusBarStyle('light');
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
      const haystack = [place?.city, place?.subregion, place?.district, place?.name, place?.street]
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
    <LinearGradient
      colors={[auth.bgTop, auth.bgBottom]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.screen}>
      <Blob variant="topRight" ratio={0.34} />

      <View style={{ paddingTop: insets.top }}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            {firstRun ? (
              <Text style={styles.eyebrow} maxFontSizeMultiplier={1.3}>
                ONE LAST STEP
              </Text>
            ) : null}
            <Text accessibilityRole="header" style={styles.title} maxFontSizeMultiplier={1.3}>
              Where do you need cleaning?
            </Text>
            <Text style={styles.subtitle} maxFontSizeMultiplier={1.3}>
              Choose your area so we can show the right cleaners.
            </Text>
          </View>
          {!firstRun ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close area selector"
              hitSlop={8}
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))}
              style={styles.close}>
              <X size={size.icon} color={auth.text} strokeWidth={2} />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.search}>
          <GlassInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search an area or division"
            icon={Search}
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
          <LocateFixed size={20} color={auth.text} strokeWidth={2} />
          <View style={styles.locationText}>
            <Text style={styles.locationTitle} maxFontSizeMultiplier={1.3}>
              Use my current location
            </Text>
            <Text style={styles.locationCaption} maxFontSizeMultiplier={1.3}>
              {locating ? 'Finding your area…' : "We'll match you to the nearest served area"}
            </Text>
          </View>
          {locating ? <ActivityIndicator color={auth.text} /> : null}
        </Pressable>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.list}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader} maxFontSizeMultiplier={1.3}>
            {section.title}
          </Text>
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
              <Text
                style={[styles.rowText, isSelected && styles.rowTextSelected]}
                maxFontSizeMultiplier={1.3}>
                {item.name}
              </Text>
              {!item.served ? (
                <View style={styles.soonPill}>
                  <Text style={styles.soonText} maxFontSizeMultiplier={1.3}>
                    Coming soon
                  </Text>
                </View>
              ) : isSelected ? (
                <Check size={size.icon} color={auth.btnText} strokeWidth={2.5} />
              ) : null}
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle} maxFontSizeMultiplier={1.3}>
              No areas match “{query.trim()}”
            </Text>
            <Text style={styles.emptyBody} maxFontSizeMultiplier={1.3}>
              Try a division like Nakawa, or request a custom service and we&apos;ll check for you.
            </Text>
          </View>
        }
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + space[4] }]}>
        <PillButton
          label={selected ? `Continue with ${selected.name}` : 'Continue'}
          onPress={confirm}
          disabled={!selected}
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[3],
    paddingHorizontal: space[4],
    paddingTop: space[4],
  },
  headerText: { flex: 1, gap: 2 },
  eyebrow: {
    fontFamily: font.poppinsSemi,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.6,
    color: auth.textSoft,
  },
  title: {
    fontFamily: font.poppinsSemi,
    fontSize: 22,
    lineHeight: 28,
    color: auth.text,
  },
  subtitle: {
    fontFamily: font.poppins,
    fontSize: 12,
    lineHeight: 18,
    color: auth.textSoft,
  },
  close: {
    width: size.touch,
    height: size.touch,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -space[2],
  },
  search: { paddingHorizontal: space[4], paddingTop: space[4] },
  locationRow: {
    height: 56,
    borderRadius: 999,
    backgroundColor: auth.glass,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    paddingHorizontal: 20,
    marginHorizontal: space[4],
    marginTop: space[3],
  },
  pressed: { opacity: 0.8 },
  locationText: { flex: 1, gap: 1 },
  locationTitle: {
    fontFamily: font.poppinsMedium,
    fontSize: 13,
    lineHeight: 18,
    color: auth.text,
  },
  locationCaption: {
    fontFamily: font.poppins,
    fontSize: 11,
    lineHeight: 16,
    color: auth.textSoft,
  },
  list: { paddingTop: space[4], paddingBottom: space[4] },
  sectionHeader: {
    fontFamily: font.poppinsSemi,
    fontSize: 12,
    lineHeight: 18,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: auth.textSoft,
    paddingVertical: space[2],
    paddingHorizontal: space[5],
  },
  row: {
    height: 52,
    borderRadius: 999,
    backgroundColor: auth.glass,
    paddingHorizontal: 20,
    marginHorizontal: space[4],
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[3],
  },
  rowSelected: { backgroundColor: auth.btnBg },
  rowUnserved: { opacity: 0.55 },
  rowText: {
    flex: 1,
    fontFamily: font.poppins,
    fontSize: 14,
    lineHeight: 20,
    color: auth.text,
  },
  rowTextSelected: { fontFamily: font.poppinsSemi, color: auth.btnText },
  soonPill: {
    height: 24,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: auth.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soonText: {
    fontFamily: font.poppinsSemi,
    fontSize: 10,
    lineHeight: 14,
    color: auth.onAccentText,
  },
  empty: { padding: space[6], gap: space[2], alignItems: 'center' },
  emptyTitle: {
    fontFamily: font.poppinsSemi,
    fontSize: 14,
    lineHeight: 20,
    color: auth.text,
    textAlign: 'center',
  },
  emptyBody: {
    fontFamily: font.poppins,
    fontSize: 12,
    lineHeight: 18,
    color: auth.textSoft,
    textAlign: 'center',
  },
  footer: { paddingHorizontal: space[4], paddingTop: space[3] },
});
