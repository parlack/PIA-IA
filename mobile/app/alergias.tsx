/**
 * Screen Alergias y contraindicaciones.
 */
import { DashboardShell } from '@/components/domain/dashboard/DashboardShell'
import { HeroExpediente } from '@/components/domain/dashboard/HeroExpediente'
import { AlergiasSection } from '@/components/domain/AlergiasSection'
import { useDashboardData } from '@/hooks/useDashboardData'

export default function AlergiasScreen() {
  const { usuario, curp } = useDashboardData()

  return (
    <DashboardShell>
      <HeroExpediente
        usuario={usuario}
        curp={curp}
        eyebrow="Cuidados"
        titulo="Alergias y"
        tituloItalic="reacciones."
      />
      {curp ? <AlergiasSection curp={curp} editable /> : null}
    </DashboardShell>
  )
}
