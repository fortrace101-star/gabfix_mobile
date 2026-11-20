import type { BookingCondition, BookingFocusArea, BookingWorkstations } from '@/lib/pricing';

/**
 * Per-service P8b scope form, from `Implementation_Phase_2 - Stage 1.md` (Section 3.3).
 * Every service falls back to the home-clean form.
 */

export type ScopeCounterId =
  | 'bedrooms'
  | 'bathrooms'
  | 'livingAreas'
  | 'meetingRooms'
  | 'toilets'
  | 'floors';

export type ScopeField =
  | {
      type: 'counter';
      id: ScopeCounterId;
      label: string;
      hint?: string;
      min: number;
      max: number;
      initial: number;
      required: boolean;
    }
  | { type: 'condition'; id: 'condition'; label: string; required: boolean }
  | { type: 'workstations'; id: 'workstations'; label: string; required: boolean };

export type ScopeEstimate = {
  baseMinutes: number;
  perBedroom?: number;
  perBathroom?: number;
  perLivingArea?: number;
  perWorkstationBand?: Record<BookingWorkstations, number>;
  perMeetingRoom?: number;
  perToilet?: number;
  conditionMultiplier?: Record<BookingCondition, number>;
};

export type ServiceScopeConfig = {
  heading: string;
  sizeRequired: boolean;
  fields: ScopeField[];
  focusOptions: { id: BookingFocusArea; label: string }[];
  mediaRequired: boolean;
  mediaHint: string;
  estimate: ScopeEstimate;
};

const homeRooms: ScopeField[] = [
  {
    type: 'counter',
    id: 'bedrooms',
    label: 'Bedrooms',
    hint: '0 for a studio',
    min: 0,
    max: 10,
    initial: 2,
    required: true,
  },
  { type: 'counter', id: 'bathrooms', label: 'Bathrooms', min: 1, max: 8, initial: 1, required: true },
  {
    type: 'counter',
    id: 'livingAreas',
    label: 'Living areas',
    hint: 'Sitting room, dining room',
    min: 0,
    max: 4,
    initial: 1,
    required: false,
  },
];

const homeClean: ServiceScopeConfig = {
  heading: 'About your home',
  sizeRequired: true,
  fields: homeRooms,
  focusOptions: [
    { id: 'kitchen', label: 'Kitchen' },
    { id: 'bathrooms', label: 'Bathrooms' },
    { id: 'pet-hair', label: 'Pet hair' },
    { id: 'stains', label: 'Stains' },
    { id: 'windows', label: 'Windows' },
  ],
  mediaRequired: false,
  mediaHint: 'Add photos of the rooms, or a short video walkthrough.',
  estimate: { baseMinutes: 60, perBedroom: 45, perBathroom: 30, perLivingArea: 20 },
};

const bySlug: Record<string, ServiceScopeConfig> = {
  'home-clean': homeClean,
  'deep-clean': {
    heading: 'About your home',
    sizeRequired: true,
    fields: [
      ...homeRooms,
      { type: 'condition', id: 'condition', label: 'How dirty is it?', required: true },
    ],
    focusOptions: [
      { id: 'grease', label: 'Grease' },
      { id: 'mould', label: 'Mould' },
      { id: 'limescale', label: 'Limescale' },
      { id: 'stains', label: 'Stains' },
      { id: 'behind-furniture', label: 'Behind furniture' },
    ],
    mediaRequired: false,
    mediaHint: 'Photos of the worst areas help us bring the right products.',
    estimate: {
      baseMinutes: 90,
      perBedroom: 75,
      perBathroom: 45,
      perLivingArea: 30,
      conditionMultiplier: { light: 0.9, typical: 1, heavy: 1.25 },
    },
  },
  'move-out-clean': {
    heading: 'About the property',
    sizeRequired: true,
    fields: [
      ...homeRooms,
      { type: 'condition', id: 'condition', label: 'Condition now', required: true },
    ],
    focusOptions: [
      { id: 'oven', label: 'Oven' },
      { id: 'fridge', label: 'Fridge' },
      { id: 'cupboards', label: 'Inside cupboards' },
      { id: 'walls', label: 'Marks on walls' },
    ],
    mediaRequired: false,
    mediaHint: 'Photos of each room help us confirm the time needed for the handover.',
    estimate: {
      baseMinutes: 90,
      perBedroom: 60,
      perBathroom: 45,
      perLivingArea: 30,
      conditionMultiplier: { light: 0.9, typical: 1, heavy: 1.25 },
    },
  },
  'office-clean': {
    heading: 'About your office',
    sizeRequired: true,
    fields: [
      { type: 'workstations', id: 'workstations', label: 'Desks or workstations', required: true },
      {
        type: 'counter',
        id: 'meetingRooms',
        label: 'Meeting rooms',
        min: 0,
        max: 20,
        initial: 1,
        required: false,
      },
      { type: 'counter', id: 'toilets', label: 'Toilets', min: 1, max: 20, initial: 2, required: true },
      { type: 'counter', id: 'floors', label: 'Floors', min: 1, max: 6, initial: 1, required: false },
    ],
    focusOptions: [
      { id: 'kitchenette', label: 'Kitchenette' },
      { id: 'reception', label: 'Reception' },
      { id: 'carpets', label: 'Carpets' },
      { id: 'glass', label: 'Glass and partitions' },
    ],
    mediaRequired: false,
    mediaHint: 'A walkthrough video of the floor plan is the fastest way to a good quote.',
    estimate: {
      baseMinutes: 60,
      perWorkstationBand: { '1-5': 0, '6-15': 60, '16-40': 150, '40+': 300 },
      perMeetingRoom: 20,
      perToilet: 25,
    },
  },
};

/** Any service slug without an entry gets the home-clean form. */
export const scopeFor = (slug: string): ServiceScopeConfig => bySlug[slug] ?? homeClean;
