<script setup lang="ts">
definePageMeta({ middleware: 'ciudadano' })
useHead({ title: 'Eventos adversos (AEFI)' })

const { t } = useI18n()
const {
  curp,
  resumen,
  usuario,
  historialDetalle,
} = useDashboardData()
</script>

<template>
  <DashboardShell>
    <HeroExpediente
      :usuario="usuario"
      :curp="curp"
      :has-resumen="resumen.length > 0"
      :titulo="t('aefi.title')"
      :titulo-italic="t('aefi.titleItalic')"
      :eyebrow="t('aefi.eyebrow')"
    />

    <AefiSection :curp="curp" :historial="historialDetalle" />
  </DashboardShell>
</template>
