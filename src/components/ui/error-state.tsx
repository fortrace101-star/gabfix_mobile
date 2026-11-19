import { AlertCircle } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, space, text } from '@/theme';

import { Button } from './button';

type Props = {
  title: string;
  body: string;
  onRetry: () => void;
  onContactSupport?: () => void;
  retryLoading?: boolean;
};

/** P26 full-screen error: 56 icon in a 96 error circle, retry and support actions. */
export function ErrorState({ title, body, onRetry, onContactSupport, retryLoading }: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.iconCircle}>
        <AlertCircle size={56} color={colors.error} strokeWidth={1.8} />
      </View>
      <Text style={styles.title} maxFontSizeMultiplier={1.3}>
        {title}
      </Text>
      <Text style={styles.body} maxFontSizeMultiplier={1.3}>
        {body}
      </Text>
      <View style={styles.actions}>
        <Button label="Try again" onPress={onRetry} loading={retryLoading} />
        {onContactSupport ? (
          <Button label="Contact support" variant="ghost" onPress={onContactSupport} />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space[6],
    gap: space[2],
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: radius.pill,
    backgroundColor: colors.errorBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space[2],
  },
  title: { ...text.h3, textAlign: 'center' },
  body: { ...text.bodyM, color: colors.textMuted, textAlign: 'center', maxWidth: 300 },
  actions: { alignSelf: 'stretch', gap: space[2], marginTop: space[4] },
});
