<script setup lang="ts">
definePageMeta({ middleware: 'ciudadano' })
useHead({ title: 'Mi unidad medica' })

const { t } = useI18n()
const {
  curp,
  resumen,
  usuario,
} = useDashboardData()
</script>

<template>
  <DashboardShell>
    <HeroExpediente
      :usuario="usuario"
      :curp="curp"
      :has-resumen="resumen.length > 0"
      :titulo="t('unidadMedica.title')"
      :titulo-italic="t('unidadMedica.titleItalic')"
      :eyebrow="t('unidadMedica.eyebrow')"
    />

    <UnidadMedicaCard :usuario="usuario" />
  </DashboardShell>
</template>
