<script setup lang="ts">
/**
 * Iconos del menu lateral. SVG inline, estilo lineal monocromatico
 * para alinear con la estetica editorial del proyecto.
 *
 * Uso:
 *   <NavIcon name="vaccines" />
 *
 * Cualquier nombre no listado renderiza un placeholder circular.
 */
defineProps<{
  name:
    | 'summary'
    | 'vaccines'
    | 'allergies'
    | 'aefi'
    | 'inbox'
    | 'dependents'
    | 'medical-unit'
    | 'my-info'
    | 'admin'
  size?: number
}>()
</script>

<template>
  <svg
    :width="size ?? 18"
    :height="size ?? 18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <!-- summary: documento/cartilla -->
    <template v-if="name === 'summary'">
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M15 3v4h4" />
      <path d="M9 12h7" />
      <path d="M9 16h5" />
    </template>

    <!-- vaccines: jeringa -->
    <template v-else-if="name === 'vaccines'">
      <path d="M16.5 4.5L20 8" />
      <path d="M14 7l3 3" />
      <path d="M13 8l-7 7v3h3l7-7z" />
      <path d="M9.5 14.5l2 2" />
    </template>

    <!-- allergies: triangulo de alerta -->
    <template v-else-if="name === 'allergies'">
      <path d="M12 3l10 17H2z" />
      <path d="M12 10v5" />
      <circle cx="12" cy="17.5" r="0.6" fill="currentColor" />
    </template>

    <!-- aefi: corazon medico -->
    <template v-else-if="name === 'aefi'">
      <path d="M12 21s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 11c0 5.5-7 10-7 10z" />
      <path d="M9.5 11h2v-2h1v2h2v1h-2v2h-1v-2h-2z" fill="currentColor" stroke="none" />
    </template>

    <!-- inbox: sobre -->
    <template v-else-if="name === 'inbox'">
      <rect x="3" y="6" width="18" height="13" rx="1" />
      <path d="M3 7l9 7 9-7" />
    </template>

    <!-- dependents: dos personas -->
    <template v-else-if="name === 'dependents'">
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3 3-5 6-5s6 2 6 5" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M14 20c0-2 2-3.5 4-3.5 1.5 0 3 1 3 3" />
    </template>

    <!-- medical-unit: hospital -->
    <template v-else-if="name === 'medical-unit'">
      <rect x="3" y="9" width="18" height="12" />
      <path d="M9 9V3h6v6" />
      <path d="M11 14h2v2h2v-2h2v-2h-2v-2h-2v2h-2z" fill="currentColor" stroke="none" />
    </template>

    <!-- my-info: usuario -->
    <template v-else-if="name === 'my-info'">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </template>

    <!-- admin: engranaje -->
    <template v-else-if="name === 'admin'">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
    </template>

    <!-- fallback -->
    <template v-else>
      <circle cx="12" cy="12" r="6" />
    </template>
  </svg>
</template>
