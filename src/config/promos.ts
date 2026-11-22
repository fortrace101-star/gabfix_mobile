import { pricing } from './pricing';

export type PromoCode = keyof typeof pricing.promos;

export type Promo = {
  code: PromoCode;
  title: string;
  caption: string;
  expiry: string;
  /** Service started when the customer has no draft yet. */
  serviceSlug: string;
  discountLabel: string;
};

/**
 * Dummy P20 promos. The codes are the same ones P12 validates in `pricing.promos`;
 * replace this list with `GET /promos` when the promos API lands.
 */
export const promos: readonly Promo[] = [
  {
    code: 'WELCOME20',
    title: '20% off your first home clean',
    caption: 'New customers · one booking',
    expiry: '31 Dec 2026',
    serviceSlug: 'home-clean',
    discountLabel: '20%',
  },
  {
    code: 'CLEAN10',
    title: '10% off a deep clean',
    caption: 'Any home · one booking',
    expiry: '31 Jan 2027',
    serviceSlug: 'deep-clean',
    discountLabel: '10%',
  },
];
