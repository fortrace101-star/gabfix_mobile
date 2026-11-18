import { Pressable, StyleSheet, Text, View } from 'react-native';

import { auth, font } from '@/theme';
import { selectionHaptic } from '@/utils/haptics';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

/** 18 px white ring, 9 px accent dot when selected. */
export function RadioPill({ label, selected, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
      onPress={() => {
        selectionHaptic();
        onPress();
      }}
      style={styles.row}>
      <View style={[styles.ring, selected && styles.ringSelected]}>
        {selected ? <View style={styles.dot} /> : null}
      </View>
      <Text style={styles.label} maxFontSizeMultiplier={1.3}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 36 },
  ring: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: auth.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringSelected: { borderColor: auth.text },
  dot: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: auth.accent },
  label: {
    fontFamily: font.poppins,
    fontSize: 12,
    lineHeight: 18,
    color: auth.text,
  },
});
