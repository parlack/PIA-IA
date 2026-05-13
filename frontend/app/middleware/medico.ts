/**
 * Middleware de rol medico.
 *
 * Aplicar en paginas con definePageMeta({ middleware: 'medico' }).
 *
 * Reglas:
 *  - Sin sesion -> /login.
 *  - Sesion en modo consulta rapida (auth=false) -> /login (se exige password).
 *  - Sesion sin rol medico -> ruta por rol (admin -> /admin, ciudadano -> /dashboard).
 *
 * Solo corre en cliente porque el rol vive en localStorage.
 */
import { esRolMedico, normalizarRolParaStorage, rutaPorRol } from '~/utils/rol'

export default defineNuxtRouteMiddleware(() => {
  if (import.meta.server) return
  if (typeof localStorage === 'undefined') return

  const curp = localStorage.getItem('curp')
  if (!curp) {
    return navigateTo('/login')
  }

  const auth = localStorage.getItem('auth')
  if (auth !== 'true') {
    return navigateTo('/login')
  }

  const rol = normalizarRolParaStorage(localStorage.getItem('rol'))
  if (!esRolMedico(rol)) {
    return navigateTo(rutaPorRol(rol))
  }
})
