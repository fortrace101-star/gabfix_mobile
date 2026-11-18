import { CircleAlert } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthScreen } from '@/components/auth/auth-screen';
import { PillButton } from '@/components/auth/pill-button';
import { CodeInput } from '@/components/ui/code-input';
import { verifyOtp, requestOtp } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { startSession } from '@/store/session';
import { auth, font } from '@/theme';
import { maskPhone } from '@/utils/format';
import { errorHaptic, successHaptic } from '@/utils/haptics';

const RESEND_SECONDS = 30;

export default function OtpScreen() {
  const { phone: phoneParam } = useLocalSearchParams<{ phone?: string }>();
  const phone = typeof phoneParam === 'string' ? phoneParam : '';
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const submitted = useRef(false);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [seconds]);

  const verify = async (value = code) => {
    if (value.length !== 6 || loading || submitted.current) return;
    submitted.current = true;
    setLoading(true);
    setError(null);
    try {
      const session = await verifyOtp({ phone, code: value });
      await startSession(session);
      successHaptic();
      router.replace({ pathname: '/area-select', params: { next: '/home', firstRun: '1' } });
    } catch (err) {
      submitted.current = false;
      const message =
        err instanceof ApiError ? err.message : "That code isn't right. Check the SMS and try again.";
      setError(message);
      errorHaptic();
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    try {
      if (phone) await requestOtp({ phone });
      setSeconds(RESEND_SECONDS);
      setCode('');
      setError(null);
      submitted.current = false;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not resend the code. Try again.';
      setError(message);
      errorHaptic();
    }
  };

  return (
    <AuthScreen
      blobs={['topRight']}
      showBack
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/login'))}
      contentTop={40}
      loading={loading}>
      <Text accessibilityRole="header" style={styles.title} maxFontSizeMultiplier={1.3}>
        Verify Your Number
      </Text>
      <Text style={styles.subtitle} maxFontSizeMultiplier={1.3}>
        We sent a 6-digit code to{' '}
        <Text style={styles.phone}>{phone ? maskPhone(phone) : '+256 7•• ••• •••'}</Text>. It
        expires in 10 minutes.
      </Text>

      <View style={styles.code}>
        <CodeInput
          variant="glass"
          code={code}
          onChange={(value) => {
            setCode(value);
            if (error) setError(null);
            if (value.length < 6) submitted.current = false;
          }}
          onComplete={verify}
          error={Boolean(error)}
          autoFocus
        />
      </View>

      {error ? (
        <View style={styles.errorRow} accessibilityLiveRegion="polite">
          <CircleAlert size={12} color={auth.error} strokeWidth={2.2} />
          <Text style={styles.error} maxFontSizeMultiplier={1.3}>
            {error}
          </Text>
        </View>
      ) : null}

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
            onPress={resend}>
            <Text style={styles.link} maxFontSizeMultiplier={1.3}>
              Resend code
            </Text>
          </Pressable>
        )}
      </View>

      <PillButton
        label="Verify"
        onPress={() => verify()}
        disabled={code.length !== 6}
        style={styles.primary}
      />

      <Text style={styles.hint} maxFontSizeMultiplier={1.3}>
        Didn&apos;t get the SMS? Check that your number is correct, then resend the code.
      </Text>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
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
  phone: { fontFamily: font.poppinsSemi, color: auth.text },
  code: { marginTop: 28 },
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
  primary: { marginTop: 12 },
  hint: {
    marginTop: 20,
    fontFamily: font.poppins,
    fontSize: 12,
    lineHeight: 18,
    color: auth.textSoft,
    textAlign: 'center',
  },
});
