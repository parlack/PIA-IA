<script setup lang="ts">
import Skeleton from '~/components/ui/Skeleton.vue'
</script>

<template>
  <div>
    <!-- Header editorial -->
    <header class="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 mb-10 border-b-2"
            style="border-color: var(--ink)">
      <div class="space-y-3 flex-1">
        <Skeleton width="14rem" height="0.7rem" />
        <Skeleton width="28rem" height="3rem" />
        <Skeleton width="22rem" height="3rem" />
        <Skeleton width="12rem" height="0.85rem" />
      </div>
      <div class="flex flex-col lg:items-end gap-3">
        <Skeleton width="10rem" height="1.5rem" />
        <Skeleton width="14rem" height="0.85rem" />
      </div>
    </header>

    <!-- Stats grandes -->
    <section class="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-8 mb-14">
      <div v-for="i in 4" :key="i" class="space-y-3">
        <Skeleton width="6rem" height="0.65rem" />
        <Skeleton width="5rem" height="3.5rem" />
        <Skeleton width="8rem" height="0.7rem" />
      </div>
    </section>

    <!-- Pendientes -->
    <section class="mb-14">
      <div class="flex items-baseline justify-between border-b pb-2 mb-5" style="border-color: var(--ink)">
        <Skeleton width="12rem" height="1.6rem" />
        <Skeleton width="6rem" height="0.7rem" />
      </div>
      <div class="space-y-4">
        <div v-for="i in 4" :key="i" class="flex items-baseline justify-between py-3"
             style="border-bottom: 1px dotted var(--border)">
          <div class="flex items-baseline gap-4 flex-1">
            <Skeleton width="1.5rem" height="0.7rem" />
            <div class="flex-1 space-y-2">
              <Skeleton width="14rem" height="1rem" />
              <Skeleton width="9rem" height="0.7rem" />
            </div>
          </div>
          <Skeleton width="5rem" height="0.7rem" />
        </div>
      </div>
    </section>

    <!-- Tabla vacunas -->
    <section class="mb-14">
      <div class="flex items-baseline justify-between border-b pb-2 mb-5" style="border-color: var(--ink)">
        <Skeleton width="14rem" height="1.6rem" />
        <Skeleton width="10rem" height="1.5rem" />
      </div>
      <div class="space-y-3">
        <div v-for="i in 6" :key="i"
             class="flex items-baseline justify-between py-3"
             style="border-bottom: 1px solid var(--border-soft)">
          <Skeleton width="40%" height="1rem" />
          <div class="flex items-baseline gap-8">
            <Skeleton width="3rem" height="0.85rem" />
            <Skeleton width="6rem" height="0.85rem" />
            <Skeleton width="5rem" height="0.85rem" />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
