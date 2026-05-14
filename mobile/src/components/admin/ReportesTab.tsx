import { useCallback, useEffect, useState } from 'react'
import { View, Pressable } from 'react-native'
import { adminApi } from '@/api/admin'
import type {
  CoberturaUnidad,
  CoberturaEstado,
  CoberturaGrupo,
  CoberturaVacuna,
  CallRecallCandidato,
} from '@/types/admin'
import { Text } from '@/components/ui/Text'
import { Alert } from '@/components/ui/Alert'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { TabSkeleton } from '@/components/ui/TabSkeleton'
import { colors, spacing } from '@/theme'

const GRUPO_LABEL: Record<string, string> = {
  adulto_mayor:   'Adultos mayores',
  embarazada:     'Embarazadas',
  personal_salud: 'Personal de salud',
  cronico:        'Pacientes cronicos',
  ninguno:        'Sin grupo',
}

function colorPct(pct: number) {
  if (pct >= 60) return colors.moss
  if (pct >= 30) return colors.ochre
  return colors.wine
}

export function ReportesTab({ refreshKey = 0 }: { refreshKey?: number }) {
  const [cobUnidad, setCobUnidad] = useState<CoberturaUnidad[]>([])
  const [cobEstado, setCobEstado] = useState<CoberturaEstado[]>([])
  const [cobGrupo, setCobGrupo] = useState<CoberturaGrupo[]>([])
  const [cobVacuna, setCobVacuna] = useState<CoberturaVacuna[]>([])
  const [callRecall, setCallRecall] = useState<CallRecallCandidato[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirmCallRecall, setConfirmCallRecall] = useState(false)
  const [busyDispatch, setBusyDispatch] = useState(false)
  const [dispatchResult, setDispatchResult] = useState<{ candidatos: number; enviados: number } | null>(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [u, e, g, v, cr] = await Promise.all([
        adminApi.reporteCoberturaUnidad(),
        adminApi.reporteCoberturaEstado(),
        adminApi.reporteCoberturaGrupo(),
        adminApi.reporteCoberturaVacuna(),
        adminApi.reporteCallRecall(30),
      ])
      setCobUnidad(u); setCobEstado(e); setCobGrupo(g); setCobVacuna(v); setCallRecall(cr)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar reportes.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])
  useEffect(() => {
    if (refreshKey > 0) cargar()
  }, [refreshKey, cargar])

  async function disparar() {
    setBusyDispatch(true)
    try {
      const res = await adminApi.dispararCallRecall(30)
      setDispatchResult({ candidatos: res.candidatos, enviados: res.push_result?.enviados || 0 })
      setConfirmCallRecall(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo disparar la campania.')
    } finally {
      setBusyDispatch(false)
    }
  }

  if (loading) {
    return <TabSkeleton rows={6} />
  }

  if (error) {
    return <Alert tipo="error" mensaje={error} />
  }

  return (
    <View style={{ gap: spacing.xxl }}>
      <ReporteSeccion titulo="Cobertura por estado">
        {cobEstado.length === 0 ? <Vacio /> : cobEstado.map((r) => (
          <Bar
            key={r.estado || 'sin-estado'}
            label={r.estado || 'Sin estado'}
            sub={`${r.dosis_aplicadas} dosis · ${r.total_usuarios} usuarios`}
            pct={r.cobertura_pct}
          />
        ))}
      </ReporteSeccion>

      <ReporteSeccion titulo="Cobertura por unidad medica">
        {cobUnidad.length === 0 ? <Vacio /> : cobUnidad.map((r) => (
          <Bar
            key={r.id}
            label={r.nombre}
            sub={`${r.ciudad || '—'} · ${r.dosis_aplicadas} dosis`}
            pct={r.cobertura_pct}
          />
        ))}
      </ReporteSeccion>

      <ReporteSeccion titulo="Cobertura por grupo prioritario">
        {cobGrupo.length === 0 ? <Vacio /> : cobGrupo.map((r) => (
          <Bar
            key={r.grupo_prioritario}
            label={GRUPO_LABEL[r.grupo_prioritario] || r.grupo_prioritario}
            sub={`${r.dosis_aplicadas} dosis · ${r.total_usuarios} personas`}
            pct={r.cobertura_pct}
          />
        ))}
      </ReporteSeccion>

      <ReporteSeccion titulo="Cobertura por vacuna">
        {cobVacuna.length === 0 ? <Vacio /> : cobVacuna.map((r) => (
          <Bar key={r.id} label={r.nombre} sub={`${r.usuarios_con_dosis}/${r.total_usuarios} usuarios`} pct={r.cobertura_pct} />
        ))}
      </ReporteSeccion>

      <View>
        <View style={{ borderBottomWidth: 1, borderBottomColor: colors.ink, paddingBottom: spacing.sm, marginBottom: spacing.md, flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text variant="h2">Call & recall</Text>
          <Text variant="eyebrow" color="muted">{callRecall.length} candidatos</Text>
        </View>
        <Text variant="small" color="muted" style={{ marginBottom: spacing.sm }}>
          Ciudadanos con esquema incompleto y mas de 30 dias sin dosis aplicada.
        </Text>
        <Pressable
          onPress={() => setConfirmCallRecall(true)}
          disabled={!callRecall.length}
          style={{
            paddingVertical: spacing.md,
            backgroundColor: callRecall.length ? colors.moss : colors.border,
            alignItems: 'center',
            marginBottom: spacing.md,
          }}
        >
          <Text color="paper" bold>Disparar campania</Text>
        </Pressable>

        {dispatchResult ? (
          <Alert
            tipo="exito"
            titulo="Campania ejecutada"
            mensaje={`Candidatos: ${dispatchResult.candidatos} · Push enviados: ${dispatchResult.enviados}`}
          />
        ) : null}

        {callRecall.slice(0, 20).map((c) => (
          <View
            key={c.curp}
            style={{ paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderSoft }}
          >
            <Text variant="body" bold numberOfLines={1}>{c.nombre} {c.apellido_paterno}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
              <Text variant="mono" color="muted" style={{ fontSize: 11 }}>{c.curp}</Text>
              <Text variant="small" color="wine">{c.dias_sin_dosis} dias · {c.pendientes} vacunas</Text>
            </View>
          </View>
        ))}
        {callRecall.length > 20 ? (
          <Text variant="small" color="muted" style={{ marginTop: spacing.sm }}>
            + {callRecall.length - 20} candidatos mas
          </Text>
        ) : null}
      </View>

      <Modal visible={confirmCallRecall} onClose={() => setConfirmCallRecall(false)} eyebrow="Confirmar" title="Disparar call & recall" maxWidth={420}>
        <Text variant="small" color="muted">
          Se enviara un push y un mensaje al buzon a cada ciudadano con esquema vencido. ¿Confirmas?
        </Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Button label="Cancelar" variant="ghost" onPress={() => setConfirmCallRecall(false)} />
          </View>
          <View style={{ flex: 1 }}>
            <Button label={busyDispatch ? 'Enviando...' : 'Disparar'} loading={busyDispatch} onPress={disparar} />
          </View>
        </View>
      </Modal>
    </View>
  )
}

function ReporteSeccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <View>
      <View style={{ borderBottomWidth: 1, borderBottomColor: colors.ink, paddingBottom: spacing.sm, marginBottom: spacing.md }}>
        <Text variant="h2">{titulo}</Text>
      </View>
      <View style={{ gap: spacing.sm }}>{children}</View>
    </View>
  )
}

function Bar({ label, sub, pct }: { label: string; sub?: string; pct: number }) {
  const safePct = Math.max(0, Math.min(100, pct || 0))
  return (
    <View style={{ paddingVertical: spacing.xs }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text variant="small" bold numberOfLines={1}>{label}</Text>
          {sub ? <Text variant="small" color="muted" style={{ fontSize: 11 }} numberOfLines={1}>{sub}</Text> : null}
        </View>
        <Text variant="mono" bold>{safePct}%</Text>
      </View>
      <View style={{ marginTop: spacing.xs, height: 4, backgroundColor: colors.bone }}>
        <View style={{ height: 4, width: `${safePct}%`, backgroundColor: colorPct(safePct) }} />
      </View>
    </View>
  )
}

function Vacio() {
  return <Text variant="small" color="muted">Sin datos disponibles.</Text>
}
