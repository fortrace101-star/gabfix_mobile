import type { ChatMessage } from '@/store/messages';

/** HH:mm for a chat timestamp. */
export const clockLabel = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/** Compact inbox timestamp: time today, Yesterday, then a short date. */
export const inboxTimeLabel = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) return clockLabel(iso);

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate()
  ) {
    return 'Yesterday';
  }

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
};

/** Last-message preview with a local sending state. */
export const messagePreview = (message: ChatMessage | undefined): string => {
  if (!message) return 'No messages yet';
  const prefix = message.from === 'me' ? 'You: ' : '';
  if (message.status === 'sending') return `${prefix}${message.text} · Sending…`;
  return `${prefix}${message.text}`;
};
