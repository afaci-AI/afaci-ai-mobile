import { router } from 'expo-router'

import { EmptyState, Header, Screen } from '@/shared/ui/kit'

export default function OptimizationScreen() {
  return (
    <Screen>
      <Header
        title="Оптимизация"
        onBack={() => {
          if (router.canGoBack()) router.back()
          else router.replace('/(tabs)/saved')
        }}
      />
      <EmptyState
        title="Этот раздел ещё в разработке."
        description="Оптимизация скоро появится."
      />
    </Screen>
  )
}
