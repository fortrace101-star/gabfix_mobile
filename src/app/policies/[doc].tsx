import { router, useLocalSearchParams } from 'expo-router';
import { Check } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TopBar } from '@/components/ui/top-bar';
import { policyBySlug } from '@/config/policies';
import { colors, font, radius, shadow, space, text } from '@/theme';

/** P23 Terms, Privacy and Payment/refund policy. */
export default function PolicyScreen() {
  const params = useLocalSearchParams<{ doc?: string }>();
  const doc = policyBySlug(typeof params.doc === 'string' ? params.doc : undefined);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <TopBar title={doc.title} onBack={() => router.back()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.summary}>
          <Text style={styles.summaryTitle} maxFontSizeMultiplier={1.3}>
            Summary in plain words
          </Text>
          {doc.summary.map((line) => (
            <View key={line} style={styles.summaryRow}>
              <View style={styles.check}>
                <Check size={13} color={colors.green700} strokeWidth={3} />
              </View>
              <Text style={styles.summaryText} maxFontSizeMultiplier={1.3}>
                {line}
              </Text>
            </View>
          ))}
          <Text style={styles.updated} maxFontSizeMultiplier={1.2}>
            Last updated {doc.updated}
          </Text>
        </View>

        <View style={styles.doc}>
          {doc.sections.map((section) => (
            <View key={section.heading} style={styles.section}>
              <Text style={styles.heading} maxFontSizeMultiplier={1.3}>
                {section.heading}
              </Text>
              {section.body.map((paragraph) => (
                <Text key={paragraph} style={styles.paragraph} maxFontSizeMultiplier={1.3}>
                  {paragraph}
                </Text>
              ))}
            </View>
          ))}
        </View>

        <Text style={styles.footer} maxFontSizeMultiplier={1.2}>
          This {doc.title.toLowerCase()} applies to the Gabfix app and the cleaning services booked
          through it.
        </Text>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Contact support about this policy"
          hitSlop={8}
          onPress={() => router.push('/help/contact' as never)}
          style={styles.contactFooter}>
          <Text style={styles.contactFooterText} maxFontSizeMultiplier={1.3}>
            Questions about this policy? <Text style={styles.contactFooterLink}>Contact support</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space[4], paddingBottom: space[10], gap: space[4] },
  summary: {
    backgroundColor: colors.green50,
    borderRadius: radius.card,
    padding: space[4],
    gap: space[2],
  },
  summaryTitle: { ...text.h3, color: colors.green900 },
  summaryRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space[2] },
  check: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  summaryText: { ...text.body, color: colors.green900, flex: 1 },
  updated: { ...text.caption, color: colors.green700, marginTop: space[1] },
  doc: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: space[4],
    gap: space[5],
    ...shadow.card,
  },
  section: { gap: space[2] },
  heading: { ...text.h3, color: colors.text, fontFamily: font.headingSemi },
  paragraph: { ...text.body, color: colors.text, lineHeight: 22 },
  footer: { ...text.caption, color: colors.textMuted, textAlign: 'center' },
  contactFooter: { alignSelf: 'center', minHeight: 44, justifyContent: 'center', paddingHorizontal: space[2] },
  contactFooterText: { ...text.caption, color: colors.textMuted, textAlign: 'center' },
  contactFooterLink: { color: colors.green700, fontFamily: font.bodySemi, textDecorationLine: 'underline' },
});
