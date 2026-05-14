/**
 * Tabla/lista completa de vacunas con filtro de busqueda.
 */
import { useMemo, useState } from 'react'
import { TextInput, View } from 'react-native'

import { Text } from '@/components/ui/Text'
import { VacunaRow } from '@/components/domain/VacunaRow'
import { colors, spacing } from '@/theme'
import type { ResumenVacuna } from '@/types'

interface Props {
  resumen:     ResumenVacuna[]
  searchable?: boolean
  titulo?:     string
}

export function VacunasTable({ resumen, searchable = true, titulo = 'Mis vacunas' }: Props) {
  const [filtro, setFiltro] = useState('')

  const resumenFiltrado = useMemo(() => {
    const q = filtro.trim().toLowerCase()
    if (!q) return resumen
    return resumen.filter(v => v.nombre.toLowerCase().includes(q))
  }, [resumen, filtro])

  return (
    <View style={{ marginBottom: spacing.xxl }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          borderBottomWidth: 1,
          borderBottomColor: colors.ink,
          paddingBottom: spacing.sm,
          marginBottom: spacing.md,
          gap: spacing.sm,
          flexWrap: 'wrap',
        }}
      >
        <Text variant="h2">{titulo}</Text>
        <Text variant="eyebrow" color="muted">
          {resumenFiltrado.length} resultados
        </Text>
      </View>

      {searchable ? (
        <View
          style={{
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            marginBottom: spacing.md,
          }}
        >
          <TextInput
            value={filtro}
            onChangeText={setFiltro}
            placeholder="Buscar vacuna..."
            placeholderTextColor={colors.muted2}
            style={{
              fontSize: 14,
              paddingVertical: 6,
              color: colors.ink,
              fontFamily: 'IBMPlexSans',
            }}
          />
        </View>
      ) : null}

      {resumenFiltrado.length === 0 ? (
        <View style={{ paddingVertical: spacing.xxl, alignItems: 'center' }}>
          <Text variant="small" color="muted">
            Sin resultados{filtro ? `: "${filtro}"` : ''}
          </Text>
        </View>
      ) : (
        <View>
          {resumenFiltrado.map((v, i) => (
            <VacunaRow
              key={v.vacuna_id}
              vacuna={v}
              showDivider={i < resumenFiltrado.length - 1}
            />
          ))}
        </View>
      )}
    </View>
  )
}
