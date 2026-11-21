import { router } from 'expo-router';
import { Mail, MessageSquare, ShieldCheck } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { InlineBanner } from '@/components/ui/inline-banner';
import { SettingsGroup, SettingsRow } from '@/components/ui/settings-list';
import { TopBar } from '@/components/ui/top-bar';
import { addLoginEvent } from '@/store/login-activity';
import { setTwoFactor, useSecurity, type TwoFactorMethod } from '@/store/security';
import { colors, radius, space, text } from '@/theme';

type Step = 'method' | 'code' | 'done';
const RESEND_COOLDOWN = 30;
const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 10;
const CODE_TTL_MS = 10 * 60 * 1000;

function randomCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export default function TwoFactorScreen() {
  const security = useSecurity();
  const [step, setStep] = useState<Step>('method');
  const [method, setMethod] = useState<TwoFactorMethod>(security.twoFactor.method ?? 'sms');
  const [code, setCode] = useState('');
  const [sentCode, setSentCode] = useState<string | null>(null);
  const [sentAt, setSentAt] = useState<number | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [lockRemaining, setLockRemaining] = useState(0);
  const [banner, setBanner] = useState<{ variant: 'success' | 'warning' | 'error' | 'info'; message: string } | null>(null);
  const inputRef = useRef<React.ElementRef<typeof TextInput>>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((v) => v - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  useEffect(() => {
    if (!lockedUntil) return;
    const tick = () => {
      const remainingMs = lockedUntil - Date.now();
      const nextLocked = remainingMs > 0;
      setLocked(nextLocked);
      setLockRemaining(nextLocked ? Math.max(1, Math.ceil(remainingMs / 60000)) : 0);
      if (!nextLocked) setLockedUntil(null);
    };
    const id = setTimeout(tick, 0);
    const timer = setInterval(tick, 1000);
    return () => {
      clearTimeout(id);
      clearInterval(timer);
    };
  }, [lockedUntil]);

  const destination = method === 'sms' ? 'your phone number' : 'your email address';

  const sendCode = () => {
    if (locked) return;
    const next = randomCode();
    setSentCode(next);
    setSentAt(Date.now());
    setCooldown(RESEND_COOLDOWN);
    setAttempts(0);
    setStep('code');
    setBanner({ variant: 'info', message: `A 6-digit code was sent to ${destination}. (Demo code: ${next})` });
    setTimeout(() => inputRef.current?.focus(), 150);
  };

  const verify = () => {
    if (locked) {
      setBanner({ variant: 'error', message: `Too many attempts. Try again in ${lockRemaining} minute(s).` });
      return;
    }
    if (!sentCode || !sentAt) return;
    if (Date.now() - sentAt > CODE_TTL_MS) {
      setBanner({ variant: 'error', message: 'This code expired. Request a new code.' });
      return;
    }
    if (code.trim() !== sentCode) {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      if (nextAttempts >= MAX_ATTEMPTS) {
        const until = Date.now() + LOCK_MINUTES * 60 * 1000;
        setLockedUntil(until);
        setLocked(true);
        setLockRemaining(LOCK_MINUTES);
        setBanner({ variant: 'error', message: `Too many attempts. Try again in ${LOCK_MINUTES} minutes.` });
      } else {
        setBanner({ variant: 'error', message: `Incorrect code. ${MAX_ATTEMPTS - nextAttempts} attempt(s) left.` });
      }
      return;
    }
    const enabledAtISO = new Date().toISOString();
    setTwoFactor({ enabled: true, method, enabledAtISO });
    addLoginEvent({ id: `evt-2fa-on-${Date.now()}`, type: 'two-factor-on', atISO: enabledAtISO, method });
    setStep('done');
    setBanner({ variant: 'success', message: 'Two-factor authentication is on.' });
  };

  const disable = () => {
    Alert.alert('Turn off two-factor authentication?', 'Your account will be less protected.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Turn off',
        style: 'destructive',
        onPress: () => {
          const atISO = new Date().toISOString();
          setTwoFactor({ enabled: false, method });
          addLoginEvent({ id: `evt-2fa-off-${Date.now()}`, type: 'two-factor-off', atISO, method });
          setStep('method');
          setCode('');
          setSentCode(null);
          setBanner({ variant: 'success', message: 'Two-factor authentication turned off.' });
        },
      },
    ]);
  };

  const codeBoxes = useMemo(() => {
    const chars = code.replace(/\D/g, '').slice(0, 6).split('');
    return Array.from({ length: 6 }, (_, i) => chars[i] ?? '');
  }, [code]);

  return (
    <View style={styles.screen}>
      <TopBar title="Two-factor authentication" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {banner ? <InlineBanner variant={banner.variant} message={banner.message} /> : null}

        {security.twoFactor.enabled && step !== 'done' ? (
          <View style={styles.card}>
            <Text style={styles.title} maxFontSizeMultiplier={1.3}>Two-factor is on</Text>
            <Text style={styles.body} maxFontSizeMultiplier={1.3}>
              Method: {security.twoFactor.method === 'sms' ? 'SMS' : 'Email'}. You’ll be asked for a code when signing in on a new device.
            </Text>
            <Button label="Turn off two-factor" variant="destructive" onPress={disable} />
          </View>
        ) : null}

        {!security.twoFactor.enabled && step === 'method' ? (
          <>
            <View style={styles.card}>
              <Text style={styles.title} maxFontSizeMultiplier={1.3}>Add an extra layer of protection</Text>
              <Text style={styles.body} maxFontSizeMultiplier={1.3}>
                When two-factor authentication is on, you’ll confirm it’s you with a code when signing in.
              </Text>
            </View>
            <SettingsGroup title="Choose a method">
              <SettingsRow icon={MessageSquare} label="SMS code" caption="Send a code to your phone number" onPress={() => setMethod('sms')} value={method === 'sms' ? 'Selected' : undefined} />
              <SettingsRow icon={Mail} label="Email code" caption="Send a code to your email address" onPress={() => setMethod('email')} value={method === 'email' ? 'Selected' : undefined} last />
            </SettingsGroup>
            <Button label="Send code" onPress={sendCode} />
          </>
        ) : null}

        {step === 'code' && !security.twoFactor.enabled ? (
          <View style={styles.card}>
            <Text style={styles.title} maxFontSizeMultiplier={1.3}>Enter verification code</Text>
            <Text style={styles.body} maxFontSizeMultiplier={1.3}>We sent a 6-digit code to {destination}. It expires in 10 minutes.</Text>
            <Pressable onPress={() => inputRef.current?.focus()} accessibilityLabel="Enter 6-digit code">
              <View style={styles.codeRow}>
                {codeBoxes.map((char, i) => (
                  <View key={i} style={[styles.codeBox, char ? styles.codeBoxFilled : null]}>
                    <Text style={styles.codeChar} maxFontSizeMultiplier={1.2}>{char}</Text>
                  </View>
                ))}
              </View>
            </Pressable>
            <TextInput ref={inputRef} value={code} onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" textContentType="oneTimeCode" maxLength={6} style={styles.hiddenInput} accessibilityLabel="Verification code" />
            <Button label="Verify" onPress={verify} disabled={code.replace(/\D/g, '').length !== 6 || locked} />
            <Button label={cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'} variant="secondary" onPress={sendCode} disabled={cooldown > 0 || locked} />
            {locked ? <Text style={styles.locked} maxFontSizeMultiplier={1.3}>Too many attempts. Try again in about {lockRemaining} minute(s).</Text> : null}
          </View>
        ) : null}

        {step === 'done' && security.twoFactor.enabled ? (
          <View style={styles.card}>
            <View style={styles.doneHead}><ShieldCheck size={24} color={colors.green700} strokeWidth={2} /><Text style={styles.title} maxFontSizeMultiplier={1.3}>Two-factor is enabled</Text></View>
            <Text style={styles.body} maxFontSizeMultiplier={1.3}>Your account is now protected with an extra sign-in step. Keep your {method === 'sms' ? 'phone number' : 'email'} up to date so you can receive codes.</Text>
            <Text style={styles.body} maxFontSizeMultiplier={1.3}>Recovery guidance: if you lose access, contact Gabfix support from your registered account email or phone.</Text>
            <Button label="Done" onPress={() => router.back()} />
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space[4], gap: space[4], paddingBottom: space[10] },
  card: { backgroundColor: colors.surface, borderRadius: radius.card, padding: space[4], gap: space[3], borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  title: { ...text.bodyM },
  body: { ...text.body, color: colors.textMuted },
  codeRow: { flexDirection: 'row', gap: space[2], justifyContent: 'center' },
  codeBox: { width: 44, height: 52, borderRadius: 10, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  codeBoxFilled: { borderColor: colors.green500 },
  codeChar: { ...text.h3, color: colors.text },
  hiddenInput: { position: 'absolute', opacity: 0, height: 1, width: 1 },
  locked: { ...text.caption, color: colors.error },
  doneHead: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
});
