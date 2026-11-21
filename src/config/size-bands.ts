export type PropertySizeBand = 'small' | 'medium' | 'large' | 'unsure';

export type SizeBandOption = {
  id: PropertySizeBand;
  label: string;
  description: string;
};

/** Property size bands from `Implementation_Phase_2 - Stage 1.md` (Section 3.6). */
export const sizeBandOptions: SizeBandOption[] = [
  { id: 'small', label: 'Small', description: 'Up to 50 m²' },
  { id: 'medium', label: 'Medium', description: '50–150 m²' },
  { id: 'large', label: 'Large', description: '150 m² or more' },
  { id: 'unsure', label: 'Not sure', description: 'We will help you estimate' },
];

export const sizeBandById = (id: PropertySizeBand): SizeBandOption | undefined =>
  sizeBandOptions.find((option) => option.id === id);

/** Picks the matching band for an exact area; keeps “unsure” if the value is unusable. */
export const bandForArea = (areaSqm: number): PropertySizeBand => {
  if (!Number.isFinite(areaSqm) || areaSqm <= 0) return 'unsure';
  if (areaSqm <= 50) return 'small';
  if (areaSqm <= 150) return 'medium';
  return 'large';
};

export const defaultSizeBand: PropertySizeBand = 'medium';
