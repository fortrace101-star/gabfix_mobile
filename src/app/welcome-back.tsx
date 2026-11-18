import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AuthScreen } from '@/components/auth/auth-screen';
import { PillButton } from '@/components/auth/pill-button';
import { WelcomeBackIllustration } from '@/components/auth/welcome-back-illustration';
import { useOnboardingUserName } from '@/store/onboarding';
import { auth, font } from '@/theme';

/** Landing screen after a successful login, before the Home dashboard. */
export default function WelcomeBackScreen() {
  const userName = useOnboardingUserName();
  const firstName = userName?.trim() || 'there';

  return (
    <AuthScreen
      blobs={['topRightLarge', 'bottomLeft', 'bottomRight']}
      contentTop={60}>
      <View style={styles.artWrap}>
        <WelcomeBackIllustration size={190} />

        <Text accessibilityRole="header" style={styles.title} maxFontSizeMultiplier={1.3}>
          Welcome Back!
        </Text>
        <Text style={styles.sub} maxFontSizeMultiplier={1.3}>
          Hey <Text style={styles.accent}>{firstName}</Text>, you&apos;re logged in to Gabfix Home
          Solutions.
        </Text>
      </View>

      <View style={styles.actions}>
        <PillButton label="Go To Home" onPress={() => router.replace('/home')} />
        <PillButton label="Dashboard" showArrow={false} onPress={() => router.replace('/home')} />
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  artWrap: { alignItems: 'center' },
  disc: {
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  title: {
    marginTop: 28,
    fontFamily: font.poppinsSemi,
    fontSize: 24,
    lineHeight: 30,
    color: auth.text,
    textAlign: 'center',
  },
  sub: {
    marginTop: 10,
    maxWidth: '80%',
    fontFamily: font.poppins,
    fontSize: 13,
    lineHeight: 19,
    color: auth.textSoft,
    textAlign: 'center',
  },
  accent: { fontFamily: font.poppinsSemi, color: auth.accent },
  actions: { marginTop: 'auto', paddingTop: 40, gap: 12 },
});
