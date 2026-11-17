import { Apple } from 'lucide-react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LogoBadge } from '@/components/brand/logo-badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { TopBar } from '@/components/ui/top-bar';
import { useStatusBarStyle } from '@/hooks/use-status-bar-style';
import { colors, font, radius, space, text } from '@/theme';
import { isPhoneOrEmail, isStrongEnoughPassword, normalisePhone } from '@/utils/validation';

type Errors = { identifier?: string; password?: string };

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  useStatusBarStyle('light');
  const reducedMotion = useReducedMotion();
  const [shake] = useState(() => new Animated.Value(0));
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

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

  const logIn = () => {
    if (!validate()) {
      shakeCard();
      return;
    }
    setLoading(true);
    // Phase 2 UI: the auth API is not connected yet, so a validated form opens the app shell.
    setTimeout(() => {
      setLoading(false);
      router.replace('/home');
    }, 700);
  };

  const loginWithCode = () => {
    if (!isPhoneOrEmail(identifier) || !/^\d+$/.test(identifier.replace(/\D/g, ''))) {
      setErrors((current) => ({
        ...current,
        identifier: 'Enter your phone number to get a code by SMS',
      }));
      shakeCard();
      return;
    }
    router.push({ pathname: '/otp', params: { phone: normalisePhone(identifier) } });
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        bounces={false}
        showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TopBar onGreen />
          <View style={styles.brand}>
            <LogoBadge size={64} />
            <Text style={styles.wordmark}>Gabfix</Text>
          </View>
        </View>

        <Animated.View
          style={[
            styles.card,
            { paddingBottom: insets.bottom + space[6], transform: [{ translateX: shake }] },
          ]}>
          <View style={styles.titleBlock}>
            <Text accessibilityRole="header" style={styles.title}>
              Welcome back
            </Text>
            <Text style={styles.subtitle}>Log in to manage your bookings</Text>
          </View>

          <Input
            label="Phone number or email"
            value={identifier}
            onChangeText={(value) => {
              setIdentifier(value);
              setErrors((current) => ({ ...current, identifier: undefined }));
            }}
            prefix={phoneLike ? '+256' : undefined}
            placeholder="7XX XXX XXX or you@email.com"
            keyboardType={phoneLike ? 'phone-pad' : 'email-address'}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username"
            textContentType="username"
            returnKeyType="next"
            error={errors.identifier}
          />

          <Input
            label="Password"
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              setErrors((current) => ({ ...current, password: undefined }));
            }}
            placeholder="Your password"
            secure
            autoCapitalize="none"
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="done"
            onSubmitEditing={logIn}
            error={errors.password}
          />

          <View style={styles.optionsRow}>
            <Checkbox checked={remember} onChange={setRemember} label="Remember me" />
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Forgot password"
              hitSlop={12}
              onPress={() => router.push('/forgot-password')}>
              <Text style={styles.link}>Forgot password?</Text>
            </Pressable>
          </View>

          <Button label="Log in" onPress={logIn} loading={loading} />

          <Button
            label="Log in with a code via SMS"
            variant="secondary"
            onPress={loginWithCode}
          />

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerLabel}>or continue with</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.socialRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Continue with Google"
              onPress={() =>
                Alert.alert('Google sign-in', 'Google sign-in is connected with the auth API in a later phase.')
              }
              style={({ pressed }) => [styles.socialButton, pressed && styles.pressed]}>
              <Text style={styles.googleGlyph}>G</Text>
              <Text style={styles.socialLabel}>Google</Text>
            </Pressable>
            {Platform.OS === 'ios' ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Continue with Apple"
                onPress={() =>
                  Alert.alert('Apple sign-in', 'Apple sign-in is connected with the auth API in a later phase.')
                }
                style={({ pressed }) => [styles.socialButton, pressed && styles.pressed]}>
                <Apple size={20} color={colors.text} strokeWidth={2} />
                <Text style={styles.socialLabel}>Apple</Text>
              </Pressable>
            ) : null}
          </View>

          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Create account"
            onPress={() => router.push('/sign-up')}
            style={styles.footer}>
            <Text style={styles.footerText}>
              New to Gabfix? <Text style={styles.link}>Create account</Text>
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.green500 },
  scroll: { flexGrow: 1 },
  header: {
    minHeight: 230,
    backgroundColor: colors.green500,
  },
  brand: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
    paddingBottom: space[6],
  },
  wordmark: { fontFamily: font.headingSemi, fontSize: 22, color: colors.surface },
  card: {
    flexGrow: 1,
    marginTop: -40,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    padding: space[6],
    gap: space[4],
  },
  titleBlock: { gap: space[1], marginBottom: space[1] },
  title: { ...text.h1 },
  subtitle: { ...text.body, color: colors.textMuted },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[3],
    marginTop: -space[2],
  },
  link: { ...text.bodyM, fontFamily: font.bodySemi, color: colors.green500 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  divider: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  dividerLabel: { ...text.caption },
  socialRow: { flexDirection: 'row', gap: space[3] },
  socialButton: {
    flex: 1,
    height: 52,
    borderRadius: radius.button,
    borderWidth: 1.5,
    borderColor: colors.green500,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
  },
  pressed: { opacity: 0.88 },
  googleGlyph: { fontFamily: font.heading, fontSize: 20, color: '#4285F4' },
  socialLabel: { ...text.button, color: colors.text },
  footer: { alignItems: 'center', justifyContent: 'center', minHeight: 48, marginTop: 'auto' },
  footerText: { ...text.body, color: colors.textMuted },
});
