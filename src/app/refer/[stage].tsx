import { useLocalSearchParams } from 'expo-router';
import { Users } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { TopBar } from '@/components/ui/top-bar';
import {
  forStage,
  REFERRAL_STAGES,
  referralStageMeta,
  type ReferralStage,
} from '@/lib/referral';
import { useReferrals } from '@/store/referrals';
import { ugx } from '@/utils/format';
import { base, colors, font, space, text } from '@/theme';

const isStage = (value: unknown): value is ReferralStage =>
  typeof value === 'string' && (REFERRAL_STAGES as readonly string[]).includes(value);

/** P20a friends behind one referral stage row (S1 16.5). */
export default function ReferralStageScreen() {
  const params = useLocalSearchParams<{ stage?: string }>();
  const stage = isStage(params.stage) ? params.stage : 'invited';
  const meta = referralStageMeta[stage];
  const referrals = useReferrals();
  const list = forStage(referrals, stage);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <TopBar title={meta.title} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.caption} maxFontSizeMultiplier={1.3}>
          {meta.blurb}
        </Text>

        {list.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Nobody here yet"
            body="Share your code and friends will show up as they join and book their first clean."
          />
        ) : (
          <>
            <Text style={styles.count} maxFontSizeMultiplier={1.2}>
              {list.length} {list.length === 1 ? 'friend' : 'friends'}
            </Text>
            <View style={[base.card, styles.list]}>
              {list.map((referral, index) => {
                const joined = new Date(referral.joinedAtISO);
                return (
                  <View key={referral.id}>
                    {index > 0 ? <View style={styles.divider} /> : null}
                    <View
                      accessible
                      accessibilityLabel={`${referral.name}, ${referral.phoneMasked}, ${referralStageMeta[referral.stage].title}`}
                      style={styles.row}>
                      <Avatar name={referral.name} size={40} />
                      <View style={styles.body}>
                        <Text style={styles.name} maxFontSizeMultiplier={1.3}>
                          {referral.name}
                        </Text>
                        <Text style={styles.meta} maxFontSizeMultiplier={1.2}>
                          {referral.phoneMasked} · {referralStageMeta[referral.stage].title} ·{' '}
                          {joined.toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </Text>
                      </View>
                      {stage === 'rewards' ? (
                        <Text style={styles.reward} maxFontSizeMultiplier={1.2}>
                          {ugx(referral.rewardUGX ?? 0)}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        <Text style={styles.footnote} maxFontSizeMultiplier={1.3}>
          Phone numbers are partly hidden to protect your friends’ privacy.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space[4], paddingBottom: space[10], gap: space[3] },
  caption: { ...text.caption, lineHeight: 19 },
  count: { ...text.caption },
  list: { paddingVertical: space[1], paddingHorizontal: space[3] },
  divider: { height: 1, backgroundColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: space[3], paddingVertical: space[3] },
  body: { flex: 1, gap: 2 },
  name: { ...text.bodyM, fontFamily: font.bodySemi },
  meta: { ...text.caption },
  reward: { ...text.bodyM, fontFamily: font.bodySemi, color: colors.green700 },
  footnote: { ...text.caption, textAlign: 'center', lineHeight: 18 },
});
