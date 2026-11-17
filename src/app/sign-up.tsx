import { ChevronRight, MapPin } from 'lucide-react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LogoBadge } from '@/components/brand/logo-badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { TopBar } from '@/components/ui/top-bar';
import { useStatusBarStyle } from '@/hooks/use-status-bar-style';
import { colors, font, input, radius, space, text } from '@/theme';
import { useOnboardingArea } from '@/store/onboarding';
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
  area?: string;
  terms?: string;
};

const strengthColors = [colors.error, colors.warning, colors.yellow600, colors.success];

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  useStatusBarStyle('light');
  const area = useOnboardingArea();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    if (!area) next.area = 'Choose your area';
    if (!terms) next.terms = 'Accept the Terms and Privacy Policy to continue';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const createAccount = () => {
    if (!validate()) return;
    setLoading(true);
    // Phase 2 UI: registration is mocked until POST /auth/register is available.
    setTimeout(() => {
      setLoading(false);
      router.push({ pathname: '/otp', params: { phone: normalisePhone(phone) } });
    }, 700);
  };

  const showPolicy = (policy: string) =>
    Alert.alert(
      policy,
      `The ${policy.toLowerCase()} page is scheduled for Phase 6. The summary shown at sign-up is the approved launch text.`,
    );

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
            <LogoBadge size={56} />
            <Text style={styles.wordmark}>Gabfix</Text>
          </View>
        </View>

        <View style={[styles.card, { paddingBottom: insets.bottom + space[6] }]}>
          <View style={styles.titleBlock}>
            <Text accessibilityRole="header" style={styles.title}>
              Create your account
            </Text>
            <Text style={styles.subtitle}>Book trusted cleaners across Kampala</Text>
          </View>

          <Input
            label="Full name"
            value={name}
            onChangeText={(value) => {
              setName(value);
              clearError('name');
            }}
            placeholder="Aisha Nakato"
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            error={errors.name}
          />

          <Input
            label="Phone number"
            value={phone}
            onChangeText={(value) => {
              setPhone(value);
              clearError('phone');
            }}
            prefix="+256"
            placeholder="7XX XXX XXX"
            keyboardType="number-pad"
            maxLength={9}
            autoComplete="tel"
            textContentType="telephoneNumber"
            helper="We'll send a 6-digit code to verify this number"
            error={errors.phone}
          />

          <Input
            label="Email (optional)"
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              clearError('email');
            }}
            placeholder="you@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            error={errors.email}
          />

          <View>
            <Input
              label="Password"
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                clearError('password');
              }}
              placeholder="At least 8 characters"
              secure
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              error={errors.password}
            />
            <View style={styles.strengthRow}>
              {[0, 1, 2, 3].map((segment) => (
                <View
                  key={segment}
                  style={[
                    styles.strengthSegment,
                    {
                      backgroundColor:
                        password.length >= 8 && segment < strength.score
                          ? strengthColors[strength.score - 1]
                          : colors.border,
                    },
                  ]}
                />
              ))}
            </View>
            {password.length > 0 ? (
              <Text style={styles.strengthLabel}>Password strength: {strength.label}</Text>
            ) : null}
          </View>

          <View>
            <Text style={input.label}>Area / neighbourhood</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={area ? `Area: ${area.name}, ${area.division}` : 'Choose your area'}
              onPress={() => router.push('/area-select')}
              style={[input.field, errors.area ? input.fieldError : null, styles.areaField]}>
              <MapPin size={20} color={area ? colors.green500 : colors.textMuted} strokeWidth={2} />
              <Text style={[styles.areaText, !area && styles.areaPlaceholder]}>
                {area ? `${area.name}, ${area.division}` : 'Select your area'}
              </Text>
              <ChevronRight size={20} color={colors.textMuted} strokeWidth={2} />
            </Pressable>
            {errors.area ? (
              <Text style={[input.error, styles.areaError]} accessibilityLiveRegion="polite">
                {errors.area}
              </Text>
            ) : null}
          </View>

          <Checkbox
            checked={terms}
            onChange={(checked) => {
              setTerms(checked);
              clearError('terms');
            }}
            error={errors.terms}
            accessibilityLabel="I agree to the Terms and Privacy Policy"
            label={
              <Text style={styles.termsText}>
                I agree to the{' '}
                <Text
                  accessibilityRole="link"
                  onPress={() => showPolicy('Terms')}
                  style={styles.termsLink}>
                  Terms
                </Text>{' '}
                and{' '}
                <Text
                  accessibilityRole="link"
                  onPress={() => showPolicy('Privacy Policy')}
                  style={styles.termsLink}>
                  Privacy Policy
                </Text>
              </Text>
            }
          />

          <Button label="Create account" onPress={createAccount} loading={loading} />

          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Log in"
            onPress={() => router.push('/login')}
            style={styles.footer}>
            <Text style={styles.footerText}>
              Already have an account? <Text style={styles.link}>Log in</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.green500 },
  scroll: { flexGrow: 1 },
  header: {
    minHeight: 200,
    backgroundColor: colors.green500,
  },
  brand: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
    paddingBottom: space[5],
  },
  wordmark: { fontFamily: font.headingSemi, fontSize: 20, color: colors.surface },
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
  strengthRow: { flexDirection: 'row', gap: 4, marginTop: space[2] },
  strengthSegment: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { ...text.caption, marginTop: space[1] },
  areaField: { justifyContent: 'flex-start' },
  areaText: { ...text.body, flex: 1, color: colors.text },
  areaPlaceholder: { color: colors.placeholder },
  areaError: { marginTop: 6 },
  termsText: { ...text.body, color: colors.textMuted },
  termsLink: { fontFamily: font.bodySemi, color: colors.green500 },
  link: { fontFamily: font.bodySemi, color: colors.green500 },
  footer: { alignItems: 'center', justifyContent: 'center', minHeight: 48, marginTop: 'auto' },
  footerText: { ...text.body, color: colors.textMuted },
});
