import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { CodeInput } from '@/components/ui/code-input';
import { TopBar } from '@/components/ui/top-bar';
import { useStatusBarStyle } from '@/hooks/use-status-bar-style';
import { colors, font, radius, space, text } from '@/theme';
import { maskPhone } from '@/utils/format';
import { errorHaptic, successHaptic } from '@/utils/haptics';

const RESEND_SECONDS = 30;

export default function OtpScreen() {
  const insets = useSafeAreaInsets();
  useStatusBarStyle('dark');
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

  const verify = (value = code) => {
    if (value.length !== 6 || loading || submitted.current) return;
    submitted.current = true;
    setLoading(true);
    setError(null);

    // Phase 2 UI: OTP verification is mocked until POST /auth/otp/verify is available.
    setTimeout(() => {
      setLoading(false);
      if (value === '000000') {
        submitted.current = false;
        setError("That code isn't right. Check the SMS and try again.");
        errorHaptic();
        return;
      }
      successHaptic();
      router.replace({ pathname: '/area-select', params: { next: '/home', firstRun: '1' } });
    }, 700);
  };

  const resend = () => {
    setSeconds(RESEND_SECONDS);
    setCode('');
    setError(null);
    submitted.current = false;
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <TopBar />
      <View style={styles.content}>
        <View style={styles.titleBlock}>
          <Text accessibilityRole="header" style={styles.title}>
            Verify your number
          </Text>
          <Text style={styles.subtitle}>
            We sent a 6-digit code to{' '}
            <Text style={styles.phone}>{phone ? maskPhone(phone) : '+256 7•• ••• •••'}</Text>. It
            expires in 10 minutes.
          </Text>
        </View>

        <CodeInput
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

        {error ? (
          <Text style={styles.error} accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : null}

        <View style={styles.resendRow}>
          {seconds > 0 ? (
            <Text style={styles.resendMuted}>
              Resend code in 0:{seconds.toString().padStart(2, '0')}
            </Text>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Resend code"
              hitSlop={12}
              onPress={resend}>
              <Text style={styles.resendLink}>Resend code</Text>
            </Pressable>
          )}
        </View>

        <Button
          label="Verify"
          onPress={() => verify()}
          loading={loading}
          disabled={code.length !== 6}
          style={styles.verify}
        />

        <Text style={styles.hint}>
          Didn&apos;t get the SMS? Check that your number is correct, then resend the code.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, paddingHorizontal: space[6], paddingTop: space[4], gap: space[6] },
  titleBlock: { gap: space[2] },
  title: { ...text.h1 },
  subtitle: { ...text.bodyL, color: colors.textMuted },
  phone: { fontFamily: font.bodySemi, color: colors.text },
  error: { ...text.bodyM, color: colors.error, marginTop: -space[4] },
  resendRow: { minHeight: 32, justifyContent: 'center' },
  resendMuted: { ...text.bodyM, color: colors.textMuted },
  resendLink: { ...text.bodyM, fontFamily: font.bodySemi, color: colors.green500 },
  verify: { marginTop: space[2] },
  hint: {
    ...text.caption,
    backgroundColor: colors.infoBg,
    color: colors.info,
    padding: space[3],
    borderRadius: radius.input,
  },
});
