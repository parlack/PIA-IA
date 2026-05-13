<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Swal from 'sweetalert2'

const props = defineProps<{
  curp: string
  historial: any[]
}>()

const dosisReportables = ref<any[]>([])
const ventanaDias = ref(30)

type Reporte = {
  id: number
  dosis_id: number
  sintomas: string
  severidad: string
  inicio_minutos: number | null
  vacuna_nombre: string
  fecha_aplicacion: string
  creado_en: string
}

const reportes = ref<Reporte[]>([])
const cargando = ref(true)

const colorSev: Record<string, string> = {
  leve: 'var(--moss)',
  moderada: 'var(--ochre)',
  severa: 'var(--wine)',
  grave: 'var(--wine)',
}

async function recargar() {
  cargando.value = true
  try {
    const api = useApi()
    const [r, dr] = await Promise.all([
      api.getAefiUsuario(props.curp),
      api.getAefiDosisReportables(props.curp),
    ])
    reportes.value = r as Reporte[]
    dosisReportables.value = dr.dosis || []
    ventanaDias.value = dr.ventana_dias || 30
  } catch (e) {
    console.error(e)
  } finally {
    cargando.value = false
  }
}

async function reportar() {
  if (!dosisReportables.value.length) {
    await Swal.fire({
      icon: 'info',
      title: 'No hay dosis elegibles',
      html: `Solo se pueden reportar reacciones adversas dentro de los <b>${ventanaDias.value} dias</b> posteriores a la aplicacion de una dosis. <br/><br/>Ninguna de tus dosis registradas cae dentro de esa ventana.`,
      confirmButtonColor: '#0E5037',
    })
    return
  }

  const opts = dosisReportables.value
    .map((d) => `<option value="${d.id}">${d.vacuna_nombre} (dosis ${d.numero_dosis}) — aplicada hace ${d.dias_transcurridos} dia${d.dias_transcurridos === 1 ? '' : 's'}</option>`)
    .join('')

  const { value: form } = await Swal.fire({
    title: 'Reportar reaccion (AEFI)',
    html: `
      <select id="dosis" class="swal2-input">${opts}</select>
      <textarea id="sint" class="swal2-textarea" placeholder="Describe los sintomas..."></textarea>
      <select id="sev" class="swal2-input">
        <option value="leve">Leve</option>
        <option value="moderada">Moderada</option>
        <option value="severa">Severa</option>
        <option value="grave">Grave</option>
      </select>
      <input id="ini" type="number" class="swal2-input" placeholder="Inicio (minutos despues de la dosis)" />
      <label style="display:flex; align-items:center; gap:6px; margin-top:8px; justify-content:center; font-size:13px">
        <input type="checkbox" id="seg"/> Requiere seguimiento medico
      </label>
    `,
    showCancelButton: true,
    confirmButtonColor: '#0E5037',
    cancelButtonColor: '#6B6A60',
    preConfirm: () => {
      const dosis = parseInt((document.getElementById('dosis') as HTMLSelectElement).value)
      const sint = (document.getElementById('sint') as HTMLTextAreaElement).value.trim()
      const sev = (document.getElementById('sev') as HTMLSelectElement).value
      const ini = (document.getElementById('ini') as HTMLInputElement).value
      const seg = (document.getElementById('seg') as HTMLInputElement).checked
      if (sint.length < 3) { Swal.showValidationMessage('Describe los sintomas'); return false }
      return {
        dosis_id: dosis,
        sintomas: sint,
        severidad: sev,
        inicio_minutos: ini ? parseInt(ini) : undefined,
        requiere_seguimiento: seg,
      }
    },
  })
  if (!form) return
  try {
    await useApi().reportarAefi(form)
    await Swal.fire({ icon: 'success', title: 'Reporte registrado',
      text: 'Tu reporte ayuda a mejorar la seguridad del esquema.',
      confirmButtonColor: '#0E5037', timer: 2200 })
    await recargar()
  } catch (e: any) {
    await Swal.fire({ icon: 'error', title: 'Error', text: e.message, confirmButtonColor: '#0E5037' })
  }
}

onMounted(recargar)
</script>

<template>
  <section class="mb-14">
    <div class="flex items-baseline justify-between border-b pb-2 mb-5" style="border-color: var(--ink)">
      <h2 class="font-display text-2xl" style="font-weight: 500">Eventos adversos</h2>
      <button type="button" class="btn-ghost text-xs" @click="reportar">+ Reportar</button>
    </div>

    <p class="text-sm mb-2" style="color: var(--muted)">
      Si has experimentado algun efecto adverso despues de una vacuna, reportalo aqui.
      Tus reportes contribuyen a la farmacovigilancia.
    </p>
    <p class="text-xs mb-4 font-mono" style="color: var(--muted); letter-spacing: 0.06em">
      Ventana de reporte: dentro de los {{ ventanaDias }} dias posteriores a la dosis.
      <span v-if="!cargando && dosisReportables.length"> · {{ dosisReportables.length }} dosis elegible{{ dosisReportables.length === 1 ? '' : 's' }} ahora.</span>
    </p>

    <div v-if="cargando" class="py-6 text-sm" style="color: var(--muted)">Cargando…</div>
    <div v-else-if="!reportes.length" class="py-8 text-center">
      <p class="font-display text-lg italic" style="color: var(--muted); font-weight: 300">
        Sin reportes previos.
      </p>
    </div>
    <div v-else>
      <div v-for="(r, i) in reportes" :key="r.id"
           class="py-4"
           :style="i < reportes.length - 1 ? 'border-bottom: 1px dotted var(--border)' : ''">
        <div class="flex items-baseline justify-between gap-3">
          <p style="font-weight: 500">{{ r.vacuna_nombre }}</p>
          <span class="font-mono text-[10px] uppercase tracking-wider"
                :style="`color: ${colorSev[r.severidad] || 'var(--muted)'}`">
            {{ r.severidad }}
          </span>
        </div>
        <p class="text-xs mt-1" style="color: var(--muted)">
          Dosis del {{ r.fecha_aplicacion }} · reportado el {{ r.creado_en.split(' ')[0] }}
          <span v-if="r.inicio_minutos != null"> · inicio +{{ r.inicio_minutos }} min</span>
        </p>
        <p class="text-sm mt-2">{{ r.sintomas }}</p>
      </div>
    </div>
  </section>
</template>
