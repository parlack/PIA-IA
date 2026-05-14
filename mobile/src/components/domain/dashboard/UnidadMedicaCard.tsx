/**
 * Tarjeta con detalles de la unidad medica del ciudadano.
 */
import { View } from 'react-native'

import { Text } from '@/components/ui/Text'
import { colors, spacing } from '@/theme'
import type { UsuarioPublico } from '@/types'

interface Props {
  usuario: UsuarioPublico | null
}

function lineaUnidad(u: UsuarioPublico | null): string {
  if (!u?.unidad_nombre) return '—'
  const loc = [u.ciudad, u.estado].filter(Boolean).join(', ')
  return loc ? `${u.unidad_nombre} — ${loc}` : u.unidad_nombre
}

function Campo({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={{ flexBasis: '47%', flexGrow: 1, marginBottom: spacing.md }}>
      <Text variant="eyebrow" color="muted">{label}</Text>
      <Text
        variant={mono ? 'mono' : 'body'}
        bold={!mono}
        style={{ marginTop: 4 }}
      >
        {value || '—'}
      </Text>
    </View>
  )
}

export function UnidadMedicaCard({ usuario }: Props) {
  if (!usuario) return null

  return (
    <View style={{ marginBottom: spacing.xxl }}>
      <View
        style={{
          borderBottomWidth: 1,
          borderBottomColor: colors.ink,
          paddingBottom: spacing.sm,
          marginBottom: spacing.md,
        }}
      >
        <Text variant="h2">Unidad medica</Text>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: spacing.lg }}>
        <Campo label="UMF" value={lineaUnidad(usuario)} />
        <Campo label="Telefono" value={usuario.unidad_telefono ?? '—'} mono />
        <Campo label="Medico familiar" value={usuario.medico_familiar ?? '—'} />
        <Campo label="No. Seguridad Social" value={usuario.nss ?? '—'} mono />
      </View>
    </View>
  )
}
