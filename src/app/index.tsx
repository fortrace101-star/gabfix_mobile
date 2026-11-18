import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { LogoBadge } from '@/components/brand/logo-badge';
import { useStatusBarStyle } from '@/hooks/use-status-bar-style';
import { useSessionStatus } from '@/store/session';
import { auth, font } from '@/theme';

const HOLD_MS = 1600;

/** First JS frame: logo and two-tone wordmark on the native splash colour. */
export default function SplashScreen() {
  useStatusBarStyle('light');
  const { height } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const sessionStatus = useSessionStatus();
  const [progress] = useState(() => new Animated.Value(reducedMotion ? 1 : 0));

  useEffect(() => {
    if (!reducedMotion) {
      Animated.timing(progress, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    }
  }, [progress, reducedMotion]);

  useEffect(() => {
    if (sessionStatus === 'loading') return;
    const timer = setTimeout(
      () => router.replace(sessionStatus === 'authenticated' ? '/welcome-back' : '/welcome'),
      HOLD_MS,
    );
    return () => clearTimeout(timer);
  }, [sessionStatus]);

  return (
    <View style={styles.root}>
      <View style={[styles.center, { height: height * 0.92 }]}>
        <Animated.View
          style={{
            opacity: progress,
            transform: [
              {
                scale: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.92, 1],
                }),
              },
            ],
            alignItems: 'center',
          }}>
          <LogoBadge size={120} />
          <View style={styles.wordmark}>
            <Text style={styles.name} maxFontSizeMultiplier={1.3}>
              Gabfix
            </Text>
            <Text style={styles.sub} maxFontSizeMultiplier={1.3}>
              Home Solutions
            </Text>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: auth.bgTop },
  center: { justifyContent: 'center', alignItems: 'center' },
  wordmark: { marginTop: 16, alignItems: 'center' },
  name: {
    fontFamily: font.poppinsBold,
    fontSize: 34,
    lineHeight: 38,
    color: auth.text,
    textAlign: 'center',
  },
  sub: {
    fontFamily: font.poppinsBold,
    fontSize: 22,
    lineHeight: 28,
    color: auth.accent,
    textAlign: 'center',
  },
});
