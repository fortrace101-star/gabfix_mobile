import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

import type { BookingLocation } from '@/lib/pricing';

/**
 * P24 saved address book. `src/config/location-fixtures.ts` seeded the two demo addresses
 * before this store existed; they are used only for the first run, then the customer owns
 * the list.
 */
const STORAGE_KEY = 'gabfix.addresses.v1';

export type AddressLabel = 'Home' | 'Work' | 'Other';

export type SavedAddress = {
  id: string;
  label: AddressLabel;
  street: string;
  landmark?: string;
  access?: string;
  area: string;
  propertyType: BookingLocation['propertyType'];
  lat?: number;
  lng?: number;
  isDefault: boolean;
  createdAtISO: string;
};

export type AddressInput = Omit<SavedAddress, 'id' | 'createdAtISO' | 'isDefault'> & {
  isDefault?: boolean;
};

const seedAddresses = (): SavedAddress[] => [
  {
    id: 'home',
    label: 'Home',
    street: 'Plot 14, Ntinda Road',
    landmark: 'Near Shell petrol station, blue gate',
    area: 'Ntinda',
    propertyType: 'house',
    isDefault: true,
    createdAtISO: '2026-11-17T09:00:00.000Z',
  },
  {
    id: 'work',
    label: 'Work',
    street: '3rd floor, Acacia Mall, Kololo',
    landmark: 'Ask for reception on the third floor',
    area: 'Kololo',
    propertyType: 'office',
    isDefault: false,
    createdAtISO: '2026-11-17T09:00:00.000Z',
  },
];

type AddressesState = {
  addresses: SavedAddress[];
  hydrated: boolean;
};

let state: AddressesState = { addresses: [], hydrated: false };
const listeners = new Set<() => void>();

const getState = () => state;

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const persist = (addresses: SavedAddress[]) => {
  void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(addresses)).catch(() => undefined);
};

const setAddresses = (addresses: SavedAddress[]) => {
  state = { ...state, addresses };
  listeners.forEach((listener) => listener());
  persist(addresses);
};

/** Called once at boot from the root layout. Seeds Home/Work only on the first run. */
export async function hydrateAddresses(): Promise<void> {
  let addresses: SavedAddress[] = [];
  let firstRun = false;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      firstRun = true;
    } else {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        addresses = parsed.filter(
          (item): item is SavedAddress => Boolean(item && (item as SavedAddress).id),
        );
      }
    }
  } catch {
    addresses = [];
  }
  if (firstRun) addresses = seedAddresses();
  state = { addresses, hydrated: true };
  listeners.forEach((listener) => listener());
  if (firstRun) persist(addresses);
}

export const getAddresses = (): SavedAddress[] => state.addresses;

export function getAddressById(id: string): SavedAddress | undefined {
  return state.addresses.find((address) => address.id === id);
}

export function addAddress(input: AddressInput): SavedAddress {
  const id = `addr-${Date.now()}`;
  const makeDefault = input.isDefault === true || state.addresses.length === 0;
  const address: SavedAddress = {
    ...input,
    id,
    isDefault: makeDefault,
    createdAtISO: new Date().toISOString(),
  };
  const next = makeDefault
    ? [address, ...state.addresses.map((item) => ({ ...item, isDefault: false }))]
    : [address, ...state.addresses];
  setAddresses(next);
  return address;
}

export function updateAddress(id: string, patch: Partial<AddressInput>): void {
  setAddresses(
    state.addresses.map((address) => {
      if (address.id === id) return { ...address, ...patch };
      // Only one address can be the default, including when the form sets the flag.
      return patch.isDefault ? { ...address, isDefault: false } : address;
    }),
  );
}

export function setDefaultAddress(id: string): void {
  setAddresses(
    state.addresses.map((address) => ({ ...address, isDefault: address.id === id })),
  );
}

export function deleteAddress(id: string): void {
  const removed = state.addresses.find((address) => address.id === id);
  const remaining = state.addresses.filter((address) => address.id !== id);
  if (removed?.isDefault && remaining.length > 0) {
    remaining[0] = { ...remaining[0], isDefault: true };
  }
  setAddresses(remaining);
}

export function useAddresses(): SavedAddress[] {
  return useSyncExternalStore(subscribe, getState, getState).addresses;
}

export function useAddressesHydrated(): boolean {
  return useSyncExternalStore(subscribe, getState, getState).hydrated;
}
