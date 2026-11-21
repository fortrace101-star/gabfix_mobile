import { router } from 'expo-router';
import { ChevronRight, Search } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ServicePhoto } from '@/components/service/service-photo';
import { FilterChip } from '@/components/ui/filter-chip';
import { useServices } from '@/hooks/use-services';
import { useStatusBarStyle } from '@/hooks/use-status-bar-style';
import { fromHourly, serviceCategories, type Service } from '@/config/services';
import { colors, font, radius, shadow, space, text } from '@/theme';
import { ugx } from '@/utils/format';

type CategoryFilter = 'all' | string;

const filters: readonly { value: CategoryFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  ...serviceCategories.map((category) => ({ value: category.id, label: category.name })),
];

const priceLabel = (service: Service) =>
  service.pricingMode === 'quote' ? 'Get a quote' : `From ${ugx(fromHourly)}/hr`;

function ServiceRow({ service }: { service: Service }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${service.name}. ${priceLabel(service)}`}
      onPress={() =>
        router.push({
          pathname: '/service/[slug]',
          params: { slug: service.slug },
        })
      }
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <ServicePhoto
        slug={service.slug}
        cardUri={service.cardImage}
        
        style={styles.thumb}
      />
      <View style={styles.rowBody}>
        <Text style={styles.name} maxFontSizeMultiplier={1.3}>
          {service.name}
        </Text>
        <Text style={styles.tagline} maxFontSizeMultiplier={1.3} numberOfLines={2}>
          {service.tagline}
        </Text>
        <Text style={styles.price} maxFontSizeMultiplier={1.3}>
          {priceLabel(service)}
        </Text>
      </View>
      {service.tag ? (
        <View style={styles.tag}>
          <Text style={styles.tagText}>{service.tag}</Text>
        </View>
      ) : null}
      <ChevronRight size={20} color={colors.disabledText} strokeWidth={2} />
    </Pressable>
  );
}

/** P6 Services: category chips and grouped sections over `GET /services`. */
export default function ServicesTab() {
  const insets = useSafeAreaInsets();
  const { services, error, refresh } = useServices();
  const [category, setCategory] = useState<CategoryFilter>('all');
  useStatusBarStyle('dark');

  const visible = services.filter(
    (service) => service.active !== false && (category === 'all' || service.categoryId === category),
  );
  const groups = serviceCategories
    .map((group) => ({
      ...group,
      services: visible.filter((service) => service.categoryId === group.id),
    }))
    .filter((group) => group.services.length > 0);

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + space[4] }]}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.title} maxFontSizeMultiplier={1.3}>
              Services
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Search services"
              hitSlop={8}
              onPress={() => router.push('/search')}
              style={styles.searchButton}>
              <Search size={20} color={colors.green700} strokeWidth={2} />
            </Pressable>
          </View>
          <Text style={styles.subtitle} maxFontSizeMultiplier={1.3}>
            Pick a service to see the price before you book.
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipScroll}
          contentContainerStyle={styles.chipRow}>
          {filters.map((filter) => (
            <FilterChip
              key={filter.value}
              label={filter.label}
              selected={filter.value === category}
              onPress={() => setCategory(filter.value)}
            />
          ))}
        </ScrollView>

        {error ? (
          <View style={styles.error}>
            <Text style={styles.errorText} maxFontSizeMultiplier={1.3}>
              {error}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Retry loading services"
              hitSlop={8}
              onPress={refresh}>
              <Text style={styles.errorLink} maxFontSizeMultiplier={1.3}>
                Retry
              </Text>
            </Pressable>
          </View>
        ) : null}

        {groups.map((group) => (
          <View key={group.id} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.3}>
                {group.name}
              </Text>
              <Text style={styles.sectionCaption} maxFontSizeMultiplier={1.2}>
                {group.caption}
              </Text>
            </View>
            <View style={styles.list}>
              {group.services.map((service) => (
                <ServiceRow key={service.slug} service={service} />
              ))}
            </View>
          </View>
        ))}

        {visible.length === 0 && !error ? (
          <Text style={styles.emptyText} maxFontSizeMultiplier={1.3}>
            No services in this category yet.
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: space[4], paddingBottom: space[6], gap: space[5] },
  header: { gap: space[1] },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...text.h1 },
  subtitle: { ...text.body, color: colors.textMuted },
  chipScroll: { flexGrow: 0, marginHorizontal: -space[4], marginTop: -space[2] },
  chipRow: { paddingHorizontal: space[4], alignItems: 'center', gap: space[2] },
  section: { gap: space[3] },
  sectionHeader: { gap: 2 },
  sectionTitle: { ...text.h3 },
  sectionCaption: { ...text.caption },
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
  rowPressed: { backgroundColor: colors.green50 },
  error: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[3],
    backgroundColor: colors.warningBg,
    borderRadius: radius.input,
    padding: space[3],
  },
  errorText: { ...text.caption, color: colors.text, flex: 1 },
  errorLink: { ...text.bodyM, fontFamily: font.bodySemi, color: colors.green700, fontSize: 13 },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: radius.tile,
    backgroundColor: colors.green50,
  },
  rowBody: { flex: 1, gap: 2 },
  name: { ...text.bodyM, fontFamily: font.bodySemi, fontSize: 15 },
  tagline: { ...text.caption },
  price: { ...text.caption, color: colors.green700, fontFamily: font.bodySemi },
  tag: {
    height: 22,
    paddingHorizontal: space[2],
    borderRadius: 11,
    backgroundColor: colors.yellow500,
    justifyContent: 'center',
  },
  tagText: { fontFamily: font.bodySemi, fontSize: 11, lineHeight: 14, color: colors.green900 },
  emptyText: { ...text.body, color: colors.textMuted, textAlign: 'center' },
});
