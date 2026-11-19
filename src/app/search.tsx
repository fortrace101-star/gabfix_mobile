import { router } from 'expo-router';
import { ArrowLeft, Clock3, Search, Sparkles, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { fromHourly } from '@/config/services';
import { useServiceSearch } from '@/hooks/use-service-search';
import {
  addRecentSearch,
  clearRecentSearches,
  loadRecentSearches,
} from '@/lib/recent-searches';
import { useOnboardingArea } from '@/store/onboarding';
import { colors, font, radius, shadow, size, space, text } from '@/theme';
import { ugx } from '@/utils/format';

const popular = ['Home cleaning', 'Deep cleaning', 'Office', 'Move-out'];

function Highlight({
  value,
  term,
  style,
}: {
  value: string;
  term: string;
  style: StyleProp<TextStyle>;
}) {
  const index = term ? value.toLowerCase().indexOf(term.toLowerCase()) : -1;
  if (index < 0) {
    return (
      <Text style={style} maxFontSizeMultiplier={1.3} numberOfLines={1}>
        {value}
      </Text>
    );
  }

  return (
    <Text style={style} maxFontSizeMultiplier={1.3} numberOfLines={1}>
      {value.slice(0, index)}
      <Text style={styles.match}>{value.slice(index, index + term.length)}</Text>
      {value.slice(index + term.length)}
    </Text>
  );
}

/** P5 Search. Recent and popular terms before typing, catalogue results after. */
export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const area = useOnboardingArea();
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState<string[]>([]);
  const { services, loading, error } = useServiceSearch(query, area?.id);
  const term = query.trim();

  useEffect(() => {
    let active = true;
    loadRecentSearches()
      .then((items) => {
        if (active) setRecent(items);
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  const remember = (value: string) => {
    addRecentSearch(value)
      .then(setRecent)
      .catch(() => undefined);
  };

  const openService = (slug: string) => {
    remember(term);
    router.push({ pathname: '/service/[slug]', params: { slug } });
  };

  const onClear = () => {
    clearRecentSearches()
      .then(() => setRecent([]))
      .catch(() => setRecent([]));
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + space[2] }]}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace('/home');
          }}
          style={styles.back}>
          <ArrowLeft size={size.icon} color={colors.text} strokeWidth={2} />
        </Pressable>

        <View style={styles.field}>
          <Search size={20} color={colors.textMuted} strokeWidth={2} />
          <TextInput
            accessibilityLabel="Search services"
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setQuery}
            placeholder="What needs cleaning?"
            placeholderTextColor={colors.placeholder}
            returnKeyType="search"
            style={styles.input}
            value={query}
          />
          {query ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              hitSlop={8}
              onPress={() => setQuery('')}>
              <X size={18} color={colors.textMuted} strokeWidth={2} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        {!term ? (
          <>
            {recent.length > 0 ? (
              <View style={styles.group}>
                <View style={styles.groupHeader}>
                  <Text style={styles.groupTitle} maxFontSizeMultiplier={1.3}>
                    Recent searches
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Clear recent searches"
                    hitSlop={8}
                    onPress={onClear}>
                    <Text style={styles.clear} maxFontSizeMultiplier={1.3}>
                      Clear
                    </Text>
                  </Pressable>
                </View>
                {recent.map((item) => (
                  <Pressable
                    key={item}
                    accessibilityRole="button"
                    accessibilityLabel={`Search again for ${item}`}
                    onPress={() => setQuery(item)}
                    style={({ pressed }) => [styles.recentRow, pressed && styles.rowPressed]}>
                    <Clock3 size={18} color={colors.textMuted} strokeWidth={2} />
                    <Text style={styles.recentText} maxFontSizeMultiplier={1.3} numberOfLines={1}>
                      {item}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            <View style={styles.group}>
              <Text style={styles.groupTitle} maxFontSizeMultiplier={1.3}>
                Popular
              </Text>
              <View style={styles.chips}>
                {popular.map((item) => (
                  <Pressable
                    key={item}
                    accessibilityRole="button"
                    accessibilityLabel={`Search for ${item}`}
                    onPress={() => setQuery(item)}
                    style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}>
                    <Text style={styles.chipText} maxFontSizeMultiplier={1.3}>
                      {item}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </>
        ) : (
          <View style={styles.results}>
            {error ? (
              <View style={styles.error}>
                <Text style={styles.errorText} maxFontSizeMultiplier={1.3}>
                  {error}
                </Text>
              </View>
            ) : null}

            {loading ? (
              <View style={styles.skeletons}>
                {Array.from({ length: 3 }, (_, index) => (
                  <Skeleton key={index} style={styles.skeletonRow} />
                ))}
              </View>
            ) : services.length === 0 ? (
              <View style={styles.emptyCard}>
                <EmptyState
                  icon={Search}
                  title="We couldn't find that"
                  body="Try a different word, or tell us what you need and we'll quote it."
                  actionLabel="Request a custom service"
                  onAction={() =>
                    router.push({
                      pathname: '/quote/[slug]',
                      params: {
                        slug: 'custom',
                        details: term ? `I'm looking for ${term}` : '',
                      },
                    } as never)
                  }
                />
              </View>
            ) : (
              <>
                <Text style={styles.count} maxFontSizeMultiplier={1.3}>
                  {services.length} result{services.length === 1 ? '' : 's'} for “{term}”
                </Text>
                <View style={styles.list}>
                  {services.map((service) => (
                    <Pressable
                      key={service.slug}
                      accessibilityRole="button"
                      accessibilityLabel={`${service.name}. From ${ugx(fromHourly)} per hour`}
                      onPress={() => openService(service.slug)}
                      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
                      <View style={styles.iconTile}>
                        <Sparkles size={24} color={colors.green500} strokeWidth={2} />
                      </View>
                      <View style={styles.rowBody}>
                        <Highlight value={service.name} term={term} style={styles.name} />
                        <Text
                          style={styles.tagline}
                          maxFontSizeMultiplier={1.3}
                          numberOfLines={1}>
                          {service.tagline}
                        </Text>
                        <Text style={styles.price} maxFontSizeMultiplier={1.3}>
                          From {ugx(fromHourly)}/hr
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    paddingHorizontal: space[3],
    paddingBottom: space[3],
  },
  back: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  field: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    paddingHorizontal: space[4],
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    fontFamily: font.body,
    fontSize: 15,
    color: colors.text,
    padding: 0,
  },
  content: { padding: space[4], paddingBottom: space[10], gap: space[6] },
  group: { gap: space[3] },
  groupHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  groupTitle: { ...text.h3 },
  clear: { ...text.caption, fontFamily: font.bodySemi, color: colors.green700 },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    minHeight: 44,
  },
  recentText: { ...text.body, flex: 1 },
  rowPressed: { backgroundColor: colors.green50 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  chip: {
    height: 36,
    paddingHorizontal: space[3],
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipPressed: { backgroundColor: colors.green50, borderColor: colors.green100 },
  chipText: { ...text.bodyM, fontSize: 13, color: colors.green700 },
  results: { gap: space[3] },
  count: { ...text.caption },
  list: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    overflow: 'hidden',
    ...shadow.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    padding: space[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  iconTile: {
    width: 52,
    height: 52,
    borderRadius: radius.tile,
    backgroundColor: colors.green50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1, gap: 2 },
  name: { ...text.bodyM, fontFamily: font.bodySemi, fontSize: 15 },
  match: { color: colors.green700 },
  tagline: { ...text.caption },
  price: { ...text.caption, color: colors.green700, fontFamily: font.bodySemi },
  skeletons: { gap: space[2] },
  skeletonRow: { height: 84, borderRadius: radius.card, backgroundColor: colors.disabledBg },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  error: {
    backgroundColor: colors.errorBg,
    borderRadius: radius.input,
    padding: space[3],
  },
  errorText: { ...text.caption, color: colors.error },
});
