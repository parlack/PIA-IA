<script setup lang="ts">
definePageMeta({ middleware: 'ciudadano' })
useHead({ title: 'Buzon de mensajes' })

const { t } = useI18n()
const {
  curp,
  resumen,
  usuario,
  mensajes,
  eliminarMensajeLocal,
  marcarLeidoLocal,
} = useDashboardData()
</script>

<template>
  <DashboardShell>
    <HeroExpediente
      :usuario="usuario"
      :curp="curp"
      :has-resumen="resumen.length > 0"
      :titulo="t('mensajes.title')"
      :titulo-italic="t('mensajes.titleItalic')"
      :eyebrow="t('mensajes.eyebrow')"
    />

    <MensajesList
      :mensajes="mensajes"
      @eliminar="eliminarMensajeLocal"
      @marcar-leido="marcarLeidoLocal"
    />
  </DashboardShell>
</template>
