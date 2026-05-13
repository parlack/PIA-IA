<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

const api = useApi()

const cargando        = ref(true)
const vacunasMes      = ref<Array<{ mes: string; dosis: number }>>([])
const cobEstado       = ref<Array<{ estado: string; usuarios: number; dosis: number }>>([])
const cobVacuna       = ref<Array<{ nombre: string; cobertura_pct: number; usuarios_con_al_menos_una: number }>>([])
const cobGrupo        = ref<Array<{ grupo: string; usuarios: number; dosis: number }>>([])

async function recargar() {
  cargando.value = true
  try {
    const [m, e, v, g] = await Promise.all([
      api.reporteVacunasPorMes(12),
      api.reporteCoberturaEstado(),
      api.reporteCoberturaVacuna(),
      api.reporteCoberturaGrupo(),
    ])
    vacunasMes.value = (m as any[]) || []
    cobEstado.value  = (e as any[]) || []
    cobVacuna.value  = ((v as any[]) || []).slice().sort((a, b) => b.cobertura_pct - a.cobertura_pct).slice(0, 10)
    cobGrupo.value   = ((g as any[]) || []).filter(r => r.grupo)
  } catch (e) {
    console.error(e)
  } finally {
    cargando.value = false
  }
}

onMounted(recargar)

// --- Linea temporal (SVG) ---
const lineaW = 720
const lineaH = 220
const linea = computed(() => {
  const data = vacunasMes.value
  if (!data.length) return { points: '', area: '', max: 0, ticks: [] as string[], cy: [] as number[], cx: [] as number[] }
  const max = Math.max(...data.map(d => d.dosis), 1)
  const padX = 36
  const padY = 24
  const innerW = lineaW - padX * 2
  const innerH = lineaH - padY * 2
  const step = data.length > 1 ? innerW / (data.length - 1) : 0
  const cx: number[] = []
  const cy: number[] = []
  data.forEach((d, i) => {
    cx.push(padX + step * i)
    cy.push(padY + innerH - (d.dosis / max) * innerH)
  })
  const points = cx.map((x, i) => `${x},${cy[i]}`).join(' ')
  const area = `M${padX},${padY + innerH} L${points
    .split(' ')
    .map((p) => p)
    .join(' L')} L${padX + step * (data.length - 1)},${padY + innerH} Z`
  const ticks = [0, Math.round(max / 2), max]
  return { points, area, max, ticks, cx, cy }
})

// --- Barras horizontales reutilizables ---
function pct(value: number, max: number): number {
  if (!max) return 0
  return Math.max(0, Math.min(100, (value / max) * 100))
}

const maxEstado  = computed(() => Math.max(1, ...cobEstado.value.map(r => r.dosis)))
const maxVacuna  = computed(() => Math.max(1, ...cobVacuna.value.map(r => r.cobertura_pct)))
const maxGrupo   = computed(() => Math.max(1, ...cobGrupo.value.map(r => r.usuarios)))
const totalGrupo = computed(() => cobGrupo.value.reduce((s, r) => s + r.usuarios, 0))

function shortMes(m: string): string {
  // 'YYYY-MM' -> 'mmm yy'
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  const [y, mm] = m.split('-')
  return `${meses[parseInt(mm, 10) - 1] || mm} ${y.slice(2)}`
}

function labelGrupo(g: string): string {
  const map: Record<string, string> = {
    ninguno: 'Sin grupo',
    embarazada: 'Embarazadas',
    adulto_mayor: 'Adulto mayor',
    inmunocomprometido: 'Inmunocomp.',
    cronico: 'Cronicos',
  }
  return map[g] || g
}
</script>

<template>
  <section class="space-y-14">

    <!-- Header -->
    <div class="flex items-baseline justify-between border-b pb-2" style="border-color: var(--ink)">
      <h2 class="font-display text-2xl" style="font-weight: 500">Dashboard epidemiologico</h2>
      <button type="button" class="btn-ghost text-xs" @click="recargar">Recargar</button>
    </div>

    <p v-if="cargando" class="text-sm" style="color: var(--muted)">Cargando datos…</p>

    <template v-else>
      <!-- Linea temporal -->
      <div>
        <p class="eyebrow mb-3">01 · Dosis aplicadas por mes (ultimos 12)</p>
        <div class="border-t pt-6 pb-2" style="border-color: var(--border)">
          <svg :viewBox="`0 0 ${lineaW} ${lineaH}`" class="w-full h-auto" preserveAspectRatio="xMidYMid meet">
            <!-- ejes guia -->
            <g v-for="(t, i) in linea.ticks" :key="i">
              <line :x1="36" :x2="lineaW - 36"
                    :y1="24 + (lineaH - 48) * (1 - i / (linea.ticks.length - 1))"
                    :y2="24 + (lineaH - 48) * (1 - i / (linea.ticks.length - 1))"
                    stroke="var(--border-soft)" stroke-dasharray="2 4" stroke-width="1" />
              <text :x="6"
                    :y="24 + (lineaH - 48) * (1 - i / (linea.ticks.length - 1)) + 4"
                    font-family="JetBrains Mono, monospace" font-size="10"
                    fill="var(--muted)">{{ t }}</text>
            </g>
            <!-- area + linea -->
            <path :d="linea.area" fill="var(--moss)" opacity="0.08" />
            <polyline :points="linea.points" fill="none" stroke="var(--moss)" stroke-width="1.5" />
            <g v-for="(_, i) in linea.cx" :key="i">
              <circle :cx="linea.cx[i]" :cy="linea.cy[i]" r="3" fill="var(--paper)" stroke="var(--moss)" stroke-width="1.5" />
            </g>
            <!-- labels x -->
            <g v-for="(d, i) in vacunasMes" :key="`x-${i}`">
              <text :x="linea.cx[i]" :y="lineaH - 4" text-anchor="middle"
                    font-family="JetBrains Mono, monospace" font-size="9"
                    fill="var(--muted)">{{ shortMes(d.mes) }}</text>
            </g>
          </svg>
          <p v-if="!vacunasMes.length" class="text-sm py-12 text-center" style="color: var(--muted)">
            Sin registros en el periodo.
          </p>
        </div>
      </div>

      <!-- Cobertura por estado -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div>
          <p class="eyebrow mb-3">02 · Cobertura por estado</p>
          <div class="border-t pt-4" style="border-color: var(--border)">
            <div v-if="!cobEstado.length" class="py-8 text-sm" style="color: var(--muted)">Sin datos.</div>
            <div v-for="(r, i) in cobEstado" :key="r.estado" class="py-2.5"
                 :style="i < cobEstado.length - 1 ? 'border-bottom: 1px dotted var(--border)' : ''">
              <div class="flex items-baseline justify-between mb-1.5">
                <p class="text-sm" style="font-weight: 500">{{ r.estado }}</p>
                <p class="font-mono text-xs tabular" style="color: var(--muted)">
                  {{ r.dosis }} dosis · {{ r.usuarios }} usr
                </p>
              </div>
              <div class="h-[3px]" style="background: var(--bone)">
                <div class="h-[3px]" :style="`width: ${pct(r.dosis, maxEstado)}%; background: var(--ink)`" />
              </div>
            </div>
          </div>
        </div>

        <!-- Top vacunas por cobertura -->
        <div>
          <p class="eyebrow mb-3">03 · Top 10 vacunas (cobertura %)</p>
          <div class="border-t pt-4" style="border-color: var(--border)">
            <div v-if="!cobVacuna.length" class="py-8 text-sm" style="color: var(--muted)">Sin datos.</div>
            <div v-for="(r, i) in cobVacuna" :key="r.nombre" class="py-2.5"
                 :style="i < cobVacuna.length - 1 ? 'border-bottom: 1px dotted var(--border)' : ''">
              <div class="flex items-baseline justify-between mb-1.5">
                <p class="text-sm truncate pr-3" style="font-weight: 500">{{ r.nombre }}</p>
                <p class="font-mono text-xs tabular" style="font-weight: 500">{{ r.cobertura_pct }}%</p>
              </div>
              <div class="h-[3px]" style="background: var(--bone)">
                <div class="h-[3px]"
                     :style="`width: ${pct(r.cobertura_pct, maxVacuna)}%; background: ${r.cobertura_pct >= 80 ? 'var(--moss)' : r.cobertura_pct >= 50 ? 'var(--ochre)' : 'var(--wine)'}`" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Grupos prioritarios -->
      <div>
        <p class="eyebrow mb-3">04 · Distribucion por grupo prioritario</p>
        <div class="border-t pt-6" style="border-color: var(--border)">
          <div v-if="!cobGrupo.length" class="py-8 text-sm" style="color: var(--muted)">Sin datos.</div>
          <div v-else class="grid grid-cols-2 lg:grid-cols-5 gap-6">
            <div v-for="r in cobGrupo" :key="r.grupo">
              <p class="eyebrow text-[10px]">{{ labelGrupo(r.grupo) }}</p>
              <p class="font-display text-3xl mt-1.5 tabular" style="font-weight: 400">{{ r.usuarios }}</p>
              <div class="h-[3px] mt-2" style="background: var(--bone)">
                <div class="h-[3px]" :style="`width: ${pct(r.usuarios, maxGrupo)}%; background: var(--moss)`" />
              </div>
              <p class="font-mono text-[10px] mt-1.5" style="color: var(--muted)">
                {{ totalGrupo ? Math.round(100 * r.usuarios / totalGrupo) : 0 }}% del total · {{ r.dosis }} dosis
              </p>
            </div>
          </div>
        </div>
      </div>

    </template>
  </section>
</template>
