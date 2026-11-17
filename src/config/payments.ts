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
