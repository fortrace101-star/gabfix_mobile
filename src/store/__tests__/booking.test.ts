/* eslint-disable @typescript-eslint/no-require-imports */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const STORAGE_KEY = 'gabfix.booking.draft.v1';

type BookingModule = typeof import('@/store/booking');
type StorageModule = typeof import('@react-native-async-storage/async-storage').default;

/**
 * A fresh store instance per test so module state does not leak. `jest.resetModules()` also
 * recreates the AsyncStorage mock, so the test must use the same instance as the store.
 */
const loadStore = async (): Promise<{ store: BookingModule; storage: StorageModule }> => {
  jest.resetModules();
  // The package's jest mock is a CommonJS module object, not an ES default export.
  const storage = require('@react-native-async-storage/async-storage') as unknown as StorageModule;
  const store = require('@/store/booking') as BookingModule;
  await storage.clear();
  return { store, storage };
};

describe('booking draft store', () => {
  it('starts with a sensible default draft for the chosen service', async () => {
    const { store } = await loadStore();
    await store.hydrateBookingDraft();
    store.startDraft('deep-clean');

    expect(store.getBookingDraft()).toEqual({
      serviceSlug: 'deep-clean',
      details: { cleaners: 1, hours: 4, frequency: 'once', materials: false },
      addOns: [],
    });
  });

  it('persists every change so a restart resumes the booking', async () => {
    const { store, storage } = await loadStore();
    await store.hydrateBookingDraft();
    store.startDraft('deep-clean');
    store.patchDetails({ cleaners: 2, materials: true });

    const raw = await storage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw as string).details).toMatchObject({ cleaners: 2, materials: true });
  });

  it('hydrates the draft saved by a previous run', async () => {
    const { store, storage } = await loadStore();
    await storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        serviceSlug: 'office-clean',
        details: { cleaners: 3, hours: 2, frequency: 'weekly', materials: false },
        addOns: ['laundry'],
      }),
    );
    await store.hydrateBookingDraft();

    expect(store.getBookingDraft()?.serviceSlug).toBe('office-clean');
    expect(store.getBookingDraft()?.addOns).toEqual(['laundry']);
    expect(store.getBookingDraft()?.details.frequency).toBe('weekly');
  });

  it('discards corrupt or unrelated stored data instead of crashing', async () => {
    const { store, storage } = await loadStore();
    await storage.setItem(STORAGE_KEY, '{not json');
    await store.hydrateBookingDraft();

    expect(store.getBookingDraft()).toBeNull();
  });

  it('merges detail patches without dropping the other values', async () => {
    const { store } = await loadStore();
    await store.hydrateBookingDraft();
    store.startDraft('deep-clean');
    store.patchDetails({ hours: 3 });
    store.patchDetails({ frequency: 'severalPerWeek' });

    expect(store.getBookingDraft()?.details).toMatchObject({
      cleaners: 1,
      hours: 3,
      frequency: 'severalPerWeek',
      materials: false,
    });
  });

  it('toggles add-ons on and off', async () => {
    const { store } = await loadStore();
    await store.hydrateBookingDraft();
    store.startDraft('deep-clean');

    store.toggleAddOn('inside_oven');
    store.toggleAddOn('laundry');
    expect(store.getBookingDraft()?.addOns).toEqual(['inside_oven', 'laundry']);

    store.toggleAddOn('inside_oven');
    expect(store.getBookingDraft()?.addOns).toEqual(['laundry']);
  });

  it('normalises promo codes and clears an empty one', async () => {
    const { store } = await loadStore();
    await store.hydrateBookingDraft();
    store.startDraft('deep-clean');

    store.setPromoCode(' welcome20 ');
    expect(store.getBookingDraft()?.promoCode).toBe('WELCOME20');

    store.setPromoCode('');
    expect(store.getBookingDraft()?.promoCode).toBeUndefined();
  });

  it('clears the stored draft on reset', async () => {
    const { store, storage } = await loadStore();
    await store.hydrateBookingDraft();
    store.startDraft('deep-clean');
    store.resetDraft();

    expect(store.getBookingDraft()).toBeNull();
    await Promise.resolve();
    expect(await storage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('ignores patches when there is no draft', async () => {
    const { store } = await loadStore();
    await store.hydrateBookingDraft();
    store.patchDetails({ hours: 8 });
    store.toggleAddOn('laundry');

    expect(store.getBookingDraft()).toBeNull();
  });
});
