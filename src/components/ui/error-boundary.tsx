import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, font, radius, space, text } from '@/theme';

type Props = {
  children: React.ReactNode;
  onReset?: () => void;
};

type State = { error: Error | null };

export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  reset = () => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title} maxFontSizeMultiplier={1.3}>
            Something went wrong
          </Text>
          <Text style={styles.body} maxFontSizeMultiplier={1.3}>
            The app hit an unexpected error. You can try again, or restart the app if it keeps happening.
          </Text>
          <View style={styles.card}>
            <Text style={styles.errorText} selectable maxFontSizeMultiplier={1.2}>
              {this.state.error.message}
            </Text>
          </View>
          <Pressable accessibilityRole="button" onPress={this.reset} style={styles.button}>
            <Text style={styles.buttonText} maxFontSizeMultiplier={1.2}>
              Try again
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space[4], paddingTop: 80, gap: space[4] },
  title: { ...text.h2 },
  body: { ...text.body, color: colors.textMuted },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: space[4],
  },
  errorText: { ...text.caption, color: colors.error },
  button: {
    minHeight: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.green500,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space[4],
  },
  buttonText: { ...text.button, color: colors.surface, fontFamily: font.bodySemi },
});
