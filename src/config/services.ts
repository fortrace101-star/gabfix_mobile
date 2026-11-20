import { hourlyRate, pricing } from './pricing';

/**
 * Dummy service catalogue. Replace with `GET /services` when the catalogue API lands;
 * the order flow only depends on the slug and display name.
 */
export type ServiceCategoryId = 'home' | 'property';

export type ServiceCategory = {
  id: ServiceCategoryId;
  label: string;
  caption: string;
};

/** P6 chip bar and P4 category rows. Replace with the `/services` categories when available. */
export const serviceCategories: readonly ServiceCategory[] = [
  { id: 'home', label: 'Home cleaning', caption: 'Regular and deep cleans' },
  { id: 'property', label: 'Property and office', caption: 'Workspaces and move-outs' },
];

export type Service = {
  slug: string;
  name: string;
  tagline: string;
  tag?: string;
  category: ServiceCategoryId;
  /** Remote image for catalogue cards/search rows (`GET /services`, Open item 18). */
  cardImage?: string;
  /** Area-specific image override from an area-scoped catalogue request. */
  areaImage?: string;
};

export const services: readonly Service[] = [
  {
    slug: 'home-clean',
    name: 'Home cleaning',
    tagline: 'Floors, surfaces, bathrooms and kitchens',
    tag: 'Popular',
    category: 'home',
  },
  {
    slug: 'deep-clean',
    name: 'Deep cleaning',
    tagline: 'A top-to-bottom reset for your home',
    category: 'home',
  },
  {
    slug: 'office-clean',
    name: 'Office cleaning',
    tagline: 'Desks, meeting rooms and shared kitchens',
    category: 'property',
  },
  {
    slug: 'move-out-clean',
    name: 'Move-in / move-out',
    tagline: 'Handover-ready cleaning',
    category: 'property',
  },
];

/** Lowest hourly rate in the pricing table, shown as "From UGX …/hr". */
export const fromHourly = hourlyRate(pricing.minimumHours);

export const serviceBySlug = (slug?: string): Service | undefined =>
  services.find((service) => service.slug === slug);

export const servicesByCategory = (category: ServiceCategoryId): readonly Service[] =>
  services.filter((service) => service.category === category);
