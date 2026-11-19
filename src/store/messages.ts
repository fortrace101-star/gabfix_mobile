import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'gabfix.messages.v1';

export type ChatSender = 'me' | 'them' | 'system';
export type ChatMessageStatus = 'sending' | 'sent';

export type ChatMessage = {
  id: string;
  text: string;
  atISO: string;
  from: ChatSender;
  /** Only used on outgoing messages. */
  status?: ChatMessageStatus;
};

export type ChatThread = {
  id: string;
  name: string;
  initials: string;
  role: string;
  kind: 'support' | 'cleaner';
  unread: number;
  updatedAtISO: string;
  messages: ChatMessage[];
  /** P27c: shown above the composer on support threads. */
  quickReplies?: string[];
};

type MessagesState = {
  threads: ChatThread[];
  hydrated: boolean;
};

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

/** Local demo threads until the chat/thread API exists. */
const seedThreads = (): ChatThread[] => [
  {
    id: 'support',
    name: 'Gabfix Support',
    initials: 'GS',
    role: 'Support team',
    kind: 'support',
    unread: 2,
    updatedAtISO: minutesAgo(18),
    quickReplies: [
      'I need help with a booking',
      'I have a payment question',
      'Can I reschedule?',
    ],
    messages: [
      {
        id: 'support-1',
        text: 'Hi! You’re chatting with Gabfix support.',
        atISO: minutesAgo(34),
        from: 'them',
        status: 'sent',
      },
      {
        id: 'support-2',
        text: 'Tell us what you need and we’ll take it from here.',
        atISO: minutesAgo(18),
        from: 'them',
        status: 'sent',
      },
    ],
  },
  {
    id: 'rose-nakato',
    name: 'Rose Nakato',
    initials: 'RN',
    role: 'Your cleaner',
    kind: 'cleaner',
    unread: 0,
    updatedAtISO: minutesAgo(180),
    messages: [
      {
        id: 'rose-1',
        text: 'Hi, I’m looking forward to your clean tomorrow. Let me know if the gate code changes.',
        atISO: minutesAgo(240),
        from: 'them',
        status: 'sent',
      },
      {
        id: 'rose-2',
        text: 'Thank you! The gate code is still 1234.',
        atISO: minutesAgo(180),
        from: 'me',
        status: 'sent',
      },
    ],
  },
];

let state: MessagesState = { threads: seedThreads(), hydrated: false };
let activeThreadId: string | null = null;
let messageCounter = 0;

const listeners = new Set<() => void>();

const getState = () => state;

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const persist = (threads: ChatThread[]) => {
  void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(threads)).catch(() => undefined);
};

const setThreads = (threads: ChatThread[]) => {
  state = { ...state, threads };
  listeners.forEach((listener) => listener());
  persist(threads);
};

const nextMessageId = () => {
  messageCounter += 1;
  return `msg-${Date.now()}-${messageCounter}`;
};

const isMessage = (value: unknown): value is ChatMessage => {
  const message = value as ChatMessage | null;
  return Boolean(
    message &&
      message.id &&
      typeof message.text === 'string' &&
      (message.from === 'me' || message.from === 'them' || message.from === 'system') &&
      typeof message.atISO === 'string',
  );
};

const normalizeThread = (value: unknown): ChatThread | null => {
  const thread = value as ChatThread | null;
  if (
    !thread ||
    !thread.id ||
    !thread.name ||
    !thread.initials ||
    (thread.kind !== 'support' && thread.kind !== 'cleaner') ||
    !Array.isArray(thread.messages)
  ) {
    return null;
  }

  return {
    ...thread,
    role: thread.role || (thread.kind === 'support' ? 'Support team' : 'Your cleaner'),
    unread: typeof thread.unread === 'number' && thread.unread > 0 ? thread.unread : 0,
    updatedAtISO:
      typeof thread.updatedAtISO === 'string' ? thread.updatedAtISO : new Date().toISOString(),
    messages: thread.messages.filter(isMessage).map((message) => ({
      ...message,
      status: 'sent',
    })),
    quickReplies:
      thread.kind === 'support' && Array.isArray(thread.quickReplies)
        ? thread.quickReplies.filter((reply): reply is string => typeof reply === 'string')
        : undefined,
  };
};

/** Called once at boot from the root layout. */
export async function hydrateMessages(): Promise<void> {
  let threads = seedThreads();
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    if (Array.isArray(parsed)) {
      const stored = parsed
        .map(normalizeThread)
        .filter((thread): thread is ChatThread => Boolean(thread));
      if (stored.length > 0) threads = stored;
    }
  } catch {
    threads = seedThreads();
  }
  state = { threads, hydrated: true };
  listeners.forEach((listener) => listener());
}

export function useThreads(): ChatThread[] {
  return useSyncExternalStore(subscribe, () => getState().threads, () => getState().threads);
}

export function useThread(id: string): ChatThread | undefined {
  return useSyncExternalStore(
    subscribe,
    () => getState().threads.find((thread) => thread.id === id),
    () => getState().threads.find((thread) => thread.id === id),
  );
}

export function useMessagesHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => getState().hydrated,
    () => getState().hydrated,
  );
}

export function markThreadRead(id: string): void {
  const thread = state.threads.find((item) => item.id === id);
  if (!thread || thread.unread === 0) return;
  setThreads(
    state.threads.map((item) => (item.id === id ? { ...item, unread: 0 } : item)),
  );
}

/** Marks a thread as open so a simulated reply does not raise an unread badge. */
export function openThread(id: string): void {
  activeThreadId = id;
  markThreadRead(id);
}

export function closeThread(id: string): void {
  if (activeThreadId === id) activeThreadId = null;
}

const supportReply = (text: string): string => {
  if (/pay|refund|charge|invoice/i.test(text)) {
    return 'I can help with that. Share your booking ID and I’ll check the payment with the finance team.';
  }
  if (/reschedul|cancel|change/i.test(text)) {
    return 'You can reschedule or cancel from the booking details up to 24 hours before the visit. Send me the booking ID if you’d like me to check it.';
  }
  if (/cleaner|late|where|arriv/i.test(text)) {
    return 'Let me check on your cleaner and the booking status. I’ll reply here as soon as I have an update.';
  }
  return 'Thanks for the details. A support agent is reviewing this and will reply here shortly.';
};

const appendMessage = (threadId: string, message: ChatMessage, unread: number) => {
  const thread = state.threads.find((item) => item.id === threadId);
  if (!thread) return;
  setThreads(
    state.threads.map((item) =>
      item.id === threadId
        ? {
            ...item,
            unread,
            updatedAtISO: message.atISO,
            messages: [...item.messages, message],
          }
        : item,
    ),
  );
};

const markMessageSent = (threadId: string, messageId: string) => {
  const thread = state.threads.find((item) => item.id === threadId);
  if (!thread?.messages.some((message) => message.id === messageId)) return;
  setThreads(
    state.threads.map((item) =>
      item.id === threadId
        ? {
            ...item,
            messages: item.messages.map((message) =>
              message.id === messageId ? { ...message, status: 'sent' } : message,
            ),
          }
        : item,
    ),
  );
};

/** Optimistic send; the demo confirms locally and support replies after a short delay. */
export function sendMessage(threadId: string, rawText: string): void {
  const text = rawText.trim();
  const thread = state.threads.find((item) => item.id === threadId);
  if (!text || !thread) return;

  const atISO = new Date().toISOString();
  const message: ChatMessage = {
    id: nextMessageId(),
    text,
    atISO,
    from: 'me',
    status: 'sending',
  };
  appendMessage(threadId, message, 0);

  setTimeout(() => markMessageSent(threadId, message.id), 550);

  if (thread.kind === 'support') {
    const reply = supportReply(text);
    setTimeout(() => {
      appendMessage(
        threadId,
        {
          id: nextMessageId(),
          text: reply,
          atISO: new Date().toISOString(),
          from: 'them',
          status: 'sent',
        },
        activeThreadId === threadId ? 0 : 1,
      );
    }, 1_800);
  }
}
