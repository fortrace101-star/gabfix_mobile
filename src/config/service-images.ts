import type { ImageSourcePropType } from 'react-native';

import { serviceBySlug } from './services';

/**
 * Bundled service photography and the drop-in contract for the real shoot (Open item 7).
 *
 * Replace each file in `assets/images/services/` with a licensed landscape photo, keeping
 * the same `<slug>.jpg` filename, and every screen updates. `GET /services/{slug}` can
 * override the P7 hero with a remote `heroImage` URL; cards use the bundled photo.
 */
const serviceImages: Record<string, ImageSourcePropType> = {
  // Cleaning
  'home-clean': require('../../assets/images/services/home-clean.jpg'),
  'deep-clean': require('../../assets/images/services/deep-clean.jpg'),
  'post-construction-clean': require('../../assets/images/services/post-construction-clean.jpg'),
  'office-clean': require('../../assets/images/services/office-clean.jpg'),
  'move-out-clean': require('../../assets/images/services/move-out-clean.jpg'),

  // Upholstery and carpets
  'carpet-clean': require('../../assets/images/services/carpet-clean.jpg'),
  'sofa-clean': require('../../assets/images/services/sofa-clean.jpg'),
  'chair-clean': require('../../assets/images/services/chair-clean.jpg'),

  // Surface care
  'pavers-clean': require('../../assets/images/services/pavers-clean.jpg'),
  'roof-clean': require('../../assets/images/services/roof-clean.jpg'),
  'terrazzo-polish': require('../../assets/images/services/terrazzo-polish.jpg'),

  // Pest control
  fumigation: require('../../assets/images/services/fumigation.jpg'),

  // Repairs and installations
  'electrical-works': require('../../assets/images/services/electrical-works.jpg'),
  'plumbing-works': require('../../assets/images/services/plumbing-works.jpg'),
  'handyman-works': require('../../assets/images/services/handyman-works.jpg'),

  // Building and finishing
  tiling: require('../../assets/images/services/tiling.jpg'),
  painting: require('../../assets/images/services/painting.jpg'),
  renovation: require('../../assets/images/services/renovation.jpg'),

  // Outdoor and landscaping
  'pavers-laying': require('../../assets/images/services/pavers-laying.jpg'),
  landscaping: require('../../assets/images/services/landscaping.jpg'),

  // Last resort for a slug that has no photo yet.
  default: require('../../assets/images/services/default.jpg'),
};

/** Category photos keep a newly added service illustrated before its own photo lands. */
const categoryImages: Record<string, ImageSourcePropType> = {
  cleaning: serviceImages['home-clean'],
  upholstery: serviceImages['sofa-clean'],
  'surface-care': serviceImages['pavers-clean'],
  'pest-control': serviceImages['fumigation'],
  repairs: serviceImages['handyman-works'],
  building: serviceImages['painting'],
  outdoor: serviceImages['landscaping'],
};

/**
 * Resolves the photo for a service: its own image, then its category's image, then the
 * generic Gabfix placeholder, so no card or hero is ever left blank by a new slug.
 */
export const serviceImage = (slug?: string): ImageSourcePropType | undefined => {
  if (!slug) return undefined;
  return serviceImages[slug] ?? categoryImages[serviceBySlug(slug)?.categoryId ?? ''] ?? serviceImages.default;
};
