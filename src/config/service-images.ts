import type { ImageSourcePropType } from 'react-native';

/**
 * Bundled service photography and the drop-in contract for the real shoot (Open item 7).
 *
 * Replace each file in `assets/images/services/` with a licensed landscape photo, keeping
 * the same `<slug>.jpg` filename, and every screen updates. `GET /services/{slug}` can
 * override the P7 hero with a remote `heroImage` URL; cards use the bundled photo.
 */
const serviceImages: Record<string, ImageSourcePropType> = {
  'home-clean': require('../../assets/images/services/home-clean.jpg'),
  'deep-clean': require('../../assets/images/services/deep-clean.jpg'),
  'office-clean': require('../../assets/images/services/office-clean.jpg'),
  'move-out-clean': require('../../assets/images/services/move-out-clean.jpg'),
};

export const serviceImage = (slug?: string): ImageSourcePropType | undefined =>
  slug ? serviceImages[slug] : undefined;
