/**
 * Middleware global de autenticacion.
 *
 * Reglas:
 *  - Rutas publicas (login, verificar/[token], index) NO requieren sesion.
 *  - Si ya hay sesion y el usuario va a /login o /, se redirige a su panel
 *    (admin -> /admin, medico -> /medico, ciudadano -> /dashboard).
 *  - El resto de rutas exige `curp` en localStorage; si no existe -> /login.
 *
 * Solo corre en cliente porque la sesion se persiste en localStorage.
 */
import { rutaPorRol as rutaPorRolUtil } from '~/utils/rol'

const RUTAS_PUBLICAS = new Set<string>(['/login', '/'])

function esRutaPublica(path: string): boolean {
  if (RUTAS_PUBLICAS.has(path)) return true
  if (path.startsWith('/verificar/')) return true
  return false
}

export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return
  if (typeof localStorage === 'undefined') return

  const curp = localStorage.getItem('curp')

  if (to.path === '/login' || to.path === '/') {
    if (curp) {
      const destino = rutaPorRolUtil(localStorage.getItem('rol'))
      if (to.path !== destino) return navigateTo(destino)
    }
    return
  }

  if (esRutaPublica(to.path)) return

  if (!curp) {
    return navigateTo('/login')
  }
})
