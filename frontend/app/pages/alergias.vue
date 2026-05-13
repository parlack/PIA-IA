<script setup lang="ts">
definePageMeta({ middleware: 'ciudadano' })
useHead({ title: 'Alergias y contraindicaciones' })

const { t } = useI18n()
const {
  curp,
  resumen,
  usuario,
  isAuthed,
} = useDashboardData()
</script>

<template>
  <DashboardShell>
    <HeroExpediente
      :usuario="usuario"
      :curp="curp"
      :has-resumen="resumen.length > 0"
      :titulo="t('alergias.title')"
      :titulo-italic="t('alergias.titleItalic')"
      :eyebrow="t('alergias.eyebrow')"
    />

    <AlergiasSection :curp="curp" :editable="isAuthed()" />
  </DashboardShell>
</template>
