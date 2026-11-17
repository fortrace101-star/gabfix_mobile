import { Image } from 'react-native';

const logo = require('../../../assets/images/gabfix-logo.png');

type Props = {
  size?: number;
};

/**
 * Gabfix circular badge: yellow ring, green field, house and crossed tools.
 * Uses the brand artwork from `assets/images/Gabfix.png` (downscaled copy so the
 * 2329 px source is not decoded at full size on every screen).
 */
export function LogoBadge({ size = 40 }: Props) {
  return (
    <Image
      source={logo}
      style={{ width: size, height: size }}
      resizeMode="contain"
      accessibilityLabel="Gabfix logo"
      accessible
    />
  );
}
