/**
 * Единственное место, где задаются размеры шрифтов. Значения — токены шкалы
 * `Text`/`Heading` (`src/shared/ui/text/styles.tsx`); в компонентах размер
 * текста указывается только через эти константы, а не строками.
 */
export const FontSize = {
  /** 12 px */
  xs: 'xs',
  /** 14 px */
  sm: 'sm',
  /** 16 px */
  md: 'md',
  /** 18 px */
  lg: 'lg',
  /** 20 px */
  xl: 'xl',
  /** 24 px */
  xxl: '2xl',
} as const

export type FontSizeToken = (typeof FontSize)[keyof typeof FontSize]
