import { router, useLocalSearchParams } from 'expo-router';
import { Info, Plus, Sparkles, X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DynamicForm } from '@/components/booking/dynamic-form';
import { MediaPreview } from '@/components/booking/media-preview';
import { MediaSheet } from '@/components/booking/media-sheet';
import { MediaTile } from '@/components/booking/media-tile';
import { StepperHeader } from '@/components/booking/stepper-header';
import { SummaryBar } from '@/components/booking/summary-bar';
import { SummarySheet } from '@/components/booking/summary-sheet';
import { TopBar } from '@/components/ui/top-bar';
import { jobMedia } from '@/config/media';
import { serviceBySlug } from '@/config/services';
import {
  isScopeComplete,
  schemaForScope,
  schemaForService,
  suggestJob,
  suggestionCopy,
} from '@/lib/booking-scope';
import { validateAnswers, type FormField, type FormValue } from '@/lib/form-schema';
import { deleteMediaFile } from '@/lib/media';
import { price, type BookingMediaItem } from '@/lib/pricing';
import { useDraftExit } from '@/lib/use-draft-exit';
import {
  getBookingDraft,
  patchDetails,
  patchScope,
  removeMedia,
  setMedia,
  startDraft,
  useBookingDraft,
} from '@/store/booking';
import { colors, font, radius, space, text } from '@/theme';
import { selectionHaptic } from '@/utils/haptics';

/** P8b Job scope, drawn from the service's schema (Workstream H, Sections 14.4 and 3.3). */
export default function JobScopeScreen() {
  const params = useLocalSearchParams<{ slug?: string }>();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const draft = useBookingDraft();
  const service = serviceBySlug(slug);
  const active = draft && draft.serviceSlug === slug ? draft : null;
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [suggestionDismissed, setSuggestionDismissed] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [sheetSlot, setSheetSlot] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<BookingMediaItem | null>(null);

  const { requestExit, sheet } = useDraftExit({ step: 'scope' });

  useEffect(() => {
    if (!slug) return;
    const current = getBookingDraft();
    if (!current || current.serviceSlug !== slug) startDraft(slug);
  }, [slug]);

  const scope = active?.scope;
  const mediaItems = active?.media?.items ?? [];
  const schema = scope ? schemaForScope(scope) : schemaForService(slug);
  const mediaSlots = useMemo(
    () =>
      schema.sections
        .flatMap((section) => section.fields)
        .filter((field) => field.type === 'media-slot'),
    [schema],
  );

  if (!active || !scope) return <View style={styles.screen} />;

  const { details } = active;
  const quote = price(active);
  const errors = validateAnswers(schema, scope.answers, mediaItems.length);
  // Slot-aware completeness: a required media slot needs a file in that slot.
  const missingSlot = mediaSlots.some(
    (field) => field.required && !mediaItems.some((item) => item.slotId === field.id),
  );
  const complete = isScopeComplete(scope, mediaItems) && !missingSlot;
  const suggestion = suggestJob(slug, scope);
  const showSuggestion =
    service?.pricingMode !== 'quote' &&
    suggestion !== undefined &&
    !suggestionDismissed &&
    (details.hours !== suggestion.hours || details.cleaners !== suggestion.cleaners);

  const onAnswer = (fieldId: string, value: FormValue) => {
    patchScope({ answers: { ...scope.answers, [fieldId]: value } });
  };

  const onNext = () => {
    if (!complete) {
      setShowErrors(true);
      const first = Object.values(errors)[0];
      Alert.alert('Finish the required details', first ?? 'Add the required details to continue.');
      return;
    }
    router.push({ pathname: '/book/[slug]/schedule', params: { slug } });
  };

  const applySuggestion = () => {
    if (!suggestion) return;
    selectionHaptic();
    patchDetails({ hours: suggestion.hours, cleaners: suggestion.cleaners });
  };

  const onRemoveMedia = (id: string) => {
    const item = (getBookingDraft()?.media?.items ?? []).find((entry) => entry.id === id);
    if (item) deleteMediaFile(item.uri);
    removeMedia(id);
  };

  const sheetItems =
    sheetSlot === null
      ? mediaItems.filter((item) => !item.slotId)
      : mediaItems.filter((item) => item.slotId === sheetSlot);

  const onSheetChange = (next: BookingMediaItem[]) => {
    const others = mediaItems.filter((item) => item.slotId !== sheetSlot);
    setMedia({
      items: [...others, ...next.map((item) => ({ ...item, slotId: sheetSlot ?? undefined }))],
      uploaded: false,
    });
  };

  const openSlot = (slotId: string, _field: FormField) => {
    setSheetSlot(slotId);
    setMediaOpen(true);
  };

  const slotCount = (slotId: string) =>
    mediaItems.filter((item) => item.slotId === slotId).length;

  const mediaCountBySlot = Object.fromEntries(mediaSlots.map((field) => [field.id, slotCount(field.id)]));

  return (
    <View style={styles.screen}>
      <TopBar
        title={service?.name ?? 'Job scope'}
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
      <StepperHeader current={1} />
      {sheet}

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.title} maxFontSizeMultiplier={1.3}>
            {schema.heading}
          </Text>
          <Text style={styles.caption} maxFontSizeMultiplier={1.3}>
            {schema.mediaHint || 'Helps us send the right team and time.'}
          </Text>
        </View>

        <DynamicForm
          schema={schema}
          answers={scope.answers}
          onChange={onAnswer}
          errors={showErrors ? errors : undefined}
          mediaCountBySlot={mediaCountBySlot}
          onMediaPress={openSlot}
        />

        {showSuggestion && suggestion ? (
          <View style={styles.suggestion}>
            <Sparkles size={18} color={colors.green700} strokeWidth={2} />
            <View style={styles.suggestionText}>
              <Text style={styles.suggestionTitle} maxFontSizeMultiplier={1.3}>
                Suggested time
              </Text>
              <Text style={styles.suggestionBody} maxFontSizeMultiplier={1.3}>
                These details usually take {suggestionCopy(suggestion)}.
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Apply suggested time"
              onPress={applySuggestion}
              style={styles.apply}>
              <Text style={styles.applyText} maxFontSizeMultiplier={1.2}>
                Apply
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Dismiss suggestion"
              hitSlop={8}
              onPress={() => setSuggestionDismissed(true)}>
              <X size={16} color={colors.textMuted} strokeWidth={2} />
            </Pressable>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.label} maxFontSizeMultiplier={1.3}>
            Photos and video
          </Text>
          <Text style={styles.caption} maxFontSizeMultiplier={1.3}>
            Up to {jobMedia.maxItems} files, {jobMedia.maxVideos} of them video. Optional unless a
            photo slot above asks for one.
          </Text>
          <View style={styles.mediaRow}>
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
            {mediaItems.length < jobMedia.maxItems ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add photos or video"
                onPress={() => {
                  selectionHaptic();
                  setSheetSlot(null);
                  setMediaOpen(true);
                }}
                style={styles.addMedia}>
                <Plus size={22} color={colors.green700} strokeWidth={2} />
                <Text style={styles.addMediaText} maxFontSizeMultiplier={1.2}>
                  Add
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        <View style={styles.note}>
          <Info size={16} color={colors.textMuted} strokeWidth={2} />
          <Text style={styles.noteText} maxFontSizeMultiplier={1.3}>
            {service?.pricingMode === 'quote'
              ? 'We confirm the price after reviewing these details.'
              : 'Hours and team size stay editable until you pay.'}
          </Text>
        </View>
      </ScrollView>

      <SummaryBar
        caption={
          showErrors && Object.keys(errors).length > 0
            ? `${Object.keys(errors).length} required detail${
                Object.keys(errors).length === 1 ? '' : 's'
              } missing`
            : `${details.cleaners} cleaner${details.cleaners === 1 ? '' : 's'} · ${details.hours} h`
        }
        total={quote.total}
        actionLabel={service?.pricingMode === 'quote' ? 'Request quote' : 'Continue'}
        onPress={onNext}
        onDetailsPress={() => setSummaryOpen(true)}
      />

      <SummarySheet
        visible={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        serviceName={service?.name}
        draft={active}
      />

      <MediaSheet
        visible={mediaOpen}
        items={sheetItems}
        onClose={() => setMediaOpen(false)}
        onChange={onSheetChange}
        onRemove={onRemoveMedia}
        onPreview={setPreviewItem}
      />

      <MediaPreview
        item={previewItem}
        onClose={() => setPreviewItem(null)}
        onRemove={onRemoveMedia}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space[4], paddingBottom: space[8], gap: space[5] },
  section: { gap: space[1] },
  title: { ...text.h2 },
  caption: { ...text.caption, color: colors.textMuted },
  label: { ...text.bodyM, fontFamily: font.bodySemi },
  close: { padding: space[1] },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    padding: space[3],
    borderRadius: radius.input,
    backgroundColor: colors.green50,
  },
  suggestionText: { flex: 1, gap: 2 },
  suggestionTitle: { ...text.caption, fontFamily: font.bodySemi, color: colors.green700 },
  suggestionBody: { ...text.caption, color: colors.textMuted },
  apply: {
    paddingHorizontal: space[3],
    paddingVertical: space[2],
    borderRadius: radius.pill,
    backgroundColor: colors.green500,
  },
  applyText: { ...text.caption, fontFamily: font.bodySemi, color: colors.surface },
  mediaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2], marginTop: space[2] },
  addMedia: {
    width: 96,
    height: 96,
    borderRadius: radius.input,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addMediaText: { ...text.caption, color: colors.green700 },
  note: { flexDirection: 'row', gap: space[2], alignItems: 'flex-start' },
  noteText: { ...text.caption, color: colors.textMuted, flex: 1 },
});
