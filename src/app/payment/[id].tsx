import { router, useLocalSearchParams } from 'expo-router';
import { CreditCard, Lock, ShieldCheck, Smartphone, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Button } from '@/components/ui/button';
import { TopBar } from '@/components/ui/top-bar';
import { colors, font, radius, space, text } from '@/theme';
import { successHaptic } from '@/utils/haptics';
import { ugx } from '@/utils/format';

const DEMO_APPROVAL_MS = 6_000;

const maskedPhone = (digits: string): string => {
  if (digits.length < 5) return `+256 ${digits}`;
  return `+256 ${digits.slice(0, 2)}• ••• ${digits.slice(-3)}`;
};

/**
 * P13 Payment Authorisation. The real screen polls `GET /payments/{id}`; with no
 * aggregator configured this build simulates the provider prompt and approval so
 * P12 → P13 → P14 can be exercised end to end.
 */
export default function PaymentScreen() {
  const params = useLocalSearchParams<{
    id?: string;
    bookingId?: string;
    slug?: string;
    amount?: string;
    method?: string;
    phone?: string;
    last4?: string;
  }>();
  const bookingId = typeof params.bookingId === 'string' ? params.bookingId : 'GBX-00000';
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const amount = Number(params.amount) || 0;
  const method = typeof params.method === 'string' ? params.method : 'mtn_momo';
  const phone = typeof params.phone === 'string' ? params.phone : '';
  const last4 = typeof params.last4 === 'string' ? params.last4 : 'new';
  const isCard = method === 'visa_card';

  const [approved, setApproved] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(120);
  const [pulse] = useState(() => new Animated.Value(0));
  const [tick] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  useEffect(() => {
    const countdown = setInterval(() => {
      setSecondsLeft((current) => Math.max(current - 1, 0));
    }, 1000);
    const approval = setTimeout(() => {
      setApproved(true);
      successHaptic();
    }, isCard ? DEMO_APPROVAL_MS - 2_000 : DEMO_APPROVAL_MS);

    return () => {
      clearInterval(countdown);
      clearTimeout(approval);
    };
  }, [isCard]);

  useEffect(() => {
    if (!approved) return;
    Animated.spring(tick, { toValue: 1, useNativeDriver: true }).start();
    const next = setTimeout(() => {
      router.replace({
        pathname: '/book/[slug]/confirmed',
        params: { slug, bookingId, paid: String(amount) },
      });
    }, 1600);
    return () => clearTimeout(next);
  }, [approved, amount, bookingId, slug, tick]);

  const stop = () => {
    if (approved) return;
    Alert.alert(
      'Stop this payment?',
      'Your booking is saved. You can start the payment again from the review screen.',
      [
        { text: 'Keep waiting', style: 'cancel' },
        { text: 'Stop', style: 'destructive', onPress: () => router.back() },
      ],
    );
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = String(secondsLeft % 60).padStart(2, '0');

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });

  return (
    <View style={styles.screen}>
      <TopBar
        title="Payment"
        onBack={stop}
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close payment"
            hitSlop={8}
            onPress={stop}
            style={styles.close}>
            <X size={22} color={colors.text} strokeWidth={2} />
          </Pressable>
        }
      />

      <View style={styles.content}>
        {approved ? (
          <>
            <View style={styles.successRing}>
              <Animated.View style={{ transform: [{ scale: tick }] }}>
                <View style={styles.successCircle}>
                  <ShieldCheck size={54} color={colors.surface} strokeWidth={2.4} />
                </View>
              </Animated.View>
            </View>
            <Text style={styles.title} maxFontSizeMultiplier={1.3}>
              Payment approved
            </Text>
            <Text style={styles.body} maxFontSizeMultiplier={1.3}>
              {ugx(amount)} paid. Taking you to your confirmation…
            </Text>
          </>
        ) : (
          <>
            <View style={styles.illustration}>
              <Animated.View
                style={[
                  styles.pulseRing,
                  { transform: [{ scale: ringScale }], opacity: ringOpacity },
                ]}
              />
              <View style={styles.iconCircle}>
                {isCard ? (
                  <CreditCard size={46} color={colors.surface} strokeWidth={2} />
                ) : (
                  <Smartphone size={46} color={colors.surface} strokeWidth={2} />
                )}
              </View>
            </View>

            <Text style={styles.title} maxFontSizeMultiplier={1.3}>
              {isCard ? 'Confirming your card payment…' : 'Approve the payment on your phone'}
            </Text>

            <Text style={styles.body} maxFontSizeMultiplier={1.3}>
              {isCard
                ? `We're confirming ${ugx(amount)} on your ${
                    last4 === 'new' ? 'new Visa card' : `Visa ending ${last4}`
                  }.`
                : `We sent a prompt to ${maskedPhone(phone)} for ${ugx(amount)}.`}
            </Text>

            <Text style={styles.countdown} maxFontSizeMultiplier={1.2}>
              {minutes}:{seconds}
            </Text>

            {isCard ? (
              <View style={styles.steps}>
                <Lock size={18} color={colors.green700} strokeWidth={2} />
                <Text style={styles.stepsText} maxFontSizeMultiplier={1.3}>
                  Your bank may ask you to approve this payment with 3-D Secure. Keep this
                  screen open.
                </Text>
              </View>
            ) : (
              <View style={styles.steps}>
                <Text style={styles.step} maxFontSizeMultiplier={1.3}>
                  1. Check your phone for the prompt
                </Text>
                <Text style={styles.step} maxFontSizeMultiplier={1.3}>
                  2. Enter your mobile money PIN
                </Text>
                <Text style={styles.step} maxFontSizeMultiplier={1.3}>
                  3. Wait here for confirmation
                </Text>
              </View>
            )}

            <View style={styles.demo}>
              <Text style={styles.demoText} maxFontSizeMultiplier={1.3}>
                Demo build: the provider approval is simulated after a few seconds.
              </Text>
            </View>

            <Button label="Use another method" variant="secondary" onPress={() => router.back()} />
            <Text style={styles.helper} maxFontSizeMultiplier={1.3}>
              Booking {bookingId} is saved while you pay.
            </Text>
          </>
        )}
      </View>
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[4],
    paddingHorizontal: space[6],
    paddingBottom: space[8],
  },
  illustration: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: colors.green500,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.green500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successRing: {
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 6,
    borderColor: colors.yellow500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: colors.green500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...text.h2, textAlign: 'center' },
  body: { ...text.bodyM, textAlign: 'center', color: colors.textMuted },
  countdown: {
    fontFamily: font.poppinsSemi,
    fontSize: 22,
    lineHeight: 28,
    color: colors.green700,
    fontVariant: ['tabular-nums'],
  },
  steps: {
    alignSelf: 'stretch',
    gap: space[2],
    padding: space[4],
    borderRadius: radius.card,
    backgroundColor: colors.green50,
  },
  stepsText: { ...text.caption, color: colors.green900 },
  step: { ...text.bodyM, fontSize: 14 },
  demo: {
    alignSelf: 'stretch',
    padding: space[3],
    borderRadius: radius.input,
    backgroundColor: colors.infoBg,
  },
  demoText: { ...text.caption, color: colors.text },
  helper: { ...text.caption, textAlign: 'center' },
});
