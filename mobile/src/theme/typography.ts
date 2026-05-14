/**
 * Tokens tipograficos. Las fuentes se cargan en _layout.tsx via expo-font.
 *
 * Familias disponibles (deben coincidir con las cargadas en _layout):
 *   - Fraunces, Fraunces-Medium, Fraunces-SemiBold, Fraunces-Italic, Fraunces-SemiBoldItalic
 *   - IBMPlexSans, IBMPlexSans-Medium, IBMPlexSans-SemiBold
 *   - IBMPlexMono, IBMPlexMono-Medium
 */
export const typography = {
  display: 'Fraunces',
  sans:    'IBMPlexSans',
  mono:    'IBMPlexMono',

  families: {
    display:          'Fraunces',
    displayMedium:    'Fraunces-Medium',
    displaySemibold:  'Fraunces-SemiBold',
    displayItalic:    'Fraunces-Italic',
    displaySemiboldItalic: 'Fraunces-SemiBoldItalic',
    sans:             'IBMPlexSans',
    sansMedium:       'IBMPlexSans-Medium',
    sansSemibold:     'IBMPlexSans-SemiBold',
    mono:             'IBMPlexMono',
    monoMedium:       'IBMPlexMono-Medium',
  } as const,

  weights: {
    regular:  '400' as const,
    medium:   '500' as const,
    semibold: '600' as const,
  },

  sizes: {
    xxs: 10,
    xs:  12,
    sm:  14,
    md:  15,
    lg:  18,
    xl:  22,
    xxl: 28,
    display: 36,
    displayLg: 48,
  },

  spacing: {
    eyebrow: 1.6,
    headline: -0.4,
  },
} as const

/**
 * Resuelve la familia tipografica correcta para una combinacion
 * de variante (display/sans/mono) + peso + italic.
 * Esto evita depender de fontWeight (que en iOS no resuelve la cara correcta
 * si la familia tiene archivos separados por peso, como en este theme).
 */
export function resolveFontFamily(opts: {
  variant: 'display' | 'sans' | 'mono'
  bold?: boolean
  italic?: boolean
}): string {
  const { variant, bold, italic } = opts
  if (variant === 'display') {
    if (bold && italic) return typography.families.displaySemiboldItalic
    if (italic)         return typography.families.displayItalic
    if (bold)           return typography.families.displaySemibold
    return typography.families.display
  }
  if (variant === 'mono') {
    return bold ? typography.families.monoMedium : typography.families.mono
  }
  if (bold) return typography.families.sansSemibold
  return typography.families.sans
}
