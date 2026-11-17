import { Check } from 'lucide-react-native';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Animated,
} from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { CodeInput } from '@/components/ui/code-input';
import { Input } from '@/components/ui/input';
import { TopBar } from '@/components/ui/top-bar';
import { useStatusBarStyle } from '@/hooks/use-status-bar-style';
import { colors, duration, font, space, text } from '@/theme';
import { maskPhone } from '@/utils/format';
import { successHaptic } from '@/utils/haptics';
import {
  isPhoneOrEmail,
  isStrongEnoughPassword,
  isValidUGPhone,
  normalisePhone,
} from '@/utils/validation';

type Step = 1 | 2 | 3 | 4;

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  useStatusBarStyle('dark');
  const reducedMotion = useReducedMotion();
  const [fade] = useState(() => new Animated.Value(1));
  const [checkScale] = useState(() => new Animated.Value(0.6));
  const [step, setStep] = useState<Step>(1);
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

  useEffect(() => {
    if (step !== 4 || reducedMotion) return;
    checkScale.setValue(0.6);
    Animated.spring(checkScale, { toValue: 1, useNativeDriver: true, friction: 5 }).start();
  }, [checkScale, reducedMotion, step]);

  const goTo = (next: Step) => {
    if (reducedMotion) {
      setStep(next);
      return;
    }
    Animated.timing(fade, { toValue: 0, duration: duration.fast, useNativeDriver: true }).start(() => {
      setStep(next);
      setError(null);
      Animated.timing(fade, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };

  const sendCode = () => {
    if (!isPhoneOrEmail(identifier)) {
      setError('Enter the phone number or email on your account');
      return;
    }
    setError(null);
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

  const maskedIdentifier = isValidUGPhone(identifier)
    ? maskPhone(normalisePhone(identifier))
    : identifier;

  const back = () => {
    if (step === 2 || step === 3) {
      goTo((step - 1) as Step);
      return;
    }
    if (router.canGoBack()) router.back();
    else router.replace('/login');
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TopBar onBack={back} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + space[6] }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.step, { opacity: fade }]}>
          {step === 1 ? (
            <>
              <View style={styles.titleBlock}>
                <Text accessibilityRole="header" style={styles.title}>
                  Reset your password
                </Text>
                <Text style={styles.subtitle}>
                  Enter the phone number or email on your account and we&apos;ll send a reset code.
                </Text>
              </View>
              <Input
                label="Phone number or email"
                value={identifier}
                onChangeText={(value) => {
                  setIdentifier(value);
                  setError(null);
                }}
                placeholder="7XX XXX XXX or you@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                error={error ?? undefined}
              />
              <Button label="Send code" onPress={sendCode} />
            </>
          ) : null}

          {step === 2 ? (
            <>
              <View style={styles.titleBlock}>
                <Text accessibilityRole="header" style={styles.title}>
                  Enter the code
                </Text>
                <Text style={styles.subtitle}>
                  We sent a 6-digit code to <Text style={styles.strong}>{maskedIdentifier}</Text>.
                </Text>
              </View>
              <CodeInput
                code={code}
                onChange={(value) => {
                  setCode(value);
                  setError(null);
                }}
                onComplete={verifyCode}
                error={Boolean(error)}
                autoFocus
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <View style={styles.resendRow}>
                {seconds > 0 ? (
                  <Text style={styles.muted}>
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
                    <Text style={styles.link}>Resend code</Text>
                  </Pressable>
                )}
              </View>
              <Button label="Verify code" onPress={verifyCode} disabled={code.length !== 6} />
            </>
          ) : null}

          {step === 3 ? (
            <>
              <View style={styles.titleBlock}>
                <Text accessibilityRole="header" style={styles.title}>
                  Choose a new password
                </Text>
                <Text style={styles.subtitle}>Use at least 8 characters you haven&apos;t used before.</Text>
              </View>
              <Input
                label="New password"
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  setError(null);
                }}
                placeholder="At least 8 characters"
                secure
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
              />
              <Input
                label="Confirm new password"
                value={confirm}
                onChangeText={(value) => {
                  setConfirm(value);
                  setError(null);
                }}
                placeholder="Repeat your new password"
                secure
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
                error={error ?? undefined}
              />
              <Button label="Save new password" onPress={savePassword} loading={loading} />
            </>
          ) : null}

          {step === 4 ? (
            <View style={styles.success}>
              <Animated.View style={[styles.checkCircle, { transform: [{ scale: checkScale }] }]}>
                <Check size={56} color={colors.surface} strokeWidth={3} />
              </Animated.View>
              <Text accessibilityRole="header" style={styles.successTitle}>
                Password updated
              </Text>
              <Text style={styles.subtitle}>
                You can now log in with your new password. For your security, other devices have
                been signed out.
              </Text>
              <Button
                label="Back to log in"
                onPress={() => router.replace('/login')}
                style={styles.successButton}
              />
            </View>
          ) : null}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, paddingHorizontal: space[6], paddingTop: space[4] },
  step: { gap: space[5] },
  titleBlock: { gap: space[2] },
  title: { ...text.h1 },
  subtitle: { ...text.bodyL, color: colors.textMuted },
  strong: { color: colors.text, fontFamily: font.bodySemi },
  error: { ...text.bodyM, color: colors.error, marginTop: -space[3] },
  muted: { ...text.bodyM, color: colors.textMuted },
  link: { ...text.bodyM, color: colors.green500, fontWeight: '600' },
  resendRow: { minHeight: 32, justifyContent: 'center', marginTop: -space[3] },
  success: { alignItems: 'center', gap: space[4], paddingTop: space[8] },
  checkCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.green500,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 6,
    borderColor: colors.yellow500,
  },
  successTitle: { ...text.h1, textAlign: 'center' },
  successButton: { alignSelf: 'stretch', marginTop: space[4] },
});
