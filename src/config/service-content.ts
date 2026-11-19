import { services, type Service } from './services';

/**
 * Editorial copy for the P7 service landing page. Dummy content until the catalogue
 * service returns it (`GET /services/{slug}`, Open item 18).
 */
export type FaqItem = { question: string; answer: string };

export type ServiceContent = {
  slug: string;
  intro: string;
  includes: string[];
  excludes: string[];
  faqs: FaqItem[];
  rating: number;
  reviewCount: number;
};

const sharedFaqs: FaqItem[] = [
  {
    question: 'Do I need to buy cleaning products?',
    answer:
      'No. Choose materials at checkout and your cleaner brings mops, cloths and products for every cleaner, every hour.',
  },
  {
    question: 'Can I change or cancel my booking?',
    answer: 'Yes, free of charge up to 24 hours before the start time. Later changes may carry a fee.',
  },
];

export const serviceContent: Record<string, ServiceContent> = {
  'home-clean': {
    slug: 'home-clean',
    intro:
      'A regular clean for the rooms you use every day: floors, surfaces, bathrooms, kitchens and the areas guests see first.',
    includes: [
      'Floors swept and mopped',
      'Surfaces dusted and wiped',
      'Bathrooms scrubbed and disinfected',
      'Kitchen counters and sink',
      'Beds made and bins emptied',
      'Mirrors and glass touched up',
    ],
    excludes: ['Inside cupboards and drawers', 'Inside the fridge or oven', 'Laundry and ironing'],
    faqs: [
      {
        question: 'What should I do before the cleaner arrives?',
        answer:
          'Put away valuables and personal items, and make sure the cleaner can reach the rooms you booked.',
      },
      ...sharedFaqs,
    ],
    rating: 4.8,
    reviewCount: 312,
  },
  'deep-clean': {
    slug: 'deep-clean',
    intro:
      'A top-to-bottom reset for a home that needs more than a surface clean, including the corners a weekly clean skips.',
    includes: [
      'Everything in a regular clean',
      'Skirting boards and door frames',
      'Inside the fridge and oven',
      'Grout and tile scrubbing',
      'Behind and under furniture',
      'Window sills and vents',
    ],
    excludes: ['High-rise exterior windows', 'Mould remediation', 'Pest control'],
    faqs: [
      {
        question: 'How long does a deep clean take?',
        answer:
          'Most homes need four to eight hours with one or two cleaners. Pick the hours at checkout and add cleaners if needed.',
      },
      ...sharedFaqs,
    ],
    rating: 4.9,
    reviewCount: 184,
  },
  'office-clean': {
    slug: 'office-clean',
    intro:
      'Desks, meeting rooms and shared kitchens cleaned outside working hours, with a team that knows an office should look ready by 9.',
    includes: [
      'Desks and shared surfaces',
      'Meeting rooms and reception',
      'Kitchen and coffee stations',
      'Bathrooms restocked and cleaned',
      'Floors vacuumed and mopped',
      'Bins emptied and liners replaced',
    ],
    excludes: ['IT equipment and cabling', 'Exterior windows', 'Waste disposal off site'],
    faqs: [
      {
        question: 'Can you clean after office hours?',
        answer:
          'Yes. Choose a start time after your team leaves and give the security desk the cleaner’s name.',
      },
      ...sharedFaqs,
    ],
    rating: 4.7,
    reviewCount: 96,
  },
  'move-out-clean': {
    slug: 'move-out-clean',
    intro:
      'Handover-ready cleaning for the day you return the keys, so the landlord sees the property at its best.',
    includes: [
      'Everything in a deep clean',
      'Inside all cupboards and wardrobes',
      'Appliance interiors',
      'Balcony and compound sweep',
      'Limescale removal',
      'Final walkthrough checklist',
    ],
    excludes: ['Painting and repairs', 'Furniture removal', 'Garden work'],
    faqs: [
      {
        question: 'Will this pass my landlord’s inspection?',
        answer:
          'It covers the usual handover checklist. Share any specific requirements in the booking notes and we will confirm before the visit.',
      },
      ...sharedFaqs,
    ],
    rating: 4.8,
    reviewCount: 141,
  },
};

export const relatedServices = (slug: string): readonly Service[] =>
  services.filter((service) => service.slug !== slug).slice(0, 3);

export const serviceContentBySlug = (slug?: string): ServiceContent | undefined =>
  slug ? serviceContent[slug] : undefined;
