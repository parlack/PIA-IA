<script setup lang="ts">
definePageMeta({ middleware: 'ciudadano' })
useHead({ title: 'Mi cartilla' })

const api = useApi()
const session = useSession()
const { t } = useI18n()

const {
  curp,
  resumen,
  usuario,
  pendientes,
  porcentaje,
  completadas,
  noLeidos,
  alertasAlta,
  mensajes,
  isAuthed,
  eliminarMensajeLocal,
  marcarLeidoLocal,
} = useDashboardData()

const cartillaExport = useCartillaExport()

const mostrarTerminos = ref(false)
const mostrarQR = ref(false)

type AccesoRapido = {
  to: string
  label: string
  num: string
  authOnly?: boolean
  badge?: number
}

const accesos = computed<AccesoRapido[]>(() => [
  { to: '/vacunas',       label: t('nav.vaccines'),    num: '01' },
  { to: '/mensajes',      label: t('nav.inbox'),       num: '02', badge: noLeidos.value },
  { to: '/alergias',      label: t('nav.allergies'),   num: '03' },
  { to: '/aefi',          label: t('nav.aefi'),        num: '04' },
  { to: '/dependientes',  label: t('nav.dependents'),  num: '05', authOnly: true },
  { to: '/unidad-medica', label: t('nav.medicalUnit'), num: '06' },
])

const accesosVisibles = computed(() =>
  accesos.value.filter(a => !a.authOnly || isAuthed())
)

watch(usuario, (u) => {
  if (u && isAuthed() && !session.haAceptadoTerminos()) {
    mostrarTerminos.value = true
  }
}, { immediate: true })

function onTerminosAceptados() {
  mostrarTerminos.value = false
}

function descargarPdfBackend() {
  if (!curp.value) return
  window.open(api.descargarCartillaUrl(curp.value), '_blank')
}

function imprimir() {
  cartillaExport.imprimir(usuario.value, resumen.value)
}
</script>

<template>
  <DashboardShell>
    <HeroExpediente
      :usuario="usuario"
      :curp="curp"
      :has-resumen="resumen.length > 0"
      show-actions
      large
      @open-qr="mostrarQR = true"
      @download-pdf="descargarPdfBackend"
      @print="imprimir"
    />

    <AlertasPrioritarias :alertas="alertasAlta" />

    <StatsGrid
      :completadas="completadas"
      :total-vacunas="resumen.length"
      :pendientes="pendientes.length"
      :porcentaje="porcentaje"
      :no-leidos="noLeidos"
    />

    <!-- Accesos rapidos a las secciones especializadas -->
    <section class="mb-14">
      <div class="border-b pb-2 mb-5" style="border-color: var(--ink)">
        <h2 class="font-display text-2xl" style="font-weight: 500">{{ t('dashboard.quickAccessTitle') }}</h2>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <NuxtLink
          v-for="acceso in accesosVisibles"
          :key="acceso.to"
          :to="acceso.to"
          class="group flex items-baseline justify-between gap-3 px-4 py-4 border transition-colors hover:bg-black/[0.02]"
          style="border-color: var(--border)"
        >
          <span class="flex items-baseline gap-3 min-w-0">
            <span class="font-mono text-[11px] opacity-50">{{ acceso.num }}</span>
            <span class="font-display text-base truncate" style="font-weight: 500">
              {{ acceso.label }}
            </span>
          </span>
          <span class="flex items-center gap-2">
            <span
              v-if="acceso.badge"
              class="font-mono text-[10px] px-1.5 py-0.5"
              style="background: var(--moss); color: var(--paper); letter-spacing: 0.08em"
            >
              {{ acceso.badge }}
            </span>
            <span class="font-mono opacity-30 group-hover:opacity-80 transition-opacity">→</span>
          </span>
        </NuxtLink>
      </div>
    </section>

    <!-- Vista resumen de pendientes con CTA a /vacunas -->
    <PendientesList
      :pendientes="pendientes"
      :limit="5"
      show-ver-todo
    />

    <!-- Resumen del buzon con CTA a /mensajes -->
    <MensajesList
      v-if="mensajes.length"
      :mensajes="mensajes"
      :limit="3"
      show-ver-todo
      @eliminar="eliminarMensajeLocal"
      @marcar-leido="marcarLeidoLocal"
    />

    <ConsentimientoModal
      v-if="usuario"
      :open="mostrarTerminos"
      :curp="curp"
      :user-name="usuario.nombre"
      @aceptado="onTerminosAceptados"
    />

    <QrPersonalModal
      :open="mostrarQR"
      :curp="curp"
      :nombre="usuario?.nombre"
      @close="mostrarQR = false"
    />
  </DashboardShell>
</template>

<style scoped>
/* Hooks scoped del dashboard. Vacio intencional. */
</style>
