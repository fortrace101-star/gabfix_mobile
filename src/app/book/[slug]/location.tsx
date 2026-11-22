import { router, useLocalSearchParams, type Href } from 'expo-router';
import * as Location from 'expo-location';
import { Check, Home, MapPin, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AddressSearch } from '@/components/booking/address-search';
import { ChipSelector } from '@/components/booking/chip-selector';
import { StepperHeader } from '@/components/booking/stepper-header';
import { SummaryBar } from '@/components/booking/summary-bar';
import { SummarySheet } from '@/components/booking/summary-sheet';
import { StickyComposer } from '@/components/ui/sticky-composer';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { PermissionCard } from '@/components/ui/permission-card';
import { TopBar } from '@/components/ui/top-bar';
import type { FixturePlace } from '@/config/location-fixtures';
import { serviceBySlug } from '@/config/services';
import { price, type BookingLocation } from '@/lib/pricing';
import { useDraftExit } from '@/lib/use-draft-exit';
import {
  getBookingDraft,
  patchDraft,
  startDraft,
  useBookingDraft,
} from '@/store/booking';
import { useAddresses, type SavedAddress } from '@/store/addresses';
import { useAuthUser } from '@/store/session';
import { colors, font, radius, space, text } from '@/theme';

type PropertyType = BookingLocation['propertyType'];

type Form = {
  addressId?: string;
  lat?: number;
  lng?: number;
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
  const savedAddresses = useAddresses();
  const user = useAuthUser();
  const service = serviceBySlug(slug);
  const active = draft && draft.serviceSlug === slug ? draft : null;

  const [form, setForm] = useState<Form>(() => {
    const saved = getBookingDraft()?.location;
    return {
      addressId: saved?.addressId,
      lat: saved?.lat,
      lng: saved?.lng,
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
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const current = getBookingDraft();
    if (!current || current.serviceSlug !== slug) startDraft(slug);
  }, [slug]);

  // The area is a free-text neighbourhood now (Workstream I); it is never a gate.
  const [locality, setLocality] = useState(() => getBookingDraft()?.location?.area ?? '');
  const [localityEditing, setLocalityEditing] = useState(false);

  const toLocation = (next: Form, nextArea: string): BookingLocation => ({
    addressId: next.addressId,
    area: nextArea,
    lat: next.lat,
    lng: next.lng,
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
    if (getBookingDraft()) patchDraft({ location: toLocation(next, locality) });
  };

  const markTouched = (field: string) => setTouched((current) => ({ ...current, [field]: true }));

  const pickPlace = (place: FixturePlace) => {
    const next: Form = {
      ...form,
      addressId: place.id,
      lat: place.lat,
      lng: place.lng,
      street: place.street,
      landmark: place.landmark ?? '',
      propertyType: place.propertyType ?? form.propertyType,
    };
    const nextLocality = place.area || locality;
    setLocality(nextLocality);
    setForm(next);
    if (getBookingDraft()) {
      patchDraft({ location: toLocation(next, nextLocality) });
    }
  };

  const pickSavedAddress = (address: SavedAddress) => {
    const nextLocality = address.area || locality;
    setLocality(nextLocality);
    const next: Form = {
      ...form,
      addressId: address.id,
      lat: address.lat,
      lng: address.lng,
      street: address.street,
      landmark: address.landmark ?? '',
      access: address.access ?? '',
      propertyType: address.propertyType,
    };
    setForm(next);
    if (getBookingDraft()) {
      patchDraft({ location: toLocation(next, nextLocality) });
    }
  };

  const useTypedAddress = (address: string) => {
    update({ street: address, landmark: '', addressId: undefined, lat: undefined, lng: undefined });
  };

  const { requestExit, sheet } = useDraftExit({ step: 'location' });

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
        setPermissionDenied(true);
        return;
      }
      setPermissionDenied(false);

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const [place] = await Location.reverseGeocodeAsync(position.coords);
      update({
        addressId: undefined,
        lat: position.coords.latitude,
        lng: position.coords.longitude,
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
    if (getBookingDraft()) patchDraft({ location: toLocation(form, locality) });
    router.push({ pathname: '/book/[slug]/review', params: { slug } });
  };

  return (
    <StickyComposer style={styles.screen}>
      <TopBar
        title={service?.name ?? 'Location'}
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
      <StepperHeader current={3} />
      {sheet}

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

        <AddressSearch
          onPick={pickPlace}
          onUseTypedAddress={useTypedAddress}
          onUseCurrentLocation={useCurrentLocation}
          locating={locating}
        />

        {permissionDenied ? (
          <PermissionCard
            title="Location access is off"
            body="Turn it on to fill your street automatically. You can also type your street, landmark and area below."
            onOpenSettings={() => {
              Linking.openSettings().catch(() =>
                Alert.alert('Could not open settings', 'Open Settings and allow location for Gabfix.'),
              );
            }}
          />
        ) : null}

        <View style={styles.group}>
          <View style={styles.groupHeader}>
            <Text style={styles.label} maxFontSizeMultiplier={1.3}>
              Saved addresses
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Manage saved addresses"
              hitSlop={8}
              onPress={() => router.push('/addresses' as Href)}>
              <Text style={styles.manageText} maxFontSizeMultiplier={1.3}>
                Manage
              </Text>
            </Pressable>
          </View>
          {savedAddresses.map((address) => {
            const selected = form.addressId === address.id;
            return (
              <Pressable
                key={address.id}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                aria-checked={selected}
                accessibilityLabel={`${address.label}. ${address.street}`}
                onPress={() => pickSavedAddress(address)}
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
              router.push({ pathname: '/addresses/[id]', params: { id: 'new' } })
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
              {form.street
                ? `${locality ? `${locality} · ` : ''}${form.street.split(',')[0]}`
                : 'Add your address'}
            </Text>
            <Text style={styles.mapCaption} maxFontSizeMultiplier={1.3}>
              Your cleaner will use this address and pin to find you. The pin is confirmed when you
              review the booking.
            </Text>
          </View>
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

        <View style={styles.group}>
          <View style={styles.localityRow}>
            <Text style={styles.label} maxFontSizeMultiplier={1.3}>
              Neighbourhood <Text style={styles.optional}>(optional)</Text>
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={localityEditing ? 'Done editing neighbourhood' : 'Edit neighbourhood'}
              hitSlop={8}
              onPress={() => setLocalityEditing((current) => !current)}>
              <Text style={styles.localityEdit} maxFontSizeMultiplier={1.2}>
                {localityEditing ? 'Done' : 'Edit'}
              </Text>
            </Pressable>
          </View>
          {localityEditing ? (
            <TextInput
              accessibilityLabel="Neighbourhood"
              maxLength={60}
              onChangeText={(value) => {
                setLocality(value);
                if (getBookingDraft()) patchDraft({ location: toLocation(form, value) });
              }}
              placeholder="e.g. Kireka"
              placeholderTextColor={colors.placeholder}
              style={styles.localityInput}
              value={locality}
            />
          ) : (
            <Text style={styles.localityValue} maxFontSizeMultiplier={1.3}>
              {locality || 'Filled in from your address when available'}
            </Text>
          )}
        </View>

        <Input
          label="Street, building or house number"
          value={form.street}
          onChangeText={(street) =>
            update({ street, addressId: undefined, lat: undefined, lng: undefined })
          }
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

      </ScrollView>

      <SummaryBar
        caption={form.street ? `${locality ? `${locality} · ` : ''}${form.street}` : 'Add your address'}
        total={service?.pricingMode === 'quote' ? 0 : quote.total}
        valueLabel={service?.pricingMode === 'quote' ? 'Custom quote' : undefined}
        actionLabel="Next"
        onPress={onNext}
        disabled={!complete}
        onDetailsPress={() => setSummaryOpen(true)}
      />

      <SummarySheet
        draft={active}
        locationLabel={form.street ? `${locality ? `${locality} · ` : ''}${form.street}` : undefined}
        onClose={() => setSummaryOpen(false)}
        serviceName={service?.name}
        visible={summaryOpen}
      />
    </StickyComposer>
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
  groupHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { ...text.h3 },
  manageText: { ...text.bodyM, color: colors.green700, fontFamily: font.bodySemi },
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
  localityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[3],
  },
  localityEdit: { ...text.caption, color: colors.green700, fontFamily: font.bodySemi },
  localityValue: { ...text.bodyM, color: colors.textMuted },
  localityInput: {
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
  optional: { ...text.caption, color: colors.textMuted, fontFamily: font.body },
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
