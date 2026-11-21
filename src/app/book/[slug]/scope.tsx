import { router, useLocalSearchParams } from 'expo-router';
import { Check, Info, Plus, TriangleAlert, X } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { MediaPreview } from '@/components/booking/media-preview';
import { MediaSheet } from '@/components/booking/media-sheet';
import { MediaTile } from '@/components/booking/media-tile';
import { StepperHeader } from '@/components/booking/stepper-header';
import { CounterStepper } from '@/components/ui/counter-stepper';
import { SummaryBar } from '@/components/booking/summary-bar';
import { SummarySheet } from '@/components/booking/summary-sheet';
import { SelectableCard } from '@/components/booking/selectable-card';
import { TopBar } from '@/components/ui/top-bar';
import { jobMedia } from '@/config/media';
import { scopeFor } from '@/config/service-scope';
import { serviceBySlug } from '@/config/services';
import { sizeBandOptions, type PropertySizeBand } from '@/config/size-bands';
import {
  applyExactArea,
  conditionOptions,
  isScopeComplete,
  selectSizeBand,
  suggestionCopy,
  suggestJob,
  workstationOptions,
} from '@/lib/booking-scope';
import { deleteMediaFile } from '@/lib/media';
import { price, type BookingMediaItem, type BookingWorkstations } from '@/lib/pricing';
import {
  getBookingDraft,
  patchDetails,
  patchScope,
  removeMedia,
  resetDraft,
  setMedia,
  startDraft,
  useBookingDraft,
} from '@/store/booking';
import { chip, colors, font, radius, shadow, space, text } from '@/theme';
import { selectionHaptic } from '@/utils/haptics';
import { ugx } from '@/utils/format';

function StatusPill({ state }: { state: 'required' | 'done' | 'optional' }) {
  if (state === 'optional') {
    return <Text style={styles.optionalPill} maxFontSizeMultiplier={1.2}>Optional</Text>;
  }
  const done = state === 'done';
  return (
    <View style={[styles.pill, done ? styles.pillDone : styles.pillRequired]}>
      {done ? <Check size={12} color={colors.green700} strokeWidth={3} /> : null}
      <Text
        style={[styles.pillText, done ? styles.pillTextDone : styles.pillTextRequired]}
        maxFontSizeMultiplier={1.2}>
        {done ? 'Done' : 'Required'}
      </Text>
    </View>
  );
}

/** P8b Job scope. Writes the persisted draft; pricing is unaffected (D4). */
export default function JobScopeScreen() {
  const params = useLocalSearchParams<{ slug?: string }>();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const draft = useBookingDraft();
  const service = serviceBySlug(slug);
  const active = draft && draft.serviceSlug === slug ? draft : null;
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [showExactSize, setShowExactSize] = useState(false);
  // Local copy of the size field so a first digit ("5" of "50") is not rejected before it is valid.
  const [areaText, setAreaText] = useState('');
  const [suggestionDismissed, setSuggestionDismissed] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<BookingMediaItem | null>(null);

  const config = scopeFor(slug);

  useEffect(() => {
    if (!slug) return;
    const current = getBookingDraft();
    if (!current || current.serviceSlug !== slug) startDraft(slug);
  }, [slug]);

  const leave = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  }, []);

  const onDiscardDraft = useCallback(() => {
    (getBookingDraft()?.media?.items ?? []).forEach((item) => deleteMediaFile(item.uri));
    resetDraft();
    leave();
  }, [leave]);

  const confirmClose = useCallback(() => {
    Alert.alert('Save as draft?', 'Your choices are kept so you can finish booking later.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: onDiscardDraft },
      { text: 'Save draft', onPress: leave },
    ]);
  }, [leave, onDiscardDraft]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      confirmClose();
      return true;
    });
    return () => subscription.remove();
  }, [confirmClose]);

  if (!active || !active.scope) return <View style={styles.screen} />;

  const scope = active.scope;
  const { details } = active;
  const mediaItems = active.media?.items ?? [];
  const mediaLeft = Math.max(0, jobMedia.maxItems - mediaItems.length);
  const quote = price(active);
  const complete = isScopeComplete(slug, scope);
  const suggestion = suggestJob(slug, scope);
  const capacityMinutes = details.hours * details.cleaners * 60;
  const capacityRatio = suggestion.totalMinutes > 0 ? capacityMinutes / suggestion.totalMinutes : 1;
  const roomsDone = config.fields.every((field) => {
    if (!field.required) return true;
    if (field.type === 'condition') return scope.condition !== undefined;
    if (field.type === 'workstations') return scope.workstations !== undefined;
    return true;
  });

  const onNext = () => {
    if (!complete) {
      Alert.alert('Finish the required details', missingCopy());
      return;
    }
    router.push({ pathname: '/book/[slug]/schedule', params: { slug } });
  };

  const missingCopy = () => {
    if (config.sizeRequired && !scope.sizeBand) return 'Choose how big the place is to continue.';
    if (scope.condition === undefined && config.fields.some((field) => field.type === 'condition')) {
      return 'Tell us how much cleaning the place needs.';
    }
    if (scope.workstations === undefined) return 'Choose how many desks or workstations there are.';
    return 'Check the required details to continue.';
  };

  const toggleFocus = (id: string) => {
    selectionHaptic();
    const selected = scope.focusAreas.includes(id);
    patchScope({
      focusAreas: selected ? scope.focusAreas.filter((area) => area !== id) : [...scope.focusAreas, id],
    });
  };

  const onRemoveMedia = (id: string) => {
    const item = (getBookingDraft()?.media?.items ?? []).find((entry) => entry.id === id);
    if (item) deleteMediaFile(item.uri);
    removeMedia(id);
  };

  const applySuggestion = () => {
    selectionHaptic();
    patchDetails({ hours: suggestion.hours, cleaners: suggestion.cleaners });
  };

  const applyTotal = price({
    ...active,
    details: { ...details, hours: suggestion.hours, cleaners: suggestion.cleaners },
  }).total;

  const sizeDone = Boolean(scope.sizeBand);

  return (
    <View style={styles.screen}>
      <TopBar
        title={service?.name ?? 'Job scope'}
        onBack={confirmClose}
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
      <StepperHeader current={1} />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.title} maxFontSizeMultiplier={1.3}>
            {config.heading}
          </Text>
          <Text style={styles.caption} maxFontSizeMultiplier={1.3}>
            Helps us send the right team and time.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.titleRow}>
            <Text style={styles.label} maxFontSizeMultiplier={1.3}>
              How big is the place?
            </Text>
            <StatusPill state={sizeDone ? 'done' : 'required'} />
          </View>
          <View style={styles.cards}>
            {sizeBandOptions.slice(0, 3).map((option) => (
              <SelectableCard
                key={option.id}
                title={option.label}
                subtitle={option.description}
                selected={scope.sizeBand === option.id}
                onPress={() => {
                  selectionHaptic();
                  patchScope(selectSizeBand(option.id));
                  setShowExactSize(false);
                  setAreaText('');
                }}
              />
            ))}
          </View>
          <View style={styles.sizeRadioRow}>
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected: scope.sizeBand === 'unsure' && !showExactSize }}
              onPress={() => {
                selectionHaptic();
                patchScope({ sizeBand: 'unsure' as PropertySizeBand, areaSqm: undefined });
                setShowExactSize(false);
                setAreaText('');
              }}
              style={styles.sizeRadioOption}>
              <View
                style={[
                  styles.sizeRadioRing,
                  scope.sizeBand === 'unsure' && !showExactSize && styles.sizeRadioRingOn,
                ]}>
                {scope.sizeBand === 'unsure' && !showExactSize ? (
                  <View style={styles.sizeRadioDot} />
                ) : null}
              </View>
              <Text style={styles.sizeRadioLabel} maxFontSizeMultiplier={1.3}>
                Not sure
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected: showExactSize }}
              onPress={() => {
                selectionHaptic();
                setAreaText(scope.areaSqm ? String(scope.areaSqm) : '');
                setShowExactSize(true);
              }}
              style={styles.sizeRadioOption}>
              <View style={[styles.sizeRadioRing, showExactSize && styles.sizeRadioRingOn]}>
                {showExactSize ? <View style={styles.sizeRadioDot} /> : null}
              </View>
              <Text style={styles.sizeRadioLabel} maxFontSizeMultiplier={1.3}>
                I know the exact size
              </Text>
            </Pressable>
          </View>
          {showExactSize ? (
            <>
              <TextInput
                accessibilityLabel="Size in square metres"
                keyboardType="number-pad"
                maxLength={4}
                onChangeText={(value) => {
                  const digits = value.replace(/[^0-9]/g, '').slice(0, 4);
                  setAreaText(digits);
                  const areaSqm = Number(digits);
                  if (!digits) {
                    patchScope({ areaSqm: undefined, sizeBand: undefined });
                    return;
                  }
                  if (areaSqm >= 10 && areaSqm <= 5000) {
                    patchScope(applyExactArea(areaSqm));
                  } else {
                    patchScope({ areaSqm: undefined, sizeBand: undefined });
                  }
                }}
                placeholder="Size in m²"
                placeholderTextColor={colors.placeholder}
                style={styles.areaInput}
                value={areaText}
              />
              {areaText && (Number(areaText) < 10 || Number(areaText) > 5000) ? (
                <Text style={styles.areaError} maxFontSizeMultiplier={1.3}>
                  Enter a size between 10 and 5,000 m².
                </Text>
              ) : null}
            </>
          ) : null}
        </View>

        <View style={styles.section}>
          <View style={styles.titleRow}>
            <Text style={styles.label} maxFontSizeMultiplier={1.3}>
              Rooms
            </Text>
            <StatusPill state={roomsDone ? 'done' : 'required'} />
          </View>
          <View style={styles.panel}>
            {config.fields.map((field) => {
              if (field.type === 'counter') {
                return (
                  <View key={field.id} style={styles.fieldBlock}>
                    <CounterStepper
                      label={field.label}
                      hint={field.hint}
                      value={scope[field.id] ?? field.initial}
                      min={field.min}
                      max={field.max}
                      onChange={(value) => patchScope({ [field.id]: value })}
                    />
                  </View>
                );
              }
              if (field.type === 'workstations') {
                return (
                  <View key={field.id} style={styles.fieldBlock}>
                    <Text style={styles.counterLabel} maxFontSizeMultiplier={1.3}>
                      {field.label}
                    </Text>
                    <View style={styles.chipWrap}>
                      {workstationOptions.map((option) => {
                        const selected = scope.workstations === option.value;
                        return (
                          <Pressable
                            key={option.value}
                            accessibilityRole="radio"
                            accessibilityState={{ selected }}
                            onPress={() => {
                              selectionHaptic();
                              patchScope({ workstations: option.value as BookingWorkstations });
                            }}
                            style={[chip.base, styles.chipSmall, selected && chip.selected]}>
                            <Text
                              style={[styles.chipText, selected && styles.chipTextOn]}
                              maxFontSizeMultiplier={1.3}>
                              {option.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                );
              }
              return (
                <View key={field.id} style={styles.fieldBlock}>
                  <Text style={styles.counterLabel} maxFontSizeMultiplier={1.3}>
                    {field.label}
                  </Text>
                  <View style={styles.conditionWrap}>
                    {conditionOptions.map((option) => {
                      const selected = scope.condition === option.value;
                      return (
                        <Pressable
                          key={option.value}
                          accessibilityRole="radio"
                          accessibilityState={{ selected }}
                          onPress={() => {
                            selectionHaptic();
                            patchScope({ condition: option.value });
                          }}
                          style={[styles.conditionOption, selected && styles.conditionOptionOn]}>
                          <Text
                            style={[styles.conditionLabel, selected && styles.conditionLabelOn]}
                            maxFontSizeMultiplier={1.3}>
                            {option.label}
                          </Text>
                          <Text
                            style={[styles.conditionHint, selected && styles.conditionHintOn]}
                            maxFontSizeMultiplier={1.3}>
                            {option.description}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.titleRow}>
            <Text style={styles.label} maxFontSizeMultiplier={1.3}>
              Anything needing extra attention?
            </Text>
            <StatusPill state="optional" />
          </View>
          <View style={styles.chipWrap}>
            {config.focusOptions.map((area) => {
              const selected = scope.focusAreas.includes(area.id);
              return (
                <Pressable
                  key={area.id}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                  onPress={() => toggleFocus(area.id)}
                  style={[chip.base, styles.chipSmall, selected && chip.selected]}>
                  <Text
                    style={[styles.chipText, selected && styles.chipTextOn]}
                    maxFontSizeMultiplier={1.3}>
                    {area.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {complete && !suggestionDismissed ? (
          <View
            style={[
              styles.banner,
              capacityRatio < 0.7
                ? styles.bannerWarning
                : capacityRatio <= 1.3
                  ? styles.bannerSuccess
                  : styles.bannerInfo,
            ]}>
            {capacityRatio < 0.7 ? (
              <TriangleAlert size={18} color={colors.warning} strokeWidth={2} />
            ) : capacityRatio <= 1.3 ? (
              <Check size={18} color={colors.green700} strokeWidth={2.5} />
            ) : (
              <Info size={18} color={colors.info} strokeWidth={2} />
            )}
            <View style={styles.bannerBody}>
              <Text style={styles.bannerText} maxFontSizeMultiplier={1.3}>
                {capacityRatio < 0.7
                  ? `A place like this usually needs ${suggestionCopy(suggestion)}. Your booking may be too short.`
                  : capacityRatio <= 1.3
                    ? 'Your booking length looks right for this job.'
                    : `You may not need this long. A place like this usually takes ${suggestionCopy(suggestion)}.`}
              </Text>
              {capacityRatio < 0.7 || capacityRatio > 1.3 ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={applySuggestion}
                  style={styles.applyBtn}>
                  <Text style={styles.applyText} maxFontSizeMultiplier={1.2}>
                    Apply · total becomes {ugx(applyTotal)}
                  </Text>
                </Pressable>
              ) : null}
            </View>
            {capacityRatio < 0.7 || capacityRatio > 1.3 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Dismiss suggestion"
                hitSlop={8}
                onPress={() => setSuggestionDismissed(true)}>
                <X size={16} color={colors.textMuted} strokeWidth={2} />
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <View style={styles.section}>
          <View style={styles.titleRow}>
            <Text style={styles.label} maxFontSizeMultiplier={1.3}>
              Photos and video
            </Text>
            <StatusPill state="optional" />
          </View>
          <Text style={styles.caption} maxFontSizeMultiplier={1.3}>
            {config.mediaHint}
          </Text>

          <View style={styles.mediaCard}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Add photos or video, ${mediaLeft} left`}
              disabled={mediaLeft === 0}
              onPress={() => setMediaOpen(true)}
              style={[styles.addRow, mediaLeft === 0 && styles.addRowOff]}>
              <View style={styles.addIcon}>
                <Plus size={18} color={colors.green700} strokeWidth={2.5} />
              </View>
              <Text style={styles.addLabel} maxFontSizeMultiplier={1.3}>
                Add photos or video
              </Text>
              <Text style={styles.remaining} maxFontSizeMultiplier={1.2}>
                {mediaLeft} left
              </Text>
            </Pressable>

            {mediaItems.length > 0 ? (
              <View style={styles.mediaGrid}>
                {mediaItems.map((item, index) => (
                  <MediaTile
                    key={item.id}
                    item={item}
                    index={index}
                    total={mediaItems.length}
                    onPress={() => setPreviewItem(item)}
                    onRemove={() => onRemoveMedia(item.id)}
                  />
                ))}
              </View>
            ) : (
              <Text style={styles.mediaEmptyText} maxFontSizeMultiplier={1.3}>
                No photos or videos added yet.
              </Text>
            )}
          </View>

          <Text style={styles.caption} maxFontSizeMultiplier={1.3}>
            Videos are limited to {jobMedia.videoMaxSeconds} s and 25 MB to keep uploads fast.
            Uploads start after your booking is saved.
          </Text>
        </View>
      </ScrollView>

      {!complete ? (
        <Text style={styles.helper} maxFontSizeMultiplier={1.3}>
          {missingCopy()}
        </Text>
      ) : null}
      <SummaryBar
        caption={`${details.hours} h · ${details.cleaners} cleaner${details.cleaners === 1 ? '' : 's'}`}
        total={quote.total}
        actionLabel="Continue"
        onPress={onNext}
        disabled={!complete}
        onDetailsPress={() => setSummaryOpen(true)}
      />

      <SummarySheet
        draft={active}
        onClose={() => setSummaryOpen(false)}
        serviceName={service?.name}
        visible={summaryOpen}
      />
      <MediaSheet
        visible={mediaOpen}
        items={mediaItems}
        onClose={() => setMediaOpen(false)}
        onChange={(next) => setMedia({ items: next, uploaded: false })}
        onRemove={onRemoveMedia}
        onPreview={setPreviewItem}
      />
      <MediaPreview item={previewItem} onClose={() => setPreviewItem(null)} onRemove={onRemoveMedia} />
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
  section: { gap: space[3] },
  title: { ...text.h2 },
  caption: { ...text.caption, color: colors.textMuted },
  label: { ...text.h3 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space[2] },
  optionalPill: { ...text.caption, color: colors.textMuted },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 24,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
  },
  pillRequired: { backgroundColor: colors.errorBg },
  pillDone: { backgroundColor: colors.successBg },
  pillText: { fontSize: 12, fontFamily: font.bodySemi, letterSpacing: 0.2 },
  pillTextRequired: { color: colors.error },
  pillTextDone: { color: colors.green700 },
  cards: { gap: space[3] },
  sizeRadioRow: { flexDirection: 'row', alignItems: 'center', gap: space[4] },
  sizeRadioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    minHeight: 44,
  },
  sizeRadioRing: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  sizeRadioRingOn: { borderColor: colors.green700 },
  sizeRadioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.green700 },
  sizeRadioLabel: { ...text.bodyM, fontFamily: font.bodySemi, color: colors.text },
  areaInput: {
    height: 48,
    borderRadius: radius.input,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: space[3],
    fontFamily: font.body,
    fontSize: 15,
    color: colors.text,
  },
  areaError: { ...text.caption, color: colors.error },
  panel: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    paddingHorizontal: space[3],
    paddingVertical: space[2],
    ...shadow.card,
  },
  fieldBlock: { paddingVertical: space[2] },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  counterLabel: { ...text.bodyM, color: colors.text },
  counterHint: { ...text.caption, color: colors.textMuted },
  conditionWrap: { gap: space[2], marginTop: space[1] },
  conditionOption: {
    paddingVertical: space[2],
    paddingHorizontal: space[3],
    borderRadius: radius.input,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  conditionOptionOn: { borderColor: colors.green500, backgroundColor: colors.green50 },
  conditionLabel: { ...text.bodyM, fontFamily: font.bodySemi, color: colors.text },
  conditionLabelOn: { color: colors.green700 },
  conditionHint: { ...text.caption, color: colors.textMuted },
  conditionHintOn: { color: colors.green700 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipSmall: { paddingHorizontal: 14 },
  chipText: { ...text.bodyM, fontFamily: font.bodySemi, fontSize: 13 },
  chipTextOn: { color: colors.surface },
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[2],
    borderRadius: radius.card,
    padding: space[3],
  },
  bannerWarning: { backgroundColor: colors.warningBg },
  bannerSuccess: { backgroundColor: colors.successBg },
  bannerInfo: { backgroundColor: colors.infoBg },
  bannerBody: { flex: 1, gap: space[2] },
  bannerText: { ...text.caption, color: colors.text, lineHeight: 19 },
  applyBtn: {
    alignSelf: 'flex-start',
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: space[3],
    borderRadius: radius.button,
    backgroundColor: colors.surface,
  },
  applyText: { ...text.caption, fontFamily: font.bodySemi, color: colors.green700 },
  mediaCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: space[3],
    gap: space[3],
    ...shadow.card,
  },
  addRow: {
    minHeight: 56,
    borderRadius: radius.input,
    backgroundColor: colors.green50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    paddingHorizontal: space[3],
  },
  addRowOff: { opacity: 0.6 },
  addIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  addLabel: { ...text.bodyM, fontFamily: font.bodySemi, color: colors.green700, flex: 1 },
  remaining: { ...text.caption, color: colors.green700 },
  mediaActions: { flexDirection: 'row', gap: space[2] },
  mediaAction: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.input,
    borderWidth: 1.5,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: space[2],
  },
  mediaActionOff: { opacity: 0.5 },
  mediaActionText: { ...text.bodyM, fontFamily: font.bodySemi, color: colors.green700, fontSize: 13 },
  mediaCount: { ...text.caption, color: colors.textMuted, fontSize: 11 },
  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  mediaTile: {
    width: 96,
    height: 96,
    borderRadius: radius.input,
    overflow: 'hidden',
    backgroundColor: colors.disabledBg,
  },
  mediaImage: { width: '100%', height: '100%' },
  videoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.green900,
  },
  videoLabel: { ...text.caption, color: colors.surface, fontSize: 11 },
  removeBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    padding: space[3],
    borderRadius: radius.input,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  mediaEmptyText: { ...text.caption, color: colors.textMuted },
  helper: {
    ...text.caption,
    color: colors.textMuted,
    backgroundColor: colors.bg,
    paddingHorizontal: space[4],
    paddingTop: space[2],
    textAlign: 'center',
  },
});
