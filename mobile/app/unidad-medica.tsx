/**
 * Screen Unidad medica (UMF y datos clinicos administrativos).
 */
import { DashboardShell } from '@/components/domain/dashboard/DashboardShell'
import { HeroExpediente } from '@/components/domain/dashboard/HeroExpediente'
import { UnidadMedicaCard } from '@/components/domain/dashboard/UnidadMedicaCard'
import { useDashboardData } from '@/hooks/useDashboardData'

export default function UnidadMedicaScreen() {
  const { usuario, curp } = useDashboardData()

  return (
    <DashboardShell>
      <HeroExpediente
        usuario={usuario}
        curp={curp}
        eyebrow="Mi unidad"
        titulo="Unidad"
        tituloItalic="medica."
      />
      <UnidadMedicaCard usuario={usuario} />
    </DashboardShell>
  )
}
