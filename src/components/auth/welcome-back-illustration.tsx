import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

import { auth } from '@/theme';

/** Interim welcome-back illustration: a happy returning user in a disc with success chips. */
export function WelcomeBackIllustration({ size = 190 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 190 190" accessibilityLabel="Welcome back illustration">
      <Circle cx={95} cy={95} r={92} fill="rgba(255,255,255,0.14)" />
      <Circle cx={95} cy={98} r={64} fill="rgba(255,255,255,0.10)" />

      {/* body */}
      <Path d="M52 150c4-24 22-38 43-38s39 14 43 38" fill="#F7FAF8" />
      <Rect x={73} y={90} width={44} height={34} rx={17} fill={auth.accent} />
      {/* head */}
      <Circle cx={95} cy={78} r={24} fill="#F4D4B8" />
      <Path d="M71 76c2-20 18-30 36-26 14 3 18 16 14 26-12-4-24-2-34 8-8 0-14-3-16-8z" fill="#214034" />
      {/* smile */}
      <Circle cx={87} cy={78} r={2.4} fill="#214034" />
      <Circle cx={103} cy={78} r={2.4} fill="#214034" />
      <Path d="M86 88c6 6 14 6 20 0" stroke="#214034" strokeWidth={2.4} strokeLinecap="round" fill="none" />

      {/* chips */}
      <G>
        <Circle cx={34} cy={56} r={16} fill="#FFFFFF" />
        <Path d="M34 48l2.4 4.8 5.3.8-3.8 3.7.9 5.3-4.8-2.5-4.8 2.5.9-5.3-3.8-3.7 5.3-.8z" fill={auth.btnText} />
      </G>
      <G>
        <Circle cx={156} cy={64} r={16} fill="#FFFFFF" />
        <Path d="M150 66c0-3 2.5-5 5.5-5h1c3 0 5.5 2 5.5 5v5h-2v-5c0-1.9-1.6-3.5-3.5-3.5h-1c-1.9 0-3.5 1.6-3.5 3.5v2c0 1.9 1.6 3.5 3.5 3.5h5v2h-5c-3 0-5.5-2-5.5-5v-2z" fill={auth.btnText} />
        <Path d="M148 70h4v6h-4z" fill={auth.btnText} />
      </G>
      <G>
        <Circle cx={148} cy={132} r={16} fill="#FFFFFF" />
        <Path d="M141 132l4.5 4.5 9.5-10" stroke={auth.btnText} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </G>
    </Svg>
  );
}
