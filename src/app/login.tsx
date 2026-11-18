import { Mail } from 'lucide-react-native';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { AuthScreen } from '@/components/auth/auth-screen';
import { GlassInput } from '@/components/auth/glass-input';
import { OrDivider } from '@/components/auth/or-divider';
import { PillButton } from '@/components/auth/pill-button';
import { SocialButton } from '@/components/auth/social-button';
import { Checkbox } from '@/components/ui/checkbox';
import { login, requestOtp } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { startSession } from '@/store/session';
import { auth, authSize, font } from '@/theme';
import { isPhoneOrEmail, isStrongEnoughPassword, normalisePhone } from '@/utils/validation';

type Errors = { identifier?: string; password?: string };

export default function LoginScreen() {
  const reducedMotion = useReducedMotion();
  const [shake] = useState(() => new Animated.Value(0));
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const submitted = useRef(false);

  const phoneLike = identifier.trim().length > 0 && /^\+?[\d\s]+$/.test(identifier.trim());

  const shakeCard = () => {
    if (reducedMotion) return;
    shake.setValue(0);
    Animated.sequence([
      Animated.timing(shake, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const validate = (): boolean => {
    const next: Errors = {};
    if (!isPhoneOrEmail(identifier)) {
      next.identifier = 'Enter a valid phone number or email';
    }
    if (!isStrongEnoughPassword(password)) {
      next.password = 'Password must be at least 8 characters';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const logIn = async () => {
    if (loading || submitted.current) return;
    if (!validate()) {
      shakeCard();
      return;
    }
    submitted.current = true;
    setLoading(true);
    try {
      const session = await login({ identifier: identifier.trim(), password });
      await startSession(session);
      router.replace('/welcome-back');
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Could not sign in. Check your details and try again.';
      setErrors((current) => ({ ...current, password: message }));
      shakeCard();
    } finally {
      setLoading(false);
      submitted.current = false;
    }
  };

  const loginWithCode = async () => {
    if (!isPhoneOrEmail(identifier) || !/^\d+$/.test(identifier.replace(/\D/g, ''))) {
      setErrors((current) => ({
        ...current,
        identifier: 'Enter your phone number to get a code by SMS',
      }));
      shakeCard();
      return;
    }
    const phone = normalisePhone(identifier);
    try {
      await requestOtp({ phone });
      router.push({ pathname: '/otp', params: { phone } });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Could not send the code. Try again.';
      setErrors((current) => ({ ...current, identifier: message }));
      shakeCard();
    }
  };

  return (
    <AuthScreen
      blobs={['topRight']}
      loading={loading}
      contentTop={84}
      footer={
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Create account"
          onPress={() => router.push('/sign-up')}
          style={styles.footer}>
          <Text style={styles.footerText} maxFontSizeMultiplier={1.3}>
            Don&apos;t have an account? <Text style={styles.accentLink}>Sign up</Text>
          </Text>
        </Pressable>
      }>
      <Text style={styles.hey} maxFontSizeMultiplier={1.3}>
        Hey,
      </Text>
      <Text style={styles.lets} maxFontSizeMultiplier={1.3}>
        Let&apos;s Sign In!
      </Text>

      <Animated.View style={[styles.form, { transform: [{ translateX: shake }] }]}>
        <GlassInput
          value={identifier}
          onChangeText={(value) => {
            setIdentifier(value);
            setErrors((current) => ({ ...current, identifier: undefined }));
          }}
          placeholder="Email or Phone"
          icon={Mail}
          prefix={phoneLike ? '+256' : undefined}
          keyboardType={phoneLike ? 'phone-pad' : 'email-address'}
          autoCapitalize="none"
          autoComplete="username"
          textContentType="username"
          returnKeyType="next"
          error={errors.identifier}
        />

        <GlassInput
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            setErrors((current) => ({ ...current, password: undefined }));
          }}
          placeholder="Password"
          secure
          autoCapitalize="none"
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="done"
          onSubmitEditing={logIn}
          error={errors.password}
        />

        <View style={styles.optionsRow}>
          <Checkbox
            tone="onColor"
            compact
            checked={remember}
            onChange={setRemember}
            label="Remember me"
          />
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Forgot password"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 0 }}
            onPress={() => router.push('/forgot-password')}>
            <Text style={styles.forgot} maxFontSizeMultiplier={1.3}>
              Forgot Password?
            </Text>
          </Pressable>
        </View>
      </Animated.View>

      <PillButton label="Login" onPress={logIn} style={styles.primary} />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Use SMS code"
        hitSlop={8}
        onPress={loginWithCode}
        style={styles.smsLink}>
        <Text style={styles.smsLabel} maxFontSizeMultiplier={1.3}>
          Use SMS code
        </Text>
      </Pressable>

      <OrDivider label="Or Login With" style={styles.divider} />

      <SocialButton
        label="Login With Google"
        onPress={() =>
          Alert.alert('Google sign-in', 'Google sign-in is connected with the auth API in a later phase.')
        }
        style={styles.social}
      />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  hey: {
    fontFamily: font.poppinsBold,
    fontSize: 28,
    lineHeight: 34,
    color: auth.text,
  },
  lets: {
    marginTop: 4,
    fontFamily: font.poppinsSemi,
    fontSize: 22,
    lineHeight: 28,
    color: auth.textSoft,
  },
  form: { marginTop: 28, gap: authSize.gap },
  optionsRow: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  forgot: {
    fontFamily: font.poppins,
    fontSize: 12,
    lineHeight: 18,
    color: auth.text,
  },
  primary: { marginTop: 20 },
  smsLink: {
    height: 32,
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smsLabel: {
    fontFamily: font.poppins,
    fontSize: 12,
    lineHeight: 18,
    color: auth.text,
    textDecorationLine: 'underline',
  },
  divider: { marginTop: 16 },
  social: { marginTop: 16 },
  footer: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  footerText: {
    fontFamily: font.poppins,
    fontSize: 12,
    lineHeight: 18,
    color: auth.textSoft,
  },
  accentLink: {
    fontFamily: font.poppinsSemi,
    color: auth.accent,
  },
});
