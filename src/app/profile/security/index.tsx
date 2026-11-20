import { router, type Href } from 'expo-router';
import { KeyRound, Lock, ShieldAlert, ShieldCheck, Smartphone } from 'lucide-react-native';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { SettingsGroup, SettingsRow } from '@/components/ui/settings-list';
import { StatTile } from '@/components/ui/stat-tile';
import { TopBar } from '@/components/ui/top-bar';
import { useDeviceSessions } from '@/hooks/use-device-sessions';
import { useLoginActivity } from '@/store/login-activity';
import { useSecurity } from '@/store/security';
import { colors, space, text } from '@/theme';

const formatDate = (iso?: string): string => {
  if (!iso) return 'Not changed yet';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Not changed yet';
  return `Last changed ${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
};

const formatLogin = (iso?: string): string => {
  if (!iso) return 'No recent sign-ins';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'No recent sign-ins';
  return `Last login ${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}, ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
};

/** P29 Security hub. */
export default function SecurityScreen() {
  const security = useSecurity();
  const activity = useLoginActivity();
  const { sessions, refresh } = useDeviceSessions();

  useEffect(() => {
    refresh();
  }, [refresh]);

  const lastLogin = security.lastLoginISO ?? activity[0]?.atISO;
  const deviceCount = Math.max(1, sessions.length);
  const checks = [Boolean(security.passwordChangedAtISO), security.twoFactor.enabled, false];
  const met = checks.filter(Boolean).length;
  const level = met >= 3 ? 'Strong' : met >= 2 ? 'Good' : 'Basic';

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
            caption="Add an extra layer of protection. Coming soon."
            lockedLabel={security.twoFactor.enabled ? 'On' : 'Off'}
            last
          />
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
});
