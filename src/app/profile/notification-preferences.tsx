import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { Bell, CalendarClock, ChevronDown, Clock3, Globe2, Smartphone, Tag } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, BackHandler, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { TimezoneSheet } from '@/components/profile/timezone-sheet';
import { Button } from '@/components/ui/button';
import { InlineBanner } from '@/components/ui/inline-banner';
import { PermissionCard } from '@/components/ui/permission-card';
import { SettingsGroup, SettingsRow } from '@/components/ui/settings-list';
import { TopBar } from '@/components/ui/top-bar';
import { timezoneLabel } from '@/config/timezones';
import { getPushPermission, requestPushPermission, type PushPermission } from '@/lib/push';
import { validateQuietHours } from '@/lib/quiet-hours';
import { saveNotificationPreferences, useProfileSettings, type NotificationPreferences } from '@/store/profile-settings';
import { colors, radius, space, text } from '@/theme';

function TimeChips({
  label,
  value,
  options,
  onSelect,
}: {
  label: string;
  value: string;
  options: string[];
  onSelect: (value: string) => void;
}) {
  return (
    <View style={styles.timeRow}>
      <Text style={styles.timeLabel} maxFontSizeMultiplier={1.3}>{label}</Text>
      <View style={styles.chips}>
        {options.map((option) => {
          const selected = option === value;
          return (
            <Pressable
              key={option}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => onSelect(option)}
              style={[styles.timeChip, selected && styles.timeChipOn]}>
              <Text style={[styles.timeChipText, selected && styles.timeChipTextOn]} maxFontSizeMultiplier={1.2}>
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** P28 Notification preferences. */
export default function NotificationPreferencesScreen() {
  const settings = useProfileSettings();
  const [draft, setDraft] = useState<NotificationPreferences>(settings.notifications);
  const [initial, setInitial] = useState<NotificationPreferences>(settings.notifications);
  const [permission, setPermission] = useState<PushPermission>('undetermined');
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<{ variant: 'success' | 'warning' | 'error' | 'info'; message: string } | null>(null);
  const [tzOpen, setTzOpen] = useState(false);

  useEffect(() => {
    if (!settings.hydrated) return;
    const next = settings.notifications;
    const timer = setTimeout(() => {
      setDraft((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
      setInitial((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.hydrated]);

  useEffect(() => {
    void getPushPermission().then(setPermission);
  }, []);

  useEffect(() => {
    if (banner?.variant !== 'success') return;
    const timer = setTimeout(() => setBanner(null), 4000);
    return () => clearTimeout(timer);
  }, [banner]);

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(initial), [draft, initial]);
  const quietError = draft.quietHours.enabled ? validateQuietHours(draft.quietHours) : null;

  const tryLeave = useCallback(() => {
    if (!dirty) {
      router.back();
      return true;
    }
    Alert.alert('Save your changes?', 'Your notification preferences have changed.', [
      { text: 'Keep editing', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => router.back(),
      },
      {
        text: 'Save',
        onPress: () => {
          if (quietError) return;
          saveNotificationPreferences(draft);
          setInitial(draft);
          router.back();
        },
      },
    ]);
    return true;
  }, [dirty, draft, quietError]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', tryLeave);
    return () => sub.remove();
  }, [tryLeave]);

  const togglePush = async (on: boolean) => {
    if (!on) {
      setDraft((current) => ({ ...current, push: false }));
      return;
    }
    const current = permission === 'undetermined' ? await requestPushPermission() : permission;
    setPermission(current);
    if (current === 'granted') {
      setDraft((d) => ({ ...d, push: true }));
    } else if (current === 'denied' || current === 'unsupported') {
      setDraft((d) => ({ ...d, push: false }));
    }
  };

  const save = () => {
    if (!dirty || quietError) return;
    setSaving(true);
    saveNotificationPreferences(draft);
    setInitial(draft);
    setSaving(false);
    setBanner({ variant: 'success', message: 'Preferences saved' });
  };

  const bothOff = !draft.inApp && !draft.push;
  const permissionLabel =
    permission === 'granted' ? 'Allowed' : permission === 'denied' ? 'Off' : permission === 'unsupported' ? 'Not supported on web' : 'Not asked yet';

  return (
    <View style={styles.screen}>
      <TopBar title="Notifications" onBack={tryLeave} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro} maxFontSizeMultiplier={1.3}>
          Choose which updates you receive and when.
        </Text>

        {banner ? <InlineBanner variant={banner.variant} message={banner.message} onDismiss={() => setBanner(null)} /> : null}
        {bothOff ? (
          <InlineBanner
            variant="warning"
            message="With both channels off you won't be alerted about booking changes. You can still check status in My bookings."
          />
        ) : null}

        <SettingsGroup title="Channels">
          <SettingsRow
            icon={Bell}
            label="In-app"
            caption="Keep updates in your inbox."
            switchValue={draft.inApp}
            onSwitchChange={(value) => setDraft((d) => ({ ...d, inApp: value }))}
          />
          <SettingsRow
            icon={Smartphone}
            label="Push"
            caption={`Alerts on this phone. Phone permission: ${permissionLabel}`}
            switchValue={draft.push}
            onSwitchChange={(value) => void togglePush(value)}
            last
          />
        </SettingsGroup>

        {permission === 'denied' ? (
          <PermissionCard
            icon={Bell}
            title="Notifications are off for Gabfix on this phone"
            body="Allow them in Settings to get alerts on this device."
            onOpenSettings={() => void Linking.openSettings()}
          />
        ) : null}

        <SettingsGroup title="What we send">
          <SettingsRow
            icon={CalendarClock}
            label="Booking and payment updates"
            caption="Confirmations, your cleaner's arrival, payments and security alerts."
            lockedLabel="Always on"
          />
          <SettingsRow
            icon={Clock3}
            label="Reminders"
            caption="Before a clean, and after it."
            switchValue={draft.reminders}
            onSwitchChange={(value) => setDraft((d) => ({ ...d, reminders: value }))}
          />
          <SettingsRow
            icon={Tag}
            label="News and offers"
            caption="Promotions and new services from Gabfix."
            switchValue={draft.offers}
            onSwitchChange={(value) => setDraft((d) => ({ ...d, offers: value }))}
            last
          />
        </SettingsGroup>

        <SettingsGroup title="Quiet hours">
          <View style={styles.cardInner}>
            <SettingsRow
              icon={Clock3}
              label="Quiet hours for push"
              caption="Routine pushes wait until quiet hours end. Critical updates may bypass quiet hours."
              switchValue={draft.quietHours.enabled}
              onSwitchChange={(value) => setDraft((d) => ({ ...d, quietHours: { ...d.quietHours, enabled: value } }))}
              last={!draft.quietHours.enabled}
            />
            {draft.quietHours.enabled ? (
              <View style={styles.quietBody}>
                <TimeChips
                  label="From"
                  value={draft.quietHours.start}
                  options={['21:00', '22:00', '23:00', '00:00']}
                  onSelect={(value) => setDraft((d) => ({ ...d, quietHours: { ...d.quietHours, start: value } }))}
                />
                <TimeChips
                  label="Until"
                  value={draft.quietHours.end}
                  options={['05:00', '06:00', '07:00', '08:00']}
                  onSelect={(value) => setDraft((d) => ({ ...d, quietHours: { ...d.quietHours, end: value } }))}
                />
                <Pressable accessibilityRole="button" onPress={() => setTzOpen(true)} style={styles.timezone}>
                  <Globe2 size={18} color={colors.green700} strokeWidth={2} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tzLabel} maxFontSizeMultiplier={1.3}>{timezoneLabel(draft.timezone)}</Text>
                    <Text style={styles.tzSub} maxFontSizeMultiplier={1.2}>{draft.timezone}</Text>
                  </View>
                  <ChevronDown size={18} color={colors.textMuted} strokeWidth={2} />
                </Pressable>
                {quietError ? <Text style={styles.error} maxFontSizeMultiplier={1.3}>{quietError}</Text> : null}
              </View>
            ) : null}
            {!draft.push ? (
              <Text style={styles.note} maxFontSizeMultiplier={1.3}>Quiet hours only apply to push.</Text>
            ) : null}
          </View>
        </SettingsGroup>

        <Button label="Save preferences" onPress={save} loading={saving} disabled={!dirty || Boolean(quietError)} />
        <Text style={styles.footer} maxFontSizeMultiplier={1.3}>
          Your phone must also allow Gabfix notifications.
        </Text>
        <Button label="Open phone settings" variant="secondary" onPress={() => void Linking.openSettings()} />
      </ScrollView>

      <TimezoneSheet
        visible={tzOpen}
        value={draft.timezone}
        onSelect={(timezone) => setDraft((d) => ({ ...d, timezone }))}
        onClose={() => setTzOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space[4], gap: space[4], paddingBottom: space[10] },
  intro: { ...text.caption, color: colors.textMuted },
  cardInner: { gap: space[2], paddingBottom: space[2] },
  quietBody: { paddingHorizontal: space[4], gap: space[3], paddingBottom: space[2] },
  timeRow: { gap: space[2] },
  timeLabel: { ...text.bodyM, fontFamily: 'Inter_600SemiBold' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeChip: { minHeight: 36, paddingHorizontal: 12, borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  timeChipOn: { backgroundColor: colors.green500, borderColor: colors.green500 },
  timeChipText: { ...text.caption, fontFamily: 'Inter_600SemiBold', color: colors.text },
  timeChipTextOn: { color: colors.surface },
  timezone: { minHeight: 64, borderRadius: radius.input, backgroundColor: colors.green50, paddingHorizontal: space[3], flexDirection: 'row', alignItems: 'center', gap: space[2] },
  tzLabel: { ...text.bodyM, fontFamily: 'Inter_600SemiBold' },
  tzSub: { ...text.caption, color: colors.textMuted },
  note: { ...text.caption, color: colors.textMuted, paddingHorizontal: space[4] },
  error: { ...text.caption, color: colors.error },
  footer: { ...text.caption, color: colors.textMuted, textAlign: 'center' },
});
