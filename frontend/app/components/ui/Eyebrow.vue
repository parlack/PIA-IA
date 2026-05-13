<script setup lang="ts">
defineProps<{ color?: string }>()
</script>

<template>
  <p class="eyebrow" :style="color ? `color: ${color}` : ''">
    <slot />
  </p>
</template>
