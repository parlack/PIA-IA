/**
 * Tokens tipograficos. Las fuentes se cargan globalmente en _layout.tsx.
 */
export const typography = {
  display: 'Fraunces',
  sans:    'IBM Plex Sans',
  mono:    'System',

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
