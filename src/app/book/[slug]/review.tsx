import { router, useLocalSearchParams } from 'expo-router';
import {
  Banknote,
  Check,
  CreditCard,
  Smartphone,
  Tag,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
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

import { slotLabel } from '@/components/booking/slot-chips';
import { SelectableCard } from '@/components/booking/selectable-card';
import { StepperHeader } from '@/components/booking/stepper-header';
import { SummaryBar } from '@/components/booking/summary-bar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { TopBar } from '@/components/ui/top-bar';
import { addOns } from '@/config/add-ons';
import {
  isValidDeposit,
  minimumDeposit,
  savedCardById,
  savedCards,
  savedCardLabel,
} from '@/config/payments';
import { hourlyRate, pricing } from '@/config/pricing';
import { serviceBySlug } from '@/config/services';
import { createBooking } from '@/lib/api/bookings';
import {
  price,
  type BookingPayment,
  type PaymentMethod,
  type PaymentPlan,
} from '@/lib/pricing';
import {
  getBookingDraft,
  patchDraft,
  resetDraft,
  setPromoCode,
  startDraft,
  useBookingDraft,
} from '@/store/booking';
import { useAuthUser } from '@/store/session';
import { chip, colors, font, radius, selectable, space, text } from '@/theme';
import { ugx } from '@/utils/format';

type DepositMode = '30' | '50' | 'custom';

type MethodInfo = {
  label: string;
  icon: LucideIcon;
  tile: string;
  iconColor: string;
  subline: string;
};

const methodInfo: Record<PaymentMethod, MethodInfo> = {
  mtn_momo: {
    label: 'MTN Mobile Money',
    icon: Smartphone,
    tile: '#FFCC00',
    iconColor: colors.green900,
    subline: 'Approve the prompt on your phone',
  },
  airtel_money: {
    label: 'Airtel Money',
    icon: Smartphone,
    tile: colors.surface,
    iconColor: colors.error,
    subline: 'Approve the prompt on your phone',
  },
  visa_card: {
    label: 'Visa card',
    icon: CreditCard,
    tile: colors.surface,
    iconColor: colors.green900,
    subline: 'Secure hosted card page',
  },
  cash: {
    label: 'Cash',
    icon: Banknote,
    tile: colors.green50,
    iconColor: colors.green700,
    subline: 'Pay your cleaner on the day',
  },
};

const payNowMethods = ['mtn_momo', 'airtel_money', 'visa_card'] as const;
const balanceMethods = ['mtn_momo', 'airtel_money', 'visa_card', 'cash'] as const;

const promoRates: Record<string, { rate: number } | undefined> = pricing.promos;

const phoneDigits = (value?: string): string =>
  (value ?? '').replace(/\D/g, '').replace(/^256/, '').replace(/^0/, '').slice(0, 9);

const isValidPhone = (digits: string): boolean => /^7\d{8}$/.test(digits);

const parseISODate = (iso: string): Date => {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const frequencyLabel = (frequency: string): string =>
  ({
    once: 'One time',
    weekly: 'Weekly',
    severalPerWeek: 'Several times a week',
    monthly: 'Monthly',
  })[frequency] ?? frequency;

const editRoutes = {
  details: '/book/[slug]/details',
  'add-ons': '/book/[slug]/add-ons',
  schedule: '/book/[slug]/schedule',
  location: '/book/[slug]/location',
} as const;

type EditTarget = keyof typeof editRoutes;

function Section({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      {title ? (
        <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.3}>
          {title}
        </Text>
      ) : null}
      {children}
    </View>
  );
}

function SummaryRow({
  label,
  value,
  editLabel,
  onEdit,
}: {
  label: string;
  value: string;
  editLabel: string;
  onEdit: () => void;
}) {
  return (
    <View style={styles.summaryRow}>
      <View style={styles.summaryBody}>
        <Text style={styles.rowLabel} maxFontSizeMultiplier={1.3}>
          {label}
        </Text>
        <Text style={styles.rowValue} maxFontSizeMultiplier={1.3}>
          {value}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={editLabel}
        hitSlop={8}
        onPress={onEdit}
        style={styles.editButton}>
        <Text style={styles.editText} maxFontSizeMultiplier={1.3}>
          Edit
        </Text>
      </Pressable>
    </View>
  );
}

function PriceRow({
  label,
  amount,
  discount = false,
  strong = false,
}: {
  label: string;
  amount: number;
  discount?: boolean;
  strong?: boolean;
}) {
  return (
    <View style={[styles.priceRow, strong && styles.priceRowStrong]}>
      <Text
        style={[styles.rowLabel, strong && styles.priceTotalLabel]}
        maxFontSizeMultiplier={1.3}>
        {label}
      </Text>
      <Text
        style={[
          styles.priceAmount,
          discount && styles.priceDiscount,
          strong && styles.priceTotal,
        ]}
        maxFontSizeMultiplier={1.2}>
        {discount ? '−' : ''}
        {ugx(amount)}
      </Text>
    </View>
  );
}

function MethodTile({
  method,
  selected,
  subline,
  onPress,
}: {
  method: PaymentMethod;
  selected: boolean;
  subline?: string;
  onPress: () => void;
}) {
  const info = methodInfo[method];
  const Icon = info.icon;
  const caption = subline ?? info.subline;

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={`${info.label}. ${caption}`}
      accessibilityState={{ selected }}
      // RN Web does not map accessibilityState to the DOM, so radios also need aria-checked.
      aria-checked={selected}
      onPress={onPress}
      style={[selectable.card, styles.method, selected && selectable.selected]}>
      <View style={[styles.methodLogo, { backgroundColor: info.tile }]}>
        <Icon size={24} color={info.iconColor} strokeWidth={2} />
      </View>
      <View style={styles.methodBody}>
        <Text style={styles.methodName} maxFontSizeMultiplier={1.3}>
          {info.label}
        </Text>
        <Text style={styles.methodCaption} maxFontSizeMultiplier={1.3}>
          {caption}
        </Text>
      </View>
      {selected ? (
        <View style={styles.methodCheck}>
          <Check size={14} color={colors.surface} strokeWidth={3} />
        </View>
      ) : null}
    </Pressable>
  );
}

/** P12 Review and pay. Reads the whole draft and writes `payment` before P13. */
export default function ReviewScreen() {
  const params = useLocalSearchParams<{ slug?: string }>();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const draft = useBookingDraft();
  const user = useAuthUser();
  const service = serviceBySlug(slug);
  const active = draft && draft.serviceSlug === slug ? draft : null;

  const savedPayment = getBookingDraft()?.payment;
  const [plan, setPlan] = useState<PaymentPlan>(() => savedPayment?.plan ?? 'deposit');
  const [depositMode, setDepositMode] = useState<DepositMode>(() => {
    const saved = getBookingDraft();
    const amount = saved?.payment?.depositAmount;
    if (!saved || !amount || saved.payment?.plan !== 'deposit') return '30';
    const total = price(saved).total;
    if (amount === minimumDeposit(total)) return '30';
    if (amount === Math.ceil(total * 0.5)) return '50';
    return 'custom';
  });
  const [customDeposit, setCustomDeposit] = useState(() => {
    const saved = getBookingDraft();
    const amount = saved?.payment?.depositAmount;
    if (!saved || !amount || saved.payment?.plan !== 'deposit') return '';
    const total = price(saved).total;
    if (amount === minimumDeposit(total) || amount === Math.ceil(total * 0.5)) return '';
    return String(amount);
  });
  const [payNowMethod, setPayNowMethod] = useState<PaymentMethod>(() => {
    const method = getBookingDraft()?.payment?.method;
    return method && method !== 'cash' ? method : 'mtn_momo';
  });
  const [balanceMethod, setBalanceMethod] = useState<PaymentMethod>(() => {
    const payment = getBookingDraft()?.payment;
    return payment?.balanceMethod ?? payment?.method ?? 'mtn_momo';
  });
  const [payerPhone, setPayerPhone] = useState(() =>
    phoneDigits(
      getBookingDraft()?.payment?.payerPhone ||
        getBookingDraft()?.location?.contactPhone ||
        user?.phone,
    ),
  );
  const [saveCard, setSaveCard] = useState(Boolean(savedPayment?.saveCard));
  const [cardChoice, setCardChoice] = useState(() => {
    const id = getBookingDraft()?.payment?.savedCardId;
    return id && savedCardById(id) ? id : (savedCards[0]?.id ?? 'new');
  });
  const [submitting, setSubmitting] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState<string>();
  const [consent, setConsent] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [depositTouched, setDepositTouched] = useState(false);

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
          leave();
        },
      },
      { text: 'Save draft', onPress: leave },
    ]);
  }, [leave]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      confirmClose();
      return true;
    });
    return () => subscription.remove();
  }, [confirmClose]);

  if (!active) return <View style={styles.screen} />;

  const quote = price(active);
  const total = quote.total;
  const minDeposit = minimumDeposit(total);
  const presetDeposit =
    depositMode === '30'
      ? minDeposit
      : depositMode === '50'
        ? Math.ceil(total * 0.5)
        : Math.round(Number(customDeposit) || 0);
  const depositValid = isValidDeposit(total, presetDeposit);
  const dueToday =
    plan === 'full_now' ? total : plan === 'deposit' && depositValid ? presetDeposit : 0;
  const balanceAfter = Math.max(total - dueToday, 0);
  const appliedPromo =
    active.promoCode && promoRates[active.promoCode] ? active.promoCode : undefined;

  const payNowNeedsPhone =
    plan !== 'after_service' &&
    (payNowMethod === 'mtn_momo' || payNowMethod === 'airtel_money');
  const afterNeedsPhone =
    plan !== 'full_now' && (balanceMethod === 'mtn_momo' || balanceMethod === 'airtel_money');
  const phoneValid = isValidPhone(payerPhone);
  const phoneError =
    phoneTouched && (payNowNeedsPhone || afterNeedsPhone) && !phoneValid
      ? 'Enter the 9 digits after +256, for example 772 123 456.'
      : undefined;
  const depositError =
    depositTouched && plan === 'deposit' && !depositValid
      ? `Enter an amount from ${ugx(minDeposit)} up to ${ugx(total - 1_000)}.`
      : undefined;

  const hasSchedule = Boolean(active.schedule);
  const hasLocation = Boolean(active.location);
  const ready =
    hasSchedule &&
    hasLocation &&
    consent &&
    (plan !== 'deposit' || depositValid) &&
    (!payNowNeedsPhone || phoneValid) &&
    (!afterNeedsPhone || phoneValid);

  const scheduleText = active.schedule
    ? `${parseISODate(active.schedule.dateISO).toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      })} · ${slotLabel(active.schedule.startTime)}`
    : 'Not chosen';
  const locationText = active.location
    ? [active.location.area, active.location.street].filter(Boolean).join(' · ')
    : 'Not set';
  const addOnNames = active.addOns
    .map((id) => addOns.find((addOn) => addOn.id === id)?.name)
    .filter(Boolean)
    .join(', ');
  const detailsText = `${active.details.cleaners} cleaner${
    active.details.cleaners === 1 ? '' : 's'
  } · ${active.details.hours} h · ${frequencyLabel(active.details.frequency)}`;
  const methodLabel = methodInfo[balanceMethod].label;
  const selectedCard = savedCardById(cardChoice);

  const infoText =
    plan === 'full_now'
      ? `You'll pay ${ugx(total)} now. Nothing is due after the service.`
      : plan === 'deposit'
        ? balanceMethod === 'cash'
          ? `You'll pay ${ugx(dueToday)} now and ${ugx(balanceAfter)} in cash after the service.`
          : `You'll pay ${ugx(dueToday)} now and ${ugx(balanceAfter)} after the service with ${methodLabel}.`
        : balanceMethod === 'cash'
          ? `You'll pay ${ugx(total)} in cash to your cleaner.`
          : `Nothing is due today. You'll pay ${ugx(total)} after the service with ${methodLabel}.`;

  const edit = (target: EditTarget) => {
    router.push({ pathname: editRoutes[target], params: { slug } });
  };

  const onPlanChange = (next: PaymentPlan) => {
    setPlan(next);
    if (next === 'after_service') setBalanceMethod(payNowMethod);
  };

  const onPayNowMethodChange = (method: PaymentMethod) => {
    setPayNowMethod(method);
    if (balanceMethod === payNowMethod) setBalanceMethod(method);
  };

  const onApplyPromo = () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) {
      setPromoError('Enter a promo code.');
      return;
    }
    if (!promoRates[code]) {
      setPromoError('That code is not valid. Check the spelling and try again.');
      return;
    }
    setPromoError(undefined);
    setPromoCode(code);
    setPromoInput('');
  };

  const onRemovePromo = () => {
    setPromoError(undefined);
    setPromoInput('');
    setPromoCode(undefined);
  };

  const onConfirm = async () => {
    if (submitting || !ready) return;
    setSubmitting(true);
    const payment: BookingPayment = {
      plan,
      method: plan === 'after_service' ? undefined : payNowMethod,
      balanceMethod: plan === 'full_now' ? payNowMethod : balanceMethod,
      payerPhone: payNowNeedsPhone || afterNeedsPhone ? payerPhone : undefined,
      depositAmount: plan === 'deposit' ? presetDeposit : undefined,
      savedCardId:
        payNowMethod === 'visa_card' && plan !== 'after_service' ? selectedCard?.id : undefined,
      saveCard:
        plan !== 'after_service' && payNowMethod === 'visa_card' && !selectedCard
          ? saveCard
          : undefined,
    };
    patchDraft({ payment });

    try {
      const current = getBookingDraft();
      if (!current) return;
      const { bookingId } = await createBooking(current, total);

      if (dueToday > 0) {
        router.push({
          pathname: '/payment/[id]',
          params: {
            id: bookingId,
            bookingId,
            slug,
            amount: String(dueToday),
            method: payNowMethod,
            phone: payerPhone,
            last4: selectedCard?.last4 ?? 'new',
          },
        });
      } else {
        router.push({
          pathname: '/book/[slug]/confirmed',
          params: { slug, bookingId, paid: '0' },
        });
      }
    } catch (cause) {
      Alert.alert(
        'Could not start the booking',
        cause instanceof Error
          ? cause.message
          : 'Check your connection and try again. Your choices are saved.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}>
      <TopBar
        title={service?.name ?? 'Review'}
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
      <StepperHeader current={3} />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <View style={styles.intro}>
          <Text style={styles.title} maxFontSizeMultiplier={1.3}>
            Review and pay
          </Text>
          <Text style={styles.subtitle} maxFontSizeMultiplier={1.3}>
            Check the booking, then choose when to pay.
          </Text>
        </View>

        {!hasSchedule || !hasLocation ? (
          <View style={styles.warning}>
            <Text style={styles.warningText} maxFontSizeMultiplier={1.3}>
              Add a time and an address before confirming this booking.
            </Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} maxFontSizeMultiplier={1.3}>
              {service?.name ?? 'Your booking'}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit job details"
              hitSlop={8}
              onPress={() => edit('details')}
              style={styles.editButton}>
              <Text style={styles.editText} maxFontSizeMultiplier={1.3}>
                Edit
              </Text>
            </Pressable>
          </View>
          <SummaryRow
            label="When"
            value={scheduleText}
            editLabel="Edit date and time"
            onEdit={() => edit('schedule')}
          />
          <SummaryRow
            label="Where"
            value={locationText}
            editLabel="Edit address"
            onEdit={() => edit('location')}
          />
          <SummaryRow
            label="Cleaners and length"
            value={detailsText}
            editLabel="Edit cleaners and length"
            onEdit={() => edit('details')}
          />
          <SummaryRow
            label="Extras"
            value={addOnNames || 'None'}
            editLabel="Edit extras"
            onEdit={() => edit('add-ons')}
          />
        </View>

        <Section title="Promo code">
          {appliedPromo ? (
            <View style={styles.promoApplied}>
              <Tag size={16} color={colors.green700} strokeWidth={2} />
              <Text style={styles.promoAppliedText} maxFontSizeMultiplier={1.3}>
                {appliedPromo} · −{ugx(quote.promoDiscount)}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Remove promo code"
                hitSlop={12}
                onPress={onRemovePromo}
                style={styles.promoRemove}>
                <X size={16} color={colors.green700} strokeWidth={2.5} />
              </Pressable>
            </View>
          ) : (
            <View style={styles.promoRow}>
              <Input
                containerStyle={styles.promoInput}
                accessibilityLabel="Promo code"
                placeholder="Enter a code"
                value={promoInput}
                onChangeText={(value) => {
                  setPromoInput(value);
                  if (promoError) setPromoError(undefined);
                }}
                autoCapitalize="characters"
                autoCorrect={false}
                error={promoError}
                returnKeyType="done"
                onSubmitEditing={onApplyPromo}
              />
              <Button
                label="Apply"
                variant="secondary"
                small
                onPress={onApplyPromo}
                style={styles.apply}
              />
            </View>
          )}
        </Section>

        <View style={styles.card}>
          <Text style={styles.cardTitle} maxFontSizeMultiplier={1.3}>
            Price details
          </Text>
          <PriceRow
            label={`Cleaning · ${active.details.cleaners} × ${active.details.hours} h × ${ugx(
              hourlyRate(active.details.hours),
            )}`}
            amount={quote.base}
          />
          {quote.materials > 0 ? <PriceRow label="Materials" amount={quote.materials} /> : null}
          {quote.addOns > 0 ? <PriceRow label="Add-ons" amount={quote.addOns} /> : null}
          {quote.frequencyDiscount > 0 ? (
            <PriceRow label="Frequency discount" amount={quote.frequencyDiscount} discount />
          ) : null}
          {quote.promoDiscount > 0 ? (
            <PriceRow
              label={`Promo ${appliedPromo ?? ''}`.trim()}
              amount={quote.promoDiscount}
              discount
            />
          ) : null}
          <PriceRow label="VAT (18%)" amount={quote.vat} />
          <View style={styles.divider} />
          <PriceRow label="Total" amount={total} strong />
        </View>

        <Section title="When would you like to pay?">
          <View style={styles.cards}>
            <SelectableCard
              title="Pay in full now"
              subtitle={`${ugx(total)} today`}
              selected={plan === 'full_now'}
              onPress={() => onPlanChange('full_now')}
            />
            <SelectableCard
              title="Pay a deposit now"
              subtitle="Pay part now, the rest after the service"
              selected={plan === 'deposit'}
              onPress={() => onPlanChange('deposit')}
            />
            <SelectableCard
              title="Pay after service"
              subtitle="Nothing today"
              selected={plan === 'after_service'}
              onPress={() => onPlanChange('after_service')}
            />
          </View>
        </Section>

        {plan === 'deposit' ? (
          <View style={styles.deposit}>
            <View style={styles.depositChips}>
              {(
                [
                  { value: '30', label: '30%' },
                  { value: '50', label: '50%' },
                  { value: 'custom', label: 'Custom' },
                ] as const
              ).map((option) => {
                const selected = depositMode === option.value;
                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="radio"
                    accessibilityLabel={`Deposit ${option.label}`}
                    accessibilityState={{ selected }}
                    aria-checked={selected}
                    onPress={() => {
                      setDepositMode(option.value);
                      setDepositTouched(true);
                    }}
                    style={[chip.base, chip.pill, styles.depositChip, selected && chip.selected]}>
                    <Text
                      style={[styles.depositChipText, selected && styles.depositChipTextOn]}
                      maxFontSizeMultiplier={1.3}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {depositMode === 'custom' ? (
              <Input
                label="Deposit amount"
                prefix="UGX"
                value={customDeposit}
                onChangeText={(value) => setCustomDeposit(value.replace(/\D/g, '').slice(0, 7))}
                onBlur={() => setDepositTouched(true)}
                keyboardType="number-pad"
                error={depositError}
                helper={`Between ${ugx(minDeposit)} and ${ugx(total - 1_000)}`}
                returnKeyType="done"
              />
            ) : null}

            <View style={styles.splitBar}>
              <View
                style={[
                  styles.splitFill,
                  { width: `${Math.min(100, Math.max(0, (presetDeposit / total) * 100))}%` },
                ]}
              />
            </View>
            <View style={styles.splitRow}>
              <Text style={styles.rowLabel} maxFontSizeMultiplier={1.3}>
                Pay now
              </Text>
              <Text style={styles.splitAmount} maxFontSizeMultiplier={1.2}>
                {ugx(presetDeposit)}
              </Text>
            </View>
            <View style={styles.splitRow}>
              <Text style={styles.rowLabel} maxFontSizeMultiplier={1.3}>
                Pay after service
              </Text>
              <Text style={styles.splitAmount} maxFontSizeMultiplier={1.2}>
                {ugx(Math.max(total - presetDeposit, 0))}
              </Text>
            </View>

            {!depositValid ? (
              <Text style={styles.errorText} maxFontSizeMultiplier={1.3}>
                Minimum deposit is {ugx(minDeposit)}. Choose 30% or enter a larger amount.
              </Text>
            ) : null}
          </View>
        ) : null}

        {plan !== 'after_service' ? (
          <Section title="Pay now with">
            {payNowMethods.map((method) => (
              <MethodTile
                key={method}
                method={method}
                selected={payNowMethod === method}
                onPress={() => onPayNowMethodChange(method)}
              />
            ))}

            {payNowMethod === 'mtn_momo' || payNowMethod === 'airtel_money' ? (
              <Input
                label="Mobile money number"
                prefix="+256"
                value={payerPhone}
                onChangeText={(value) => setPayerPhone(phoneDigits(value))}
                onBlur={() => setPhoneTouched(true)}
                keyboardType="phone-pad"
                maxLength={9}
                textContentType="telephoneNumber"
                helper="You'll get a prompt on this number."
                error={phoneError}
                returnKeyType="done"
              />
            ) : null}

            {payNowMethod === 'visa_card' ? (
              <View style={styles.detailCard}>
                <Text style={styles.detailText} maxFontSizeMultiplier={1.3}>
                  Card details never touch Gabfix. Saved cards are tokenised by the payment
                  provider.
                </Text>
                <View style={styles.cardList}>
                  {savedCards.map((card) => {
                    const selected = cardChoice === card.id;
                    return (
                      <Pressable
                        key={card.id}
                        accessibilityRole="radio"
                        accessibilityLabel={`${savedCardLabel(card)}, expires ${card.expiry}`}
                        accessibilityState={{ selected }}
                        aria-checked={selected}
                        onPress={() => setCardChoice(card.id)}
                        style={[styles.cardRow, selected && styles.cardRowOn]}>
                        <CreditCard size={20} color={colors.green700} strokeWidth={2} />
                        <View style={styles.cardBody}>
                          <Text style={styles.cardName} maxFontSizeMultiplier={1.3}>
                            Visa •••• {card.last4}
                          </Text>
                          <Text style={styles.cardMeta} maxFontSizeMultiplier={1.2}>
                            Expires {card.expiry}
                          </Text>
                        </View>
                        {selected ? (
                          <Check size={18} color={colors.green700} strokeWidth={2.5} />
                        ) : null}
                      </Pressable>
                    );
                  })}
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityLabel="Use a new card"
                    accessibilityState={{ selected: cardChoice === 'new' }}
                    aria-checked={cardChoice === 'new'}
                    onPress={() => setCardChoice('new')}
                    style={[styles.cardRow, cardChoice === 'new' && styles.cardRowOn]}>
                    <Text style={styles.cardNew} maxFontSizeMultiplier={1.3}>
                      + Use a new card
                    </Text>
                    {cardChoice === 'new' ? (
                      <Check size={18} color={colors.green700} strokeWidth={2.5} />
                    ) : null}
                  </Pressable>
                </View>
                {cardChoice === 'new' ? (
                  <>
                    <Text style={styles.detailText} maxFontSizeMultiplier={1.3}>
                      You&apos;ll enter the card on the secure hosted page at payment.
                    </Text>
                    <Checkbox
                      checked={saveCard}
                      onChange={setSaveCard}
                      label="Save this card for next time"
                    />
                  </>
                ) : (
                  <Text style={styles.helperText} maxFontSizeMultiplier={1.3}>
                    We&apos;ll confirm this payment with a 3-D Secure check.
                  </Text>
                )}
              </View>
            ) : null}
          </Section>
        ) : null}

        {plan !== 'full_now' ? (
          <Section
            title={
              plan === 'deposit'
                ? 'Pay the rest after the service with'
                : 'Pay after the service with'
            }>
            {balanceMethods.map((method) => (
              <MethodTile
                key={method}
                method={method}
                selected={balanceMethod === method}
                subline={
                  method === 'mtn_momo' || method === 'airtel_money'
                    ? payerPhone
                      ? `+256 ${payerPhone.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3')}`
                      : methodInfo[method].subline
                    : undefined
                }
                onPress={() => setBalanceMethod(method)}
              />
            ))}

            {balanceMethod === 'cash' ? (
              <View style={styles.detailCard}>
                <Text style={styles.detailText} maxFontSizeMultiplier={1.3}>
                  Please have {ugx(balanceAfter)} ready for your cleaner. Your cleaner confirms
                  receipt in their app.
                </Text>
              </View>
            ) : null}

            {balanceMethod === 'visa_card' ? (
              <Text style={styles.helperText} maxFontSizeMultiplier={1.3}>
                We&apos;ll open the secure card page when the service is done.
              </Text>
            ) : null}

            {plan === 'after_service' &&
            (balanceMethod === 'mtn_momo' || balanceMethod === 'airtel_money') ? (
              <Input
                label="Mobile money number"
                prefix="+256"
                value={payerPhone}
                onChangeText={(value) => setPayerPhone(phoneDigits(value))}
                onBlur={() => setPhoneTouched(true)}
                keyboardType="phone-pad"
                maxLength={9}
                textContentType="telephoneNumber"
                helper="We'll send the prompt here after the service."
                error={phoneError}
                returnKeyType="done"
              />
            ) : null}

            {plan === 'deposit' &&
            (balanceMethod === 'mtn_momo' || balanceMethod === 'airtel_money') ? (
              <Text style={styles.helperText} maxFontSizeMultiplier={1.3}>
                We&apos;ll use the mobile money number above.
              </Text>
            ) : null}
          </Section>
        ) : null}

        <View style={styles.info}>
          <Text style={styles.infoText} maxFontSizeMultiplier={1.3}>
            {infoText}
          </Text>
        </View>

        <View style={styles.consent}>
          <Checkbox
            checked={consent}
            onChange={setConsent}
            label="I agree to the Terms and the cancellation policy, including any late fee."
          />
          <View style={styles.legalRow}>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Read the Terms"
              hitSlop={8}
              onPress={() => router.push({ pathname: '/policies/[doc]', params: { doc: 'terms' } })}>
              <Text style={styles.legalLink} maxFontSizeMultiplier={1.3}>
                Read the Terms
              </Text>
            </Pressable>
            <Text style={styles.legalDot} maxFontSizeMultiplier={1.3}>
              ·
            </Text>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Payment and refund policy"
              hitSlop={8}
              onPress={() =>
                router.push({ pathname: '/policies/[doc]', params: { doc: 'payments-refunds' } })
              }>
              <Text style={styles.legalLink} maxFontSizeMultiplier={1.3}>
                Payment and refund policy
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <SummaryBar
        caption="Pay now"
        total={dueToday}
        actionLabel={
          submitting
            ? 'Starting…'
            : dueToday > 0
              ? `Pay ${ugx(dueToday)} and confirm`
              : 'Confirm booking'
        }
        onPress={onConfirm}
        disabled={!ready || submitting}
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: space[4],
    gap: space[3],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[3],
  },
  cardTitle: { ...text.h3, flexShrink: 1 },
  section: { gap: space[3] },
  sectionTitle: { ...text.h3 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: space[3], minHeight: 40 },
  summaryBody: { flex: 1, gap: 2 },
  rowLabel: { ...text.caption },
  rowValue: { ...text.bodyM, fontFamily: font.bodySemi, fontSize: 14 },
  editButton: { minHeight: 32, minWidth: 48, alignItems: 'flex-end', justifyContent: 'center' },
  editText: { ...text.caption, color: colors.green700, fontFamily: font.bodySemi },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  promoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space[2] },
  promoInput: { flex: 1 },
  apply: { height: 52, paddingHorizontal: space[4] },
  promoApplied: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    minHeight: 48,
    paddingHorizontal: space[3],
    borderRadius: radius.input,
    backgroundColor: colors.successBg,
  },
  promoAppliedText: {
    ...text.bodyM,
    fontFamily: font.bodySemi,
    color: colors.green700,
    flex: 1,
    fontSize: 14,
  },
  promoRemove: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[3],
    minHeight: 28,
  },
  priceRowStrong: { minHeight: 36 },
  priceAmount: {
    ...text.bodyM,
    fontFamily: font.bodySemi,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
  priceDiscount: { color: colors.success },
  priceTotalLabel: { ...text.bodyM, fontFamily: font.bodySemi, fontSize: 15 },
  priceTotal: {
    fontFamily: font.poppinsBold,
    fontSize: 20,
    lineHeight: 26,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  cards: { gap: space[3] },
  deposit: { gap: space[3] },
  depositChips: { flexDirection: 'row', gap: space[2] },
  depositChip: { flex: 1 },
  depositChipText: { ...text.bodyM, fontFamily: font.bodySemi, fontSize: 14 },
  depositChipTextOn: { color: colors.surface },
  splitBar: {
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.green100,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  splitFill: { height: 10, borderRadius: 5, backgroundColor: colors.green500 },
  splitRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  splitAmount: {
    ...text.bodyM,
    fontFamily: font.bodySemi,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
  errorText: { ...text.caption, color: colors.error },
  method: {
    alignItems: 'center',
    padding: space[3],
    gap: space[3],
    minHeight: 64,
  },
  methodLogo: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodBody: { flex: 1, gap: 2 },
  methodName: { ...text.bodyM, fontFamily: font.bodySemi, fontSize: 15 },
  methodCaption: { ...text.caption },
  methodCheck: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    backgroundColor: colors.green500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailCard: {
    borderRadius: radius.input,
    backgroundColor: colors.green50,
    padding: space[3],
    gap: space[2],
  },
  detailText: { ...text.caption, color: colors.green900 },
  cardList: { gap: space[2] },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    minHeight: 56,
    paddingHorizontal: space[3],
    paddingVertical: space[2],
    borderRadius: radius.input,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  cardRowOn: { borderColor: colors.green500, backgroundColor: colors.surface },
  cardBody: { flex: 1, gap: 2 },
  cardName: { ...text.bodyM, fontFamily: font.bodySemi, fontSize: 14 },
  cardMeta: { ...text.caption },
  cardNew: { ...text.bodyM, fontFamily: font.bodySemi, color: colors.green700, flex: 1 },
  helperText: { ...text.caption },
  info: {
    borderRadius: radius.input,
    backgroundColor: colors.infoBg,
    padding: space[3],
  },
  infoText: { ...text.caption, color: colors.text },
  warning: {
    borderRadius: radius.input,
    backgroundColor: colors.warningBg,
    padding: space[3],
  },
  warningText: { ...text.caption, color: colors.text },
  consent: { gap: space[2] },
  legalRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  legalLink: {
    ...text.caption,
    color: colors.green700,
    fontFamily: font.bodySemi,
    textDecorationLine: 'underline',
  },
  legalDot: { ...text.caption },
});
