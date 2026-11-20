import { LinearGradient } from 'expo-linear-gradient';
import { Download } from 'lucide-react-native';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LogoBadge } from '@/components/brand/logo-badge';
import { currentAppVersion, MIN_SUPPORTED_VERSION, storeUrl } from '@/config/release';
import { colors, font, radius, space, text } from '@/theme';

/**
 * P26 force update: full-screen block when this build is below the minimum supported
 * version. The only action is the platform store; there is no dismiss.
 */
export function ForceUpdateScreen() {
  const version = currentAppVersion();

  const update = async () => {
    const url = storeUrl();
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(
        'Open the store',
        'Search for “Gabfix Home Solutions” in your app store and install the latest version.',
      );
    }
  };

  return (
    <LinearGradient colors={[colors.green700, colors.green500]} style={styles.screen}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.body}>
          <LogoBadge size={64} />
          <Text style={styles.title} maxFontSizeMultiplier={1.2}>
            Update required
          </Text>
          <Text style={styles.copy} maxFontSizeMultiplier={1.3}>
            This version of Gabfix Home Solutions is no longer supported. Update to keep your
            bookings and payments working.
          </Text>
          <Text style={styles.versions} maxFontSizeMultiplier={1.2}>
            Installed {version} · needs {MIN_SUPPORTED_VERSION} or later
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Update Gabfix from the app store"
          onPress={() => void update()}
          style={({ pressed }) => [styles.update, pressed && styles.updatePressed]}>
          <Download size={18} color={colors.green700} strokeWidth={2} />
          <Text style={styles.updateText} maxFontSizeMultiplier={1.2}>
            Update now
          </Text>
        </Pressable>

        <Text style={styles.footnote} maxFontSizeMultiplier={1.2}>
          Your saved bookings stay on this device.
        </Text>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safe: {
    flex: 1,
    paddingHorizontal: space[6],
    paddingVertical: space[6],
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space[3] },
  title: {
    fontFamily: font.heading,
    fontSize: 28,
    lineHeight: 34,
    color: colors.surface,
    textAlign: 'center',
    marginTop: space[2],
  },
  copy: {
    ...text.bodyM,
    color: colors.whiteTextMuted,
    textAlign: 'center',
    maxWidth: 300,
  },
  versions: {
    ...text.caption,
    color: colors.whiteTextMuted,
    textAlign: 'center',
  },
  update: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
    alignSelf: 'stretch',
    minHeight: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  updatePressed: { opacity: 0.88 },
  updateText: {
    fontFamily: font.bodySemi,
    fontSize: 16,
    color: colors.green700,
  },
  footnote: { ...text.caption, color: colors.whiteTextMuted, marginTop: space[3] },
});
