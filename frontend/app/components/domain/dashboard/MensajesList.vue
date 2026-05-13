<script setup lang="ts">
import Swal from 'sweetalert2'
import type { MensajeRow } from '~/composables/useDashboardData'

const props = defineProps<{
  mensajes: MensajeRow[]
  /** Limite opcional para vista resumen. */
  limit?: number
  /** Si se trunca por limite, muestra link a /mensajes. */
  showVerTodo?: boolean
}>()

const emit = defineEmits<{
  (e: 'eliminar', id: number): void
  (e: 'marcar-leido', id: number): void
}>()

const { t } = useI18n()
const api = useApi()

const items = computed(() => {
  if (!props.limit) return props.mensajes
  return props.mensajes.slice(0, props.limit)
})

const hayMas = computed(() => Boolean(props.limit) && props.mensajes.length > (props.limit || 0))

const noLeidos = computed(() => props.mensajes.filter(m => !m.leido).length)

function isAuthed() {
  return typeof localStorage !== 'undefined' && localStorage.getItem('auth') === 'true'
}

function fmtDate(s: string | null) {
  if (!s) return '—'
  const d = new Date(s.includes('T') ? s : `${s}T12:00:00`)
  return Number.isNaN(d.getTime())
    ? s
    : d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

function tipoMark(tipo: string) {
  if (tipo === 'urgente')     return { label: 'urgente',     color: 'var(--wine)' }
  if (tipo === 'advertencia') return { label: 'advertencia', color: 'var(--ochre)' }
  return { label: 'informacion', color: 'var(--moss)' }
}

async function onOpenMensaje(m: MensajeRow) {
  if (!m.leido && isAuthed()) {
    try {
      await api.marcarLeido(m.id)
      m.leido = 1
      emit('marcar-leido', m.id)
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
    await Swal.fire({
      icon: 'info',
      title: 'Acceso limitado',
      text: 'Inicia sesion con contrasena para eliminar mensajes.',
      confirmButtonColor: '#0E5037',
    })
    return
  }
  const result = await Swal.fire({
    title: 'Eliminar mensaje',
    text: 'Esta accion no se puede deshacer.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#991B1B',
    cancelButtonColor: '#6B6A60',
    confirmButtonText: 'Eliminar',
    cancelButtonText: 'Cancelar',
  })
  if (!result.isConfirmed) return
  try {
    await api.deleteMensaje(id)
    emit('eliminar', id)
    await Swal.fire({
      icon: 'success',
      title: 'Eliminado',
      timer: 1100,
      showConfirmButton: false,
    })
  } catch (e) {
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: e instanceof Error ? e.message : 'No se pudo eliminar.',
      confirmButtonColor: '#0E5037',
    })
  }
}
</script>

<template>
  <section class="mb-14">
    <div
      class="flex items-baseline justify-between border-b pb-2 mb-5"
      style="border-color: var(--ink)"
    >
      <h2 class="font-display text-2xl" style="font-weight: 500">
        {{ t('dashboard.inboxBox') }}
      </h2>
      <p v-if="noLeidos" class="eyebrow" style="color: var(--moss)">
        {{ noLeidos }} {{ t('dashboard.inboxUnread') }}
      </p>
      <p v-else class="eyebrow">{{ mensajes.length }} {{ t('dashboard.inboxMessages') }}</p>
    </div>

    <div v-if="!mensajes.length" class="py-12 text-center">
      <p
        class="font-display text-xl italic"
        style="color: var(--muted); font-weight: 300"
      >
        {{ t('dashboard.inboxNoMsgs') }}
      </p>
    </div>

    <div v-else>
      <div
        v-for="(m, i) in items"
        :key="m.id"
        class="group flex items-baseline gap-5 py-5 cursor-pointer hover:bg-black/[0.02] transition-colors -mx-4 px-4"
        :style="i < items.length - 1 ? 'border-bottom: 1px solid var(--border-soft)' : ''"
        @click="onOpenMensaje(m)"
      >
        <span
          class="font-mono text-[11px] opacity-50 tabular pt-0.5"
          style="letter-spacing: 0.08em"
        >
          {{ String(i + 1).padStart(2, '0') }}
        </span>

        <div class="flex-1 min-w-0">
          <div class="flex items-baseline gap-3 flex-wrap mb-1">
            <p class="text-base" style="font-weight: 500">{{ m.titulo }}</p>
            <span
              v-if="!m.leido"
              class="font-mono text-[9px] uppercase tracking-widest"
              style="color: var(--moss)"
            >
              ● nuevo
            </span>
            <span
              class="font-mono text-[10px] uppercase tracking-wider"
              :style="`color: ${tipoMark(m.tipo).color}`"
            >
              {{ tipoMark(m.tipo).label }}
            </span>
          </div>
          <p
            class="text-xs mb-2"
            style="color: var(--muted); font-family: var(--font-mono); letter-spacing: 0.06em"
          >
            {{ m.remitente_nombre }} {{ m.remitente_apellido }} · {{ fmtDate(m.enviado_en) }}
          </p>
          <p class="text-sm line-clamp-2" style="color: var(--ink-2)">{{ m.contenido }}</p>
        </div>

        <button
          v-if="isAuthed()"
          type="button"
          class="text-xs opacity-0 group-hover:opacity-60 hover:opacity-100 transition-opacity"
          style="color: var(--wine); font-family: var(--font-mono); letter-spacing: 0.08em"
          @click.stop="removeMensaje(m.id)"
        >
          {{ t('dashboard.deleteMsg') }}
        </button>
      </div>
    </div>

    <NuxtLink
      v-if="showVerTodo && hayMas"
      to="/mensajes"
      class="mt-5 inline-flex items-center gap-2 text-xs uppercase font-mono tracking-wider hover:opacity-70 transition-opacity"
      style="letter-spacing: 0.12em; color: var(--ink)"
    >
      <span>{{ t('common.seeAll') }} ({{ mensajes.length }})</span>
      <span>→</span>
    </NuxtLink>
  </section>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
