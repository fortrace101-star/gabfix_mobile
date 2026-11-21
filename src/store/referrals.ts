import { useMemo } from 'react';

import type { Referral } from '@/lib/referral';

/**
 * Seeded referral list. The referral API does not exist yet, so the journey is
 * demo data; swap this for a fetch when the backend lands (S1 16.5).
 */
const seededReferrals: readonly Referral[] = [
  {
    id: 'ref-1',
    name: 'Sarah N.',
    phoneMasked: '077•••••21',
    stage: 'rewards',
    joinedAtISO: '2026-09-02T09:20:00.000Z',
    rewardUGX: 10_000,
  },
  {
    id: 'ref-2',
    name: 'Brian K.',
    phoneMasked: '070•••••84',
    stage: 'booked',
    joinedAtISO: '2026-10-14T16:05:00.000Z',
  },
  {
    id: 'ref-3',
    name: 'Aisha M.',
    phoneMasked: '075•••••03',
    stage: 'joined',
    joinedAtISO: '2026-11-01T11:40:00.000Z',
  },
  {
    id: 'ref-4',
    name: 'Peter O.',
    phoneMasked: '078•••••66',
    stage: 'invited',
    joinedAtISO: '2026-11-18T08:15:00.000Z',
  },
];

/** All referrals for the signed-in customer (seeded until an API is connected). */
export function useReferrals(): readonly Referral[] {
  return useMemo(() => seededReferrals, []);
}
