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
  grupo_prioritario: string | null
  fecha_nacimiento: string | null
  sexo: string | null
}

type AlertaRow = {
  vacuna_id: number
  nombre: string
  dosis_faltantes: number
  dosis_total: number
  dosis_aplicadas: number
  prioridad: 'alta' | 'normal'
}

const curp = ref('')
const loading = ref(true)
const loadError = ref('')

const resumen = ref<ResumenRow[]>([])
const mensajes = ref<MensajeRow[]>([])
const usuario = ref<UsuarioMe | null>(null)
const alertas = ref<AlertaRow[]>([])

const isBasicSession = ref(false)
const isNoRegistrado = ref(false)

const filtroBusqueda = ref('')

const resumenFiltrado = computed(() => {
  const q = filtroBusqueda.value.trim().toLowerCase()
  if (!q) return resumen.value
  return resumen.value.filter(v => v.nombre.toLowerCase().includes(q))
})

const grupoLabel: Record<string, string> = {
  adulto_mayor:   'Adulto mayor',
  embarazada:     'Embarazada',
  personal_salud: 'Personal de salud',
  cronico:        'Cronico',
}

const alertasAlta = computed(() => alertas.value.filter(a => a.prioridad === 'alta'))

function fmtDate(s: string | null) {
  if (!s) return '—'
  const d = new Date(s.includes('T') ? s : `${s}T12:00:00`)
  return Number.isNaN(d.getTime()) ? s : d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

const completadas = computed(() => resumen.value.filter(v => v.completa).length)
const porcentaje = computed(() =>
  resumen.value.length ? Math.round((completadas.value / resumen.value.length) * 100) : 0
)
const pendientes = computed(() => resumen.value.filter(v => !v.completa))
const noLeidos = computed(() => mensajes.value.filter(m => !m.leido).length)

function isAuthed() {
  return typeof localStorage !== 'undefined' && localStorage.getItem('auth') === 'true'
}

async function onOpenMensaje(m: MensajeRow) {
  if (!m.leido && isAuthed()) {
    try {
      await api.marcarLeido(m.id)
      m.leido = 1
    } catch { /* silencioso */ }
  }
  const iconMap: Record<string, string> = { urgente: 'error', advertencia: 'warning', informacion: 'info' }
  await Swal.fire({
    icon: (iconMap[m.tipo] || 'info') as any,
    title: m.titulo,
    html: `
      <p style="font-size:12px;color:#6b7280;margin-bottom:14px;letter-spacing:0.08em;text-transform:uppercase;font-family:monospace">
        ${m.remitente_nombre} ${m.remitente_apellido} · ${fmtDate(m.enviado_en)}
      </p>
      <p style="font-size:14px;color:#1C1B17;white-space:pre-wrap;text-align:left;line-height:1.55">${m.contenido}</p>
    `,
    confirmButtonColor: '#0E5037',
    confirmButtonText: 'Cerrar',
  })
}

async function removeMensaje(id: number) {
  if (!isAuthed()) {
    await Swal.fire({ icon: 'info', title: 'Acceso limitado', text: 'Inicia sesion con contrasena para eliminar mensajes.', confirmButtonColor: '#0E5037' })
    return
  }
  const result = await Swal.fire({
    title: 'Eliminar mensaje',
    text: 'Esta accion no se puede deshacer.',
    icon: 'warning', showCancelButton: true,
    confirmButtonColor: '#991B1B', cancelButtonColor: '#6B6A60',
    confirmButtonText: 'Eliminar', cancelButtonText: 'Cancelar',
  })
  if (!result.isConfirmed) return
  try {
    await api.deleteMensaje(id)
    mensajes.value = mensajes.value.filter(x => x.id !== id)
    await Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1100, showConfirmButton: false })
  } catch (e) {
    await Swal.fire({ icon: 'error', title: 'Error', text: e instanceof Error ? e.message : 'No se pudo eliminar.', confirmButtonColor: '#0E5037' })
  }
}

onMounted(async () => {
  curp.value = localStorage.getItem('curp') || ''
  isBasicSession.value = localStorage.getItem('auth') === 'false' && !!curp.value
  isNoRegistrado.value = localStorage.getItem('noRegistrado') === 'true'

  if (isNoRegistrado.value) { loading.value = false; return }

  if (!curp.value) {
    loadError.value = 'No hay sesion activa.'
    loading.value = false
    return
  }

  try {
    const [hist, user, msg, alert] = await Promise.all([
      api.getHistorial(curp.value) as Promise<{ resumen: ResumenRow[] }>,
      api.getUsuario(curp.value) as Promise<UsuarioMe>,
      api.getMensajes(curp.value) as Promise<MensajeRow[]>,
      api.getAlertas(curp.value).catch(() => ({ alertas: [] })) as Promise<{ alertas: AlertaRow[] }>,
    ])
    resumen.value = hist.resumen || []
    usuario.value = user
    mensajes.value = Array.isArray(msg) ? msg : []
    alertas.value = alert.alertas || []
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : 'Error al cargar el expediente.'
  } finally {
    loading.value = false
  }
})

function exportarCartilla() {
  if (!usuario.value || !resumen.value.length) return
  const u = usuario.value
  const nombreCompleto = [u.nombre, u.apellido_paterno, u.apellido_materno].filter(Boolean).join(' ')
  const hoy = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })

  const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><title>Cartilla — ${nombreCompleto}</title>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'IBM Plex Sans',sans-serif;padding:48px;color:#1C1B17;background:#F5F1E8;font-size:13px;line-height:1.55}
  .h{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #1C1B17;padding-bottom:18px;margin-bottom:32px}
  .h h1{font-family:Fraunces,serif;font-size:36px;font-weight:500;letter-spacing:-0.02em;line-height:1}
  .h .sub{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#6B6A60;margin-top:6px}
  .meta{font-family:'IBM Plex Mono',monospace;font-size:11px;text-align:right;letter-spacing:0.08em}
  .meta p{margin-bottom:4px}
  .section-label{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#6B6A60;margin-bottom:14px;padding-bottom:8px;border-bottom:1px solid #DDD3BD}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:18px 32px;margin-bottom:38px}
  .field{padding-bottom:10px;border-bottom:1px dotted #DDD3BD}
  .field label{font-family:'IBM Plex Mono',monospace;font-size:9px;color:#8B8073;text-transform:uppercase;letter-spacing:0.12em;display:block;margin-bottom:4px}
  .field p{font-size:14px;font-weight:500}
  .badge{display:inline-block;padding:2px 8px;font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:0.12em;text-transform:uppercase;background:#D4E4D9;color:#082E20;border:1px solid #0E5037}
  table{width:100%;border-collapse:collapse;margin-top:14px}
  th{text-align:left;font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#6B6A60;padding:10px 12px;border-bottom:2px solid #1C1B17}
  td{padding:11px 12px;border-bottom:1px solid #DDD3BD;font-size:13px}
  tr:hover td{background:#FAF7F0}
  .ok{color:#0E5037;font-weight:500}
  .pend{color:#991B1B}
  .f{margin-top:48px;padding-top:18px;border-top:1px solid #DDD3BD;font-family:'IBM Plex Mono',monospace;font-size:10px;color:#8B8073;letter-spacing:0.08em;text-align:center}
  @media print{body{padding:20px}}
</style></head><body>
<div class="h">
  <div>
    <p class="sub">Sistema Nacional de Inmunizacion</p>
    <h1>Cartilla de Vacunacion</h1>
  </div>
  <div class="meta">
    <p>Emision · ${hoy}</p>
    <p>CURP · ${u.curp}</p>
  </div>
</div>

<p class="section-label">Datos del asegurado</p>
<div class="grid">
  <div class="field"><label>Nombre</label><p>${nombreCompleto}</p></div>
  <div class="field"><label>NSS</label><p>${u.nss || '—'}</p></div>
  <div class="field"><label>Correo</label><p>${u.correo || '—'}</p></div>
  <div class="field"><label>Telefono</label><p>${u.celular || '—'}</p></div>
  <div class="field"><label>Unidad medica</label><p>${u.unidad_nombre || '—'}</p></div>
  <div class="field"><label>Medico familiar</label><p>${u.medico_familiar || '—'}</p></div>
  ${u.grupo_prioritario && u.grupo_prioritario !== 'ninguno' ? `<div class="field" style="grid-column:1/3"><label>Grupo prioritario</label><p><span class="badge">${grupoLabel[u.grupo_prioritario] || u.grupo_prioritario}</span></p></div>` : ''}
</div>

<p class="section-label">Esquema de vacunacion</p>
<table>
  <thead><tr><th>Vacuna</th><th style="text-align:center">Dosis</th><th>Ultima aplicacion</th><th style="text-align:right">Estado</th></tr></thead>
  <tbody>${resumen.value.map(v => `<tr><td><strong>${v.nombre}</strong></td><td style="text-align:center" class="tabular">${v.dosis_aplicadas}/${v.dosis_total}</td><td>${v.ultima_fecha ? fmtDate(v.ultima_fecha) : '—'}</td><td style="text-align:right" class="${v.completa ? 'ok' : 'pend'}">${v.completa ? '● Completa' : '○ Pendiente'}</td></tr>`).join('')}</tbody>
</table>

<div class="f">Documento generado electronicamente · PIA-IA · © ${new Date().getFullYear()}</div>
</body></html>`

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank')
  if (win) win.onload = () => setTimeout(() => win.print(), 500)
}

const unidadLinea = computed(() => {
  const u = usuario.value
  if (!u?.unidad_nombre) return '—'
  const loc = [u.ciudad, u.estado].filter(Boolean).join(', ')
  return loc ? `${u.unidad_nombre} — ${loc}` : u.unidad_nombre
})

function tipoMark(tipo: string) {
  if (tipo === 'urgente')     return { label: 'urgente',     color: 'var(--wine)' }
  if (tipo === 'advertencia') return { label: 'advertencia', color: 'var(--ochre)' }
  return { label: 'informacion', color: 'var(--moss)' }
}
</script>

<template>
  <div class="min-h-screen">
    <div class="max-w-6xl mx-auto px-6 lg:px-12 py-10 lg:py-14">

      <!-- Loading -->
      <div v-if="loading" class="py-32 text-center">
        <p class="eyebrow">Cargando</p>
        <p class="font-display text-2xl mt-4">Preparando tu expediente…</p>
      </div>

      <!-- Usuario no registrado -->
      <template v-else-if="isNoRegistrado">
        <p class="eyebrow">CURP no encontrada</p>
        <h1 class="font-display text-4xl sm:text-5xl mt-3 leading-[1.05] tracking-tight" style="font-weight: 400">
          Esta cartilla<br/><em style="font-weight: 300" class="italic">aun no existe.</em>
        </h1>

        <div class="mt-10 max-w-2xl">
          <div class="py-6 border-t-2 border-b" style="border-color: var(--ink)">
            <p class="text-sm leading-relaxed">
              Tu CURP <span class="font-mono px-1.5 py-0.5" style="background: var(--bone)">{{ curp }}</span> es valida,
              pero no se encuentra registrada en el sistema. Para crear tu expediente, acude a tu Unidad de Medicina Familiar
              mas cercana con tu identificacion oficial.
            </p>
          </div>

          <div class="mt-8 space-y-4">
            <div class="flex items-baseline gap-5">
              <span class="font-mono text-[11px] opacity-50" style="letter-spacing: 0.14em">01</span>
              <p class="text-sm">Presentate en tu UMF con identificacion oficial vigente.</p>
            </div>
            <div class="divider-dotted" />
            <div class="flex items-baseline gap-5">
              <span class="font-mono text-[11px] opacity-50" style="letter-spacing: 0.14em">02</span>
              <p class="text-sm">Solicita la creacion de tu cartilla de vacunacion digital.</p>
            </div>
            <div class="divider-dotted" />
            <div class="flex items-baseline gap-5">
              <span class="font-mono text-[11px] opacity-50" style="letter-spacing: 0.14em">03</span>
              <p class="text-sm">Recibiras un correo de confirmacion para acceder al sistema.</p>
            </div>
          </div>

          <NuxtLink to="/login" class="btn-ghost inline-flex items-center gap-2 mt-10 text-sm">
            <span class="font-mono">←</span> Volver al inicio
          </NuxtLink>
        </div>
      </template>

      <!-- Error -->
      <div v-else-if="loadError" class="py-20">
        <p class="eyebrow" style="color: var(--wine)">Error</p>
        <h1 class="font-display text-3xl mt-3" style="font-weight: 500">{{ loadError }}</h1>
        <NuxtLink to="/login" class="btn-ghost inline-flex items-center gap-2 mt-8">
          <span class="font-mono">←</span> Ir al inicio
        </NuxtLink>
      </div>

      <template v-else>

        <!-- Hero editorial -->
        <header class="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-8 mb-10 border-b-2" style="border-color: var(--ink)">
          <div>
            <p class="eyebrow">{{ new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) }}</p>
            <h1 class="font-display text-4xl sm:text-5xl lg:text-[56px] mt-3 leading-[1] tracking-tight" style="font-weight: 400">
              Cartilla de<br/>
              <em style="font-weight: 400" class="italic">vacunacion.</em>
            </h1>
            <p v-if="usuario" class="mt-4 text-sm" style="color: var(--muted)">
              {{ usuario.nombre }} {{ usuario.apellido_paterno }}
              <span v-if="usuario.grupo_prioritario && usuario.grupo_prioritario !== 'ninguno'"
                class="ml-2 inline-block px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider"
                style="background: var(--moss-soft); color: var(--moss-dark); letter-spacing: 0.1em">
                {{ grupoLabel[usuario.grupo_prioritario] }}
              </span>
            </p>
          </div>

          <div class="flex flex-col items-start lg:items-end gap-2">
            <p v-if="curp" class="font-mono text-xs px-2.5 py-1" style="background: var(--bone); letter-spacing: 0.08em">{{ curp }}</p>
            <button v-if="resumen.length" @click="exportarCartilla" type="button"
              class="text-xs uppercase tracking-wider font-mono flex items-center gap-2 hover:opacity-70 transition-opacity"
              style="letter-spacing: 0.12em">
              <span>Descargar PDF</span>
              <span>↓</span>
            </button>
          </div>
        </header>

        <!-- Alertas prioritarias (banner editorial) -->
        <div v-if="alertasAlta.length" class="mb-10 p-6 border-l-4" style="background: rgba(180,83,9,0.06); border-color: var(--ochre)">
          <p class="eyebrow" style="color: var(--ochre)">Atencion prioritaria</p>
          <h3 class="font-display text-xl mt-2" style="font-weight: 500">
            {{ alertasAlta.length }} {{ alertasAlta.length === 1 ? 'vacuna requiere' : 'vacunas requieren' }} tu atencion
          </h3>
          <div class="mt-4 flex flex-wrap gap-x-5 gap-y-1.5">
            <span v-for="a in alertasAlta" :key="a.vacuna_id" class="text-sm flex items-baseline gap-1.5">
              <span class="font-mono text-[10px]" style="color: var(--ochre)">●</span>
              <span style="font-weight: 500">{{ a.nombre }}</span>
              <span class="font-mono text-xs" style="color: var(--muted)">({{ a.dosis_faltantes }})</span>
            </span>
          </div>
        </div>

        <!-- Numbers grandes editoriales -->
        <section class="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-8 mb-14">
          <div>
            <p class="eyebrow">Completas</p>
            <p class="font-display text-5xl lg:text-6xl mt-2 tabular" style="font-weight: 400">{{ completadas }}</p>
            <p class="text-xs mt-1" style="color: var(--muted)">de {{ resumen.length }} en catalogo</p>
          </div>
          <div>
            <p class="eyebrow">Pendientes</p>
            <p class="font-display text-5xl lg:text-6xl mt-2 tabular" :style="pendientes.length ? 'color: var(--wine); font-weight: 400' : 'font-weight: 400'">{{ pendientes.length }}</p>
            <p class="text-xs mt-1" style="color: var(--muted)">requieren accion</p>
          </div>
          <div>
            <p class="eyebrow">Progreso</p>
            <p class="font-display text-5xl lg:text-6xl mt-2 tabular" style="font-weight: 400">{{ porcentaje }}<span class="text-2xl align-top" style="color: var(--muted)">%</span></p>
            <div class="w-full h-[2px] mt-3" style="background: var(--bone)">
              <div class="h-[2px] transition-all duration-1000" :style="`width: ${porcentaje}%; background: ${porcentaje === 100 ? 'var(--moss)' : 'var(--ink)'}`" />
            </div>
          </div>
          <div>
            <p class="eyebrow">Bandeja</p>
            <p class="font-display text-5xl lg:text-6xl mt-2 tabular" style="font-weight: 400">{{ noLeidos }}</p>
            <p class="text-xs mt-1" style="color: var(--muted)">{{ noLeidos === 1 ? 'mensaje nuevo' : 'mensajes nuevos' }}</p>
          </div>
        </section>

        <!-- Pendientes -->
        <section v-if="pendientes.length" class="mb-14">
          <div class="flex items-baseline justify-between border-b pb-2 mb-5" style="border-color: var(--ink)">
            <h2 class="font-display text-2xl" style="font-weight: 500">Pendientes</h2>
            <p class="eyebrow">{{ pendientes.length }} vacunas</p>
          </div>
          <div>
            <div v-for="(v, idx) in pendientes" :key="v.vacuna_id" class="flex items-baseline justify-between py-3.5"
              :style="idx < pendientes.length - 1 ? 'border-bottom: 1px dotted var(--border)' : ''">
              <div class="flex items-baseline gap-4 min-w-0">
                <span class="font-mono text-[11px] opacity-50 tabular" style="letter-spacing: 0.08em">{{ String(idx + 1).padStart(2, '0') }}</span>
                <div class="min-w-0">
                  <p style="font-weight: 500">{{ v.nombre }}</p>
                  <p class="text-xs mt-0.5 tabular" style="color: var(--muted)">{{ v.dosis_aplicadas }} de {{ v.dosis_total }} dosis aplicadas</p>
                </div>
              </div>
              <span class="text-[10px] uppercase font-mono tracking-wider"
                :style="v.dosis_aplicadas === 0 ? 'color: var(--wine)' : 'color: var(--ochre)'">
                {{ v.dosis_aplicadas === 0 ? 'Sin aplicar' : 'Incompleta' }}
              </span>
            </div>
          </div>
        </section>

        <!-- Tabla de vacunas -->
        <section class="mb-14">
          <div class="flex items-baseline justify-between border-b pb-2 mb-5 gap-4 flex-wrap" style="border-color: var(--ink)">
            <h2 class="font-display text-2xl" style="font-weight: 500">Todas las vacunas</h2>
            <div class="flex items-center gap-3">
              <input v-model="filtroBusqueda" type="text" placeholder="Buscar…"
                class="text-sm py-1 px-2 border-b focus:outline-none transition-colors"
                style="background: transparent; border-color: var(--border); min-width: 160px"
                @focus="(e: any) => e.target.style.borderColor = 'var(--ink)'"
                @blur="(e: any) => e.target.style.borderColor = 'var(--border)'" />
              <p class="eyebrow">{{ resumenFiltrado.length }} resultados</p>
            </div>
          </div>

          <table class="w-full">
            <thead>
              <tr>
                <th class="text-left eyebrow pb-3 pr-4">Vacuna</th>
                <th class="text-center eyebrow pb-3 px-2 hidden sm:table-cell">Dosis</th>
                <th class="text-left eyebrow pb-3 px-2 hidden md:table-cell">Ultima aplicacion</th>
                <th class="text-right eyebrow pb-3 pl-4">Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!resumenFiltrado.length">
                <td colspan="4" class="py-12 text-center text-sm" style="color: var(--muted)">
                  Sin resultados para "{{ filtroBusqueda }}"
                </td>
              </tr>
              <tr v-for="(v, i) in resumenFiltrado" :key="v.vacuna_id"
                :style="i < resumenFiltrado.length - 1 ? 'border-bottom: 1px solid var(--border-soft)' : ''">
                <td class="py-3.5 pr-4">
                  <span style="font-weight: 500">{{ v.nombre }}</span>
                  <p class="sm:hidden text-xs mt-0.5 tabular" style="color: var(--muted)">{{ v.dosis_aplicadas }}/{{ v.dosis_total }} · {{ fmtDate(v.ultima_fecha) }}</p>
                </td>
                <td class="py-3.5 px-2 text-center font-mono text-sm tabular hidden sm:table-cell" style="color: var(--muted)">
                  {{ v.dosis_aplicadas }}/{{ v.dosis_total }}
                </td>
                <td class="py-3.5 px-2 text-sm tabular hidden md:table-cell" style="color: var(--muted)">
                  {{ fmtDate(v.ultima_fecha) }}
                </td>
                <td class="py-3.5 pl-4 text-right">
                  <span class="text-[10px] uppercase font-mono tracking-wider inline-flex items-center gap-1.5"
                    :style="v.completa ? 'color: var(--moss)' : 'color: var(--muted)'">
                    <span :style="v.completa ? 'color: var(--moss)' : 'color: var(--muted-2)'">●</span>
                    {{ v.completa ? 'Completa' : 'Pendiente' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <!-- Buzon -->
        <section class="mb-14">
          <div class="flex items-baseline justify-between border-b pb-2 mb-5" style="border-color: var(--ink)">
            <h2 class="font-display text-2xl" style="font-weight: 500">Bandeja</h2>
            <p v-if="noLeidos" class="eyebrow" style="color: var(--moss)">{{ noLeidos }} sin leer</p>
            <p v-else class="eyebrow">{{ mensajes.length }} mensajes</p>
          </div>

          <div v-if="!mensajes.length" class="py-12 text-center">
            <p class="font-display text-xl italic" style="color: var(--muted); font-weight: 300">No tienes mensajes.</p>
          </div>

          <div v-else>
            <div
              v-for="(m, i) in mensajes"
              :key="m.id"
              class="group flex items-baseline gap-5 py-5 cursor-pointer hover:bg-black/[0.02] transition-colors -mx-4 px-4"
              :style="i < mensajes.length - 1 ? 'border-bottom: 1px solid var(--border-soft)' : ''"
              @click="onOpenMensaje(m)"
            >
              <span class="font-mono text-[11px] opacity-50 tabular pt-0.5" style="letter-spacing: 0.08em">{{ String(i + 1).padStart(2, '0') }}</span>

              <div class="flex-1 min-w-0">
                <div class="flex items-baseline gap-3 flex-wrap mb-1">
                  <p class="text-base" style="font-weight: 500">{{ m.titulo }}</p>
                  <span v-if="!m.leido" class="font-mono text-[9px] uppercase tracking-widest" style="color: var(--moss)">● nuevo</span>
                  <span class="font-mono text-[10px] uppercase tracking-wider" :style="`color: ${tipoMark(m.tipo).color}`">
                    {{ tipoMark(m.tipo).label }}
                  </span>
                </div>
                <p class="text-xs mb-2" style="color: var(--muted); font-family: var(--font-mono); letter-spacing: 0.06em">
                  {{ m.remitente_nombre }} {{ m.remitente_apellido }} · {{ fmtDate(m.enviado_en) }}
                </p>
                <p class="text-sm line-clamp-2" style="color: var(--ink-2)">{{ m.contenido }}</p>
              </div>

              <button
                v-if="isAuthed()"
                type="button"
                class="text-xs opacity-0 group-hover:opacity-60 hover:opacity-100 transition-opacity"
                style="color: var(--wine); font-family: var(--font-mono); letter-spacing: 0.08em"
                title="Eliminar mensaje"
                @click.stop="removeMensaje(m.id)"
              >
                eliminar
              </button>
            </div>
          </div>
        </section>

        <!-- Unidad medica -->
        <section v-if="usuario" class="mb-10">
          <div class="border-b pb-2 mb-5" style="border-color: var(--ink)">
            <h2 class="font-display text-2xl" style="font-weight: 500">Unidad medica</h2>
          </div>
          <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-5">
            <div>
              <dt class="eyebrow">Unidad</dt>
              <dd class="mt-1.5 text-base" style="font-weight: 500">{{ unidadLinea }}</dd>
            </div>
            <div>
              <dt class="eyebrow">Telefono</dt>
              <dd class="mt-1.5 text-base font-mono tabular" style="font-weight: 400">{{ usuario.unidad_telefono || '—' }}</dd>
            </div>
            <div>
              <dt class="eyebrow">Medico familiar</dt>
              <dd class="mt-1.5 text-base" style="font-weight: 500">{{ usuario.medico_familiar || '—' }}</dd>
            </div>
            <div>
              <dt class="eyebrow">No. Seguridad Social</dt>
              <dd class="mt-1.5 text-base font-mono tabular" style="font-weight: 400">{{ usuario.nss || '—' }}</dd>
            </div>
          </dl>
        </section>

      </template>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
