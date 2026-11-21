import type { FormSchema } from '@/lib/form-schema';
import { defaultSchema } from '@/lib/form-schema';

/**
 * Seed job-detail schemas (Workstream H, Section 14.4). Copy is dummy until the
 * catalogue is confirmed; the admin replaces these through `GET/PUT /form-schemas`.
 * A service inherits its category's schema unless it sets `formSchemaId` itself.
 */
export const formSchemas: readonly FormSchema[] = [
  {
    id: 'cleaning',
    version: 1,
    heading: 'About your home',
    mediaRequired: false,
    mediaHint: 'Add photos of any area that needs extra attention.',
    sections: [
      {
        id: 'property',
        title: 'The property',
        fields: [
          {
            id: 'size',
            type: 'select',
            label: 'How big is the place?',
            required: true,
            options: [
              { id: 'studio', label: 'Studio' },
              { id: '1-2', label: '1–2 bedrooms' },
              { id: '3-4', label: '3–4 bedrooms' },
              { id: '5-plus', label: '5 or more bedrooms' },
            ],
          },
          {
            id: 'bedrooms',
            type: 'counter',
            label: 'Bedrooms to clean',
            required: false,
            min: 0,
            max: 20,
            minutesPerUnit: 25,
          },
          {
            id: 'bathrooms',
            type: 'counter',
            label: 'Bathrooms to clean',
            required: false,
            min: 0,
            max: 15,
            minutesPerUnit: 35,
          },
          {
            id: 'condition',
            type: 'select',
            label: 'How does it look right now?',
            required: true,
            options: [
              { id: 'light', label: 'Light', hint: 'Regular upkeep' },
              { id: 'typical', label: 'Typical', hint: 'Some build-up' },
              { id: 'heavy', label: 'Heavy', hint: 'Needs extra attention', minutes: 60 },
            ],
          },
          {
            id: 'focus',
            type: 'multiselect',
            label: 'Anything to focus on?',
            required: false,
            options: [
              { id: 'kitchen', label: 'Kitchen' },
              { id: 'bathrooms', label: 'Bathrooms' },
              { id: 'floors', label: 'Floors' },
              { id: 'windows', label: 'Windows' },
              { id: 'balcony', label: 'Balcony' },
            ],
          },
          { id: 'photos', type: 'media-slot', label: 'Photos', required: false, maxMedia: 5 },
        ],
      },
    ],
  },
  {
    id: 'upholstery',
    version: 1,
    heading: 'What are we cleaning?',
    mediaRequired: false,
    mediaHint: 'A photo of each item helps us bring the right machine.',
    sections: [
      {
        id: 'items',
        title: 'Items',
        fields: [
          {
            id: 'sofas',
            type: 'counter',
            label: 'Sofa seats',
            required: false,
            min: 0,
            max: 12,
            minutesPerUnit: 20,
          },
          {
            id: 'chairs',
            type: 'counter',
            label: 'Dining chairs',
            required: false,
            min: 0,
            max: 30,
            minutesPerUnit: 8,
          },
          {
            id: 'rugs',
            type: 'counter',
            label: 'Rugs or carpeted rooms',
            required: false,
            min: 0,
            max: 15,
            minutesPerUnit: 30,
          },
          {
            id: 'material',
            type: 'select',
            label: 'Material',
            required: true,
            options: [
              { id: 'fabric', label: 'Fabric' },
              { id: 'leather', label: 'Leather' },
              { id: 'mixed', label: 'Mixed' },
              { id: 'unsure', label: 'Not sure' },
            ],
          },
          {
            id: 'pet-stains',
            type: 'boolean',
            label: 'Pet stains or odours?',
            required: false,
          },
          { id: 'photos', type: 'media-slot', label: 'Photos', required: false, maxMedia: 5 },
        ],
      },
    ],
  },
  {
    id: 'surface',
    version: 1,
    heading: 'The surface',
    mediaRequired: true,
    mediaHint: 'Add a photo of the surface so we can pick the right treatment.',
    sections: [
      {
        id: 'surface',
        title: 'Surface details',
        fields: [
          {
            id: 'area',
            type: 'measurement',
            label: 'Approximate area',
            required: true,
            min: 1,
            max: 5000,
            minutesPerUnit: 2,
          },
          {
            id: 'surface-type',
            type: 'select',
            label: 'Surface',
            required: true,
            options: [
              { id: 'pavers', label: 'Pavers' },
              { id: 'roof-tiles', label: 'Roof tiles' },
              { id: 'terrazzo', label: 'Terrazzo' },
              { id: 'ceramic', label: 'Ceramic tiles' },
              { id: 'other', label: 'Other' },
            ],
          },
          {
            id: 'condition',
            type: 'select',
            label: 'Condition',
            required: true,
            options: [
              { id: 'light', label: 'Light soiling' },
              { id: 'stained', label: 'Stained' },
              { id: 'heavy', label: 'Heavy build-up', minutes: 90 },
            ],
          },
          {
            id: 'ladder',
            type: 'boolean',
            label: 'Is a ladder or roof access needed?',
            required: false,
          },
          {
            id: 'surface-photo',
            type: 'media-slot',
            label: 'Photo of the surface',
            required: true,
            maxMedia: 4,
          },
        ],
      },
    ],
  },
  {
    id: 'pest',
    version: 1,
    heading: 'The pest problem',
    mediaRequired: false,
    mediaHint: 'Photos of droppings, nests or damage help the technician prepare.',
    sections: [
      {
        id: 'pest',
        title: 'What are we treating?',
        fields: [
          {
            id: 'pest-type',
            type: 'select',
            label: 'Pest',
            required: true,
            options: [
              { id: 'cockroaches', label: 'Cockroaches' },
              { id: 'rodents', label: 'Rodents' },
              { id: 'termites', label: 'Termites' },
              { id: 'mosquitoes', label: 'Mosquitoes' },
              { id: 'other', label: 'Other / not sure' },
            ],
          },
          {
            id: 'rooms',
            type: 'counter',
            label: 'Rooms affected',
            required: true,
            min: 1,
            max: 40,
            minutesPerUnit: 15,
          },
          {
            id: 'severity',
            type: 'select',
            label: 'How bad is it?',
            required: true,
            options: [
              { id: 'few', label: 'A few sightings' },
              { id: 'spreading', label: 'Spreading' },
              { id: 'severe', label: 'Severe infestation', flagsQuote: true },
            ],
          },
          {
            id: 'urgent',
            type: 'boolean',
            label: 'Do you need us today?',
            required: false,
          },
          { id: 'photos', type: 'media-slot', label: 'Photos', required: false, maxMedia: 5 },
        ],
      },
    ],
  },
  {
    id: 'repairs',
    version: 1,
    heading: 'What needs fixing?',
    mediaRequired: false,
    mediaHint: 'A photo of the fault helps us send the right person with the right parts.',
    sections: [
      {
        id: 'repair',
        title: 'The job',
        fields: [
          {
            id: 'work',
            type: 'select',
            label: 'What needs attention?',
            required: true,
            options: [
              { id: 'electrical', label: 'Electrical' },
              { id: 'plumbing', label: 'Plumbing' },
              { id: 'mounting', label: 'Mounting or assembly' },
              { id: 'general', label: 'General repairs' },
            ],
          },
          {
            id: 'describe',
            type: 'textarea',
            label: 'Describe the problem',
            helper: 'What happens, and when did it start?',
            required: true,
          },
          {
            id: 'emergency',
            type: 'boolean',
            label: 'Is it an emergency?',
            required: false,
          },
          {
            id: 'fault-photo',
            type: 'media-slot',
            label: 'Photo of the fault',
            required: false,
            maxMedia: 4,
          },
        ],
      },
    ],
  },
  {
    id: 'building',
    version: 1,
    heading: 'The building work',
    mediaRequired: false,
    mediaHint: 'Photos of the space and any existing finish help us estimate.',
    sections: [
      {
        id: 'work',
        title: 'Scope',
        fields: [
          {
            id: 'area',
            type: 'measurement',
            label: 'Approximate area',
            required: true,
            min: 1,
            max: 5000,
            minutesPerUnit: 4,
          },
          {
            id: 'stage',
            type: 'select',
            label: 'Stage',
            required: true,
            options: [
              { id: 'new', label: 'New work' },
              { id: 'repair', label: 'Repair' },
              { id: 'finish', label: 'Finishing' },
            ],
          },
          {
            id: 'materials',
            type: 'select',
            label: 'Materials supplied by',
            required: true,
            options: [
              { id: 'gabfix', label: 'Gabfix', hint: 'Included in the quote' },
              { id: 'customer', label: 'Me' },
              { id: 'split', label: 'Split / discuss' },
            ],
          },
          {
            id: 'rooms',
            type: 'counter',
            label: 'Rooms involved',
            required: false,
            min: 0,
            max: 20,
            minutesPerUnit: 60,
          },
          { id: 'photos', type: 'media-slot', label: 'Photos', required: false, maxMedia: 5 },
        ],
      },
    ],
  },
  {
    id: 'outdoor',
    version: 1,
    heading: 'The outdoor space',
    mediaRequired: false,
    mediaHint: 'Photos of the compound help us judge access and clearing.',
    sections: [
      {
        id: 'outdoor',
        title: 'Land and access',
        fields: [
          {
            id: 'land',
            type: 'measurement',
            label: 'Land size',
            required: true,
            min: 1,
            max: 100000,
            minutesPerUnit: 1,
          },
          {
            id: 'terrain',
            type: 'select',
            label: 'Terrain',
            required: true,
            options: [
              { id: 'flat', label: 'Flat' },
              { id: 'sloped', label: 'Sloped' },
              { id: 'mixed', label: 'Mixed' },
            ],
          },
          {
            id: 'debris',
            type: 'boolean',
            label: 'Is there debris to remove?',
            required: false,
          },
          { id: 'photos', type: 'media-slot', label: 'Photos', required: false, maxMedia: 5 },
        ],
      },
    ],
  },
  defaultSchema,
];

export const formSchemaById = (id?: string): FormSchema | undefined =>
  formSchemas.find((schema) => schema.id === id);

/** Service → category → default, the resolution order in Section 14.4. */
export const schemaFor = (serviceSchemaId?: string, categorySchemaId?: string): FormSchema =>
  formSchemaById(serviceSchemaId) ?? formSchemaById(categorySchemaId) ?? defaultSchema;
