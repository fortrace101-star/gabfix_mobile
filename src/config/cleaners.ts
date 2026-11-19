import { serviceReviews, type ServiceReview } from './reviews';

/**
 * Local cleaner roster for P27a. Replace with `GET /cleaners/{id}` and
 * `GET /cleaners/{id}/reviews` when the cleaner API exists.
 */
export type Cleaner = {
  id: string;
  name: string;
  initials: string;
  rating: number;
  jobsDone: number;
  years: number;
  languages: readonly string[];
  skills: readonly string[];
  /** Services this cleaner can be booked for. */
  serviceSlugs: readonly string[];
  /** Service opened by **Book this cleaner**. */
  primaryServiceSlug: string;
  /** Sample reviews from the shared P21 feed. */
  reviewIds: readonly string[];
};

export const cleaners: readonly Cleaner[] = [
  {
    id: 'rose-nakato',
    name: 'Rose Nakato',
    initials: 'RN',
    rating: 4.9,
    jobsDone: 428,
    years: 6,
    languages: ['English', 'Luganda'],
    skills: ['Deep cleaning', 'Kitchens', 'Move-out cleans', 'Eco products'],
    serviceSlugs: ['home-clean', 'deep-clean', 'move-out-clean'],
    primaryServiceSlug: 'home-clean',
    reviewIds: ['r1', 'r4', 'r7'],
  },
  {
    id: 'grace-achieng',
    name: 'Grace Achieng',
    initials: 'GA',
    rating: 4.8,
    jobsDone: 312,
    years: 5,
    languages: ['English', 'Swahili'],
    skills: ['Office cleaning', 'Shared kitchens', 'Washrooms', 'Restocking'],
    serviceSlugs: ['home-clean', 'office-clean'],
    primaryServiceSlug: 'office-clean',
    reviewIds: ['r5', 'r2', 'r8'],
  },
  {
    id: 'moses-kato',
    name: 'Moses Kato',
    initials: 'MK',
    rating: 4.9,
    jobsDone: 254,
    years: 4,
    languages: ['English', 'Luganda', 'Swahili'],
    skills: ['Deep cleaning', 'Post-renovation', 'Windows', 'Floors'],
    serviceSlugs: ['deep-clean', 'move-out-clean', 'home-clean'],
    primaryServiceSlug: 'deep-clean',
    reviewIds: ['r3', 'r7', 'r6'],
  },
  {
    id: 'sarah-namukasa',
    name: 'Sarah Namukasa',
    initials: 'SN',
    rating: 5,
    jobsDone: 186,
    years: 3,
    languages: ['English', 'Luganda'],
    skills: ['Move-out cleans', 'Cupboards', 'Handover checks', 'Laundry'],
    serviceSlugs: ['move-out-clean', 'home-clean'],
    primaryServiceSlug: 'move-out-clean',
    reviewIds: ['r7', 'r3', 'r9'],
  },
];

export const cleanerById = (id?: string): Cleaner | undefined =>
  cleaners.find((cleaner) => cleaner.id === id);

export const cleanersForService = (slug: string): readonly Cleaner[] =>
  cleaners.filter((cleaner) => cleaner.serviceSlugs.includes(slug));

export const reviewsForCleaner = (cleaner: Cleaner): readonly ServiceReview[] =>
  cleaner.reviewIds
    .map((id) => serviceReviews.find((review) => review.id === id))
    .filter((review): review is ServiceReview => Boolean(review));
