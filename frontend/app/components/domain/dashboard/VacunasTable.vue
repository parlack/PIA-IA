<script setup lang="ts">
import type { ResumenRow } from '~/composables/useDashboardData'

const props = defineProps<{
  resumen: ResumenRow[]
  /** Si false, oculta el input de busqueda (modo embed compacto). */
  searchable?: boolean
  /** Titulo opcional override. */
  titulo?: string
}>()

const { t } = useI18n()

const filtroBusqueda = ref('')

const resumenFiltrado = computed(() => {
  const q = filtroBusqueda.value.trim().toLowerCase()
  if (!q) return props.resumen
  return props.resumen.filter(v => v.nombre.toLowerCase().includes(q))
})

function fmtDate(s: string | null) {
  if (!s) return '—'
  const d = new Date(s.includes('T') ? s : `${s}T12:00:00`)
  return Number.isNaN(d.getTime())
    ? s
    : d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>

<template>
  <section class="mb-14">
    <div
      class="flex items-baseline justify-between border-b pb-2 mb-5 gap-4 flex-wrap"
      style="border-color: var(--ink)"
    >
      <h2 class="font-display text-2xl" style="font-weight: 500">
        {{ titulo ?? t('dashboard.allTitle') }}
      </h2>
      <div class="flex items-center gap-3">
        <input
          v-if="searchable !== false"
          v-model="filtroBusqueda"
          type="text"
          :placeholder="t('dashboard.searchPlaceholder')"
          class="text-sm py-1 px-2 border-b focus:outline-none transition-colors"
          style="background: transparent; border-color: var(--border); min-width: 160px"
          @focus="(e: any) => e.target.style.borderColor = 'var(--ink)'"
          @blur="(e: any) => e.target.style.borderColor = 'var(--border)'"
        />
        <p class="eyebrow">
          {{ resumenFiltrado.length }} {{ t('dashboard.resultsLabel') }}
        </p>
      </div>
    </div>

    <table class="w-full">
      <thead>
        <tr>
          <th class="text-left eyebrow pb-3 pr-4">{{ t('dashboard.colVaccine') }}</th>
          <th class="text-center eyebrow pb-3 px-2 hidden sm:table-cell">
            {{ t('dashboard.colDoses') }}
          </th>
          <th class="text-left eyebrow pb-3 px-2 hidden md:table-cell">
            {{ t('dashboard.colLastApplied') }}
          </th>
          <th class="text-right eyebrow pb-3 pl-4">{{ t('dashboard.colStatus') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!resumenFiltrado.length">
          <td colspan="4" class="py-12 text-center text-sm" style="color: var(--muted)">
            {{ t('dashboard.noResults') }}<span v-if="filtroBusqueda">: "{{ filtroBusqueda }}"</span>
          </td>
        </tr>
        <tr
          v-for="(v, i) in resumenFiltrado"
          :key="v.vacuna_id"
          :style="i < resumenFiltrado.length - 1 ? 'border-bottom: 1px solid var(--border-soft)' : ''"
        >
          <td class="py-3.5 pr-4">
            <span style="font-weight: 500">{{ v.nombre }}</span>
            <p
              class="sm:hidden text-xs mt-0.5 tabular"
              style="color: var(--muted)"
            >
              {{ v.dosis_aplicadas }}/{{ v.dosis_total }} · {{ fmtDate(v.ultima_fecha) }}
            </p>
          </td>
          <td
            class="py-3.5 px-2 text-center font-mono text-sm tabular hidden sm:table-cell"
            style="color: var(--muted)"
          >
            {{ v.dosis_aplicadas }}/{{ v.dosis_total }}
          </td>
          <td
            class="py-3.5 px-2 text-sm tabular hidden md:table-cell"
            style="color: var(--muted)"
          >
            {{ fmtDate(v.ultima_fecha) }}
          </td>
          <td class="py-3.5 pl-4 text-right">
            <span
              class="text-[10px] uppercase font-mono tracking-wider inline-flex items-center gap-1.5"
              :style="v.completa ? 'color: var(--moss)' : 'color: var(--muted)'"
            >
              <span :style="v.completa ? 'color: var(--moss)' : 'color: var(--muted-2)'">●</span>
              {{ v.completa ? t('dashboard.complete') : t('dashboard.pending') }}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
