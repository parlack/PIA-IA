<script setup lang="ts">
defineProps<{
  height?: string
  width?: string
  rounded?: boolean
}>()
</script>

<template>
  <div
    class="skeleton-shimmer"
    :style="`height: ${height || '1rem'}; width: ${width || '100%'}; border-radius: ${rounded ? '2px' : '0'}`"
  />
</template>

<style scoped>
.skeleton-shimmer {
  position: relative;
  overflow: hidden;
  background: var(--bone);
  display: block;
}
.skeleton-shimmer::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.55) 50%,
    transparent 100%
  );
  transform: translateX(-100%);
  animation: shimmer 1.6s infinite;
}
@keyframes shimmer {
  to { transform: translateX(100%); }
}
</style>
