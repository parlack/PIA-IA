<script setup lang="ts">
import type { ResumenRow } from '~/composables/useDashboardData'

const props = defineProps<{
  pendientes: ResumenRow[]
  /** Limite opcional para mostrar solo los primeros N elementos (resumen). */
  limit?: number
  /** Cuando hay limite y se trunca, muestra link a /vacunas. */
  showVerTodo?: boolean
}>()

const { t } = useI18n()

const items = computed(() => {
  if (!props.limit) return props.pendientes
  return props.pendientes.slice(0, props.limit)
})

const hayMas = computed(() => Boolean(props.limit) && props.pendientes.length > (props.limit || 0))
</script>

<template>
  <section v-if="pendientes.length" class="mb-14">
    <div
      class="flex items-baseline justify-between border-b pb-2 mb-5"
      style="border-color: var(--ink)"
    >
      <h2 class="font-display text-2xl" style="font-weight: 500">
        {{ t('dashboard.pendingTitle') }}
      </h2>
      <p class="eyebrow">{{ pendientes.length }} {{ t('dashboard.countSuffix') }}</p>
    </div>

    <div>
      <div
        v-for="(v, idx) in items"
        :key="v.vacuna_id"
        class="flex items-baseline justify-between py-3.5"
        :style="idx < items.length - 1 ? 'border-bottom: 1px dotted var(--border)' : ''"
      >
        <div class="flex items-baseline gap-4 min-w-0">
          <span
            class="font-mono text-[11px] opacity-50 tabular"
            style="letter-spacing: 0.08em"
          >
            {{ String(idx + 1).padStart(2, '0') }}
          </span>
          <div class="min-w-0">
            <p style="font-weight: 500">{{ v.nombre }}</p>
            <p class="text-xs mt-0.5 tabular" style="color: var(--muted)">
              {{ v.dosis_aplicadas }} {{ t('common.of') }} {{ v.dosis_total }}
              {{ t('dashboard.dosesApplied') }}
            </p>
          </div>
        </div>
        <span
          class="text-[10px] uppercase font-mono tracking-wider"
          :style="v.dosis_aplicadas === 0 ? 'color: var(--wine)' : 'color: var(--ochre)'"
        >
          {{ v.dosis_aplicadas === 0 ? t('dashboard.notApplied') : t('dashboard.incomplete') }}
        </span>
      </div>
    </div>

    <NuxtLink
      v-if="showVerTodo && hayMas"
      to="/vacunas"
      class="mt-5 inline-flex items-center gap-2 text-xs uppercase font-mono tracking-wider hover:opacity-70 transition-opacity"
      style="letter-spacing: 0.12em; color: var(--ink)"
    >
      <span>{{ t('common.seeAll') }} ({{ pendientes.length }})</span>
      <span>→</span>
    </NuxtLink>
  </section>
</template>
