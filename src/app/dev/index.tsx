import { router, Redirect, type Href } from 'expo-router';
import { Gift, Info } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/avatar';
import { Button, type ButtonVariant } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CounterStepper } from '@/components/ui/counter-stepper';
import { FilterChip } from '@/components/ui/filter-chip';
import { InlineBanner } from '@/components/ui/inline-banner';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { StatTile } from '@/components/ui/stat-tile';
import { StatusChip } from '@/components/ui/status-chip';
import { showToast } from '@/components/ui/toast';
import { TopBar } from '@/components/ui/top-bar';
import { colors, space, text } from '@/theme';

const variants: ButtonVariant[] = [
  'primary',
  'onGreen',
  'secondary',
  'ghost',
  'destructive',
  'dangerGhost',
];

/** Hidden component gallery for visual QA of the shared kit (Phase 1). */
export default function DevGalleryScreen() {
  const [count, setCount] = useState(2);
  const [name, setName] = useState('');
  const [chip, setChip] = useState('all');

  if (!__DEV__) return <Redirect href="/" />;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <TopBar title="Component gallery" onBack={() => router.replace('/' as Href)} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Section title="Buttons">
          <View style={styles.stack}>
            {variants.map((variant) => (
              <Button key={variant} label={variant} variant={variant} />
            ))}
            <Button label="With icon" icon={Gift} />
            <Button label="Loading" loading />
            <Button label="Disabled" disabled />
            <Button label="Small" small />
          </View>
        </Section>

        <Section title="Chips and badges">
          <View style={styles.rowWrap}>
            {['all', 'home', 'office'].map((value) => (
              <FilterChip
                key={value}
                label={value}
                selected={chip === value}
                onPress={() => setChip(value)}
              />
            ))}
          </View>
          <View style={styles.rowWrap}>
            <StatusChip label="Success" tone="success" />
            <StatusChip label="Info" tone="info" />
            <StatusChip label="Warning" tone="warning" />
            <StatusChip label="Error" tone="error" />
            <StatusChip label="Neutral" tone="neutral" />
          </View>
        </Section>

        <Section title="Inputs">
          <View style={styles.stack}>
            <Input label="Full name" value={name} onChangeText={setName} placeholder="Jane Doe" />
            <Input label="With helper" helper="We only use this for your receipt." value="" onChangeText={() => {}} />
            <Input label="With error" error="Enter a valid phone number" value="070" onChangeText={() => {}} />
            <Input label="Multiline" multiline numberOfLines={3} value="" onChangeText={() => {}} inputStyle={styles.multiline} />
          </View>
        </Section>

        <Section title="Counter stepper">
          <Card>
            <CounterStepper label="Bedrooms" hint="Count all rooms with beds" value={count} onChange={setCount} min={1} max={8} />
          </Card>
        </Section>

        <Section title="Surfaces">
          <Card>
            <Text style={styles.body}>Default card with 16 dp padding.</Text>
          </Card>
          <View style={styles.statsRow}>
            <StatTile label="Bookings" value={12} />
            <StatTile label="Saved" value={3} />
          </View>
          <View style={styles.avatars}>
            <Avatar name="Sarah Nakato" size={40} />
            <Avatar name="Brian Okello" size={52} />
            <Avatar size={40} />
          </View>
        </Section>

        <Section title="Banners">
          <InlineBanner variant="info" title="Heads up" message="Prices include VAT." />
          <InlineBanner variant="success" message="Payment received." />
          <InlineBanner variant="warning" message="Your cleaner is running late." icon={Info} />
          <InlineBanner variant="error" title="Payment failed" message="Try another method." actionLabel="Retry" onAction={() => {}} />
        </Section>

        <Section title="Loading">
          <Skeleton style={styles.skeletonLine} />
          <Skeleton style={styles.skeletonBlock} />
        </Section>

        <Section title="Toast">
          <View style={styles.stack}>
            <Button label="Show toast" onPress={() => showToast('Referral code copied')} />
            <Button
              label="Success toast"
              variant="secondary"
              onPress={() => showToast('Booking confirmed', 'success')}
            />
            <Button
              label="Error toast"
              variant="dangerGhost"
              onPress={() => showToast('Could not save changes', 'error')}
            />
          </View>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.3}>
        {title}
      </Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space[4], paddingBottom: space[10], gap: space[6] },
  section: { gap: space[2] },
  sectionTitle: { ...text.caption, color: colors.textMuted },
  sectionBody: { gap: space[3] },
  stack: { gap: space[2] },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  statsRow: { flexDirection: 'row', gap: space[2] },
  avatars: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  body: { ...text.body },
  multiline: { minHeight: 84, textAlignVertical: 'top' },
  skeletonLine: { height: 16, width: '60%' },
  skeletonBlock: { height: 88 },
});
