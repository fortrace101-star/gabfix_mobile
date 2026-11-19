import { router, useLocalSearchParams } from 'expo-router';
import { Star } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ReviewCard } from '@/components/reviews/review-card';
import { Stars } from '@/components/reviews/stars';
import { TopBar } from '@/components/ui/top-bar';
import { breakdownForService, reviewsForService } from '@/config/reviews';
import { serviceBySlug } from '@/config/services';
import { useServiceContent } from '@/hooks/use-service-content';
import { useOnboardingArea } from '@/store/onboarding';
import { base, chip, colors, font, radius, space, text } from '@/theme';
import type { Href } from 'expo-router';

type Filter = 'all' | 'five' | 'comments' | 'recent';

const filters: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'five', label: '5 stars' },
  { key: 'comments', label: 'With comments' },
  { key: 'recent', label: 'Most recent' },
];

/** P21 Reviews list. Local feed and distribution until `GET /reviews` exists. */
export default function ServiceReviewsScreen() {
  const params = useLocalSearchParams<{ slug?: string }>();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const insets = useSafeAreaInsets();
  const area = useOnboardingArea();
  const service = serviceBySlug(slug);
  const { content } = useServiceContent(slug, area?.id);
  const [filter, setFilter] = useState<Filter>('all');

  const source = useMemo(() => reviewsForService(slug), [slug]);
  const filtered = useMemo(() => {
    if (filter === 'five') return source.filter((review) => review.stars === 5);
    if (filter === 'comments') return source.filter((review) => review.comment.trim().length > 0);
    if (filter === 'recent') {
      return [...source].sort((a, b) => b.dateISO.localeCompare(a.dateISO));
    }
    return source;
  }, [filter, source]);

  if (!service || !content) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <TopBar title="Reviews" />
        <View style={styles.empty}>
          <Text style={styles.emptyTitle} maxFontSizeMultiplier={1.3}>
            We couldn&apos;t load these reviews
          </Text>
          <Text style={styles.emptyCaption} maxFontSizeMultiplier={1.3}>
            The service may have moved. Go back and choose another service.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Browse services"
            onPress={() => router.replace('/services' as Href)}
            style={styles.emptyButton}>
            <Text style={styles.emptyButtonText} maxFontSizeMultiplier={1.2}>
              Browse services
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const breakdown = breakdownForService(slug);
  const reviewCount = content.reviewCount;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <TopBar title="Reviews" />
      <FlatList
        data={filtered}
        keyExtractor={(review) => review.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + space[8] },
        ]}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={[base.card, styles.summary]}>
              <View style={styles.summaryTop}>
                <View style={styles.averageBlock}>
                  <Text style={styles.average} maxFontSizeMultiplier={1.2}>
                    {content.rating.toFixed(1)}
                  </Text>
                  <Stars value={content.rating} size={20} />
                  <Text style={styles.reviewCount} maxFontSizeMultiplier={1.3}>
                    {reviewCount} verified reviews
                  </Text>
                </View>

                <View style={styles.breakdown}>
                  {breakdown.map((row) => {
                    const percent = reviewCount
                      ? Math.max(0, Math.min(100, Math.round((row.count / reviewCount) * 100)))
                      : 0;
                    return (
                      <View
                        key={row.stars}
                        style={styles.breakdownRow}
                        accessibilityLabel={`${row.stars} stars: ${row.count} reviews`}>
                        <Text style={styles.breakdownLabel} maxFontSizeMultiplier={1.2}>
                          {row.stars}
                        </Text>
                        <Star
                          size={10}
                          color={colors.yellow600}
                          fill={colors.yellow500}
                          strokeWidth={1}
                        />
                        <View style={styles.bar}>
                          <View
                            style={[
                              styles.barFill,
                              { width: `${percent}%` as `${number}%` },
                            ]}
                          />
                        </View>
                        <Text style={styles.breakdownCount} maxFontSizeMultiplier={1.2}>
                          {row.count}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
              <Text style={styles.serviceName} maxFontSizeMultiplier={1.3}>
                {service.name}
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filters}>
              {filters.map((item) => {
                const selected = filter === item.key;
                return (
                  <Pressable
                    key={item.key}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    aria-checked={selected}
                    accessibilityLabel={`Filter reviews: ${item.label}`}
                    onPress={() => setFilter(item.key)}
                    style={[chip.pill, styles.filter, selected && styles.filterSelected]}>
                    <Text
                      style={[styles.filterText, selected && styles.filterTextSelected]}
                      maxFontSizeMultiplier={1.2}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={styles.showing} maxFontSizeMultiplier={1.3}>
              Showing {filtered.length} of {reviewCount} reviews
            </Text>
          </View>
        }
        renderItem={({ item }) => <ReviewCard review={item} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={[base.card, styles.noResults]}>
            <Text style={styles.noResultsTitle} maxFontSizeMultiplier={1.3}>
              No reviews match this filter
            </Text>
            <Text style={styles.noResultsCaption} maxFontSizeMultiplier={1.3}>
              Try another filter to see what customers say about this service.
            </Text>
          </View>
        }
        ListFooterComponent={
          filtered.length > 0 ? (
            <Text style={styles.footerNote} maxFontSizeMultiplier={1.3}>
              Showing a sample of {reviewCount} verified reviews. Newest first when you choose
              Most recent.
            </Text>
          ) : undefined
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  listContent: { paddingHorizontal: space[4], paddingTop: space[2] },
  header: { gap: space[4], paddingBottom: space[4] },
  summary: { gap: space[3] },
  summaryTop: { flexDirection: 'row', alignItems: 'center', gap: space[4] },
  averageBlock: { alignItems: 'flex-start', gap: 2 },
  average: {
    fontFamily: font.poppinsBold,
    fontSize: 44,
    lineHeight: 50,
    color: colors.text,
  },
  reviewCount: { ...text.caption },
  breakdown: { flex: 1, gap: 5 },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  breakdownLabel: {
    ...text.caption,
    width: 8,
    textAlign: 'right',
    fontFamily: font.bodySemi,
  },
  bar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.green100,
    overflow: 'hidden',
  },
  barFill: { height: 8, borderRadius: 4, backgroundColor: colors.green500 },
  breakdownCount: {
    ...text.caption,
    width: 30,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  serviceName: {
    ...text.caption,
    color: colors.green700,
    fontFamily: font.bodySemi,
  },
  filters: { gap: space[2] },
  filter: {
    height: 34,
    borderColor: colors.border,
    paddingHorizontal: space[3],
  },
  filterSelected: {
    backgroundColor: colors.green500,
    borderColor: colors.green500,
  },
  filterText: {
    ...text.caption,
    fontFamily: font.bodySemi,
    color: colors.textMuted,
  },
  filterTextSelected: { color: colors.surface },
  showing: { ...text.caption },
  separator: { height: space[3] },
  noResults: { alignItems: 'center', gap: space[1] },
  noResultsTitle: { ...text.h3, textAlign: 'center' },
  noResultsCaption: { ...text.caption, textAlign: 'center' },
  footerNote: { ...text.caption, textAlign: 'center', paddingTop: space[4] },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
    paddingHorizontal: space[8],
  },
  emptyTitle: { ...text.h2, textAlign: 'center' },
  emptyCaption: { ...text.body, color: colors.textMuted, textAlign: 'center' },
  emptyButton: {
    marginTop: space[3],
    minHeight: 44,
    borderRadius: radius.button,
    backgroundColor: colors.green500,
    paddingHorizontal: space[5],
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyButtonText: { ...text.button, color: colors.surface },
});
