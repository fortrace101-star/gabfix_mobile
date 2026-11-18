import { router, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import { Check, ChevronRight, Home, MapPin, X } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ChipSelector } from '@/components/booking/chip-selector';
import { StepperHeader } from '@/components/booking/stepper-header';
import { SummaryBar } from '@/components/booking/summary-bar';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { TopBar } from '@/components/ui/top-bar';
import { serviceBySlug } from '@/config/services';
import { price, type BookingLocation } from '@/lib/pricing';
import {
  getBookingDraft,
  patchDraft,
  resetDraft,
  startDraft,
  useBookingDraft,
} from '@/store/booking';
import { useOnboardingArea } from '@/store/onboarding';
import { useAuthUser } from '@/store/session';
import { colors, font, radius, space, text } from '@/theme';

type PropertyType = BookingLocation['propertyType'];

type Form = {
  addressId?: string;
  street: string;
  landmark: string;
  access: string;
  propertyType: PropertyType;
  contactName: string;
  contactPhone: string;
  otherPerson: boolean;
  alternateName: string;
  alternatePhone: string;
};

/**
 * Dummy saved addresses until P24 stores real ones. Only the street fields live here;
 * the area always follows the area chosen for the current session.
 */
const savedAddresses: { id: string; label: string; street: string; landmark: string; propertyType: PropertyType }[] = [
  {
    id: 'home',
    label: 'Home',
    street: 'Plot 14, Ntinda Road',
    landmark: 'Near Shell petrol station, blue gate',
    propertyType: 'house',
  },
  {
    id: 'work',
    label: 'Work',
    street: '3rd floor, Acacia Mall, Kololo',
    landmark: 'Ask for reception on the third floor',
    propertyType: 'office',
  },
];

const propertyOptions: { value: PropertyType; label: string }[] = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'office', label: 'Office' },
];

const phoneDigits = (value?: string): string =>
  (value ?? '').replace(/\D/g, '').replace(/^256/, '').replace(/^0/, '').slice(0, 9);

const isValidPhone = (digits: string): boolean => /^7\d{8}$/.test(digits);

/** P11 Location and Contact. Writes the draft's `location` field; P12 reviews it. */
export default function LocationScreen() {
  const params = useLocalSearchParams<{ slug?: string }>();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const draft = useBookingDraft();
  const area = useOnboardingArea();
  const user = useAuthUser();
  const service = serviceBySlug(slug);
  const active = draft && draft.serviceSlug === slug ? draft : null;

  const [form, setForm] = useState<Form>(() => {
    const saved = getBookingDraft()?.location;
    return {
      addressId: saved?.addressId,
      street: saved?.street ?? '',
      landmark: saved?.landmark ?? '',
      access: saved?.access ?? '',
      propertyType: saved?.propertyType ?? 'apartment',
      contactName: saved?.contactName || user?.name || '',
      contactPhone: phoneDigits(saved?.contactPhone || user?.phone),
      otherPerson: Boolean(saved?.alternateContactName),
      alternateName: saved?.alternateContactName ?? '',
      alternatePhone: phoneDigits(saved?.alternateContactPhone),
    };
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const current = getBookingDraft();
    if (!current || current.serviceSlug !== slug) startDraft(slug);
  }, [slug]);

  const areaName = area?.name ?? '';

  const toLocation = (next: Form, nextArea: string): BookingLocation => ({
    addressId: next.addressId,
    area: nextArea,
    street: next.street.trim(),
    landmark: next.landmark.trim() || undefined,
    access: next.access.trim() || undefined,
    propertyType: next.propertyType,
    contactName: next.contactName.trim(),
    contactPhone: next.contactPhone,
    alternateContactName: next.otherPerson ? next.alternateName.trim() || undefined : undefined,
    alternateContactPhone: next.otherPerson ? next.alternatePhone || undefined : undefined,
  });

  const update = (changes: Partial<Form>) => {
    const next = { ...form, ...changes };
    setForm(next);
    if (getBookingDraft()) patchDraft({ location: toLocation(next, areaName) });
  };

  const markTouched = (field: string) => setTouched((current) => ({ ...current, [field]: true }));

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

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (router.canGoBack()) return false;
      confirmClose();
      return true;
    });
    return () => subscription.remove();
  }, [confirmClose]);

  if (!active) return <View style={styles.screen} />;

  const quote = price(active);
  const streetError =
    touched.street && form.street.trim().length < 3
      ? 'Enter the street, building or house number.'
      : undefined;
  const nameError =
    touched.name && form.contactName.trim().length < 2 ? 'Enter the name of the contact.' : undefined;
  const phoneError =
    touched.phone && !isValidPhone(form.contactPhone)
      ? 'Enter the 9 digits after +256, for example 772 123 456.'
      : undefined;
  const alternateNameError =
    touched.alternateName && form.otherPerson && form.alternateName.trim().length < 2
      ? 'Enter the name of the person who will be home.'
      : undefined;
  const alternatePhoneError =
    touched.alternatePhone && form.otherPerson && !isValidPhone(form.alternatePhone)
      ? 'Enter the 9 digits after +256.'
      : undefined;

  const complete =
    Boolean(areaName) &&
    form.street.trim().length >= 3 &&
    form.contactName.trim().length >= 2 &&
    isValidPhone(form.contactPhone) &&
    (!form.otherPerson ||
      (form.alternateName.trim().length >= 2 && isValidPhone(form.alternatePhone)));

  const useCurrentLocation = async () => {
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Location permission needed',
          'Allow location to fill your street automatically, or type it in below.',
        );
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const [place] = await Location.reverseGeocodeAsync(position.coords);
      update({
        street: [place?.name, place?.street].filter(Boolean).join(', ').slice(0, 120),
        landmark: [place?.district, place?.city].filter(Boolean).join(', '),
      });
    } catch {
      Alert.alert(
        'Location unavailable',
        'We could not read your position. Type your street below instead.',
      );
    } finally {
      setLocating(false);
    }
  };

  const onNext = () => {
    if (getBookingDraft()) patchDraft({ location: toLocation(form, areaName) });
    Alert.alert(
      'Review and pay is next',
      'Your address is saved. The review and payment step (P12) is the next screen in the build.',
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}>
      <TopBar
        title={service?.name ?? 'Location'}
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
      <StepperHeader current={2} />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <View style={styles.intro}>
          <Text style={styles.title} maxFontSizeMultiplier={1.3}>
            Where should we clean?
          </Text>
          <Text style={styles.subtitle} maxFontSizeMultiplier={1.3}>
            Your cleaner sees this address and contact only after you book.
          </Text>
        </View>

        <View style={styles.group}>
          <Text style={styles.label} maxFontSizeMultiplier={1.3}>
            Saved addresses
          </Text>
          {savedAddresses.map((address) => {
            const selected = form.addressId === address.id;
            return (
              <Pressable
                key={address.id}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                aria-checked={selected}
                accessibilityLabel={`${address.label}. ${address.street}`}
                onPress={() =>
                  update({
                    addressId: address.id,
                    street: address.street,
                    landmark: address.landmark,
                    propertyType: address.propertyType,
                  })
                }
                style={[styles.addressCard, selected && styles.addressCardOn]}>
                <View style={styles.addressChip}>
                  <Home size={14} color={colors.green700} strokeWidth={2} />
                  <Text style={styles.addressChipText} maxFontSizeMultiplier={1.2}>
                    {address.label}
                  </Text>
                </View>
                <Text style={styles.addressText} maxFontSizeMultiplier={1.3} numberOfLines={2}>
                  {address.street}
                </Text>
                {selected ? (
                  <View style={styles.addressCheck}>
                    <Check size={16} color={colors.surface} strokeWidth={3} />
                  </View>
                ) : null}
              </Pressable>
            );
          })}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add a new address"
            onPress={() =>
              Alert.alert(
                'Saved addresses',
                'The address book (P24) is not built yet. Type the new address below and it will be saved with this booking.',
              )
            }
            style={({ pressed }) => [styles.addAddress, pressed && styles.addAddressPressed]}>
            <Text style={styles.addAddressText} maxFontSizeMultiplier={1.3}>
              + Add a new address
            </Text>
          </Pressable>
        </View>

        <View style={styles.mapCard}>
          <View style={styles.mapPin}>
            <MapPin size={22} color={colors.surface} strokeWidth={2} />
          </View>
          <View style={styles.mapBody}>
            <Text style={styles.mapTitle} maxFontSizeMultiplier={1.3}>
              {areaName ? `${areaName}${form.street ? ` · ${form.street.split(',')[0]}` : ''}` : 'No area chosen yet'}
            </Text>
            <Text style={styles.mapCaption} maxFontSizeMultiplier={1.3}>
              Your cleaner is matched to this area. The pin is confirmed when you review the booking.
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Use my current location"
            accessibilityState={{ disabled: locating, busy: locating }}
            disabled={locating}
            hitSlop={8}
            onPress={useCurrentLocation}
            style={[styles.locate, locating && styles.locateOff]}>
            <Text style={styles.locateText} maxFontSizeMultiplier={1.2}>
              {locating ? 'Locating…' : 'Use location'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.group}>
          <Text style={styles.label} maxFontSizeMultiplier={1.3}>
            Property type
          </Text>
          <ChipSelector
            options={propertyOptions}
            value={form.propertyType}
            onChange={(propertyType) => update({ propertyType })}
            itemStyle={styles.flexItem}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={areaName ? `Area: ${areaName}. Change area` : 'Choose your area'}
          onPress={() => router.push('/area-select')}
          style={({ pressed }) => [styles.areaRow, pressed && styles.areaRowPressed]}>
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
          <ChevronRight size={20} color={colors.disabledText} strokeWidth={2} />
        </Pressable>

        <Input
          label="Street, building or house number"
          value={form.street}
          onChangeText={(street) => update({ street, addressId: undefined })}
          onBlur={() => markTouched('street')}
          error={streetError}
          placeholder="e.g. Plot 14, Ntinda Road"
          returnKeyType="next"
          textContentType="streetAddressLine1"
        />

        <Input
          label="Landmark or directions"
          helper="e.g. Near Shell petrol station, blue gate"
          value={form.landmark}
          onChangeText={(landmark) => update({ landmark })}
          multiline
          numberOfLines={2}
          textAlignVertical="top"
        />

        <Input
          label="Access instructions (optional)"
          value={form.access}
          onChangeText={(access) => update({ access })}
          placeholder="e.g. Gate code 2468, call when you arrive"
          returnKeyType="done"
        />

        <View style={styles.group}>
          <Text style={styles.label} maxFontSizeMultiplier={1.3}>
            Contact details
          </Text>
          <Input
            label="Name"
            value={form.contactName}
            onChangeText={(contactName) => update({ contactName })}
            onBlur={() => markTouched('name')}
            error={nameError}
            autoCapitalize="words"
            textContentType="name"
            returnKeyType="next"
          />
          <Input
            label="Phone"
            prefix="+256"
            value={form.contactPhone}
            onChangeText={(value) => update({ contactPhone: phoneDigits(value) })}
            onBlur={() => markTouched('phone')}
            error={phoneError}
            helper="We call this number if the cleaner cannot find you."
            keyboardType="phone-pad"
            maxLength={9}
            textContentType="telephoneNumber"
            returnKeyType="done"
          />
        </View>

        <View style={styles.group}>
          <Checkbox
            checked={form.otherPerson}
            onChange={(otherPerson) => update({ otherPerson })}
            label="Someone else will be home"
          />
          {form.otherPerson ? (
            <View style={styles.otherFields}>
              <Input
                label="Their name"
                value={form.alternateName}
                onChangeText={(alternateName) => update({ alternateName })}
                onBlur={() => markTouched('alternateName')}
                error={alternateNameError}
                autoCapitalize="words"
                returnKeyType="next"
              />
              <Input
                label="Their phone"
                prefix="+256"
                value={form.alternatePhone}
                onChangeText={(value) => update({ alternatePhone: phoneDigits(value) })}
                onBlur={() => markTouched('alternatePhone')}
                error={alternatePhoneError}
                keyboardType="phone-pad"
                maxLength={9}
                returnKeyType="done"
              />
            </View>
          ) : null}
        </View>

        {!areaName ? (
          <View style={styles.warning}>
            <Text style={styles.warningText} maxFontSizeMultiplier={1.3}>
              Choose an area to continue. We only serve the areas listed in the area picker.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <SummaryBar
        caption={form.street ? `${areaName || 'Area'} · ${form.street}` : 'Add your address'}
        total={quote.total}
        actionLabel="Next"
        onPress={onNext}
        disabled={!complete}
      />
    </KeyboardAvoidingView>
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
  content: { padding: space[4], paddingBottom: space[10], gap: space[5] },
  intro: { gap: space[1] },
  title: { ...text.h2 },
  subtitle: { ...text.caption },
  group: { gap: space[3] },
  label: { ...text.h3 },
  flexItem: { flex: 1 },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    padding: space[3],
    borderRadius: radius.input,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  addressCardOn: { borderColor: colors.green500, backgroundColor: colors.green50 },
  addressChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 28,
    paddingHorizontal: space[2],
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  addressChipText: { ...text.caption, fontFamily: font.bodySemi, color: colors.green700 },
  addressText: { ...text.bodyM, flex: 1 },
  addressCheck: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    backgroundColor: colors.green500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addAddress: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.input,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.green500,
  },
  addAddressPressed: { backgroundColor: colors.green50 },
  addAddressText: { ...text.bodyM, fontFamily: font.bodySemi, color: colors.green700 },
  mapCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    padding: space[3],
    borderRadius: radius.card,
    backgroundColor: colors.green50,
  },
  mapPin: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.green500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapBody: { flex: 1, gap: 2 },
  mapTitle: { ...text.bodyM, fontFamily: font.bodySemi, color: colors.green900 },
  mapCaption: { ...text.caption, color: colors.green700 },
  locate: {
    minHeight: 36,
    paddingHorizontal: space[3],
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locateOff: { opacity: 0.6 },
  locateText: { ...text.caption, fontFamily: font.bodySemi, color: colors.green700 },
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
  areaRowPressed: { backgroundColor: colors.green50 },
  areaBody: { flex: 1, gap: 2 },
  areaCaption: { ...text.caption },
  areaValue: { ...text.bodyM, fontFamily: font.bodySemi },
  areaValueEmpty: { color: colors.placeholder },
  otherFields: { gap: space[3], marginTop: space[2] },
  warning: {
    borderRadius: radius.input,
    padding: space[3],
    backgroundColor: colors.warningBg,
  },
  warningText: { ...text.caption, color: colors.text },
});
