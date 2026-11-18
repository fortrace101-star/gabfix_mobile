import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { auth, font } from '@/theme';

type Props = {
  label: string;
  style?: StyleProp<ViewStyle>;
};

export function OrDivider({ label, style }: Props) {
  return (
    <View style={[styles.row, style]}>
      <View style={styles.line} />
      <Text style={styles.label} maxFontSizeMultiplier={1.3}>
        {label}
      </Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  line: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: auth.line },
  label: {
    fontFamily: font.poppins,
    fontSize: 11,
    lineHeight: 16,
    color: auth.textSoft,
  },
});
