import { router, useLocalSearchParams } from 'expo-router';
import { Info, Repeat, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ChipSelector } from '@/components/booking/chip-selector';
import { SegmentedControl } from '@/components/booking/segmented-control';
import { SelectableCard } from '@/components/booking/selectable-card';
import { StepperHeader } from '@/components/booking/stepper-header';
import { SummaryBar } from '@/components/booking/summary-bar';
import { SummarySheet } from '@/components/booking/summary-sheet';
import { TopBar } from '@/components/ui/top-bar';
import { pricing } from '@/config/pricing';
import { serviceBySlug } from '@/config/services';
import { price, type BookingFrequency } from '@/lib/pricing';
import { useDraftExit } from '@/lib/use-draft-exit';
import { getBookingDraft, patchDetails, startDraft, useBookingDraft } from '@/store/booking';
import { colors, font, radius, space, text } from '@/theme';
import { ugx } from '@/utils/format';

const cleanerOptions = [1, 2, 3, 4].map((value) => ({
  value,
  label: String(value),
}));

const hoursOptions = Array.from(
  { length: pricing.maximumHours - pricing.minimumHours + 1 },
  (_, index) => {
    const value = pricing.minimumHours + index;
    return {
      value,
      label: String(value),
      tag: value === pricing.popularHours ? 'Popular' : undefined,
    };
  },
);

const frequencyOptions: {
  value: BookingFrequency;
  title: string;
  subtitle: string;
  benefit: string;
  discount?: string;
}[] = [
  {
    value: 'once',
    title: 'One time',
    subtitle: 'A single visit, no commitment',
    benefit: 'Change or cancel up to 24 hours before',
  },
  {
    value: 'weekly',
    title: 'Weekly',
    subtitle: 'The same day every week',
    benefit: 'Same cleaner each visit',
    discount: '10% off',
  },
  {
    value: 'severalPerWeek',
    title: 'Several times a week',
    subtitle: 'Two or three visits a week',
    benefit: 'Same cleaner each visit',
    discount: '15% off',
  },
];

const materialsOptions = [
  { value: 'no', label: 'No' },
  { value: 'yes', label: `Yes, +${ugx(pricing.materialsPerHour)}/hr` },
] as const;

/**
 * P8 Job details. Reads and writes the persisted booking draft only, and previews the
 * server-independent price from `src/lib/pricing.ts`.
 */
export default function JobDetailsScreen() {
  const params = useLocalSearchParams<{ slug?: string }>();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const draft = useBookingDraft();
  const service = serviceBySlug(slug);
  const active = draft && draft.serviceSlug === slug ? draft : null;
  const [summaryOpen, setSummaryOpen] = useState(false);

  // A new service starts a fresh draft; returning to the same service keeps the edits.
  useEffect(() => {
    if (!slug) return;
    const current = getBookingDraft();
    if (!current || current.serviceSlug !== slug) startDraft(slug);
  }, [slug]);

  const { requestExit, sheet } = useDraftExit({ step: 'details' });

  if (!active) return <View style={styles.screen} />;

  const { details } = active;
  const quote = price(active);
  const instructions = details.instructions ?? '';
  const recurring = details.frequency !== 'once';

  const onNext = () => {
    // Quote services are priced from the job details, so the extras step is skipped (H10).
    if (service?.pricingMode === 'quote') {
      router.push({ pathname: '/book/[slug]/scope', params: { slug } });
      return;
    }
    router.push({ pathname: '/book/[slug]/add-ons', params: { slug } });
  };

  return (
    <View style={styles.screen}>
      <TopBar
        title={service?.name ?? 'Job details'}
        onBack={requestExit}
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close and save options"
            hitSlop={8}
            onPress={requestExit}
            style={styles.close}>
            <X size={22} color={colors.text} strokeWidth={2} />
          </Pressable>
        }
      />
      <StepperHeader current={0} />
      {sheet}

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <View style={styles.group}>
          <Text style={styles.label} maxFontSizeMultiplier={1.3}>
            How many cleaners?
          </Text>
          <ChipSelector
            options={cleanerOptions}
            value={details.cleaners}
            onChange={(cleaners) => patchDetails({ cleaners })}
            itemStyle={styles.flexItem}
          />
        </View>

        <View style={styles.group}>
          <Text style={styles.label} maxFontSizeMultiplier={1.3}>
            How many hours?
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hoursRow}>
            <ChipSelector
              options={hoursOptions}
              value={details.hours}
              onChange={(hours) => patchDetails({ hours })}
            />
          </ScrollView>
          <View style={styles.hint}>
            <Info size={16} color={colors.textMuted} strokeWidth={2} />
            <Text style={styles.hintText} maxFontSizeMultiplier={1.3}>
              Longer bookings cost less per hour
            </Text>
          </View>
        </View>

        <View style={styles.group}>
          <Text style={styles.label} maxFontSizeMultiplier={1.3}>
            How often?
          </Text>
          <View style={styles.cards}>
            {frequencyOptions.map((option) => (
              <SelectableCard
                key={option.value}
                title={option.title}
                subtitle={option.subtitle}
                benefit={option.benefit}
                discount={option.discount}
                selected={details.frequency === option.value}
                onPress={() => patchDetails({ frequency: option.value })}
              />
            ))}
          </View>
          {recurring ? (
            <View style={styles.banner}>
              <Repeat size={18} color={colors.green700} strokeWidth={2} />
              <Text style={styles.bannerText} maxFontSizeMultiplier={1.3}>
                You&apos;ll get the same cleaner each time.
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.group}>
          <Text style={styles.label} maxFontSizeMultiplier={1.3}>
            Cleaning materials?
          </Text>
          <SegmentedControl
            options={materialsOptions}
            value={details.materials ? 'yes' : 'no'}
            onChange={(materials) => patchDetails({ materials: materials === 'yes' })}
          />
          <Text style={styles.hintText} maxFontSizeMultiplier={1.3}>
            Brings mops, cloths and cleaning products for every cleaner, every hour.
          </Text>
        </View>

        <View style={styles.group}>
          <Text style={styles.label} maxFontSizeMultiplier={1.3}>
            Anything the cleaner should know?
          </Text>
          <TextInput
            accessibilityLabel="Instructions for your cleaner"
            maxLength={300}
            multiline
            onChangeText={(value) => patchDetails({ instructions: value })}
            placeholder="e.g. The gate code is 2468, please start with the kitchen."
            placeholderTextColor={colors.placeholder}
            style={styles.textArea}
            textAlignVertical="top"
            value={instructions}
          />
          <Text style={styles.counter} maxFontSizeMultiplier={1.3}>
            {instructions.length}/300
          </Text>
        </View>
      </ScrollView>

      <SummaryBar
        caption={`${details.hours} h · ${details.cleaners} cleaner${details.cleaners === 1 ? '' : 's'}`}
        total={quote.total}
        actionLabel="Next"
        onPress={onNext}
        onDetailsPress={() => setSummaryOpen(true)}
      />

      <SummarySheet
        draft={active}
        onClose={() => setSummaryOpen(false)}
        serviceName={service?.name}
        visible={summaryOpen}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  close: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  content: { padding: space[4], paddingBottom: space[8], gap: space[6] },
  group: { gap: space[3] },
  label: { ...text.h3 },
  flexItem: { flex: 1 },
  hoursRow: { paddingRight: space[4] },
  hint: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  hintText: { ...text.caption, flexShrink: 1 },
  cards: { gap: space[3] },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    backgroundColor: colors.successBg,
    borderRadius: radius.input,
    padding: space[3],
  },
  bannerText: { ...text.caption, color: colors.green700, flex: 1 },
  textArea: {
    minHeight: 120,
    borderRadius: radius.input,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: space[3],
    fontFamily: font.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
  },
  counter: { ...text.caption, textAlign: 'right', marginTop: -space[2] },
});
