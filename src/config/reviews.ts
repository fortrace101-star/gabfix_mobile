/**
 * Local review feed for P21. Replace with `GET /reviews?service={slug}&cursor=`
 * when the reviews API lands; the summary still comes from `GET /services/{slug}`.
 */
export type ServiceReview = {
  id: string;
  serviceSlugs: readonly string[];
  name: string;
  initials: string;
  date: string;
  dateISO: string;
  stars: number;
  comment: string;
  cleanerReply?: string;
};

export type RatingBreakdown = {
  stars: 5 | 4 | 3 | 2 | 1;
  count: number;
};

export const serviceReviews: readonly ServiceReview[] = [
  {
    id: 'r1',
    serviceSlugs: ['home-clean', 'deep-clean', 'move-out-clean'],
    name: 'Nuray L.',
    initials: 'NL',
    date: '12 Nov 2026',
    dateISO: '2026-11-12',
    stars: 5,
    comment:
      'Booked the night before and the cleaner arrived early. The kitchen looked brand new and she left a checklist of what was done. The bathroom grout was the biggest surprise, and the floors were still dry when we walked through with the landlord. I would book the same cleaner again without hesitating.',
    cleanerReply:
      'Thank you, Nuray. We passed your note to the team and they were delighted to hear the handover went smoothly.',
  },
  {
    id: 'r2',
    serviceSlugs: ['home-clean', 'office-clean'],
    name: 'Brian O.',
    initials: 'BO',
    date: '4 Nov 2026',
    dateISO: '2026-11-04',
    stars: 5,
    comment: 'Clear pricing, no surprises at the end. We now book the same cleaner every two weeks.',
  },
  {
    id: 'r3',
    serviceSlugs: ['deep-clean', 'move-out-clean'],
    name: 'Sarah K.',
    initials: 'SK',
    date: '28 Oct 2026',
    dateISO: '2026-10-28',
    stars: 4,
    comment:
      'Thorough deep clean and friendly team. Took slightly longer than planned, but they stayed until it was finished.',
    cleanerReply: 'Thanks for the patience, Sarah. We will keep a little extra time in the estimate next visit.',
  },
  {
    id: 'r4',
    serviceSlugs: ['home-clean'],
    name: 'Aisha N.',
    initials: 'AN',
    date: '20 Oct 2026',
    dateISO: '2026-10-20',
    stars: 5,
    comment:
      'The cleaner was careful with the baby’s room and brought her own products. Booking took less than two minutes.',
  },
  {
    id: 'r5',
    serviceSlugs: ['office-clean'],
    name: 'Peter M.',
    initials: 'PM',
    date: '14 Oct 2026',
    dateISO: '2026-10-14',
    stars: 4,
    comment:
      'The team worked around our reception hours and left the meeting rooms ready for the morning. One bin was missed, but the office looked good overall.',
    cleanerReply: 'Noted, Peter. We have added a final bin check to the office checklist.',
  },
  {
    id: 'r6',
    serviceSlugs: ['home-clean', 'deep-clean', 'office-clean', 'move-out-clean'],
    name: 'Daniel K.',
    initials: 'DK',
    date: '2 Oct 2026',
    dateISO: '2026-10-02',
    stars: 5,
    comment: '',
  },
  {
    id: 'r7',
    serviceSlugs: ['deep-clean', 'move-out-clean'],
    name: 'Grace T.',
    initials: 'GT',
    date: '24 Sep 2026',
    dateISO: '2026-09-24',
    stars: 5,
    comment:
      'The move-out clean covered everything the landlord asked for, including inside the cupboards. The final walkthrough checklist was genuinely useful.',
  },
  {
    id: 'r8',
    serviceSlugs: ['office-clean'],
    name: 'Mark S.',
    initials: 'MS',
    date: '12 Sep 2026',
    dateISO: '2026-09-12',
    stars: 5,
    comment:
      'Our desks and kitchen were spotless before the team arrived. We have switched to a weekly office clean.',
    cleanerReply: 'Thanks Mark. The regular team has your office layout and security notes for next time.',
  },
  {
    id: 'r9',
    serviceSlugs: ['home-clean'],
    name: 'Leila A.',
    initials: 'LA',
    date: '30 Aug 2026',
    dateISO: '2026-08-30',
    stars: 3,
    comment:
      'The main rooms were clean, but the balcony was not included as I expected. Support explained the add-on clearly afterwards.',
  },
];

/** Counts behind the P21 distribution bars; they add up to `reviewCount`. */
export const ratingBreakdown: Record<string, readonly RatingBreakdown[]> = {
  'home-clean': [
    { stars: 5, count: 260 },
    { stars: 4, count: 38 },
    { stars: 3, count: 9 },
    { stars: 2, count: 3 },
    { stars: 1, count: 2 },
  ],
  'deep-clean': [
    { stars: 5, count: 170 },
    { stars: 4, count: 10 },
    { stars: 3, count: 2 },
    { stars: 2, count: 1 },
    { stars: 1, count: 1 },
  ],
  'office-clean': [
    { stars: 5, count: 73 },
    { stars: 4, count: 17 },
    { stars: 3, count: 4 },
    { stars: 2, count: 1 },
    { stars: 1, count: 1 },
  ],
  'move-out-clean': [
    { stars: 5, count: 119 },
    { stars: 4, count: 15 },
    { stars: 3, count: 4 },
    { stars: 2, count: 2 },
    { stars: 1, count: 1 },
  ],
};

export const reviewsForService = (slug: string): readonly ServiceReview[] =>
  serviceReviews.filter((review) => review.serviceSlugs.includes(slug));

export const breakdownForService = (slug: string): readonly RatingBreakdown[] =>
  ratingBreakdown[slug] ?? [];
