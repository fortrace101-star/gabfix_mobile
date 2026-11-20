import { Image } from 'expo-image';
import { Play, Video, X } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { BookingMediaItem } from '@/lib/pricing';
import { colors, font, radius } from '@/theme';

type Props = {
  item: BookingMediaItem;
  index: number;
  total: number;
  onPress?: () => void;
  onRemove: () => void;
};

const durationLabel = (seconds?: number): string => {
  if (!seconds || seconds <= 0) return 'Video';
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
};

/** 96 x 96 draft media tile: photo, or a video with scrim and duration. */
export function MediaTile({ item, index, total, onPress, onRemove }: Props) {
  const isVideo = item.kind === 'video';
  const kindLabel = isVideo ? 'Video' : 'Photo';

  return (
    <View style={styles.tile}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${kindLabel} ${index + 1} of ${total}${isVideo ? `, ${item.durationSec ?? 0} seconds` : ''}`}
        accessibilityHint="Opens a preview"
        onPress={onPress}
        style={styles.fill}>
        {isVideo ? (
          <View style={styles.video}>
            <Video size={22} color={colors.surface} strokeWidth={1.8} />
            <View style={styles.scrim} pointerEvents="none">
              <View style={styles.playCircle}>
                <Play size={12} color={colors.surface} strokeWidth={3} />
              </View>
            </View>
            <View style={styles.duration}>
              <Text style={styles.durationText} maxFontSizeMultiplier={1.1}>
                {durationLabel(item.durationSec)}
              </Text>
            </View>
          </View>
        ) : (
          <Image source={{ uri: item.uri }} style={styles.fill} contentFit="cover" />
        )}
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Remove ${kindLabel.toLowerCase()} ${index + 1}`}
        hitSlop={12}
        onPress={onRemove}
        style={styles.remove}>
        <X size={13} color={colors.surface} strokeWidth={2.5} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: 96,
    height: 96,
    borderRadius: radius.tile,
    overflow: 'hidden',
    backgroundColor: colors.disabledBg,
  },
  fill: { width: '100%', height: '100%' },
  video: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.green900,
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  playCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  duration: {
    position: 'absolute',
    left: 6,
    bottom: 6,
    minHeight: 18,
    paddingHorizontal: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
  },
  durationText: { fontFamily: font.bodySemi, fontSize: 10, lineHeight: 14, color: colors.surface },
  remove: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
