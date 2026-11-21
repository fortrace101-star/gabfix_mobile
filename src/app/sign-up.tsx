import { Mail, User } from 'lucide-react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthScreen } from '@/components/auth/auth-screen';
import { GlassInput } from '@/components/auth/glass-input';
import { OrDivider } from '@/components/auth/or-divider';
import { PillButton } from '@/components/auth/pill-button';
import { SocialButton } from '@/components/auth/social-button';
import { Checkbox } from '@/components/ui/checkbox';
import { register, requestOtp } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { setUserName } from '@/store/onboarding';
import { auth, authSize, font } from '@/theme';
import {
  isStrongEnoughPassword,
  isValidEmail,
  isValidUGPhone,
  normalisePhone,
  passwordStrength,
} from '@/utils/validation';

type Errors = {
  name?: string;
  phone?: string;
  email?: string;
  password?: string;
  confirm?: string;
  terms?: string;
};

export default function SignUpScreen() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const strength = passwordStrength(password);

  const clearError = (key: keyof Errors) =>
    setErrors((current) => ({ ...current, [key]: undefined }));

  const validate = (): boolean => {
    const next: Errors = {};
    if (name.trim().length < 2) next.name = 'Enter your full name';
    if (!isValidUGPhone(phone)) next.phone = 'Enter your 9-digit number, for example 7XX XXX XXX';
    if (email.trim().length > 0 && !isValidEmail(email)) next.email = 'Enter a valid email address';
    if (!isStrongEnoughPassword(password)) next.password = 'Use at least 8 characters';
    if (!isStrongEnoughPassword(confirm)) next.confirm = 'Retype your password';
    else if (confirm !== password) next.confirm = 'Passwords do not match';
    if (!terms) next.terms = 'Accept the Terms and Privacy Policy to continue';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const createAccount = async () => {
    if (loading) return;
    if (!validate()) return;
    setLoading(true);
    const phoneNumber = normalisePhone(phone);
    try {
      await register({
        name: name.trim(),
        phone: phoneNumber,
        email: email.trim() || undefined,
        password,
      });
      await requestOtp({ phone: phoneNumber });
      setUserName(name.trim().split(/\s+/)[0]);
      router.push({ pathname: '/otp', params: { phone: phoneNumber } });
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Could not create your account. Try again.';
      setErrors((current) => ({ ...current, terms: message }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen
      blobs={['topCenterLeft']}
      loading={loading}
      contentTop={40}
      footer={
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Log in"
          onPress={() => router.push('/login')}
          style={styles.footer}>
          <Text style={styles.footerText} maxFontSizeMultiplier={1.3}>
            Already have an account? <Text style={styles.accentLink}>Login</Text>
          </Text>
        </Pressable>
      }>
      <Text style={styles.hey} maxFontSizeMultiplier={1.3}>
        Hey,
      </Text>
      <Text style={styles.lets} maxFontSizeMultiplier={1.3}>
        Let&apos;s Sign Up!
      </Text>

      <View style={styles.form}>
        <GlassInput
          value={name}
          onChangeText={(value) => {
            setName(value);
            clearError('name');
          }}
          placeholder="Full Name"
          icon={User}
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          error={errors.name}
        />

        <GlassInput
          value={phone}
          onChangeText={(value) => {
            setPhone(value);
            clearError('phone');
          }}
          placeholder="Phone number"
          prefix="+256"
          keyboardType="number-pad"
          maxLength={9}
          autoComplete="tel"
          textContentType="telephoneNumber"
          helper="We'll send a 6-digit code to verify this number"
          error={errors.phone}
        />

        <GlassInput
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            clearError('email');
          }}
          placeholder="Email (optional)"
          icon={Mail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          error={errors.email}
        />

        <View>
          <GlassInput
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              clearError('password');
            }}
            placeholder="Password"
            secure
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            error={errors.password}
          />
          <View style={styles.strengthRow}>
            {[0, 1, 2, 3].map((segment) => {
              const active = password.length >= 8 && segment < strength.score;
              return (
                <View
                  key={segment}
                  style={[
                    styles.strengthSegment,
                    {
                      backgroundColor: active
                        ? segment >= 2
                          ? auth.accent
                          : auth.text
                        : 'rgba(255,255,255,0.30)',
                    },
                  ]}
                />
              );
            })}
          </View>
          {password.length > 0 ? (
            <Text style={styles.strengthLabel} maxFontSizeMultiplier={1.3}>
              Password strength: {strength.label}
            </Text>
          ) : null}
        </View>

        <GlassInput
          value={confirm}
          onChangeText={(value) => {
            setConfirm(value);
            clearError('confirm');
          }}
          placeholder="Retype Password"
          secure
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          error={errors.confirm}
        />

        <Checkbox
          tone="onColor"
          checked={terms}
          onChange={(checked) => {
            setTerms(checked);
            clearError('terms');
          }}
          error={errors.terms}
          accessibilityLabel="I agree to the Terms and Privacy Policy"
          label={
            <Text style={styles.termsText} maxFontSizeMultiplier={1.3}>
              I agree to the{' '}
              <Text
                accessibilityRole="link"
                onPress={() =>
                  router.push({ pathname: '/policies/[doc]', params: { doc: 'terms' } })
                }
                style={styles.termsLink}>
                Terms
              </Text>{' '}
              and{' '}
              <Text
                accessibilityRole="link"
                onPress={() =>
                  router.push({ pathname: '/policies/[doc]', params: { doc: 'privacy' } })
                }
                style={styles.termsLink}>
                Privacy Policy
              </Text>
            </Text>
          }
        />
      </View>

      <PillButton label="Sign Up" onPress={createAccount} style={styles.primary} />

      <OrDivider label="Or Sign Up With" style={styles.divider} />

      <SocialButton
        label="Sign Up With Google"
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
  form: { marginTop: 24, gap: authSize.gap },
  strengthRow: { flexDirection: 'row', gap: 4, marginTop: 10, paddingHorizontal: 20 },
  strengthSegment: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: {
    marginTop: 6,
    paddingHorizontal: 20,
    fontFamily: font.poppins,
    fontSize: 11,
    lineHeight: 16,
    color: auth.textSoft,
  },
  termsText: {
    fontFamily: font.poppins,
    fontSize: 12,
    lineHeight: 18,
    color: auth.text,
  },
  termsLink: { fontFamily: font.poppinsSemi, color: auth.accent },
  primary: { marginTop: 20 },
  divider: { marginTop: 16 },
  social: { marginTop: 16 },
  footer: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  footerText: {
    fontFamily: font.poppins,
    fontSize: 12,
    lineHeight: 18,
    color: auth.textSoft,
  },
  accentLink: { fontFamily: font.poppinsSemi, color: auth.accent },
});
