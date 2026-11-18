import Svg, { Path } from 'react-native-svg';
import { StyleSheet, useWindowDimensions, View, type ViewStyle } from 'react-native';

import { auth } from '@/theme';

export type BlobVariant =
  | 'topRight'
  | 'topRightLarge'
  | 'topCenterLeft'
  | 'bottomLeft'
  | 'bottomRight';

type Shape = {
  d: string;
  viewBox: string;
  width: number;
  height: number;
  ratio: number;
  position: ViewStyle;
};

const SHAPES: Record<BlobVariant, Shape> = {
  topRight: {
    viewBox: '0 0 160 130',
    width: 160,
    height: 130,
    ratio: 0.46,
    d: 'M38 0H160V78C152 104 124 122 102 98C88 82 80 72 62 62C34 47 14 22 38 0Z',
    position: { top: 0, right: 0 },
  },
  topRightLarge: {
    viewBox: '0 0 200 170',
    width: 200,
    height: 170,
    ratio: 0.52,
    d: 'M60 0H200V96C190 132 150 158 120 126C104 108 92 98 70 88C34 70 20 28 60 0Z',
    position: { top: 0, right: 0 },
  },
  topCenterLeft: {
    viewBox: '0 0 150 120',
    width: 150,
    height: 120,
    ratio: 0.4,
    d: 'M0 0H138C152 30 128 52 108 72C92 88 96 112 64 112C34 112 0 92 0 56V0Z',
    position: { top: 0, left: '12%' },
  },
  bottomLeft: {
    viewBox: '0 0 190 150',
    width: 190,
    height: 150,
    ratio: 0.5,
    d: 'M0 40C40 30 62 52 92 60C128 70 178 70 190 112V150H0V40Z',
    position: { bottom: 0, left: 0 },
  },
  bottomRight: {
    viewBox: '0 0 180 130',
    width: 180,
    height: 130,
    ratio: 0.46,
    d: 'M180 20V130H40C20 128 18 96 52 82C84 70 100 50 128 34C150 22 166 14 180 20Z',
    position: { bottom: 0, right: 0 },
  },
};

type Props = {
  variant: BlobVariant;
  /** Override the variant's width ratio (e.g. 0.34 for the area sheet). */
  ratio?: number;
};

/** Organic accent shape that bleeds off the page edge, behind the content. */
export function Blob({ variant, ratio }: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const shape = SHAPES[variant];
  const width = screenWidth * (ratio ?? shape.ratio);
  const height = (width / shape.width) * shape.height;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg
        width={width}
        height={height}
        viewBox={shape.viewBox}
        style={[styles.shape, shape.position]}>
        <Path d={shape.d} fill={auth.accent} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  shape: { position: 'absolute' },
});
