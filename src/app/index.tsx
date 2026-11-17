import type { LucideIcon } from 'lucide-react-native';
import { House, ShieldCheck, Sparkles, Wallet } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type ListViewToken,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LogoBadge } from '@/components/brand/logo-badge';
import { Button } from '@/components/ui/button';
import { useStatusBarStyle } from '@/hooks/use-status-bar-style';
import { colors, duration, font, radius, shadow, size, space, text } from '@/theme';
import { selectionHaptic } from '@/utils/haptics';

type Slide = {
  key: string;
  title: string;
  body: string;
  icon: LucideIcon;
  badge: string;
};

const slides: Slide[] = [
  {
    key: 'book',
    title: 'A spotless home, booked in minutes.',
    body: 'Trusted, vetted cleaners across Kampala. Choose a time that works for you.',
    icon: House,
    badge: 'Ntinda · 10:00 am',
  },
  {
    key: 'trust',
    title: 'Verified cleaners you can trust.',
    body: 'Background-checked professionals, the same cleaner on every recurring visit.',
    icon: ShieldCheck,
    badge: 'Vetted · Insured',
  },
  {
    key: 'pay',
    title: 'Pay with MTN, Airtel, Visa or cash. Deposit if you like.',
    body: 'Mobile Money first. Pay in full, leave a deposit, or pay after the service.',
    icon: Wallet,
    badge: 'MTN · Airtel · Visa · Cash',
  },
];

function ActiveDot({ active }: { active: boolean }) {
  const [width] = useState(() => new Animated.Value(active ? 24 : 6));

  useEffect(() => {
    Animated.timing(width, {
      toValue: active ? 24 : 6,
      duration: duration.fast,
      useNativeDriver: false,
    }).start();
  }, [active, width]);

  return <Animated.View style={[styles.dot, { width, backgroundColor: active ? colors.yellow500 : colors.dotInactive }]} />;
}

function SlideArt({ slide, height }: { slide: Slide; height: number }) {
  const Icon = slide.icon;
  return (
    <View style={[styles.art, { height }]}>
      <View style={[styles.ring, { width: height * 0.72, height: height * 0.72, borderRadius: height }]} />
      <View style={[styles.ringInner, { width: height * 0.52, height: height * 0.52, borderRadius: height }]} />
      <View style={styles.artCard}>
        <Icon size={104} color={colors.yellow500} strokeWidth={1.3} />
      </View>
      <View style={styles.artBadge}>
        <Sparkles size={14} color={colors.green700} strokeWidth={2.2} />
        <Text style={styles.artBadgeText}>{slide.badge}</Text>
      </View>
    </View>
  );
}

/**
 * P1 Get Started (Part 2, Section 4) — three slides, yellow CTA on the green hero.
 * Lives at `/` so it is the app's default route.
 */
export default function GetStartedScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  useStatusBarStyle('light');
  const reducedMotion = useReducedMotion();
  const listRef = useRef<FlatList<Slide>>(null);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const heroHeight = Math.min(
    Math.round(height * 0.58),
    Math.max(height - insets.top - insets.bottom - 300, 240),
  );
  const artHeight = Math.max(heroHeight - insets.top - 64, 160);
  const isLast = active === slides.length - 1;
  const compact = height < 720;

  useEffect(() => {
    if (paused || isLast) return;
    const timer = setTimeout(() => {
      const next = active + 1;
      listRef.current?.scrollToIndex({ index: next, animated: !reducedMotion });
      setActive(next);
    }, 4000);
    return () => clearTimeout(timer);
  }, [active, isLast, paused, reducedMotion]);

  useEffect(
    () => () => {
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    },
    [],
  );

  const pauseAutoplay = () => {
    setPaused(true);
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => setPaused(false), 8000);
  };

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ListViewToken[] }) => {
    const index = viewableItems[0]?.index;
    if (typeof index === 'number') {
      setActive(index);
      selectionHaptic();
    }
  }, []);

  const goNext = () => {
    if (isLast) {
      router.push('/sign-up');
      return;
    }
    const next = active + 1;
    listRef.current?.scrollToIndex({ index: next, animated: !reducedMotion });
    setActive(next);
  };

  return (
    <LinearGradient
      colors={[colors.green500, colors.green700]}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={styles.root}>
      <View style={[styles.hero, { height: heroHeight }]}>
        <FlatList
          ref={listRef}
          style={styles.pager}
          data={slides}
          keyExtractor={(item) => item.key}
          horizontal
          pagingEnabled
          bounces={false}
          showsHorizontalScrollIndicator={false}
          onScrollBeginDrag={pauseAutoplay}
          onMomentumScrollEnd={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / width);
            setActive(Math.max(0, Math.min(index, slides.length - 1)));
            pauseAutoplay();
          }}
          getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
          viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
          onViewableItemsChanged={onViewableItemsChanged}
          renderItem={({ item }) => (
            <View style={{ width }}>
              <SlideArt slide={item} height={artHeight} />
            </View>
          )}
        />
      </View>

      <View style={[styles.logo, { top: insets.top + 12 }]} pointerEvents="none">
        <LogoBadge size={40} />
      </View>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel="Skip to sign up"
        hitSlop={12}
        onPress={() => router.push('/sign-up')}
        style={[styles.skip, { top: insets.top + 16 }]}>
        <Text style={styles.skipText}>Skip</Text>
      </Pressable>

      <View style={styles.dots}>
        {slides.map((slide, index) => (
          <ActiveDot key={slide.key} active={index === active} />
        ))}
      </View>

      <View style={[styles.textBlock, compact && styles.textBlockCompact]}>
        <Text
          accessibilityRole="header"
          style={[styles.title, compact && styles.titleCompact]}
          maxFontSizeMultiplier={1.3}>
          {slides[active].title}
        </Text>
        <Text style={styles.body} maxFontSizeMultiplier={1.3}>
          {slides[active].body}
        </Text>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + space[4] }]}>
        <Button label={isLast ? 'Get started' : 'Next'} variant="onGreen" onPress={goNext} />
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="I already have an account. Log in"
          onPress={() => router.push('/login')}
          style={styles.loginLink}>
          <Text style={styles.footerText} maxFontSizeMultiplier={1.3}>
            I already have an account.{' '}
            <Text style={styles.footerLink}>Log in</Text>
          </Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  pager: { flex: 1 },
  hero: {
    borderBottomLeftRadius: radius.hero,
    borderBottomRightRadius: radius.hero,
    overflow: 'hidden',
  },
  logo: { position: 'absolute', left: space[6] },
  skip: { position: 'absolute', right: space[6], minHeight: size.touch, justifyContent: 'center' },
  skipText: { fontFamily: font.bodySemi, fontSize: 14, color: colors.surface },
  art: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  ringInner: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  artCard: {
    width: 188,
    height: 188,
    borderRadius: 94,
    backgroundColor: 'rgba(28,65,30,0.35)',
    borderWidth: 1.5,
    borderColor: 'rgba(247,235,21,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.header,
  },
  artBadge: {
    position: 'absolute',
    bottom: '18%',
    right: space[6],
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1],
    height: 32,
    paddingHorizontal: space[3],
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    ...shadow.card,
  },
  artBadgeText: { fontFamily: font.bodySemi, fontSize: 12, color: colors.green900 },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: space[6],
    height: 6,
  },
  dot: { height: 6, borderRadius: 3 },
  textBlock: { paddingHorizontal: space[6], marginTop: space[4], gap: space[2] },
  textBlockCompact: { marginTop: space[2] },
  title: { ...text.display, color: colors.surface },
  titleCompact: { fontSize: 26, lineHeight: 32 },
  body: { ...text.bodyL, color: colors.whiteTextMuted },
  footer: {
    marginTop: 'auto',
    paddingHorizontal: space[6],
    paddingTop: space[6],
    gap: space[3],
  },
  loginLink: { minHeight: size.touch, alignItems: 'center', justifyContent: 'center' },
  footerText: { ...text.body, color: colors.whiteTextMuted },
  footerLink: {
    fontFamily: font.bodySemi,
    color: colors.yellow500,
    textDecorationLine: 'underline',
  },
});
