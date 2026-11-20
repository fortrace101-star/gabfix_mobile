import { router } from 'expo-router';
import { Building2, ChevronRight, Search, Sparkles, Truck } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useServices } from '@/hooks/use-services';
import { useStatusBarStyle } from '@/hooks/use-status-bar-style';
import { fromHourly, serviceCategories, type Service, type ServiceCategoryId } from '@/config/services';
import { useOnboardingArea } from '@/store/onboarding';
import { colors, font, radius, shadow, space, text } from '@/theme';
import { ugx } from '@/utils/format';

type CategoryFilter = 'all' | ServiceCategoryId;

const filters: readonly { value: CategoryFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  ...serviceCategories.map((category) => ({ value: category.id, label: category.label })),
];

const icons = [Sparkles, Sparkles, Building2, Truck] as const;

function ServiceRow({ service, index }: { service: Service; index: number }) {
  const Icon = icons[index % icons.length];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${service.name}. From ${ugx(fromHourly)} per hour`}
      onPress={() =>
        router.push({
          pathname: '/service/[slug]',
          params: { slug: service.slug },
        })
      }
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <View style={styles.iconTile}>
        <Icon size={26} color={colors.green500} strokeWidth={2} />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.name} maxFontSizeMultiplier={1.3}>
          {service.name}
        </Text>
        <Text style={styles.tagline} maxFontSizeMultiplier={1.3} numberOfLines={2}>
          {service.tagline}
        </Text>
        <Text style={styles.price} maxFontSizeMultiplier={1.3}>
          From {ugx(fromHourly)}/hr
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
  const area = useOnboardingArea();
  const { services, error, refresh } = useServices(area?.id);
  const [category, setCategory] = useState<CategoryFilter>('all');
  useStatusBarStyle('dark');

  const visible = services.filter(
    (service) => category === 'all' || service.category === category,
  );
  const groups = serviceCategories
    .map((group) => {
      const groupValue = category === 'all' || category === group.id;
      return {
        ...group,
        services: groupValue
          ? services.filter((service) => service.category === group.id)
          : [],
      };
    })
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
          {filters.map((filter) => {
            const active = filter.value === category;
            return (
              <Pressable
                key={filter.value}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${filter.label} services`}
                onPress={() => setCategory(filter.value)}
                style={[styles.chip, active && styles.chipActive]}>
                <Text
                  style={[styles.chipText, active && styles.chipTextActive]}
                  maxFontSizeMultiplier={1.3}>
                  {filter.label}
                </Text>
              </Pressable>
            );
          })}
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
                {group.label}
              </Text>
              <Text style={styles.sectionCaption} maxFontSizeMultiplier={1.2}>
                {group.caption}
              </Text>
            </View>
            <View style={styles.list}>
              {group.services.map((service) => (
                <ServiceRow
                  key={service.slug}
                  index={services.findIndex((item) => item.slug === service.slug)}
                  service={service}
                />
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
  chipScroll: { marginHorizontal: -space[4], marginTop: -space[2] },
  chipRow: { paddingHorizontal: space[4], gap: space[2] },
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
  chipActive: { backgroundColor: colors.green500, borderColor: colors.green500 },
  chipText: { ...text.bodyM, fontSize: 13, color: colors.green700, fontFamily: font.bodySemi },
  chipTextActive: { color: colors.surface },
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
