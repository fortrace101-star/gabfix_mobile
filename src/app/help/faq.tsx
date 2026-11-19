import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FaqAccordion } from '@/components/help/faq-accordion';
import { Button } from '@/components/ui/button';
import { TopBar } from '@/components/ui/top-bar';
import { faqsForTopic, helpTopicBySlug, helpTopics } from '@/config/help';
import { base, chip, colors, font, radius, space, text } from '@/theme';

/** P22 grouped FAQ list; `?topic=booking` opens directly on one topic. */
export default function FaqScreen() {
  const params = useLocalSearchParams<{ topic?: string }>();
  const initialTopic =
    typeof params.topic === 'string' && helpTopicBySlug(params.topic) ? params.topic : null;
  const [selectedTopic, setSelectedTopic] = useState<string | null>(initialTopic);

  const topics = selectedTopic
    ? helpTopics.filter((topic) => topic.slug === selectedTopic)
    : helpTopics;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <TopBar title="FAQs" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.intro}>
          <Text style={styles.title} maxFontSizeMultiplier={1.3}>
            Frequently asked questions
          </Text>
          <Text style={styles.subtitle} maxFontSizeMultiplier={1.3}>
            Pick a topic or read the questions customers ask most.
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}>
          <Pressable
            accessibilityRole="radio"
            accessibilityLabel="Filter FAQs: All topics"
            accessibilityState={{ checked: selectedTopic === null }}
            aria-checked={selectedTopic === null}
            onPress={() => setSelectedTopic(null)}
            style={[
              chip.pill,
              styles.filter,
              selectedTopic === null && styles.filterSelected,
            ]}>
            <Text
              style={[styles.filterText, selectedTopic === null && styles.filterTextSelected]}
              maxFontSizeMultiplier={1.2}>
              All topics
            </Text>
          </Pressable>
          {helpTopics.map((topic) => {
            const selected = selectedTopic === topic.slug;
            return (
              <Pressable
                key={topic.slug}
                accessibilityRole="radio"
                accessibilityLabel={`Filter FAQs: ${topic.label}`}
                accessibilityState={{ checked: selected }}
                aria-checked={selected}
                onPress={() => setSelectedTopic(topic.slug)}
                style={[chip.pill, styles.filter, selected && styles.filterSelected]}>
                <Text
                  style={[styles.filterText, selected && styles.filterTextSelected]}
                  maxFontSizeMultiplier={1.2}>
                  {topic.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {topics.map((topic) => {
          const topicFaqs = faqsForTopic(topic.slug);
          return (
            <View key={topic.slug} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.3}>
                  {topic.label}
                </Text>
                <Text style={styles.count} maxFontSizeMultiplier={1.2}>
                  {topicFaqs.length} answers
                </Text>
              </View>
              <View style={styles.listCard}>
                {topicFaqs.map((faq, index) => (
                  <FaqAccordion
                    key={faq.id}
                    faq={faq}
                    last={index === topicFaqs.length - 1}
                  />
                ))}
              </View>
            </View>
          );
        })}

        <View style={styles.contactCta}>
          <Text style={styles.contactTitle} maxFontSizeMultiplier={1.3}>
            Still need a hand?
          </Text>
          <Text style={styles.contactCaption} maxFontSizeMultiplier={1.3}>
            Call, WhatsApp or email the support team. We are open 7 days a week.
          </Text>
          <Button
            label="Contact support"
            variant="secondary"
            onPress={() => router.push('/help/contact' as Href)}
          />
        </View>
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
  filters: { gap: space[2] },
  filter: {
    height: 34,
    borderColor: colors.border,
    paddingHorizontal: space[3],
  },
  filterSelected: {
    backgroundColor: colors.green500,
    borderColor: colors.green500,
  },
  filterText: {
    ...text.caption,
    fontFamily: font.bodySemi,
    color: colors.textMuted,
  },
  filterTextSelected: { color: colors.surface },
  section: { gap: space[3] },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[2],
  },
  sectionTitle: { ...text.h3 },
  count: { ...text.caption },
  listCard: { ...base.card, padding: 0, overflow: 'hidden' },
  contactCta: {
    borderRadius: radius.card,
    backgroundColor: colors.green50,
    padding: space[4],
    gap: space[2],
  },
  contactTitle: { ...text.h3, color: colors.green900 },
  contactCaption: { ...text.body, color: colors.green700, lineHeight: 21 },
});
