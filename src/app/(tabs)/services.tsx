import { router } from 'expo-router';
import { Building2, ChevronRight, Sparkles, Truck } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStatusBarStyle } from '@/hooks/use-status-bar-style';
import { fromHourly, services } from '@/config/services';
import { base, colors, font, radius, shadow, space, text } from '@/theme';
import { ugx } from '@/utils/format';

const icons = [Sparkles, Sparkles, Building2, Truck] as const;

/** P6 shell. The category chip bar and grid land with the catalogue API. */
export default function ServicesTab() {
  const insets = useSafeAreaInsets();
  useStatusBarStyle('dark');

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + space[4] }]}>
        <View style={styles.header}>
          <Text style={styles.title} maxFontSizeMultiplier={1.3}>
            Services
          </Text>
          <Text style={styles.subtitle} maxFontSizeMultiplier={1.3}>
            Pick a service to see the price before you book.
          </Text>
        </View>

        <View style={styles.list}>
          {services.map((service, index) => {
            const Icon = icons[index % icons.length];
            return (
              <Pressable
                key={service.slug}
                accessibilityRole="button"
                accessibilityLabel={`${service.name}. From ${ugx(fromHourly)} per hour`}
                onPress={() =>
                  router.push({
                    pathname: '/book/[slug]/details',
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
          })}
        </View>

        <View style={base.card}>
          <Text style={styles.noteTitle} maxFontSizeMultiplier={1.3}>
            Search and categories are next
          </Text>
          <Text style={styles.noteCopy} maxFontSizeMultiplier={1.3}>
            The full P5 search and P6 category grid are tracked in Gabfix_UI_Progress.md. This shell
            already links every service to the booking flow.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: space[4], paddingBottom: space[6], gap: space[5] },
  header: { gap: space[1] },
  title: { ...text.h1 },
  subtitle: { ...text.body, color: colors.textMuted },
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
  noteTitle: { ...text.h3, fontSize: 15 },
  noteCopy: { ...text.caption, marginTop: space[1] },
});
