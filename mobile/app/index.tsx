import { useEffect } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { sessionStore } from '@/hooks/useSession'
import { colors } from '@/theme'

export default function Index() {
  useEffect(() => {
    (async () => {
      const auth = await sessionStore.isAuthenticated()
      const basic = await sessionStore.isBasicSession()
      const noReg = await sessionStore.isNoRegistrado()
      if (auth || basic || noReg) {
        router.replace('/dashboard')
      } else {
        router.replace('/login')
      }
    })()
  }, [])

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper }}>
      <ActivityIndicator color={colors.moss} />
    </View>
  )
}
