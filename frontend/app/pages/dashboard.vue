<script setup lang="ts">
import Swal from 'sweetalert2'

const api = useApi()

type ResumenRow = {
  vacuna_id: number
  nombre: string
  dosis_total: number
  dosis_aplicadas: number
  completa: boolean
  ultima_fecha: string | null
}

type MensajeRow = {
  id: number
  titulo: string
  contenido: string
  tipo: string
  leido: number
  enviado_en: string
  leido_en: string | null
  remitente_nombre: string
  remitente_apellido: string
}

type UsuarioMe = {
  curp: string
  nombre: string
  apellido_paterno: string
  apellido_materno: string | null
  celular: string | null
  correo: string | null
  nss: string | null
  medico_familiar: string | null
  unidad_nombre: string | null
  unidad_telefono: string | null
  ciudad: string | null
  estado: string | null
}

const curp = ref('')
const loading = ref(true)
const loadError = ref('')

const resumen = ref<ResumenRow[]>([])
const mensajes = ref<MensajeRow[]>([])
const usuario = ref<UsuarioMe | null>(null)

const isBasicSession = ref(false)

function fmtDate(s: string | null) {
  if (!s) return '—'
  const d = new Date(s.includes('T') ? s : `${s}T12:00:00`)
  return Number.isNaN(d.getTime()) ? s : d.toLocaleDateString('es-MX')
}

const completadas = computed(() => resumen.value.filter(v => v.completa).length)
const porcentaje = computed(() =>
  resumen.value.length ? Math.round((completadas.value / resumen.value.length) * 100) : 0
)

const proximas = computed(() =>
  resumen.value
    .filter(v => !v.completa)
    .map(v => ({
      vacuna: `${v.nombre} — ${v.dosis_aplicadas}/${v.dosis_total} dosis`,
      fecha: v.ultima_fecha ? `Última: ${fmtDate(v.ultima_fecha)}` : 'Sin aplicaciones registradas',
      urgente: v.dosis_aplicadas === 0,
    }))
)

function isAuthed() {
  return typeof localStorage !== 'undefined' && localStorage.getItem('auth') === 'true'
}

async function onOpenMensaje(m: MensajeRow) {
  if (!m.leido && isAuthed()) {
    try {
      await api.marcarLeido(m.id)
      m.leido = 1
    } catch {
      /* silencioso */
    }
  }
}

async function removeMensaje(id: number) {
  if (!isAuthed()) {
    await Swal.fire({
      icon: 'info',
      title: 'Acceso limitado',
      text: 'Inicia sesión con contraseña para eliminar mensajes.',
      confirmButtonColor: '#000000',
    })
    return
  }
  try {
    await api.deleteMensaje(id)
    mensajes.value = mensajes.value.filter(x => x.id !== id)
  } catch (e) {
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: e instanceof Error ? e.message : 'No se pudo eliminar el mensaje.',
      confirmButtonColor: '#000000',
    })
  }
}

onMounted(async () => {
  curp.value = localStorage.getItem('curp') || ''
  isBasicSession.value = localStorage.getItem('auth') === 'false' && !!curp.value

  if (isBasicSession.value) {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso limitado',
      text: 'No estás autenticado. Verás información básica y no podrás realizar ninguna acción.',
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#000000',
      background: '#ffffff',
      customClass: {
        title: 'text-black font-black uppercase tracking-widest text-sm',
        popup: 'rounded-none border border-gray-200',
        confirmButton: 'text-xs font-bold uppercase tracking-widest px-6 py-2.5',
      },
    })
  }

  if (!curp.value) {
    loadError.value = 'No hay sesión activa. Vuelve al inicio de sesión.'
    loading.value = false
    return
  }

  try {
    const [hist, user, msg] = await Promise.all([
      api.getHistorial(curp.value) as Promise<{ resumen: ResumenRow[] }>,
      api.getUsuario(curp.value) as Promise<UsuarioMe>,
      api.getMensajes(curp.value) as Promise<MensajeRow[]>,
    ])
    resumen.value = hist.resumen || []
    usuario.value = user
    mensajes.value = Array.isArray(msg) ? msg : []
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : 'Error al cargar el expediente.'
  } finally {
    loading.value = false
  }
})

const unidadLinea = computed(() => {
  const u = usuario.value
  if (!u?.unidad_nombre) return '—'
  const loc = [u.ciudad, u.estado].filter(Boolean).join(', ')
  return loc ? `${u.unidad_nombre} · ${loc}` : u.unidad_nombre
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <main class="max-w-6xl mx-auto px-6 py-8 space-y-6">

      <div v-if="loading" class="text-center py-16">
        <p class="text-xs text-gray-400 uppercase tracking-widest font-medium">Cargando expediente…</p>
      </div>

      <div v-else-if="loadError" class="border border-gray-300 bg-white px-6 py-8 text-center">
        <p class="text-sm text-gray-700">{{ loadError }}</p>
        <NuxtLink to="/login" class="inline-block mt-4 text-sm font-bold uppercase tracking-widest text-black underline">
          Ir al inicio de sesión
        </NuxtLink>
      </div>

      <template v-else>
        <!-- Título -->
        <div>
          <h1 class="text-2xl font-black tracking-tight text-black uppercase">Mi Cartilla de Vacunación</h1>
          <p class="text-base text-gray-500 mt-1 capitalize">
            {{ new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }}
          </p>
          <p v-if="curp" class="text-xs font-mono text-gray-400 mt-2">CURP: {{ curp }}</p>
        </div>

        <!-- Resumen -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="bg-white border border-gray-200 rounded-lg p-5">
            <p class="text-sm text-gray-500 mb-1">Vacunas aplicadas (completas)</p>
            <p class="text-4xl font-bold text-gray-900">{{ completadas }}</p>
            <p class="text-sm text-gray-400 mt-1">de {{ resumen.length }} en el catálogo</p>
          </div>
          <div class="bg-white border border-gray-200 rounded-lg p-5">
            <p class="text-sm text-gray-500 mb-1">Esquemas incompletos</p>
            <p class="text-4xl font-bold text-gray-900">{{ resumen.length - completadas }}</p>
            <p class="text-sm text-gray-400 mt-1">requieren atención</p>
          </div>
          <div class="bg-white border border-gray-200 rounded-lg p-5">
            <p class="text-sm text-gray-500 mb-2">Esquema completado</p>
            <p class="text-4xl font-bold text-gray-900">{{ porcentaje }}%</p>
            <div class="w-full bg-gray-100 rounded-full h-2 mt-3">
              <div class="bg-black h-2 rounded-full" :style="`width: ${porcentaje}%`" />
            </div>
          </div>
        </div>

        <!-- Próximas / pendientes -->
        <div v-if="proximas.length" class="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-100">
            <h2 class="text-xl font-bold text-gray-900">Pendientes o incompletos</h2>
          </div>
          <ul class="divide-y divide-gray-100">
            <li v-for="(p, i) in proximas" :key="i" class="px-6 py-3 flex justify-between gap-4 text-sm">
              <span class="font-medium text-gray-900">{{ p.vacuna }}</span>
              <span :class="p.urgente ? 'text-red-600 font-semibold' : 'text-gray-500'">{{ p.fecha }}</span>
            </li>
          </ul>
        </div>

        <!-- Tabla de vacunas -->
        <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-100">
            <h2 class="text-xl font-bold text-gray-900">Todas mis vacunas</h2>
          </div>

          <div class="sm:hidden divide-y divide-gray-100">
            <div v-for="v in resumen" :key="v.vacuna_id" class="px-6 py-4 flex items-center justify-between gap-4">
              <div>
                <p class="text-base font-semibold text-gray-900">{{ v.nombre }}</p>
                <p class="text-sm text-gray-400 mt-0.5">
                  {{ v.completa ? 'Última aplicación: ' + fmtDate(v.ultima_fecha) : v.dosis_aplicadas + ' de ' + v.dosis_total + ' dosis' }}
                </p>
              </div>
              <span :class="v.completa ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 border border-gray-300'"
                class="text-xs font-bold px-3 py-1.5 rounded flex-shrink-0">
                {{ v.completa ? 'Completa' : 'Incompleto' }}
              </span>
            </div>
          </div>

          <div class="hidden sm:block overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50">
                <tr>
                  <th class="text-left text-sm font-semibold text-gray-500 px-6 py-3">Vacuna</th>
                  <th class="text-center text-sm font-semibold text-gray-500 px-4 py-3">Dosis</th>
                  <th class="text-left text-sm font-semibold text-gray-500 px-4 py-3">Última aplicación</th>
                  <th class="text-center text-sm font-semibold text-gray-500 px-6 py-3">Estado</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="v in resumen" :key="v.vacuna_id" class="hover:bg-gray-50 transition-colors">
                  <td class="px-6 py-4 text-base font-medium text-gray-900">{{ v.nombre }}</td>
                  <td class="px-4 py-4 text-center text-base text-gray-500">{{ v.dosis_aplicadas }}/{{ v.dosis_total }}</td>
                  <td class="px-4 py-4 text-base text-gray-500">{{ fmtDate(v.ultima_fecha) }}</td>
                  <td class="px-6 py-4 text-center">
                    <span :class="v.completa ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 border border-gray-300'"
                      class="text-sm font-semibold px-3 py-1.5 rounded inline-block">
                      {{ v.completa ? 'Completa' : 'Incompleto' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Buzón -->
        <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
            <h2 class="text-xl font-bold text-gray-900">Buzón de mensajes</h2>
            <span class="text-xs text-gray-400 uppercase tracking-widest">{{ mensajes.length }} mensajes</span>
          </div>
          <div v-if="!mensajes.length" class="px-6 py-10 text-center text-sm text-gray-400">
            No hay mensajes en tu buzón.
          </div>
          <ul v-else class="divide-y divide-gray-100">
            <li
              v-for="m in mensajes"
              :key="m.id"
              class="px-6 py-4"
              @click="onOpenMensaje(m)"
            >
              <div class="flex items-start justify-between gap-4">
                <div class="min-w-0">
                  <p class="text-sm font-bold text-gray-900 flex items-center gap-2">
                    {{ m.titulo }}
                    <span v-if="!m.leido" class="text-[10px] uppercase tracking-widest bg-black text-white px-2 py-0.5">Nuevo</span>
                  </p>
                  <p class="text-xs text-gray-400 mt-1">
                    De {{ m.remitente_nombre }} {{ m.remitente_apellido }} · {{ fmtDate(m.enviado_en) }}
                  </p>
                  <p class="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{{ m.contenido }}</p>
                </div>
                <button
                  v-if="isAuthed()"
                  type="button"
                  class="text-xs font-bold uppercase tracking-widest text-red-500 hover:text-red-700 flex-shrink-0"
                  @click.stop="removeMensaje(m.id)"
                >
                  Eliminar
                </button>
              </div>
            </li>
          </ul>
        </div>

        <!-- Unidad médica -->
        <div class="bg-white border border-gray-200 rounded-lg px-6 py-5">
          <h2 class="text-xl font-bold text-gray-900 mb-4">Mi unidad médica</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-400">Unidad</p>
              <p class="text-base font-semibold text-gray-900">{{ unidadLinea }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-400">Teléfono</p>
              <p class="text-base font-semibold text-gray-900">{{ usuario?.unidad_telefono || '—' }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-400">Médico familiar</p>
              <p class="text-base font-semibold text-gray-900">{{ usuario?.medico_familiar || '—' }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-400">No. Seguridad Social</p>
              <p class="text-base font-semibold text-gray-900 font-mono">{{ usuario?.nss || '—' }}</p>
            </div>
          </div>
        </div>
      </template>

    </main>

    <footer class="border-t border-gray-200 mt-10 py-4 px-6 text-center">
      <p class="text-sm text-gray-400">
        © {{ new Date().getFullYear() }} Instituto Mexicano del Seguro Social · Uso exclusivo para trámites de salud
      </p>
    </footer>

  </div>
</template>
