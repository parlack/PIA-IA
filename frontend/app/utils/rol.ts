/** Coincide con rol en BD (administrador) o valor ya canónico (admin). */
export function esRolAdmin(r: string | null | undefined): boolean {
  const x = (r || '').toLowerCase().trim()
  return (
    x === 'admin'
    || x === 'administrador'
    || x === 'administradora'
    || x === 'administrator'
  )
}

export function normalizarRolParaStorage(r: string | null | undefined): string {
  return esRolAdmin(r) ? 'admin' : ((r || 'usuario').toLowerCase().trim() || 'usuario')
}
