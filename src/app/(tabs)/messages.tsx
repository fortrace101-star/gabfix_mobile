import { router } from 'expo-router';
import { MessageCircle } from 'lucide-react-native';
import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/empty-state';
import { useStatusBarStyle } from '@/hooks/use-status-bar-style';
import { inboxTimeLabel, messagePreview } from '@/lib/chat';
import { openThread, type ChatThread, useThreads } from '@/store/messages';
import { colors, font, radius, space, text } from '@/theme';

function ThreadRow({ thread }: { thread: ChatThread }) {
  const last = thread.messages[thread.messages.length - 1];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${thread.name}${thread.unread > 0 ? `, ${thread.unread} unread` : ''}. ${messagePreview(last)}`}
      onPress={() => {
        openThread(thread.id);
        router.push(`/chat/${thread.id}` as never);
      }}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <View style={styles.avatar}>
        <Text style={styles.initials} maxFontSizeMultiplier={1.2}>
          {thread.initials}
        </Text>
      </View>
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text style={styles.name} maxFontSizeMultiplier={1.3} numberOfLines={1}>
            {thread.name}
          </Text>
          <Text style={styles.time} maxFontSizeMultiplier={1.2}>
            {inboxTimeLabel(thread.updatedAtISO)}
          </Text>
        </View>
        <View style={styles.rowBottom}>
          <Text
            style={[styles.preview, thread.unread > 0 && styles.previewUnread]}
            maxFontSizeMultiplier={1.3}
            numberOfLines={1}>
            {messagePreview(last)}
          </Text>
          {thread.unread > 0 ? (
            <View style={styles.unread} accessibilityLabel={`${thread.unread} unread messages`}>
              <Text style={styles.unreadText}>{thread.unread > 9 ? '9+' : thread.unread}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

/** P27c message inbox. Threads and delivery are local until the chat API exists. */
export default function MessagesTab() {
  useStatusBarStyle('dark');
  const threads = useThreads();

  const sorted = useMemo(
    () =>
      [...threads].sort(
        (left, right) =>
          new Date(right.updatedAtISO).getTime() - new Date(left.updatedAtISO).getTime(),
      ),
    [threads],
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title} maxFontSizeMultiplier={1.3}>
          Messages
        </Text>
        <Text style={styles.subtitle} maxFontSizeMultiplier={1.3}>
          Chat with support and your cleaners in one place.
        </Text>
      </View>

      <FlatList
        data={sorted}
        keyExtractor={(thread) => thread.id}
        renderItem={({ item }) => <ThreadRow thread={item} />}
        contentContainerStyle={[styles.list, sorted.length === 0 && styles.listEmpty]}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon={MessageCircle}
            title="No messages yet"
            body="Start a conversation with the support team and we’ll reply here."
            actionLabel="Contact support"
            onAction={() => router.push('/chat/support' as never)}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: space[4],
    paddingTop: space[4],
    paddingBottom: space[3],
    gap: space[1],
  },
  title: { ...text.h1 },
  subtitle: { ...text.body, color: colors.textMuted },
  list: { paddingHorizontal: space[4], paddingBottom: space[6] },
  listEmpty: { flexGrow: 1, justifyContent: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    minHeight: 76,
    paddingVertical: space[3],
  },
  rowPressed: { opacity: 0.75 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.green100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: font.poppinsSemi,
    fontSize: 16,
    color: colors.green900,
  },
  rowBody: { flex: 1, gap: 3 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  name: { ...text.bodyM, fontFamily: font.bodySemi, flex: 1 },
  time: { ...text.caption, color: colors.textMuted },
  rowBottom: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  preview: { ...text.caption, flex: 1 },
  previewUnread: { fontFamily: font.bodySemi, color: colors.text },
  unread: {
    width: 20,
    height: 20,
    borderRadius: radius.pill,
    backgroundColor: colors.yellow500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    fontFamily: font.bodySemi,
    fontSize: 11,
    lineHeight: 15,
    color: colors.green900,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: 60,
  },
});
