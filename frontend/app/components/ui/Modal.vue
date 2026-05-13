<script setup lang="ts">
defineProps<{
  open: boolean
  title?: string
  maxWidth?: string
  dismissible?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center px-4"
        style="background-color: rgba(28, 27, 23, 0.55)"
        @click.self="dismissible !== false && emit('close')"
      >
        <div
          class="surface w-full overflow-hidden"
          :style="`max-width: ${maxWidth || '32rem'}`"
        >
          <header
            v-if="title"
            class="flex items-start justify-between gap-4 px-6 pt-6 pb-3"
            style="border-bottom: 1px solid var(--bone)"
          >
            <h2 class="font-display text-2xl" style="font-weight: 400">{{ title }}</h2>
            <button
              v-if="dismissible !== false"
              type="button"
              class="text-xs uppercase tracking-widest"
              style="color: var(--muted); letter-spacing: 0.15em"
              @click="emit('close')"
            >
              cerrar
            </button>
          </header>
          <div class="px-6 py-5">
            <slot />
          </div>
          <footer v-if="$slots.footer" class="px-6 pt-3 pb-6" style="border-top: 1px solid var(--bone)">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease-out;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
