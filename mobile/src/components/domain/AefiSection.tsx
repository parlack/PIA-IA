/**
 * Seccion editorial de eventos adversos (AEFI) del ciudadano.
 *
 * Espejo nativo de `frontend/app/components/domain/AefiSection.vue`:
 *  - Lista de reportes propios con sintomas, severidad y fecha
 *  - Boton "+ Reportar" que abre un modal con selector de dosis elegibles
 *    (solo dosis dentro de la ventana_dias devuelta por backend)
 *  - Si no hay dosis reportables, muestra mensaje informativo
 */
import { useCallback, useEffect, useState } from 'react'
import { View, Pressable } from 'react-native'

import { Text } from '@/components/ui/Text'
import { Field } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { ChipSelector } from '@/components/ui/ChipSelector'
import { useToast } from '@/components/ui/Toast'

import {
  aefiApi,
  type AefiReporteUsuario,
  type DosisReportable,
  type SeveridadAefi,
} from '@/api/aefi'
import { colors, spacing } from '@/theme'

const SEVERIDADES: { key: SeveridadAefi; label: string }[] = [
  { key: 'leve', label: 'Leve' },
  { key: 'moderada', label: 'Moderada' },
  { key: 'severa', label: 'Severa' },
  { key: 'grave', label: 'Grave' },
]

const COLOR_SEVERIDAD: Record<string, keyof typeof colors> = {
  leve: 'moss',
  moderada: 'ochre',
  severa: 'wine',
  grave: 'wine',
}

const SINTOMAS_COMUNES = [
  'Fiebre',
  'Dolor en el sitio de inyeccion',
  'Enrojecimiento local',
  'Hinchazon local',
  'Dolor de cabeza',
  'Fatiga / Cansancio',
  'Dolor muscular',
  'Dolor articular',
  'Nausea',
  'Vomito',
  'Diarrea',
  'Erupcion cutanea',
  'Mareo',
  'Escalofrios',
  'Inflamacion de ganglios',
] as const

type Props = {
  curp: string
}

export function AefiSection({ curp }: Props) {
  const toast = useToast()
  const [reportes, setReportes] = useState<AefiReporteUsuario[]>([])
  const [dosisReportables, setDosisReportables] = useState<DosisReportable[]>([])
  const [ventanaDias, setVentanaDias] = useState(30)
  const [cargando, setCargando] = useState(true)

  const [showReportar, setShowReportar] = useState(false)
  const [showSinDosis, setShowSinDosis] = useState(false)

  const [form, setForm] = useState<{
    dosis_id: number | null
    sintomasSelec: string[]
    sintomasOtros: string
    severidad: SeveridadAefi
    inicio_minutos: string
    requiere_seguimiento: boolean
  }>({
    dosis_id: null,
    sintomasSelec: [],
    sintomasOtros: '',
    severidad: 'leve',
    inicio_minutos: '',
    requiere_seguimiento: false,
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const recargar = useCallback(async () => {
    setCargando(true)
    try {
      const [r, dr] = await Promise.all([
        aefiApi.listarPorUsuario(curp),
        aefiApi.dosisReportables(curp),
      ])
      setReportes(r)
      setDosisReportables(dr.dosis || [])
      setVentanaDias(dr.ventana_dias || 30)
    } catch {
      // silencioso
    } finally {
      setCargando(false)
    }
  }, [curp])

  useEffect(() => { recargar() }, [recargar])

  function abrirReportar() {
    if (!dosisReportables.length) {
      setShowSinDosis(true)
      return
    }
    setForm({
      dosis_id: dosisReportables[0]!.id,
      sintomasSelec: [],
      sintomasOtros: '',
      severidad: 'leve',
      inicio_minutos: '',
      requiere_seguimiento: false,
    })
    setError('')
    setShowReportar(true)
  }

  async function guardarReporte() {
    setError('')
    if (!form.dosis_id) {
      setError('Selecciona la dosis a reportar.')
      return
    }
    // Concatenamos la seleccion + texto libre. El backend espera un string.
    const partes: string[] = []
    if (form.sintomasSelec.length) partes.push(form.sintomasSelec.join(', '))
    if (form.sintomasOtros.trim()) partes.push(form.sintomasOtros.trim())
    const sintomasFinal = partes.join(' · ')

    if (sintomasFinal.length < 3) {
      setError('Selecciona o describe los sintomas.')
      return
    }
    setBusy(true)
    try {
      const minutos = form.inicio_minutos.trim()
        ? parseInt(form.inicio_minutos.replace(/[^0-9]/g, ''), 10) || undefined
        : undefined
      await aefiApi.reportar({
        dosis_id: form.dosis_id,
        sintomas: sintomasFinal,
        severidad: form.severidad,
        inicio_minutos: minutos,
        requiere_seguimiento: form.requiere_seguimiento,
      })
      setShowReportar(false)
      await recargar()
      toast.success(
        'Tu reporte ayuda a la farmacovigilancia nacional.',
        'Reporte registrado',
      )
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo registrar el reporte.'
      setError(msg)
      toast.error(msg, 'Error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <View style={{ marginTop: spacing.xxl }}>
      {/* Header editorial */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          borderBottomWidth: 1,
          borderBottomColor: colors.ink,
          paddingBottom: spacing.sm,
          marginBottom: spacing.sm,
          gap: spacing.sm,
        }}
      >
        <Text variant="h2" style={{ flexShrink: 1 }}>Eventos adversos</Text>
        <Pressable onPress={abrirReportar} hitSlop={6}>
          <Text variant="eyebrow">+ Reportar</Text>
        </Pressable>
      </View>

      <Text variant="small" color="muted" style={{ marginBottom: spacing.xs }}>
        Si has experimentado algun efecto adverso despues de una vacuna,
        reportalo aqui. Tus reportes contribuyen a la farmacovigilancia.
      </Text>
      <Text
        variant="mono"
        color="muted"
        style={{
          fontSize: 11,
          letterSpacing: 0.5,
          marginBottom: spacing.md,
        }}
      >
        Ventana de reporte: {ventanaDias} dias posteriores a la dosis.
        {!cargando && dosisReportables.length
          ? ` · ${dosisReportables.length} dosis elegible${dosisReportables.length === 1 ? '' : 's'} ahora.`
          : ''}
      </Text>

      {cargando ? (
        <View style={{ gap: spacing.sm, paddingVertical: spacing.md }}>
          <Skeleton width="70%" />
          <Skeleton width="40%" height={10} />
          <Skeleton width="85%" />
        </View>
      ) : reportes.length === 0 ? (
        <View style={{ paddingVertical: spacing.xl, alignItems: 'center' }}>
          <Text
            variant="h2"
            italic
            color="muted"
            style={{ textAlign: 'center', fontSize: 18 }}
          >
            Sin reportes previos.
          </Text>
        </View>
      ) : (
        reportes.map((r, i) => (
          <View
            key={r.id}
            style={{
              paddingVertical: spacing.md,
              borderBottomWidth: i < reportes.length - 1 ? 1 : 0,
              borderBottomColor: colors.borderSoft,
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
              <Text variant="body" bold style={{ flex: 1 }} numberOfLines={1}>
                {r.vacuna_nombre}
              </Text>
              <Text
                variant="mono"
                color={COLOR_SEVERIDAD[r.severidad] || 'muted'}
                style={{ fontSize: 10, letterSpacing: 1 }}
              >
                {r.severidad.toUpperCase()}
              </Text>
            </View>
            <Text variant="small" color="muted" style={{ marginTop: 2 }}>
              Dosis del {r.fecha_aplicacion} · reportado el{' '}
              {r.creado_en.split(' ')[0]}
              {r.inicio_minutos != null ? ` · inicio +${r.inicio_minutos} min` : ''}
            </Text>
            <Text variant="small" style={{ marginTop: spacing.xs }}>
              {r.sintomas}
            </Text>
            {r.requiere_seguimiento ? (
              <Text
                variant="mono"
                color="ochre"
                style={{
                  marginTop: spacing.xs,
                  fontSize: 10,
                  letterSpacing: 1,
                }}
              >
                REQUIERE SEGUIMIENTO
              </Text>
            ) : null}
          </View>
        ))
      )}

      {/* Modal sin dosis elegibles */}
      <Modal
        visible={showSinDosis}
        onClose={() => setShowSinDosis(false)}
        eyebrow="Aviso"
        title="No hay dosis elegibles"
        maxWidth={420}
      >
        <Text variant="small" color="muted">
          Solo se pueden reportar reacciones adversas dentro de los{' '}
          <Text bold>{ventanaDias} dias</Text> posteriores a la aplicacion de una dosis.
          Ninguna de tus dosis registradas cae dentro de esa ventana.
        </Text>
        <Button label="Entendido" variant="ghost" onPress={() => setShowSinDosis(false)} />
      </Modal>

      {/* Modal reportar */}
      <Modal
        visible={showReportar}
        onClose={() => { setShowReportar(false); setError('') }}
        eyebrow="Cartilla"
        title="Reportar reaccion"
      >
        <View>
          <Text variant="eyebrow" color="muted" style={{ marginBottom: spacing.xs }}>Dosis</Text>
          <View style={{ gap: spacing.xs }}>
            {dosisReportables.map((d) => {
              const activo = form.dosis_id === d.id
              return (
                <Pressable
                  key={d.id}
                  onPress={() => setForm({ ...form, dosis_id: d.id })}
                  style={{
                    padding: spacing.sm + 2,
                    borderWidth: 1,
                    borderColor: activo ? colors.ink : colors.border,
                    backgroundColor: activo ? colors.bone : 'transparent',
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: activo }}
                >
                  <Text variant="small" bold>
                    {d.vacuna_nombre} <Text variant="small" color="muted">· dosis {d.numero_dosis}</Text>
                  </Text>
                  <Text variant="small" color="muted" style={{ marginTop: 2, fontSize: 11 }}>
                    Aplicada hace {d.dias_transcurridos} dia{d.dias_transcurridos === 1 ? '' : 's'}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </View>

        <ChipSelector
          label="Sintomas"
          options={SINTOMAS_COMUNES}
          value={form.sintomasSelec}
          onChange={(v) => setForm({ ...form, sintomasSelec: v })}
          multiple
          helpText="Selecciona todos los que aplican. Puedes agregar mas abajo."
        />

        <Field
          label="Otros sintomas / detalles (opcional)"
          value={form.sintomasOtros}
          onChangeText={(t) => setForm({ ...form, sintomasOtros: t })}
          placeholder="Detalle adicional o sintomas no listados..."
          multiline
          numberOfLines={3}
          style={{ minHeight: 80, textAlignVertical: 'top' }}
        />

        <ChipSelector
          label="Severidad"
          options={SEVERIDADES.map((s) => s.label)}
          value={SEVERIDADES.find((s) => s.key === form.severidad)?.label ?? 'Leve'}
          onChange={(label) => {
            const found = SEVERIDADES.find((s) => s.label === label)
            if (found) setForm({ ...form, severidad: found.key })
          }}
        />

        <Field
          label="Inicio (minutos despues de la dosis, opcional)"
          value={form.inicio_minutos}
          onChangeText={(t) => setForm({ ...form, inicio_minutos: t.replace(/[^0-9]/g, '') })}
          placeholder="0"
          keyboardType="number-pad"
        />

        <Pressable
          onPress={() => setForm({ ...form, requiere_seguimiento: !form.requiere_seguimiento })}
          style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: form.requiere_seguimiento }}
        >
          <View
            style={{
              width: 18,
              height: 18,
              borderWidth: 1,
              borderColor: colors.ink,
              backgroundColor: form.requiere_seguimiento ? colors.ink : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {form.requiere_seguimiento ? (
              <Text color="paper" style={{ fontSize: 12, lineHeight: 14 }}>✓</Text>
            ) : null}
          </View>
          <Text variant="small">Requiere seguimiento medico</Text>
        </Pressable>

        {error ? (
          <View
            style={{
              borderLeftWidth: 2,
              borderLeftColor: colors.wine,
              paddingLeft: spacing.md,
              paddingVertical: spacing.sm,
            }}
          >
            <Text variant="small" color="wine">{error}</Text>
          </View>
        ) : null}

        <Button
          label={busy ? 'Enviando...' : 'Enviar reporte'}
          loading={busy}
          onPress={guardarReporte}
          arrow={!busy}
        />
      </Modal>
    </View>
  )
}
