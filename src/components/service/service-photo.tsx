import { Image, type ImageProps } from 'expo-image';
import { useState } from 'react';

import { serviceImage } from '@/config/service-images';

type ServicePhotoProps = {
  slug?: string;
  /** Primary remote override (e.g. the P7 hero image). */
  uri?: string;
  /** Remote catalogue/card image from the services API. */
  cardUri?: string;
  /** Area-specific remote image; wins over `cardUri`. */

  style?: ImageProps['style'];
  contentFit?: ImageProps['contentFit'];
  transition?: number;
  accessibilityLabel?: string;
  priority?: ImageProps['priority'];
};

/**
 * One service photo for heroes and cards. The first available remote URL is tried
 * (uri > cardUri); a failed remote load falls back to the bundled photo so a
 * bad response never leaves the slot empty.
 */
export function ServicePhoto({
  slug,
  uri,
  cardUri,

  style,
  contentFit = 'cover',
  transition = 160,
  accessibilityLabel,
  priority,
}: ServicePhotoProps) {
  const [failedUris, setFailedUris] = useState<readonly string[]>([]);
  const remote = [uri, cardUri].find(
    (value): value is string =>
      typeof value === 'string' && value.length > 0 && !failedUris.includes(value),
  );
  const source = (remote ? { uri: remote } : serviceImage(slug)) as ImageProps['source'];

  if (!source) return null;

  return (
    <Image
      source={source}
      style={style}
      contentFit={contentFit}
      transition={transition}
      onError={
        remote ? () => setFailedUris((current) => [...current, remote as string]) : undefined
      }
      accessibilityLabel={accessibilityLabel}
      accessible={Boolean(accessibilityLabel)}
      cachePolicy="memory-disk"
      priority={priority}
    />
  );
}
