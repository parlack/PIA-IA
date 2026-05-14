import { useEffect, useState } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { adminApi } from '@/api/admin'
import type { UsuarioAdminRow } from '@/types/admin'
import { Text } from '@/components/ui/Text'
import { Modal } from '@/components/ui/Modal'
import { Alert } from '@/components/ui/Alert'
import { colors, spacing } from '@/theme'

interface ResumenVacuna {
  vacuna_id: number
  nombre: string
  dosis_total: number
  dosis_aplicadas: number
  completa: boolean
  ultima_fecha: string | null
}

interface HistorialDosis {
  id: number
  vacuna_id: number
  numero_dosis: number
  fecha_aplicacion: string
  lugar_aplicacion: string | null
  lote: string | null
  vacuna_nombre: string
  dosis_total: number
}

interface HistorialResponse {
  resumen: ResumenVacuna[]
  historial: HistorialDosis[]
}

interface Props {
  usuario: UsuarioAdminRow | null
  visible: boolean
  onClose: () => void
}

const GRUPO_LABEL: Record<string, string> = {
  adulto_mayor:   'Adulto mayor',
  embarazada:     'Embarazada',
  personal_salud: 'Personal de salud',
  cronico:        'Paciente cronico',
  ninguno:        'Sin grupo',
}

function fmtFecha(s: string) {
  if (!s) return '—'
  const d = new Date(s.includes('T') ? s : `${s}T12:00:00`)
  if (Number.isNaN(d.getTime())) return s
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function HistorialUsuarioModal({ usuario, visible, onClose }: Props) {
  const [data, setData] = useState<HistorialResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!visible || !usuario) return
    setLoading(true)
    setError('')
    setData(null)
    adminApi.getVacunasUsuario(usuario.curp)
      .then((res) => setData(res as HistorialResponse))
      .catch((e) => setError(e instanceof Error ? e.message : 'No se pudo cargar el historial.'))
      .finally(() => setLoading(false))
  }, [visible, usuario])

  if (!usuario) return null

  const completadas = data?.resumen.filter((v) => v.completa).length ?? 0
  const totalCatalogo = data?.resumen.length ?? 0
  const pctEsquema = totalCatalogo ? Math.round((completadas / totalCatalogo) * 100) : 0

  return (
    <Modal visible={visible} onClose={onClose} eyebrow="Historial" title={`${usuario.nombre} ${usuario.apellido_paterno}`} maxWidth={620}>
      {/* Datos del usuario */}
      <View style={{ gap: spacing.xs }}>
        <Text variant="mono" color="muted" style={{ fontSize: 11 }}>{usuario.curp}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
          {usuario.unidad_nombre ? (
            <View>
              <Text variant="eyebrow" color="muted" style={{ fontSize: 10 }}>Unidad</Text>
              <Text variant="small">{usuario.unidad_nombre}</Text>
            </View>
          ) : null}
          {usuario.grupo_prioritario ? (
            <View>
              <Text variant="eyebrow" color="muted" style={{ fontSize: 10 }}>Grupo</Text>
              <Text variant="small">{GRUPO_LABEL[usuario.grupo_prioritario] || usuario.grupo_prioritario}</Text>
            </View>
          ) : null}
          {usuario.correo ? (
            <View>
              <Text variant="eyebrow" color="muted" style={{ fontSize: 10 }}>Correo</Text>
              <Text variant="small">{usuario.correo}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {loading ? (
        <View style={{ paddingVertical: spacing.xxl, alignItems: 'center' }}>
          <ActivityIndicator color={colors.moss} />
        </View>
      ) : error ? (
        <Alert tipo="error" mensaje={error} />
      ) : data ? (
        <>
          {/* Resumen progreso */}
          <View>
            <View style={{ borderBottomWidth: 1, borderBottomColor: colors.ink, paddingBottom: spacing.sm, marginBottom: spacing.sm, flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text variant="h3">Esquema</Text>
              <Text variant="mono" bold>{pctEsquema}%</Text>
            </View>
            <View style={{ height: 4, backgroundColor: colors.bone }}>
              <View style={{ height: 4, width: `${pctEsquema}%`, backgroundColor: pctEsquema === 100 ? colors.moss : colors.ink }} />
            </View>
            <Text variant="small" color="muted" style={{ marginTop: spacing.xs }}>
              {completadas} de {totalCatalogo} vacunas con esquema completo · {data.historial.length} dosis aplicadas
            </Text>
          </View>

          {/* Resumen por vacuna */}
          <View>
            <View style={{ borderBottomWidth: 1, borderBottomColor: colors.ink, paddingBottom: spacing.sm, marginBottom: spacing.sm }}>
              <Text variant="h3">Resumen por vacuna</Text>
            </View>
            {data.resumen.map((v) => (
              <View key={v.vacuna_id} style={{ paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderSoft }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text variant="small" bold numberOfLines={1}>{v.nombre}</Text>
                    {v.ultima_fecha ? (
                      <Text variant="small" color="muted" style={{ fontSize: 11, marginTop: 2 }}>Ultima: {fmtFecha(v.ultima_fecha)}</Text>
                    ) : null}
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text variant="mono" bold color={v.completa ? 'moss' : 'wine'}>
                      {v.dosis_aplicadas}/{v.dosis_total}
                    </Text>
                    {v.completa ? (
                      <Text variant="eyebrow" color="moss" style={{ fontSize: 9 }}>Completa</Text>
                    ) : (
                      <Text variant="eyebrow" color="wine" style={{ fontSize: 9 }}>Pendiente</Text>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Historial detallado */}
          {data.historial.length > 0 ? (
            <View>
              <View style={{ borderBottomWidth: 1, borderBottomColor: colors.ink, paddingBottom: spacing.sm, marginBottom: spacing.sm }}>
                <Text variant="h3">Historial detallado</Text>
              </View>
              {data.historial.map((h) => (
                <View key={h.id} style={{ paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderSoft }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text variant="small" bold numberOfLines={1} style={{ flex: 1 }}>{h.vacuna_nombre}</Text>
                    <Text variant="mono" color="muted" style={{ fontSize: 11 }}>Dosis #{h.numero_dosis}</Text>
                  </View>
                  <Text variant="mono" color="muted" style={{ fontSize: 11, marginTop: 2 }}>{fmtFecha(h.fecha_aplicacion)}</Text>
                  {h.lugar_aplicacion ? <Text variant="small" color="muted" style={{ fontSize: 11 }}>{h.lugar_aplicacion}</Text> : null}
                  {h.lote ? <Text variant="mono" color="muted" style={{ fontSize: 10 }}>Lote: {h.lote}</Text> : null}
                </View>
              ))}
            </View>
          ) : (
            <Alert tipo="advertencia" titulo="Sin dosis aplicadas" mensaje="Este usuario no tiene historial de vacunacion registrado." />
          )}
        </>
      ) : null}
    </Modal>
  )
}
