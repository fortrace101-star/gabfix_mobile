import { router, type Href } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Check,
  ChevronRight,
  Copy,
  Gift,
  MessageCircle,
  MessageSquare,
  Users,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TopBar } from '@/components/ui/top-bar';
import {
  REFERRAL_REWARD,
  referralCodeFor,
  referralMessage,
  rewardsTotal,
  stageCounts,
  type ReferralStage,
} from '@/lib/referral';
import { useReferrals } from '@/store/referrals';
import { useAuthUser } from '@/store/session';
import { colors, font, radius, space, text } from '@/theme';
import { ugx } from '@/utils/format';

const steps = [
  { icon: Users, title: 'Send your code', copy: 'Share it with a friend who needs a clean.' },
  { icon: Gift, title: 'They book their first clean', copy: 'The code is applied at checkout.' },
  { icon: Check, title: 'You both get credit', copy: 'Credit lands after the first clean is done.' },
] as const;

/** P20 Refer and earn. The code and progress are local dummy values until a referral API exists. */
export default function ReferScreen() {
  const user = useAuthUser();
  const code = referralCodeFor(user);
  const [copied, setCopied] = useState(false);
  const referrals = useReferrals();
  const counts = stageCounts(referrals);
  const credit = rewardsTotal(referrals);
  const stageRows: { stage: ReferralStage; label: string; value: string; reward?: boolean }[] = [
    { stage: 'invited', label: 'Friends invited', value: String(counts.invited) },
    { stage: 'joined', label: 'Joined Gabfix', value: String(counts.joined) },
    { stage: 'booked', label: 'First booking done', value: String(counts.booked) },
    { stage: 'rewards', label: 'Reward earned', value: ugx(credit), reward: true },
  ];

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2_000);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    try {
      await Clipboard.setStringAsync(code);
      setCopied(true);
    } catch {
      Alert.alert('Could not copy', `Copy the code manually: ${code}`);
    }
  };

  const share = async (channel: 'whatsapp' | 'sms') => {
    const message = referralMessage(code);
    const encoded = encodeURIComponent(message);
    const url =
      channel === 'whatsapp'
        ? `whatsapp://send?text=${encoded}`
        : Platform.OS === 'ios'
          ? `sms:&body=${encoded}`
          : `sms:?body=${encoded}`;

    try {
      if (await Linking.canOpenURL(url)) {
        await Linking.openURL(url);
        return;
      }
    } catch {
      // Fall through to the platform share sheet.
    }

    try {
      await Share.share({ message });
    } catch {
      // The customer dismissed the share sheet or no share target is available.
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <TopBar title="Refer and earn" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <LinearGradient
          colors={[colors.yellow500, colors.yellow600]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}>
          <View style={styles.heroBadge}>
            <Gift size={18} color={colors.green900} strokeWidth={2} />
            <Text style={styles.heroBadgeText} maxFontSizeMultiplier={1.2}>
              REFER AND EARN
            </Text>
          </View>
          <Text style={styles.heroTitle} maxFontSizeMultiplier={1.3}>
            Give {ugx(REFERRAL_REWARD)}. Get {ugx(REFERRAL_REWARD)}.
          </Text>
          <Text style={styles.heroBody} maxFontSizeMultiplier={1.3}>
            Share your code with a friend. When their first clean is done, you both get
            cleaning credit.
          </Text>

          <View style={styles.codePanel}>
            <View style={styles.codeBody}>
              <Text style={styles.codeLabel} maxFontSizeMultiplier={1.2}>
                YOUR CODE
              </Text>
              <Text
                accessibilityLabel={`Your referral code is ${code}`}
                style={styles.code}
                maxFontSizeMultiplier={1.2}
                numberOfLines={1}>
                {code}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copied ? 'Referral code copied' : 'Copy referral code'}
              onPress={() => void copy()}
              style={styles.copyButton}>
              {copied ? (
                <Check size={18} color={colors.surface} strokeWidth={2.5} />
              ) : (
                <Copy size={18} color={colors.surface} strokeWidth={2} />
              )}
            </Pressable>
          </View>

          <View style={styles.shareRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Share on WhatsApp"
              onPress={() => void share('whatsapp')}
              style={[styles.shareButton, styles.sharePrimary]}>
              <MessageCircle size={18} color={colors.green900} strokeWidth={2} />
              <Text style={styles.sharePrimaryText} maxFontSizeMultiplier={1.2}>
                WhatsApp
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Share via SMS"
              onPress={() => void share('sms')}
              style={[styles.shareButton, styles.shareSecondary]}>
              <MessageSquare size={18} color={colors.green900} strokeWidth={2} />
              <Text style={styles.shareSecondaryText} maxFontSizeMultiplier={1.2}>
                SMS
              </Text>
            </Pressable>
          </View>
          {copied ? (
            <Text style={styles.copiedText} maxFontSizeMultiplier={1.2}>
              Code copied
            </Text>
          ) : null}
        </LinearGradient>

        <View style={styles.progressCard}>
          <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.3}>
            Your referrals
          </Text>
          <Text style={styles.sectionCaption} maxFontSizeMultiplier={1.3}>
            A snapshot of the reward journey. It updates when the referral API is connected.
          </Text>

          {stageRows.map((row) => (
            <ProgressRow
              key={row.stage}
              label={row.label}
              value={row.value}
              done
              reward={row.reward}
              onPress={() => router.push(`/refer/${row.stage}` as Href)}
            />
          ))}
        </View>

        <View style={styles.howCard}>
          <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.3}>
            How it works
          </Text>
          {steps.map(({ icon: Icon, title, copy }, index) => (
            <View key={title} style={styles.step}>
              <View style={styles.stepIcon}>
                <Icon size={18} color={colors.green700} strokeWidth={2} />
              </View>
              <View style={styles.stepBody}>
                <Text style={styles.stepTitle} maxFontSizeMultiplier={1.3}>
                  {index + 1}. {title}
                </Text>
                <Text style={styles.stepCopy} maxFontSizeMultiplier={1.3}>
                  {copy}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.footnote} maxFontSizeMultiplier={1.3}>
          One reward per new customer. Credit can be used on a future booking and has no cash
          value. Full terms apply.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProgressRow({
  label,
  value,
  done = false,
  reward = false,
  onPress,
}: {
  label: string;
  value: string;
  done?: boolean;
  reward?: boolean;
  onPress?: () => void;
}) {
  const content = (
    <>

      <View style={[styles.progressIcon, reward && styles.progressIconReward]}>
        {done ? (
          <Check
            size={14}
            color={reward ? colors.green900 : colors.surface}
            strokeWidth={3}
          />
        ) : (
          <Text style={styles.progressNumber} maxFontSizeMultiplier={1.2}>
            ·
          </Text>
        )}
      </View>
      <Text style={styles.progressLabel} maxFontSizeMultiplier={1.3}>
        {label}
      </Text>
      <Text
        style={[styles.progressValue, reward && styles.progressValueReward]}
        maxFontSizeMultiplier={1.2}>
        {value}
      </Text>
      {onPress ? (
        <ChevronRight size={16} color={colors.textMuted} strokeWidth={2} />
      ) : null}
    </>
  );

  if (!onPress) return <View style={styles.progressRow}>{content}</View>;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}. View friends`}
      onPress={onPress}
      style={({ pressed }) => [styles.progressRow, pressed && styles.progressRowPressed]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space[4], paddingBottom: space[10], gap: space[4] },
  hero: {
    borderRadius: radius.sheet,
    padding: space[5],
    gap: space[3],
    overflow: 'hidden',
  },
  heroBadge: {
    alignSelf: 'flex-start',
    height: 30,
    borderRadius: radius.pill,
    paddingHorizontal: space[3],
    backgroundColor: 'rgba(255,255,255,0.55)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroBadgeText: {
    fontFamily: font.bodySemi,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.2,
    color: colors.green900,
  },
  heroTitle: {
    fontFamily: font.poppinsBold,
    fontSize: 24,
    lineHeight: 31,
    color: colors.green900,
  },
  heroBody: {
    fontFamily: font.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.green900,
    opacity: 0.82,
  },
  codePanel: {
    minHeight: 72,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    paddingHorizontal: space[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
  },
  codeBody: { flex: 1, gap: 2 },
  codeLabel: {
    fontFamily: font.bodySemi,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.2,
    color: colors.textMuted,
  },
  code: {
    fontFamily: font.poppinsBold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: 2,
    color: colors.green900,
  },
  copyButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.green500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareRow: { flexDirection: 'row', gap: space[2] },
  shareButton: {
    flex: 1,
    height: 46,
    borderRadius: radius.button,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  sharePrimary: { backgroundColor: colors.surface },
  shareSecondary: {
    borderWidth: 1.5,
    borderColor: colors.green900,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  sharePrimaryText: {
    fontFamily: font.bodySemi,
    fontSize: 14,
    lineHeight: 20,
    color: colors.green900,
  },
  shareSecondaryText: {
    fontFamily: font.bodySemi,
    fontSize: 14,
    lineHeight: 20,
    color: colors.green900,
  },
  copiedText: {
    alignSelf: 'center',
    fontFamily: font.bodySemi,
    fontSize: 12,
    lineHeight: 16,
    color: colors.green900,
  },
  progressCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: space[4],
    gap: space[2],
  },
  sectionTitle: { ...text.h3 },
  sectionCaption: { ...text.caption },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    minHeight: 44,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  progressRowPressed: { opacity: 0.65 },
  progressIcon: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    backgroundColor: colors.green500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressIconReward: { backgroundColor: colors.yellow500 },
  progressNumber: { ...text.caption, color: colors.surface },
  progressLabel: { ...text.bodyM, flex: 1 },
  progressValue: {
    ...text.bodyM,
    fontFamily: font.bodySemi,
    color: colors.green700,
    fontVariant: ['tabular-nums'],
  },
  progressValueReward: { color: colors.yellow800 },
  howCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: space[4],
    gap: space[3],
  },
  step: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  stepIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.tile,
    backgroundColor: colors.green50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBody: { flex: 1, gap: 1 },
  stepTitle: { ...text.bodyM, fontFamily: font.bodySemi },
  stepCopy: { ...text.caption },
  footnote: { ...text.caption, textAlign: 'center' },
});
