/**
 * Lista de mensajes editorial.
 * - Click abre Modal con detalle y marca como leido.
 * - Long press confirma eliminacion (solo si esta autenticado).
 */
import { useEffect, useState } from 'react'
import { Pressable, View } from 'react-native'
import { router } from 'expo-router'

import { Text } from '@/components/ui/Text'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { mensajesApi, type MensajeRow } from '@/api/mensajes'
import { sessionStore } from '@/hooks/useSession'
import { useDashboardData } from '@/hooks/useDashboardData'
import { fmtFecha } from '@/utils/fecha'
import { colors, spacing } from '@/theme'

interface Props {
  mensajes:     MensajeRow[]
  limit?:       number
  showVerTodo?: boolean
}

function tipoMark(tipo: MensajeRow['tipo']) {
  if (tipo === 'urgente')     return { label: 'urgente',     color: colors.wine  as string }
  if (tipo === 'advertencia') return { label: 'advertencia', color: colors.ochre as string }
  return                              { label: 'informacion', color: colors.moss  as string }
}

export function MensajesList({ mensajes, limit, showVerTodo }: Props) {
  const toast = useToast()
  const { eliminarMensajeLocal, marcarLeidoLocal } = useDashboardData()

  const [seleccion, setSeleccion] = useState<MensajeRow | null>(null)
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    sessionStore.isAuthenticated().then(setAuthed)
  }, [])

  const items  = limit ? mensajes.slice(0, limit) : mensajes
  const hayMas = Boolean(limit) && mensajes.length > (limit ?? 0)
  const noLeidos = mensajes.filter(m => !m.leido).length

  async function abrir(m: MensajeRow) {
    setSeleccion(m)
    if (!m.leido && authed) {
      try {
        await mensajesApi.marcarLeido(m.id)
        marcarLeidoLocal(m.id)
      } catch { /* silencioso */ }
    }
  }

  async function confirmarEliminar() {
    if (confirmId === null) return
    try {
      await mensajesApi.eliminarMensaje(confirmId)
      eliminarMensajeLocal(confirmId)
      toast.success('Mensaje eliminado')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo eliminar')
    } finally {
      setConfirmId(null)
    }
  }

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
        }}
      >
        <Text variant="h2">Buzon</Text>
        {noLeidos ? (
          <Text variant="eyebrow" color="moss">{noLeidos} no leidos</Text>
        ) : (
          <Text variant="eyebrow" color="muted">
            {mensajes.length} {mensajes.length === 1 ? 'mensaje' : 'mensajes'}
          </Text>
        )}
      </View>

      {!mensajes.length ? (
        <View style={{ paddingVertical: spacing.xxl, alignItems: 'center' }}>
          <Text variant="h3" italic color="muted">Sin mensajes nuevos.</Text>
        </View>
      ) : (
        <View>
          {items.map((m, i) => {
            const mark = tipoMark(m.tipo)
            return (
              <Pressable
                key={m.id}
                onPress={() => abrir(m)}
                onLongPress={() => authed && setConfirmId(m.id)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  gap: spacing.md,
                  paddingVertical: spacing.lg,
                  borderBottomWidth: i < items.length - 1 ? 1 : 0,
                  borderBottomColor: colors.borderSoft,
                  backgroundColor: pressed ? 'rgba(0,0,0,0.02)' : 'transparent',
                })}
              >
                <Text variant="mono" style={{ fontSize: 11, opacity: 0.5 }}>
                  {String(i + 1).padStart(2, '0')}
                </Text>

                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: spacing.sm, marginBottom: 4 }}>
                    <Text variant="body" bold>{m.titulo}</Text>
                    {!m.leido ? (
                      <Text variant="mono" color="moss" style={{ fontSize: 9, letterSpacing: 1.4, textTransform: 'uppercase' }}>
                        ● nuevo
                      </Text>
                    ) : null}
                    <Text variant="mono" style={{ fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: mark.color }}>
                      {mark.label}
                    </Text>
                  </View>
                  <Text variant="mono" color="muted" style={{ fontSize: 11, letterSpacing: 0.5, marginBottom: 4 }}>
                    {m.remitente_nombre} {m.remitente_apellido} · {fmtFecha(m.enviado_en)}
                  </Text>
                  <Text variant="small" color="ink2" numberOfLines={2}>{m.contenido}</Text>
                </View>
              </Pressable>
            )
          })}
        </View>
      )}

      {showVerTodo && hayMas ? (
        <Pressable
          onPress={() => router.push('/mensajes')}
          hitSlop={8}
          style={{ marginTop: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: 6 }}
        >
          <Text variant="eyebrow">Ver todos ({mensajes.length})</Text>
          <Text variant="mono">→</Text>
        </Pressable>
      ) : null}

      {/* Modal detalle */}
      <Modal
        visible={!!seleccion}
        onClose={() => setSeleccion(null)}
        eyebrow={seleccion ? tipoMark(seleccion.tipo).label.toUpperCase() : undefined}
        title={seleccion?.titulo}
      >
        {seleccion ? (
          <>
            <Text variant="mono" color="muted" style={{ fontSize: 11, letterSpacing: 0.5 }}>
              {seleccion.remitente_nombre} {seleccion.remitente_apellido} · {fmtFecha(seleccion.enviado_en)}
            </Text>
            <Text variant="body" style={{ lineHeight: 22 }}>{seleccion.contenido}</Text>
          </>
        ) : null}
      </Modal>

      {/* Modal confirmar eliminar */}
      <Modal
        visible={confirmId !== null}
        onClose={() => setConfirmId(null)}
        eyebrow="CONFIRMAR"
        title="Eliminar mensaje"
      >
        <Text variant="small" color="muted">
          Esta accion no se puede deshacer.
        </Text>
        <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.md }}>
          <Pressable
            onPress={() => setConfirmId(null)}
            style={{
              flex: 1,
              paddingVertical: spacing.md,
              borderWidth: 1,
              borderColor: colors.ink,
              alignItems: 'center',
            }}
          >
            <Text variant="eyebrow">Cancelar</Text>
          </Pressable>
          <Pressable
            onPress={confirmarEliminar}
            style={{
              flex: 1,
              paddingVertical: spacing.md,
              backgroundColor: colors.wine,
              alignItems: 'center',
            }}
          >
            <Text variant="eyebrow" color="paper">Eliminar</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  )
}
