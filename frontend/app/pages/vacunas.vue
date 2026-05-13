<script setup lang="ts">
definePageMeta({ middleware: 'ciudadano' })
useHead({ title: 'Mis vacunas' })

const { t } = useI18n()
const {
  curp,
  resumen,
  usuario,
  pendientes,
} = useDashboardData()
</script>

<template>
  <DashboardShell>
    <HeroExpediente
      :usuario="usuario"
      :curp="curp"
      :has-resumen="resumen.length > 0"
      :titulo="t('vacunas.title')"
      :titulo-italic="t('vacunas.titleItalic')"
      :eyebrow="t('vacunas.eyebrow')"
    />

    <PendientesList :pendientes="pendientes" />

    <VacunasTable :resumen="resumen" />
  </DashboardShell>
</template>
