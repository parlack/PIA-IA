import { useCallback, useEffect, useState } from 'react'
import { View, Pressable } from 'react-native'
import { adminApi } from '@/api/admin'
import type { AuditoriaEvento } from '@/types/admin'
import { Text } from '@/components/ui/Text'
import { Field } from '@/components/ui/Field'
import { Alert } from '@/components/ui/Alert'
import { ChipSelector } from '@/components/ui/ChipSelector'
import { TabSkeleton } from '@/components/ui/TabSkeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { colors, spacing } from '@/theme'

const ACCIONES_AUDITORIA = [
  'login_completo',
  'login_rapido',
  'login_fail_password',
  'login_fail_no_user',
  'set_password',
  'aceptar_terminos',
  'descarga_pdf',
  'verificacion_qr',
  'aplicar_por_qr',
  'reportar_aefi',
  'crear_alergia',
  'eliminar_alergia',
  'crear_contraindicacion',
  'agregar_dependiente',
  'eliminar_dependiente',
  'crear_cita',
  'actualizar_cita',
  'eliminar_cita',
  'broadcast_admin',
  'call_recall_ejecutado',
  'email_enviado',
] as const

export function AuditoriaTab({ refreshKey = 0 }: { refreshKey?: number }) {
  const [items, setItems] = useState<AuditoriaEvento[]>([])
  const [accion, setAccion] = useState('')
  const [actor, setActor] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const cargar = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const list = await adminApi.listarAuditoria({
        accion: accion.trim() || undefined,
        actor: actor.trim() || undefined,
        limit: 100,
      })
      setItems(list)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar la bitacora.')
    } finally {
      setLoading(false)
    }
  }, [accion, actor])

  useEffect(() => { cargar() }, [cargar])
  useEffect(() => {
    if (refreshKey > 0) cargar()
  }, [refreshKey, cargar])

  return (
    <View style={{ gap: spacing.md }}>
      <ChipSelector
        label="Accion"
        options={ACCIONES_AUDITORIA}
        value={accion}
        onChange={setAccion}
        allowCustom
        customLabel="Otra..."
        customPlaceholder="Filtro custom"
        helpText="Toca una accion comun o escribe la tuya."
      />
      <Field label="Actor (CURP)" value={actor} onChangeText={setActor} placeholder="Opcional" autoCapitalize="characters" maxLength={18} mono />

      <Pressable
        onPress={() => cargar()}
        style={{ paddingVertical: spacing.md, backgroundColor: colors.moss, alignItems: 'center' }}
      >
        <Text color="paper" bold>Aplicar filtros</Text>
      </Pressable>

      {error ? <Alert tipo="error" mensaje={error} /> : null}

      {loading ? (
        <TabSkeleton rows={5} showHeader={false} />
      ) : items.length === 0 ? (
        <EmptyState
          eyebrow={accion || actor ? 'Sin coincidencias' : 'Bitacora vacia'}
          titulo={accion || actor ? 'No encontramos eventos' : 'Aun no hay registros'}
          mensaje={
            accion || actor
              ? 'Prueba con otros filtros o limpia la busqueda para ver toda la bitacora.'
              : 'Conforme se realicen acciones en el sistema, apareceran auditadas aqui.'
          }
          actionLabel={accion || actor ? 'Limpiar filtros' : undefined}
          onAction={
            accion || actor
              ? () => { setAccion(''); setActor('') }
              : undefined
          }
        />
      ) : (
        <View>
          <View style={{ borderBottomWidth: 2, borderBottomColor: colors.ink, paddingVertical: spacing.sm }}>
            <Text variant="eyebrow" color="muted">{items.length} eventos</Text>
          </View>
          {items.map((ev) => (
            <View key={ev.id} style={{ paddingVertical: spacing.sm + 2, borderBottomWidth: 1, borderBottomColor: colors.borderSoft }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text variant="eyebrow" style={{ fontSize: 10 }}>{ev.accion}</Text>
                <Text variant="mono" color="muted" style={{ fontSize: 10 }}>{ev.creado_en}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
                <Text variant="mono" style={{ fontSize: 11 }}>{ev.curp_actor || '—'}</Text>
                <Text variant="small" color="muted" style={{ fontSize: 11 }}>{ev.ip || '—'}</Text>
              </View>
              {ev.recurso ? (
                <Text variant="small" color="muted" style={{ marginTop: 2 }}>
                  {ev.recurso}{ev.recurso_id ? ` · ${ev.recurso_id}` : ''}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      )}
    </View>
  )
}
