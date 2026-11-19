import { pricing } from './pricing';

/**
 * Payment model (Gabfix_App_Ui_2.md, Section 3.1).
 * Cash can only be collected after the service, never at booking.
 */
export const payments = {
  vatRate: pricing.vatRate,
  deposit: {
    minimumRate: 0.3,
    minimumAmount: 20_000,
    presets: [0.3, 0.5],
    /** A deposit must leave at least this much to collect after the service. */
    minimumBalance: 1_000,
  },
} as const;

export type PaymentTiming = 'full' | 'deposit' | 'afterService';

export const minimumDeposit = (total: number): number =>
  Math.ceil(Math.max(payments.deposit.minimumRate * total, payments.deposit.minimumAmount));

export const isValidDeposit = (total: number, deposit: number): boolean =>
  Number.isFinite(deposit) &&
  deposit >= minimumDeposit(total) &&
  deposit <= total - payments.deposit.minimumBalance;

export const balanceAfterService = (total: number, deposit: number): number =>
  Math.max(total - deposit, 0);

/** Local saved cards until card tokenisation exists. */
export type SavedCard = {
  id: string;
  brand: 'Visa';
  last4: string;
  expiry: string;
};

export const savedCards: SavedCard[] = [
  { id: 'card-visa-4242', brand: 'Visa', last4: '4242', expiry: '09/28' },
  { id: 'card-visa-1881', brand: 'Visa', last4: '1881', expiry: '03/27' },
];

/** Saved Mobile Money numbers. P27b is the single place that edits them. */
export type SavedMobileMoney = {
  id: string;
  provider: 'MTN' | 'Airtel';
  /** 9 digits after +256. */
  phone: string;
};

export const savedMobileMoney: SavedMobileMoney[] = [
  { id: 'momo-mtn-772123456', provider: 'MTN', phone: '772123456' },
  { id: 'momo-airtel-701234567', provider: 'Airtel', phone: '701234567' },
];

export const savedCardById = (id?: string): SavedCard | undefined =>
  savedCards.find((card) => card.id === id);

export const savedCardLabel = (card: SavedCard): string =>
  `${card.brand} ending ${card.last4}`;
