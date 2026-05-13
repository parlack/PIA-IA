/**
 * Tokens de color. NUNCA hardcodear colores en componentes.
 */
export const colors = {
  paper:      '#F5F1E8',
  surface:    '#FFFFFF',
  bone:       '#EDE6D6',
  border:     '#DDD3BD',
  borderSoft: '#E8E0CD',
  ink:        '#1C1B17',
  ink2:       '#3A382E',
  muted:      '#6B6A60',
  muted2:     '#8B8073',
  moss:       '#0E5037',
  mossDark:   '#082E20',
  mossSoft:   '#D4E4D9',
  ochre:      '#B45309',
  wine:       '#991B1B',
} as const

export type ColorToken = keyof typeof colors
