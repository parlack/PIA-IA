/**
 * Screen Dependientes (cuidadores).
 * Solo accesible para sesion autenticada (no anonimos).
 */
import { useEffect, useState } from 'react'
import { View } from 'react-native'

import { DashboardShell } from '@/components/domain/dashboard/DashboardShell'
import { HeroExpediente } from '@/components/domain/dashboard/HeroExpediente'
import { DependientesSection } from '@/components/domain/DependientesSection'
import { Text } from '@/components/ui/Text'
import { useDashboardData } from '@/hooks/useDashboardData'
import { sessionStore } from '@/hooks/useSession'
import { spacing } from '@/theme'

export default function DependientesScreen() {
  const { usuario, curp } = useDashboardData()
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    sessionStore.isAuthenticated().then(setAuthed)
  }, [])

  return (
    <DashboardShell>
      <HeroExpediente
        usuario={usuario}
        curp={curp}
        eyebrow="A mi cargo"
        titulo="Mis"
        tituloItalic="dependientes."
      />

      {authed && curp ? (
        <DependientesSection curp={curp} />
      ) : (
        <View style={{ paddingVertical: spacing.xxl, alignItems: 'center' }}>
          <Text variant="h3" italic color="muted" style={{ textAlign: 'center' }}>
            Inicia sesion con contrasena para gestionar dependientes.
          </Text>
        </View>
      )}
    </DashboardShell>
  )
}
