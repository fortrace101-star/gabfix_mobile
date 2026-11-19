import { router, type Href } from 'expo-router';
import {
  BookOpenText,
  ChevronDown,
  ChevronRight,
  CreditCard,
  LogOut,
  MapPin,
  ShieldCheck,
} from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { useStatusBarStyle } from '@/hooks/use-status-bar-style';
import { useOnboardingArea } from '@/store/onboarding';
import { endSession, useAuthUser } from '@/store/session';
import { base, colors, font, radius, space, text } from '@/theme';
import { phoneUG } from '@/utils/format';

/** P20 shell: account summary, area shortcut and sign out. */
export default function ProfileTab() {
  const insets = useSafeAreaInsets();
  useStatusBarStyle('dark');

  const user = useAuthUser();
  const area = useOnboardingArea();
  const displayName = user?.name?.trim() || 'Gabfix customer';
  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'G';

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + space[4] }]}>
        <Text style={styles.title} maxFontSizeMultiplier={1.3}>
          Profile
        </Text>

        <View style={[base.card, styles.identity]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText} maxFontSizeMultiplier={1.2}>
              {initials}
            </Text>
          </View>
          <View style={styles.identityBody}>
            <Text style={styles.name} maxFontSizeMultiplier={1.3} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.meta} maxFontSizeMultiplier={1.3}>
              {user?.phone ? phoneUG(user.phone) : (user?.email ?? 'No contact details yet')}
            </Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={area ? `Area: ${area.name}. Change area` : 'Choose your area'}
          onPress={() => router.push('/area-select')}
          style={[base.card, styles.row]}>
          <View style={styles.iconTile}>
            <MapPin size={20} color={colors.green500} strokeWidth={2} />
          </View>
          <View style={styles.rowBody}>
            <Text style={styles.rowLabel} maxFontSizeMultiplier={1.3}>
              Service area
            </Text>
            <Text style={styles.rowValue} maxFontSizeMultiplier={1.3} numberOfLines={1}>
              {area ? `${area.name}, ${area.division}` : 'Not set'}
            </Text>
          </View>
          <ChevronDown size={18} color={colors.textMuted} strokeWidth={2} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Saved addresses"
          onPress={() => router.push('/addresses' as Href)}
          style={[base.card, styles.row]}>
          <View style={styles.iconTile}>
            <MapPin size={20} color={colors.green500} strokeWidth={2} />
          </View>
          <View style={styles.rowBody}>
            <Text style={styles.rowLabel} maxFontSizeMultiplier={1.3}>
              Saved addresses
            </Text>
            <Text style={styles.rowValue} maxFontSizeMultiplier={1.3} numberOfLines={1}>
              Home, Work and other places
            </Text>
          </View>
          <ChevronRight size={18} color={colors.textMuted} strokeWidth={2} />
        </Pressable>

        <View style={styles.legalCard}>
          <LegalRow
            icon={<BookOpenText size={20} color={colors.green500} strokeWidth={2} />}
            label="Terms and conditions"
            onPress={() => router.push({ pathname: '/policies/[doc]', params: { doc: 'terms' } })}
          />
          <View style={styles.divider} />
          <LegalRow
            icon={<ShieldCheck size={20} color={colors.green500} strokeWidth={2} />}
            label="Privacy policy"
            onPress={() =>
              router.push({ pathname: '/policies/[doc]', params: { doc: 'privacy' } })
            }
          />
          <View style={styles.divider} />
          <LegalRow
            icon={<CreditCard size={20} color={colors.green500} strokeWidth={2} />}
            label="Payment and refund policy"
            onPress={() =>
              router.push({ pathname: '/policies/[doc]', params: { doc: 'payments-refunds' } })
            }
          />
        </View>

        <Button
          label="Log out"
          variant="secondary"
          icon={LogOut}
          onPress={() => {
            void endSession();
            router.replace('/login');
          }}
        />

        <Text style={styles.footnote} maxFontSizeMultiplier={1.3}>
          Payment methods and notification settings arrive in later phases.
        </Text>
      </ScrollView>
    </View>
  );
}

function LegalRow({
  icon,
  label,
  onPress,
}: {
  icon: ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={label}
      onPress={onPress}
      style={styles.legalRow}>
      <View style={styles.iconTile}>{icon}</View>
      <Text style={styles.legalLabel} maxFontSizeMultiplier={1.3}>
        {label}
      </Text>
      <ChevronRight size={18} color={colors.textMuted} strokeWidth={2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: space[4], paddingBottom: space[6], gap: space[4] },
  title: { ...text.h1 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.yellow500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: font.poppinsSemi,
    fontSize: 18,
    lineHeight: 24,
    color: colors.green900,
  },
  identityBody: { flex: 1, gap: 2 },
  name: { ...text.h3 },
  meta: { ...text.caption },
  row: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: radius.tile,
    backgroundColor: colors.green50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1, gap: 2 },
  rowLabel: { ...text.caption },
  rowValue: { ...text.bodyM, fontFamily: font.bodySemi },
  legalCard: {
    ...base.card,
    padding: 0,
    overflow: 'hidden',
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    minHeight: 64,
    paddingHorizontal: space[4],
    paddingVertical: space[2],
  },
  legalLabel: { ...text.bodyM, flex: 1, color: colors.text },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: 68 },
  footnote: { ...text.caption, textAlign: 'center' },
});
