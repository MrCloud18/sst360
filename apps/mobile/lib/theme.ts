import { colors } from './shared'
export type Theme = ReturnType<typeof makeTheme>
export const makeTheme = (dark: boolean) => ({
  dark,
  bg: dark ? colors.darkBg : colors.lightBg,
  surface: dark ? colors.darkSurface : colors.lightSurface,
  border: dark ? colors.darkBorder : colors.lightBorder,
  text: dark ? colors.textDark : colors.textLight,
  muted: dark ? colors.mutedDark : colors.muted,
  primary: colors.violet, secondary: colors.cyan,
  ok: colors.ok, warn: colors.warn, danger: colors.danger,
})
export const gradient = [colors.violet, colors.cyan] as const
