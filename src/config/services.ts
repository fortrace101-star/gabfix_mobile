import { hourlyRate, pricing } from './pricing';

/**
 * Dummy service catalogue. Replace with `GET /services` when the catalogue API lands;
 * the order flow only depends on the slug and display name.
 */
export type Service = {
  slug: string;
  name: string;
  tagline: string;
  tag?: string;
};

export const services: readonly Service[] = [
  {
    slug: 'home-clean',
    name: 'Home cleaning',
    tagline: 'Floors, surfaces, bathrooms and kitchens',
    tag: 'Popular',
  },
  { slug: 'deep-clean', name: 'Deep cleaning', tagline: 'A top-to-bottom reset for your home' },
  { slug: 'office-clean', name: 'Office cleaning', tagline: 'Desks, meeting rooms and shared kitchens' },
  { slug: 'move-out-clean', name: 'Move-in / move-out', tagline: 'Handover-ready cleaning' },
];

/** Lowest hourly rate in the pricing table, shown as "From UGX …/hr". */
export const fromHourly = hourlyRate(pricing.minimumHours);

export const serviceBySlug = (slug?: string): Service | undefined =>
  services.find((service) => service.slug === slug);
