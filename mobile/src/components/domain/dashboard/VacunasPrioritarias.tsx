/**
 * Seccion destacada con las vacunas mas prioritarias del ciudadano.
 *
 * Estas son alertas con prioridad 'alta' segun el grupo prioritario del
 * usuario (adulto mayor, embarazada, personal de salud, cronico). Se
 * muestran como cards editoriales que enfatizan la accion a tomar.
 */
import { View } from 'react-native'

import { Text } from '@/components/ui/Text'
import { colors, spacing } from '@/theme'
import type { Alerta } from '@/types'

interface Props {
  alertas: Alerta[]
}

export function VacunasPrioritarias({ alertas }: Props) {
  if (!alertas.length) return null

  return (
    <View style={{ marginBottom: spacing.xxl }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          borderBottomWidth: 1,
          borderBottomColor: colors.ink,
          paddingBottom: spacing.sm,
          marginBottom: spacing.md,
        }}
      >
        <Text variant="h2">Mas prioritarias</Text>
        <Text variant="eyebrow" color="ochre">
          {alertas.length} {alertas.length === 1 ? 'urgente' : 'urgentes'}
        </Text>
      </View>

      <Text variant="small" color="muted" style={{ marginBottom: spacing.md }}>
        Estas son las vacunas que necesitas atender pronto segun tu perfil de
        salud. Acude a tu UMF o brigada para aplicarlas.
      </Text>

      <View style={{ gap: spacing.md }}>
        {alertas.map((a, i) => (
          <View
            key={a.vacuna_id}
            style={{
              borderWidth: 1,
              borderColor: colors.ochre,
              borderLeftWidth: 4,
              backgroundColor: 'rgba(180,83,9,0.04)',
              padding: spacing.md,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                gap: spacing.sm,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, flex: 1 }}>
                <Text variant="mono" color="ochre" style={{ fontSize: 11, opacity: 0.7 }}>
                  {String(i + 1).padStart(2, '0')}
                </Text>
                <Text variant="h3" style={{ flex: 1 }} numberOfLines={2}>
                  {a.nombre}
                </Text>
              </View>
              <Text variant="mono" color="ochre" style={{ fontSize: 10, letterSpacing: 1.4 }}>
                ALTA
              </Text>
            </View>

            <View
              style={{
                flexDirection: 'row',
                gap: spacing.lg,
                marginTop: spacing.sm,
                paddingTop: spacing.sm,
                borderTopWidth: 1,
                borderTopColor: 'rgba(180,83,9,0.2)',
              }}
            >
              <View>
                <Text variant="eyebrow" color="muted">Faltantes</Text>
                <Text variant="h2" color="ochre" style={{ marginTop: 2 }}>
                  {a.dosis_faltantes}
                </Text>
              </View>
              <View>
                <Text variant="eyebrow" color="muted">Aplicadas</Text>
                <Text variant="h2" style={{ marginTop: 2 }}>
                  {a.dosis_aplicadas}<Text variant="body" color="muted">/{a.dosis_total}</Text>
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}
