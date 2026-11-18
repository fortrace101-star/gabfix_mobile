import { Platform } from 'react-native';
import type { TextStyle, ViewStyle } from 'react-native';

/**
 * Gabfix design tokens.
 * Source: Gabfix_App_Ui_2.md, Section 2.1 (final values) with Part 1, Sections 2 to 4.
 * Never hard-code a colour, radius or spacing value in a screen.
 */
export const colors = {
  green50: '#E8F6EE',
  green100: '#C5E8D3',
  green300: '#5BBF86',
  green500: '#118E45',
  green700: '#1A5E2F',
  green900: '#1C411E',

  yellow50: '#FFFCE0',
  yellow200: '#F5EE5E',
  yellow500: '#F7EB15',
  yellow600: '#E7BE1F',
  yellow800: '#8A6D00',

  bg: '#F6F8F6',
  surface: '#FFFFFF',
  border: '#DDE5DF',
  disabledBg: '#E3E8E4',
  disabledText: '#9AA79F',

  text: '#16221A',
  textMuted: '#5F6F65',
  placeholder: '#9AA79F',

  success: '#118E45',
  successBg: '#E8F6EE',
  warning: '#E7A500',
  warningBg: '#FFF4D6',
  error: '#D32F2F',
  errorBg: '#FDECEC',
  info: '#1976D2',
  infoBg: '#E8F1FB',

  scrim: 'rgba(22,34,26,0.40)',
  focusRing: 'rgba(17,142,69,0.18)',
  whiteOverlay: 'rgba(255,255,255,0.16)',
  whiteTextMuted: 'rgba(255,255,255,0.85)',
  dotInactive: 'rgba(255,255,255,0.40)',

  mtn: '#FFCC00',
  airtel: '#E40000',
  visa: '#1A1F71',
} as const;

export const space = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export const radius = {
  input: 12,
  button: 14,
  card: 20,
  sheet: 28,
  hero: 40,
  pill: 999,
  tile: 16,
} as const;

export const size = {
  button: 52,
  buttonSm: 40,
  input: 52,
  header: 56,
  tabBar: 64,
  summaryBar: 72,
  touch: 48,
  icon: 24,
  iconSm: 20,
  avatarSm: 32,
  avatarMd: 48,
  avatarLg: 80,
  logo: 64,
} as const;

export const duration = {
  press: 100,
  fast: 180,
  base: 250,
  slow: 300,
  check: 600,
  shimmer: 1200,
} as const;

export const z = {
  base: 0,
  sticky: 10,
  header: 20,
  sheet: 30,
  toast: 40,
  modal: 50,
} as const;

export const font = {
  heading: 'Poppins_700Bold',
  headingSemi: 'Poppins_600SemiBold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
  poppins: 'Poppins_400Regular',
  poppinsMedium: 'Poppins_500Medium',
  poppinsSemi: 'Poppins_600SemiBold',
  poppinsBold: 'Poppins_700Bold',
} as const;

/**
 * Auth/onboarding surface palette (Page_refactor, 2.2, Palette A).
 * Colours are role-mapped from the mockups to the Gabfix green/yellow brand.
 */
export const auth = {
  bgTop: colors.green500,
  bgBottom: colors.green700,
  accent: colors.yellow500,
  onAccentText: colors.green900,
  glass: 'rgba(255,255,255,0.20)',
  glassStrong: 'rgba(255,255,255,0.30)',
  glassBorder: 'rgba(255,255,255,0.00)',
  placeholder: 'rgba(255,255,255,0.80)',
  fieldIcon: 'rgba(255,255,255,0.80)',
  text: '#FFFFFF',
  textSoft: 'rgba(255,255,255,0.88)',
  btnBg: '#FFFFFF',
  btnText: colors.green700,
  line: 'rgba(255,255,255,0.35)',
  dim: 0.45,
  error: '#FFD6D6',
} as const;

export const authSize = {
  pageX: 24,
  field: 48,
  gap: 12,
  radius: 999,
  brandTop: 12,
  logoMark: 28,
} as const;

export const text: Record<
  'display' | 'h1' | 'h2' | 'h3' | 'bodyL' | 'body' | 'bodyM' | 'caption' | 'button' | 'price',
  TextStyle
> = {
  display: { fontFamily: font.heading, fontSize: 32, lineHeight: 40, color: colors.text },
  h1: { fontFamily: font.heading, fontSize: 26, lineHeight: 34, color: colors.text },
  h2: { fontFamily: font.headingSemi, fontSize: 20, lineHeight: 28, color: colors.text },
  h3: { fontFamily: font.headingSemi, fontSize: 17, lineHeight: 24, color: colors.text },
  bodyL: { fontFamily: font.body, fontSize: 16, lineHeight: 24, color: colors.text },
  body: { fontFamily: font.body, fontSize: 14, lineHeight: 20, color: colors.text },
  bodyM: { fontFamily: font.bodyMedium, fontSize: 14, lineHeight: 20, color: colors.text },
  caption: { fontFamily: font.bodyMedium, fontSize: 12, lineHeight: 16, color: colors.textMuted },
  button: { fontFamily: font.bodySemi, fontSize: 16, lineHeight: 20 },
  price: {
    fontFamily: font.heading,
    fontSize: 20,
    lineHeight: 24,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
};

const makeShadow = (color: string, y: number, opacity: number, blur: number, elevation: number): ViewStyle =>
  Platform.select({
    ios: {
      shadowColor: color,
      shadowOffset: { width: 0, height: y },
      shadowOpacity: opacity,
      shadowRadius: blur,
    },
    android: { elevation, shadowColor: color },
    default: {
      boxShadow: `${0}px ${y}px ${blur}px ${color}`,
    },
  }) as ViewStyle;

export const shadow = {
  card: makeShadow('#1A5E2F', 4, 0.08, 16, 3),
  floating: makeShadow('#1C411E', -4, 0.12, 24, 8),
  header: makeShadow('#1C411E', 6, 0.15, 20, 6),
} as const;
