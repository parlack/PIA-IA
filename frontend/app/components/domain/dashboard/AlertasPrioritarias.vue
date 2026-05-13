<script setup lang="ts">
import type { AlertaRow } from '~/composables/useDashboardData'

defineProps<{
  alertas: AlertaRow[]
}>()

const { t } = useI18n()
</script>

<template>
  <div
    v-if="alertas.length"
    class="mb-10 p-6 border-l-4"
    style="background: rgba(180,83,9,0.06); border-color: var(--ochre)"
  >
    <p class="eyebrow" style="color: var(--ochre)">{{ t('dashboard.priorityWarn') }}</p>
    <h3 class="font-display text-xl mt-2" style="font-weight: 500">
      {{ alertas.length }}
      {{ alertas.length === 1 ? t('dashboard.priorityOne') : t('dashboard.priorityMany') }}
    </h3>
    <div class="mt-4 flex flex-wrap gap-x-5 gap-y-1.5">
      <span
        v-for="a in alertas"
        :key="a.vacuna_id"
        class="text-sm flex items-baseline gap-1.5"
      >
        <span class="font-mono text-[10px]" style="color: var(--ochre)">●</span>
        <span style="font-weight: 500">{{ a.nombre }}</span>
        <span class="font-mono text-xs" style="color: var(--muted)">({{ a.dosis_faltantes }})</span>
      </span>
    </div>
  </div>
</template>
