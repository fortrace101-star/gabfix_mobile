import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import { colors, duration, font, radius, shadow, text } from '@/theme';
import { selectionHaptic } from '@/utils/haptics';

type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

/** Track 48, 4 padding, animated white thumb (Gabfix_App_Ui_2.md, 6.0). */
export function SegmentedControl<T extends string>({ options, value, onChange }: Props<T>) {
  const [width, setWidth] = useState(0);
  const index = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  // Animated.Value is a stable mutable handle; state keeps the React Compiler ref rules happy.
  const [progress] = useState(() => new Animated.Value(index));
  const segment = width > 0 ? (width - 8) / options.length : 0;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: index,
      duration: duration.fast,
      useNativeDriver: true,
    }).start();
  }, [index, progress]);

  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);

  return (
    <View style={styles.track} onLayout={onLayout}>
      {segment > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.thumb,
            {
              width: segment,
              transform: [{ translateX: Animated.multiply(progress, segment) }],
            },
          ]}
        />
      ) : null}
      <View style={styles.labels}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityLabel={option.label}
              accessibilityState={{ selected }}
              onPress={() => {
                if (selected) return;
                selectionHaptic();
                onChange(option.value);
              }}
              style={styles.segment}>
              <Text
                maxFontSizeMultiplier={1.2}
                numberOfLines={1}
                style={[styles.label, selected && styles.labelOn]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 48,
    borderRadius: radius.button,
    backgroundColor: colors.disabledBg,
    padding: 4,
    justifyContent: 'center',
  },
  thumb: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: 11,
    backgroundColor: colors.surface,
    ...shadow.card,
  },
  labels: { flexDirection: 'row', flex: 1 },
  segment: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  label: { ...text.bodyM, fontSize: 13, color: colors.textMuted },
  labelOn: { color: colors.green700, fontFamily: font.bodySemi },
});
