/**
 * Hero superior reutilizable en todas las screens del expediente.
 */
import { View } from 'react-native'

import { Text } from '@/components/ui/Text'
import { GrupoBadge } from '@/components/domain/GrupoBadge'
import { colors, spacing } from '@/theme'
import type { UsuarioPublico } from '@/types'

interface Props {
  usuario:        UsuarioPublico | null
  curp:           string
  eyebrow?:       string
  titulo?:        string
  tituloItalic?:  string
}

export function HeroExpediente({
  usuario,
  curp,
  eyebrow = 'Mi cartilla',
  titulo = 'Cartilla de',
  tituloItalic = 'vacunacion.',
}: Props) {
  return (
    <View
      style={{
        borderBottomWidth: 2,
        borderBottomColor: colors.ink,
        paddingBottom: spacing.lg,
        marginBottom: spacing.xl,
      }}
    >
      <Text variant="eyebrow" color="muted">{eyebrow}</Text>
      <Text variant="display" style={{ marginTop: spacing.sm }}>
        {titulo}{'\n'}<Text variant="display" italic>{tituloItalic}</Text>
      </Text>

      {usuario ? (
        <View
          style={{
            marginTop: spacing.md,
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            flexWrap: 'wrap',
          }}
        >
          <Text variant="small" color="muted">
            {usuario.nombre} {usuario.apellido_paterno}
          </Text>
          <GrupoBadge grupo={usuario.grupo_prioritario} />
        </View>
      ) : null}

      {curp ? (
        <View
          style={{
            marginTop: spacing.md,
            backgroundColor: colors.bone,
            paddingHorizontal: spacing.sm,
            paddingVertical: 4,
            alignSelf: 'flex-start',
          }}
        >
          <Text variant="mono" style={{ fontSize: 11, letterSpacing: 0.8 }}>{curp}</Text>
        </View>
      ) : null}
    </View>
  )
}
