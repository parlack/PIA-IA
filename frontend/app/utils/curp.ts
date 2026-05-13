export const CURP_REGEX = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/

export function normalizarCurp(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 18)
}

export function esCurpValida(curp: string): boolean {
  return CURP_REGEX.test(curp)
}

export function splitNombreCompleto(full: string): {
  nombre: string
  apellido_paterno: string
  apellido_materno: string
} {
  const parts = full.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { nombre: '', apellido_paterno: '', apellido_materno: '' }
  if (parts.length === 1) return { nombre: parts[0] ?? '', apellido_paterno: '', apellido_materno: '' }
  if (parts.length === 2) return { nombre: parts[0] ?? '', apellido_paterno: parts[1] ?? '', apellido_materno: '' }
  return {
    nombre: parts[0] ?? '',
    apellido_paterno: parts[1] ?? '',
    apellido_materno: parts.slice(2).join(' '),
  }
}
