import { router, type Href } from 'expo-router';
import { CheckCircle2, ClipboardList, MessageSquare } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ContactOptions } from '@/components/help/contact-options';
import { Button } from '@/components/ui/button';
import { TopBar } from '@/components/ui/top-bar';
import { base, colors, font, radius, space, text } from '@/theme';

const checklist = [
  {
    icon: ClipboardList,
    title: 'Your booking ID',
    caption: 'It is at the top of the booking details or on your receipt.',
  },
  {
    icon: MessageSquare,
    title: 'What happened',
    caption: 'Include the service date and time, and what went wrong.',
  },
  {
    icon: CheckCircle2,
    title: 'What you need',
    caption: 'Tell us if you need a re-clean, a refund or a follow-up.',
  },
];

/** P22 Contact support. Chat opens the local P27c support thread. */
export default function ContactScreen() {
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <TopBar title="Contact support" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.intro}>
          <Text style={styles.title} maxFontSizeMultiplier={1.3}>
            We are here 7 days a week.
          </Text>
          <Text style={styles.subtitle} maxFontSizeMultiplier={1.3}>
            For an active booking, calling or messaging WhatsApp is the quickest way to reach the
            support team.
          </Text>
        </View>

        <ContactOptions heading="Choose how to reach us" />

        <View style={[base.card, styles.checklistCard]}>
          <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.3}>
            Help us fix it faster
          </Text>
          {checklist.map((item) => {
            const Icon = item.icon;
            return (
              <View key={item.title} style={styles.checkRow}>
                <View style={styles.checkIcon}>
                  <Icon size={18} color={colors.green700} strokeWidth={2} />
                </View>
                <View style={styles.checkBody}>
                  <Text style={styles.checkTitle} maxFontSizeMultiplier={1.3}>
                    {item.title}
                  </Text>
                  <Text style={styles.checkCaption} maxFontSizeMultiplier={1.3}>
                    {item.caption}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <Button
          label="Read the FAQs"
          variant="secondary"
          onPress={() => router.push('/help/faq' as Href)}
        />

        <Text style={styles.footnote} maxFontSizeMultiplier={1.2}>
          In-app chat is open 7 days a week. Calls, WhatsApp and email reach the same support team.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space[4], paddingBottom: space[10], gap: space[4] },
  intro: { gap: space[2] },
  title: { ...text.h1 },
  subtitle: { ...text.body, color: colors.textMuted, lineHeight: 21 },
  checklistCard: { gap: space[3] },
  sectionTitle: { ...text.h3 },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space[3] },
  checkIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.tile,
    backgroundColor: colors.green50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBody: { flex: 1, gap: 2 },
  checkTitle: {
    ...text.bodyM,
    fontFamily: font.bodySemi,
    color: colors.text,
  },
  checkCaption: { ...text.caption, lineHeight: 19 },
  footnote: { ...text.caption, textAlign: 'center', lineHeight: 18 },
});
