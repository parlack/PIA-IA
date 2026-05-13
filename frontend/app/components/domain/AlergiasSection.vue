<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Swal from 'sweetalert2'

const props = defineProps<{
  curp: string
  editable: boolean
}>()

type Alergia = {
  id: number
  sustancia: string
  severidad: string
  observaciones: string | null
  creado_en: string
}

type Contraindicacion = {
  id: number
  descripcion: string
  vacuna_id: number | null
  vacuna_nombre: string | null
  permanente: number
  creado_en: string
}

const alergias = ref<Alergia[]>([])
const contraindicaciones = ref<Contraindicacion[]>([])
const cargando = ref(true)

const colorSeveridad: Record<string, string> = {
  leve: 'var(--moss)',
  moderada: 'var(--ochre)',
  severa: 'var(--wine)',
  anafilaxia: 'var(--wine)',
}

async function recargar() {
  cargando.value = true
  try {
    const api = useApi()
    const data = await api.getAlergias(props.curp)
    alergias.value = data.alergias as Alergia[]
    contraindicaciones.value = data.contraindicaciones as Contraindicacion[]
  } catch (e: any) {
    console.error(e)
  } finally {
    cargando.value = false
  }
}

async function agregarAlergia() {
  const { value: formValues } = await Swal.fire({
    title: 'Nueva alergia',
    html: `
      <input id="sus" class="swal2-input" placeholder="Sustancia (ej. Penicilina)" />
      <select id="sev" class="swal2-input">
        <option value="leve">Leve</option>
        <option value="moderada">Moderada</option>
        <option value="severa">Severa</option>
        <option value="anafilaxia">Anafilaxia</option>
      </select>
      <textarea id="obs" class="swal2-textarea" placeholder="Observaciones (opcional)"></textarea>
    `,
    showCancelButton: true,
    confirmButtonColor: '#0E5037',
    cancelButtonColor: '#6B6A60',
    confirmButtonText: 'Guardar',
    cancelButtonText: 'Cancelar',
    preConfirm: () => {
      const sus = (document.getElementById('sus') as HTMLInputElement).value.trim()
      const sev = (document.getElementById('sev') as HTMLSelectElement).value
      const obs = (document.getElementById('obs') as HTMLTextAreaElement).value.trim()
      if (!sus) {
        Swal.showValidationMessage('La sustancia es obligatoria')
        return false
      }
      return { sustancia: sus, severidad: sev, observaciones: obs || undefined }
    },
  })
  if (!formValues) return
  try {
    await useApi().crearAlergia({ curp: props.curp, ...formValues })
    await recargar()
  } catch (e: any) {
    await Swal.fire({ icon: 'error', title: 'Error', text: e.message, confirmButtonColor: '#0E5037' })
  }
}

async function eliminarAlergia(id: number) {
  const r = await Swal.fire({
    title: '¿Eliminar alergia?', icon: 'warning',
    showCancelButton: true, confirmButtonColor: '#991B1B', cancelButtonColor: '#6B6A60',
    confirmButtonText: 'Eliminar', cancelButtonText: 'Cancelar',
  })
  if (!r.isConfirmed) return
  try {
    await useApi().deleteAlergia(id)
    await recargar()
  } catch (e: any) {
    await Swal.fire({ icon: 'error', title: 'Error', text: e.message, confirmButtonColor: '#0E5037' })
  }
}

async function agregarContraindicacion() {
  const { value: formValues } = await Swal.fire({
    title: 'Nueva contraindicacion',
    html: `
      <textarea id="desc" class="swal2-textarea" placeholder="Describe la contraindicacion..."></textarea>
      <label style="display:flex; align-items:center; gap:6px; margin-top:8px; justify-content:center; font-size:13px"><input type="checkbox" id="perm"/> Es permanente</label>
    `,
    showCancelButton: true,
    confirmButtonColor: '#0E5037',
    cancelButtonColor: '#6B6A60',
    preConfirm: () => {
      const d = (document.getElementById('desc') as HTMLTextAreaElement).value.trim()
      const p = (document.getElementById('perm') as HTMLInputElement).checked
      if (d.length < 3) {
        Swal.showValidationMessage('Describe la contraindicacion (min. 3 caracteres).')
        return false
      }
      return { descripcion: d, permanente: p }
    },
  })
  if (!formValues) return
  try {
    await useApi().crearContraindicacion({ curp: props.curp, ...formValues })
    await recargar()
  } catch (e: any) {
    await Swal.fire({ icon: 'error', title: 'Error', text: e.message, confirmButtonColor: '#0E5037' })
  }
}

async function eliminarContraindicacion(id: number) {
  const r = await Swal.fire({
    title: '¿Eliminar contraindicacion?', icon: 'warning',
    showCancelButton: true, confirmButtonColor: '#991B1B',
    cancelButtonColor: '#6B6A60',
    confirmButtonText: 'Eliminar', cancelButtonText: 'Cancelar',
  })
  if (!r.isConfirmed) return
  try {
    await useApi().deleteContraindicacion(id)
    await recargar()
  } catch (e: any) {
    await Swal.fire({ icon: 'error', title: 'Error', text: e.message, confirmButtonColor: '#0E5037' })
  }
}

onMounted(recargar)
</script>

<template>
  <section class="mb-14">
    <div class="flex items-baseline justify-between border-b pb-2 mb-5 gap-4 flex-wrap" style="border-color: var(--ink)">
      <h2 class="font-display text-2xl" style="font-weight: 500">Alergias y contraindicaciones</h2>
      <div v-if="editable" class="flex items-center gap-3">
        <button type="button" class="btn-ghost text-xs" @click="agregarAlergia">+ Alergia</button>
        <button type="button" class="btn-ghost text-xs" @click="agregarContraindicacion">+ Contraindicacion</button>
      </div>
    </div>

    <div v-if="cargando" class="py-6 text-sm" style="color: var(--muted)">Cargando…</div>

    <template v-else>
      <div v-if="!alergias.length && !contraindicaciones.length" class="py-8 text-center">
        <p class="font-display text-lg italic" style="color: var(--muted); font-weight: 300">
          Sin alergias ni contraindicaciones registradas.
        </p>
      </div>

      <div v-if="alergias.length" class="mb-8">
        <p class="eyebrow mb-3">Alergias</p>
        <div v-for="(a, i) in alergias" :key="a.id"
             class="flex items-baseline justify-between py-3"
             :style="i < alergias.length - 1 ? 'border-bottom: 1px dotted var(--border)' : ''">
          <div class="flex-1 min-w-0">
            <p style="font-weight: 500">{{ a.sustancia }}</p>
            <p v-if="a.observaciones" class="text-xs mt-0.5" style="color: var(--muted)">{{ a.observaciones }}</p>
          </div>
          <span class="font-mono text-[10px] uppercase tracking-wider mx-3"
                :style="`color: ${colorSeveridad[a.severidad] || 'var(--muted)'}`">
            {{ a.severidad }}
          </span>
          <button v-if="editable" type="button" class="text-xs"
                  style="color: var(--wine); font-family: var(--font-mono); letter-spacing: 0.08em"
                  @click="eliminarAlergia(a.id)">
            eliminar
          </button>
        </div>
      </div>

      <div v-if="contraindicaciones.length">
        <p class="eyebrow mb-3">Contraindicaciones</p>
        <div v-for="(c, i) in contraindicaciones" :key="c.id"
             class="flex items-baseline justify-between py-3 gap-3"
             :style="i < contraindicaciones.length - 1 ? 'border-bottom: 1px dotted var(--border)' : ''">
          <div class="flex-1 min-w-0">
            <p class="text-sm" style="font-weight: 500">{{ c.descripcion }}</p>
            <p class="text-xs mt-0.5" style="color: var(--muted)">
              <span v-if="c.vacuna_nombre">Vacuna: {{ c.vacuna_nombre }} · </span>
              <span v-if="c.permanente">permanente</span>
              <span v-else>temporal</span>
            </p>
          </div>
          <button v-if="editable" type="button" class="text-xs"
                  style="color: var(--wine); font-family: var(--font-mono); letter-spacing: 0.08em"
                  @click="eliminarContraindicacion(c.id)">
            eliminar
          </button>
        </div>
      </div>
    </template>
  </section>
</template>
