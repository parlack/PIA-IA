import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import * as SplashScreen from 'expo-splash-screen'
import { useFonts } from 'expo-font'

import { ToastProvider } from '@/components/ui/Toast'
import { DashboardDataProvider } from '@/hooks/useDashboardData'

import {
  Fraunces_400Regular,
  Fraunces_500Medium,
  Fraunces_600SemiBold,
  Fraunces_400Regular_Italic,
  Fraunces_600SemiBold_Italic,
} from '@expo-google-fonts/fraunces'
import {
  IBMPlexSans_400Regular,
  IBMPlexSans_500Medium,
  IBMPlexSans_600SemiBold,
} from '@expo-google-fonts/ibm-plex-sans'
import {
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
} from '@expo-google-fonts/ibm-plex-mono'

import { colors } from '@/theme'

SplashScreen.preventAutoHideAsync().catch(() => {})

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Fraunces':                  Fraunces_400Regular,
    'Fraunces-Medium':           Fraunces_500Medium,
    'Fraunces-SemiBold':         Fraunces_600SemiBold,
    'Fraunces-Italic':           Fraunces_400Regular_Italic,
    'Fraunces-SemiBoldItalic':   Fraunces_600SemiBold_Italic,
    'IBMPlexSans':               IBMPlexSans_400Regular,
    'IBMPlexSans-Medium':        IBMPlexSans_500Medium,
    'IBMPlexSans-SemiBold':      IBMPlexSans_600SemiBold,
    'IBMPlexMono':               IBMPlexMono_400Regular,
    'IBMPlexMono-Medium':        IBMPlexMono_500Medium,
  })

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {})
    }
  }, [fontsLoaded, fontError])

  if (!fontsLoaded && !fontError) {
    return null
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ToastProvider>
          <DashboardDataProvider>
            <StatusBar style="dark" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.paper },
                animation: 'fade',
              }}
            />
          </DashboardDataProvider>
        </ToastProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
