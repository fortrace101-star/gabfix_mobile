import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CheckCheck, Paperclip, SendHorizontal } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/empty-state';
import { TopBar } from '@/components/ui/top-bar';
import { clockLabel } from '@/lib/chat';
import {
  closeThread,
  openThread,
  sendMessage,
  type ChatMessage,
  useThread,
} from '@/store/messages';
import { colors, font, radius, space, text } from '@/theme';

type DecoratedMessage = ChatMessage & {
  showTime: boolean;
};

function MessageBubble({ message, initials }: { message: DecoratedMessage; initials: string }) {
  if (message.from === 'system') {
    return (
      <Text style={styles.systemNote} maxFontSizeMultiplier={1.2}>
        {message.text}
      </Text>
    );
  }

  const mine = message.from === 'me';
  return (
    <View style={[styles.messageRow, mine && styles.messageRowMine]}>
      {!mine ? (
        <View style={styles.smallAvatar}>
          <Text style={styles.smallInitials} maxFontSizeMultiplier={1.1}>
            {initials}
          </Text>
        </View>
      ) : null}
      <View style={[styles.messageColumn, mine && styles.messageColumnMine]}>
        <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
          {message.imageUri ? (
            <Image
              source={{ uri: message.imageUri }}
              style={styles.bubbleImage}
              contentFit="cover"
              accessibilityLabel="Attached photo"
            />
          ) : null}
          {message.text ? (
            <Text
              style={[styles.bubbleText, mine && styles.bubbleTextMine]}
              maxFontSizeMultiplier={1.3}>
              {message.text}
            </Text>
          ) : null}
        </View>
        {message.showTime ? (
          <View style={[styles.metaRow, mine && styles.metaRowMine]}>
            <Text style={styles.meta} maxFontSizeMultiplier={1.2}>
              {clockLabel(message.atISO)}
            </Text>
            {mine ? (
              message.status === 'sending' ? (
                <Text style={styles.meta} maxFontSizeMultiplier={1.2}>
                  Sending…
                </Text>
              ) : (
                <View style={styles.sentRow}>
                  <Text style={styles.meta} maxFontSizeMultiplier={1.2}>
                    Sent
                  </Text>
                  <CheckCheck size={12} color={colors.green700} strokeWidth={2} />
                </View>
              )
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

/** P27c thread. Local optimistic send and simulated support replies until WebSocket exists. */
export default function ChatThreadScreen() {
  const params = useLocalSearchParams<{ threadId?: string }>();
  const id = typeof params.threadId === 'string' ? params.threadId : '';
  const thread = useThread(id);
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState('');
  const [inputHeight, setInputHeight] = useState(44);
  const [picking, setPicking] = useState(false);
  const listRef = useRef<FlatList<DecoratedMessage>>(null);

  const threadId = thread?.id;
  useEffect(() => {
    if (!threadId) return;
    openThread(threadId);
    return () => closeThread(threadId);
  }, [threadId]);

  const decorated = useMemo(() => {
    if (!thread) return [];
    return thread.messages.map((message, index) => ({
      ...message,
      showTime:
        index === thread.messages.length - 1 ||
        thread.messages[index + 1]?.from !== message.from,
    }));
  }, [thread]);

  const ordered = useMemo(() => [...decorated].reverse(), [decorated]);
  const latestCount = thread?.messages.length ?? 0;

  useEffect(() => {
    if (latestCount > 0) listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [latestCount]);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/messages' as never);
  };

  if (!thread) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <TopBar title="Conversation" onBack={goBack} />
        <EmptyState
          icon={SendHorizontal}
          title="Conversation not found"
          body="This chat may have moved. Go back to Messages to start a new conversation."
          actionLabel="Back to messages"
          onAction={() => router.replace('/messages' as never)}
        />
      </SafeAreaView>
    );
  }

  const canSend = draft.trim().length > 0;

  const submit = () => {
    if (!canSend) return;
    sendMessage(thread.id, draft);
    setDraft('');
    setInputHeight(44);
  };

  const attach = async () => {
    if (picking) return;
    setPicking(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Photo access needed',
          'Allow photo access in your device settings to attach a photo to this conversation.',
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.5,
        base64: true,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset) return;
      const uri = asset.base64
        ? `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}`
        : asset.uri;
      sendMessage(thread.id, draft, uri);
      setDraft('');
      setInputHeight(44);
    } finally {
      setPicking(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          onPress={goBack}
          style={styles.back}>
          <ArrowLeft size={22} color={colors.text} strokeWidth={2} />
        </Pressable>
        <View style={styles.avatar}>
          <Text style={styles.initials} maxFontSizeMultiplier={1.2}>
            {thread.initials}
          </Text>
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.name} maxFontSizeMultiplier={1.3} numberOfLines={1}>
            {thread.name}
          </Text>
          <Text style={styles.role} maxFontSizeMultiplier={1.2} numberOfLines={1}>
            {thread.role}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}>
        <FlatList
          ref={listRef}
          inverted
          data={ordered}
          keyExtractor={(message) => message.id}
          renderItem={({ item }) => (
            <MessageBubble message={item} initials={thread.initials} />
          )}
          contentContainerStyle={styles.messages}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyThread} maxFontSizeMultiplier={1.3}>
              Send a message to start this conversation.
            </Text>
          }
        />

        {thread.quickReplies?.length ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.quickRow}>
            {thread.quickReplies.map((reply) => (
              <Pressable
                key={reply}
                accessibilityRole="button"
                accessibilityLabel={`Send quick reply: ${reply}`}
                onPress={() => sendMessage(thread.id, reply)}
                style={({ pressed }) => [styles.quickChip, pressed && styles.quickChipPressed]}>
                <Text style={styles.quickText} maxFontSizeMultiplier={1.2}>
                  {reply}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, space[2]) }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Attach a photo"
            accessibilityState={{ busy: picking, disabled: picking }}
            disabled={picking}
            hitSlop={6}
            onPress={() => void attach()}
            style={[styles.attach, picking && styles.attachBusy]}>
            <Paperclip size={20} color={colors.green700} strokeWidth={2} />
          </Pressable>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onContentSizeChange={(event) => {
              const height = event.nativeEvent?.contentSize?.height;
              if (!height) return;
              setInputHeight(Math.min(120, Math.max(44, height + 16)));
            }}
            placeholder="Message…"
            placeholderTextColor={colors.placeholder}
            multiline
            maxLength={1000}
            maxFontSizeMultiplier={1.3}
            accessibilityLabel={`Message ${thread.name}`}
            style={[styles.input, { height: inputHeight }]}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send message"
            accessibilityState={{ disabled: !canSend }}
            disabled={!canSend}
            hitSlop={6}
            onPress={submit}
            style={[styles.send, !canSend && styles.sendDisabled]}>
            <SendHorizontal
              size={20}
              color={canSend ? colors.surface : colors.disabledText}
              strokeWidth={2}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  header: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    paddingHorizontal: space[2],
    paddingBottom: space[2],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  back: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.green100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: font.poppinsSemi,
    fontSize: 14,
    color: colors.green900,
  },
  headerCopy: { flex: 1, gap: 1 },
  name: { ...text.h3, fontSize: 16 },
  role: { ...text.caption },
  messages: {
    paddingHorizontal: space[4],
    paddingVertical: space[4],
    gap: space[2],
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: space[2],
  },
  messageRowMine: { justifyContent: 'flex-end' },
  smallAvatar: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.green100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  smallInitials: {
    fontFamily: font.poppinsSemi,
    fontSize: 10,
    color: colors.green900,
  },
  messageColumn: { maxWidth: '78%', gap: 3, alignItems: 'flex-start' },
  messageColumnMine: { alignItems: 'flex-end' },
  bubble: {
    padding: space[3],
    borderRadius: 18,
  },
  bubbleMine: {
    backgroundColor: colors.green500,
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  bubbleImage: { width: 200, height: 150, borderRadius: 12, marginBottom: 4 },
  bubbleText: { ...text.body, lineHeight: 20 },
  bubbleTextMine: { color: colors.surface },
  attach: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.green50,
  },
  attachBusy: { opacity: 0.5 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 2,
  },
  metaRowMine: { justifyContent: 'flex-end' },
  meta: { ...text.caption, fontSize: 10, lineHeight: 14 },
  sentRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  systemNote: {
    ...text.caption,
    textAlign: 'center',
    paddingHorizontal: space[6],
    paddingVertical: space[2],
  },
  emptyThread: { ...text.bodyM, textAlign: 'center', color: colors.textMuted },
  quickRow: {
    gap: space[2],
    paddingHorizontal: space[3],
    paddingVertical: space[2],
  },
  quickChip: {
    height: 32,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.green100,
    backgroundColor: colors.surface,
    paddingHorizontal: space[3],
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickChipPressed: { backgroundColor: colors.green50 },
  quickText: {
    fontFamily: font.bodyMedium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.green700,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: space[2],
    paddingHorizontal: space[2],
    paddingTop: space[2],
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 22,
    backgroundColor: colors.bg,
    paddingHorizontal: space[4],
    paddingTop: 12,
    paddingBottom: 12,
    fontFamily: font.body,
    fontSize: 16,
    lineHeight: 20,
    color: colors.text,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.green500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { backgroundColor: colors.disabledBg },
});
