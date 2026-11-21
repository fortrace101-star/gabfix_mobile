/**
 * Catalogue categories (Workstream H, Section 14.2). Replaced by `GET /service-categories`
 * when the catalogue API lands; the shape below is the API shape.
 */
export type ServiceCategory = {
  id: string;
  name: string;
  caption: string;
  order: number;
  /** Set when the category sits under another one (sub-category support, H1). */
  parentId?: string;
  /** Form inherited by services in this category when they set none. */
  formSchemaId?: string;
  active: boolean;
};

export const serviceCategories: readonly ServiceCategory[] = [
  {
    id: 'cleaning',
    name: 'Cleaning',
    caption: 'Homes, offices and handovers',
    order: 1,
    formSchemaId: 'cleaning',
    active: true,
  },
  {
    id: 'upholstery',
    name: 'Upholstery and carpets',
    caption: 'Carpets, sofas and chairs',
    order: 2,
    formSchemaId: 'upholstery',
    active: true,
  },
  {
    id: 'surface-care',
    name: 'Surface care',
    caption: 'Pavers, roofs, terrazzo and tiles',
    order: 3,
    formSchemaId: 'surface',
    active: true,
  },
  {
    id: 'pest-control',
    name: 'Pest control',
    caption: 'Inspection, treatment and follow-up',
    order: 4,
    formSchemaId: 'pest',
    active: true,
  },
  {
    id: 'repairs',
    name: 'Repairs and installations',
    caption: 'Electrical, plumbing and handyman work',
    order: 5,
    formSchemaId: 'repairs',
    active: true,
  },
  {
    id: 'building',
    name: 'Building and finishing',
    caption: 'Tiling, painting and renovations',
    order: 6,
    formSchemaId: 'building',
    active: true,
  },
  {
    id: 'outdoor',
    name: 'Outdoor and landscaping',
    caption: 'Paving, lawns and garden care',
    order: 7,
    formSchemaId: 'outdoor',
    active: true,
  },
];

export const activeServiceCategories = serviceCategories.filter((category) => category.active);

export const serviceCategoryById = (id?: string): ServiceCategory | undefined =>
  serviceCategories.find((category) => category.id === id);
