import { StyleSheet } from 'react-native';

import { colors, font, radius, shadow, size, space, text } from './tokens';

/**
 * Shared component styles from Gabfix_App_Ui_2.md, Section 2.2.
 * Page code composes these instead of inventing local values.
 */
export const base = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: space[4], paddingBottom: space[6], gap: space[6] },
  row: { flexDirection: 'row', alignItems: 'center' },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: space[4],
    ...shadow.card,
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  hero: {
    backgroundColor: colors.green500,
    paddingHorizontal: space[4],
    paddingBottom: 56,
    borderBottomLeftRadius: radius.sheet,
    borderBottomRightRadius: radius.sheet,
  },
  overlapCard: {
    marginTop: -40,
    marginHorizontal: space[4],
    zIndex: 10,
    elevation: 6,
  },
});

export const btn = StyleSheet.create({
  base: {
    height: size.button,
    borderRadius: radius.button,
    paddingHorizontal: space[5],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
  },
  primary: { backgroundColor: colors.green500 },
  onGreen: { backgroundColor: colors.yellow500 },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.green500,
  },
  destructive: { backgroundColor: colors.error },
  ghost: { backgroundColor: 'transparent' },
  dangerGhost: { backgroundColor: 'transparent' },
  dangerGhostPressed: { backgroundColor: colors.errorBg },
  disabled: { backgroundColor: colors.disabledBg },
  small: { height: 40, paddingHorizontal: space[4], borderRadius: radius.input },
});

export const btnLabel = StyleSheet.create({
  primary: { ...text.button, color: colors.surface },
  onGreen: { ...text.button, color: colors.green900 },
  secondary: { ...text.button, color: colors.green500 },
  destructive: { ...text.button, color: colors.surface },
  ghost: { ...text.button, color: colors.green500 },
  dangerGhost: { ...text.button, color: colors.error },
  disabled: { ...text.button, color: colors.disabledText },
});

export const input = StyleSheet.create({
  ring: {
    padding: 3,
    borderRadius: radius.tile - 1,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  ringFocus: { borderWidth: 3, borderColor: colors.focusRing, padding: 0 },
  field: {
    height: size.input,
    borderRadius: radius.input,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
  },
  fieldFocus: { borderColor: colors.green500 },
  fieldError: { borderColor: colors.error },
  fieldDisabled: { backgroundColor: colors.disabledBg },
  text: {
    flex: 1,
    fontFamily: font.body,
    fontSize: 16,
    color: colors.text,
    padding: 0,
  },
  label: { ...text.bodyM, marginBottom: 6 },
  helper: { ...text.caption, marginTop: 6 },
  error: { ...text.caption, color: colors.error },
  multiline: { height: 120, alignItems: 'flex-start', paddingTop: space[3] },
});

export const chip = StyleSheet.create({
  base: {
    height: 48,
    minWidth: 56,
    paddingHorizontal: space[4],
    borderRadius: radius.input,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: { backgroundColor: colors.green500, borderColor: colors.green500 },
  disabled: { opacity: 0.4 },
  pill: { height: 32, borderRadius: radius.pill, paddingHorizontal: space[3] },
});

export const selectable = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    padding: space[4],
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    gap: space[3],
  },
  selected: { borderWidth: 2, borderColor: colors.green500, backgroundColor: colors.green50 },
});
