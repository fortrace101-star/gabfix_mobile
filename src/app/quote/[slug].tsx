import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  ImagePlus,
  Sparkles,
  X,
} from 'lucide-react-native';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { DateStrip, toISODate } from '@/components/booking/date-strip';
import { SelectableCard } from '@/components/booking/selectable-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TopBar } from '@/components/ui/top-bar';
import { serviceBySlug } from '@/config/services';
import { shortDate } from '@/lib/plans';
import type { BookingFrequency } from '@/lib/pricing';
import {
  QUOTE_PROPERTY_OPTIONS,
  QUOTE_SIZE_OPTIONS,
  quoteFrequencyLabel,
  quotePropertyLabel,
  quoteSizeLabel,
} from '@/lib/quotes';
import { addQuoteRequest, type QuoteRequest } from '@/store/quotes';
import { useOnboardingArea } from '@/store/onboarding';
import { useAuthUser } from '@/store/session';
import { chip, colors, font, radius, space, text } from '@/theme';
import { phoneUG } from '@/utils/format';

const MAX_PHOTOS = 5;

const FREQUENCY_OPTIONS: { value: BookingFrequency; label: string }[] = [
  { value: 'once', label: 'One time' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'severalPerWeek', label: '2–3 times a week' },
  { value: 'monthly', label: 'Monthly' },
];

const phoneDigits = (value?: string): string =>
  (value ?? '').replace(/\D/g, '').replace(/^256/, '').replace(/^0/, '').slice(0, 9);

const isValidPhone = (digits: string): boolean => /^7\d{8}$/.test(digits);

const buildDays = (): Date[] => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + 1);

  return Array.from({ length: 30 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
};

function ChoiceChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      aria-checked={selected}
      onPress={onPress}
      style={[chip.base, styles.choice, selected && chip.selected]}>
      <Text
        maxFontSizeMultiplier={1.3}
        style={[styles.choiceText, selected && styles.choiceTextOn]}>
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * P25 Quote request for office and specialised work. There is no quotes API or photo
 * picker in the launch build, so the request is saved locally and appears in Bookings.
 */
export default function QuoteRequestScreen() {
  const params = useLocalSearchParams<{ slug?: string; details?: string }>();
  const insets = useSafeAreaInsets();
  const area = useOnboardingArea();
  const user = useAuthUser();
  const slug = typeof params.slug === 'string' ? params.slug : 'custom';
  const service = serviceBySlug(slug);
  const custom = !service;

  const [days] = useState(buildDays);
  const [propertyType, setPropertyType] = useState(QUOTE_PROPERTY_OPTIONS[0].value);
  const [size, setSize] = useState(QUOTE_SIZE_OPTIONS[0].value);
  const [frequency, setFrequency] = useState<BookingFrequency>('once');
  const [preferredDateISO, setPreferredDateISO] = useState(() => toISODate(days[0]));
  const [details, setDetails] = useState(
    custom && typeof params.details === 'string' ? params.details : '',
  );
  const [contactName, setContactName] = useState(user?.name ?? '');
  const [contactPhone, setContactPhone] = useState(() => phoneDigits(user?.phone));
  const [photos, setPhotos] = useState<string[]>([]);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState<QuoteRequest | null>(null);

  const areaName = area?.name ?? '';
  const detailsError =
    touched.details && custom && details.trim().length < 10
      ? 'Tell us what needs cleaning, with at least a short description.'
      : undefined;
  const nameError =
    touched.name && contactName.trim().length < 2 ? 'Enter the name of the contact.' : undefined;
  const phoneError =
    touched.phone && !isValidPhone(contactPhone)
      ? 'Enter the 9 digits after +256, for example 772 123 456.'
      : undefined;
  const complete =
    Boolean(areaName) &&
    (!custom || details.trim().length >= 10) &&
    contactName.trim().length >= 2 &&
    isValidPhone(contactPhone);

  const markTouched = (field: string) => setTouched((current) => ({ ...current, [field]: true }));

  const pickPhotos = async () => {
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Photo access needed',
        'Allow photo access in your device settings to attach photos to this request.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.35,
      base64: true,
    });
    if (result.canceled) return;

    const additions = result.assets
      .slice(0, remaining)
      .map((asset) =>
        asset.base64 ? `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}` : asset.uri,
      )
      .filter(Boolean);
    setPhotos((current) => [...current, ...additions].slice(0, MAX_PHOTOS));
  };

  const submit = () => {
    if (!complete) {
      setTouched({ details: true, name: true, phone: true });
      return;
    }
    const request = addQuoteRequest({
      serviceSlug: service?.slug ?? 'custom',
      serviceName: service?.name ?? 'Custom cleaning request',
      details: details.trim(),
      propertyType,
      size,
      frequency,
      preferredDateISO,
      areaName,
      contactName: contactName.trim(),
      contactPhone,
      photos,
    });
    setSubmitted(request);
  };

  if (submitted) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <TopBar title="Request sent" onBack={() => router.replace('/bookings')} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.success}>
          <View style={styles.successIcon}>
            <CheckCircle2 size={40} color={colors.green500} strokeWidth={2} />
          </View>
          <Text style={styles.successTitle} maxFontSizeMultiplier={1.3}>
            We&apos;ll reply within 24 hours
          </Text>
          <Text style={styles.successBody} maxFontSizeMultiplier={1.3}>
            We&apos;re pricing {submitted.serviceName.toLowerCase()} for {submitted.areaName}. We
            may call {phoneUG(submitted.contactPhone)} if we need a few more details.
          </Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Request</Text>
              <Text style={styles.summaryValue}>{submitted.id}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Property</Text>
              <Text style={styles.summaryValue}>
                {quotePropertyLabel(submitted.propertyType)} · {quoteSizeLabel(submitted.size)}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Preferred start</Text>
              <Text style={styles.summaryValue}>{shortDate(submitted.preferredDateISO)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Frequency</Text>
              <Text style={styles.summaryValue}>{quoteFrequencyLabel(submitted.frequency)}</Text>
            </View>
          </View>

          <View style={styles.note}>
            <ClipboardList size={20} color={colors.green700} strokeWidth={2} />
            <Text style={styles.noteText} maxFontSizeMultiplier={1.3}>
              You&apos;ll find this request in Bookings → Requests. We&apos;ll send the amount and
              what it covers before any work is booked.
            </Text>
          </View>

          <Button label="Go to Bookings" onPress={() => router.replace('/bookings')} />
          <Button
            label="Back to home"
            variant="ghost"
            onPress={() => router.replace('/home')}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}>
      <SafeAreaView style={styles.screen} edges={['top']}>
        <TopBar title="Request a quote" onBack={() => router.back()} />
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}>
          <View style={styles.intro}>
            <Text style={styles.title} maxFontSizeMultiplier={1.3}>
              Tell us about the job
            </Text>
            <Text style={styles.subtitle} maxFontSizeMultiplier={1.3}>
              For offices, schools and larger or specialised cleans, we&apos;ll confirm a fixed
              price before you book.
            </Text>
          </View>

          <View style={styles.serviceCard}>
            <View style={styles.serviceIcon}>
              <Sparkles size={22} color={colors.green500} strokeWidth={2} />
            </View>
            <View style={styles.serviceBody}>
              <Text style={styles.serviceName} maxFontSizeMultiplier={1.3}>
                {service?.name ?? 'Custom cleaning request'}
              </Text>
              <Text style={styles.serviceCaption} maxFontSizeMultiplier={1.3}>
                {service?.tagline ?? 'Tell us what you need and we will price it.'}
              </Text>
            </View>
            <View style={styles.quotePill}>
              <Text style={styles.quotePillText}>Quote</Text>
            </View>
          </View>

          <Input
            label={custom ? 'What do you need cleaned?' : 'Anything else we should know?'}
            value={details}
            onChangeText={setDetails}
            onBlur={() => markTouched('details')}
            error={detailsError}
            helper={
              custom
                ? 'Include rooms, surfaces or special items so we can price it properly.'
                : 'Optional: rooms, surfaces or special items.'
            }
            placeholder={
              custom
                ? 'e.g. Deep clean a 3-bedroom home before tenants move in'
                : 'e.g. The office kitchen and two meeting rooms'
            }
            multiline
            numberOfLines={4}
            inputStyle={styles.multiline}
            maxLength={500}
            autoCapitalize="sentences"
          />

          <View style={styles.group}>
            <View style={styles.photoHeader}>
              <Text style={styles.label} maxFontSizeMultiplier={1.3}>
                Photos
              </Text>
              <Text style={styles.optional} maxFontSizeMultiplier={1.2}>
                Optional · up to {MAX_PHOTOS}
              </Text>
            </View>
            <View style={styles.photoGrid}>
              {photos.map((photo, index) => (
                <View key={`${photo.slice(0, 24)}-${index}`} style={styles.photoTile}>
                  <Image source={{ uri: photo }} style={styles.photo} contentFit="cover" />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove photo ${index + 1}`}
                    hitSlop={6}
                    onPress={() =>
                      setPhotos((current) => current.filter((_, item) => item !== index))
                    }
                    style={styles.photoRemove}>
                    <X size={12} color={colors.surface} strokeWidth={3} />
                  </Pressable>
                </View>
              ))}
              {photos.length < MAX_PHOTOS ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Add photos to this request"
                  onPress={() => void pickPhotos()}
                  style={styles.photoAdd}>
                  <ImagePlus size={22} color={colors.green500} strokeWidth={2} />
                  <Text style={styles.photoAddText} maxFontSizeMultiplier={1.2}>
                    Add
                  </Text>
                </Pressable>
              ) : null}
            </View>
            <Text style={styles.photoHint} maxFontSizeMultiplier={1.2}>
              Show us the rooms or items that need attention. Photos are stored with this
              request on your device until it is sent to the team.
            </Text>
          </View>

          <View style={styles.group}>
            <Text style={styles.label} maxFontSizeMultiplier={1.3}>
              Property type
            </Text>
            <View style={styles.chips}>
              {QUOTE_PROPERTY_OPTIONS.map((option) => (
                <ChoiceChip
                  key={option.value}
                  label={option.label}
                  selected={propertyType === option.value}
                  onPress={() => setPropertyType(option.value)}
                />
              ))}
            </View>
          </View>

          <View style={styles.group}>
            <Text style={styles.label} maxFontSizeMultiplier={1.3}>
              Size
            </Text>
            <View style={styles.sizeCards}>
              {QUOTE_SIZE_OPTIONS.map((option) => (
                <SelectableCard
                  key={option.value}
                  title={option.label}
                  subtitle={option.subtitle}
                  selected={size === option.value}
                  onPress={() => setSize(option.value)}
                />
              ))}
            </View>
          </View>

          <View style={styles.group}>
            <Text style={styles.label} maxFontSizeMultiplier={1.3}>
              How often?
            </Text>
            <View style={styles.chips}>
              {FREQUENCY_OPTIONS.map((option) => (
                <ChoiceChip
                  key={option.value}
                  label={option.label}
                  selected={frequency === option.value}
                  onPress={() => setFrequency(option.value)}
                />
              ))}
            </View>
          </View>

          <View style={styles.group}>
            <View style={styles.dateHeader}>
              <Text style={styles.label} maxFontSizeMultiplier={1.3}>
                Preferred start
              </Text>
              <View style={styles.dateValue}>
                <CalendarDays size={16} color={colors.green700} strokeWidth={2} />
                <Text style={styles.dateText} maxFontSizeMultiplier={1.2}>
                  {shortDate(preferredDateISO)}
                </Text>
              </View>
            </View>
            <View style={styles.dateStrip}>
              <DateStrip
                days={days}
                selectedISO={preferredDateISO}
                onSelect={setPreferredDateISO}
              />
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={areaName ? `Area: ${areaName}. Change area` : 'Choose your area'}
            onPress={() => router.push('/area-select')}
            style={styles.areaRow}>
            <View style={styles.areaBody}>
              <Text style={styles.areaCaption} maxFontSizeMultiplier={1.2}>
                Area
              </Text>
              <Text
                style={[styles.areaValue, !areaName && styles.areaValueEmpty]}
                maxFontSizeMultiplier={1.3}>
                {areaName || 'Choose your area'}
              </Text>
            </View>
            <Text style={styles.changeText} maxFontSizeMultiplier={1.2}>
              Change
            </Text>
          </Pressable>

          <View style={styles.group}>
            <Text style={styles.label} maxFontSizeMultiplier={1.3}>
              Contact details
            </Text>
            <Input
              label="Name"
              value={contactName}
              onChangeText={setContactName}
              onBlur={() => markTouched('name')}
              error={nameError}
              autoCapitalize="words"
              textContentType="name"
              returnKeyType="next"
            />
            <Input
              label="Phone"
              prefix="+256"
              value={contactPhone}
              onChangeText={(value) => setContactPhone(phoneDigits(value))}
              onBlur={() => markTouched('phone')}
              error={phoneError}
              helper="We use this number to ask questions or send the quote."
              keyboardType="phone-pad"
              maxLength={9}
              textContentType="telephoneNumber"
              returnKeyType="done"
            />
          </View>

          {!areaName ? (
            <View style={styles.warning}>
              <Text style={styles.warningText} maxFontSizeMultiplier={1.3}>
                Choose an area so we can confirm the visit is within our service zone.
              </Text>
            </View>
          ) : null}
        </ScrollView>

        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, space[3]) },
          ]}>
          <Button
            label="Send request"
            onPress={submit}
            disabled={!complete}
            accessibilityHint="Sends your request to the Gabfix team for a fixed quote"
          />
          <Text style={styles.footerNote} maxFontSizeMultiplier={1.2}>
            No payment now. We reply within 24 hours.
          </Text>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: {
    paddingHorizontal: space[4],
    paddingTop: space[2],
    paddingBottom: 160,
    gap: space[5],
  },
  intro: { gap: space[1] },
  title: { ...text.h2 },
  subtitle: { ...text.caption },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    padding: space[3],
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  serviceIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.tile,
    backgroundColor: colors.green50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceBody: { flex: 1, gap: 2 },
  serviceName: { ...text.bodyM, fontFamily: font.bodySemi, color: colors.text },
  serviceCaption: { ...text.caption },
  quotePill: {
    height: 24,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.yellow50,
    justifyContent: 'center',
  },
  quotePillText: { ...text.caption, fontSize: 11, color: colors.yellow800, fontFamily: font.bodySemi },
  multiline: { height: 96, paddingTop: space[3], textAlignVertical: 'top' },
  photoHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  optional: { ...text.caption },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  photoTile: { width: 72, height: 72, borderRadius: 12, overflow: 'hidden' },
  photo: { width: '100%', height: '100%' },
  photoRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoAdd: {
    width: 72,
    height: 72,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.green300,
    backgroundColor: colors.green50,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  photoAddText: { ...text.caption, fontSize: 10, color: colors.green700 },
  photoHint: { ...text.caption },
  group: { gap: space[3] },
  label: { ...text.h3 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  choice: { paddingHorizontal: space[3] },
  choiceText: { ...text.bodyM, color: colors.text },
  choiceTextOn: { color: colors.surface, fontFamily: font.bodySemi },
  sizeCards: { gap: space[2] },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[2],
  },
  dateValue: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateText: { ...text.caption, color: colors.green700, fontFamily: font.bodySemi },
  dateStrip: { marginHorizontal: -space[4] },
  areaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    minHeight: 64,
    paddingHorizontal: space[3],
    borderRadius: radius.input,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  areaBody: { flex: 1, gap: 2 },
  areaCaption: { ...text.caption },
  areaValue: { ...text.bodyM, fontFamily: font.bodySemi },
  areaValueEmpty: { color: colors.placeholder },
  changeText: { ...text.bodyM, color: colors.green700, fontFamily: font.bodySemi },
  warning: {
    borderRadius: radius.input,
    padding: space[3],
    backgroundColor: colors.warningBg,
  },
  warningText: { ...text.caption, color: colors.text },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: space[3],
    paddingHorizontal: space[4],
    gap: 6,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  footerNote: { ...text.caption, textAlign: 'center' },
  success: {
    padding: space[5],
    paddingBottom: space[10],
    gap: space[4],
    alignItems: 'stretch',
  },
  successIcon: {
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: radius.pill,
    backgroundColor: colors.green50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space[6],
  },
  successTitle: { ...text.h2, textAlign: 'center' },
  successBody: { ...text.bodyM, color: colors.textMuted, textAlign: 'center' },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    paddingHorizontal: space[4],
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[3],
    minHeight: 52,
  },
  summaryLabel: { ...text.caption },
  summaryValue: { ...text.bodyM, fontFamily: font.bodySemi, flexShrink: 1, textAlign: 'right' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  note: {
    flexDirection: 'row',
    gap: space[3],
    padding: space[3],
    borderRadius: radius.input,
    backgroundColor: colors.green50,
  },
  noteText: { ...text.caption, color: colors.green700, flex: 1 },
});
