export const CURP_REGEX = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/

export function normalizarCurp(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 18)
}

export function esCurpValida(curp: string): boolean {
  return CURP_REGEX.test(curp)
}
