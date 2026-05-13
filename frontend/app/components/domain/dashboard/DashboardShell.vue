<script setup lang="ts">
/**
 * Wrapper que envuelve las paginas del expediente (/dashboard, /vacunas,
 * /mensajes, /alergias, /aefi, /dependientes, /unidad-medica).
 *
 * Centraliza la carga, los estados de error y el caso "CURP no registrada".
 * Cada pagina solo se ocupa de renderizar su contenido especifico via slot.
 */
const props = defineProps<{
  /** Si true, fuerza recarga de datos al montar el componente. */
  forzarCarga?: boolean
}>()

const { t } = useI18n()
const {
  loading,
  loadError,
  isNoRegistrado,
  curp,
  cargar,
} = useDashboardData()

onMounted(() => {
  cargar(props.forzarCarga)
})
</script>

<template>
  <div class="min-h-screen">
    <div class="max-w-6xl mx-auto px-6 lg:px-12 py-10 lg:py-14">
      <DashboardSkeleton v-if="loading" />

      <template v-else-if="isNoRegistrado">
        <p class="eyebrow">{{ t('dashboard.notFoundEyebrow') }}</p>
        <h1
          class="font-display text-4xl sm:text-5xl mt-3 leading-[1.05] tracking-tight"
          style="font-weight: 400"
        >
          {{ t('dashboard.notFoundTitle1') }}<br />
          <em style="font-weight: 300" class="italic">{{ t('dashboard.notFoundTitle2') }}</em>
        </h1>

        <div class="mt-10 max-w-2xl">
          <div class="py-6 border-t-2 border-b" style="border-color: var(--ink)">
            <p class="text-sm leading-relaxed">
              Tu CURP
              <span class="font-mono px-1.5 py-0.5" style="background: var(--bone)">{{ curp }}</span>
              es valida, pero no se encuentra registrada en el sistema. Para crear tu expediente,
              acude a tu Unidad de Medicina Familiar mas cercana con tu identificacion oficial.
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

          <NuxtLink
            to="/login"
            class="btn-ghost inline-flex items-center gap-2 mt-10 text-sm"
          >
            <span class="font-mono">←</span> {{ t('dashboard.backHome') }}
          </NuxtLink>
        </div>
      </template>

      <div v-else-if="loadError" class="py-20">
        <p class="eyebrow" style="color: var(--wine)">Error</p>
        <h1 class="font-display text-3xl mt-3" style="font-weight: 500">{{ loadError }}</h1>
        <NuxtLink
          to="/login"
          class="btn-ghost inline-flex items-center gap-2 mt-8"
        >
          <span class="font-mono">←</span> Ir al inicio
        </NuxtLink>
      </div>

      <slot v-else />
    </div>
  </div>
</template>
