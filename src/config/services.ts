import { hourlyRate, pricing } from './pricing';
import { serviceCategories } from './service-categories';

/**
 * Bundled catalogue (Workstream H, Section 14.2). Replaced by `GET /services` at the
 * backend stage; the shape below is the API shape, so a service added here shows up on
 * the Services tab, in search and in the booking flow with no screen code changed.
 */
export type Service = {
  slug: string;
  name: string;
  tagline: string;
  categoryId: string;
  subcategoryId?: string;
  pricingMode: 'hourly' | 'quote';
  /** Position in Home > Most popular; the six lowest ranks are shown. */
  popularRank?: number;
  tag?: string;
  /** Remote image for catalogue cards/search rows (`GET /services`, Open item 18). */
  cardImage?: string;
  /** Overrides the category's form. */
  formSchemaId?: string;
  active: boolean;
};

export const services: readonly Service[] = [
  // Cleaning
  {
    slug: 'home-clean',
    name: 'Basic cleaning',
    tagline: 'Floors, surfaces, bathrooms and kitchens',
    tag: 'Popular',
    categoryId: 'cleaning',
    pricingMode: 'hourly',
    popularRank: 1,
    active: true,
  },
  {
    slug: 'deep-clean',
    name: 'Deep cleaning',
    tagline: 'A top-to-bottom reset for your home',
    categoryId: 'cleaning',
    pricingMode: 'hourly',
    popularRank: 2,
    active: true,
  },
  {
    slug: 'post-construction-clean',
    name: 'Post-construction cleaning',
    tagline: 'Dust, debris and paint splatter after a build',
    categoryId: 'cleaning',
    pricingMode: 'quote',
    active: true,
  },

  // Upholstery and carpets
  {
    slug: 'carpet-clean',
    name: 'Carpet cleaning',
    tagline: 'Deep extraction for rugs and fitted carpet',
    categoryId: 'upholstery',
    pricingMode: 'hourly',
    popularRank: 4,
    active: true,
  },
  {
    slug: 'sofa-clean',
    name: 'Sofa sets cleaning',
    tagline: 'Shampoo and extraction for every seat',
    categoryId: 'upholstery',
    pricingMode: 'hourly',
    popularRank: 3,
    active: true,
  },
  {
    slug: 'chair-clean',
    name: 'Dining chairs cleaning',
    tagline: 'Fabric and frame care for dining sets',
    categoryId: 'upholstery',
    pricingMode: 'hourly',
    active: true,
  },

  // Surface care
  {
    slug: 'pavers-clean',
    name: 'Pavers cleaning',
    tagline: 'Pressure washing for driveways and compounds',
    categoryId: 'surface-care',
    pricingMode: 'quote',
    active: true,
  },
  {
    slug: 'roof-clean',
    name: 'Roof tile cleaning',
    tagline: 'Moss, dust and stain removal from tiles',
    categoryId: 'surface-care',
    pricingMode: 'quote',
    active: true,
  },
  {
    slug: 'terrazzo-polish',
    name: 'Terrazzo and tile polishing',
    tagline: 'Grinding, sealing and shine restoration',
    categoryId: 'surface-care',
    pricingMode: 'quote',
    active: true,
  },

  // Pest control
  {
    slug: 'fumigation',
    name: 'Fumigation',
    tagline: 'Inspection, treatment and a follow-up visit',
    categoryId: 'pest-control',
    pricingMode: 'quote',
    popularRank: 5,
    active: true,
  },

  // Repairs and installations
  {
    slug: 'electrical-works',
    name: 'Electrical works',
    tagline: 'Sockets, lighting, wiring and fault-finding',
    categoryId: 'repairs',
    pricingMode: 'quote',
    active: true,
  },
  {
    slug: 'plumbing-works',
    name: 'Plumbing works',
    tagline: 'Leaks, fittings, drains and water heaters',
    categoryId: 'repairs',
    pricingMode: 'quote',
    active: true,
  },
  {
    slug: 'handyman-works',
    name: 'Handyman works',
    tagline: 'Mounting, repairs and small installations',
    categoryId: 'repairs',
    pricingMode: 'quote',
    active: true,
  },

  // Building and finishing
  {
    slug: 'tiling',
    name: 'Tiling',
    tagline: 'Floor and wall tiling, grouting and repairs',
    categoryId: 'building',
    pricingMode: 'quote',
    active: true,
  },
  {
    slug: 'painting',
    name: 'Painting',
    tagline: 'Interior and exterior painting and touch-ups',
    categoryId: 'building',
    pricingMode: 'quote',
    popularRank: 6,
    active: true,
  },
  {
    slug: 'renovation',
    name: 'Renovation works',
    tagline: 'Room refreshes and small building works',
    categoryId: 'building',
    pricingMode: 'quote',
    active: true,
  },

  // Outdoor and landscaping
  {
    slug: 'pavers-laying',
    name: 'Pavers laying',
    tagline: 'New paving for driveways and walkways',
    categoryId: 'outdoor',
    pricingMode: 'quote',
    active: true,
  },
  {
    slug: 'landscaping',
    name: 'Landscaping and grass cutting',
    tagline: 'Lawns, hedges and garden upkeep',
    categoryId: 'outdoor',
    pricingMode: 'quote',
    active: true,
  },

  // Kept for existing links and drafts, hidden from the catalogue (two inactive services).
  {
    slug: 'office-clean',
    name: 'Office cleaning',
    tagline: 'Desks, meeting rooms and shared kitchens',
    categoryId: 'cleaning',
    pricingMode: 'hourly',
    active: false,
  },
  {
    slug: 'move-out-clean',
    name: 'Move-in / move-out',
    tagline: 'Handover-ready cleaning',
    categoryId: 'cleaning',
    pricingMode: 'hourly',
    active: false,
  },
];

export { serviceCategories };

/** Lowest hourly rate in the pricing table, shown as "From UGX …/hr". */
export const fromHourly = hourlyRate(pricing.minimumHours);

export const activeServices = services.filter((service) => service.active);

export const serviceBySlug = (slug?: string): Service | undefined =>
  services.find((service) => service.slug === slug);

export const servicesByCategoryId = (categoryId: string): readonly Service[] =>
  activeServices.filter((service) => service.categoryId === categoryId);

/**
 * Services for Home > Most popular: the six lowest `popularRank` values, falling back
 * to the first six active services when no ranks are set.
 */
export const popularServices = (limit = 6): readonly Service[] =>
  [...activeServices]
    .sort((a, b) => (a.popularRank ?? Number.MAX_SAFE_INTEGER) - (b.popularRank ?? Number.MAX_SAFE_INTEGER))
    .slice(0, limit);
