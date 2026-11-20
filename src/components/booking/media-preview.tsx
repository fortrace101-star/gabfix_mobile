import { Image } from 'expo-image';
import { Trash2, Video, X } from 'lucide-react-native';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { BookingMediaItem } from '@/lib/pricing';
import { colors, font, radius, space, text } from '@/theme';

type Props = {
  item: BookingMediaItem | null;
  onClose: () => void;
  onRemove: (id: string) => void;
};

/**
 * Full-screen preview (3.7.3). Videos need `expo-video` (a native build), so v1 shows a
 * poster card with the duration; photos use the same image component as the tiles.
 */
export function MediaPreview({ item, onClose, onRemove }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      animationType="fade"
      transparent
      visible={item !== null}
      onRequestClose={onClose}
      statusBarTranslucent>
      <View style={styles.root}>
        <View style={[styles.bar, { paddingTop: insets.top + space[2] }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close preview"
            hitSlop={8}
            onPress={onClose}
            style={styles.barButton}>
            <X size={24} color={colors.surface} strokeWidth={2} />
          </Pressable>
          <Text style={styles.barTitle} maxFontSizeMultiplier={1.2} numberOfLines={1}>
            {item?.kind === 'video' ? 'Video' : 'Photo'}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Remove this item"
            hitSlop={8}
            onPress={() => {
              if (item) onRemove(item.id);
              onClose();
            }}
            style={styles.barButton}>
            <Trash2 size={22} color={colors.surface} strokeWidth={2} />
          </Pressable>
        </View>

        <View style={styles.body}>
          {item?.kind === 'video' ? (
            <View style={styles.videoCard}>
              <Video size={44} color={colors.surface} strokeWidth={1.6} />
              <Text style={styles.videoText} maxFontSizeMultiplier={1.3}>
                {item.durationSec
                  ? `${Math.floor(item.durationSec / 60)}:${String(item.durationSec % 60).padStart(2, '0')}`
                  : 'Video walkthrough'}
              </Text>
              <Text style={styles.videoHint} maxFontSizeMultiplier={1.3}>
                Video playback needs the installed app build.
              </Text>
            </View>
          ) : item ? (
            <Image source={{ uri: item.uri }} style={styles.image} contentFit="contain" />
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B120D' },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    paddingHorizontal: space[2],
    paddingBottom: space[2],
  },
  barButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  barTitle: { ...text.bodyM, fontFamily: font.bodySemi, color: colors.surface, flex: 1, textAlign: 'center' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space[4] },
  image: { width: '100%', height: '100%' },
  videoCard: {
    alignItems: 'center',
    gap: space[3],
    padding: space[6],
    borderRadius: radius.card,
    backgroundColor: colors.green900,
  },
  videoText: { ...text.h2, color: colors.surface },
  videoHint: { ...text.caption, color: colors.whiteTextMuted, textAlign: 'center' },
});
