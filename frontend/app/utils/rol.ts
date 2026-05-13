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

/** Coincide con rol médico en BD (medico, medica, doctor, doctora). */
export function esRolMedico(r: string | null | undefined): boolean {
  const x = (r || '').toLowerCase().trim()
  return (
    x === 'medico'
    || x === 'medica'
    || x === 'doctor'
    || x === 'doctora'
    || x === 'md'
  )
}

/** True si el rol requiere login con contraseña (admin o medico). */
export function esRolPrivilegiado(r: string | null | undefined): boolean {
  return esRolAdmin(r) || esRolMedico(r)
}

/** Ruta destino según el rol del usuario autenticado. */
export function rutaPorRol(r: string | null | undefined): string {
  if (esRolAdmin(r)) return '/admin'
  if (esRolMedico(r)) return '/medico'
  return '/dashboard'
}

export function normalizarRolParaStorage(r: string | null | undefined): string {
  if (esRolAdmin(r)) return 'admin'
  if (esRolMedico(r)) return 'medico'
  return (r || 'usuario').toLowerCase().trim() || 'usuario'
}
