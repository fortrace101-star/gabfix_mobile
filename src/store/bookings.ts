import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

import type { BookingDetails, BookingLocation, BookingPayment } from '@/lib/pricing';

const STORAGE_KEY = 'gabfix.bookings.v1';

export type BookingStatus = 'upcoming' | 'completed' | 'cancelled';

export type SavedBooking = {
  id: string;
  serviceSlug: string;
  serviceName: string;
  status: BookingStatus;
  createdAtISO: string;
  /** Date of the service (YYYY-MM-DD) when known. */
  dateISO?: string;
  /** Start time (HH:mm) when known. */
  startTime?: string;
  area?: string;
  street?: string;
  propertyType?: string;
  cleaners: number;
  hours: number;
  total: number;
  paid: number;
  balance: number;
  paymentPlan?: string;
  paymentMethod?: string;
  phone?: string;
  contactName?: string;
  /** Assigned cleaner, once assignment exists (P18 “Book same cleaner”). */
  cleanerId?: string;
  cleanerName?: string;
  /** P18: the choices needed to prefill a fresh draft from this booking. */
  rebook?: {
    details: BookingDetails;
    addOns: string[];
    location?: BookingLocation;
    payment?: BookingPayment;
    promoCode?: string;
  };
  /** Set when the customer moved the booking to a new date/time. */
  rescheduledAtISO?: string;
  /** Why the customer cancelled, captured on P16. */
  cancelReason?: string;
  cancelledAtISO?: string;
  /** Deposit refunded on cancellation (UGX). */
  refundAmount?: number;
  /** Late fee charged when cancelling within 24 hours (UGX). */
  lateFee?: number;
};

type BookingsState = {
  bookings: SavedBooking[];
  hydrated: boolean;
};

let state: BookingsState = { bookings: [], hydrated: false };
const listeners = new Set<() => void>();

const getState = () => state;

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const persist = (bookings: SavedBooking[]) => {
  void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(bookings)).catch(() => undefined);
};

const setBookings = (bookings: SavedBooking[]) => {
  state = { ...state, bookings };
  listeners.forEach((listener) => listener());
  persist(bookings);
};

/** Called once at boot from the root layout. */
export async function hydrateBookings(): Promise<void> {
  let bookings: SavedBooking[] = [];
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    if (Array.isArray(parsed)) {
      bookings = parsed.filter((item): item is SavedBooking => Boolean(item && (item as SavedBooking).id));
    }
  } catch {
    bookings = [];
  }
  state = { bookings, hydrated: true };
  listeners.forEach((listener) => listener());
}

export function addBooking(booking: SavedBooking): void {
  if (state.bookings.some((item) => item.id === booking.id)) return;
  setBookings([booking, ...state.bookings]);
}

export function getBookingById(id: string): SavedBooking | undefined {
  return state.bookings.find((item) => item.id === id);
}

export function updateBooking(id: string, patch: Partial<Omit<SavedBooking, 'id'>>): void {
  if (!state.bookings.some((item) => item.id === id)) return;
  setBookings(state.bookings.map((item) => (item.id === id ? { ...item, ...patch } : item)));
}

/** P16 reschedule. The deposit stays; only the date/time move. */
export function rescheduleBooking(
  id: string,
  schedule: { dateISO: string; startTime: string },
): void {
  updateBooking(id, { ...schedule, rescheduledAtISO: new Date().toISOString() });
}

/** P16 cancel. Records the reason and the local refund/late-fee outcome. */
export function cancelBooking(
  id: string,
  details: { reason: string; refundAmount: number; lateFee: number },
): void {
  updateBooking(id, {
    status: 'cancelled',
    cancelledAtISO: new Date().toISOString(),
    cancelReason: details.reason,
    refundAmount: details.refundAmount,
    lateFee: details.lateFee,
  });
}

export function useBookings(): SavedBooking[] {
  return useSyncExternalStore(subscribe, getState, getState).bookings;
}

export function useBookingsHydrated(): boolean {
  return useSyncExternalStore(subscribe, getState, getState).hydrated;
}
