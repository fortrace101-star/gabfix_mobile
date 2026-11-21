import * as LocalAuthentication from 'expo-local-authentication';
import { router, type Href } from 'expo-router';
import { Fingerprint, KeyRound, Lock, ShieldAlert, ShieldCheck, Smartphone } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { InlineBanner } from '@/components/ui/inline-banner';
import { SettingsGroup, SettingsRow } from '@/components/ui/settings-list';
import { StatTile } from '@/components/ui/stat-tile';
import { TopBar } from '@/components/ui/top-bar';
import { useDeviceSessions } from '@/hooks/use-device-sessions';
import { useLoginActivity } from '@/store/login-activity';
import { setBiometric, useSecurity } from '@/store/security';
import { colors, space, text } from '@/theme';

const formatDate = (iso?: string): string => {
  if (!iso) return 'Change it regularly to stay safe';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Change it regularly to stay safe';
  return `Last changed ${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
};

const formatLogin = (iso?: string): string => {
  if (!iso) return 'No recent sign-ins yet';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'No recent sign-ins yet';
  return `Last login ${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}, ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
};

/** P29 Security hub. */
export default function SecurityScreen() {
  const security = useSecurity();
  const activity = useLoginActivity();
  const { sessions, refresh } = useDeviceSessions();
  const [bioAvailable, setBioAvailable] = useState<boolean | null>(Platform.OS === 'web' ? false : null);
  const [bioBusy, setBioBusy] = useState(false);
  const [bioMessage, setBioMessage] = useState<string | null>(null);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    let cancelled = false;
    void (async () => {
      try {
        const has = await LocalAuthentication.hasHardwareAsync();
        const enrolled = has ? await LocalAuthentication.isEnrolledAsync() : false;
        if (!cancelled) setBioAvailable(has && enrolled);
      } catch {
        if (!cancelled) setBioAvailable(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const lastLogin = security.lastLoginISO ?? activity[0]?.atISO;
  const deviceCount = Math.max(1, sessions.length);
  const checks = [Boolean(security.passwordChangedAtISO), security.twoFactor.enabled, security.biometric];
  const met = checks.filter(Boolean).length;
  const level = met >= 3 ? 'Strong' : met >= 2 ? 'Good' : 'Basic';

  const toggleBiometric = async (next: boolean) => {
    if (!next) {
      setBiometric(false);
      setBioMessage('Biometric unlock turned off.');
      return;
    }
    if (Platform.OS === 'web' || bioAvailable === false) {
      setBioMessage('Biometric unlock is not available on this device.');
      return;
    }
    setBioBusy(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirm to enable biometric unlock',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });
      if (result.success) {
        setBiometric(true);
        setBioMessage('Biometric unlock enabled for this device.');
      } else {
        setBioMessage('Biometric confirmation was not completed.');
      }
    } catch {
      setBioMessage('Biometric unlock is not available on this device.');
    } finally {
      setBioBusy(false);
    }
  };

  return (
    <View style={styles.screen}>
      <TopBar title="Security" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summary}>
          <View style={styles.summaryHead}>
            <ShieldCheck size={22} color={colors.green700} strokeWidth={2} />
            <Text style={styles.summaryTitle} maxFontSizeMultiplier={1.3}>Keep your account secure</Text>
          </View>
          <Text style={styles.summaryLevel} maxFontSizeMultiplier={1.3}>Protection: {level}</Text>
          <View style={styles.stats}>
            <StatTile label="Checks met" value={`${met}/3`} />
            <StatTile label="Devices" value={deviceCount} />
          </View>
        </View>

        {bioMessage ? <InlineBanner variant={bioAvailable === false && security.biometric === false ? 'warning' : 'info'} message={bioMessage} /> : null}

        <SettingsGroup title="Sign-in">
          <SettingsRow
            icon={Lock}
            label="Change password"
            caption={formatDate(security.passwordChangedAtISO)}
            onPress={() => router.push('/profile/security/password' as Href)}
          />
          <SettingsRow
            icon={ShieldAlert}
            label="Two-factor authentication"
            caption={security.twoFactor.enabled ? `On · ${security.twoFactor.method.toUpperCase()}` : 'Add an extra layer of protection'}
            onPress={() => router.push('/profile/security/two-factor' as Href)}
            value={security.twoFactor.enabled ? 'On' : 'Off'}
          />
          <View style={styles.bioRow}>
            <View style={styles.bioLeft}>
              <Fingerprint size={20} color={colors.green700} strokeWidth={1.8} />
              <View style={styles.bioText}>
                <Text style={styles.bioLabel} maxFontSizeMultiplier={1.3}>Biometric unlock</Text>
                <Text style={styles.bioCaption} maxFontSizeMultiplier={1.3}>
                  {bioAvailable === false ? 'Not available on this device' : 'Use fingerprint or Face ID on this device'}
                </Text>
              </View>
            </View>
            <Switch
              value={security.biometric}
              onValueChange={(v) => void toggleBiometric(v)}
              disabled={bioBusy || bioAvailable === false}
              accessibilityLabel="Biometric unlock"
            />
          </View>
        </SettingsGroup>

        <SettingsGroup title="Activity">
          <SettingsRow
            icon={Smartphone}
            label="Devices and sessions"
            caption={`${deviceCount} signed-in device${deviceCount === 1 ? '' : 's'}`}
            onPress={() => router.push('/profile/devices' as Href)}
          />
          <SettingsRow
            icon={KeyRound}
            label="Login activity"
            caption={formatLogin(lastLogin)}
            onPress={() => router.push('/profile/security/activity' as Href)}
            last
          />
        </SettingsGroup>

        <View style={styles.info}>
          <Text style={styles.infoText} maxFontSizeMultiplier={1.3}>
            For your protection, Gabfix may ask you to verify your identity when something unusual is detected.
          </Text>
        </View>

        <Button label="Review devices" variant="secondary" onPress={() => router.push('/profile/devices' as Href)} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space[4], gap: space[4], paddingBottom: space[10] },
  summary: { backgroundColor: colors.green50, borderRadius: 16, padding: space[4], gap: space[2] },
  summaryHead: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  summaryTitle: { ...text.bodyM, fontFamily: 'Inter_600SemiBold', color: colors.text },
  summaryLevel: { ...text.caption, color: colors.green700 },
  stats: { flexDirection: 'row', gap: space[2], marginTop: space[1] },
  info: { backgroundColor: colors.infoBg, borderRadius: 12, padding: space[3] },
  infoText: { ...text.caption, color: colors.info },
  bioRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space[4], paddingVertical: space[3], gap: space[3] },
  bioLeft: { flexDirection: 'row', alignItems: 'center', gap: space[3], flex: 1 },
  bioText: { flex: 1, gap: 2 },
  bioLabel: { ...text.bodyM, color: colors.text },
  bioCaption: { ...text.caption, color: colors.textMuted },
});
