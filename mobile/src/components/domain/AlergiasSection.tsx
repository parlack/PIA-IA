/**
 * Seccion editorial de alergias y contraindicaciones del ciudadano.
 *
 * Espejo nativo de `frontend/app/components/domain/AlergiasSection.vue`:
 *  - Lista alergias (sustancia, severidad badge, observaciones)
 *  - Lista contraindicaciones (descripcion, permanente/temporal)
 *  - Si `editable=true`, permite agregar/eliminar via modal nativo
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
  alergiasApi,
  type Alergia,
  type Contraindicacion,
  type SeveridadAlergia,
} from '@/api/alergias'
import { colors, spacing } from '@/theme'

const SEVERIDADES: { key: SeveridadAlergia; label: string }[] = [
  { key: 'leve', label: 'Leve' },
  { key: 'moderada', label: 'Moderada' },
  { key: 'severa', label: 'Severa' },
  { key: 'anafilaxia', label: 'Anafilaxia' },
]

const COLOR_SEVERIDAD: Record<string, keyof typeof colors> = {
  leve: 'moss',
  moderada: 'ochre',
  severa: 'wine',
  anafilaxia: 'wine',
}

const ALERGENOS_COMUNES = [
  'Penicilina',
  'Latex',
  'AINEs (Ibuprofeno)',
  'Aspirina',
  'Sulfas',
  'Huevo',
  'Levadura',
  'Gelatina',
  'Mariscos',
  'Cacahuates',
  'Anestesia local',
  'Polen',
  'Acaros',
  'Polvo',
  'Frutos secos',
] as const

type Props = {
  curp: string
  editable?: boolean
}

export function AlergiasSection({ curp, editable = true }: Props) {
  const toast = useToast()
  const [alergias, setAlergias] = useState<Alergia[]>([])
  const [contraindicaciones, setContraindicaciones] = useState<Contraindicacion[]>([])
  const [cargando, setCargando] = useState(true)

  const [showNuevaAlergia, setShowNuevaAlergia] = useState(false)
  const [showNuevaContra, setShowNuevaContra] = useState(false)
  const [showEliminar, setShowEliminar] = useState<
    | { tipo: 'alergia'; item: Alergia }
    | { tipo: 'contra'; item: Contraindicacion }
    | null
  >(null)

  const [formAlergia, setFormAlergia] = useState<{
    sustancia: string
    severidad: SeveridadAlergia
    observaciones: string
  }>({ sustancia: '', severidad: 'leve', observaciones: '' })
  const [formContra, setFormContra] = useState<{
    descripcion: string
    permanente: boolean
  }>({ descripcion: '', permanente: false })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const recargar = useCallback(async () => {
    setCargando(true)
    try {
      const data = await alergiasApi.listar(curp)
      setAlergias(data.alergias)
      setContraindicaciones(data.contraindicaciones)
    } catch {
      // silencioso, dashboard sigue funcionando aun sin alergias
    } finally {
      setCargando(false)
    }
  }, [curp])

  useEffect(() => { recargar() }, [recargar])

  async function guardarAlergia() {
    setError('')
    if (!formAlergia.sustancia.trim()) {
      setError('La sustancia es obligatoria.')
      return
    }
    setBusy(true)
    try {
      await alergiasApi.crearAlergia({
        curp,
        sustancia: formAlergia.sustancia.trim(),
        severidad: formAlergia.severidad,
        observaciones: formAlergia.observaciones.trim() || undefined,
      })
      setShowNuevaAlergia(false)
      setFormAlergia({ sustancia: '', severidad: 'leve', observaciones: '' })
      await recargar()
      toast.success('Alergia registrada en tu cartilla.', 'Guardado')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo guardar.'
      setError(msg)
      toast.error(msg, 'Error')
    } finally {
      setBusy(false)
    }
  }

  async function guardarContraindicacion() {
    setError('')
    if (formContra.descripcion.trim().length < 3) {
      setError('Describe la contraindicacion (min. 3 caracteres).')
      return
    }
    setBusy(true)
    try {
      await alergiasApi.crearContraindicacion({
        curp,
        descripcion: formContra.descripcion.trim(),
        permanente: formContra.permanente,
      })
      setShowNuevaContra(false)
      setFormContra({ descripcion: '', permanente: false })
      await recargar()
      toast.success('Contraindicacion guardada.', 'Guardado')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo guardar.'
      setError(msg)
      toast.error(msg, 'Error')
    } finally {
      setBusy(false)
    }
  }

  async function confirmarEliminar() {
    if (!showEliminar) return
    try {
      if (showEliminar.tipo === 'alergia') {
        await alergiasApi.eliminarAlergia(showEliminar.item.id)
      } else {
        await alergiasApi.eliminarContraindicacion(showEliminar.item.id)
      }
      setShowEliminar(null)
      await recargar()
      toast.success('Registro eliminado.', 'OK')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo eliminar.'
      toast.error(msg, 'Error')
      setShowEliminar(null)
    }
  }

  const totalRegistros = alergias.length + contraindicaciones.length

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
          marginBottom: spacing.md,
          gap: spacing.sm,
        }}
      >
        <Text variant="h2" style={{ flexShrink: 1 }}>Alergias y contraindicaciones</Text>
        {editable ? (
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Pressable onPress={() => setShowNuevaAlergia(true)} hitSlop={6}>
              <Text variant="eyebrow">+ Alergia</Text>
            </Pressable>
            <Pressable onPress={() => setShowNuevaContra(true)} hitSlop={6}>
              <Text variant="eyebrow">+ Contraindicacion</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      {cargando ? (
        <View style={{ gap: spacing.sm, paddingVertical: spacing.md }}>
          <Skeleton width="60%" />
          <Skeleton width="40%" height={10} />
          <Skeleton width="75%" />
        </View>
      ) : totalRegistros === 0 ? (
        <View style={{ paddingVertical: spacing.xl, alignItems: 'center' }}>
          <Text
            variant="h2"
            italic
            color="muted"
            style={{ textAlign: 'center', fontSize: 18 }}
          >
            Sin alergias ni contraindicaciones registradas.
          </Text>
        </View>
      ) : (
        <View style={{ gap: spacing.lg }}>
          {alergias.length ? (
            <View>
              <Text variant="eyebrow" color="muted" style={{ marginBottom: spacing.sm }}>Alergias</Text>
              {alergias.map((a, i) => (
                <View
                  key={a.id}
                  style={{
                    paddingVertical: spacing.sm + 2,
                    borderBottomWidth: i < alergias.length - 1 ? 1 : 0,
                    borderBottomColor: colors.borderSoft,
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    gap: spacing.md,
                  }}
                >
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text variant="body" bold>{a.sustancia}</Text>
                    {a.observaciones ? (
                      <Text variant="small" color="muted" style={{ marginTop: 2 }}>{a.observaciones}</Text>
                    ) : null}
                  </View>
                  <Text
                    variant="mono"
                    color={COLOR_SEVERIDAD[a.severidad] || 'muted'}
                    style={{ fontSize: 10, letterSpacing: 1 }}
                  >
                    {a.severidad.toUpperCase()}
                  </Text>
                  {editable ? (
                    <Pressable
                      onPress={() => setShowEliminar({ tipo: 'alergia', item: a })}
                      hitSlop={6}
                    >
                      <Text variant="mono" color="wine" style={{ fontSize: 10, letterSpacing: 1 }}>
                        ELIMINAR
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              ))}
            </View>
          ) : null}

          {contraindicaciones.length ? (
            <View>
              <Text variant="eyebrow" color="muted" style={{ marginBottom: spacing.sm }}>Contraindicaciones</Text>
              {contraindicaciones.map((c, i) => (
                <View
                  key={c.id}
                  style={{
                    paddingVertical: spacing.sm + 2,
                    borderBottomWidth: i < contraindicaciones.length - 1 ? 1 : 0,
                    borderBottomColor: colors.borderSoft,
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    gap: spacing.md,
                  }}
                >
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text variant="small" bold>{c.descripcion}</Text>
                    <Text variant="small" color="muted" style={{ marginTop: 2 }}>
                      {c.vacuna_nombre ? `Vacuna: ${c.vacuna_nombre} · ` : ''}
                      {c.permanente ? 'permanente' : 'temporal'}
                    </Text>
                  </View>
                  {editable ? (
                    <Pressable
                      onPress={() => setShowEliminar({ tipo: 'contra', item: c })}
                      hitSlop={6}
                    >
                      <Text variant="mono" color="wine" style={{ fontSize: 10, letterSpacing: 1 }}>
                        ELIMINAR
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              ))}
            </View>
          ) : null}
        </View>
      )}

      {/* Modal nueva alergia */}
      <Modal
        visible={showNuevaAlergia}
        onClose={() => { setShowNuevaAlergia(false); setError('') }}
        eyebrow="Cartilla"
        title="Nueva alergia"
      >
        <ChipSelector
          label="Sustancia"
          options={ALERGENOS_COMUNES}
          value={formAlergia.sustancia}
          onChange={(v) => setFormAlergia({ ...formAlergia, sustancia: v })}
          allowCustom
          customLabel="Otra..."
          customPlaceholder="Penicilina, latex, AINEs..."
          helpText="Toca un alergeno comun o usa 'Otra' para escribir."
        />

        <ChipSelector
          label="Severidad"
          options={SEVERIDADES.map((s) => s.label)}
          value={SEVERIDADES.find((s) => s.key === formAlergia.severidad)?.label ?? 'Leve'}
          onChange={(label) => {
            const found = SEVERIDADES.find((s) => s.label === label)
            if (found) setFormAlergia({ ...formAlergia, severidad: found.key })
          }}
        />

        <Field
          label="Observaciones (opcional)"
          value={formAlergia.observaciones}
          onChangeText={(t) => setFormAlergia({ ...formAlergia, observaciones: t })}
          placeholder="Detalle clinico, sintomas..."
          multiline
          numberOfLines={3}
          style={{ minHeight: 80, textAlignVertical: 'top' }}
        />

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
          label={busy ? 'Guardando...' : 'Guardar alergia'}
          loading={busy}
          onPress={guardarAlergia}
          arrow={!busy}
        />
      </Modal>

      {/* Modal nueva contraindicacion */}
      <Modal
        visible={showNuevaContra}
        onClose={() => { setShowNuevaContra(false); setError('') }}
        eyebrow="Cartilla"
        title="Nueva contraindicacion"
      >
        <Field
          label="Descripcion"
          value={formContra.descripcion}
          onChangeText={(t) => setFormContra({ ...formContra, descripcion: t })}
          placeholder="Describe la contraindicacion..."
          multiline
          numberOfLines={4}
          style={{ minHeight: 100, textAlignVertical: 'top' }}
        />

        <Pressable
          onPress={() => setFormContra({ ...formContra, permanente: !formContra.permanente })}
          style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: formContra.permanente }}
        >
          <View
            style={{
              width: 18,
              height: 18,
              borderWidth: 1,
              borderColor: colors.ink,
              backgroundColor: formContra.permanente ? colors.ink : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {formContra.permanente ? (
              <Text color="paper" style={{ fontSize: 12, lineHeight: 14 }}>✓</Text>
            ) : null}
          </View>
          <Text variant="small">Es permanente</Text>
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
          label={busy ? 'Guardando...' : 'Guardar contraindicacion'}
          loading={busy}
          onPress={guardarContraindicacion}
          arrow={!busy}
        />
      </Modal>

      {/* Modal confirmar eliminar */}
      <Modal
        visible={!!showEliminar}
        onClose={() => setShowEliminar(null)}
        eyebrow="Confirmar"
        title={showEliminar?.tipo === 'alergia' ? 'Eliminar alergia' : 'Eliminar contraindicacion'}
        maxWidth={420}
      >
        <Text variant="small" color="muted">
          Esta accion no se puede deshacer. Se eliminara permanentemente este registro de tu cartilla.
        </Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Button label="Cancelar" variant="ghost" onPress={() => setShowEliminar(null)} />
          </View>
          <View style={{ flex: 1 }}>
            <Pressable
              onPress={confirmarEliminar}
              style={{ backgroundColor: colors.wine, paddingVertical: spacing.md, alignItems: 'center' }}
              accessibilityRole="button"
              accessibilityLabel="Confirmar eliminacion"
            >
              <Text color="paper" bold>Eliminar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  )
}
