import { useCallback, useEffect, useState } from 'react'
import { View, Pressable, FlatList } from 'react-native'
import { adminApi, type AdminCrearUsuarioPayload } from '@/api/admin'
import type { UsuarioAdminRow, UnidadMedica } from '@/types/admin'
import { Text } from '@/components/ui/Text'
import { Field } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Alert } from '@/components/ui/Alert'
import { useToast } from '@/components/ui/Toast'
import { TabSkeleton } from '@/components/ui/TabSkeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { HistorialUsuarioModal } from './HistorialUsuarioModal'
import { colors, spacing } from '@/theme'
import { normalizarCurp } from '@/utils/curp'

const GRUPOS = ['ninguno', 'adulto_mayor', 'embarazada', 'personal_salud', 'cronico']

export function UsuariosTab({ refreshKey = 0 }: { refreshKey?: number }) {
  const toast = useToast()
  const [usuarios, setUsuarios] = useState<UsuarioAdminRow[]>([])
  const [unidades, setUnidades] = useState<UnidadMedica[]>([])
  const [search, setSearch] = useState('')
  const [unidadId, setUnidadId] = useState<number | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showNuevo, setShowNuevo] = useState(false)
  const [showDelete, setShowDelete] = useState<UsuarioAdminRow | null>(null)
  const [showHistorial, setShowHistorial] = useState<UsuarioAdminRow | null>(null)
  const [creating, setCreating] = useState(false)
  const [nuevo, setNuevo] = useState<AdminCrearUsuarioPayload>({
    curp: '', nombre: '', apellido_paterno: '',
    apellido_materno: '', correo: '', celular: '',
    grupo_prioritario: 'ninguno',
  })

  const cargar = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const list = await adminApi.listarUsuarios({
        search: search.trim() || undefined,
        unidad_medica_id: unidadId,
      })
      setUsuarios(list)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar la lista.')
    } finally {
      setLoading(false)
    }
  }, [search, unidadId])

  useEffect(() => { cargar() }, [cargar])
  useEffect(() => {
    if (refreshKey > 0) cargar()
  }, [refreshKey, cargar])
  useEffect(() => {
    adminApi.listarUnidades().then(setUnidades).catch(() => {})
  }, [])

  async function crearUsuario() {
    if (!nuevo.curp || !nuevo.nombre || !nuevo.apellido_paterno) {
      setError('CURP, nombre y apellido paterno son obligatorios.')
      return
    }
    setCreating(true)
    try {
      await adminApi.crearUsuario(nuevo)
      const nombreCreado = `${nuevo.nombre} ${nuevo.apellido_paterno}`.trim()
      setShowNuevo(false)
      setNuevo({ curp: '', nombre: '', apellido_paterno: '', apellido_materno: '', correo: '', celular: '', grupo_prioritario: 'ninguno' })
      await cargar()
      toast.success(`${nombreCreado} fue registrado.`, 'Usuario creado')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo crear el usuario.'
      setError(msg)
      toast.error(msg, 'Error')
    } finally {
      setCreating(false)
    }
  }

  async function confirmarEliminar() {
    if (!showDelete) return
    const eliminado = `${showDelete.nombre} ${showDelete.apellido_paterno}`.trim()
    try {
      await adminApi.eliminarUsuario(showDelete.curp)
      setShowDelete(null)
      await cargar()
      toast.success(`${eliminado} fue eliminado.`, 'Eliminado')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo eliminar.'
      setError(msg)
      toast.error(msg, 'Error')
    }
  }

  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <Field
            label="Buscar"
            value={search}
            onChangeText={setSearch}
            placeholder="CURP, nombre, apellido"
            autoCapitalize="none"
            returnKeyType="search"
            onSubmitEditing={() => cargar()}
          />
        </View>
        <Pressable
          onPress={() => cargar()}
          style={{
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            backgroundColor: colors.moss,
          }}
        >
          <Text color="paper" variant="small" bold>Buscar</Text>
        </Pressable>
      </View>

      {unidades.length ? (
        <View>
          <Text variant="eyebrow" color="muted" style={{ marginBottom: spacing.xs }}>Filtrar por unidad</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
            <Chip label="Todas" active={unidadId === undefined} onPress={() => setUnidadId(undefined)} />
            {unidades.map((u) => (
              <Chip
                key={u.id}
                label={u.nombre}
                active={unidadId === u.id}
                onPress={() => setUnidadId(u.id)}
              />
            ))}
          </View>
        </View>
      ) : null}

      <Pressable
        onPress={() => setShowNuevo(true)}
        style={{
          marginTop: spacing.sm,
          paddingVertical: spacing.md,
          borderWidth: 1,
          borderColor: colors.ink,
          alignItems: 'center',
        }}
      >
        <Text variant="eyebrow">+ Nuevo usuario</Text>
      </Pressable>

      {error ? <Alert tipo="error" mensaje={error} /> : null}

      {loading ? (
        <TabSkeleton rows={5} showHeader={false} />
      ) : usuarios.length === 0 ? (
        <EmptyState
          eyebrow={search || unidadId ? 'Sin coincidencias' : 'Aun no hay registros'}
          titulo={search || unidadId ? 'No encontramos usuarios' : 'Sin usuarios todavia'}
          mensaje={
            search || unidadId
              ? 'Prueba con otro termino o quita los filtros para ver todos los ciudadanos.'
              : 'Cuando registres ciudadanos, apareceran aqui con su CURP y unidad medica.'
          }
          actionLabel={search || unidadId ? 'Limpiar filtros' : '+ Nuevo usuario'}
          onAction={() => {
            if (search || unidadId) {
              setSearch('')
              setUnidadId(undefined)
            } else {
              setShowNuevo(true)
            }
          }}
        />
      ) : (
        <View>
          <View style={{ borderBottomWidth: 2, borderBottomColor: colors.ink, paddingVertical: spacing.sm }}>
            <Text variant="eyebrow" color="muted">{usuarios.length} resultados</Text>
          </View>
          <FlatList
            data={usuarios}
            scrollEnabled={false}
            keyExtractor={(u) => u.curp}
            renderItem={({ item }) => (
              <UsuarioRow
                usuario={item}
                onVerHistorial={() => setShowHistorial(item)}
                onDelete={() => setShowDelete(item)}
              />
            )}
          />
        </View>
      )}

      <Modal visible={showNuevo} onClose={() => setShowNuevo(false)} eyebrow="Admin" title="Nuevo usuario" maxWidth={520}>
        <Field
          label="CURP"
          value={nuevo.curp}
          onChangeText={(t) => setNuevo({ ...nuevo, curp: normalizarCurp(t) })}
          placeholder="XXXX000000XXXXXXXX"
          maxLength={18}
          autoCapitalize="characters"
          mono
        />
        <Field label="Nombre" value={nuevo.nombre} onChangeText={(t) => setNuevo({ ...nuevo, nombre: t })} />
        <Field label="Apellido paterno" value={nuevo.apellido_paterno} onChangeText={(t) => setNuevo({ ...nuevo, apellido_paterno: t })} />
        <Field label="Apellido materno" value={nuevo.apellido_materno || ''} onChangeText={(t) => setNuevo({ ...nuevo, apellido_materno: t })} />
        <Field label="Correo" value={nuevo.correo || ''} onChangeText={(t) => setNuevo({ ...nuevo, correo: t })} autoCapitalize="none" keyboardType="email-address" />
        <Field label="Celular" value={nuevo.celular || ''} onChangeText={(t) => setNuevo({ ...nuevo, celular: t })} keyboardType="phone-pad" />

        <View>
          <Text variant="eyebrow" color="muted" style={{ marginBottom: spacing.xs }}>Grupo prioritario</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
            {GRUPOS.map((g) => (
              <Chip
                key={g}
                label={g.replace('_', ' ')}
                active={nuevo.grupo_prioritario === g}
                onPress={() => setNuevo({ ...nuevo, grupo_prioritario: g })}
              />
            ))}
          </View>
        </View>

        {unidades.length ? (
          <View>
            <Text variant="eyebrow" color="muted" style={{ marginBottom: spacing.xs }}>Unidad medica</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
              <Chip label="(ninguna)" active={!nuevo.unidad_medica_id} onPress={() => setNuevo({ ...nuevo, unidad_medica_id: undefined })} />
              {unidades.map((u) => (
                <Chip
                  key={u.id}
                  label={u.nombre}
                  active={nuevo.unidad_medica_id === u.id}
                  onPress={() => setNuevo({ ...nuevo, unidad_medica_id: u.id })}
                />
              ))}
            </View>
          </View>
        ) : null}

        <Button label={creating ? 'Creando...' : 'Crear usuario'} loading={creating} onPress={crearUsuario} arrow={!creating} />
      </Modal>

      <HistorialUsuarioModal
        visible={!!showHistorial}
        usuario={showHistorial}
        onClose={() => setShowHistorial(null)}
      />

      <Modal visible={!!showDelete} onClose={() => setShowDelete(null)} eyebrow="Confirmar" title="Eliminar usuario" maxWidth={420}>
        <Text variant="small" color="muted">
          Estas por eliminar permanentemente al ciudadano:
        </Text>
        <View style={{ paddingVertical: spacing.sm }}>
          <Text variant="mono" bold>{showDelete?.curp}</Text>
          <Text variant="small">{showDelete?.nombre} {showDelete?.apellido_paterno}</Text>
        </View>
        <Alert tipo="advertencia" titulo="Esta accion no se puede deshacer" mensaje="Se borraran tambien su historial de vacunas y mensajes." />
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Button label="Cancelar" variant="ghost" onPress={() => setShowDelete(null)} />
          </View>
          <View style={{ flex: 1 }}>
            <Pressable
              onPress={confirmarEliminar}
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

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: spacing.sm + 2,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: active ? colors.ink : colors.border,
        backgroundColor: active ? colors.ink : 'transparent',
      }}
    >
      <Text variant="small" color={active ? 'paper' : 'muted'} style={{ fontSize: 11 }}>{label}</Text>
    </Pressable>
  )
}

function UsuarioRow({
  usuario, onVerHistorial, onDelete,
}: {
  usuario: UsuarioAdminRow
  onVerHistorial: () => void
  onDelete: () => void
}) {
  return (
    <Pressable
      onPress={onVerHistorial}
      style={({ pressed }) => [
        { paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderSoft, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text variant="body" bold numberOfLines={1}>
            {usuario.nombre} {usuario.apellido_paterno} {usuario.apellido_materno || ''}
          </Text>
          <Text variant="mono" color="muted" style={{ fontSize: 11, marginTop: 2 }} numberOfLines={1}>
            {usuario.curp}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs }}>
            <Text variant="small" color="muted">{usuario.rol}</Text>
            {usuario.unidad_nombre ? <Text variant="small" color="muted">· {usuario.unidad_nombre}</Text> : null}
          </View>
        </View>
        <View style={{ alignItems: 'flex-end', gap: spacing.xs }}>
          <Text variant="eyebrow" color="muted">Historial →</Text>
          <Pressable onPress={(e) => { e.stopPropagation(); onDelete() }} hitSlop={8}>
            <Text variant="eyebrow" color="wine">Eliminar</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  )
}
