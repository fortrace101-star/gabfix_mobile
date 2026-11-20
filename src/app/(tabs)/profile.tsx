import Constants from 'expo-constants';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, type Href } from 'expo-router';
import {
  Bell,
  Camera,
  ChevronRight,
  CircleHelp,
  CreditCard,
  Gift,
  LogOut,
  MapPin,
  Pencil,
  ShieldCheck,
  Smartphone,
  Trash2,
  UserRound,
  Wallet,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ConfirmSheet } from '@/components/ui/confirm-sheet';
import { InlineBanner } from '@/components/ui/inline-banner';
import { SettingsGroup, SettingsRow } from '@/components/ui/settings-list';
import { useStatusBarStyle } from '@/hooks/use-status-bar-style';
import { deleteLocalAccount } from '@/lib/account';
import { notificationSummary } from '@/lib/notify-policy';
import { useDeviceSessions } from '@/hooks/use-device-sessions';
import { setAvatarUri, useProfileSettings } from '@/store/profile-settings';
import { endSession, useAuthUser } from '@/store/session';
import { colors, font, radius, space, text } from '@/theme';
import { phoneUG } from '@/utils/format';

const appVersion = Constants.expoConfig?.version ?? '1.0.0';

const pickAvatarImage = async (): Promise<string | undefined> => {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert(
      'Photo access needed',
      'Allow photo access in your device settings to choose a profile picture.',
    );
    return undefined;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.6,
    base64: true,
  });
  if (result.canceled) return undefined;

  const asset = result.assets[0];
  if (!asset) return undefined;
  return asset.base64
    ? `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}`
    : asset.uri;
};

/** P19/P27e Profile hub with Workstream C security, devices and notification settings. */
export default function ProfileTab() {
  const insets = useSafeAreaInsets();
  useStatusBarStyle('dark');

  const user = useAuthUser();
  const settings = useProfileSettings();
  const { sessions, refresh } = useDeviceSessions();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const displayName = user?.name?.trim() || 'Gabfix customer';
  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'G';

  const chooseAvatar = async () => {
    const uri = await pickAvatarImage();
    if (uri) setAvatarUri(uri);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    await deleteLocalAccount();
    setDeleting(false);
    setDeleteOpen(false);
    router.replace('/login' as Href);
  };

  const sessionCount = Math.max(1, sessions.length);
  const notificationCaption = notificationSummary(settings.notifications);

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + space[4] }]}>
        <Text style={styles.title} maxFontSizeMultiplier={1.3}>
          Profile
        </Text>

        <View style={styles.identity}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={settings.avatarUri ? 'Change profile photo' : 'Add a profile photo'}
            accessibilityHint="Opens your photo library"
            onPress={() => void chooseAvatar()}
            style={styles.avatarButton}>
            {settings.avatarUri ? (
              <Image source={{ uri: settings.avatarUri }} style={styles.avatarImage} contentFit="cover" />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarText} maxFontSizeMultiplier={1.2}>
                  {initials}
                </Text>
              </View>
            )}
            <View style={styles.cameraBadge}>
              <Camera size={14} color={colors.green900} strokeWidth={2} />
            </View>
          </Pressable>

          <View style={styles.identityBody}>
            <Text style={styles.name} maxFontSizeMultiplier={1.3} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.meta} maxFontSizeMultiplier={1.3} numberOfLines={1}>
              {user?.phone ? phoneUG(user.phone) : (user?.email ?? 'No contact details yet')}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit profile"
              hitSlop={8}
              onPress={() => router.push('/profile/edit' as Href)}
              style={styles.editLink}>
              <Pencil size={14} color={colors.green700} strokeWidth={2} />
              <Text style={styles.editText} maxFontSizeMultiplier={1.2}>
                Edit profile
              </Text>
            </Pressable>
          </View>
        </View>

        <SettingsGroup title="Security & devices">
          <SettingsRow
            icon={ShieldCheck}
            label="Security"
            caption="Password, sign-in and protection"
            onPress={() => router.push('/profile/security' as Href)}
          />
          <SettingsRow
            icon={Smartphone}
            label="Devices and sessions"
            caption={`${sessionCount} signed-in device${sessionCount === 1 ? '' : 's'}`}
            onPress={() => router.push('/profile/devices' as Href)}
          />
          <SettingsRow
            icon={Bell}
            label="Notifications"
            caption={notificationCaption}
            onPress={() => router.push('/profile/notification-preferences' as Href)}
            last
          />
        </SettingsGroup>

        <SettingsGroup title="Account">
          <SettingsRow
            icon={UserRound}
            label="Personal details"
            caption={user?.email ?? 'Name, phone and email'}
            onPress={() => router.push('/profile/edit' as Href)}
          />
          <SettingsRow
            icon={MapPin}
            label="Saved addresses"
            caption="Home, work and other places"
            onPress={() => router.push('/addresses' as Href)}
          />
          <SettingsRow
            icon={CreditCard}
            label="Payments and wallet"
            caption="Cards, Mobile Money and receipts"
            onPress={() => router.push('/profile/payments' as Href)}
            last
          />
        </SettingsGroup>

        <SettingsGroup title="Rewards & support">
          <SettingsRow
            icon={Gift}
            label="Refer a friend"
            caption="Invite friends to Gabfix"
            onPress={() => router.push('/refer' as Href)}
          />
          <SettingsRow
            icon={Wallet}
            label="Promo codes"
            caption="Apply and view available offers"
            onPress={() => router.push('/profile/promos' as Href)}
          />
          <SettingsRow
            icon={CircleHelp}
            label="Help and support"
            caption="FAQs, call, WhatsApp or email"
            onPress={() => router.push('/help' as Href)}
            last
          />
        </SettingsGroup>

        <InlineBanner
          variant="info"
          message="Two-factor authentication and biometric app lock are coming in a future update."
        />

        <View style={styles.danger}>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              Alert.alert('Sign out?', 'You can sign back in any time.', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Sign out',
                  style: 'destructive',
                  onPress: () => {
                    void endSession().then(() => router.replace('/login' as Href));
                  },
                },
              ]);
            }}
            style={styles.dangerRow}>
            <LogOut size={20} color={colors.text} strokeWidth={2} />
            <Text style={styles.dangerLabel} maxFontSizeMultiplier={1.3}>Sign out</Text>
            <ChevronRight size={20} color={colors.textMuted} strokeWidth={2} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => setDeleteOpen(true)}
            style={styles.dangerRow}>
            <Trash2 size={20} color={colors.error} strokeWidth={2} />
            <Text style={[styles.dangerLabel, { color: colors.error }]} maxFontSizeMultiplier={1.3}>
              Delete account
            </Text>
            <ChevronRight size={20} color={colors.textMuted} strokeWidth={2} />
          </Pressable>
        </View>

        <Text style={styles.version} maxFontSizeMultiplier={1.2}>
          Gabfix v{appVersion}
        </Text>
      </ScrollView>

      <ConfirmSheet
        visible={deleteOpen}
        title="Delete account?"
        body="This removes your local Gabfix data from this device and signs you out. Server-side deletion depends on the connected profile service."
        confirmLabel="Delete and sign out"
        busy={deleting}
        icon={Trash2}
        onClose={() => (deleting ? undefined : setDeleteOpen(false))}
        onConfirm={() => void confirmDelete()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space[4], paddingBottom: 120, gap: space[4] },
  title: { ...text.h1 },
  identity: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: space[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  avatarButton: { width: 72, height: 72 },
  avatarImage: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.border },
  avatarFallback: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.green100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...text.h3, color: colors.green700 },
  cameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.yellow500,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  identityBody: { flex: 1, gap: 2 },
  name: { ...text.h3 },
  meta: { ...text.caption, color: colors.textMuted },
  editLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, minHeight: 32 },
  editText: { ...text.caption, fontFamily: font.bodySemi, color: colors.green700 },
  danger: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  dangerRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: space[3], paddingHorizontal: space[4] },
  dangerLabel: { ...text.bodyM, flex: 1 },
  version: { ...text.caption, color: colors.textMuted, textAlign: 'center' },
});
