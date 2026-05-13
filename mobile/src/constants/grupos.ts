import type { GrupoPrioritario } from '@/types'

export const GRUPO_LABELS: Record<Exclude<GrupoPrioritario, 'ninguno'>, string> = {
  adulto_mayor:   'Adulto mayor',
  embarazada:     'Embarazada',
  personal_salud: 'Personal de salud',
  cronico:        'Cronico',
}

export function etiquetaGrupo(grupo: GrupoPrioritario | string | null | undefined): string {
  if (!grupo || grupo === 'ninguno') return ''
  return GRUPO_LABELS[grupo as keyof typeof GRUPO_LABELS] ?? String(grupo)
}
