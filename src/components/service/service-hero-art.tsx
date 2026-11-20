import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

/**
 * Interim P7 hero artwork (Open item 7). The landing renders service photography when
 * `content.heroImage` is supplied; until the shoot lands this line-art home keeps the
 * hero readable instead of a flat gradient.
 */
export function ServiceHeroArt() {
  return (
    <View style={styles.layer} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 390 260" preserveAspectRatio="xMidYMax slice">
        <Circle cx="330" cy="52" r="92" fill="#F7EB15" opacity={0.16} />
        <Circle cx="48" cy="238" r="108" fill="#FFFFFF" opacity={0.05} />
        <G opacity={0.16} stroke="#FFFFFF" strokeWidth={2} fill="none">
          <Path d="M236 206V138l46-34 46 34v68" />
          <Path d="M252 206v-38h26v38" />
          <Rect x="292" y="152" width="22" height="20" rx="3" />
          <Path d="M248 120l34-25 34 25" />
        </G>
        <G opacity={0.2} stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" fill="none">
          <Path d="M76 208v-40" />
          <Path d="M76 188c-16-4-24-14-24-28 16 2 24 12 24 28z" />
          <Path d="M76 196c16-4 24-14 24-28-16 2-24 12-24 28z" />
        </G>
        <G opacity={0.12} stroke="#FFFFFF" strokeWidth={1.5} fill="none">
          <Path d="M0 244c42-18 74-18 116 0s74 18 116 0 74-18 116 0 42 18 42 18" />
          <Path d="M0 256c42-18 74-18 116 0s74 18 116 0 74-18 116 0 42 18 42 18" />
        </G>
        <G opacity={0.22} stroke="#FFFFFF" strokeWidth={1.5} strokeLinecap="round">
          <Path d="M300 224h34M304 232h26" />
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { ...StyleSheet.absoluteFill },
});
