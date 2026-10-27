import type { ColorSchemeName } from 'react-native'

/**
 * Значения дублируют семантические токены из `src/global.css`.
 *
 * Нужны только там, где API нативного UI принимает цвет строкой, а не
 * className: панель табов, заголовки навигации, StatusBar, графики. При изменении
 * токенов обновлять и здесь — это единственное место с «сырыми» цветами.
 */
const light = {
  background: 'rgb(255, 255, 255)',
  foreground: 'rgb(10, 10, 10)',
  card: 'rgb(255, 255, 255)',
  border: 'rgb(229, 229, 229)',
  mutedForeground: 'rgb(115, 115, 115)',
  primary: 'rgb(23, 23, 23)',
  primaryForeground: 'rgb(250, 250, 250)',
  muted: 'rgb(245, 245, 245)',
  chart1: 'rgb(245, 73, 0)',
  chart2: 'rgb(0, 150, 137)',
  chart3: 'rgb(16, 78, 100)',
  chart4: 'rgb(255, 185, 0)',
}

const dark = {
  background: 'rgb(10, 10, 10)',
  foreground: 'rgb(250, 250, 250)',
  card: 'rgb(10, 10, 10)',
  border: 'rgb(38, 38, 38)',
  mutedForeground: 'rgb(161, 161, 161)',
  primary: 'rgb(250, 250, 250)',
  primaryForeground: 'rgb(23, 23, 23)',
  muted: 'rgb(38, 38, 38)',
  chart1: 'rgb(20, 71, 230)',
  chart2: 'rgb(0, 188, 125)',
  chart3: 'rgb(254, 154, 0)',
  chart4: 'rgb(173, 70, 255)',
}

export type NavigatorColors = typeof light

export function getNavigatorColors(
  scheme: ColorSchemeName | null | undefined,
): NavigatorColors {
  return scheme === 'dark' ? dark : light
}
