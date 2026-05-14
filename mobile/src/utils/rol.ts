/** Coincide con rol en BD (administrador) o valor ya canonico (admin). */
export function esRolAdmin(r: string | null | undefined): boolean {
  const x = (r || '').toLowerCase().trim()
  return (
    x === 'admin'
    || x === 'administrador'
    || x === 'administradora'
    || x === 'administrator'
  )
}

/** Coincide con rol medico en BD (medico, medica, doctor, doctora). */
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

/** True si el rol requiere login con contrasena obligatoria (admin o medico). */
export function esRolPrivilegiado(r: string | null | undefined): boolean {
  return esRolAdmin(r) || esRolMedico(r)
}

/** Ruta destino segun el rol del usuario autenticado. */
export function rutaPorRol(r: string | null | undefined): '/admin' | '/medico' | '/inicio' {
  if (esRolAdmin(r)) return '/admin'
  if (esRolMedico(r)) return '/medico'
  return '/inicio'
}

export function normalizarRolParaStorage(r: string | null | undefined): string {
  if (esRolAdmin(r)) return 'admin'
  if (esRolMedico(r)) return 'medico'
  return (r || 'usuario').toLowerCase().trim() || 'usuario'
}
