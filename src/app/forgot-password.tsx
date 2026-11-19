import { Check, CircleAlert, Mail } from 'lucide-react-native';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { AuthScreen } from '@/components/auth/auth-screen';
import { GlassInput } from '@/components/auth/glass-input';
import { PillButton } from '@/components/auth/pill-button';
import { RadioPill } from '@/components/auth/radio-pill';
import { CodeInput } from '@/components/ui/code-input';
import { supportsNativeDriver } from '@/lib/animation';
import { requestOtp } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { auth, duration, font } from '@/theme';
import { maskPhone } from '@/utils/format';
import { successHaptic } from '@/utils/haptics';
import {
  isStrongEnoughPassword,
  isValidEmail,
  isValidUGPhone,
  normalisePhone,
} from '@/utils/validation';

type Step = 1 | 2 | 3 | 4;
type Mode = 'phone' | 'email';

export default function ForgotPasswordScreen() {
  const reducedMotion = useReducedMotion();
  const [fade] = useState(() => new Animated.Value(1));
  const [step, setStep] = useState<Step>(1);
  const [mode, setMode] = useState<Mode>('phone');
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(30);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (step !== 2 || seconds <= 0) return;
    const timer = setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [step, seconds]);

  const goTo = (next: Step) => {
    if (reducedMotion) {
      setStep(next);
      setError(null);
      return;
    }
    Animated.timing(fade, { toValue: 0, duration: duration.fast, useNativeDriver: supportsNativeDriver }).start(
      () => {
        setStep(next);
        setError(null);
        Animated.timing(fade, { toValue: 1, duration: 200, useNativeDriver: supportsNativeDriver }).start();
      },
    );
  };

  const sendCode = async () => {
    const valid = mode === 'phone' ? isValidUGPhone(identifier) : isValidEmail(identifier);
    if (!valid) {
      setError(
        mode === 'phone'
          ? 'Enter your 9-digit phone number'
          : 'Enter the email on your account',
      );
      return;
    }
    setError(null);
    if (mode === 'phone') {
      try {
        await requestOtp({ phone: normalisePhone(identifier) });
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Could not send the code. Try again.');
        return;
      }
    }
    setSeconds(30);
    goTo(2);
  };

  const verifyCode = () => {
    if (code.length !== 6) {
      setError('Enter the 6-digit code');
      return;
    }
    if (code === '000000') {
      setError("That code isn't right. Check your messages and try again.");
      return;
    }
    goTo(3);
  };

  const savePassword = () => {
    if (!isStrongEnoughPassword(password)) {
      setError('Use at least 8 characters');
      return;
    }
    if (password !== confirm) {
      setError('The two passwords do not match');
      return;
    }
    setError(null);
    setLoading(true);
    // Phase 2 UI: reset is mocked until the auth API is available.
    setTimeout(() => {
      setLoading(false);
      successHaptic();
      goTo(4);
    }, 700);
  };

  const back = () => {
    if (step === 2 || step === 3) {
      goTo((step - 1) as Step);
      return;
    }
    if (router.canGoBack()) router.back();
    else router.replace('/login');
  };

  const maskedIdentifier =
    mode === 'phone' && isValidUGPhone(identifier)
      ? maskPhone(normalisePhone(identifier))
      : identifier;

  const errorLine = error ? (
    <View style={styles.errorRow} accessibilityLiveRegion="polite">
      <CircleAlert size={12} color={auth.error} strokeWidth={2.2} />
      <Text style={styles.error} maxFontSizeMultiplier={1.3}>
        {error}
      </Text>
    </View>
  ) : null;

  return (
    <AuthScreen
      blobs={step === 4 ? ['topRight', 'bottomLeft'] : ['topRight']}
      showBack={step === 2 || step === 3}
      onBack={back}
      contentTop={40}
      loading={loading}>
      <Animated.View style={[styles.step, { opacity: fade }]}>
        {step === 1 ? (
          <>
            <Text accessibilityRole="header" style={styles.title} maxFontSizeMultiplier={1.3}>
              Reset Password
            </Text>
            <Text style={styles.subtitle} maxFontSizeMultiplier={1.3}>
              Enter your Email/Phone number below to receive your OTP number.
            </Text>

            <View style={styles.radios} accessibilityRole="radiogroup">
              <RadioPill
                label="Email"
                selected={mode === 'email'}
                onPress={() => {
                  setMode('email');
                  setIdentifier('');
                  setError(null);
                }}
              />
              <RadioPill
                label="Phone"
                selected={mode === 'phone'}
                onPress={() => {
                  setMode('phone');
                  setIdentifier('');
                  setError(null);
                }}
              />
            </View>

            <View style={styles.field}>
              {mode === 'phone' ? (
                <GlassInput
                  value={identifier}
                  onChangeText={(value) => {
                    setIdentifier(value);
                    setError(null);
                  }}
                  placeholder="Phone Number"
                  prefix="+256"
                  keyboardType="number-pad"
                  maxLength={9}
                  accessibilityLabel="Phone Number"
                  error={error ?? undefined}
                />
              ) : (
                <GlassInput
                  value={identifier}
                  onChangeText={(value) => {
                    setIdentifier(value);
                    setError(null);
                  }}
                  placeholder="Email"
                  icon={Mail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
                  accessibilityLabel="Email"
                  error={error ?? undefined}
                />
              )}
            </View>

            <PillButton label="Continue" onPress={sendCode} style={styles.primary} />
          </>
        ) : null}

        {step === 2 ? (
          <>
            <Text accessibilityRole="header" style={styles.title} maxFontSizeMultiplier={1.3}>
              Enter the code
            </Text>
            <Text style={styles.subtitle} maxFontSizeMultiplier={1.3}>
              We sent a 6-digit code to{' '}
              <Text style={styles.strong}>{maskedIdentifier}</Text>.
            </Text>

            <View style={styles.code}>
              <CodeInput
                variant="glass"
                code={code}
                onChange={(value) => {
                  setCode(value);
                  setError(null);
                }}
                onComplete={verifyCode}
                error={Boolean(error)}
                autoFocus
              />
            </View>

            {errorLine}

            <View style={styles.resendRow}>
              {seconds > 0 ? (
                <Text style={styles.muted} maxFontSizeMultiplier={1.3}>
                  Resend code in 0:{seconds.toString().padStart(2, '0')}
                </Text>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Resend code"
                  hitSlop={12}
                  onPress={() => {
                    setSeconds(30);
                    setCode('');
                    setError(null);
                  }}>
                  <Text style={styles.link} maxFontSizeMultiplier={1.3}>
                    Resend code
                  </Text>
                </Pressable>
              )}
            </View>

            <PillButton
              label="Verify"
              onPress={verifyCode}
              disabled={code.length !== 6}
              style={styles.primary}
            />
          </>
        ) : null}

        {step === 3 ? (
          <>
            <Text accessibilityRole="header" style={styles.title} maxFontSizeMultiplier={1.3}>
              Choose a new password
            </Text>
            <Text style={styles.subtitle} maxFontSizeMultiplier={1.3}>
              Use at least 8 characters you haven&apos;t used before.
            </Text>

            <View style={styles.fields}>
              <GlassInput
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  setError(null);
                }}
                placeholder="New Password"
                secure
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
              />
              <GlassInput
                value={confirm}
                onChangeText={(value) => {
                  setConfirm(value);
                  setError(null);
                }}
                placeholder="Confirm Password"
                secure
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
                error={error ?? undefined}
              />
            </View>

            <PillButton label="Save Password" onPress={savePassword} style={styles.primary} />
          </>
        ) : null}

        {step === 4 ? (
          <View style={styles.success}>
            <View style={styles.disc}>
              <Check size={56} color={auth.text} strokeWidth={3} />
            </View>
            <Text accessibilityRole="header" style={styles.successTitle} maxFontSizeMultiplier={1.3}>
              Password Updated
            </Text>
            <Text style={styles.successBody} maxFontSizeMultiplier={1.3}>
              You can now log in with your new password. For your security, other devices have been
              signed out.
            </Text>
            <PillButton
              label="Back To Login"
              onPress={() => router.replace('/login')}
              style={styles.successButton}
            />
          </View>
        ) : null}
      </Animated.View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  step: { gap: 0 },
  title: {
    fontFamily: font.poppinsSemi,
    fontSize: 24,
    lineHeight: 30,
    color: auth.text,
  },
  subtitle: {
    marginTop: 8,
    fontFamily: font.poppins,
    fontSize: 12,
    lineHeight: 18,
    color: auth.textSoft,
  },
  strong: { fontFamily: font.poppinsSemi, color: auth.text },
  radios: { flexDirection: 'row', gap: 24, marginTop: 20 },
  field: { marginTop: 16 },
  fields: { marginTop: 24, gap: 12 },
  primary: { marginTop: 20 },
  code: { marginTop: 24 },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 18,
    marginTop: 6,
    paddingHorizontal: 6,
  },
  error: {
    flexShrink: 1,
    fontFamily: font.poppins,
    fontSize: 12,
    lineHeight: 18,
    color: auth.error,
  },
  resendRow: { minHeight: 32, justifyContent: 'center', marginTop: 8 },
  muted: {
    fontFamily: font.poppins,
    fontSize: 12,
    lineHeight: 18,
    color: auth.textSoft,
  },
  link: {
    fontFamily: font.poppinsSemi,
    fontSize: 12,
    lineHeight: 18,
    color: auth.accent,
  },
  success: { alignItems: 'center', paddingTop: 60 },
  disc: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    marginTop: 28,
    fontFamily: font.poppinsSemi,
    fontSize: 24,
    lineHeight: 30,
    color: auth.text,
    textAlign: 'center',
  },
  successBody: {
    marginTop: 10,
    maxWidth: '85%',
    fontFamily: font.poppins,
    fontSize: 12,
    lineHeight: 18,
    color: auth.textSoft,
    textAlign: 'center',
  },
  successButton: { alignSelf: 'stretch', marginTop: 32 },
});
