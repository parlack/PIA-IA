/**
 * Screen Mensajes (buzon completo).
 */
import { DashboardShell } from '@/components/domain/dashboard/DashboardShell'
import { HeroExpediente } from '@/components/domain/dashboard/HeroExpediente'
import { MensajesList } from '@/components/domain/dashboard/MensajesList'
import { useDashboardData } from '@/hooks/useDashboardData'

export default function MensajesScreen() {
  const { usuario, curp, mensajes } = useDashboardData()

  return (
    <DashboardShell>
      <HeroExpediente
        usuario={usuario}
        curp={curp}
        eyebrow="Buzon"
        titulo="Mensajes y"
        tituloItalic="avisos."
      />
      <MensajesList mensajes={mensajes} />
    </DashboardShell>
  )
}
