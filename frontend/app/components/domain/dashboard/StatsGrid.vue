<script setup lang="ts">
const props = defineProps<{
  completadas: number
  totalVacunas: number
  pendientes: number
  porcentaje: number
  noLeidos: number
}>()

const { t } = useI18n()

const colorBarra = computed(() => {
  if (props.porcentaje === 100) return 'var(--moss)'
  if (props.porcentaje >= 60)   return 'var(--ochre)'
  return 'var(--wine)'
})
</script>

<template>
  <section class="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-8 mb-14">
    <div>
      <p class="eyebrow">{{ t('dashboard.statComplete') }}</p>
      <p class="font-display text-5xl lg:text-6xl mt-2 tabular" style="font-weight: 400">
        {{ completadas }}
      </p>
      <p class="text-xs mt-1" style="color: var(--muted)">
        {{ t('common.of') }} {{ totalVacunas }} {{ t('dashboard.statCompleteOf') }}
      </p>
    </div>

    <div>
      <p class="eyebrow">{{ t('dashboard.statPending') }}</p>
      <p
        class="font-display text-5xl lg:text-6xl mt-2 tabular"
        :style="pendientes ? 'color: var(--wine); font-weight: 400' : 'font-weight: 400'"
      >
        {{ pendientes }}
      </p>
      <p class="text-xs mt-1" style="color: var(--muted)">
        {{ t('dashboard.statPendingHint') }}
      </p>
    </div>

    <div>
      <p class="eyebrow">{{ t('dashboard.statScheme') }}</p>
      <p class="font-display text-5xl lg:text-6xl mt-2 tabular" style="font-weight: 400">
        {{ porcentaje }}<span class="text-2xl align-top" style="color: var(--muted)">%</span>
      </p>
      <div class="w-full h-[3px] mt-3" style="background: var(--bone)">
        <div
          class="h-[3px] transition-all duration-1000"
          :style="`width: ${porcentaje}%; background: ${colorBarra}`"
        />
      </div>
      <p class="text-xs mt-1 tabular" style="color: var(--muted)">
        {{ completadas }}/{{ totalVacunas }} {{ t('dashboard.statSchemeVacc') }}
      </p>
    </div>

    <div>
      <p class="eyebrow">{{ t('dashboard.statInbox') }}</p>
      <p class="font-display text-5xl lg:text-6xl mt-2 tabular" style="font-weight: 400">
        {{ noLeidos }}
      </p>
      <p class="text-xs mt-1" style="color: var(--muted)">
        {{ noLeidos === 1 ? t('dashboard.statInboxOne') : t('dashboard.statInboxMany') }}
      </p>
    </div>
  </section>
</template>
