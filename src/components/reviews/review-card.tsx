import { Check } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Stars } from '@/components/reviews/stars';
import type { ServiceReview } from '@/config/reviews';
import { base, colors, font, radius, space, text } from '@/theme';

/** P21 review card: identity, rating, up to four lines, verification and cleaner reply. */
export function ReviewCard({ review, compact = false }: { review: ServiceReview; compact?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const hasLongComment = review.comment.length > 220;

  return (
    <View style={[base.card, styles.card, compact && styles.cardCompact]}>
      <View style={styles.header}>
        <View style={[styles.avatar, compact && styles.avatarCompact]}>
          <Text style={styles.avatarText} maxFontSizeMultiplier={1.2}>
            {review.initials}
          </Text>
        </View>
        <Text style={styles.name} maxFontSizeMultiplier={1.3} numberOfLines={1}>
          {review.name}
        </Text>
        <Text style={styles.date} maxFontSizeMultiplier={1.2}>
          {review.date}
        </Text>
      </View>

      <Stars value={review.stars} size={16} />

      {review.comment ? (
        <>
          <Text
            style={styles.comment}
            maxFontSizeMultiplier={1.3}
            numberOfLines={expanded ? undefined : compact ? 3 : 4}>
            {review.comment}
          </Text>
          {hasLongComment ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={expanded ? 'Show less review text' : 'Read more review text'}
              hitSlop={6}
              onPress={() => setExpanded((value) => !value)}>
              <Text style={styles.readMore} maxFontSizeMultiplier={1.2}>
                {expanded ? 'Show less' : 'Read more'}
              </Text>
            </Pressable>
          ) : null}
        </>
      ) : null}

      <View style={styles.verified}>
        <Check size={12} color={colors.green700} strokeWidth={2.5} />
        <Text style={styles.verifiedText} maxFontSizeMultiplier={1.2}>
          Verified booking
        </Text>
      </View>

      {review.cleanerReply && !compact ? (
        <View style={styles.reply}>
          <Text style={styles.replyLabel} maxFontSizeMultiplier={1.2}>
            Cleaner reply
          </Text>
          <Text style={styles.replyText} maxFontSizeMultiplier={1.3}>
            {review.cleanerReply}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: space[2] },
  cardCompact: { padding: space[3] },
  header: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.green100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCompact: { width: 32, height: 32 },
  avatarText: { fontFamily: font.poppinsSemi, fontSize: 14, color: colors.green900 },
  name: { ...text.bodyM, fontFamily: font.bodySemi, flex: 1 },
  date: { ...text.caption },
  comment: { ...text.body, color: colors.textMuted, lineHeight: 21 },
  readMore: {
    ...text.caption,
    fontFamily: font.bodySemi,
    color: colors.green700,
    alignSelf: 'flex-start',
  },
  verified: {
    alignSelf: 'flex-start',
    height: 24,
    borderRadius: radius.pill,
    backgroundColor: colors.green50,
    paddingHorizontal: space[2],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontFamily: font.bodySemi,
    fontSize: 10,
    lineHeight: 14,
    color: colors.green700,
  },
  reply: {
    marginLeft: space[4],
    paddingLeft: space[3],
    borderLeftWidth: 2,
    borderLeftColor: colors.green100,
    gap: 2,
  },
  replyLabel: {
    fontFamily: font.bodySemi,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.green700,
  },
  replyText: { ...text.caption, lineHeight: 19 },
});
