import { Flame, Refrigerator, Shirt, Sun, type LucideIcon } from 'lucide-react-native';

import { pricing } from './pricing';

/** Ids come from the dummy price catalogue so a price can never miss its card. */
export type AddOnId = keyof typeof pricing.addOns;

export type AddOnDefinition = {
  id: AddOnId;
  name: string;
  description: string;
  icon: LucideIcon;
  included: string[];
  notIncluded: string[];
};

/** Copy for the P9 cards and the "What's included" sheet (Part 1, 15.3). */
export const addOns: readonly AddOnDefinition[] = [
  {
    id: 'inside_oven',
    name: 'Inside oven',
    description: 'Racks, trays and the oven door degreased',
    icon: Flame,
    included: ['Oven interior and door glass', 'Racks and trays soaked and scrubbed', 'Door seals wiped'],
    notIncluded: ['Hob and extractor hood', 'Oven parts removed for repair'],
  },
  {
    id: 'inside_fridge',
    name: 'Inside fridge',
    description: 'Shelves, drawers and door seals cleaned',
    icon: Refrigerator,
    included: ['Shelves and drawers', 'Door seals and handles', 'Interior wiped and deodorised'],
    notIncluded: ['Freezer defrosting', 'Removing or restocking food'],
  },
  {
    id: 'laundry',
    name: 'Laundry and ironing',
    description: 'Up to 10 items washed, dried and folded',
    icon: Shirt,
    included: ['Up to 10 items', 'Wash, dry and fold', 'Light ironing'],
    notIncluded: ['Dry cleaning', 'Delicate or hand-wash only fabrics', 'More than 10 items'],
  },
  {
    id: 'balcony',
    name: 'Balcony or veranda',
    description: 'Floors, railings and outdoor surfaces',
    icon: Sun,
    included: ['Sweeping and mopping the floor', 'Railings and ledges wiped', 'Outdoor furniture dusted'],
    notIncluded: ['Washing exterior windows', 'Removing heavy debris or furniture'],
  },
];
