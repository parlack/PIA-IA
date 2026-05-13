/**
 * Middleware de rol ciudadano.
 *
 * Aplicar en paginas con definePageMeta({ middleware: 'ciudadano' }).
 *
 * Reglas:
 *  - Sin sesion -> /login.
 *  - Si el rol es admin -> /admin (las cuentas administrativas no acceden al expediente personal del ciudadano).
 */
import { esRolAdmin, normalizarRolParaStorage } from '~/utils/rol'

export default defineNuxtRouteMiddleware(() => {
  if (import.meta.server) return
  if (typeof localStorage === 'undefined') return

  const curp = localStorage.getItem('curp')
  if (!curp) {
    return navigateTo('/login')
  }

  const rol = normalizarRolParaStorage(localStorage.getItem('rol'))
  if (esRolAdmin(rol)) {
    return navigateTo('/admin')
  }
})
