import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { UploadItem } from '@/store/media-uploads';
import { colors, font, space, text } from '@/theme';

type Props = {
  items: UploadItem[];
  onRetry?: () => void;
};

/** “4 of 6 uploaded”, a thin progress bar and Retry when something failed (3.12). */
export function UploadStatus({ items, onRetry }: Props) {
  if (items.length === 0) return null;

  const uploaded = items.filter((item) => item.state === 'uploaded').length;
  const failed = items.filter((item) => item.state === 'failed').length;
  const uploading = items.some((item) => item.state === 'uploading' || item.state === 'queued');
  const progress = items.length === 0 ? 0 : uploaded / items.length;

  const label = failed > 0
    ? `${uploaded} of ${items.length} uploaded · ${failed} failed`
    : uploaded === items.length
      ? 'All uploaded'
      : uploading
        ? `Uploading ${uploaded + 1} of ${items.length}…`
        : `${uploaded} of ${items.length} uploaded`;

  return (
    <View style={styles.root} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: items.length, now: uploaded }}>
      <View style={styles.top}>
        <Text style={styles.label} maxFontSizeMultiplier={1.3}>
          {label}
        </Text>
        {failed > 0 && onRetry ? (
          <Pressable accessibilityRole="button" hitSlop={8} onPress={onRetry} style={styles.retry}>
            <Text style={styles.retryText} maxFontSizeMultiplier={1.2}>
              Retry
            </Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: space[1] },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space[2] },
  label: { ...text.caption, color: colors.textMuted, flex: 1 },
  retry: { minHeight: 32, justifyContent: 'center' },
  retryText: { ...text.caption, fontFamily: font.bodySemi, color: colors.green700 },
  track: { height: 4, borderRadius: 2, backgroundColor: colors.disabledBg, overflow: 'hidden' },
  fill: { height: 4, borderRadius: 2, backgroundColor: colors.green500 },
});
