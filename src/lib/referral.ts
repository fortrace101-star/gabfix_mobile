import type { AuthUser } from '@/lib/api/auth';

export const REFERRAL_REWARD = 10_000;

/** Stable dummy referral code derived from the signed-in customer. */
export const referralCodeFor = (user: AuthUser | null): string => {
  const source = (user?.phone ?? user?.id ?? 'GABFIX').replace(/[^a-z0-9]/gi, '').toUpperCase();
  return `GABFIX${source.slice(-4).padStart(4, '0')}`;
};

export const referralMessage = (code: string): string =>
  `Try Gabfix for home cleaning. Use my code ${code} when you book and we both get UGX ${REFERRAL_REWARD.toLocaleString('en-UG')} in cleaning credit.`;

export type ReferralStage = 'invited' | 'joined' | 'booked' | 'rewards';

export const REFERRAL_STAGES: readonly ReferralStage[] = ['invited', 'joined', 'booked', 'rewards'];

export const referralStageMeta: Record<ReferralStage, { title: string; blurb: string }> = {
  invited: { title: 'Friends invited', blurb: 'Everyone you have shared your code with.' },
  joined: { title: 'Joined Gabfix', blurb: 'Friends who created an account with your code.' },
  booked: { title: 'First booking done', blurb: 'Friends who completed their first clean.' },
  rewards: { title: 'Reward earned', blurb: 'Credit you have banked from referrals.' },
};

/** One referred friend. Phones are masked everywhere outside the API (S1 16.5). */
export type Referral = {
  id: string;
  name: string;
  phoneMasked: string;
  stage: ReferralStage;
  joinedAtISO: string;
  rewardUGX?: number;
};

const stageIndex = (stage: ReferralStage): number => REFERRAL_STAGES.indexOf(stage);

/** Funnel counts: each stage includes friends who moved further down the funnel. */
export const stageCounts = (list: readonly Referral[]): Record<ReferralStage, number> => {
  const counts: Record<ReferralStage, number> = { invited: 0, joined: 0, booked: 0, rewards: 0 };
  for (const referral of list) {
    const index = stageIndex(referral.stage);
    for (let i = 0; i <= index; i += 1) counts[REFERRAL_STAGES[i]] += 1;
  }
  return counts;
};

/** Friends to show for a stage row, newest first. */
export const forStage = (list: readonly Referral[], stage: ReferralStage): Referral[] => {
  const index = stageIndex(stage);
  return list
    .filter((referral) => stageIndex(referral.stage) >= index)
    .slice()
    .sort((a, b) => b.joinedAtISO.localeCompare(a.joinedAtISO));
};

/** Credit earned from friends who reached the reward stage. */
export const rewardsTotal = (list: readonly Referral[]): number =>
  list
    .filter((referral) => referral.stage === 'rewards')
    .reduce((total, referral) => total + (referral.rewardUGX ?? REFERRAL_REWARD), 0);
