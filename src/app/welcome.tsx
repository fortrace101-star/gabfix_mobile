import { ArrowRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Ellipse } from 'react-native-svg';

import { WelcomeIllustration } from '@/components/auth/welcome-illustration';
import { useStatusBarStyle } from '@/hooks/use-status-bar-style';
import { auth, colors, font } from '@/theme';
import { pressHaptic } from '@/utils/haptics';

/** One-job welcome screen: light hill over the brand base, copy, interim art and a Let's Go pill. */
export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  useStatusBarStyle('dark');
  const { width, height } = useWindowDimensions();
  const hillWidth = width * 1.5;
  const hillHeight = height * 0.62;

  return (
    <View style={styles.root}>
      <Svg
        width={hillWidth}
        height={hillHeight}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ position: 'absolute', top: -height * 0.08, left: -width * 0.25 }}>
        <Ellipse cx={50} cy={50} rx={50} ry={50} fill="#F3F4F2" />
      </Svg>

      <View style={[styles.copy, { top: insets.top + height * 0.14 }]}>
        <Text accessibilityRole="header" style={styles.heading} maxFontSizeMultiplier={1.3}>
          Welcome{'\n'}To <Text style={styles.accentHeading}>Gabfix Home Solutions</Text>
        </Text>
        <Text style={styles.body} maxFontSizeMultiplier={1.3}>
          Trusted, vetted cleaners across Kampala. Book a time that works for you.
        </Text>
      </View>

      <View
        style={[styles.art, { bottom: insets.bottom + 56 }]}
        accessible
        accessibilityLabel="Cleaner illustration">
        <WelcomeIllustration size={230} />
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Let's Go"
        onPress={() => {
          pressHaptic();
          router.replace('/login');
        }}
        style={({ pressed }) => [
          styles.cta,
          { bottom: insets.bottom + 28 },
          pressed && styles.ctaPressed,
        ]}>
        <Text style={styles.ctaLabel} maxFontSizeMultiplier={1.3}>
          Let&apos;s Go
        </Text>
        <ArrowRight size={14} color={auth.onAccentText} strokeWidth={2} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: auth.bgTop },
  copy: { position: 'absolute', left: 28, right: 28, gap: 12 },
  heading: {
    fontFamily: font.poppinsSemi,
    fontSize: 20,
    lineHeight: 28,
    color: '#16221A',
  },
  accentHeading: { color: colors.green700 },
  body: {
    maxWidth: '62%',
    fontFamily: font.poppins,
    fontSize: 12,
    lineHeight: 18,
    color: '#5F6F65',
  },
  art: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  cta: {
    position: 'absolute',
    right: 28,
    height: 48,
    minWidth: 120,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: auth.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  ctaPressed: { opacity: 0.9 },
  ctaLabel: {
    fontFamily: font.poppinsMedium,
    fontSize: 13,
    lineHeight: 18,
    color: auth.onAccentText,
  },
});
