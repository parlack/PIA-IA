<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Swal from 'sweetalert2'
import QrPersonalModal from '@/components/domain/QrPersonalModal.vue'

const props = defineProps<{
  curp: string
}>()

type Dependiente = {
  id: number
  curp: string
  nombre: string
  apellido_paterno: string
  apellido_materno: string | null
  grupo_prioritario: string
  relacion: string
  fecha_nacimiento: string | null
}

const items = ref<Dependiente[]>([])
const cargando = ref(true)
const qrDependiente = ref<Dependiente | null>(null)

async function recargar() {
  cargando.value = true
  try {
    items.value = await useApi().getDependientes(props.curp) as Dependiente[]
  } catch (e) {
    console.error(e)
  } finally {
    cargando.value = false
  }
}

async function agregar() {
  const { value: formValues } = await Swal.fire({
    title: 'Agregar dependiente',
    html: `
      <input id="dcurp" class="swal2-input" placeholder="CURP del dependiente" maxlength="18"/>
      <input id="rel" class="swal2-input" placeholder="Relacion (ej. madre, hijo, esposo)" />
    `,
    showCancelButton: true,
    confirmButtonColor: '#0E5037',
    cancelButtonColor: '#6B6A60',
    preConfirm: () => {
      const d = (document.getElementById('dcurp') as HTMLInputElement).value.trim().toUpperCase()
      const r = (document.getElementById('rel') as HTMLInputElement).value.trim()
      if (d.length !== 18) { Swal.showValidationMessage('CURP invalida'); return false }
      if (!r) { Swal.showValidationMessage('Indica la relacion'); return false }
      return { curp_dependiente: d, relacion: r }
    },
  })
  if (!formValues) return
  try {
    await useApi().agregarDependiente({ curp_cuidador: props.curp, ...formValues })
    await recargar()
  } catch (e: any) {
    await Swal.fire({ icon: 'error', title: 'Error', text: e.message, confirmButtonColor: '#0E5037' })
  }
}

async function eliminar(id: number) {
  const r = await Swal.fire({
    title: '¿Eliminar relacion?', icon: 'warning',
    showCancelButton: true, confirmButtonColor: '#991B1B',
    cancelButtonColor: '#6B6A60',
    confirmButtonText: 'Eliminar', cancelButtonText: 'Cancelar',
  })
  if (!r.isConfirmed) return
  await useApi().eliminarDependiente(id)
  await recargar()
}

const grupoLabel: Record<string, string> = {
  adulto_mayor: 'Adulto mayor',
  embarazada: 'Embarazada',
  personal_salud: 'Personal de salud',
  cronico: 'Cronico',
}

onMounted(recargar)
</script>

<template>
  <section class="mb-14">
    <div class="flex items-baseline justify-between border-b pb-2 mb-5" style="border-color: var(--ink)">
      <h2 class="font-display text-2xl" style="font-weight: 500">A mi cargo</h2>
      <button type="button" class="btn-ghost text-xs" @click="agregar">+ Dependiente</button>
    </div>

    <p class="text-sm mb-4" style="color: var(--muted)">
      Gestiona la cartilla de familiares a tu cuidado (adultos mayores, ninos, dependientes).
    </p>

    <div v-if="cargando" class="py-6 text-sm" style="color: var(--muted)">Cargando…</div>
    <div v-else-if="!items.length" class="py-8 text-center">
      <p class="font-display text-lg italic" style="color: var(--muted); font-weight: 300">
        Aun no tienes dependientes vinculados.
      </p>
    </div>
    <div v-else>
      <div v-for="(d, i) in items" :key="d.id"
           class="flex items-baseline justify-between gap-4 py-4"
           :style="i < items.length - 1 ? 'border-bottom: 1px dotted var(--border)' : ''">
        <div class="flex-1 min-w-0">
          <p style="font-weight: 500">{{ d.nombre }} {{ d.apellido_paterno }} {{ d.apellido_materno }}</p>
          <p class="text-xs mt-0.5" style="color: var(--muted)">
            <span class="font-mono uppercase tracking-wider">{{ d.relacion }}</span>
            <span v-if="grupoLabel[d.grupo_prioritario]"> · {{ grupoLabel[d.grupo_prioritario] }}</span>
            · CURP {{ d.curp }}
          </p>
        </div>
        <div class="flex flex-col items-end gap-1.5 text-xs"
             style="font-family: var(--font-mono); letter-spacing: 0.08em">
          <button type="button"
                  style="color: var(--moss)"
                  @click="qrDependiente = d">
            ver qr
          </button>
          <button type="button"
                  style="color: var(--wine)"
                  @click="eliminar(d.id)">
            desvincular
          </button>
        </div>
      </div>
    </div>

    <QrPersonalModal
      v-if="qrDependiente"
      :open="!!qrDependiente"
      :curp="qrDependiente.curp"
      :nombre="`${qrDependiente.nombre} ${qrDependiente.apellido_paterno}`"
      @close="qrDependiente = null"
    />
  </section>
</template>
