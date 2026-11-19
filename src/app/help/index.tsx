import { router, type Href } from 'expo-router';
import { ChevronRight, CircleHelp, Search } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ContactOptions } from '@/components/help/contact-options';
import { FaqAccordion } from '@/components/help/faq-accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TopBar } from '@/components/ui/top-bar';
import { helpTopics, searchFaqs, topFaqs } from '@/config/help';
import { base, colors, font, radius, shadow, space, text } from '@/theme';

/** P22 Help centre: FAQ search, top questions, topic grid and contact options. */
export default function HelpCentreScreen() {
  const [query, setQuery] = useState('');
  const trimmedQuery = query.trim();
  const results = searchFaqs(query);
  const showingSearch = trimmedQuery.length > 0;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <TopBar title="Help centre" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}>
        <View style={styles.intro}>
          <Text style={styles.title} maxFontSizeMultiplier={1.3}>
            How can we help?
          </Text>
          <Text style={styles.subtitle} maxFontSizeMultiplier={1.3}>
            Search the answers customers ask for most, or talk to a person.
          </Text>
        </View>

        <Input
          leftIcon={Search}
          value={query}
          onChangeText={setQuery}
          placeholder="Search help and FAQs"
          accessibilityLabel="Search help and FAQs"
          returnKeyType="search"
        />

        {showingSearch ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.3}>
                Search results
              </Text>
              <Text style={styles.resultCount} maxFontSizeMultiplier={1.2}>
                {results.length} {results.length === 1 ? 'answer' : 'answers'}
              </Text>
            </View>

            {results.length > 0 ? (
              <View style={styles.listCard}>
                {results.map((faq, index) => (
                  <FaqAccordion key={faq.id} faq={faq} last={index === results.length - 1} />
                ))}
              </View>
            ) : (
              <View style={[base.card, styles.noResults]}>
                <View style={styles.noResultsIcon}>
                  <CircleHelp size={26} color={colors.green700} strokeWidth={2} />
                </View>
                <Text style={styles.noResultsTitle} maxFontSizeMultiplier={1.3}>
                  No answers for “{trimmedQuery}”
                </Text>
                <Text style={styles.noResultsCaption} maxFontSizeMultiplier={1.3}>
                  Try a shorter word like “refund”, “price” or “cancel”, or ask the support team
                  directly.
                </Text>
                <Button
                  label="Contact support"
                  variant="secondary"
                  onPress={() => router.push('/help/contact' as Href)}
                />
              </View>
            )}
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.3}>
                  Top questions
                </Text>
                <Pressable
                  accessibilityRole="link"
                  accessibilityLabel="See all FAQs"
                  hitSlop={8}
                  onPress={() => router.push('/help/faq' as Href)}
                  style={styles.link}>
                  <Text style={styles.linkText} maxFontSizeMultiplier={1.2}>
                    See all
                  </Text>
                  <ChevronRight size={14} color={colors.green700} strokeWidth={2} />
                </Pressable>
              </View>
              <View style={styles.listCard}>
                {topFaqs.map((faq, index) => (
                  <FaqAccordion key={faq.id} faq={faq} last={index === topFaqs.length - 1} />
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.3}>
                  Browse by topic
                </Text>
              </View>
              <View style={styles.grid}>
                {helpTopics.map((topic) => {
                  const Icon = topic.icon;
                  return (
                    <Pressable
                      key={topic.slug}
                      accessibilityRole="button"
                      accessibilityLabel={`${topic.label}: ${topic.blurb}`}
                      onPress={() =>
                        router.push({
                          pathname: '/help/faq',
                          params: { topic: topic.slug },
                        } as Href)
                      }
                      style={({ pressed }) => [styles.topicTile, pressed && styles.pressed]}>
                      <Icon size={28} color={colors.green700} strokeWidth={1.8} />
                      <Text style={styles.topicLabel} maxFontSizeMultiplier={1.3}>
                        {topic.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <ContactOptions />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space[4], paddingBottom: space[10], gap: space[5] },
  intro: { gap: space[2] },
  title: { ...text.h1 },
  subtitle: { ...text.body, color: colors.textMuted, lineHeight: 21 },
  section: { gap: space[3] },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[2],
  },
  sectionTitle: { ...text.h3 },
  resultCount: { ...text.caption },
  link: { flexDirection: 'row', alignItems: 'center', gap: 1 },
  linkText: {
    ...text.caption,
    color: colors.green700,
    fontFamily: font.bodySemi,
  },
  listCard: { ...base.card, padding: 0, overflow: 'hidden' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: space[3],
  },
  topicTile: {
    width: '48%',
    height: 96,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...shadow.card,
  },
  pressed: { opacity: 0.65 },
  topicLabel: { ...text.bodyM, fontFamily: font.bodySemi },
  noResults: { alignItems: 'center', gap: space[2] },
  noResultsIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.green50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noResultsTitle: { ...text.h3, textAlign: 'center' },
  noResultsCaption: { ...text.caption, textAlign: 'center', lineHeight: 19 },
});
