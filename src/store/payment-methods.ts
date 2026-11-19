import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

import {
  savedCards as seedCards,
  savedMobileMoney as seedMobileMoney,
  type SavedCard,
  type SavedMobileMoney,
} from '@/config/payments';

const STORAGE_KEY = 'gabfix.payment-methods.v1';

type PaymentMethodsState = {
  cards: SavedCard[];
  mobileMoney: SavedMobileMoney[];
  hydrated: boolean;
};

let state: PaymentMethodsState = {
  cards: seedCards,
  mobileMoney: seedMobileMoney,
  hydrated: false,
};

const listeners = new Set<() => void>();

const getState = () => state;

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const persist = (cards: SavedCard[], mobileMoney: SavedMobileMoney[]) => {
  void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ cards, mobileMoney })).catch(
    () => undefined,
  );
};

const setMethods = (cards: SavedCard[], mobileMoney: SavedMobileMoney[]) => {
  state = { ...state, cards, mobileMoney };
  listeners.forEach((listener) => listener());
  persist(cards, mobileMoney);
};

const isCard = (value: unknown): value is SavedCard => {
  const card = value as SavedCard | null;
  return Boolean(card && card.id && card.last4 && card.expiry);
};

const isMobileMoney = (value: unknown): value is SavedMobileMoney => {
  const method = value as SavedMobileMoney | null;
  return Boolean(
    method &&
      method.id &&
      method.phone &&
      (method.provider === 'MTN' || method.provider === 'Airtel'),
  );
};

/** Called once at boot from the root layout. */
export async function hydratePaymentMethods(): Promise<void> {
  let cards = seedCards;
  let mobileMoney = seedMobileMoney;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = raw
      ? (JSON.parse(raw) as { cards?: unknown; mobileMoney?: unknown } | null)
      : null;
    if (parsed && Array.isArray(parsed.cards) && Array.isArray(parsed.mobileMoney)) {
      cards = parsed.cards.filter(isCard);
      mobileMoney = parsed.mobileMoney.filter(isMobileMoney);
    }
  } catch {
    cards = seedCards;
    mobileMoney = seedMobileMoney;
  }
  state = { cards, mobileMoney, hydrated: true };
  listeners.forEach((listener) => listener());
}

export function useSavedCards(): SavedCard[] {
  return useSyncExternalStore(subscribe, () => getState().cards, () => getState().cards);
}

export function useSavedMobileMoney(): SavedMobileMoney[] {
  return useSyncExternalStore(
    subscribe,
    () => getState().mobileMoney,
    () => getState().mobileMoney,
  );
}

export function usePaymentMethodsHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => getState().hydrated,
    () => getState().hydrated,
  );
}

export function addCard(last4: string, expiry: string): SavedCard {
  const card: SavedCard = {
    id: `card-visa-${Date.now()}`,
    brand: 'Visa',
    last4,
    expiry,
  };
  setMethods([...state.cards, card], state.mobileMoney);
  return card;
}

export function addMobileMoney(provider: SavedMobileMoney['provider'], phone: string): SavedMobileMoney {
  const method: SavedMobileMoney = {
    id: `momo-${provider.toLowerCase()}-${Date.now()}`,
    provider,
    phone,
  };
  setMethods(state.cards, [...state.mobileMoney, method]);
  return method;
}

/** Removes a saved card or Mobile Money number. Cash is never stored here. */
export function removePaymentMethod(id: string): void {
  const cards = state.cards.filter((card) => card.id !== id);
  const mobileMoney = state.mobileMoney.filter((method) => method.id !== id);
  if (cards.length === state.cards.length && mobileMoney.length === state.mobileMoney.length) {
    return;
  }
  setMethods(cards, mobileMoney);
}
