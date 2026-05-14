/**
 * Compatibilidad: la pantalla del ciudadano vive ahora en el grupo (tabs).
 * Redirigimos a /inicio para no romper llamadas existentes a router.push('/dashboard').
 */
import { Redirect } from 'expo-router'

export default function DashboardRedirect() {
  return <Redirect href="/inicio" />
}
