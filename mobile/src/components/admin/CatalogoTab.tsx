import { useCallback, useEffect, useState } from 'react'
import { View, Pressable } from 'react-native'
import { adminApi, type CrearVacunaCatalogoPayload } from '@/api/admin'
import type { CatalogoVacunaRow } from '@/types/admin'
import { Text } from '@/components/ui/Text'
import { Field } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Alert } from '@/components/ui/Alert'
import { useToast } from '@/components/ui/Toast'
import { TabSkeleton } from '@/components/ui/TabSkeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { colors, spacing } from '@/theme'

export function CatalogoTab({ refreshKey = 0 }: { refreshKey?: number }) {
  const toast = useToast()
  const [items, setItems] = useState<CatalogoVacunaRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showNueva, setShowNueva] = useState(false)
  const [editing, setEditing] = useState<CatalogoVacunaRow | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<CatalogoVacunaRow | null>(null)

  const [form, setForm] = useState<CrearVacunaCatalogoPayload>({
    nombre: '', enfermedad: '', dosis_descripcion: '', dosis_total: 1,
  })
  const [busy, setBusy] = useState(false)

  const cargar = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setItems(await adminApi.listarCatalogo())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar el catalogo.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])
  useEffect(() => {
    if (refreshKey > 0) cargar()
  }, [refreshKey, cargar])

  function abrirNueva() {
    setForm({ nombre: '', enfermedad: '', dosis_descripcion: '', dosis_total: 1 })
    setShowNueva(true)
  }
  function abrirEditar(item: CatalogoVacunaRow) {
    setEditing(item)
    setForm({
      nombre: item.nombre,
      enfermedad: item.enfermedad,
      dosis_descripcion: item.dosis_descripcion || '',
      dosis_total: item.dosis_total,
    })
  }

  async function guardar() {
    if (!form.nombre.trim() || !form.enfermedad.trim() || form.dosis_total < 1) {
      setError('Completa nombre, enfermedad y dosis (>=1).')
      return
    }
    setBusy(true)
    try {
      const accion = editing ? 'actualizada' : 'agregada'
      const nombre = form.nombre.trim()
      if (editing) {
        await adminApi.actualizarCatalogo(editing.id, form)
      } else {
        await adminApi.crearCatalogo(form)
      }
      setShowNueva(false)
      setEditing(null)
      await cargar()
      toast.success(`${nombre} fue ${accion}.`, 'Vacuna guardada')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo guardar.'
      setError(msg)
      toast.error(msg, 'Error')
    } finally {
      setBusy(false)
    }
  }

  async function eliminar() {
    if (!confirmDelete) return
    const nombre = confirmDelete.nombre
    try {
      await adminApi.eliminarCatalogo(confirmDelete.id)
      setConfirmDelete(null)
      await cargar()
      toast.success(`${nombre} fue eliminada.`, 'Eliminado')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo eliminar.'
      setError(msg)
      toast.error(msg, 'Error')
    }
  }

  return (
    <View style={{ gap: spacing.md }}>
      <Pressable
        onPress={abrirNueva}
        style={{ paddingVertical: spacing.md, borderWidth: 1, borderColor: colors.ink, alignItems: 'center' }}
      >
        <Text variant="eyebrow">+ Nueva vacuna</Text>
      </Pressable>

      {error ? <Alert tipo="error" mensaje={error} /> : null}

      {loading ? (
        <TabSkeleton rows={4} showHeader={false} />
      ) : items.length === 0 ? (
        <EmptyState
          eyebrow="Catalogo vacio"
          titulo="Aun no hay vacunas registradas"
          mensaje="Agrega la primera vacuna del catalogo para que los usuarios puedan registrar dosis."
          actionLabel="+ Nueva vacuna"
          onAction={abrirNueva}
        />
      ) : (
        <View>
          <View style={{ borderBottomWidth: 2, borderBottomColor: colors.ink, paddingVertical: spacing.sm }}>
            <Text variant="eyebrow" color="muted">{items.length} vacunas en catalogo</Text>
          </View>
          {items.map((v) => (
            <View key={v.id} style={{ paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderSoft }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text variant="body" bold numberOfLines={1}>{v.nombre}</Text>
                  <Text variant="small" color="muted" numberOfLines={1}>{v.enfermedad}</Text>
                  {v.dosis_descripcion ? (
                    <Text variant="small" color="muted" style={{ marginTop: 2 }} numberOfLines={2}>{v.dosis_descripcion}</Text>
                  ) : null}
                </View>
                <View style={{ alignItems: 'flex-end', gap: spacing.xs }}>
                  <Text variant="mono" bold>{v.dosis_total}</Text>
                  <Text variant="eyebrow" color="muted" style={{ fontSize: 10 }}>dosis</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm }}>
                <Pressable onPress={() => abrirEditar(v)}>
                  <Text variant="eyebrow">Editar →</Text>
                </Pressable>
                <Pressable onPress={() => setConfirmDelete(v)}>
                  <Text variant="eyebrow" color="wine">Eliminar</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}

      <Modal
        visible={showNueva || !!editing}
        onClose={() => { setShowNueva(false); setEditing(null) }}
        eyebrow={editing ? 'Editar' : 'Nueva'}
        title={editing ? 'Editar vacuna' : 'Nueva vacuna'}
      >
        <Field label="Nombre" value={form.nombre} onChangeText={(t) => setForm({ ...form, nombre: t })} />
        <Field label="Enfermedad" value={form.enfermedad} onChangeText={(t) => setForm({ ...form, enfermedad: t })} />
        <Field
          label="Descripcion de dosis"
          value={form.dosis_descripcion || ''}
          onChangeText={(t) => setForm({ ...form, dosis_descripcion: t })}
          multiline
          numberOfLines={3}
        />
        <Field
          label="Total de dosis"
          value={String(form.dosis_total)}
          onChangeText={(t) => setForm({ ...form, dosis_total: Math.max(1, parseInt(t.replace(/[^0-9]/g, '') || '1', 10)) })}
          keyboardType="number-pad"
        />
        <Button label={busy ? 'Guardando...' : 'Guardar'} loading={busy} onPress={guardar} arrow={!busy} />
      </Modal>

      <Modal visible={!!confirmDelete} onClose={() => setConfirmDelete(null)} eyebrow="Confirmar" title="Eliminar vacuna" maxWidth={420}>
        <Text variant="small" color="muted">
          Se eliminara <Text bold>{confirmDelete?.nombre}</Text> del catalogo.
        </Text>
        <Alert tipo="advertencia" titulo="Atencion" mensaje="Si hay dosis registradas con esta vacuna, la operacion fallara." />
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Button label="Cancelar" variant="ghost" onPress={() => setConfirmDelete(null)} />
          </View>
          <View style={{ flex: 1 }}>
            <Pressable
              onPress={eliminar}
              style={{ backgroundColor: colors.wine, paddingVertical: spacing.md, alignItems: 'center' }}
            >
              <Text color="paper" bold>Eliminar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  )
}
