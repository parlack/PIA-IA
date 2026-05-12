<script setup lang="ts">
import { esRolAdmin, normalizarRolParaStorage } from '~/utils/rol'

const router = useRouter()
const api = useApi()

const forbidden = ref(false)
const tab = ref<'stats' | 'usuarios' | 'catalogo' | 'mensaje'>('stats')

const stats = ref<{
  total_usuarios: number
  total_dosis: number
  mensajes_no_leidos: number
  total_vacunas_catalogo: number
  top_vacunas: { nombre: string; aplicaciones: number }[]
} | null>(null)

type UsuarioRow = {
  curp: string
  nombre: string
  apellido_paterno: string
  apellido_materno: string | null
  correo: string | null
  rol: string
  unidad_medica_id: number | null
  unidad_nombre: string | null
}

type UnidadRow = { id: number; nombre: string }

const usuarios = ref<UsuarioRow[]>([])
const unidades = ref<UnidadRow[]>([])
/** vacío = todas las unidades */
const filtroUnidadId = ref('')
const search = ref('')
const selectedCurp = ref<string | null>(null)
const historialUsuario = ref<{ resumen: unknown[]; historial: Record<string, unknown>[] } | null>(null)

type CatalogRow = {
  id: number
  nombre: string
  enfermedad: string
  dosis_descripcion: string | null
  dosis_total: number
}

const catalogo = ref<CatalogRow[]>([])

const nuevaDosis = reactive({
  vacuna_id: 0,
  numero_dosis: 1,
  fecha_aplicacion: '',
  lugar_aplicacion: '',
  lote: '',
})

const nuevaVacunaCat = reactive({
  nombre: '',
  enfermedad: '',
  dosis_descripcion: '',
  dosis_total: 1,
})

const editCat = ref<CatalogRow | null>(null)

const mensajeForm = reactive({
  destinatario_curp: '',
  titulo: '',
  contenido: '',
  tipo: 'informacion' as 'informacion' | 'advertencia' | 'urgente',
})

const busy = ref('')
const err = ref('')

async function refreshStats() {
  stats.value = await api.adminGetStats() as typeof stats.value
}

async function refreshUsuarios() {
  const uid = filtroUnidadId.value === '' ? undefined : Number(filtroUnidadId.value)
  usuarios.value = await api.adminGetUsuarios({
    search: search.value.trim() || undefined,
    unidad_medica_id: Number.isFinite(uid) ? uid : undefined,
  }) as UsuarioRow[]
}

async function refreshUnidades() {
  const rows = (await api.getUnidades()) as Record<string, unknown>[]
  unidades.value = rows.map(r => ({ id: Number(r.id), nombre: String(r.nombre ?? '') }))
}

async function refreshCatalogo() {
  catalogo.value = (await api.getCatalogo()) as CatalogRow[]
}

async function loadHistorial(curp: string) {
  selectedCurp.value = curp
  historialUsuario.value = await api.adminGetVacunasUsuario(curp) as typeof historialUsuario.value
}

async function registrarDosisAdmin() {
  const adminCurp = localStorage.getItem('curp')
  const curp = selectedCurp.value
  if (!adminCurp || !curp) return
  err.value = ''
  busy.value = 'dosis'
  try {
    await api.registrarDosis({
      curp_usuario: curp,
      vacuna_id: nuevaDosis.vacuna_id,
      numero_dosis: nuevaDosis.numero_dosis,
      fecha_aplicacion: nuevaDosis.fecha_aplicacion,
      lugar_aplicacion: nuevaDosis.lugar_aplicacion || null,
      lote: nuevaDosis.lote || null,
      modificado_por: adminCurp,
    })
    await loadHistorial(curp)
    await refreshStats()
  } catch (e) {
    err.value = e instanceof Error ? e.message : 'Error'
  } finally {
    busy.value = ''
  }
}

async function borrarDosis(id: number) {
  if (!selectedCurp.value || !confirm('¿Eliminar esta dosis del historial?')) return
  busy.value = `del-${id}`
  try {
    await api.deleteDosis(id)
    await loadHistorial(selectedCurp.value)
    await refreshStats()
  } catch (e) {
    err.value = e instanceof Error ? e.message : 'Error'
  } finally {
    busy.value = ''
  }
}

async function cambiarFechaDosis(h: Record<string, unknown>) {
  if (!selectedCurp.value) return
  const actual = String(h.fecha_aplicacion || '').slice(0, 10)
  const fel = window.prompt('Nueva fecha de aplicación (AAAA-MM-DD)', actual)
  if (!fel || fel === actual) return
  busy.value = `patch-${h.id}`
  try {
    await api.updateDosis(Number(h.id), { fecha_aplicacion: fel })
    await loadHistorial(selectedCurp.value)
  } catch (e) {
    err.value = e instanceof Error ? e.message : String(e)
  } finally {
    busy.value = ''
  }
}

async function borrarUsuario(curp: string) {
  if (!confirm(`¿Eliminar al usuario ${curp}?`)) return
  busy.value = `u-${curp}`
  try {
    await api.adminDeleteUsuario(curp)
    if (selectedCurp.value === curp) {
      selectedCurp.value = null
      historialUsuario.value = null
    }
    await refreshUsuarios()
    await refreshStats()
  } catch (e) {
    err.value = e instanceof Error ? e.message : 'Error'
  } finally {
    busy.value = ''
  }
}

async function crearCatalogo() {
  err.value = ''
  busy.value = 'cat-new'
  try {
    await api.crearVacunaCatalogo({
      nombre: nuevaVacunaCat.nombre,
      enfermedad: nuevaVacunaCat.enfermedad,
      dosis_descripcion: nuevaVacunaCat.dosis_descripcion || null,
      dosis_total: nuevaVacunaCat.dosis_total,
    })
    nuevaVacunaCat.nombre = ''
    nuevaVacunaCat.enfermedad = ''
    nuevaVacunaCat.dosis_descripcion = ''
    nuevaVacunaCat.dosis_total = 1
    await refreshCatalogo()
    await refreshStats()
  } catch (e) {
    err.value = e instanceof Error ? e.message : 'Error'
  } finally {
    busy.value = ''
  }
}

async function guardarCatalogo() {
  if (!editCat.value) return
  busy.value = 'cat-save'
  try {
    await api.updateVacunaCatalogo(editCat.value.id, {
      nombre: editCat.value.nombre,
      enfermedad: editCat.value.enfermedad,
      dosis_descripcion: editCat.value.dosis_descripcion,
      dosis_total: editCat.value.dosis_total,
    })
    editCat.value = null
    await refreshCatalogo()
  } catch (e) {
    err.value = e instanceof Error ? e.message : 'Error'
  } finally {
    busy.value = ''
  }
}

async function borrarCatalogo(id: number) {
  if (!confirm('¿Eliminar esta vacuna del catálogo?')) return
  busy.value = `cat-${id}`
  try {
    await api.deleteVacunaCatalogo(id)
    await refreshCatalogo()
    await refreshStats()
  } catch (e) {
    err.value = e instanceof Error ? e.message : 'Error'
  } finally {
    busy.value = ''
  }
}

async function enviarMensajeAdmin() {
  const rem = localStorage.getItem('curp')
  if (!rem) return
  err.value = ''
  busy.value = 'msg'
  try {
    await api.enviarMensaje({
      destinatario_curp: mensajeForm.destinatario_curp.toUpperCase(),
      remitente_curp: rem,
      titulo: mensajeForm.titulo,
      contenido: mensajeForm.contenido,
      tipo: mensajeForm.tipo,
    })
    mensajeForm.titulo = ''
    mensajeForm.contenido = ''
    mensajeForm.destinatario_curp = ''
    await refreshStats()
  } catch (e) {
    err.value = e instanceof Error ? e.message : 'Error'
  } finally {
    busy.value = ''
  }
}

onMounted(async () => {
  const curp = localStorage.getItem('curp')
  let miRol = normalizarRolParaStorage(localStorage.getItem('rol'))
  if (curp) {
    try {
      const u = await api.getUsuario(curp) as { rol?: string }
      if (u?.rol != null && u.rol !== '') {
        miRol = normalizarRolParaStorage(u.rol)
        localStorage.setItem('rol', miRol)
      }
    } catch {
      /* usar miRol de localStorage */
    }
  }
  if (!esRolAdmin(miRol)) {
    forbidden.value = true
    return
  }
  try {
    await Promise.all([refreshStats(), refreshUnidades(), refreshUsuarios(), refreshCatalogo()])
  } catch (e) {
    err.value = e instanceof Error ? e.message : 'Error al cargar panel'
  }
})

watch(() => tab.value, (t) => {
  if (t === 'usuarios') {
    refreshUnidades()
    refreshUsuarios()
  }
  if (t === 'catalogo') refreshCatalogo()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 px-6 py-10">
    <div v-if="forbidden" class="max-w-xl mx-auto text-center py-20">
      <p class="text-lg font-semibold text-gray-900">No tienes permisos de administrador</p>
      <NuxtLink to="/dashboard" class="inline-block mt-6 text-sm font-bold uppercase tracking-widest underline text-black">
        Volver al inicio
      </NuxtLink>
    </div>

    <div v-else class="max-w-6xl mx-auto space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-black tracking-tight text-black uppercase">Administración</h1>
          <p class="text-sm text-gray-400 mt-1">Estadísticas, usuarios, catálogo de vacunas y buzón</p>
        </div>
      </div>

      <p v-if="err" class="text-sm text-red-600 border border-red-200 bg-red-50 px-4 py-3">{{ err }}</p>

      <div class="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        <button type="button"
          class="text-xs font-bold uppercase tracking-widest px-4 py-2 border transition-colors"
          :class="tab === 'stats' ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'"
          @click="tab = 'stats'">Estadísticas</button>
        <button type="button"
          class="text-xs font-bold uppercase tracking-widest px-4 py-2 border transition-colors"
          :class="tab === 'usuarios' ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'"
          @click="tab = 'usuarios'">Usuarios</button>
        <button type="button"
          class="text-xs font-bold uppercase tracking-widest px-4 py-2 border transition-colors"
          :class="tab === 'catalogo' ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'"
          @click="tab = 'catalogo'">Catálogo</button>
        <button type="button"
          class="text-xs font-bold uppercase tracking-widest px-4 py-2 border transition-colors"
          :class="tab === 'mensaje' ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'"
          @click="tab = 'mensaje'">Enviar mensaje</button>
      </div>

      <!-- Stats -->
      <div v-if="tab === 'stats' && stats" class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white border border-gray-200 p-5">
          <p class="text-xs text-gray-400 uppercase tracking-widest">Usuarios</p>
          <p class="text-3xl font-bold text-gray-900 mt-1">{{ stats.total_usuarios }}</p>
        </div>
        <div class="bg-white border border-gray-200 p-5">
          <p class="text-xs text-gray-400 uppercase tracking-widest">Dosis aplicadas</p>
          <p class="text-3xl font-bold text-gray-900 mt-1">{{ stats.total_dosis }}</p>
        </div>
        <div class="bg-white border border-gray-200 p-5">
          <p class="text-xs text-gray-400 uppercase tracking-widest">Mensajes sin leer</p>
          <p class="text-3xl font-bold text-gray-900 mt-1">{{ stats.mensajes_no_leidos }}</p>
        </div>
        <div class="bg-white border border-gray-200 p-5">
          <p class="text-xs text-gray-400 uppercase tracking-widest">Vacunas en catálogo</p>
          <p class="text-3xl font-bold text-gray-900 mt-1">{{ stats.total_vacunas_catalogo }}</p>
        </div>
        <div class="col-span-full bg-white border border-gray-200 p-5">
          <p class="text-sm font-bold text-gray-900 mb-3">Top vacunas por aplicaciones</p>
          <ul class="text-sm text-gray-600 space-y-1">
            <li v-for="(v, i) in stats.top_vacunas" :key="i">{{ v.nombre }} — {{ v.aplicaciones }}</li>
            <li v-if="!stats.top_vacunas?.length" class="text-gray-400">Sin datos</li>
          </ul>
        </div>
      </div>

      <!-- Usuarios -->
      <div v-if="tab === 'usuarios'" class="space-y-4">
        <div class="flex gap-4 flex-wrap items-end">
          <div>
            <label class="block text-xs font-bold uppercase text-gray-400 mb-1">Unidad médica</label>
            <select
              v-model="filtroUnidadId"
              class="border border-gray-200 px-3 py-2 text-sm bg-white min-w-[220px] max-w-xs"
              @change="refreshUsuarios"
            >
              <option value="">Todas las unidades</option>
              <option v-for="um in unidades" :key="um.id" :value="String(um.id)">{{ um.nombre }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold uppercase text-gray-400 mb-1">Buscar</label>
            <input v-model="search" type="text" placeholder="CURP o nombre"
              class="border border-gray-200 px-3 py-2 text-sm w-64" @keyup.enter="refreshUsuarios" />
          </div>
          <button type="button" class="bg-black text-white text-xs font-bold uppercase tracking-widest px-4 py-2"
            @click="refreshUsuarios">
            Aplicar
          </button>
        </div>
        <p v-if="filtroUnidadId" class="text-xs text-gray-500">
          Mostrando usuarios registrados en la unidad seleccionada ({{ usuarios.length }} resultado{{ usuarios.length === 1 ? '' : 's' }}).
        </p>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div class="bg-white border border-gray-200 overflow-hidden max-h-[480px] overflow-y-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 sticky top-0">
                <tr>
                  <th class="text-left px-4 py-2">CURP</th>
                  <th class="text-left px-4 py-2">Nombre</th>
                  <th class="text-left px-4 py-2">Unidad</th>
                  <th class="text-right px-4 py-2"> </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="u in usuarios" :key="u.curp" class="border-t border-gray-100 hover:bg-gray-50 cursor-pointer"
                  :class="{ 'bg-gray-100': selectedCurp === u.curp }" @click="loadHistorial(u.curp)">
                  <td class="px-4 py-2 font-mono text-xs">{{ u.curp }}</td>
                  <td class="px-4 py-2">{{ u.nombre }} {{ u.apellido_paterno }}</td>
                  <td class="px-4 py-2 text-gray-600 max-w-[180px] truncate" :title="u.unidad_nombre || ''">
                    {{ u.unidad_nombre || '—' }}
                  </td>
                  <td class="px-4 py-2 text-right">
                    <button type="button" class="text-red-500 text-xs font-bold uppercase" @click.stop="borrarUsuario(u.curp)">
                      Eliminar
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="historialUsuario && selectedCurp" class="bg-white border border-gray-200 p-4 space-y-4">
            <p class="text-sm font-bold text-black">Historial — {{ selectedCurp }}</p>
            <div class="border border-gray-100 p-3 space-y-2 text-xs">
              <p class="font-bold uppercase text-gray-400">Registrar dosis</p>
              <select v-model.number="nuevaDosis.vacuna_id" class="w-full border px-2 py-1.5">
                <option :value="0">Vacuna…</option>
                <option v-for="c in catalogo" :key="c.id" :value="c.id">{{ c.nombre }}</option>
              </select>
              <input v-model.number="nuevaDosis.numero_dosis" type="number" min="1" class="w-full border px-2 py-1.5" placeholder="No. dosis" />
              <input v-model="nuevaDosis.fecha_aplicacion" type="date" class="w-full border px-2 py-1.5" />
              <input v-model="nuevaDosis.lugar_aplicacion" type="text" class="w-full border px-2 py-1.5" placeholder="Lugar (opcional)" />
              <input v-model="nuevaDosis.lote" type="text" class="w-full border px-2 py-1.5" placeholder="Lote (opcional)" />
              <button type="button" :disabled="busy === 'dosis' || !nuevaDosis.fecha_aplicacion || !nuevaDosis.vacuna_id"
                class="w-full bg-black text-white py-2 text-xs font-bold uppercase disabled:opacity-40"
                @click="registrarDosisAdmin">
                {{ busy === 'dosis' ? 'Guardando…' : 'Registrar' }}
              </button>
            </div>
            <ul class="text-xs space-y-2 max-h-48 overflow-y-auto">
              <li v-for="h in historialUsuario.historial" :key="String(h.id)" class="flex justify-between gap-2 border-b border-gray-50 pb-2">
                <span>{{ h.vacuna_nombre }} · dosis {{ h.numero_dosis }} · {{ h.fecha_aplicacion }}</span>
                <span class="flex gap-2 flex-shrink-0">
                  <button type="button" class="text-gray-600 text-xs underline" @click="cambiarFechaDosis(h)">Cambiar fecha</button>
                  <button type="button" class="text-red-500" @click="borrarDosis(Number(h.id))">Eliminar</button>
                </span>
              </li>
              <li v-if="!historialUsuario.historial?.length" class="text-gray-400">Sin registros</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Catálogo -->
      <div v-if="tab === 'catalogo'" class="space-y-6">
        <div class="bg-white border border-gray-200 p-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
          <input v-model="nuevaVacunaCat.nombre" placeholder="Nombre" class="border px-2 py-2" />
          <input v-model="nuevaVacunaCat.enfermedad" placeholder="Enfermedad" class="border px-2 py-2" />
          <input v-model="nuevaVacunaCat.dosis_descripcion" placeholder="Descripción dosis" class="border px-2 py-2" />
          <div class="flex gap-2">
            <input v-model.number="nuevaVacunaCat.dosis_total" type="number" min="1" class="border px-2 py-2 w-20" />
            <button type="button" class="flex-1 bg-black text-white text-xs font-bold uppercase" :disabled="busy === 'cat-new'"
              @click="crearCatalogo">Alta</button>
          </div>
        </div>

        <div class="bg-white border border-gray-200 overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="text-left px-4 py-2">ID</th>
                <th class="text-left px-4 py-2">Nombre</th>
                <th class="text-left px-4 py-2">Enfermedad</th>
                <th class="text-center px-4 py-2">Dosis total</th>
                <th class="text-right px-4 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in catalogo" :key="c.id" class="border-t border-gray-100">
                <template v-if="editCat?.id === c.id">
                  <td class="px-4 py-2">{{ c.id }}</td>
                  <td class="px-4 py-2"><input v-model="editCat.nombre" class="border w-full px-1 py-1" /></td>
                  <td class="px-4 py-2"><input v-model="editCat.enfermedad" class="border w-full px-1 py-1" /></td>
                  <td class="px-4 py-2 text-center"><input v-model.number="editCat.dosis_total" type="number" class="border w-16 px-1 py-1" /></td>
                  <td class="px-4 py-2 text-right space-x-2">
                    <button type="button" class="text-black font-bold text-xs uppercase" @click="guardarCatalogo">Guardar</button>
                    <button type="button" class="text-gray-400 text-xs uppercase" @click="editCat = null">Cancelar</button>
                  </td>
                </template>
                <template v-else>
                  <td class="px-4 py-2">{{ c.id }}</td>
                  <td class="px-4 py-2">{{ c.nombre }}</td>
                  <td class="px-4 py-2">{{ c.enfermedad }}</td>
                  <td class="px-4 py-2 text-center">{{ c.dosis_total }}</td>
                  <td class="px-4 py-2 text-right space-x-2">
                    <button type="button" class="text-xs font-bold uppercase text-gray-700" @click="editCat = { ...c }">Editar</button>
                    <button type="button" class="text-xs font-bold uppercase text-red-500" @click="borrarCatalogo(c.id)">Eliminar</button>
                  </td>
                </template>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Mensaje -->
      <div v-if="tab === 'mensaje'" class="bg-white border border-gray-200 p-6 max-w-lg space-y-4">
        <p class="text-xs font-bold uppercase text-gray-400">Enviar mensaje al buzón</p>
        <input v-model="mensajeForm.destinatario_curp" placeholder="CURP destinatario" class="w-full border px-3 py-2 text-sm font-mono uppercase" />
        <input v-model="mensajeForm.titulo" placeholder="Título" class="w-full border px-3 py-2 text-sm" />
        <textarea v-model="mensajeForm.contenido" placeholder="Contenido" rows="4" class="w-full border px-3 py-2 text-sm" />
        <select v-model="mensajeForm.tipo" class="w-full border px-3 py-2 text-sm">
          <option value="informacion">Información</option>
          <option value="advertencia">Advertencia</option>
          <option value="urgente">Urgente</option>
        </select>
        <button type="button" class="w-full bg-black text-white py-3 text-xs font-bold uppercase tracking-widest"
          :disabled="busy === 'msg'" @click="enviarMensajeAdmin">
          {{ busy === 'msg' ? 'Enviando…' : 'Enviar' }}
        </button>
      </div>
    </div>
  </div>
</template>
