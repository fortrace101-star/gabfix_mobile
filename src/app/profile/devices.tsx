import { LogOut, Smartphone } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ConfirmSheet } from '@/components/ui/confirm-sheet';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { StatTile } from '@/components/ui/stat-tile';
import { TopBar } from '@/components/ui/top-bar';
import { useDeviceSessions } from '@/hooks/use-device-sessions';
import { colors, font, radius, space, text } from '@/theme';

const timeLabel = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

/** P30 Devices and sessions. */
export default function DevicesScreen() {
  const { sessions, current, others, status, refresh, signOutDevice, signOutOthers } = useDeviceSessions();
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<{ type: 'one'; id: string; name: string } | { type: 'all' } | null>(null);

  useEffect(() => {
    refresh(true);
  }, [refresh]);

  const onConfirm = async () => {
    if (!confirm) return;
    setBusy(true);
    if (confirm.type === 'one') {
      const ok = await signOutDevice(confirm.id);
      if (!ok) Alert.alert('Could not sign out', 'Please try again.');
    } else {
      const count = await signOutOthers();
      if (count === 0 && others.length > 0) Alert.alert('Could not sign out', 'Please try again.');
    }
    setBusy(false);
    setConfirm(null);
  };

  return (
    <View style={styles.screen}>
      <TopBar title="Devices and sessions" />
      {status === 'loading' && sessions.length === 0 ? (
        <View style={styles.loading}><Skeleton style={{ height: 120, borderRadius: 16 }} /><Skeleton style={{ height: 120, borderRadius: 16 }} /></View>
      ) : status === 'error' && sessions.length === 0 ? (
        <View style={styles.loading}>
          <ErrorState
            title="Could not load devices"
            body="Check your connection and try again."
            onRetry={() => refresh(true)}
          />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={status === 'loading'} onRefresh={() => refresh(true)} tintColor={colors.green500} />}>
          <View style={styles.summary}>
            <Text style={styles.summaryTitle} maxFontSizeMultiplier={1.3}>Your devices</Text>
            <Text style={styles.summaryBody} maxFontSizeMultiplier={1.3}>
              Review where your Gabfix account is signed in and remove any you don’t recognise.
            </Text>
            <View style={styles.stats}>
              <StatTile label="Signed in" value={sessions.length} />
              <StatTile label="Other" value={Math.max(0, sessions.length - 1)} />
            </View>
          </View>

          {others.length > 0 ? (
            <Button
              label="Sign out other devices"
              variant="destructive"
              icon={LogOut}
              onPress={() => setConfirm({ type: 'all' })}
            />
          ) : null}

          {current ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.2}>This device</Text>
              <View style={styles.card}>
                <View style={styles.cardHead}>
                  <Smartphone size={20} color={colors.green700} strokeWidth={2} />
                  <Text style={styles.deviceName} maxFontSizeMultiplier={1.3}>{current.name}</Text>
                  <View style={styles.badge}><Text style={styles.badgeText} maxFontSizeMultiplier={1.2}>Current device</Text></View>
                </View>
                <Text style={styles.meta} maxFontSizeMultiplier={1.3}>Last used: {timeLabel(current.lastUsedAtISO)}</Text>
                <Text style={styles.meta} maxFontSizeMultiplier={1.3}>Signed in: {timeLabel(current.signedInAtISO)}</Text>
                <Text style={styles.meta} maxFontSizeMultiplier={1.3}>{current.platform.toUpperCase()} · {current.approxLocation ?? 'Location unavailable'}</Text>
                <Text style={styles.note} maxFontSizeMultiplier={1.3}>This is the phone you’re using.</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.2}>Other signed-in devices</Text>
            {others.length === 0 ? (
              <EmptyState icon={Smartphone} title="Only this phone" body="You're only signed in on this phone." />
            ) : (
              <View style={{ gap: space[3] }}>
                {others.map((session) => (
                  <View key={session.id} style={styles.card}>
                    <View style={styles.cardHead}>
                      <Smartphone size={20} color={colors.green700} strokeWidth={2} />
                      <Text style={styles.deviceName} maxFontSizeMultiplier={1.3}>{session.name}</Text>
                    </View>
                    <Text style={styles.meta} maxFontSizeMultiplier={1.3}>Last used: {timeLabel(session.lastUsedAtISO)}</Text>
                    <Text style={styles.meta} maxFontSizeMultiplier={1.3}>Signed in: {timeLabel(session.signedInAtISO)}</Text>
                    <Text style={styles.meta} maxFontSizeMultiplier={1.3}>{session.platform.toUpperCase()}</Text>
                    <Button
                      label="Sign out device"
                      variant="ghost"
                      icon={LogOut}
                      onPress={() => setConfirm({ type: 'one', id: session.id, name: session.name })}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      )}

      <ConfirmSheet
        visible={confirm !== null}
        title={confirm?.type === 'all' ? 'Sign out other devices?' : 'Sign out this device?'}
        body={
          confirm?.type === 'all'
            ? `${others.length} device${others.length === 1 ? '' : 's'} will be signed out within 15 minutes.`
            : `${confirm?.name ?? 'This device'} will be signed out within 15 minutes.`
        }
        confirmLabel="Sign out"
        busy={busy}
        icon={LogOut}
        onClose={() => (busy ? undefined : setConfirm(null))}
        onConfirm={() => void onConfirm()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  loading: { padding: space[4], gap: space[3] },
  content: { padding: space[4], gap: space[4], paddingBottom: space[10] },
  summary: { backgroundColor: colors.surface, borderRadius: radius.card, padding: space[4], gap: space[2], borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  summaryTitle: { ...text.h3 },
  summaryBody: { ...text.bodyM, color: colors.textMuted },
  stats: { flexDirection: 'row', gap: space[2], marginTop: space[1] },
  section: { gap: space[2] },
  sectionTitle: { ...text.caption, fontFamily: font.bodySemi, letterSpacing: 0.8, textTransform: 'uppercase', color: colors.textMuted, marginLeft: 4 },
  card: { backgroundColor: colors.surface, borderRadius: radius.card, padding: space[4], gap: space[2], borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: space[2], flexWrap: 'wrap' },
  deviceName: { ...text.bodyM, fontFamily: font.bodySemi, flex: 1 },
  badge: { backgroundColor: colors.successBg, paddingHorizontal: 10, height: 24, borderRadius: radius.pill, justifyContent: 'center' },
  badgeText: { ...text.caption, color: colors.green700, fontFamily: font.bodySemi },
  meta: { ...text.caption, color: colors.textMuted },
  note: { ...text.caption, color: colors.green700, backgroundColor: colors.green50, borderRadius: 8, padding: space[2] },
});
