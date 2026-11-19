import { useRouter } from 'expo-router';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { LockKeyhole } from 'lucide-react-native';

import { acknowledgeSessionExpired, useSessionExpired } from '@/store/session';
import { colors, radius, space, text } from '@/theme';

import { Button } from './button';

/** P26 session-expiry modal; the saved booking draft is left untouched. */
export function SessionExpiredModal() {
  const router = useRouter();
  const expired = useSessionExpired();

  const logIn = () => {
    void acknowledgeSessionExpired();
    router.replace('/login');
  };

  return (
    <Modal
      visible={expired}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={logIn}>
      <View style={styles.scrim}>
        <View style={styles.card} accessibilityViewIsModal accessibilityRole="alert">
          <View style={styles.icon}>
            <LockKeyhole size={28} color={colors.green700} strokeWidth={2} />
          </View>
          <Text style={styles.title} maxFontSizeMultiplier={1.3}>
            Please log in again
          </Text>
          <Text style={styles.body} maxFontSizeMultiplier={1.3}>
            Your session has expired. Your booking draft is saved on this device, so you can pick up
            where you left off.
          </Text>
          <Button label="Log in" onPress={logIn} style={styles.action} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss and continue to log in"
            onPress={logIn}
            style={styles.helper}>
            <Text style={styles.helperText} maxFontSizeMultiplier={1.2}>
              We&apos;ll take you to the login screen.
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: colors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space[6],
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: space[6],
    alignItems: 'center',
    gap: space[3],
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.green50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...text.h2, textAlign: 'center' },
  body: { ...text.bodyM, color: colors.textMuted, textAlign: 'center' },
  action: { alignSelf: 'stretch', marginTop: space[2] },
  helper: { minHeight: 44, justifyContent: 'center' },
  helperText: { ...text.caption, textAlign: 'center' },
});
