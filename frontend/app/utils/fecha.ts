export function fmtFecha(s: string | null | undefined): string {
  if (!s) return '—'
  const d = new Date(s.includes('T') ? s : `${s}T12:00:00`)
  if (Number.isNaN(d.getTime())) return s
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function fmtFechaLarga(s: string | null | undefined): string {
  if (!s) return '—'
  const d = new Date(s.includes('T') ? s : `${s}T12:00:00`)
  if (Number.isNaN(d.getTime())) return s
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
}

export function fechaHoyCapitalizada(): string {
  return new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
