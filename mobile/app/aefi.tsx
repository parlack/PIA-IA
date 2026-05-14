/**
 * Screen Eventos adversos (AEFI).
 */
import { DashboardShell } from '@/components/domain/dashboard/DashboardShell'
import { HeroExpediente } from '@/components/domain/dashboard/HeroExpediente'
import { AefiSection } from '@/components/domain/AefiSection'
import { useDashboardData } from '@/hooks/useDashboardData'

export default function AefiScreen() {
  const { usuario, curp } = useDashboardData()

  return (
    <DashboardShell>
      <HeroExpediente
        usuario={usuario}
        curp={curp}
        eyebrow="Farmacovigilancia"
        titulo="Eventos"
        tituloItalic="adversos."
      />
      {curp ? <AefiSection curp={curp} /> : null}
    </DashboardShell>
  )
}
