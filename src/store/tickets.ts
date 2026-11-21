import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

/**
 * P22a/P22b support tickets. There is no support API yet, so tickets live on the device
 * (`gabfix.tickets.v1`) and need `POST /support/tickets` to sync when the backend lands.
 */
const STORAGE_KEY = 'gabfix.tickets.v1';

export const TICKET_SUBJECT_MIN = 4;
export const TICKET_SUBJECT_MAX = 80;
export const TICKET_MESSAGE_MIN = 10;
export const TICKET_MESSAGE_MAX = 1_000;
export const TICKET_MAX_SCREENSHOTS = 3;

export type TicketCategory = 'general' | 'booking' | 'payments' | 'account' | 'cleaner' | 'app';
export type TicketStatus = 'open' | 'in_progress' | 'resolved';

export type TicketScreenshot = { id: string; uri: string; bytes: number };

export type Ticket = {
  id: string;
  category: TicketCategory;
  subject: string;
  message: string;
  bookingId?: string;
  /** Files copied into the document directory, never base64 in the store. */
  screenshots: TicketScreenshot[];
  status: TicketStatus;
  createdAtISO: string;
  updatedAtISO: string;
  thread: { from: 'customer' | 'support'; text: string; atISO: string }[];
};

export type TicketInput = {
  category: TicketCategory;
  subject: string;
  message: string;
  bookingId?: string;
  screenshots?: TicketScreenshot[];
};

export type TicketErrors = Partial<Record<'subject' | 'message', string>>;

/** Pure validation shared by the form and the store (S1 16.3). */
export function validateTicket(input: TicketInput): TicketErrors {
  const errors: TicketErrors = {};
  const subject = input.subject.trim();
  const message = input.message.trim();
  if (subject.length < TICKET_SUBJECT_MIN) {
    errors.subject = `Subject must be at least ${TICKET_SUBJECT_MIN} characters.`;
  } else if (subject.length > TICKET_SUBJECT_MAX) {
    errors.subject = `Subject must be ${TICKET_SUBJECT_MAX} characters or fewer.`;
  }
  if (message.length < TICKET_MESSAGE_MIN) {
    errors.message = `Message must be at least ${TICKET_MESSAGE_MIN} characters.`;
  } else if (message.length > TICKET_MESSAGE_MAX) {
    errors.message = `Message must be ${TICKET_MESSAGE_MAX.toLocaleString('en-US')} characters or fewer.`;
  }
  return errors;
}

const nextTicketId = (existing: readonly Ticket[]): string => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const id = `GBT-${String(Math.floor(10000 + Math.random() * 90000))}`;
    if (!existing.some((ticket) => ticket.id === id)) return id;
  }
  return `GBT-${String(Date.now()).slice(-5)}`;
};

type TicketsState = { tickets: Ticket[]; hydrated: boolean };

let state: TicketsState = { tickets: [], hydrated: false };
const listeners = new Set<() => void>();

const getState = () => state;

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const emit = () => listeners.forEach((listener) => listener());

const persist = (tickets: Ticket[]) => {
  void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tickets)).catch(() => undefined);
};

const setTickets = (tickets: Ticket[]) => {
  state = { ...state, tickets };
  emit();
  persist(tickets);
};

/** Called once at boot from the root layout. */
export async function hydrateTickets(): Promise<void> {
  let tickets: Ticket[] = [];
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    if (Array.isArray(parsed)) {
      tickets = parsed.filter((item): item is Ticket =>
        Boolean(item && typeof item === 'object' && (item as Ticket).id),
      );
    }
  } catch {
    tickets = [];
  }
  state = { tickets, hydrated: true };
  emit();
}

export function createTicket(input: TicketInput): Ticket {
  const now = new Date().toISOString();
  const ticket: Ticket = {
    id: nextTicketId(state.tickets),
    category: input.category,
    subject: input.subject.trim(),
    message: input.message.trim(),
    bookingId: input.bookingId,
    screenshots: input.screenshots ?? [],
    status: 'open',
    createdAtISO: now,
    updatedAtISO: now,
    thread: [{ from: 'customer', text: input.message.trim(), atISO: now }],
  };
  setTickets([ticket, ...state.tickets]);
  return ticket;
}

export function markTicketResolved(id: string): void {
  const now = new Date().toISOString();
  setTickets(
    state.tickets.map((ticket) =>
      ticket.id === id
        ? { ...ticket, status: 'resolved' as const, updatedAtISO: now }
        : ticket,
    ),
  );
}

export function useTickets(): Ticket[] {
  return useSyncExternalStore(subscribe, getState, getState).tickets;
}

export function useTicketsHydrated(): boolean {
  return useSyncExternalStore(subscribe, getState, getState).hydrated;
}

const EMPTY: Ticket[] = [];

export function useTicket(id: string | undefined): Ticket | undefined {
  const tickets = useSyncExternalStore(subscribe, getState, getState).tickets;
  if (!id) return undefined;
  return (tickets.length ? tickets : EMPTY).find((ticket) => ticket.id === id);
}
