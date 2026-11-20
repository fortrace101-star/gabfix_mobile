import { KeyRound, ShieldAlert, Smartphone } from 'lucide-react-native';
import { SectionList, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/ui/empty-state';
import { TopBar } from '@/components/ui/top-bar';
import { useLoginActivity, type LoginEvent } from '@/store/login-activity';
import { colors, radius, space, text } from '@/theme';

const labelFor = (event: LoginEvent): string => {
  switch (event.type) {
    case 'sign-in':
      return 'Signed in';
    case 'failed':
      return 'Failed sign-in attempt';
    case 'password-changed':
      return 'Password changed';
    case 'two-factor-on':
      return 'Two-factor turned on';
    case 'two-factor-off':
      return 'Two-factor turned off';
    default:
      return 'Account activity';
  }
};

const iconFor = (event: LoginEvent) => (event.type === 'failed' ? ShieldAlert : event.type === 'sign-in' ? Smartphone : KeyRound);

const timeLabel = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} · ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
};

/** P29c Login activity. */
export default function LoginActivityScreen() {
  const events = useLoginActivity();
  const now = new Date();
  const today = events.filter((event) => new Date(event.atISO).toDateString() === now.toDateString());
  const earlier = events.filter((event) => new Date(event.atISO).toDateString() !== now.toDateString());
  const sections = [
    ...(today.length ? [{ title: 'Today', data: today }] : []),
    ...(earlier.length ? [{ title: 'Earlier', data: earlier }] : []),
  ];

  return (
    <View style={styles.screen}>
      <TopBar title="Login activity" />
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={[styles.content, sections.length === 0 && styles.empty]}
        renderSectionHeader={({ section }) => <Text style={styles.section}>{section.title}</Text>}
        renderItem={({ item }) => {
          const Icon = iconFor(item);
          return (
            <View style={styles.row}>
              <View style={styles.icon}>
                <Icon size={18} color={colors.green700} strokeWidth={2} />
              </View>
              <View style={styles.body}>
                <Text style={styles.title} maxFontSizeMultiplier={1.3}>{labelFor(item)}</Text>
                <Text style={styles.caption} maxFontSizeMultiplier={1.3}>
                  {[item.deviceName ?? 'This device', item.platform, item.approxLocation].filter(Boolean).join(' · ')}
                </Text>
                <Text style={styles.caption} maxFontSizeMultiplier={1.2}>{timeLabel(item.atISO)}</Text>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon={Smartphone}
            title="No sign-ins to show yet"
            body="Recent sign-ins and security changes will appear here."
          />
        }
        ListFooterComponent={
          events.length > 0 ? (
            <Text style={styles.footer} maxFontSizeMultiplier={1.3}>
              Don’t recognise something? Change your password and sign out other devices.
            </Text>
          ) : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space[4], gap: space[2], paddingBottom: space[10] },
  empty: { flexGrow: 1, justifyContent: 'center' },
  section: { ...text.h3, fontSize: 15, marginTop: space[2], marginBottom: space[1] },
  row: { flexDirection: 'row', gap: space[3], backgroundColor: colors.surface, borderRadius: radius.card, padding: space[4], alignItems: 'flex-start' },
  icon: { width: 36, height: 36, borderRadius: radius.input, backgroundColor: colors.green50, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 2 },
  title: { ...text.bodyM, fontFamily: 'Inter_600SemiBold' },
  caption: { ...text.caption, color: colors.textMuted },
  footer: { ...text.caption, color: colors.textMuted, marginTop: space[3], lineHeight: 18 },
});
