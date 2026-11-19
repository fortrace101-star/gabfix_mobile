import Constants from 'expo-constants';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router, type Href } from 'expo-router';
import {
  Bell,
  BookOpenText,
  CalendarClock,
  Camera,
  Check,
  ChevronRight,
  CircleHelp,
  CreditCard,
  Fingerprint,
  Gift,
  Globe2,
  LogOut,
  MapPin,
  Pencil,
  Phone,
  ShieldCheck,
  Star,
  Tag,
  Trash2,
  UserRound,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { useStatusBarStyle } from '@/hooks/use-status-bar-style';
import { deleteLocalAccount } from '@/lib/account';
import { REFERRAL_REWARD } from '@/lib/referral';
import {
  setAvatarUri,
  setBiometricEnabled,
  setNotificationPreference,
  useProfileSettings,
} from '@/store/profile-settings';
import { useOnboardingArea } from '@/store/onboarding';
import { endSession, useAuthUser } from '@/store/session';
import { base, colors, font, radius, space, text } from '@/theme';
import { phoneUG, ugx } from '@/utils/format';

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

/** P27e Profile and Settings. Preferences are local until the account API exists. */
export default function ProfileTab() {
  const insets = useSafeAreaInsets();
  useStatusBarStyle('dark');

  const user = useAuthUser();
  const area = useOnboardingArea();
  const settings = useProfileSettings();
  const [languageOpen, setLanguageOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
    router.replace('/login');
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + space[4] }]}>
        <Text style={styles.title} maxFontSizeMultiplier={1.3}>
          Profile
        </Text>

        <View style={[base.card, styles.identity]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              settings.avatarUri ? 'Change profile photo' : 'Add a profile photo'
            }
            accessibilityHint="Opens your photo library"
            onPress={chooseAvatar}
            style={styles.avatarButton}>
            {settings.avatarUri ? (
              <Image
                source={{ uri: settings.avatarUri }}
                style={styles.avatarImage}
                contentFit="cover"
              />
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
              onPress={() => router.push('/profile/edit')}
              style={styles.editLink}>
              <Pencil size={14} color={colors.green700} strokeWidth={2} />
              <Text style={styles.editText} maxFontSizeMultiplier={1.2}>
                Edit profile
              </Text>
            </Pressable>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Refer and earn"
          onPress={() => router.push('/refer' as Href)}
          style={styles.referPressable}>
          <LinearGradient
            colors={[colors.yellow500, colors.yellow600]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.referCard}>
            <View style={styles.referIcon}>
              <Gift size={22} color={colors.green900} strokeWidth={2} />
            </View>
            <View style={styles.referBody}>
              <Text style={styles.referKicker} maxFontSizeMultiplier={1.2}>
                Refer and earn
              </Text>
              <Text style={styles.referTitle} maxFontSizeMultiplier={1.3}>
                Give {ugx(REFERRAL_REWARD)}, get {ugx(REFERRAL_REWARD)}
              </Text>
            </View>
            <ChevronRight size={18} color={colors.green900} strokeWidth={2} />
          </LinearGradient>
        </Pressable>

        <Group title="Account">
          <SettingRow
            icon={UserRound}
            label="Personal details"
            value={user?.email ?? 'Name, phone and email'}
            onPress={() => router.push('/profile/edit')}
          />
          <SettingRow
            icon={MapPin}
            label="Saved addresses"
            value="Home, Work and other places"
            onPress={() => router.push('/addresses' as Href)}
          />
          <SettingRow
            icon={Wallet}
            label="Payment methods"
            value="Cards, Mobile Money and receipts"
            onPress={() => router.push('/profile/payments' as Href)}
          />
          <SettingRow
            icon={MapPin}
            label="Service area"
            value={area ? `${area.name}, ${area.division}` : 'Not set'}
            onPress={() => router.push('/area-select')}
          />
          <SettingRow
            icon={Tag}
            label="Offers and promo codes"
            value="Save on your next clean"
            onPress={() => router.push('/offers' as Href)}
            last
          />
        </Group>

        <Group title="Preferences">
          <SettingRow
            icon={Globe2}
            label="Language"
            value="English"
            onPress={() => setLanguageOpen(true)}
          />
          <SettingRow
            icon={Bell}
            label="Booking updates"
            switchValue={settings.notifications.bookingUpdates}
            onSwitchChange={(value) => setNotificationPreference('bookingUpdates', value)}
          />
          <SettingRow
            icon={CalendarClock}
            label="Reminders"
            switchValue={settings.notifications.reminders}
            onSwitchChange={(value) => setNotificationPreference('reminders', value)}
          />
          <SettingRow
            icon={Tag}
            label="Offers and promotions"
            switchValue={settings.notifications.offers}
            onSwitchChange={(value) => setNotificationPreference('offers', value)}
          />
          <SettingRow
            icon={Fingerprint}
            label="Biometric login"
            switchValue={settings.biometric}
            onSwitchChange={setBiometricEnabled}
            last
          />
        </Group>

        <Group title="Support">
          <SettingRow
            icon={CircleHelp}
            label="Help centre"
            onPress={() => router.push('/help' as Href)}
          />
          <SettingRow
            icon={Phone}
            label="Contact us"
            onPress={() => router.push('/help/contact' as Href)}
          />
          <SettingRow
            icon={Star}
            label="Rate the app"
            onPress={() =>
              Alert.alert(
                'Rate Gabfix',
                'Store reviews open once the app is published. Thank you for the support!',
              )
            }
            last
          />
        </Group>

        <Group title="Legal">
          <SettingRow
            icon={BookOpenText}
            label="Terms and conditions"
            onPress={() => router.push({ pathname: '/policies/[doc]', params: { doc: 'terms' } })}
          />
          <SettingRow
            icon={ShieldCheck}
            label="Privacy policy"
            onPress={() =>
              router.push({ pathname: '/policies/[doc]', params: { doc: 'privacy' } })
            }
          />
          <SettingRow
            icon={CreditCard}
            label="Payment and refund policy"
            onPress={() =>
              router.push({ pathname: '/policies/[doc]', params: { doc: 'payments-refunds' } })
            }
            last
          />
        </Group>

        <Group>
          <SettingRow
            icon={LogOut}
            label="Log out"
            destructive
            last
            onPress={() => {
              void endSession();
              router.replace('/login');
            }}
          />
        </Group>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Delete account"
          hitSlop={8}
          onPress={() => setDeleteOpen(true)}
          style={styles.deleteAccount}>
          <Trash2 size={16} color={colors.error} strokeWidth={2} />
          <Text style={styles.deleteAccountText} maxFontSizeMultiplier={1.2}>
            Delete account
          </Text>
        </Pressable>

        <Text style={styles.footnote} maxFontSizeMultiplier={1.2}>
          Gabfix Home Solutions · Version {appVersion}
        </Text>
      </ScrollView>

      <LanguageSheet visible={languageOpen} onClose={() => setLanguageOpen(false)} />
      <DeleteAccountSheet
        visible={deleteOpen}
        deleting={deleting}
        onClose={() => setDeleteOpen(false)}
        onDelete={confirmDelete}
      />
    </View>
  );
}

function Group({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <View style={styles.group}>
      {title ? (
        <Text style={styles.groupTitle} maxFontSizeMultiplier={1.2}>
          {title}
        </Text>
      ) : null}
      <View style={styles.groupCard}>{children}</View>
    </View>
  );
}

type SettingRowProps = {
  icon: LucideIcon;
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  last?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
};

function SettingRow({
  icon: Icon,
  label,
  value,
  onPress,
  destructive = false,
  last = false,
  switchValue,
  onSwitchChange,
}: SettingRowProps) {
  const body = (
    <>
      <View style={[styles.iconTile, destructive && styles.iconTileDestructive]}>
        <Icon size={20} color={destructive ? colors.error : colors.green500} strokeWidth={2} />
      </View>
      <View style={styles.rowBody}>
        <Text
          style={[styles.rowLabel, destructive && styles.rowLabelDestructive]}
          maxFontSizeMultiplier={1.3}>
          {label}
        </Text>
        {value ? (
          <Text style={styles.rowValue} maxFontSizeMultiplier={1.2} numberOfLines={1}>
            {value}
          </Text>
        ) : null}
      </View>
      {onSwitchChange && typeof switchValue === 'boolean' ? (
        <Switch
          accessibilityLabel={label}
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: colors.border, true: colors.green500 }}
          thumbColor={colors.surface}
          ios_backgroundColor={colors.border}
        />
      ) : onPress ? (
        <ChevronRight size={18} color={colors.textMuted} strokeWidth={2} />
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={value ? `${label}. ${value}` : label}
        onPress={onPress}
        style={[styles.row, !last && styles.rowDivider]}>
        {body}
      </Pressable>
    );
  }

  return <View style={[styles.row, !last && styles.rowDivider]}>{body}</View>;
}

function LanguageSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      {visible ? (
        <View style={styles.backdrop}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close language picker"
            onPress={onClose}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle} maxFontSizeMultiplier={1.3}>
                Language
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                hitSlop={8}
                onPress={onClose}
                style={styles.sheetClose}>
                <X size={22} color={colors.text} strokeWidth={2} />
              </Pressable>
            </View>
            <View style={styles.languageRow}>
              <Globe2 size={20} color={colors.green500} strokeWidth={2} />
              <Text style={styles.languageLabel} maxFontSizeMultiplier={1.3}>
                English
              </Text>
              <Check size={20} color={colors.green500} strokeWidth={2.4} />
            </View>
            <Text style={styles.sheetNote} maxFontSizeMultiplier={1.3}>
              More languages will be added with the localization pass. The app currently uses
              English throughout.
            </Text>
          </View>
        </View>
      ) : null}
    </Modal>
  );
}

function DeleteAccountSheet({
  visible,
  deleting,
  onClose,
  onDelete,
}: {
  visible: boolean;
  deleting: boolean;
  onClose: () => void;
  onDelete: () => void;
}) {
  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      {visible ? (
        <View style={styles.backdrop}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel delete account"
            onPress={onClose}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.deleteIcon}>
              <Trash2 size={26} color={colors.error} strokeWidth={2} />
            </View>
            <Text style={styles.deleteTitle} maxFontSizeMultiplier={1.3}>
              Delete your account?
            </Text>
            <Text style={styles.deleteBody} maxFontSizeMultiplier={1.3}>
              This removes your local bookings, messages, addresses, payment methods and
              preferences from this device. This cannot be undone in the demo.
            </Text>
            <Button
              label="Delete account"
              variant="destructive"
              loading={deleting}
              onPress={onDelete}
            />
            <Button label="Keep my account" variant="ghost" onPress={onClose} />
          </View>
        </View>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: space[4], paddingBottom: space[8], gap: space[4] },
  title: { ...text.h1 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  avatarButton: { width: 80, height: 80 },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: radius.pill,
    backgroundColor: colors.green100,
  },
  avatarFallback: {
    width: 80,
    height: 80,
    borderRadius: radius.pill,
    backgroundColor: colors.yellow500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: font.poppinsSemi,
    fontSize: 24,
    lineHeight: 32,
    color: colors.green900,
  },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.yellow500,
    borderWidth: 3,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityBody: { flex: 1, gap: 2 },
  name: { ...text.h2 },
  meta: { ...text.caption },
  editLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    minHeight: 32,
    marginTop: 2,
  },
  editText: { ...text.caption, fontFamily: font.bodySemi, color: colors.green700 },
  referPressable: { borderRadius: radius.card, overflow: 'hidden' },
  referCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    padding: space[4],
    borderRadius: radius.card,
  },
  referIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  referBody: { flex: 1, gap: 1 },
  referKicker: {
    fontFamily: font.bodySemi,
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: colors.green900,
    opacity: 0.75,
  },
  referTitle: {
    fontFamily: font.poppinsSemi,
    fontSize: 15,
    lineHeight: 21,
    color: colors.green900,
  },
  group: { gap: space[2] },
  groupTitle: {
    ...text.caption,
    fontFamily: font.bodySemi,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.textMuted,
    marginLeft: space[1],
  },
  groupCard: {
    ...base.card,
    padding: 0,
    overflow: 'hidden',
  },
  row: {
    minHeight: 56,
    paddingHorizontal: space[4],
    paddingVertical: space[2],
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  iconTile: {
    width: 36,
    height: 36,
    borderRadius: radius.input,
    backgroundColor: colors.green50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconTileDestructive: { backgroundColor: colors.errorBg },
  rowBody: { flex: 1, gap: 1 },
  rowLabel: { ...text.bodyM, fontFamily: font.bodySemi, color: colors.text },
  rowLabelDestructive: { color: colors.error },
  rowValue: { ...text.caption },
  deleteAccount: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
  },
  deleteAccountText: {
    ...text.caption,
    fontFamily: font.bodySemi,
    color: colors.error,
  },
  footnote: { ...text.caption, textAlign: 'center' },
  backdrop: { flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    padding: space[4],
    paddingBottom: space[8],
    gap: space[3],
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: space[2],
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  sheetTitle: { ...text.h2, flex: 1 },
  sheetClose: { width: 48, height: 48, alignItems: 'flex-end', justifyContent: 'center' },
  languageRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    paddingHorizontal: space[3],
    borderRadius: radius.input,
    backgroundColor: colors.green50,
  },
  languageLabel: { ...text.bodyM, fontFamily: font.bodySemi, flex: 1 },
  sheetNote: { ...text.caption, color: colors.textMuted, lineHeight: 18 },
  deleteIcon: {
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.errorBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteTitle: { ...text.h2, textAlign: 'center' },
  deleteBody: { ...text.bodyM, color: colors.textMuted, textAlign: 'center' },
});
