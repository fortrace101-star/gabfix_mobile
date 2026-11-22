import { Image } from 'expo-image';
import { Play } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { scopeRows } from '@/lib/booking-scope';
import type { BookingMediaItem, BookingScope } from '@/lib/pricing';
import { colors, font, radius, space, text } from '@/theme';

type Props = {
  scope?: BookingScope;
  media?: BookingMediaItem[];
  /** Tighter padding when nested inside another card. */
  compact?: boolean;
  /** Hide row labels when the parent already provides a section heading. */
  hideLabels?: boolean;
};

/** Facts + thumbnail strip for review, confirmation and booking detail (Phase 2, 3.12). */
export function ScopeSummary({ scope, media = [], compact = false, hideLabels = false }: Props) {
  const rows = scopeRows(scope);
  const photos = media.filter((item) => item.kind === 'image').length;
  const videos = media.filter((item) => item.kind === 'video').length;
  const mediaLine =
    media.length === 0
      ? 'No photos or video added'
      : `${photos} photo${photos === 1 ? '' : 's'}${videos ? ` · ${videos} video${videos === 1 ? '' : 's'}` : ''}`;

  return (
    <View style={[styles.root, compact && styles.compact]}>
      {rows.length > 0 ? (
        <View style={[styles.facts, hideLabels && styles.factsLeft]}>
          {!hideLabels ? (
            <Text style={styles.label} maxFontSizeMultiplier={1.3}>
              Job details
            </Text>
          ) : null}
          {rows.map((row) => (
            <View key={row.fieldId} style={styles.factRow}>
              <Text style={styles.factLabel} maxFontSizeMultiplier={1.3}>
                {row.label}
              </Text>
              <Text style={styles.factValue} maxFontSizeMultiplier={1.3}>
                {row.display}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.row}>
          {!hideLabels ? (
            <Text style={styles.label} maxFontSizeMultiplier={1.3}>
              Job details
            </Text>
          ) : null}
          <Text style={[styles.value, hideLabels && styles.valueLeft]} maxFontSizeMultiplier={1.3}>
            Not set
          </Text>
        </View>
      )}
      <View style={styles.row}>
        {!hideLabels ? (
          <Text style={styles.label} maxFontSizeMultiplier={1.3}>
            Media
          </Text>
        ) : null}
        <Text style={[styles.value, hideLabels && styles.valueLeft]} maxFontSizeMultiplier={1.3}>
          {mediaLine}
        </Text>
      </View>
      {media.length > 0 ? (
        <View style={styles.strip}>
          {media.slice(0, 4).map((item) => (
            <View key={item.id} style={styles.thumb}>
              {item.kind === 'video' ? (
                <View style={styles.videoThumb}>
                  <Play size={14} color={colors.surface} strokeWidth={3} />
                </View>
              ) : (
                <Image source={{ uri: item.uri }} style={styles.thumbImage} contentFit="cover" />
              )}
            </View>
          ))}
          {media.length > 4 ? (
            <View style={styles.more}>
              <Text style={styles.moreText} maxFontSizeMultiplier={1.2}>
                +{media.length - 4}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: space[2] },
  compact: { gap: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: space[3] },
  label: { ...text.caption, color: colors.textMuted, flexShrink: 0 },
  value: { ...text.bodyM, fontFamily: font.bodySemi, fontSize: 14, flex: 1, textAlign: 'right' },
  valueLeft: { textAlign: 'left' },
  facts: { gap: 6 },
  factsLeft: { alignItems: 'flex-start' },
  factRow: { flexDirection: 'row', justifyContent: 'space-between', gap: space[3] },
  factLabel: { ...text.caption, color: colors.textMuted, flexShrink: 1 },
  factValue: { ...text.bodyM, fontFamily: font.bodySemi, fontSize: 14, textAlign: 'right', flexShrink: 1 },
  strip: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2], marginTop: 2 },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: radius.input,
    overflow: 'hidden',
    backgroundColor: colors.disabledBg,
  },
  thumbImage: { width: '100%', height: '100%' },
  videoThumb: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.green900,
  },
  more: {
    width: 56,
    height: 56,
    borderRadius: radius.input,
    backgroundColor: colors.green50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: { ...text.caption, fontFamily: font.bodySemi, color: colors.green700 },
});
