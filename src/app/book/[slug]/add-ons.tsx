import { router, useLocalSearchParams } from 'expo-router';
import { Info, TriangleAlert, X } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AddOnCard } from '@/components/booking/add-on-card';
import { AddOnSheet } from '@/components/booking/add-on-sheet';
import { StepperHeader } from '@/components/booking/stepper-header';
import { SummaryBar } from '@/components/booking/summary-bar';
import { TopBar } from '@/components/ui/top-bar';
import { addOns, type AddOnId } from '@/config/add-ons';
import { pricing } from '@/config/pricing';
import { serviceBySlug } from '@/config/services';
import { addOnPrice, price } from '@/lib/pricing';
import {
  getBookingDraft,
  patchDetails,
  resetDraft,
  startDraft,
  toggleAddOn,
  useBookingDraft,
} from '@/store/booking';
import { colors, font, radius, space, text } from '@/theme';
import { ugx } from '@/utils/format';

const maximumCleaners = 4;

const durationLabel = (minutes: number) => {
  const hours = minutes / 60;
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} h`;
};

/**
 * P9 Add-ons. Optional extras that add 30 minutes each to the booking; the draft and the
 * live price come from the same store and pricing function as P8.
 */
export default function AddOnsScreen() {
  const params = useLocalSearchParams<{ slug?: string }>();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const draft = useBookingDraft();
  const service = serviceBySlug(slug);
  const active = draft && draft.serviceSlug === slug ? draft : null;
  const [openId, setOpenId] = useState<AddOnId | null>(null);

  useEffect(() => {
    if (!slug) return;
    const current = getBookingDraft();
    if (!current || current.serviceSlug !== slug) startDraft(slug);
  }, [slug]);

  const leave = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  }, []);

  const confirmClose = useCallback(() => {
    Alert.alert('Save as draft?', 'Your choices are kept so you can finish booking later.', [
      { text: 'Keep editing', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          resetDraft();
          if (router.canGoBack()) router.back();
          else router.replace('/home');
        },
      },
      { text: 'Save draft', onPress: leave },
    ]);
  }, [leave]);

  if (!active) return <View style={styles.screen} />;

  const { details } = active;
  const quote = price(active);
  const selectedCount = active.addOns.length;
  const sheetDefinition = addOns.find((item) => item.id === openId) ?? null;
  const longBooking = quote.minutes > pricing.maximumHours * 60;
  const canAddCleaner = details.cleaners < maximumCleaners;

  const onNext = () => {
    router.push({ pathname: '/book/[slug]/schedule', params: { slug } });
  };

  return (
    <View style={styles.screen}>
      <TopBar
        title={service?.name ?? 'Extras'}
        onBack={leave}
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close and save options"
            hitSlop={8}
            onPress={confirmClose}
            style={styles.close}>
            <X size={22} color={colors.text} strokeWidth={2} />
          </Pressable>
        }
      />
      <StepperHeader current={0} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <View style={styles.intro}>
          <Text style={styles.title} maxFontSizeMultiplier={1.3}>
            Add extras
          </Text>
          <Text style={styles.caption} maxFontSizeMultiplier={1.3}>
            Each extra adds {pricing.addOnMinutes} minutes and is optional.
          </Text>
        </View>

        {addOns.map((addOn) => (
          <AddOnCard
            key={addOn.id}
            title={addOn.name}
            description={addOn.description}
            icon={addOn.icon}
            meta={`+${pricing.addOnMinutes} min · +${ugx(addOnPrice(addOn.id))}`}
            selected={active.addOns.includes(addOn.id)}
            onToggle={() => toggleAddOn(addOn.id)}
            onOpenIncluded={() => setOpenId(addOn.id)}
          />
        ))}

        {longBooking ? (
          <View style={styles.warning}>
            <TriangleAlert size={18} color={colors.warning} strokeWidth={2} />
            <View style={styles.warningBody}>
              <Text style={styles.warningText} maxFontSizeMultiplier={1.3}>
                This booking is {durationLabel(quote.minutes)} long. Long bookings may need two
                cleaners.
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add a cleaner"
                accessibilityState={{ disabled: !canAddCleaner }}
                disabled={!canAddCleaner}
                hitSlop={8}
                onPress={() => patchDetails({ cleaners: details.cleaners + 1 })}>
                <Text
                  style={[styles.warningLink, !canAddCleaner && styles.warningLinkOff]}
                  maxFontSizeMultiplier={1.3}>
                  {canAddCleaner ? 'Add a cleaner' : 'Maximum cleaners added'}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <View style={styles.hint}>
          <Info size={16} color={colors.textMuted} strokeWidth={2} />
          <Text style={styles.hintText} maxFontSizeMultiplier={1.3}>
            You can add or remove extras later from booking details, up to 24 hours before.
          </Text>
        </View>
      </ScrollView>

      <SummaryBar
        caption={`${durationLabel(quote.minutes)} · ${selectedCount} extra${selectedCount === 1 ? '' : 's'}`}
        total={quote.total}
        actionLabel="Next"
        onPress={onNext}
      />

      <AddOnSheet definition={sheetDefinition} onClose={() => setOpenId(null)} />
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
  content: { padding: space[4], paddingBottom: space[16], gap: space[3] },
  intro: { gap: space[1], marginBottom: space[1] },
  title: { ...text.h2 },
  caption: { ...text.caption },
  warning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[2],
    backgroundColor: colors.warningBg,
    borderRadius: radius.input,
    padding: space[3],
    marginTop: space[1],
  },
  warningBody: { flex: 1, gap: space[1] },
  warningText: { ...text.caption, color: colors.text },
  warningLink: { ...text.bodyM, fontFamily: font.bodySemi, color: colors.green700, fontSize: 13 },
  warningLinkOff: { color: colors.textMuted },
  hint: { flexDirection: 'row', alignItems: 'flex-start', gap: space[2], paddingTop: space[2] },
  hintText: { ...text.caption, flex: 1 },
});
