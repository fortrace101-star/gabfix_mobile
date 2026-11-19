import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { Check, ChevronRight, Copy, Sparkles, Tag } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { TopBar } from '@/components/ui/top-bar';
import { type Offer, offers } from '@/config/offers';
import { getBookingDraft, setPromoCode, startDraft, useBookingDraft } from '@/store/booking';
import { colors, font, radius, space, text } from '@/theme';

/** P20 Offers. Codes apply to the active draft, or start the offer's service. */
export default function OffersScreen() {
  const insets = useSafeAreaInsets();
  const draft = useBookingDraft();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (!copiedCode) return;
    const timer = setTimeout(() => setCopiedCode(null), 2_000);
    return () => clearTimeout(timer);
  }, [copiedCode]);

  const copy = async (offer: Offer) => {
    try {
      await Clipboard.setStringAsync(offer.code);
      setCopiedCode(offer.code);
    } catch {
      Alert.alert('Could not copy', `Copy the code manually: ${offer.code}`);
    }
  };

  const applyOffer = (offer: Offer) => {
    const current = getBookingDraft();
    const slug = current?.serviceSlug ?? offer.serviceSlug;
    if (!current) startDraft(slug);
    setPromoCode(offer.code);
    router.push({ pathname: '/book/[slug]/details', params: { slug } });
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <TopBar title="Offers" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.intro}>
          <Text style={styles.title} maxFontSizeMultiplier={1.3}>
            Offers for you
          </Text>
          <Text style={styles.subtitle} maxFontSizeMultiplier={1.3}>
            Tap a code to copy it, or use an offer straight in your next booking.
          </Text>
        </View>

        {offers.map((offer) => (
          <OfferCard
            key={offer.code}
            offer={offer}
            applied={draft?.promoCode === offer.code}
            onCopy={() => void copy(offer)}
            onUse={() => applyOffer(offer)}
          />
        ))}

        <View style={styles.note}>
          <Tag size={18} color={colors.green700} strokeWidth={2} />
          <Text style={styles.noteText} maxFontSizeMultiplier={1.3}>
            One promo code per booking. Offers cannot be combined with another code or a
            referral reward.
          </Text>
        </View>
      </ScrollView>

      {copiedCode ? (
        <View style={[styles.toast, { bottom: insets.bottom + space[4] }]}>
          <Check size={16} color={colors.surface} strokeWidth={2.5} />
          <Text style={styles.toastText} maxFontSizeMultiplier={1.2}>
            {copiedCode} copied
          </Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function OfferCard({
  offer,
  applied,
  onCopy,
  onUse,
}: {
  offer: Offer;
  applied: boolean;
  onCopy: () => void;
  onUse: () => void;
}) {
  return (
    <View style={styles.offer}>
      <View style={styles.offerLeft}>
        <Text style={styles.offerTitle} maxFontSizeMultiplier={1.3} numberOfLines={2}>
          {offer.title}
        </Text>
        <Text style={styles.offerCaption} maxFontSizeMultiplier={1.2} numberOfLines={2}>
          {offer.caption} · Expires {offer.expiry}
        </Text>

        <View style={styles.offerActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Copy code ${offer.code}`}
            hitSlop={6}
            onPress={onCopy}
            style={styles.codeChip}>
            <Text style={styles.codeText} maxFontSizeMultiplier={1.2}>
              {offer.code}
            </Text>
            <Copy size={13} color={colors.yellow800} strokeWidth={2} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              applied ? `${offer.code} applied to your booking` : `Use ${offer.code} now`
            }
            hitSlop={8}
            onPress={onUse}
            style={styles.useNow}>
            <Text
              style={[styles.useNowText, applied && styles.useNowTextApplied]}
              maxFontSizeMultiplier={1.2}>
              {applied ? 'Applied' : 'Use now'}
            </Text>
            <ChevronRight
              size={14}
              color={applied ? colors.textMuted : colors.green700}
              strokeWidth={2}
            />
          </Pressable>
        </View>
      </View>

      <View style={styles.offerArt}>
        <View style={styles.artCircle} />
        <View style={styles.artIcon}>
          <Sparkles size={24} color={colors.green700} strokeWidth={2} />
        </View>
        <Text style={styles.artDiscount} maxFontSizeMultiplier={1.2}>
          {offer.discountLabel}
        </Text>
        <Text style={styles.artOff} maxFontSizeMultiplier={1.2}>
          OFF
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space[4], paddingBottom: space[10], gap: space[4] },
  intro: { gap: space[1] },
  title: { ...text.h2 },
  subtitle: { ...text.caption },
  offer: {
    minHeight: 140,
    flexDirection: 'row',
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: colors.yellow50,
  },
  offerLeft: {
    flex: 1,
    padding: space[3],
    gap: 4,
    justifyContent: 'center',
  },
  offerTitle: { ...text.h3, fontSize: 16, lineHeight: 22 },
  offerCaption: { ...text.caption, color: colors.yellow800 },
  offerActions: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  codeChip: {
    height: 28,
    borderRadius: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.yellow600,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  codeText: {
    fontFamily: font.bodySemi,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.6,
    color: colors.yellow800,
  },
  useNow: { flexDirection: 'row', alignItems: 'center', gap: 1 },
  useNowText: {
    fontFamily: font.bodySemi,
    fontSize: 12,
    lineHeight: 16,
    color: colors.green700,
  },
  useNowTextApplied: { color: colors.textMuted },
  offerArt: {
    width: 108,
    backgroundColor: colors.yellow500,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  artCircle: {
    position: 'absolute',
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: 'rgba(255,255,255,0.28)',
    top: -30,
    right: -34,
  },
  artIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  artDiscount: {
    fontFamily: font.poppinsBold,
    fontSize: 22,
    lineHeight: 26,
    color: colors.green900,
  },
  artOff: {
    fontFamily: font.poppinsSemi,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.4,
    color: colors.green900,
  },
  note: {
    flexDirection: 'row',
    gap: space[3],
    padding: space[3],
    borderRadius: radius.input,
    backgroundColor: colors.green50,
  },
  noteText: { ...text.caption, color: colors.green700, flex: 1 },
  toast: {
    position: 'absolute',
    left: space[4],
    right: space[4],
    minHeight: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.green900,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
    paddingHorizontal: space[4],
  },
  toastText: { ...text.bodyM, color: colors.surface, fontFamily: font.bodySemi },
});
