import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import { auth } from '@/theme';

/** Interim welcome illustration: a friendly cleaner with a mop and sparkles. */
export function WelcomeIllustration({ size = 220 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 220 220" accessibilityLabel="Cleaner illustration">
      <Circle cx={110} cy={110} r={102} fill="rgba(255,255,255,0.16)" />
      <Circle cx={110} cy={110} r={84} fill="rgba(255,255,255,0.10)" />

      {/* sparkles */}
      <G fill={auth.accent}>
        <Path d="M52 66l3 9 9 3-9 3-3 9-3-9-9-3 9-3z" />
        <Path d="M168 58l2.5 7 7 2.5-7 2.5-2.5 7-2.5-7-7-2.5 7-2.5z" />
        <Path d="M162 146l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" />
      </G>

      {/* mop handle */}
      <Rect x={136} y={48} width={8} height={110} rx={4} fill="#E8F2EC" />
      <Rect x={118} y={142} width={44} height={10} rx={5} fill="#D7E8DE" />
      {/* mop head */}
      <G>
        <Path d="M112 152h56c4 0 6 4 4 7l-8 16c-2 4-6 6-10 6h-28c-4 0-8-2-10-6l-8-16c-2-3 0-7 4-7z" fill="#F7FAF8" />
        <Path d="M120 152v22M132 152v25M144 152v25M156 152v22" stroke="#CFE2D7" strokeWidth={3} strokeLinecap="round" />
      </G>

      {/* body */}
      <Ellipse cx={96} cy={156} rx={34} ry={26} fill={auth.accent} />
      <Rect x={74} y={110} width={44} height={46} rx={22} fill="#F7FAF8" />
      {/* head */}
      <Circle cx={96} cy={92} r={22} fill="#F4D4B8" />
      <Path d="M74 90c2-18 16-28 32-24 12 3 18 14 14 24-10-4-22-2-30 6-8 0-14-2-16-6z" fill="#214034" />
      {/* face */}
      <Circle cx={89} cy={92} r={2.2} fill="#214034" />
      <Circle cx={103} cy={92} r={2.2} fill="#214034" />
      <Path d="M90 101c4 4 9 4 13 0" stroke="#214034" strokeWidth={2.2} strokeLinecap="round" fill="none" />
      {/* arm */}
      <Path d="M112 122c10 2 18 8 22 18" stroke="#F4D4B8" strokeWidth={10} strokeLinecap="round" fill="none" />
      {/* legs */}
      <Rect x={80} y={170} width={12} height={22} rx={6} fill="#214034" />
      <Rect x={100} y={170} width={12} height={22} rx={6} fill="#214034" />
    </Svg>
  );
}
