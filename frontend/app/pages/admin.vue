<script setup lang="ts">
import Swal from 'sweetalert2'
import { esRolAdmin, normalizarRolParaStorage } from '~/utils/rol'

const api = useApi()

const forbidden = ref(false)
const tab = ref<'stats' | 'usuarios' | 'catalogo' | 'mensaje'>('stats')

const stats = ref<{
  total_usuarios: number
  total_dosis: number
  mensajes_no_leidos: number
  total_vacunas_catalogo: number
  top_vacunas: { nombre: string; aplicaciones: number }[]
  grupos_prioritarios?: { grupo_prioritario: string; total: number }[]
  total_hombres?: number
  total_mujeres?: number
} | null>(null)

const grupoLabel: Record<string, string> = {
  adulto_mayor:   'Adultos mayores',
  embarazada:     'Embarazadas',
  personal_salud: 'Personal de salud',
  cronico:        'Pacientes cronicos',
}

type UsuarioRow = {
  curp: string
  nombre: string
  apellido_paterno: string
  apellido_materno: string | null
  correo: string | null
  rol: string
  unidad_medica_id: number | null
  unidad_nombre: string | null
  grupo_prioritario?: string | null
  sexo?: string | null
}

type UnidadRow = { id: number; nombre: string }

const usuarios = ref<UsuarioRow[]>([])
const unidades = ref<UnidadRow[]>([])
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

const nuevoUsuario = reactive({
  curp: '',
  nombre: '',
  apellido_paterno: '',
  apellido_materno: '',
  correo: '',
  celular: '',
  grupo_prioritario: 'ninguno',
  unidad_medica_id: '' as string | number,
})
const showNuevoUsuario = ref(false)

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
    await Swal.fire({ icon: 'success', title: 'Dosis registrada', timer: 1200, showConfirmButton: false })
  } catch (e) {
    err.value = e instanceof Error ? e.message : 'Error'
  } finally {
    busy.value = ''
  }
}

async function borrarDosis(id: number) {
  if (!selectedCurp.value) return
  const result = await Swal.fire({
    title: 'Eliminar dosis',
    text: 'Esta accion eliminara la dosis del historial.',
    icon: 'warning', showCancelButton: true,
    confirmButtonColor: '#991B1B', cancelButtonColor: '#6B6A60',
    confirmButtonText: 'Eliminar', cancelButtonText: 'Cancelar',
  })
  if (!result.isConfirmed) return
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
  const { value: nuevaFecha } = await Swal.fire({
    title: 'Cambiar fecha de aplicacion',
    input: 'text', inputLabel: 'Nueva fecha (AAAA-MM-DD)', inputValue: actual,
    showCancelButton: true,
    confirmButtonColor: '#0E5037', cancelButtonColor: '#6B6A60',
    confirmButtonText: 'Actualizar', cancelButtonText: 'Cancelar',
    inputValidator: (value) => {
      if (!value) return 'Ingresa una fecha.'
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'Formato invalido. Usa AAAA-MM-DD.'
      return null
    },
  })
  if (!nuevaFecha || nuevaFecha === actual) return
  busy.value = `patch-${h.id}`
  try {
    await api.updateDosis(Number(h.id), { fecha_aplicacion: nuevaFecha })
    await loadHistorial(selectedCurp.value)
  } catch (e) {
    err.value = e instanceof Error ? e.message : String(e)
  } finally {
    busy.value = ''
  }
}

async function crearUsuarioAdmin() {
  err.value = ''
  if (!nuevoUsuario.curp.trim() || !nuevoUsuario.nombre.trim() || !nuevoUsuario.apellido_paterno.trim()) {
    err.value = 'CURP, nombre y apellido paterno son obligatorios.'
    return
  }
  busy.value = 'new-user'
  try {
    const curpCreada = nuevoUsuario.curp.toUpperCase()
    await api.adminCrearUsuario({
      curp: curpCreada,
      nombre: nuevoUsuario.nombre.trim(),
      apellido_paterno: nuevoUsuario.apellido_paterno.trim(),
      apellido_materno: nuevoUsuario.apellido_materno.trim() || undefined,
      correo: nuevoUsuario.correo.trim() || undefined,
      celular: nuevoUsuario.celular.trim() || undefined,
    })
    const updates: Record<string, unknown> = {}
    if (nuevoUsuario.grupo_prioritario && nuevoUsuario.grupo_prioritario !== 'ninguno') {
      updates.grupo_prioritario = nuevoUsuario.grupo_prioritario
    }
    if (nuevoUsuario.unidad_medica_id !== '' && nuevoUsuario.unidad_medica_id != null) {
      updates.unidad_medica_id = Number(nuevoUsuario.unidad_medica_id)
    }
    if (Object.keys(updates).length) {
      await api.updateUsuario(curpCreada, updates)
    }
    Object.assign(nuevoUsuario, { curp: '', nombre: '', apellido_paterno: '', apellido_materno: '', correo: '', celular: '', grupo_prioritario: 'ninguno', unidad_medica_id: '' })
    showNuevoUsuario.value = false
    await refreshUsuarios()
    await refreshStats()
    await Swal.fire({ icon: 'success', title: 'Usuario creado', timer: 1200, showConfirmButton: false })
  } catch (e) {
    err.value = e instanceof Error ? e.message : 'Error al crear usuario'
  } finally {
    busy.value = ''
  }
}

async function borrarUsuario(curp: string) {
  const result = await Swal.fire({
    title: 'Eliminar usuario',
    html: `<p>Se eliminara <strong>${curp}</strong> y todo su historial.</p>`,
    icon: 'warning', showCancelButton: true,
    confirmButtonColor: '#991B1B', cancelButtonColor: '#6B6A60',
    confirmButtonText: 'Eliminar', cancelButtonText: 'Cancelar',
  })
  if (!result.isConfirmed) return
  busy.value = `u-${curp}`
  try {
    await api.adminDeleteUsuario(curp)
    if (selectedCurp.value === curp) {
      selectedCurp.value = null
      historialUsuario.value = null
    }
    await refreshUsuarios()
    await refreshStats()
    await Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1200, showConfirmButton: false })
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
    Object.assign(nuevaVacunaCat, { nombre: '', enfermedad: '', dosis_descripcion: '', dosis_total: 1 })
    await refreshCatalogo()
    await refreshStats()
    await Swal.fire({ icon: 'success', title: 'Vacuna agregada', timer: 1200, showConfirmButton: false })
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
    await Swal.fire({ icon: 'success', title: 'Actualizada', timer: 1100, showConfirmButton: false })
  } catch (e) {
    err.value = e instanceof Error ? e.message : 'Error'
  } finally {
    busy.value = ''
  }
}

async function borrarCatalogo(id: number) {
  const result = await Swal.fire({
    title: 'Eliminar vacuna', text: 'Se eliminara esta vacuna del catalogo.', icon: 'warning',
    showCancelButton: true, confirmButtonColor: '#991B1B', cancelButtonColor: '#6B6A60',
    confirmButtonText: 'Eliminar', cancelButtonText: 'Cancelar',
  })
  if (!result.isConfirmed) return
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
    Object.assign(mensajeForm, { titulo: '', contenido: '', destinatario_curp: '' })
    await refreshStats()
    await Swal.fire({ icon: 'success', title: 'Enviado', timer: 1200, showConfirmButton: false })
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
    } catch { /* */ }
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
  if (t === 'usuarios') { refreshUnidades(); refreshUsuarios() }
  if (t === 'catalogo') refreshCatalogo()
})

const tabs = [
  { key: 'stats',    label: 'Estadisticas', num: '01' },
  { key: 'usuarios', label: 'Usuarios',     num: '02' },
  { key: 'catalogo', label: 'Catalogo',     num: '03' },
  { key: 'mensaje',  label: 'Mensajes',     num: '04' },
]
</script>

<template>
  <div class="min-h-screen">

    <div v-if="forbidden" class="flex items-center justify-center py-32 px-4">
      <div class="text-center max-w-md">
        <p class="eyebrow" style="color: var(--wine)">Acceso denegado</p>
        <h1 class="font-display text-4xl mt-3" style="font-weight: 400">
          No tienes <em class="italic">permisos.</em>
        </h1>
        <p class="mt-3 text-sm" style="color: var(--muted)">Esta seccion es exclusiva para administradores.</p>
        <NuxtLink to="/dashboard" class="btn-ghost inline-flex items-center gap-2 mt-8 text-sm">
          <span class="font-mono">←</span> Volver al inicio
        </NuxtLink>
      </div>
    </div>

    <div v-else class="max-w-6xl mx-auto px-6 lg:px-12 py-10 lg:py-14">

      <!-- Hero -->
      <header class="border-b-2 pb-8 mb-10" style="border-color: var(--ink)">
        <p class="eyebrow">Panel administrativo</p>
        <h1 class="font-display text-4xl sm:text-5xl mt-3 leading-[1.05] tracking-tight" style="font-weight: 400">
          Gestion del <em class="italic">sistema.</em>
        </h1>
      </header>

      <!-- Error -->
      <div v-if="err" class="mb-8 px-4 py-3 border-l-2 flex items-start justify-between gap-3" style="border-color: var(--wine); background: rgba(153,27,27,0.04)">
        <p class="text-sm" style="color: var(--wine)">{{ err }}</p>
        <button @click="err = ''" class="font-mono text-xs opacity-60 hover:opacity-100">×</button>
      </div>

      <!-- Tabs editoriales -->
      <nav class="flex flex-wrap gap-8 border-b mb-12" style="border-color: var(--border)">
        <button
          v-for="t in tabs" :key="t.key"
          type="button"
          class="pb-3 -mb-px relative transition-colors flex items-baseline gap-2.5"
          :class="tab === t.key ? '' : 'opacity-50 hover:opacity-80'"
          @click="tab = t.key as any"
        >
          <span class="font-mono text-[10px]" style="letter-spacing: 0.12em">{{ t.num }}</span>
          <span class="text-base" style="font-weight: 500">{{ t.label }}</span>
          <span v-if="tab === t.key" class="absolute left-0 right-0 -bottom-px h-[2px]" style="background: var(--ink)" />
        </button>
      </nav>

      <!-- ===== STATS ===== -->
      <section v-if="tab === 'stats' && stats" class="space-y-14">

        <!-- Numbers grandes -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-8">
          <div>
            <p class="eyebrow">Usuarios</p>
            <p class="font-display text-5xl lg:text-6xl mt-2 tabular" style="font-weight: 400">{{ stats.total_usuarios }}</p>
          </div>
          <div>
            <p class="eyebrow">Dosis</p>
            <p class="font-display text-5xl lg:text-6xl mt-2 tabular" style="font-weight: 400">{{ stats.total_dosis }}</p>
          </div>
          <div>
            <p class="eyebrow">Sin leer</p>
            <p class="font-display text-5xl lg:text-6xl mt-2 tabular" :style="stats.mensajes_no_leidos ? 'color: var(--ochre); font-weight: 400' : 'font-weight: 400'">{{ stats.mensajes_no_leidos }}</p>
          </div>
          <div>
            <p class="eyebrow">Vacunas</p>
            <p class="font-display text-5xl lg:text-6xl mt-2 tabular" style="font-weight: 400">{{ stats.total_vacunas_catalogo }}</p>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <!-- Top vacunas -->
          <div>
            <div class="border-b pb-2 mb-5" style="border-color: var(--ink)">
              <h2 class="font-display text-2xl" style="font-weight: 500">Vacunas mas aplicadas</h2>
            </div>
            <div v-if="stats.top_vacunas?.length">
              <div v-for="(v, i) in stats.top_vacunas" :key="i" class="py-3" :style="i < stats.top_vacunas.length - 1 ? 'border-bottom: 1px dotted var(--border)' : ''">
                <div class="flex items-baseline justify-between mb-2">
                  <div class="flex items-baseline gap-3 min-w-0">
                    <span class="font-mono text-[11px] opacity-50 tabular">{{ String(i + 1).padStart(2, '0') }}</span>
                    <span class="text-sm" style="font-weight: 500">{{ v.nombre }}</span>
                  </div>
                  <span class="font-mono text-sm tabular" style="font-weight: 500">{{ v.aplicaciones }}</span>
                </div>
                <div class="ml-7 h-[2px]" style="background: var(--bone)">
                  <div class="h-[2px]" :style="`width: ${(v.aplicaciones / (stats.top_vacunas[0]?.aplicaciones || 1)) * 100}%; background: var(--moss)`" />
                </div>
              </div>
            </div>
            <p v-else class="text-sm" style="color: var(--muted)">Sin datos.</p>
          </div>

          <!-- Grupos prioritarios + sexo -->
          <div>
            <div class="border-b pb-2 mb-5" style="border-color: var(--ink)">
              <h2 class="font-display text-2xl" style="font-weight: 500">Demografia</h2>
            </div>

            <p class="eyebrow mb-3">Grupos prioritarios</p>
            <div v-if="stats.grupos_prioritarios?.length" class="space-y-2.5 mb-7">
              <div v-for="g in stats.grupos_prioritarios" :key="g.grupo_prioritario" class="flex items-baseline justify-between py-1.5" style="border-bottom: 1px dotted var(--border)">
                <span class="text-sm">{{ grupoLabel[g.grupo_prioritario] || g.grupo_prioritario }}</span>
                <span class="font-mono text-sm tabular" style="font-weight: 500">{{ g.total }}</span>
              </div>
            </div>
            <p v-else class="text-sm mb-7" style="color: var(--muted)">Sin usuarios en grupos prioritarios.</p>

            <p class="eyebrow mb-3">Por sexo</p>
            <div class="grid grid-cols-2 gap-4">
              <div class="py-3 px-4" style="border: 1px solid var(--border)">
                <p class="eyebrow">Hombres</p>
                <p class="font-display text-3xl mt-1.5 tabular" style="font-weight: 400">{{ stats.total_hombres || 0 }}</p>
              </div>
              <div class="py-3 px-4" style="border: 1px solid var(--border)">
                <p class="eyebrow">Mujeres</p>
                <p class="font-display text-3xl mt-1.5 tabular" style="font-weight: 400">{{ stats.total_mujeres || 0 }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ===== USUARIOS ===== -->
      <section v-if="tab === 'usuarios'" class="space-y-8">

        <!-- Filtros -->
        <div class="flex gap-4 flex-wrap items-end">
          <div class="flex-1 min-w-[200px]">
            <label class="eyebrow">Unidad medica</label>
            <select v-model="filtroUnidadId" class="field mt-1.5" @change="refreshUsuarios">
              <option value="">Todas las unidades</option>
              <option v-for="um in unidades" :key="um.id" :value="String(um.id)">{{ um.nombre }}</option>
            </select>
          </div>
          <div class="flex-1 min-w-[200px]">
            <label class="eyebrow">Buscar</label>
            <input v-model="search" type="text" placeholder="CURP o nombre…" class="field mt-1.5" @keyup.enter="refreshUsuarios" />
          </div>
          <button type="button" class="btn-primary text-sm" @click="refreshUsuarios">Buscar</button>
          <button type="button" class="btn-ghost text-sm flex items-center gap-2" @click="showNuevoUsuario = !showNuevoUsuario">
            <span>+</span> Nuevo usuario
          </button>
        </div>

        <!-- Form nuevo usuario -->
        <div v-if="showNuevoUsuario" class="p-6 border-l-2" style="background: var(--bone); border-color: var(--moss)">
          <p class="eyebrow">Crear nuevo usuario</p>
          <h3 class="font-display text-xl mt-1.5 mb-5" style="font-weight: 500">Registro manual</h3>

          <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label class="eyebrow">CURP *</label>
              <input v-model="nuevoUsuario.curp" type="text" maxlength="18" placeholder="XXXX000000XXXXXXXX" class="field mono mt-1.5 uppercase" />
            </div>
            <div>
              <label class="eyebrow">Nombre(s) *</label>
              <input v-model="nuevoUsuario.nombre" type="text" placeholder="Juan" class="field mt-1.5" />
            </div>
            <div>
              <label class="eyebrow">Ap. paterno *</label>
              <input v-model="nuevoUsuario.apellido_paterno" type="text" placeholder="Perez" class="field mt-1.5" />
            </div>
            <div>
              <label class="eyebrow">Ap. materno</label>
              <input v-model="nuevoUsuario.apellido_materno" type="text" placeholder="Lopez" class="field mt-1.5" />
            </div>
            <div>
              <label class="eyebrow">Correo</label>
              <input v-model="nuevoUsuario.correo" type="email" placeholder="correo@ejemplo.com" class="field mt-1.5" />
            </div>
            <div>
              <label class="eyebrow">Celular</label>
              <input v-model="nuevoUsuario.celular" type="text" placeholder="8112345678" class="field mt-1.5" />
            </div>
            <div>
              <label class="eyebrow">Grupo prioritario</label>
              <select v-model="nuevoUsuario.grupo_prioritario" class="field mt-1.5">
                <option value="ninguno">Ninguno</option>
                <option value="adulto_mayor">Adulto mayor</option>
                <option value="embarazada">Embarazada</option>
                <option value="personal_salud">Personal de salud</option>
                <option value="cronico">Paciente cronico</option>
              </select>
            </div>
            <div>
              <label class="eyebrow">Unidad medica</label>
              <select v-model="nuevoUsuario.unidad_medica_id" class="field mt-1.5">
                <option value="">Sin asignar</option>
                <option v-for="um in unidades" :key="um.id" :value="um.id">{{ um.nombre }}</option>
              </select>
            </div>
          </div>

          <div class="flex gap-3 mt-5">
            <button type="button"
              :disabled="busy === 'new-user' || !nuevoUsuario.curp || !nuevoUsuario.nombre || !nuevoUsuario.apellido_paterno"
              class="btn-primary text-sm" @click="crearUsuarioAdmin">
              {{ busy === 'new-user' ? 'Creando…' : 'Crear usuario' }}
            </button>
            <button type="button" class="btn-ghost text-sm" @click="showNuevoUsuario = false">Cancelar</button>
          </div>
        </div>

        <!-- Lista + historial -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-10">

          <!-- Lista -->
          <div>
            <div class="border-b pb-2 mb-3" style="border-color: var(--ink)">
              <div class="flex items-baseline justify-between">
                <h2 class="font-display text-xl" style="font-weight: 500">Usuarios</h2>
                <p class="eyebrow">{{ usuarios.length }} resultados</p>
              </div>
            </div>

            <div class="max-h-[520px] overflow-y-auto">
              <div v-for="(u, i) in usuarios" :key="u.curp"
                class="group flex items-baseline justify-between gap-3 py-3 px-2 cursor-pointer transition-colors"
                :style="`${i < usuarios.length - 1 ? 'border-bottom: 1px dotted var(--border);' : ''} ${selectedCurp === u.curp ? 'background: var(--moss-soft)' : ''}`"
                @click="loadHistorial(u.curp)"
              >
                <div class="min-w-0 flex-1">
                  <p class="text-sm" style="font-weight: 500">
                    {{ u.nombre }} {{ u.apellido_paterno }}
                    <span v-if="u.grupo_prioritario && u.grupo_prioritario !== 'ninguno'"
                      class="ml-1.5 font-mono text-[9px] uppercase tracking-widest"
                      style="color: var(--moss)">
                      · {{ grupoLabel[u.grupo_prioritario] }}
                    </span>
                  </p>
                  <p class="font-mono text-[10px] mt-0.5 tabular" style="color: var(--muted); letter-spacing: 0.08em">{{ u.curp }}</p>
                </div>
                <button type="button" class="opacity-0 group-hover:opacity-60 hover:opacity-100 transition-opacity text-xs"
                  style="color: var(--wine); font-family: var(--font-mono); letter-spacing: 0.08em"
                  @click.stop="borrarUsuario(u.curp)">
                  eliminar
                </button>
              </div>
              <p v-if="!usuarios.length" class="py-12 text-center text-sm italic" style="color: var(--muted)">Sin usuarios.</p>
            </div>
          </div>

          <!-- Historial -->
          <div v-if="historialUsuario && selectedCurp">
            <div class="border-b pb-2 mb-5" style="border-color: var(--ink)">
              <p class="eyebrow">Historial</p>
              <p class="font-mono text-sm tabular mt-1">{{ selectedCurp }}</p>
            </div>

            <!-- Registrar dosis -->
            <div class="mb-6 p-4" style="border: 1px solid var(--border); background: var(--surface)">
              <p class="eyebrow mb-3">Registrar nueva dosis</p>
              <div class="space-y-2.5">
                <select v-model.number="nuevaDosis.vacuna_id" class="field text-sm">
                  <option :value="0">Seleccionar vacuna…</option>
                  <option v-for="c in catalogo" :key="c.id" :value="c.id">{{ c.nombre }}</option>
                </select>
                <div class="grid grid-cols-2 gap-2">
                  <input v-model.number="nuevaDosis.numero_dosis" type="number" min="1" class="field text-sm" placeholder="No. dosis" />
                  <input v-model="nuevaDosis.fecha_aplicacion" type="date" class="field text-sm" />
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <input v-model="nuevaDosis.lugar_aplicacion" type="text" class="field text-sm" placeholder="Lugar (opcional)" />
                  <input v-model="nuevaDosis.lote" type="text" class="field text-sm" placeholder="Lote (opcional)" />
                </div>
                <button type="button"
                  :disabled="busy === 'dosis' || !nuevaDosis.fecha_aplicacion || !nuevaDosis.vacuna_id"
                  class="btn-primary w-full text-sm mt-2" @click="registrarDosisAdmin">
                  {{ busy === 'dosis' ? 'Guardando…' : 'Registrar dosis' }}
                </button>
              </div>
            </div>

            <!-- Lista historial -->
            <div class="max-h-60 overflow-y-auto">
              <div v-for="h in historialUsuario.historial" :key="String(h.id)"
                class="flex items-baseline justify-between gap-2 py-2.5"
                style="border-bottom: 1px dotted var(--border)">
                <div class="min-w-0">
                  <p class="text-sm" style="font-weight: 500">{{ h.vacuna_nombre }}</p>
                  <p class="font-mono text-[10px] tabular" style="color: var(--muted); letter-spacing: 0.06em">
                    Dosis {{ h.numero_dosis }} · {{ h.fecha_aplicacion }}
                  </p>
                </div>
                <div class="flex gap-3 flex-shrink-0 text-xs">
                  <button type="button" class="opacity-60 hover:opacity-100 transition-opacity"
                    style="color: var(--ink); font-family: var(--font-mono); letter-spacing: 0.08em"
                    @click="cambiarFechaDosis(h)">editar</button>
                  <button type="button" class="opacity-60 hover:opacity-100 transition-opacity"
                    style="color: var(--wine); font-family: var(--font-mono); letter-spacing: 0.08em"
                    @click="borrarDosis(Number(h.id))">eliminar</button>
                </div>
              </div>
              <p v-if="!historialUsuario.historial?.length" class="py-8 text-center text-sm italic" style="color: var(--muted)">Sin registros.</p>
            </div>
          </div>

          <div v-else class="flex items-center justify-center py-20">
            <p class="text-sm italic" style="color: var(--muted)">Selecciona un usuario para ver su historial.</p>
          </div>
        </div>
      </section>

      <!-- ===== CATALOGO ===== -->
      <section v-if="tab === 'catalogo'" class="space-y-8">

        <!-- Alta -->
        <div class="p-6 border-l-2" style="background: var(--bone); border-color: var(--moss)">
          <p class="eyebrow">Nueva vacuna en catalogo</p>
          <div class="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-4">
            <input v-model="nuevaVacunaCat.nombre" placeholder="Nombre" class="field text-sm" />
            <input v-model="nuevaVacunaCat.enfermedad" placeholder="Enfermedad" class="field text-sm" />
            <input v-model="nuevaVacunaCat.dosis_descripcion" placeholder="Descripcion" class="field text-sm" />
            <input v-model.number="nuevaVacunaCat.dosis_total" type="number" min="1" placeholder="Total dosis" class="field text-sm tabular" />
            <button type="button" class="btn-primary text-sm" :disabled="busy === 'cat-new' || !nuevaVacunaCat.nombre"
              @click="crearCatalogo">
              {{ busy === 'cat-new' ? 'Guardando…' : 'Agregar' }}
            </button>
          </div>
        </div>

        <!-- Tabla -->
        <div>
          <div class="border-b pb-2 mb-3" style="border-color: var(--ink)">
            <h2 class="font-display text-xl" style="font-weight: 500">Catalogo</h2>
          </div>
          <table class="w-full">
            <thead>
              <tr>
                <th class="text-left eyebrow pb-3 pr-3">#</th>
                <th class="text-left eyebrow pb-3 px-2">Nombre</th>
                <th class="text-left eyebrow pb-3 px-2">Enfermedad</th>
                <th class="text-center eyebrow pb-3 px-2">Dosis</th>
                <th class="text-right eyebrow pb-3 pl-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(c, i) in catalogo" :key="c.id" :style="i < catalogo.length - 1 ? 'border-bottom: 1px solid var(--border-soft)' : ''">
                <template v-if="editCat?.id === c.id">
                  <td class="py-2.5 pr-3 font-mono text-xs tabular" style="color: var(--muted)">{{ c.id }}</td>
                  <td class="py-2.5 px-2"><input v-model="editCat.nombre" class="field text-sm" /></td>
                  <td class="py-2.5 px-2"><input v-model="editCat.enfermedad" class="field text-sm" /></td>
                  <td class="py-2.5 px-2 text-center"><input v-model.number="editCat.dosis_total" type="number" class="field text-sm tabular text-center" style="max-width: 60px" /></td>
                  <td class="py-2.5 pl-2 text-right text-xs">
                    <button type="button" class="mr-3 hover:opacity-70" style="color: var(--moss); font-family: var(--font-mono); letter-spacing: 0.08em" @click="guardarCatalogo">guardar</button>
                    <button type="button" class="opacity-60 hover:opacity-100" style="font-family: var(--font-mono); letter-spacing: 0.08em" @click="editCat = null">cancelar</button>
                  </td>
                </template>
                <template v-else>
                  <td class="py-3 pr-3 font-mono text-xs tabular" style="color: var(--muted)">{{ String(c.id).padStart(2, '0') }}</td>
                  <td class="py-3 px-2 text-sm" style="font-weight: 500">{{ c.nombre }}</td>
                  <td class="py-3 px-2 text-sm" style="color: var(--muted)">{{ c.enfermedad }}</td>
                  <td class="py-3 px-2 text-center font-mono text-sm tabular">{{ c.dosis_total }}</td>
                  <td class="py-3 pl-2 text-right text-xs">
                    <button type="button" class="mr-3 opacity-60 hover:opacity-100" style="color: var(--ink); font-family: var(--font-mono); letter-spacing: 0.08em" @click="editCat = { ...c }">editar</button>
                    <button type="button" class="opacity-60 hover:opacity-100" style="color: var(--wine); font-family: var(--font-mono); letter-spacing: 0.08em" @click="borrarCatalogo(c.id)">eliminar</button>
                  </td>
                </template>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ===== MENSAJES ===== -->
      <section v-if="tab === 'mensaje'" class="max-w-xl">
        <div class="border-b pb-2 mb-6" style="border-color: var(--ink)">
          <h2 class="font-display text-2xl" style="font-weight: 500">Enviar mensaje</h2>
        </div>
        <div class="space-y-5">
          <div>
            <label class="eyebrow">CURP destinatario</label>
            <input v-model="mensajeForm.destinatario_curp" placeholder="XXXX000000XXXXXXXX" class="field mono mt-1.5 uppercase" />
          </div>
          <div>
            <label class="eyebrow">Titulo</label>
            <input v-model="mensajeForm.titulo" placeholder="Asunto del mensaje" class="field mt-1.5" />
          </div>
          <div>
            <label class="eyebrow">Contenido</label>
            <textarea v-model="mensajeForm.contenido" placeholder="Escribe el mensaje…" rows="5" class="field mt-1.5 resize-none" />
          </div>
          <div>
            <label class="eyebrow">Tipo</label>
            <select v-model="mensajeForm.tipo" class="field mt-1.5">
              <option value="informacion">Informacion</option>
              <option value="advertencia">Advertencia</option>
              <option value="urgente">Urgente</option>
            </select>
          </div>
          <button type="button" class="btn-primary text-sm"
            :disabled="busy === 'msg' || !mensajeForm.destinatario_curp || !mensajeForm.titulo || !mensajeForm.contenido"
            @click="enviarMensajeAdmin">
            {{ busy === 'msg' ? 'Enviando…' : 'Enviar mensaje' }}
          </button>
        </div>
      </section>

    </div>
  </div>
</template>
