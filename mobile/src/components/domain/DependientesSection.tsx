/**
 * Seccion editorial de dependientes / cuidadores en mobile.
 * Permite listar, agregar y eliminar dependientes vinculados.
 */
import { useCallback, useEffect, useState } from 'react'
import { Pressable, View } from 'react-native'

import { Text } from '@/components/ui/Text'
import { Field } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { ChipSelector } from '@/components/ui/ChipSelector'
import { useToast } from '@/components/ui/Toast'
import { MiQrModal } from '@/components/domain/MiQrModal'
import { cuidadoresApi, type Dependiente } from '@/api/cuidadores'
import { colors, spacing } from '@/theme'

interface Props {
  curp: string
}

const GRUPO_LABEL: Record<string, string> = {
  adulto_mayor:    'Adulto mayor',
  embarazada:      'Embarazada',
  personal_salud:  'Personal de salud',
  cronico:         'Cronico',
}

const RELACIONES_COMUNES = [
  'Madre', 'Padre',
  'Hijo', 'Hija',
  'Esposo', 'Esposa',
  'Hermano', 'Hermana',
  'Abuelo', 'Abuela',
  'Nieto', 'Nieta',
  'Tio', 'Tia',
] as const

export function DependientesSection({ curp }: Props) {
  const toast = useToast()
  const [items, setItems] = useState<Dependiente[]>([])
  const [cargando, setCargando] = useState(true)

  const [showAgregar, setShowAgregar] = useState(false)
  const [showEliminar, setShowEliminar] = useState<Dependiente | null>(null)
  const [qrDep, setQrDep] = useState<Dependiente | null>(null)

  const [form, setForm] = useState({ curp_dependiente: '', relacion: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const recargar = useCallback(async () => {
    setCargando(true)
    try {
      const data = await cuidadoresApi.listar(curp)
      setItems(data)
    } catch {
      // silencioso
    } finally {
      setCargando(false)
    }
  }, [curp])

  useEffect(() => { recargar() }, [recargar])

  async function guardar() {
    setError('')
    const c = form.curp_dependiente.trim().toUpperCase()
    const r = form.relacion.trim()
    if (c.length !== 18) {
      setError('CURP invalida (18 caracteres).')
      return
    }
    if (!r) {
      setError('Indica la relacion.')
      return
    }
    setBusy(true)
    try {
      await cuidadoresApi.agregar({
        curp_cuidador: curp,
        curp_dependiente: c,
        relacion: r,
      })
      setShowAgregar(false)
      setForm({ curp_dependiente: '', relacion: '' })
      await recargar()
      toast.success('Dependiente vinculado.')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo agregar.'
      setError(msg)
      toast.error(msg)
    } finally {
      setBusy(false)
    }
  }

  async function confirmarEliminar() {
    if (!showEliminar) return
    try {
      await cuidadoresApi.eliminar(showEliminar.id)
      setShowEliminar(null)
      await recargar()
      toast.success('Relacion eliminada.')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo eliminar.')
      setShowEliminar(null)
    }
  }

  return (
    <View style={{ marginTop: spacing.lg }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          borderBottomWidth: 1,
          borderBottomColor: colors.ink,
          paddingBottom: spacing.sm,
          marginBottom: spacing.md,
        }}
      >
        <Text variant="h2">A mi cargo</Text>
        <Pressable onPress={() => setShowAgregar(true)} hitSlop={6}>
          <Text variant="eyebrow">+ Dependiente</Text>
        </Pressable>
      </View>

      <Text variant="small" color="muted" style={{ marginBottom: spacing.md }}>
        Gestiona la cartilla de familiares a tu cuidado (adultos mayores, ninos, dependientes).
      </Text>

      {cargando ? (
        <View style={{ gap: spacing.sm, paddingVertical: spacing.md }}>
          <Skeleton width="60%" />
          <Skeleton width="40%" height={10} />
        </View>
      ) : !items.length ? (
        <View style={{ paddingVertical: spacing.xl, alignItems: 'center' }}>
          <Text variant="h3" italic color="muted" style={{ textAlign: 'center' }}>
            Aun no tienes dependientes vinculados.
          </Text>
        </View>
      ) : (
        <View>
          {items.map((d, i) => (
            <View
              key={d.id}
              style={{
                paddingVertical: spacing.md,
                borderBottomWidth: i < items.length - 1 ? 1 : 0,
                borderBottomColor: colors.borderSoft,
                flexDirection: 'row',
                gap: spacing.md,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text variant="body" bold>
                  {d.nombre} {d.apellido_paterno} {d.apellido_materno ?? ''}
                </Text>
                <Text variant="mono" color="muted" style={{ fontSize: 10, letterSpacing: 1, marginTop: 2 }}>
                  {d.curp}
                </Text>
                <Text variant="small" color="muted" style={{ marginTop: 4 }}>
                  Relacion: {d.relacion}
                  {d.grupo_prioritario && d.grupo_prioritario !== 'ninguno'
                    ? ` · ${GRUPO_LABEL[d.grupo_prioritario] ?? d.grupo_prioritario}`
                    : ''}
                </Text>
              </View>
              <View style={{ gap: spacing.sm, alignItems: 'flex-end' }}>
                <Pressable
                  onPress={() => setQrDep(d)}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel={`Ver QR de ${d.nombre}`}
                >
                  <Text variant="mono" color="moss" style={{ fontSize: 10, letterSpacing: 1 }}>
                    VER QR
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setShowEliminar(d)}
                  hitSlop={6}
                >
                  <Text variant="mono" color="wine" style={{ fontSize: 10, letterSpacing: 1 }}>
                    ELIMINAR
                  </Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}

      <Modal
        visible={showAgregar}
        onClose={() => { setShowAgregar(false); setError('') }}
        eyebrow="Cartilla"
        title="Vincular dependiente"
      >
        <Field
          label="CURP del dependiente"
          value={form.curp_dependiente}
          onChangeText={(t) => setForm({ ...form, curp_dependiente: t.toUpperCase() })}
          placeholder="18 caracteres"
          autoCapitalize="characters"
          maxLength={18}
          mono
        />
        <ChipSelector
          label="Relacion"
          options={RELACIONES_COMUNES}
          value={form.relacion}
          onChange={(v) => setForm({ ...form, relacion: v })}
          allowCustom
          customLabel="Otra..."
          customPlaceholder="Especifica la relacion"
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
          label={busy ? 'Guardando...' : 'Vincular'}
          loading={busy}
          onPress={guardar}
          arrow={!busy}
        />
      </Modal>

      <Modal
        visible={!!showEliminar}
        onClose={() => setShowEliminar(null)}
        eyebrow="Confirmar"
        title="Eliminar relacion"
        maxWidth={420}
      >
        <Text variant="small" color="muted">
          Esto eliminara solo el vinculo de cuidado. La cartilla del dependiente no se borra.
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
            >
              <Text color="paper" bold>Eliminar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {qrDep ? (
        <MiQrModal
          visible={!!qrDep}
          onClose={() => setQrDep(null)}
          curp={qrDep.curp}
          titulo={`QR de ${qrDep.nombre} ${qrDep.apellido_paterno}`}
        />
      ) : null}
    </View>
  )
}
