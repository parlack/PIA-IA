/**
 * Genera el HTML imprimible de la cartilla y abre la ventana de impresion.
 * Usado por la accion "Imprimir" del hero del expediente.
 */
import type { ResumenRow, UsuarioMe } from '~/composables/useDashboardData'

const grupoLabel: Record<string, string> = {
  adulto_mayor:   'Adulto mayor',
  embarazada:     'Embarazada',
  personal_salud: 'Personal de salud',
  cronico:        'Cronico',
}

function fmtDate(s: string | null) {
  if (!s) return '—'
  const d = new Date(s.includes('T') ? s : `${s}T12:00:00`)
  return Number.isNaN(d.getTime())
    ? s
    : d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

export const useCartillaExport = () => {
  function imprimir(usuario: UsuarioMe | null, resumen: ResumenRow[]) {
    if (!usuario || !resumen.length) return
    const u = usuario
    const nombreCompleto = [u.nombre, u.apellido_paterno, u.apellido_materno].filter(Boolean).join(' ')
    const hoy = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })

    const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><title>Cartilla — ${nombreCompleto}</title>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'IBM Plex Sans',sans-serif;padding:48px;color:#1C1B17;background:#F5F1E8;font-size:13px;line-height:1.55}
  .h{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #1C1B17;padding-bottom:18px;margin-bottom:32px}
  .h h1{font-family:Fraunces,serif;font-size:36px;font-weight:500;letter-spacing:-0.02em;line-height:1}
  .h .sub{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#6B6A60;margin-top:6px}
  .meta{font-family:'IBM Plex Mono',monospace;font-size:11px;text-align:right;letter-spacing:0.08em}
  .meta p{margin-bottom:4px}
  .section-label{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#6B6A60;margin-bottom:14px;padding-bottom:8px;border-bottom:1px solid #DDD3BD}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:18px 32px;margin-bottom:38px}
  .field{padding-bottom:10px;border-bottom:1px dotted #DDD3BD}
  .field label{font-family:'IBM Plex Mono',monospace;font-size:9px;color:#8B8073;text-transform:uppercase;letter-spacing:0.12em;display:block;margin-bottom:4px}
  .field p{font-size:14px;font-weight:500}
  .badge{display:inline-block;padding:2px 8px;font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:0.12em;text-transform:uppercase;background:#D4E4D9;color:#082E20;border:1px solid #0E5037}
  table{width:100%;border-collapse:collapse;margin-top:14px}
  th{text-align:left;font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#6B6A60;padding:10px 12px;border-bottom:2px solid #1C1B17}
  td{padding:11px 12px;border-bottom:1px solid #DDD3BD;font-size:13px}
  tr:hover td{background:#FAF7F0}
  .ok{color:#0E5037;font-weight:500}
  .pend{color:#991B1B}
  .f{margin-top:48px;padding-top:18px;border-top:1px solid #DDD3BD;font-family:'IBM Plex Mono',monospace;font-size:10px;color:#8B8073;letter-spacing:0.08em;text-align:center}
  @media print{body{padding:20px}}
</style></head><body>
<div class="h">
  <div>
    <p class="sub">Sistema Nacional de Inmunizacion</p>
    <h1>Cartilla de Vacunacion</h1>
  </div>
  <div class="meta">
    <p>Emision · ${hoy}</p>
    <p>CURP · ${u.curp}</p>
  </div>
</div>

<p class="section-label">Datos del asegurado</p>
<div class="grid">
  <div class="field"><label>Nombre</label><p>${nombreCompleto}</p></div>
  <div class="field"><label>NSS</label><p>${u.nss || '—'}</p></div>
  <div class="field"><label>Correo</label><p>${u.correo || '—'}</p></div>
  <div class="field"><label>Telefono</label><p>${u.celular || '—'}</p></div>
  <div class="field"><label>Unidad medica</label><p>${u.unidad_nombre || '—'}</p></div>
  <div class="field"><label>Medico familiar</label><p>${u.medico_familiar || '—'}</p></div>
  ${u.grupo_prioritario && u.grupo_prioritario !== 'ninguno' ? `<div class="field" style="grid-column:1/3"><label>Grupo prioritario</label><p><span class="badge">${grupoLabel[u.grupo_prioritario] || u.grupo_prioritario}</span></p></div>` : ''}
</div>

<p class="section-label">Esquema de vacunacion</p>
<table>
  <thead><tr><th>Vacuna</th><th style="text-align:center">Dosis</th><th>Ultima aplicacion</th><th style="text-align:right">Estado</th></tr></thead>
  <tbody>${resumen.map(v => `<tr><td><strong>${v.nombre}</strong></td><td style="text-align:center" class="tabular">${v.dosis_aplicadas}/${v.dosis_total}</td><td>${v.ultima_fecha ? fmtDate(v.ultima_fecha) : '—'}</td><td style="text-align:right" class="${v.completa ? 'ok' : 'pend'}">${v.completa ? '● Completa' : '○ Pendiente'}</td></tr>`).join('')}</tbody>
</table>

<div class="f">Documento generado electronicamente · PIA-IA · © ${new Date().getFullYear()}</div>
</body></html>`

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const win = window.open(url, '_blank')
    if (win) win.onload = () => setTimeout(() => win.print(), 500)
  }

  return { imprimir }
}
