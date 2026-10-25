import {
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
  useFonts,
} from '@expo-google-fonts/geist'
import { QueryClientProvider } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { StyleSheet } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import '@/global.css'
import { queryClient } from '@/shared/api/query-client'
import { AuthRedirect } from '@/shared/session/auth-redirect'
import { useSession } from '@/shared/session/store'
import { GluestackUIProvider } from '@/shared/ui/gluestack-ui-provider'
import { ErrorState, LoadingView, Screen } from '@/shared/ui/kit'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Geist: Geist_400Regular,
    'Geist-Medium': Geist_500Medium,
    'Geist-SemiBold': Geist_600SemiBold,
    'Geist-Bold': Geist_700Bold,
  })

  const status = useSession((state) => state.status)
  const bootstrap = useSession((state) => state.bootstrap)
  const bootstrapError = useSession((state) => state.bootstrapError)

  useEffect(() => {
    void bootstrap()
  }, [bootstrap])

  const isReady = (fontsLoaded || fontError) && status !== 'loading'

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync()
    }
  }, [isReady])

  if (!fontsLoaded && !fontError) {
    return null
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <GluestackUIProvider mode="system">
          <QueryClientProvider client={queryClient}>
            <StatusBar style="auto" />
            {status === 'error' ? (
              <Screen>
                <ErrorState
                  title="Не удалось восстановить сессию"
                  message={
                    bootstrapError ?? 'Проверьте соединение и повторите.'
                  }
                  onRetry={() => {
                    void bootstrap()
                  }}
                />
              </Screen>
            ) : isReady ? (
              <>
                <AuthRedirect />
                <Stack screenOptions={{ headerShown: false }} />
              </>
            ) : (
              <LoadingView label="Проверка сессии…" />
            )}
          </QueryClientProvider>
        </GluestackUIProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

// GestureHandlerRootView is the native gesture root and accepts a style prop.
// Keep its required flex outside the themed layout components it contains.
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
})
