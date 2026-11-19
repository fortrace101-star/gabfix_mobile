import type { AuthUser } from '@/lib/api/auth';

export const REFERRAL_REWARD = 10_000;

/** Stable dummy referral code derived from the signed-in customer. */
export const referralCodeFor = (user: AuthUser | null): string => {
  const source = (user?.phone ?? user?.id ?? 'GABFIX').replace(/[^a-z0-9]/gi, '').toUpperCase();
  return `GABFIX${source.slice(-4).padStart(4, '0')}`;
};

export const referralMessage = (code: string): string =>
  `Try Gabfix for home cleaning. Use my code ${code} when you book and we both get UGX ${REFERRAL_REWARD.toLocaleString('en-UG')} in cleaning credit.`;
